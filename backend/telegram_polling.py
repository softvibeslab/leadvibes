"""Ingesta de updates de Telegram vía long polling (getUpdates).

Alternativa a los webhooks, pensada para entornos sin URL pública HTTPS
(local/dev/preview) y para evitar los timeouts/reintentos de Telegram cuando el
procesamiento del agente tarda más que la ventana del webhook.

Se activa con TELEGRAM_UPDATE_MODE=polling (default: webhook, sin cambios de
comportamiento). Al activarse:

- Corre un loop getUpdates por cada bot activo: el bot principal ROVI y cada
  perfil de `telegram_agent_profiles` con token configurado.
- Antes de empezar a poll-ear hace deleteWebhook (Telegram no permite webhook y
  getUpdates a la vez para el mismo token).
- Cada update se despacha al MISMO pipeline que usan los webhooks (idempotencia
  por update_id incluida), así que webhook y polling son intercambiables.
- El offset confirmado se persiste en `telegram_polling_state` para no
  reprocesar tras un reinicio.

IMPORTANTE: Telegram solo permite UN consumidor getUpdates por token. Habilita
polling en una sola instancia/entorno por bot token; si dos entornos comparten
token, Telegram responde 409 Conflict (el loop lo reporta y reintenta).
"""

from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable

logger = logging.getLogger(__name__)
# En producción el root logger queda en WARNING (otro módulo llama basicConfig
# antes que server.py), lo que ocultaba las líneas INFO de este módulo. Handler
# propio para que el ciclo de vida del polling siempre sea visible en docker logs.
if not logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter("%(levelname)s:%(name)s:%(message)s"))
    logger.addHandler(_handler)
    logger.setLevel(logging.INFO)
    logger.propagate = False

TELEGRAM_API_BASE = "https://api.telegram.org"

RoviDispatch = Callable[[dict], Awaitable[Any]]
ProfileDispatch = Callable[[str, dict], Awaitable[Any]]


def get_telegram_update_mode() -> str:
    return (os.environ.get("TELEGRAM_UPDATE_MODE") or "webhook").strip().lower()


class TelegramConflictError(Exception):
    """409 de Telegram: otro getUpdates o un webhook sigue activo para el token."""


class TelegramPollingManager:
    """Supervisa un loop de long polling por bot activo.

    Las llamadas HTTP a Telegram y el despacho de updates están aislados en
    métodos/callables inyectables para poder testear el manager sin red ni Mongo.
    """

    def __init__(
        self,
        db,
        *,
        rovi_token_getter: Callable[[], str],
        rovi_dispatch: RoviDispatch,
        profile_dispatch: ProfileDispatch,
        poll_timeout_seconds: int | None = None,
        profiles_refresh_seconds: float | None = None,
    ) -> None:
        self.db = db
        self.rovi_token_getter = rovi_token_getter
        self.rovi_dispatch = rovi_dispatch
        self.profile_dispatch = profile_dispatch
        self.poll_timeout_seconds = poll_timeout_seconds or int(
            os.environ.get("TELEGRAM_POLLING_TIMEOUT_SECONDS", "30")
        )
        self.profiles_refresh_seconds = profiles_refresh_seconds or float(
            os.environ.get("TELEGRAM_POLLING_PROFILES_REFRESH_SECONDS", "60")
        )
        self._supervisor_task: asyncio.Task | None = None
        # bot_key -> {"task": asyncio.Task, "token": str}
        self._loops: dict[str, dict] = {}
        self._stopping = False

    # ------------------------------------------------------------------
    # Ciclo de vida
    # ------------------------------------------------------------------

    @property
    def is_running(self) -> bool:
        return self._supervisor_task is not None and not self._supervisor_task.done()

    async def start(self) -> None:
        mode = get_telegram_update_mode()
        if mode != "polling":
            logger.info(
                "Telegram polling deshabilitado (TELEGRAM_UPDATE_MODE=%s)", mode
            )
            return
        if self.is_running:
            return
        self._stopping = False
        self._supervisor_task = asyncio.create_task(
            self._supervisor(), name="telegram-polling-supervisor"
        )
        logger.info(
            "Telegram polling habilitado (timeout=%ss, refresh perfiles=%ss)",
            self.poll_timeout_seconds,
            self.profiles_refresh_seconds,
        )

    async def stop(self) -> None:
        self._stopping = True
        tasks: list[asyncio.Task] = []
        if self._supervisor_task is not None:
            self._supervisor_task.cancel()
            tasks.append(self._supervisor_task)
            self._supervisor_task = None
        for state in self._loops.values():
            task = state.get("task")
            if task is not None:
                task.cancel()
                tasks.append(task)
        self._loops.clear()
        for task in tasks:
            try:
                await task
            except (asyncio.CancelledError, Exception):
                pass

    # ------------------------------------------------------------------
    # Supervisor: descubre bots activos y mantiene un loop por cada uno
    # ------------------------------------------------------------------

    async def _supervisor(self) -> None:
        while not self._stopping:
            try:
                desired = await self._discover_bots()
                self._reconcile_loops(desired)
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("Error refrescando bots para Telegram polling")
            await asyncio.sleep(self.profiles_refresh_seconds)

    async def _discover_bots(self) -> dict[str, dict]:
        """Devuelve bot_key -> {token, dispatch} para todos los bots activos."""
        desired: dict[str, dict] = {}
        rovi_token = (self.rovi_token_getter() or "").strip()
        if rovi_token:
            desired["rovi-agent"] = {
                "token": rovi_token,
                "dispatch": self.rovi_dispatch,
            }
        try:
            cursor = self.db.telegram_agent_profiles.find(
                {"is_active": True, "telegram_bot_token": {"$nin": [None, ""]}},
                {"_id": 0, "id": 1, "telegram_bot_token": 1, "name": 1},
            )
            profiles = await cursor.to_list(500)
        except Exception:
            logger.exception("No pude leer telegram_agent_profiles para polling")
            profiles = []
        for profile in profiles:
            profile_id = profile.get("id")
            token = (profile.get("telegram_bot_token") or "").strip()
            if not profile_id or not token:
                continue
            if token == rovi_token:
                # El bot principal ya tiene loop propio; dos consumidores del
                # mismo token provocarían 409 en Telegram.
                continue
            dispatch = self._make_profile_dispatch(profile_id)
            desired[f"profile:{profile_id}"] = {"token": token, "dispatch": dispatch}
        return desired

    def _make_profile_dispatch(self, profile_id: str) -> RoviDispatch:
        async def dispatch(update: dict) -> Any:
            return await self.profile_dispatch(profile_id, update)

        return dispatch

    def _reconcile_loops(self, desired: dict[str, dict]) -> None:
        # Detener loops de bots que ya no existen o cambiaron de token
        for bot_key in list(self._loops.keys()):
            current = self._loops[bot_key]
            wanted = desired.get(bot_key)
            task: asyncio.Task | None = current.get("task")
            task_dead = task is None or task.done()
            if wanted is None or wanted["token"] != current["token"] or task_dead:
                if task is not None and not task.done():
                    task.cancel()
                del self._loops[bot_key]
        # Arrancar loops nuevos
        for bot_key, spec in desired.items():
            if bot_key in self._loops:
                continue
            task = asyncio.create_task(
                self._poll_loop(bot_key, spec["token"], spec["dispatch"]),
                name=f"telegram-polling:{bot_key}",
            )
            self._loops[bot_key] = {"task": task, "token": spec["token"]}
            logger.info("Telegram polling iniciado para %s", bot_key)

    # ------------------------------------------------------------------
    # Loop de polling por bot
    # ------------------------------------------------------------------

    async def _poll_loop(
        self, bot_key: str, token: str, dispatch: RoviDispatch
    ) -> None:
        try:
            await self._telegram_delete_webhook(token)
        except Exception:
            logger.exception(
                "deleteWebhook falló para %s (continúo con getUpdates)", bot_key
            )
        offset = await self._load_offset(bot_key)
        backoff = 1.0
        while not self._stopping:
            try:
                updates = await self._telegram_get_updates(token, offset)
                backoff = 1.0
            except asyncio.CancelledError:
                raise
            except TelegramConflictError:
                logger.warning(
                    "409 de Telegram para %s: otro consumidor usa este token (¿webhook activo "
                    "u otra instancia en polling?). Reintento deleteWebhook.",
                    bot_key,
                )
                try:
                    await self._telegram_delete_webhook(token)
                except Exception:
                    pass
                await asyncio.sleep(min(backoff, 30.0))
                backoff = min(backoff * 2, 30.0)
                continue
            except Exception as exc:
                logger.warning(
                    "getUpdates falló para %s: %s (reintento en %.0fs)",
                    bot_key,
                    exc,
                    backoff,
                )
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 30.0)
                continue

            for update in updates:
                update_id = update.get("update_id")
                try:
                    await dispatch(update)
                except asyncio.CancelledError:
                    raise
                except Exception:
                    # El update queda registrado en logs; avanzamos el offset para
                    # no bloquear la cola entera por un mensaje problemático.
                    logger.exception(
                        "Error despachando update %s de %s", update_id, bot_key
                    )
                if isinstance(update_id, int):
                    offset = max(offset or 0, update_id + 1)
            if updates:
                await self._save_offset(bot_key, offset)

    # ------------------------------------------------------------------
    # Persistencia del offset
    # ------------------------------------------------------------------

    async def _load_offset(self, bot_key: str) -> int | None:
        try:
            doc = await self.db.telegram_polling_state.find_one(
                {"bot_key": bot_key}, {"_id": 0}
            )
        except Exception:
            logger.exception("No pude leer el offset de polling para %s", bot_key)
            return None
        if not doc:
            return None
        value = doc.get("next_offset")
        return value if isinstance(value, int) else None

    async def _save_offset(self, bot_key: str, offset: int | None) -> None:
        if offset is None:
            return
        try:
            await self.db.telegram_polling_state.update_one(
                {"bot_key": bot_key},
                {
                    "$set": {
                        "bot_key": bot_key,
                        "next_offset": offset,
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }
                },
                upsert=True,
            )
        except Exception:
            logger.exception("No pude guardar el offset de polling para %s", bot_key)

    # ------------------------------------------------------------------
    # Llamadas HTTP a Telegram (aisladas para poder mockearlas en tests)
    # ------------------------------------------------------------------

    async def _telegram_get_updates(self, token: str, offset: int | None) -> list[dict]:
        import httpx

        payload: dict[str, Any] = {
            "timeout": self.poll_timeout_seconds,
            "allowed_updates": ["message", "edited_message"],
        }
        if offset is not None:
            payload["offset"] = offset
        timeout = httpx.Timeout(self.poll_timeout_seconds + 15, connect=10)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                f"{TELEGRAM_API_BASE}/bot{token}/getUpdates", json=payload
            )
        if response.status_code == 409:
            raise TelegramConflictError(response.text[:300])
        data = response.json()
        if not data.get("ok"):
            if data.get("error_code") == 409:
                raise TelegramConflictError(str(data.get("description") or ""))
            raise RuntimeError(f"getUpdates no ok: {str(data)[:300]}")
        result = data.get("result") or []
        return [item for item in result if isinstance(item, dict)]

    async def _telegram_delete_webhook(self, token: str) -> None:
        import httpx

        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                f"{TELEGRAM_API_BASE}/bot{token}/deleteWebhook",
                json={"drop_pending_updates": False},
            )
        data = response.json()
        if not data.get("ok"):
            raise RuntimeError(f"deleteWebhook no ok: {str(data)[:300]}")
