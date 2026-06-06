from __future__ import annotations

import asyncio
import logging
import os
import re
import signal
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
from motor.motor_asyncio import AsyncIOMotorClient

from hermes_bridge import (
    build_hermes_profile_spec,
    build_telegram_deep_link,
    mask_email,
    mask_phone,
    normalize_phone_for_match,
    phones_match,
    resolve_role_scope_for_hermes,
    safe_profile_slug,
    write_hermes_profile_files,
)


logging.basicConfig(
    level=os.environ.get("ROVI_TELEGRAM_AGENT_LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s [telegram-agent] %(message)s",
)
logger = logging.getLogger(__name__)
logging.getLogger("httpx").setLevel(logging.WARNING)

BOT_TOKEN = (
    os.environ.get("ROVI_CRM_TELEGRAM_BOT_TOKEN")
    or os.environ.get("ROVI_TELEGRAM_BOT_TOKEN")
    or os.environ.get("HERMES_TELEGRAM_BOT_TOKEN")
    or os.environ.get("TELEGRAM_BOT_TOKEN")
)
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "rovi_crm")
MINIAPP_URL = os.environ.get("ROVI_MINIAPP_URL", "https://rovicrm.com/miniapp/")
PUBLIC_API_BASE_URL = os.environ.get("ROVI_PUBLIC_API_BASE_URL", "https://rovicrm.com")
POLL_TIMEOUT = int(os.environ.get("ROVI_TELEGRAM_POLL_TIMEOUT", "25"))
HERMES_PROFILES_ROOT = Path(os.environ.get("ROVI_HERMES_PROFILES_ROOT", "/app/hermes-profiles")).expanduser()
HERMES_PROFILE = os.environ.get("ROVI_HERMES_PROFILE", "rovi-broker")

LEAD_STATUSES = ["nuevo", "contactado", "calificacion", "presentacion", "apartado", "venta", "perdido"]
ONBOARDING_STEPS = [
    {
        "key": "goal",
        "question": "Para arrancar: que quieres que priorice tu agente? Ej. vender inventario, captar propietarios, dar seguimiento o coordinar equipo.",
    },
    {
        "key": "zone",
        "question": "Cual es tu zona principal de operacion? Ej. Tulum, Playa del Carmen, CDMX, Riviera Maya.",
    },
    {
        "key": "tone",
        "question": "Que tono prefieres para mensajes a clientes? Ej. ejecutivo, cercano, lujo discreto, directo.",
    },
    {
        "key": "cadence",
        "question": "Cada cuanto quieres que te recuerde seguimientos importantes? Ej. diario, cada 2 dias, semanal.",
    },
]

shutdown_event = asyncio.Event()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_code(value: str | None) -> str:
    if not value:
        return ""
    value = value.strip()
    if value.lower().startswith("rovi_"):
        value = value[5:]
    return "".join(ch for ch in value.upper() if ch.isalnum())


def extract_start_code(text: str | None) -> str:
    parts = (text or "").split(maxsplit=1)
    return normalize_code(parts[1]) if len(parts) > 1 else ""


def html_safe(value: Any) -> str:
    return str(value or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def first_name(user: dict[str, Any] | None) -> str:
    name = (user or {}).get("name") or (user or {}).get("email") or "ahi"
    return str(name).split()[0]


def classify_priority(text: str) -> str:
    haystack = text.lower()
    if any(word in haystack for word in ("urgente", "hoy", "visita", "apartado", "esta semana", "ya", "listo para")):
        return "alta"
    return "media"


def looks_like_lead_text(text: str) -> bool:
    haystack = (text or "").lower()
    has_contact_signal = bool(extract_phone(text)) or any(word in haystack for word in ("cliente", "contacto", "prospecto", "lead", "interesado", "busca", "quiere", "pidio", "pregunta"))
    has_real_estate_signal = any(word in haystack for word in (
        "renta", "venta", "comprar", "compra", "departamento", "depa", "casa", "terreno",
        "villa", "condo", "recamara", "recámara", "presupuesto", "mdp", "tulum", "playa",
        "visita", "apartado", "inversion", "inversión",
    ))
    return len(text.strip()) >= 28 and has_contact_signal and has_real_estate_signal


def normalize_stage_from_text(text: str) -> str | None:
    haystack = (text or "").lower()
    aliases = {
        "nuevo": ("nuevo", "nueva"),
        "contactado": ("contactado", "contactada", "contacto"),
        "calificacion": ("calificacion", "calificación", "calificar", "calificado"),
        "presentacion": ("presentacion", "presentación", "presentar", "tour", "visita"),
        "apartado": ("apartado", "apartar", "reserva", "reservado"),
        "venta": ("venta", "vendido", "cerrado", "cierre"),
        "perdido": ("perdido", "descartado", "no siguio", "no siguió"),
    }
    for stage, words in aliases.items():
        if any(word in haystack for word in words):
            return stage
    return None


def is_affirmative(text: str) -> bool:
    return (text or "").strip().lower() in {"si", "sí", "ok", "dale", "va", "hazlo", "confirmo", "guardar", "guarda", "crear", "crealo", "créalo"}


def short_date(value: Any) -> str:
    if not value:
        return "sin fecha"
    try:
        raw = str(value).replace("Z", "+00:00")
        dt = datetime.fromisoformat(raw)
        return dt.strftime("%d/%m %H:%M")
    except Exception:
        return str(value)[:16]


def extract_phone(text: str) -> str:
    match = re.search(r"(?:\+?\d[\d\s().-]{7,}\d)", text or "")
    return match.group(0).strip() if match else ""


def extract_email(text: str) -> str:
    match = re.search(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", text or "", re.IGNORECASE)
    return match.group(0).strip().lower() if match else ""


def extract_name(text: str) -> str:
    match = re.search(r"(?:cliente|contacto|nombre)[:\s]+([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ ]{1,42})", text or "")
    return match.group(1).strip() if match else "Contacto Telegram"


def read_profile_file(profile_dir: Path, relative_path: str, max_chars: int = 2500) -> str:
    try:
        path = profile_dir / relative_path
        if not path.exists() or not path.is_file():
            return ""
        return path.read_text(encoding="utf-8", errors="ignore")[:max_chars].strip()
    except Exception:
        logger.exception("No pude leer contexto Hermes: %s", relative_path)
        return ""


def compact_profile_context(profile_dir: Path) -> dict[str, str]:
    soul = read_profile_file(profile_dir, "SOUL.md", 2200)
    memory = read_profile_file(profile_dir, "memories/MEMORY.imported-local.md", 1800) or read_profile_file(profile_dir, "memories/MEMORY.md", 1800)
    user_memory = read_profile_file(profile_dir, "memories/USER.imported-local.md", 1000) or read_profile_file(profile_dir, "memories/USER.md", 1000)
    skill = read_profile_file(profile_dir, "skills/productivity/rovi-flow-bot/SKILL.md", 3200)
    return {
        "profile_name": profile_dir.name,
        "soul": soul,
        "memory": memory,
        "user_memory": user_memory,
        "skill": skill,
    }


def profile_has_flow_bot_context(context: dict[str, str]) -> bool:
    joined = "\n".join(context.values()).lower()
    return "rovi flow bot" in joined or "flow bot" in joined or "flow guardian" in joined


def extract_profile_lines(context: dict[str, str], keywords: tuple[str, ...], limit: int = 6) -> list[str]:
    lines: list[str] = []
    haystacks = [context.get("user_memory", ""), context.get("memory", ""), context.get("skill", "")]
    for haystack in haystacks:
        for raw_line in haystack.splitlines():
            line = raw_line.strip(" §-\t")
            if not line or len(line) < 8:
                continue
            lowered = line.lower()
            if any(keyword in lowered for keyword in keywords) and line not in lines:
                lines.append(line)
                if len(lines) >= limit:
                    return lines
    return lines


def lead_scope_query(user: dict[str, Any], link: dict[str, Any], extra: dict[str, Any] | None = None) -> dict[str, Any]:
    tenant_id = link.get("tenant_id") or user.get("tenant_id")
    query: dict[str, Any] = {"tenant_id": tenant_id, "deleted": {"$ne": True}}
    is_agency = user.get("account_type") == "agency" and link.get("role") in {"owner", "admin", "manager"}
    if not is_agency:
        query["$or"] = [
            {"created_by": user["id"]},
            {"assigned_broker_id": user["id"]},
            {"assigned_broker_id": {"$in": [None, ""]}},
        ]
    if extra:
        query.update(extra)
    return query


class TelegramAgent:
    def __init__(self) -> None:
        if not BOT_TOKEN:
            raise RuntimeError("Falta ROVI_TELEGRAM_BOT_TOKEN/HERMES_TELEGRAM_BOT_TOKEN/TELEGRAM_BOT_TOKEN")
        if not MONGO_URL:
            raise RuntimeError("Falta MONGO_URL")
        self.client = AsyncIOMotorClient(MONGO_URL)
        self.db = self.client[DB_NAME]
        self.http = httpx.AsyncClient(timeout=POLL_TIMEOUT + 10)
        self.api_base = f"https://api.telegram.org/bot{BOT_TOKEN}"
        self.offset = 0
        self.profile_dir = HERMES_PROFILES_ROOT / HERMES_PROFILE
        self.profile_context = compact_profile_context(self.profile_dir)
        self.is_flow_bot = profile_has_flow_bot_context(self.profile_context)

    async def close(self) -> None:
        await self.http.aclose()
        self.client.close()

    async def run(self) -> None:
        await self.set_commands()
        logger.info(
            "Rovi Telegram Agent iniciado profile=%s flow_bot_context=%s",
            self.profile_context.get("profile_name") or HERMES_PROFILE,
            self.is_flow_bot,
        )
        while not shutdown_event.is_set():
            try:
                updates = await self.get_updates()
                for update in updates:
                    self.offset = max(self.offset, int(update["update_id"]) + 1)
                    await self.handle_update(update)
            except Exception:
                logger.exception("Error procesando updates de Telegram")
                await asyncio.sleep(3)

    async def get_updates(self) -> list[dict[str, Any]]:
        response = await self.http.post(
            f"{self.api_base}/getUpdates",
            json={
                "offset": self.offset,
                "timeout": POLL_TIMEOUT,
                "allowed_updates": ["message", "callback_query"],
            },
        )
        response.raise_for_status()
        body = response.json()
        if not body.get("ok"):
            logger.warning("Telegram getUpdates no ok: %s", body)
            return []
        return body.get("result", [])

    async def set_commands(self) -> None:
        commands = [
            {"command": "start", "description": "Iniciar o vincular ROVI"},
            {"command": "vincular", "description": "Vincular cuenta ROVI"},
            {"command": "dia", "description": "Plan de trabajo del dia"},
            {"command": "onboarding", "description": "Configurar tu agente"},
            {"command": "perfil", "description": "Ver cuenta vinculada"},
            {"command": "resumen", "description": "Resumen de CRM"},
            {"command": "leads", "description": "Ultimos leads"},
            {"command": "agenda", "description": "Proximos eventos"},
            {"command": "capturar", "description": "Crear lead desde texto"},
            {"command": "ayuda", "description": "Ver acciones disponibles"},
        ]
        try:
            await self.http.post(f"{self.api_base}/setMyCommands", json={"commands": commands})
        except Exception:
            logger.exception("No pude configurar comandos")

    def agent_name(self) -> str:
        return "ROVI Flow Bot" if self.is_flow_bot else "ROVI CRM Agent"

    def agent_positioning(self) -> str:
        if self.is_flow_bot:
            return (
                "Soy ROVI Flow Bot: tu segunda memoria comercial para bajar ruido, "
                "ordenar leads y convertir conversaciones en siguientes acciones."
            )
        return "Soy tu asistente diario de broker conectado a ROVI CRM."

    def flow_action_menu(self) -> str:
        if self.is_flow_bot:
            return (
                "Puedes escribirme natural:\n"
                "- que hago hoy\n"
                "- quien se esta enfriando\n"
                "- mensaje para Ana\n"
                "- captura este prospecto\n"
                "- cierre del dia\n"
                "- reporte para gerente"
            )
        return (
            "Puedes escribirme natural:\n"
            "- que sigue hoy\n"
            "- mensaje para Ana\n"
            "- captura este prospecto\n"
            "- mueve Carlos a apartado\n"
            "- como va mi pipeline"
        )

    def profile_context_note(self) -> str:
        if not self.is_flow_bot:
            return ""
        return (
            "Marco activo: Flow Bot prioriza foco comercial, follow-ups criticos, "
            "ningun lead sin siguiente accion y no envia mensajes a clientes sin aprobacion."
        )

    async def handle_update(self, update: dict[str, Any]) -> None:
        if "callback_query" in update:
            query = update["callback_query"]
            await self.answer_callback(query.get("id"))
            message = query.get("message") or {}
            data = query.get("data") or ""
            await self.handle_message(message, callback_data=data)
            return
        message = update.get("message") or {}
        if message:
            await self.handle_message(message)

    async def handle_message(self, message: dict[str, Any], callback_data: str | None = None) -> None:
        chat_id = message.get("chat", {}).get("id")
        telegram_user = message.get("from") or {}
        telegram_user_id = str(telegram_user.get("id") or "")
        text = (callback_data or message.get("text") or "").strip()
        if not chat_id or not telegram_user_id:
            return

        if message.get("contact"):
            await self.handle_contact(chat_id, telegram_user_id, message["contact"])
            return

        await self.touch_chat(telegram_user_id, chat_id, telegram_user)
        active = await self.get_active_context(telegram_user_id)

        if text.startswith("/start"):
            await self.handle_start(chat_id, telegram_user_id, telegram_user, text, active)
            return

        if not active:
            if text.startswith("/vincular") or extract_email(text):
                await self.start_link_from_email(chat_id, telegram_user_id, telegram_user, text)
                return
            await self.send_link_required(chat_id)
            return

        user, link = active
        onboarding = await self.get_onboarding(link)
        if text == "/onboarding":
            await self.start_onboarding(chat_id, link)
            return
        if onboarding and not onboarding.get("completed") and not text.startswith("/"):
            await self.continue_onboarding(chat_id, link, text, onboarding)
            return

        if text in {"/ayuda", "ayuda", "menu"}:
            await self.send_help(chat_id, user, link)
        elif text.startswith("/vincular"):
            await self.send_message(chat_id, "Este Telegram ya esta vinculado a una cuenta ROVI. Usa /perfil para verla o abre la MiniApp.")
        elif text == "/dia":
            await self.send_daily_brief(chat_id, user, link)
        elif text == "/perfil":
            await self.send_profile(chat_id, user, link)
        elif text == "/resumen":
            await self.send_summary(chat_id, user, link)
        elif text == "/leads":
            await self.send_leads(chat_id, user, link)
        elif text == "/agenda":
            await self.send_agenda(chat_id, user, link)
        elif text.startswith("/capturar") or text.lower().startswith("capturar "):
            raw = text.replace("/capturar", "", 1).replace("capturar", "", 1).strip()
            await self.capture_lead(chat_id, user, link, raw)
        else:
            await self.answer_agent(chat_id, user, link, text)

    async def touch_chat(self, telegram_user_id: str, chat_id: int, telegram_user: dict[str, Any]) -> None:
        await self.db.user_device_links.update_many(
            {"telegram.user_id": telegram_user_id, "status": {"$ne": "revoked"}},
            {"$set": {
                "telegram.chat_id": chat_id,
                "telegram.username": telegram_user.get("username"),
                "telegram.first_name": telegram_user.get("first_name"),
                "telegram.last_name": telegram_user.get("last_name"),
                "telegram.last_seen_at": now_iso(),
                "updated_at": now_iso(),
            }},
        )

    async def get_active_context(self, telegram_user_id: str) -> tuple[dict[str, Any], dict[str, Any]] | None:
        link = await self.db.user_device_links.find_one(
            {"telegram.user_id": telegram_user_id, "status": "active"},
            {"_id": 0},
            sort=[("activated_at", -1), ("updated_at", -1)],
        )
        if not link:
            return None
        user = await self.db.users.find_one({"id": link["user_id"], "is_active": {"$ne": False}}, {"_id": 0, "password_hash": 0})
        if not user:
            return None
        return user, link

    async def handle_start(
        self,
        chat_id: int,
        telegram_user_id: str,
        telegram_user: dict[str, Any],
        text: str,
        active: tuple[dict[str, Any], dict[str, Any]] | None,
    ) -> None:
        if active:
            user, link = active
            onboarding = await self.get_onboarding(link)
            if not onboarding or not onboarding.get("completed"):
                await self.send_message(
                    chat_id,
                    f"Hola {first_name(user)}. Ya estoy conectado a tu cuenta ROVI.\n\nAntes de operar como tu copiloto, te hago 4 preguntas rapidas para ajustar objetivo, zona, tono y seguimiento.",
                )
                await self.start_onboarding(chat_id, link)
            else:
                await self.send_message(
                    chat_id,
                    f"Hola {first_name(user)}. Ya tengo tu perfil ROVI cargado.\n\n"
                    f"{self.agent_positioning()}\n\n"
                    "Voy a priorizar leads, preparar mensajes, detectar follow-ups criticos, capturar prospectos y proteger tus bloques de accion comercial.",
                    reply_markup=self.main_menu_markup(),
                )
                await self.send_daily_brief(chat_id, user, link)
            return

        code = extract_start_code(text)
        if code:
            linked = await self.attach_pending_link(chat_id, telegram_user_id, telegram_user, code)
            if linked:
                return
        await self.send_link_required(chat_id)

    async def attach_pending_link(self, chat_id: int, telegram_user_id: str, telegram_user: dict[str, Any], code: str) -> bool:
        link = await self.db.user_device_links.find_one({"code": normalize_code(code), "status": {"$ne": "revoked"}}, {"_id": 0})
        if not link:
            await self.send_message(chat_id, "No encontre ese codigo de vinculacion. Abre la MiniApp y conecta tu cuenta ROVI.")
            return True
        if link.get("status") == "active":
            await self.send_message(chat_id, "Ese vinculo ya esta activo. Si es tu cuenta, abre la MiniApp desde Telegram.")
            return True
        user = await self.db.users.find_one({"id": link["user_id"]}, {"_id": 0, "password_hash": 0})
        if not user:
            await self.send_message(chat_id, "No encontre el usuario ROVI de este vinculo.")
            return True

        telegram_payload = {
            "user_id": telegram_user_id,
            "chat_id": chat_id,
            "username": telegram_user.get("username"),
            "first_name": telegram_user.get("first_name"),
            "last_name": telegram_user.get("last_name"),
            "started_at": now_iso(),
        }
        await self.db.user_device_links.update_one({"id": link["id"]}, {"$set": {"telegram": telegram_payload, "updated_at": now_iso()}})
        if user.get("phone"):
            await self.send_message(
                chat_id,
                f"Para confirmar que eres {mask_email(user.get('email'))}, comparte tu telefono de Telegram.",
                reply_markup={
                    "keyboard": [[{"text": "Compartir telefono", "request_contact": True}]],
                    "one_time_keyboard": True,
                    "resize_keyboard": True,
                },
            )
            return True

        await self.activate_link(link, user, telegram_payload)
        await self.send_message(chat_id, "Cuenta ROVI vinculada. Ahora configuramos tu agente.")
        await self.start_onboarding(chat_id, {**link, "telegram": telegram_payload})
        return True

    async def start_link_from_email(self, chat_id: int, telegram_user_id: str, telegram_user: dict[str, Any], text: str) -> None:
        email = extract_email(text)
        if not email:
            await self.send_message(
                chat_id,
                "Claro. Para vincular desde aqui, mandame tu email de ROVI asi:\n\n/vincular broker@tuempresa.com\n\n"
                "No me mandes tu password por Telegram. Validaremos con tu telefono registrado en ROVI.",
            )
            return

        existing_active = await self.db.user_device_links.find_one(
            {"telegram.user_id": telegram_user_id, "status": "active"},
            {"_id": 0},
        )
        if existing_active:
            await self.send_message(chat_id, "Este Telegram ya tiene una cuenta ROVI vinculada. Usa /perfil para verla.")
            return

        user = await self.db.users.find_one({"email": email}, {"_id": 0, "password_hash": 0})
        if not user or not user.get("is_active", True):
            await self.send_message(
                chat_id,
                "No encontre una cuenta ROVI activa con ese email.\n\n"
                "Puedes revisar el correo o abrir la MiniApp para iniciar sesion manualmente.",
                reply_markup={"inline_keyboard": [[{"text": "Abrir MiniApp", "web_app": {"url": MINIAPP_URL}}]]},
            )
            return

        if not user.get("phone"):
            await self.send_message(
                chat_id,
                f"Encontre la cuenta {mask_email(user.get('email'))}, pero no tiene telefono registrado en ROVI.\n\n"
                "Por seguridad, termina la vinculacion iniciando sesion desde la MiniApp.",
                reply_markup={"inline_keyboard": [[{"text": "Conectar en MiniApp", "web_app": {"url": MINIAPP_URL}}]]},
            )
            return

        now = now_iso()
        code = uuid.uuid4().hex[:8].upper()
        role_scope = resolve_role_scope_for_hermes(user, None)
        link_doc = {
            "id": f"device-link-{uuid.uuid4()}",
            "user_id": user["id"],
            "tenant_id": user.get("tenant_id"),
            "membership_id": None,
            "role": user.get("role", "broker"),
            "role_scope": role_scope,
            "account_type": user.get("account_type", "individual"),
            "user_email": user.get("email"),
            "user_phone": user.get("phone"),
            "code": code,
            "channel": "telegram",
            "destination": user.get("phone") or user.get("email") or "",
            "link_method": "telegram_agent_email_phone",
            "telegram_deep_link": build_telegram_deep_link(code),
            "status": "awaiting_contact",
            "hermes_profile_name": safe_profile_slug(user, role_scope),
            "phone_required": True,
            "phone_match_required": True,
            "telegram": {
                "user_id": telegram_user_id,
                "chat_id": chat_id,
                "username": telegram_user.get("username"),
                "first_name": telegram_user.get("first_name"),
                "last_name": telegram_user.get("last_name"),
                "started_at": now,
            },
            "created_at": now,
            "updated_at": now,
        }
        await self.db.user_device_links.update_one(
            {"telegram.user_id": telegram_user_id, "status": {"$in": ["awaiting_contact", "pending"]}},
            {"$set": link_doc},
            upsert=True,
        )
        await self.send_message(
            chat_id,
            f"Encontre tu cuenta ROVI: {mask_email(user.get('email'))}.\n\n"
            "Para confirmar identidad, comparte el telefono de Telegram. Debe coincidir con el telefono registrado en ROVI.",
            reply_markup={
                "keyboard": [[{"text": "Compartir telefono", "request_contact": True}]],
                "one_time_keyboard": True,
                "resize_keyboard": True,
            },
        )

    async def handle_contact(self, chat_id: int, telegram_user_id: str, contact: dict[str, Any]) -> None:
        link = await self.db.user_device_links.find_one(
            {"telegram.user_id": telegram_user_id, "status": {"$in": ["pending", "awaiting_contact", "pending_email_confirmation"]}},
            {"_id": 0},
            sort=[("updated_at", -1)],
        )
        if not link:
            await self.send_message(chat_id, "No tengo una vinculacion pendiente. Abre la MiniApp para conectar ROVI.")
            return
        user = await self.db.users.find_one({"id": link["user_id"]}, {"_id": 0, "password_hash": 0})
        if not user:
            await self.send_message(chat_id, "No encontre el usuario ROVI de este vinculo.")
            return
        phone = contact.get("phone_number") or ""
        if not phones_match(user.get("phone"), phone):
            await self.db.user_device_links.update_one(
                {"id": link["id"]},
                {"$set": {"status": "phone_mismatch", "telegram.phone": phone, "updated_at": now_iso()}},
            )
            await self.send_message(
                chat_id,
                f"El telefono no coincide con ROVI. Esperaba {mask_phone(user.get('phone'))} y recibi {mask_phone(phone)}.",
                reply_markup={"remove_keyboard": True},
            )
            return
        telegram_payload = {**(link.get("telegram") or {}), "chat_id": chat_id, "phone": phone, "phone_normalized": normalize_phone_for_match(phone)}
        activated = await self.activate_link(link, user, telegram_payload)
        await self.send_message(chat_id, "Cuenta ROVI vinculada correctamente.", reply_markup={"remove_keyboard": True})
        await self.start_onboarding(chat_id, activated)

    async def activate_link(self, link: dict[str, Any], user: dict[str, Any], telegram_payload: dict[str, Any]) -> dict[str, Any]:
        role_scope = link.get("role_scope") or resolve_role_scope_for_hermes(user, None)
        active_workspace = {
            "tenant_id": link.get("tenant_id") or user.get("tenant_id"),
            "membership_id": link.get("membership_id"),
            "role": link.get("role") or user.get("role", "broker"),
        }
        updated = {
            **link,
            "telegram": telegram_payload,
            "status": "active",
            "phone_match": True if telegram_payload.get("phone") else link.get("phone_match"),
            "activated_at": now_iso(),
            "updated_at": now_iso(),
            "role_scope": role_scope,
            "hermes_profile_name": link.get("hermes_profile_name") or safe_profile_slug(user, role_scope),
        }
        profile_spec = build_hermes_profile_spec(user=user, link=updated, active_workspace=active_workspace)
        profile_files = write_hermes_profile_files(profile_spec)
        updated["hermes_profile"] = profile_files
        updated["hermes_profile_spec"] = profile_spec
        await self.db.user_device_links.update_one({"id": link["id"]}, {"$set": updated}, upsert=True)
        return updated

    async def get_onboarding(self, link: dict[str, Any]) -> dict[str, Any] | None:
        return await self.db.telegram_agent_onboarding.find_one({"link_id": link["id"]}, {"_id": 0})

    async def get_conversation_state(self, chat_id: int, user: dict[str, Any]) -> dict[str, Any]:
        state = await self.db.telegram_agent_state.find_one({"chat_id": chat_id, "user_id": user["id"]}, {"_id": 0})
        return state or {}

    async def set_conversation_state(self, chat_id: int, user: dict[str, Any], state: dict[str, Any] | None) -> None:
        query = {"chat_id": chat_id, "user_id": user["id"]}
        if not state:
            await self.db.telegram_agent_state.delete_one(query)
            return
        await self.db.telegram_agent_state.update_one(
            query,
            {"$set": {**state, "chat_id": chat_id, "user_id": user["id"], "updated_at": now_iso()}},
            upsert=True,
        )

    async def start_onboarding(self, chat_id: int, link: dict[str, Any]) -> None:
        doc = {
            "id": f"agent-onboarding-{uuid.uuid4()}",
            "link_id": link["id"],
            "user_id": link["user_id"],
            "tenant_id": link.get("tenant_id"),
            "step": 0,
            "answers": {},
            "completed": False,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }
        await self.db.telegram_agent_onboarding.update_one({"link_id": link["id"]}, {"$set": doc}, upsert=True)
        await self.send_message(chat_id, ONBOARDING_STEPS[0]["question"])

    async def continue_onboarding(self, chat_id: int, link: dict[str, Any], text: str, onboarding: dict[str, Any]) -> None:
        step = int(onboarding.get("step") or 0)
        answers = onboarding.get("answers") or {}
        if step < len(ONBOARDING_STEPS):
            answers[ONBOARDING_STEPS[step]["key"]] = text[:500]
        next_step = step + 1
        if next_step >= len(ONBOARDING_STEPS):
            await self.db.telegram_agent_onboarding.update_one(
                {"link_id": link["id"]},
                {"$set": {"answers": answers, "step": next_step, "completed": True, "completed_at": now_iso(), "updated_at": now_iso()}},
            )
            await self.db.user_device_links.update_one(
                {"id": link["id"]},
                {"$set": {"agent_onboarding": answers, "agent_onboarding_completed": True, "updated_at": now_iso()}},
            )
            await self.send_message(
                chat_id,
                "Listo. Ya tengo contexto para operar contigo.\n\n"
                f"{self.profile_context_note()}\n\n"
                f"{self.flow_action_menu()}\n\n"
                "Tambien puedes abrir la MiniApp para ver pipeline y agenda.",
                reply_markup=self.main_menu_markup(),
            )
            return
        await self.db.telegram_agent_onboarding.update_one(
            {"link_id": link["id"]},
            {"$set": {"answers": answers, "step": next_step, "updated_at": now_iso()}},
        )
        await self.send_message(chat_id, ONBOARDING_STEPS[next_step]["question"])

    async def send_profile(self, chat_id: int, user: dict[str, Any], link: dict[str, Any]) -> None:
        onboarding = link.get("agent_onboarding") or {}
        text = (
            f"Perfil conectado\n\n"
            f"Cuenta: {html_safe(user.get('name'))}\n"
            f"Email: {html_safe(user.get('email'))}\n"
            f"Rol: {html_safe(link.get('role') or user.get('role'))}\n"
            f"Tipo: {html_safe(user.get('account_type'))}\n"
            f"Tenant: {html_safe(link.get('tenant_id') or user.get('tenant_id'))}\n"
            f"Hermes: {html_safe(link.get('hermes_profile_name') or 'perfil pendiente')}\n"
        )
        if onboarding:
            text += f"\nObjetivo: {html_safe(onboarding.get('goal'))}\nZona: {html_safe(onboarding.get('zone'))}\nTono: {html_safe(onboarding.get('tone'))}"
        await self.send_message(chat_id, text)

    async def crm_snapshot(self, user: dict[str, Any], link: dict[str, Any]) -> dict[str, Any]:
        query = lead_scope_query(user, link)
        open_query = {**query, "status": {"$in": LEAD_STATUSES[:5]}}
        total = await self.db.leads.count_documents(query)
        open_count = await self.db.leads.count_documents(open_query)
        hot_count = await self.db.leads.count_documents({**query, "priority": {"$in": ["alta", "urgente"]}})
        new_count = await self.db.leads.count_documents({**query, "status": "nuevo"})
        top_leads = await self.db.leads.find(open_query, {"_id": 0}).sort("updated_at", -1).limit(20).to_list(20)
        priority_rank = {"urgente": 0, "alta": 1, "media": 2, "baja": 3}
        top_leads.sort(key=lambda lead: (priority_rank.get(lead.get("priority", "media"), 2), -int(lead.get("intent_score") or 0)))

        tenant_id = link.get("tenant_id") or user.get("tenant_id")
        user_id = user["id"]
        event_query = {"tenant_id": tenant_id, "$or": [{"user_id": user_id}, {"assigned_to": user_id}, {"created_by": user_id}]}
        events = await self.db.calendar_events.find(event_query, {"_id": 0}).sort("start_time", 1).limit(3).to_list(3)
        if not events:
            events = await self.db.miniapp_calendar_events.find(event_query, {"_id": 0}).sort("start_time", 1).limit(3).to_list(3)

        task_query = {"tenant_id": tenant_id, "assigned_to": user_id, "status": {"$ne": "done"}}
        pending_tasks = await self.db.miniapp_tasks.count_documents(task_query)
        return {
            "total": total,
            "open": open_count,
            "hot": hot_count,
            "new": new_count,
            "top_leads": top_leads[:3],
            "events": events,
            "pending_tasks": pending_tasks,
        }

    async def send_daily_brief(self, chat_id: int, user: dict[str, Any], link: dict[str, Any]) -> None:
        snapshot = await self.crm_snapshot(user, link)
        onboarding = link.get("agent_onboarding") or {}
        goal = onboarding.get("goal") or "cerrar mas oportunidades"
        zone = onboarding.get("zone") or "tu mercado principal"

        lines = [
            f"Plan de trabajo para hoy, {first_name(user)}",
            "",
            f"Objetivo activo: {goal}",
            f"Zona/contexto: {zone}",
            "",
            "Lo que veo en tu CRM:",
            f"- {snapshot['open']} leads abiertos de {snapshot['total']} totales",
            f"- {snapshot['hot']} leads de prioridad alta",
            f"- {snapshot['new']} leads nuevos por atender",
            f"- {snapshot['pending_tasks']} tareas pendientes",
        ]
        if snapshot["events"]:
            lines.append(f"- Proxima agenda: {snapshot['events'][0].get('title', 'Evento')} ({short_date(snapshot['events'][0].get('start_time'))})")
        else:
            lines.append("- Sin eventos proximos registrados")

        if snapshot["top_leads"]:
            lines.append("\nTe recomiendo empezar por:")
            for idx, lead in enumerate(snapshot["top_leads"], 1):
                lines.append(
                    f"{idx}. {lead.get('name') or 'Lead'} - {lead.get('priority', 'media')} / {lead.get('status', 'nuevo')}\n"
                    f"   {lead.get('next_action') or 'Confirmar necesidad y siguiente paso'}"
                )
        else:
            lines.append("\nNo veo leads abiertos. Tu mejor accion es capturar/importar prospectos desde la MiniApp.")

        if self.is_flow_bot:
            lines.append(
                "\nBloque Flow sugerido: 45 min sin abrir mas frentes.\n"
                "1. Contacta el lead mas caliente.\n"
                "2. Cierra follow-ups vencidos.\n"
                "3. Deja cada lead con una siguiente accion."
            )
        lines.append("\n" + self.flow_action_menu())
        await self.send_message(chat_id, "\n".join(lines), reply_markup=self.main_menu_markup())

    async def send_summary(self, chat_id: int, user: dict[str, Any], link: dict[str, Any]) -> None:
        query = lead_scope_query(user, link)
        total = await self.db.leads.count_documents(query)
        open_count = await self.db.leads.count_documents({**query, "status": {"$in": LEAD_STATUSES[:5]}})
        hot = await self.db.leads.count_documents({**query, "priority": {"$in": ["alta", "urgente"]}})
        top_lead = await self.db.leads.find_one(
            {**query, "status": {"$in": LEAD_STATUSES[:5]}},
            {"_id": 0},
            sort=[("priority", 1), ("updated_at", -1)],
        )
        by_stage = []
        for status in LEAD_STATUSES:
            count = await self.db.leads.count_documents({**query, "status": status})
            if count:
                by_stage.append(f"- {status}: {count}")
        title = "Resumen ROVI Flow" if self.is_flow_bot else "Resumen ROVI"
        text = (
            f"{title}\n\n"
            f"Leads totales: {total}\n"
            f"Abiertos: {open_count}\n"
            f"Prioridad alta: {hot}\n\n"
        )
        text += ("\n".join(by_stage) if by_stage else "Todavia no hay leads en pipeline.")
        if top_lead:
            text += (
                f"\n\nSiguiente mejor accion:\n"
                f"{top_lead.get('name') or 'Lead'} - {top_lead.get('next_action') or 'contactar y confirmar siguiente paso'}"
            )
        text += "\n\n" + self.flow_action_menu()
        await self.send_message(chat_id, text, reply_markup=self.main_menu_markup())

    async def send_leads(self, chat_id: int, user: dict[str, Any], link: dict[str, Any]) -> None:
        query = lead_scope_query(user, link)
        leads = await self.db.leads.find(query, {"_id": 0}).sort("created_at", -1).limit(6).to_list(6)
        if not leads:
            await self.send_message(chat_id, "No hay leads visibles para tu perfil todavia.")
            return
        lines = ["Leads que conviene revisar:"]
        for lead in leads:
            lines.append(
                f"\n{lead.get('name') or 'Lead sin nombre'}\n"
                f"Etapa: {lead.get('status', 'nuevo')} · Prioridad: {lead.get('priority', 'media')}\n"
                f"Accion: {lead.get('next_action') or 'Confirmar siguiente paso'}\n"
                f"Contacto: {lead.get('phone') or lead.get('email') or 'sin contacto'}"
            )
        lines.append("\nPuedes pedirme: mensaje para [nombre], avanzar [nombre] a apartado, o agenda seguimiento con [nombre].")
        await self.send_message(chat_id, "\n".join(lines), reply_markup=self.main_menu_markup())

    async def send_agenda(self, chat_id: int, user: dict[str, Any], link: dict[str, Any]) -> None:
        tenant_id = link.get("tenant_id") or user.get("tenant_id")
        user_id = user["id"]
        query = {"tenant_id": tenant_id, "$or": [{"user_id": user_id}, {"assigned_to": user_id}, {"created_by": user_id}]}
        events = await self.db.calendar_events.find(query, {"_id": 0}).sort("start_time", 1).limit(5).to_list(5)
        if not events:
            events = await self.db.miniapp_calendar_events.find(query, {"_id": 0}).sort("start_time", 1).limit(5).to_list(5)
        if not events:
            await self.send_message(chat_id, "No encontre eventos proximos para tu perfil.")
            return
        lines = ["Agenda:"]
        for event in events:
            lines.append(f"\n{event.get('title', 'Evento')}\n{short_date(event.get('start_time'))} · {event.get('event_type', 'seguimiento')}")
        await self.send_message(chat_id, "\n".join(lines))

    async def capture_lead(self, chat_id: int, user: dict[str, Any], link: dict[str, Any], raw: str) -> None:
        if not raw:
            await self.send_message(chat_id, "Usa: /capturar Cliente Ana busca renta en Tulum, presupuesto 45k...")
            return
        priority = classify_priority(raw)
        lead = {
            "id": str(uuid.uuid4()),
            "tenant_id": link.get("tenant_id") or user.get("tenant_id"),
            "created_by": user["id"],
            "assigned_broker_id": user["id"],
            "name": extract_name(raw),
            "phone": extract_phone(raw),
            "email": "",
            "status": "nuevo",
            "priority": priority,
            "source": "telegram_agent",
            "operation_type": "rent" if any(word in raw.lower() for word in ("renta", "rent", "alquiler")) else "sale",
            "pipeline_type": "rentals" if "renta" in raw.lower() else "sales",
            "raw_interest_text": raw,
            "interest_source": "telegram_agent",
            "notes": raw[:1000],
            "intent_score": 84 if priority == "alta" else 62,
            "next_action": "Contactar hoy y confirmar zona, presupuesto y fecha ideal." if priority == "alta" else "Confirmar datos clave y proponer siguiente paso.",
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }
        await self.db.leads.insert_one(lead)
        await self.send_message(
            chat_id,
            f"Lead creado en ROVI\n\n{lead['name']}\nPrioridad: {lead['priority']}\nSiguiente accion: {lead['next_action']}",
        )

    async def find_lead_by_text(self, user: dict[str, Any], link: dict[str, Any], text: str) -> dict[str, Any] | None:
        query = lead_scope_query(user, link)
        leads = await self.db.leads.find(query, {"_id": 0}).sort("updated_at", -1).limit(80).to_list(80)
        haystack = text.lower()
        for lead in leads:
            name = str(lead.get("name") or "").lower()
            if name and (name in haystack or any(part and len(part) > 2 and part in haystack for part in name.split())):
                return lead
        phone = extract_phone(text)
        if phone:
            for lead in leads:
                if normalize_phone_for_match(lead.get("phone")) == normalize_phone_for_match(phone):
                    return lead
        return leads[0] if len(leads) == 1 else None

    async def suggest_today(self, chat_id: int, user: dict[str, Any], link: dict[str, Any]) -> None:
        query = lead_scope_query(user, link, {"status": {"$in": LEAD_STATUSES[:5]}})
        leads = await self.db.leads.find(query, {"_id": 0}).sort("updated_at", -1).limit(40).to_list(40)
        if not leads:
            await self.send_message(chat_id, "Hoy no veo leads abiertos. Te conviene capturar nuevos prospectos o importar candidatos desde la MiniApp.", reply_markup=self.main_menu_markup())
            return
        priority_rank = {"urgente": 0, "alta": 1, "media": 2, "baja": 3}
        leads.sort(key=lambda lead: (priority_rank.get(lead.get("priority", "media"), 2), -int(lead.get("intent_score") or 0)))
        top = leads[:3]
        lines = ["Yo empezaria por estos:"]
        for idx, lead in enumerate(top, 1):
            lines.append(
                f"\n{idx}. {lead.get('name') or 'Lead'}\n"
                f"{lead.get('priority', 'media')} · {lead.get('status', 'nuevo')} · {lead.get('intent_score', 50)}% intencion\n"
                f"{lead.get('next_action') or 'Confirmar datos y proponer siguiente paso'}"
            )
        if self.is_flow_bot:
            lines.append("\nRegla Flow: no abras otro frente hasta dejar estos leads con siguiente accion registrada.")
        lines.append("\nSi quieres, dime: mensaje para el 1, avanzar Ana a presentacion, o crear tarea para Carlos.")
        await self.send_message(chat_id, "\n".join(lines), reply_markup=self.main_menu_markup())

    async def send_cooling_leads(self, chat_id: int, user: dict[str, Any], link: dict[str, Any]) -> None:
        query = lead_scope_query(user, link, {"status": {"$in": LEAD_STATUSES[:5]}})
        leads = await self.db.leads.find(query, {"_id": 0}).sort("updated_at", 1).limit(40).to_list(40)
        if not leads:
            await self.send_message(chat_id, "No veo leads abiertos para detectar enfriamiento. Captura/importa prospectos y los monitoreo.")
            return
        priority_rank = {"urgente": 0, "alta": 1, "media": 2, "baja": 3}
        leads.sort(key=lambda lead: (priority_rank.get(lead.get("priority", "media"), 2), str(lead.get("updated_at") or "")))
        lines = ["Leads con riesgo de enfriarse:"]
        for idx, lead in enumerate(leads[:5], 1):
            lines.append(
                f"\n{idx}. {lead.get('name') or 'Lead'}\n"
                f"Etapa: {lead.get('status', 'nuevo')} · Prioridad: {lead.get('priority', 'media')}\n"
                f"Ultimo movimiento: {short_date(lead.get('updated_at'))}\n"
                f"Accion: {lead.get('next_action') or 'Enviar seguimiento breve y confirmar siguiente paso'}"
            )
        lines.append("\nPide: mensaje para el 1, y te dejo un WhatsApp listo.")
        await self.send_message(chat_id, "\n".join(lines), reply_markup=self.main_menu_markup())

    async def send_daily_close(self, chat_id: int, user: dict[str, Any], link: dict[str, Any]) -> None:
        snapshot = await self.crm_snapshot(user, link)
        lines = [
            "Cierre del dia",
            "",
            f"- Leads abiertos: {snapshot['open']}",
            f"- Prioridad alta: {snapshot['hot']}",
            f"- Tareas pendientes: {snapshot['pending_tasks']}",
            "",
            "Antes de cortar, deja cerrado esto:",
        ]
        if snapshot["top_leads"]:
            for idx, lead in enumerate(snapshot["top_leads"], 1):
                lines.append(f"{idx}. {lead.get('name') or 'Lead'}: {lead.get('next_action') or 'definir siguiente accion'}")
        else:
            lines.append("1. Captura cualquier prospecto suelto de WhatsApp/Telegram.")
        lines.append("\nManana puedo arrancar con /dia y priorizarte el primer bloque.")
        await self.send_message(chat_id, "\n".join(lines), reply_markup=self.main_menu_markup())

    async def send_manager_report(self, chat_id: int, user: dict[str, Any], link: dict[str, Any]) -> None:
        query = lead_scope_query(user, link)
        counts = []
        for status in LEAD_STATUSES:
            count = await self.db.leads.count_documents({**query, "status": status})
            if count:
                counts.append(f"- {status}: {count}")
        snapshot = await self.crm_snapshot(user, link)
        lines = [
            "Reporte para gerente",
            "",
            f"Broker: {user.get('name') or user.get('email')}",
            f"Leads totales visibles: {snapshot['total']}",
            f"Leads abiertos: {snapshot['open']}",
            f"Alta prioridad: {snapshot['hot']}",
            "",
            "Pipeline:",
            *(counts or ["- Sin leads en pipeline"]),
            "",
            "Riesgos / foco:",
        ]
        if snapshot["top_leads"]:
            for lead in snapshot["top_leads"]:
                lines.append(f"- {lead.get('name') or 'Lead'}: {lead.get('next_action') or 'requiere siguiente accion'}")
        else:
            lines.append("- Falta carga/captura de prospectos.")
        await self.send_message(chat_id, "\n".join(lines), reply_markup=self.main_menu_markup())

    async def send_vivi_context(self, chat_id: int) -> None:
        profile_lines = extract_profile_lines(
            self.profile_context,
            ("vivi", "viviana", "vmorentin", "5089665912", "5580483839"),
        )
        user = await self.db.users.find_one({"email": "vivi@rovicrm.com"}, {"_id": 0, "password_hash": 0})
        links_query: dict[str, Any] = {"$or": [{"user_email": "vivi@rovicrm.com"}, {"telegram.user_id": "5089665912"}]}
        if user:
            links_query["$or"].append({"user_id": user.get("id")})
        links = await self.db.user_device_links.find(links_query, {"_id": 0, "hermes_profile_spec": 0}).sort("updated_at", -1).limit(5).to_list(5)
        leads_count = 0
        open_count = 0
        if user:
            tenant_id = user.get("tenant_id")
            leads_count = await self.db.leads.count_documents({"tenant_id": tenant_id, "deleted": {"$ne": True}})
            open_count = await self.db.leads.count_documents({"tenant_id": tenant_id, "deleted": {"$ne": True}, "status": {"$in": LEAD_STATUSES[:5]}})

        lines = ["Contexto de Vivi en ROVI Flow Bot", ""]
        if profile_lines:
            lines.append("Memoria Hermes:")
            lines.extend(f"- {line}" for line in profile_lines)
        else:
            lines.append("Memoria Hermes: no encontre lineas especificas de Vivi en el perfil cargado.")

        lines.append("")
        if user:
            lines.extend([
                "Cuenta ROVI:",
                f"- Email: {user.get('email')}",
                f"- Nombre: {user.get('name') or 'sin nombre'}",
                f"- Telefono: {user.get('phone') or 'sin telefono'}",
                f"- Tenant: {user.get('tenant_id')}",
                f"- Rol: {user.get('role') or 'broker'}",
                f"- Leads visibles en su tenant: {leads_count} ({open_count} abiertos)",
            ])
        else:
            lines.append("Cuenta ROVI: no encontre `vivi@rovicrm.com` en esta base.")

        lines.append("")
        if links:
            lines.append("Vinculaciones Telegram/MiniApp:")
            for item in links:
                telegram = item.get("telegram") or {}
                lines.append(
                    f"- {item.get('status')} · perfil {item.get('hermes_profile_name') or 'sin perfil'} · "
                    f"telegram_id {telegram.get('user_id') or 'sin telegram'}"
                )
        else:
            lines.append("Vinculaciones Telegram/MiniApp: no veo una vinculacion activa de Vivi con este bot.")

        lines.append("\nSi quieres, puedo vincular el Telegram de Vivi al bot o dejarla como usuaria demo visible en Flow Bot.")
        await self.send_message(chat_id, "\n".join(lines), reply_markup=self.main_menu_markup())

    async def draft_followup(self, chat_id: int, user: dict[str, Any], link: dict[str, Any], text: str) -> None:
        lead = await self.find_lead_by_text(user, link, text)
        if not lead:
            await self.send_message(chat_id, "No ubique el lead. Dime algo como: mensaje para Ana o mensaje para Carlos Medina.")
            return
        onboarding = link.get("agent_onboarding") or {}
        tone = (onboarding.get("tone") or "cercano y profesional").lower()
        name = str(lead.get("name") or "ahi").split()[0]
        interest = lead.get("raw_interest_text") or lead.get("property_interest") or lead.get("notes") or "lo que estas buscando"
        if "directo" in tone:
            message = f"Hola {name}, te doy seguimiento. Tengo presente {interest[:130]}. Me confirmas si sigue activa tu busqueda para pasarte opciones concretas hoy?"
        elif "lujo" in tone or "ejecutivo" in tone:
            message = f"Hola {name}, espero estes muy bien. Retomo tu busqueda para avanzar con opciones bien filtradas segun {interest[:120]}. Te parece si confirmamos presupuesto, zona y momento ideal?"
        else:
            message = f"Hola {name}, como estas? Te escribo para dar seguimiento a tu busqueda. Tengo presente {interest[:130]}. Me confirmas si sigue activa y vemos el siguiente paso?"
        await self.send_message(
            chat_id,
            f"Mensaje sugerido para {lead.get('name')}:\n\n{message}\n\nPuedes copiarlo o pedirme otro tono.",
        )

    async def update_lead_stage_from_text(self, chat_id: int, user: dict[str, Any], link: dict[str, Any], text: str) -> bool:
        stage = normalize_stage_from_text(text)
        if not stage:
            return False
        if not any(word in text.lower() for word in ("mueve", "mover", "avanza", "avanzar", "cambia", "pasalo", "pásalo")):
            return False
        lead = await self.find_lead_by_text(user, link, text)
        if not lead:
            await self.send_message(chat_id, "Puedo moverlo, pero necesito el nombre. Ej. mueve Ana a presentacion.")
            return True
        await self.db.leads.update_one(
            {"id": lead["id"], "tenant_id": link.get("tenant_id") or user.get("tenant_id")},
            {"$set": {"status": stage, "updated_at": now_iso()}},
        )
        await self.send_message(chat_id, f"Listo. Movi {lead.get('name') or 'el lead'} a {stage}.")
        return True

    async def create_task_from_text(self, chat_id: int, user: dict[str, Any], link: dict[str, Any], text: str) -> bool:
        haystack = text.lower()
        if not any(word in haystack for word in ("tarea", "recordatorio", "recuerdame", "recuérdame", "seguimiento")):
            return False
        lead = await self.find_lead_by_text(user, link, text)
        title = text
        if lead:
            title = f"Seguimiento: {lead.get('name')}"
        task = {
            "id": str(uuid.uuid4()),
            "tenant_id": link.get("tenant_id") or user.get("tenant_id"),
            "created_by": user["id"],
            "assigned_to": user["id"],
            "lead_id": lead.get("id") if lead else None,
            "title": title[:140],
            "priority": "alta" if any(word in haystack for word in ("hoy", "urgente")) else "media",
            "status": "pending",
            "due_at": None,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }
        await self.db.miniapp_tasks.insert_one(task)
        await self.send_message(chat_id, f"Tarea creada: {task['title']}")
        return True

    async def answer_agent(self, chat_id: int, user: dict[str, Any], link: dict[str, Any], text: str) -> None:
        state = await self.get_conversation_state(chat_id, user)
        if state.get("pending_action") == "confirm_capture" and is_affirmative(text):
            await self.capture_lead(chat_id, user, link, state.get("raw_text") or "")
            await self.set_conversation_state(chat_id, user, None)
            return

        if await self.update_lead_stage_from_text(chat_id, user, link, text):
            return
        if await self.create_task_from_text(chat_id, user, link, text):
            return

        haystack = text.lower()
        if looks_like_lead_text(text):
            await self.set_conversation_state(chat_id, user, {"pending_action": "confirm_capture", "raw_text": text})
            analysis = {
                "name": extract_name(text),
                "phone": extract_phone(text) or "sin telefono",
                "priority": classify_priority(text),
                "operation": "renta" if any(word in haystack for word in ("renta", "rent", "alquiler")) else "venta",
            }
            await self.send_message(
                chat_id,
                "Esto parece un prospecto.\n\n"
                f"Nombre: {analysis['name']}\n"
                f"Contacto: {analysis['phone']}\n"
                f"Operacion: {analysis['operation']}\n"
                f"Prioridad: {analysis['priority']}\n\n"
                "Lo guardo como lead en ROVI? Responde si o no.",
            )
            return

        query = lead_scope_query(user, link)
        hot_lead = await self.db.leads.find_one({**query, "priority": {"$in": ["alta", "urgente"]}}, {"_id": 0}, sort=[("updated_at", -1)])
        onboarding = link.get("agent_onboarding") or {}
        if any(word in haystack for word in ("resumen", "pipeline", "estatus", "como voy", "cómo voy", "metricas", "métricas")):
            await self.send_summary(chat_id, user, link)
            return
        if any(word in haystack for word in ("vivi", "viviana", "vmorentin")):
            await self.send_vivi_context(chat_id)
            return
        if any(phrase in haystack for phrase in ("quien se enfria", "quién se enfría", "se esta enfriando", "se está enfriando", "followups", "follow-ups criticos", "follow-ups críticos")):
            await self.send_cooling_leads(chat_id, user, link)
            return
        if any(phrase in haystack for phrase in ("cierre del dia", "cierre del día", "cerrar el dia", "cerrar el día")):
            await self.send_daily_close(chat_id, user, link)
            return
        if any(phrase in haystack for phrase in ("reporte gerente", "reporte para gerente", "reporte manager", "reporte para manager")):
            await self.send_manager_report(chat_id, user, link)
            return
        if any(phrase in haystack for phrase in ("como me ayudas", "cómo me ayudas", "que puedes hacer", "qué puedes hacer", "asistente", "ayudame", "ayúdame", "guia", "guía")):
            await self.send_daily_brief(chat_id, user, link)
            return
        if any(phrase in haystack for phrase in ("a quien contacto", "a quién contacto", "que hago", "qué hago", "que sigue", "qué sigue", "prioridad", "hoy")):
            await self.suggest_today(chat_id, user, link)
            return
        if any(word in haystack for word in ("mensaje", "whatsapp", "seguimiento", "texto")) and any(word in haystack for word in ("para", "a ", "lead", "cliente")):
            await self.draft_followup(chat_id, user, link, text)
            return
        if any(word in haystack for word in ("lead", "prospecto", "cliente")) and len(text) > 18:
            await self.send_message(
                chat_id,
                "Puedo ayudarte con ese lead. Si quieres guardarlo, mandame el texto completo del prospecto o di: crea lead Ana busca renta en Tulum presupuesto 45k.",
            )
            return

        total = await self.db.leads.count_documents(query)
        open_count = await self.db.leads.count_documents({**query, "status": {"$in": LEAD_STATUSES[:5]}})
        response = (
            f"{self.agent_positioning()}\n\n"
            f"Uso tu CRM para decidir y ejecutar: leads, pipeline, tareas, agenda, mensajes y cierre de ciclos.\n\n"
            f"Ahora veo {total} leads, {open_count} abiertos. "
        )
        if hot_lead:
            response += f"Mi prioridad ahora seria {hot_lead.get('name')}: {hot_lead.get('next_action') or 'dar seguimiento'}."
        else:
            response += "No veo urgentes ahora."
        if onboarding.get("tone"):
            response += f"\n\nTono configurado: {onboarding.get('tone')}."
        if self.profile_context_note():
            response += f"\n\n{self.profile_context_note()}"
        response += "\n\nPara aprovecharlo mejor, dime una intencion concreta:\n" + self.flow_action_menu()
        await self.send_message(chat_id, response, reply_markup=self.main_menu_markup())

    async def send_help(self, chat_id: int, user: dict[str, Any], link: dict[str, Any]) -> None:
        if self.is_flow_bot:
            await self.send_message(
                chat_id,
                f"Hola {first_name(user)}. Soy ROVI Flow Bot.\n\n"
                "Trabajo como segunda memoria comercial: bajo ruido, ordeno leads y convierto conversaciones en acciones.\n\n"
                "Mis modos principales:\n"
                "- Captura: convierto texto libre en lead.\n"
                "- Prioridad: te digo a quien contactar primero.\n"
                "- Follow-up: detecto quien se enfria.\n"
                "- Next Action: ningun lead queda sin siguiente paso.\n"
                "- Flow Guardian: te propongo bloques cortos de accion.\n"
                "- Manager: preparo reporte breve.\n\n"
                "Tambien puedo mostrar contexto del equipo: preguntame `info de Vivi`.\n\n"
                f"{self.flow_action_menu()}\n\n"
                "Atajos: /dia, /perfil, /resumen, /leads, /agenda, /onboarding.\n\n"
                f"MiniApp: {MINIAPP_URL}",
                reply_markup=self.main_menu_markup(),
            )
            return
        await self.send_message(
            chat_id,
            f"Hola {first_name(user)}. Soy tu asistente diario de broker conectado a ROVI CRM.\n\n"
            "Te ayudo a convertir informacion en accion:\n"
            "- Priorizar a quien contactar primero.\n"
            "- Redactar WhatsApps con contexto del lead.\n"
            "- Capturar prospectos que te llegan por Telegram o WhatsApp.\n"
            "- Mantener limpio tu pipeline.\n"
            "- Crear tareas de seguimiento.\n"
            "- Revisar agenda y preparar tu dia.\n\n"
            "Puedes escribirme natural:\n"
            "que sigue hoy, mensaje para Ana, captura este prospecto, mueve Carlos a presentacion.\n\n"
            "Atajos: /dia, /perfil, /resumen, /leads, /agenda, /onboarding.\n\n"
            f"MiniApp: {MINIAPP_URL}",
            reply_markup=self.main_menu_markup(),
        )

    async def send_link_required(self, chat_id: int) -> None:
        await self.send_message(
            chat_id,
            "Todavia no tengo una cuenta ROVI vinculada para este Telegram.\n\n"
            "Puedes vincular de dos formas:\n"
            "1. Escribe /vincular tu@email.com y valida con tu telefono de Telegram.\n"
            "2. Abre la MiniApp e inicia sesion con ROVI.\n\n"
            "Por seguridad, no me mandes tu password por este chat.",
            reply_markup={
                "inline_keyboard": [[
                    {"text": "Conectar ROVI", "web_app": {"url": MINIAPP_URL}},
                    {"text": "Abrir web", "url": MINIAPP_URL},
                ]]
            },
        )

    def main_menu_markup(self) -> dict[str, Any]:
        return {
            "inline_keyboard": [
                [
                    {"text": "MiniApp", "web_app": {"url": MINIAPP_URL}},
                    {"text": "Mi dia", "callback_data": "/dia"},
                ],
                [
                    {"text": "Leads", "callback_data": "/leads"},
                    {"text": "Resumen", "callback_data": "/resumen"},
                ],
            ]
        }

    async def send_message(self, chat_id: int, text: str, reply_markup: dict[str, Any] | None = None) -> None:
        payload: dict[str, Any] = {
            "chat_id": chat_id,
            "text": text[:3900],
            "disable_web_page_preview": True,
        }
        if reply_markup:
            payload["reply_markup"] = reply_markup
        response = await self.http.post(f"{self.api_base}/sendMessage", json=payload)
        if response.status_code >= 400:
            logger.warning("sendMessage fallo %s: %s", response.status_code, response.text[:500])

    async def answer_callback(self, callback_query_id: str | None) -> None:
        if callback_query_id:
            await self.http.post(f"{self.api_base}/answerCallbackQuery", json={"callback_query_id": callback_query_id})


def install_signal_handlers() -> None:
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, shutdown_event.set)


async def main() -> None:
    install_signal_handlers()
    agent = TelegramAgent()
    try:
        await agent.run()
    finally:
        await agent.close()


if __name__ == "__main__":
    asyncio.run(main())
