"""Tests unitarios del TelegramPollingManager (sin red ni Mongo).

Las llamadas HTTP a Telegram se reemplazan por stubs scripted y la base de
datos por colecciones fake en memoria.
"""

import asyncio

from telegram_polling import TelegramConflictError, TelegramPollingManager

# ---------------------------------------------------------------------------
# Fakes
# ---------------------------------------------------------------------------


class FakeStateCollection:
    def __init__(self):
        self.docs = {}

    async def find_one(self, query, projection=None):
        return self.docs.get(query.get("bot_key"))

    async def update_one(self, query, update, upsert=False):
        doc = self.docs.setdefault(query["bot_key"], {"bot_key": query["bot_key"]})
        doc.update(update.get("$set", {}))


class FakeCursor:
    def __init__(self, items):
        self.items = items

    async def to_list(self, length):
        return list(self.items[:length])


class FakeProfilesCollection:
    def __init__(self, profiles=None):
        self.profiles = profiles or []

    def find(self, query, projection=None):
        return FakeCursor(self.profiles)


class FakeDB:
    def __init__(self, profiles=None):
        self.telegram_polling_state = FakeStateCollection()
        self.telegram_agent_profiles = FakeProfilesCollection(profiles)


class ScriptedTelegram:
    """Simula getUpdates/deleteWebhook: entrega lotes programados y luego se
    queda parqueado (long polling sin tráfico) hasta que cancelen el loop."""

    def __init__(self, batches_by_token=None):
        self.batches = {
            token: list(batches) for token, batches in (batches_by_token or {}).items()
        }
        self.get_calls = []
        self.delete_calls = []

    async def get_updates(self, token, offset):
        self.get_calls.append((token, offset))
        pending = self.batches.get(token) or []
        if pending:
            item = pending.pop(0)
            if isinstance(item, Exception):
                raise item
            return item
        await asyncio.sleep(3600)
        return []

    async def delete_webhook(self, token):
        self.delete_calls.append(token)


def make_manager(
    db, telegram, *, dispatched=None, profile_dispatched=None, refresh=0.05
):
    dispatched = dispatched if dispatched is not None else []
    profile_dispatched = profile_dispatched if profile_dispatched is not None else []

    async def rovi_dispatch(update):
        dispatched.append(update)
        return {"ok": True}

    async def profile_dispatch(profile_id, update):
        profile_dispatched.append((profile_id, update))
        return {"ok": True}

    manager = TelegramPollingManager(
        db,
        rovi_token_getter=lambda: "rovi-token",
        rovi_dispatch=rovi_dispatch,
        profile_dispatch=profile_dispatch,
        poll_timeout_seconds=1,
        profiles_refresh_seconds=refresh,
    )
    manager._telegram_get_updates = telegram.get_updates
    manager._telegram_delete_webhook = telegram.delete_webhook
    return manager


async def wait_until(predicate, timeout=2.0):
    deadline = asyncio.get_event_loop().time() + timeout
    while asyncio.get_event_loop().time() < deadline:
        if predicate():
            return True
        await asyncio.sleep(0.01)
    return predicate()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_start_es_noop_en_modo_webhook(monkeypatch):
    monkeypatch.setenv("TELEGRAM_UPDATE_MODE", "webhook")

    async def scenario():
        manager = make_manager(FakeDB(), ScriptedTelegram())
        await manager.start()
        assert not manager.is_running
        await manager.stop()

    asyncio.run(scenario())


def test_polling_despacha_updates_y_persiste_offset(monkeypatch):
    monkeypatch.setenv("TELEGRAM_UPDATE_MODE", "polling")
    updates = [
        {"update_id": 100, "message": {"text": "hola"}},
        {"update_id": 101, "message": {"text": "qué leads tengo"}},
    ]
    telegram = ScriptedTelegram({"rovi-token": [updates]})
    db = FakeDB()
    dispatched = []

    async def scenario():
        manager = make_manager(db, telegram, dispatched=dispatched)
        await manager.start()
        assert manager.is_running
        assert await wait_until(lambda: len(dispatched) == 2)
        assert await wait_until(
            lambda: (db.telegram_polling_state.docs.get("rovi-agent") or {}).get(
                "next_offset"
            )
            == 102
        )
        await manager.stop()

    asyncio.run(scenario())
    assert dispatched == updates
    assert telegram.delete_calls.count("rovi-token") >= 1
    # El siguiente getUpdates debe pedir desde el offset confirmado
    assert (("rovi-token", 102) in telegram.get_calls) or telegram.get_calls[-1][
        1
    ] == 102


def test_polling_arranca_loop_por_perfil_y_omite_token_duplicado(monkeypatch):
    monkeypatch.setenv("TELEGRAM_UPDATE_MODE", "polling")
    profiles = [
        {"id": "profile-1", "telegram_bot_token": "profile-token", "name": "Broker"},
        {"id": "profile-2", "telegram_bot_token": "rovi-token", "name": "Duplicado"},
    ]
    update = {"update_id": 7, "message": {"text": "hola"}}
    telegram = ScriptedTelegram({"profile-token": [[update]]})
    db = FakeDB(profiles=profiles)
    profile_dispatched = []

    async def scenario():
        manager = make_manager(db, telegram, profile_dispatched=profile_dispatched)
        desired = await manager._discover_bots()
        assert set(desired.keys()) == {"rovi-agent", "profile:profile-1"}
        await manager.start()
        assert await wait_until(lambda: profile_dispatched == [("profile-1", update)])
        await manager.stop()

    asyncio.run(scenario())
    assert "profile-token" in telegram.delete_calls


def test_conflicto_409_reintenta_delete_webhook(monkeypatch):
    monkeypatch.setenv("TELEGRAM_UPDATE_MODE", "polling")
    update = {"update_id": 1, "message": {"text": "hola"}}
    telegram = ScriptedTelegram(
        {
            "rovi-token": [TelegramConflictError("conflict"), [update]],
        }
    )
    db = FakeDB()
    dispatched = []

    async def scenario():
        manager = make_manager(db, telegram, dispatched=dispatched)
        await manager.start()
        # Tras el 409 el loop espera ~1s, vuelve a borrar el webhook y reintenta
        assert await wait_until(lambda: len(dispatched) == 1, timeout=4.0)
        await manager.stop()

    asyncio.run(scenario())
    assert telegram.delete_calls.count("rovi-token") >= 2


def test_error_de_dispatch_no_bloquea_el_offset(monkeypatch):
    monkeypatch.setenv("TELEGRAM_UPDATE_MODE", "polling")
    updates = [
        {"update_id": 10, "message": {"text": "explota"}},
        {"update_id": 11, "message": {"text": "sigue"}},
    ]
    telegram = ScriptedTelegram({"rovi-token": [updates]})
    db = FakeDB()
    processed = []

    async def rovi_dispatch(update):
        if update["update_id"] == 10:
            raise RuntimeError("boom")
        processed.append(update["update_id"])

    async def scenario():
        manager = TelegramPollingManager(
            db,
            rovi_token_getter=lambda: "rovi-token",
            rovi_dispatch=rovi_dispatch,
            profile_dispatch=lambda pid, u: None,
            poll_timeout_seconds=1,
            profiles_refresh_seconds=0.05,
        )
        manager._telegram_get_updates = telegram.get_updates
        manager._telegram_delete_webhook = telegram.delete_webhook
        await manager.start()
        assert await wait_until(lambda: processed == [11])
        assert await wait_until(
            lambda: (db.telegram_polling_state.docs.get("rovi-agent") or {}).get(
                "next_offset"
            )
            == 12
        )
        await manager.stop()

    asyncio.run(scenario())


def test_stop_cancela_supervisor_y_loops(monkeypatch):
    monkeypatch.setenv("TELEGRAM_UPDATE_MODE", "polling")
    telegram = ScriptedTelegram()
    db = FakeDB(profiles=[{"id": "p1", "telegram_bot_token": "tok-1", "name": "X"}])

    async def scenario():
        manager = make_manager(db, telegram)
        await manager.start()
        assert await wait_until(lambda: len(manager._loops) == 2)
        await manager.stop()
        assert not manager.is_running
        assert manager._loops == {}

    asyncio.run(scenario())
