"""Tests unitarios de la validación multi-token del initData de la MiniApp.

Genera initData firmado (HMAC WebAppData, igual que Telegram) y prueba que
la validación acepta si CUALQUIER bot configurado valida (F10 de
docs/MINIAPP_SPEC.md), sin Mongo (perfiles simulados con FakeDB).
"""

import asyncio
import hashlib
import hmac
import json
import time
from urllib.parse import urlencode

import pytest
from fastapi import HTTPException

PRIMARY_TOKEN = "111111:primary-bot-token"
TEAM_TOKEN = "222222:team-bot-token"
OTHER_TOKEN = "333333:other-bot-token"


def build_init_data(
    bot_token: str, telegram_user_id: int = 12345, auth_date: int | None = None
) -> str:
    fields = {
        "auth_date": str(auth_date if auth_date is not None else int(time.time())),
        "query_id": "AAEtest",
        "user": json.dumps({"id": telegram_user_id, "first_name": "Test"}),
    }
    data_check_string = "\n".join(
        f"{key}={value}" for key, value in sorted(fields.items())
    )
    secret_key = hmac.new(
        b"WebAppData", bot_token.encode("utf-8"), hashlib.sha256
    ).digest()
    fields["hash"] = hmac.new(
        secret_key, data_check_string.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    return urlencode(fields)


def candidates(*pairs):
    return [{"label": label, "token": token} for label, token in pairs]


def run(coro):
    return asyncio.run(coro)


def test_valida_con_el_token_primario(app):
    import server

    result = server.validate_telegram_webapp_init_data(
        build_init_data(PRIMARY_TOKEN),
        candidates(("env:ROVI_TELEGRAM_BOT_TOKEN", PRIMARY_TOKEN)),
    )
    assert result["user"]["id"] == 12345
    assert result["validated_bot"]["label"] == "env:ROVI_TELEGRAM_BOT_TOKEN"
    assert "token" not in result["validated_bot"]


def test_acepta_si_cualquier_token_valida_y_reporta_cual(app):
    import server

    result = server.validate_telegram_webapp_init_data(
        build_init_data(TEAM_TOKEN),
        candidates(
            ("env:ROVI_TELEGRAM_BOT_TOKEN", PRIMARY_TOKEN),
            ("profile:team-bot", TEAM_TOKEN),
        ),
    )
    assert result["validated_bot"]["label"] == "profile:team-bot"


def test_rechaza_401_si_ningun_token_valida(app):
    import server

    with pytest.raises(HTTPException) as exc:
        server.validate_telegram_webapp_init_data(
            build_init_data(OTHER_TOKEN),
            candidates(
                ("env:ROVI_TELEGRAM_BOT_TOKEN", PRIMARY_TOKEN),
                ("profile:team-bot", TEAM_TOKEN),
            ),
        )
    assert exc.value.status_code == 401


def test_400_sin_hash_y_503_sin_tokens(app):
    import server

    with pytest.raises(HTTPException) as exc:
        server.validate_telegram_webapp_init_data(
            "auth_date=123&user=%7B%7D",
            candidates(("env:ROVI_TELEGRAM_BOT_TOKEN", PRIMARY_TOKEN)),
        )
    assert exc.value.status_code == 400

    with pytest.raises(HTTPException) as exc:
        server.validate_telegram_webapp_init_data(build_init_data(PRIMARY_TOKEN), [])
    assert exc.value.status_code == 503


def test_401_con_auth_date_mayor_a_24h(app):
    import server

    stale = int(time.time()) - 90000  # > 86400s
    with pytest.raises(HTTPException) as exc:
        server.validate_telegram_webapp_init_data(
            build_init_data(PRIMARY_TOKEN, auth_date=stale),
            candidates(("env:ROVI_TELEGRAM_BOT_TOKEN", PRIMARY_TOKEN)),
        )
    assert exc.value.status_code == 401


def test_collect_env_tokens_incluye_per_role_y_dedup(app, monkeypatch):
    import server

    monkeypatch.setenv("ROVI_TELEGRAM_BOT_TOKEN", PRIMARY_TOKEN)
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", PRIMARY_TOKEN)  # duplicado → 1 sola vez
    monkeypatch.setenv("ROVI_BROKER_TELEGRAM_BOT_TOKEN", TEAM_TOKEN)
    tokens = server.collect_telegram_webapp_env_bot_tokens()
    values = [item["token"] for item in tokens]
    assert values.count(PRIMARY_TOKEN) == 1
    assert TEAM_TOKEN in values
    labels = {item["label"] for item in tokens}
    assert "env:ROVI_BROKER_TELEGRAM_BOT_TOKEN" in labels


class _FakeCursor:
    def __init__(self, docs):
        self.docs = docs

    def to_list(self, length):
        async def _inner():
            return [dict(doc) for doc in self.docs[:length]]

        return _inner()


class _FakeProfiles:
    def __init__(self, docs):
        self.docs = docs

    def find(self, query, projection=None):
        matched = [
            doc
            for doc in self.docs
            if doc.get("is_active") is True
            and (doc.get("telegram_bot_token") or "").strip()
        ]
        return _FakeCursor(matched)


class _FakeDB:
    def __init__(self, profiles):
        self.telegram_agent_profiles = _FakeProfiles(profiles)


def test_any_bot_valida_con_token_de_perfil_de_equipo(app, monkeypatch):
    import server

    monkeypatch.setenv("ROVI_TELEGRAM_BOT_TOKEN", PRIMARY_TOKEN)
    monkeypatch.setattr(
        server,
        "db",
        _FakeDB(
            [
                {
                    "id": "profile-team",
                    "role_scope": "broker",
                    "multi_role": True,
                    "is_active": True,
                    "telegram_bot_token": TEAM_TOKEN,
                },
            ]
        ),
    )
    result = run(
        server.validate_telegram_webapp_init_data_any_bot(build_init_data(TEAM_TOKEN))
    )
    assert result["validated_bot"]["label"] == "profile:profile-team"
    assert result["validated_bot"]["multi_role"] is True
