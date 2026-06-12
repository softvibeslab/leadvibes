"""Tests unitarios de la memoria personal por usuario (paso 4 de la unificación).

Cubren: adjuntar memoria/preferencias/notas al config del agente, su render en
el system prompt, y la herramienta recordar_dato gateada por la skill
personal_memory_builder.
"""

import asyncio

from agent_control import (
    attach_user_agent_context,
    available_agent_tools,
    build_agent_messages,
    execute_agent_tool,
    resolve_agent_runtime_config,
)

# ---------------------------------------------------------------------------
# Fakes
# ---------------------------------------------------------------------------


class FakeCollection:
    def __init__(self, docs=None):
        self.docs = [dict(d) for d in (docs or [])]
        self.updates = []

    async def find_one(self, query, projection=None):
        for doc in self.docs:
            if all(doc.get(k) == v for k, v in query.items() if not k.startswith("$")):
                return dict(doc)
        return None

    async def update_one(self, query, update, upsert=False):
        self.updates.append({"query": query, "update": update, "upsert": upsert})


class FakeDB:
    def __init__(self, **collections):
        self._cols = {name: FakeCollection(docs) for name, docs in collections.items()}

    def __getattr__(self, name):
        cols = object.__getattribute__(self, "_cols")
        if name not in cols:
            cols[name] = FakeCollection()
        return cols[name]


USER = {"user_id": "user-1", "tenant_id": "tenant-1", "active_tenant_id": "tenant-1"}

SETTINGS = {
    "tenant_id": "tenant-1",
    "user_id": "user-1",
    "role_scope": "broker",
    "is_active": True,
    "memory": {"horario_visitas": "solo por las tardes", "zona": "Aldea Zama"},
    "preferences": {"idioma": "español informal"},
    "notes": "Broker top performer, prefiere mensajes cortos",
}


def run(coro):
    return asyncio.run(coro)


# ---------------------------------------------------------------------------
# Adjuntar memoria al config
# ---------------------------------------------------------------------------


def test_attach_agrega_memoria_preferencias_y_notas():
    db = FakeDB(agent_user_settings=[SETTINGS])
    config = run(attach_user_agent_context(db, {"system_prompt": "X"}, "broker", USER))
    assert config["user_memory"]["horario_visitas"] == "solo por las tardes"
    assert config["user_preferences"]["idioma"] == "español informal"
    assert "top performer" in config["user_notes"]
    assert config["_user_context_loaded"] is True


def test_attach_es_idempotente():
    db = FakeDB(agent_user_settings=[SETTINGS])
    config = {"system_prompt": "X", "_user_context_loaded": True}
    result = run(attach_user_agent_context(db, config, "broker", USER))
    assert "user_memory" not in result


def test_resolver_tambien_adjunta_memoria():
    base = {
        "id": "agent-config-broker",
        "role_scope": "broker",
        "is_active": True,
        "system_prompt": "BASE",
        "tools": {},
    }
    db = FakeDB(agent_configs=[base], agent_user_settings=[SETTINGS])
    config = run(resolve_agent_runtime_config(db, "broker", USER))
    assert config["user_memory"]["zona"] == "Aldea Zama"
    assert config["_user_context_loaded"] is True


def test_settings_inactivos_no_adjuntan_memoria():
    inactive = {**SETTINGS, "is_active": False}
    db = FakeDB(agent_user_settings=[inactive])
    config = run(attach_user_agent_context(db, {}, "broker", USER))
    assert "user_memory" not in config


# ---------------------------------------------------------------------------
# Render en el system prompt
# ---------------------------------------------------------------------------


def test_system_prompt_incluye_memoria_personal():
    config = {
        "system_prompt": "Eres el agente broker.",
        "user_memory": {"horario_visitas": "solo por las tardes"},
        "user_preferences": {"idioma": "español informal"},
        "user_notes": "prefiere mensajes cortos",
    }
    messages = build_agent_messages(config, "hola", {}, [])
    system = messages[0]["content"]
    assert "Memoria personal de ESTE usuario" in system
    assert "horario_visitas: solo por las tardes" in system
    assert "(preferencia) idioma: español informal" in system
    assert "(notas del admin) prefiere mensajes cortos" in system


def test_system_prompt_sin_memoria_no_agrega_seccion():
    messages = build_agent_messages({"system_prompt": "X"}, "hola", {}, [])
    assert "Memoria personal" not in messages[0]["content"]


# ---------------------------------------------------------------------------
# Herramienta recordar_dato
# ---------------------------------------------------------------------------


def test_recordar_dato_requiere_skill():
    con_skill = {"enabled_skills": ["personal_memory_builder"]}
    sin_skill = {"enabled_skills": ["lead_triage"]}
    assert "recordar_dato" in {
        s["name"] for s in available_agent_tools("broker", con_skill)
    }
    assert "recordar_dato" not in {
        s["name"] for s in available_agent_tools("broker", sin_skill)
    }


def test_recordar_dato_guarda_en_settings():
    db = FakeDB()

    async def scenario():
        return await execute_agent_tool(
            db,
            name="recordar_dato",
            arguments={"clave": "Horario Visitas!", "valor": "solo por las tardes"},
            current_user=USER,
            role_scope="broker",
            config={"enabled_skills": ["personal_memory_builder"]},
        )

    result = run(scenario())
    assert result["ok"] is True
    update = db.agent_user_settings.updates[0]
    assert update["query"] == {
        "tenant_id": "tenant-1",
        "user_id": "user-1",
        "role_scope": "broker",
    }
    # clave sanitizada a snake_case
    assert update["update"]["$set"]["memory.horario_visitas"] == "solo por las tardes"
    assert update["upsert"] is True


def test_recordar_dato_sin_valor_falla():
    db = FakeDB()

    async def scenario():
        return await execute_agent_tool(
            db,
            name="recordar_dato",
            arguments={"clave": "x", "valor": "  "},
            current_user=USER,
            role_scope="broker",
            config={},
        )

    result = run(scenario())
    assert result["ok"] is False
    assert db.agent_user_settings.updates == []
