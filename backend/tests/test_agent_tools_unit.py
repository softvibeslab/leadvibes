"""Tests unitarios de las herramientas CRM ejecutables del agente.

Cubren: filtrado de herramientas por rol/perfil, scoping de queries,
autopilot (superpoder crm_remote_control) vs confirmación pendiente, y el
loop de tool calling de run_agent_turn con un modelo simulado.
"""

import asyncio
import json

import agent_control
from agent_control import (
    AgentRunRequest,
    agent_autopilot_enabled,
    available_agent_tools,
    execute_agent_tool,
    register_agent_action_executor,
    run_agent_turn,
    scoped_entity_query,
)

# ---------------------------------------------------------------------------
# Fakes
# ---------------------------------------------------------------------------


class FakeCursor:
    def __init__(self, docs):
        self.docs = docs

    def sort(self, *args, **kwargs):
        return self

    def limit(self, *args):
        return self

    async def to_list(self, length):
        return [dict(d) for d in self.docs[:length]]


class FakeCollection:
    def __init__(self):
        self.docs = []
        self.queries = []
        self.inserted = []
        self.updates = []

    def find(self, query, projection=None):
        self.queries.append(query)
        return FakeCursor(self.docs)

    async def find_one(self, query, projection=None):
        self.queries.append(query)
        return dict(self.docs[0]) if self.docs else None

    async def insert_one(self, doc):
        self.inserted.append(dict(doc))
        self.docs.append(dict(doc))

    async def insert_many(self, docs):
        for doc in docs:
            await self.insert_one(doc)

    async def update_one(self, query, update, upsert=False):
        self.updates.append((query, update))

    async def aggregate(self, pipeline):
        return FakeCursor([])

    async def count_documents(self, query):
        return len(self.docs)


class FakeDB:
    def __init__(self):
        self._cols = {}

    def __getattr__(self, name):
        cols = object.__getattribute__(self, "_cols")
        if name not in cols:
            cols[name] = FakeCollection()
        return cols[name]


USER = {"user_id": "user-1", "tenant_id": "tenant-1", "active_tenant_id": "tenant-1"}


def run(coro):
    return asyncio.run(coro)


# ---------------------------------------------------------------------------
# Filtrado de herramientas por rol y perfil
# ---------------------------------------------------------------------------


def test_broker_obtiene_herramientas_segun_allowed_crud():
    names = {spec["name"] for spec in available_agent_tools("broker", {})}
    assert "buscar_leads" in names
    assert "crear_lead" in names
    assert "actualizar_lead" in names
    assert "crear_tarea" in names
    assert "buscar_propiedades" in names


def test_rol_sin_politica_no_recibe_herramientas():
    assert available_agent_tools("rol_inexistente_xyz", {}) == []


def test_perfil_puede_apagar_entidad():
    config = {"tools": {"leads": False}}
    names = {spec["name"] for spec in available_agent_tools("broker", config)}
    assert "buscar_leads" not in names
    assert "crear_lead" not in names
    assert "crear_tarea" in names


def test_superpoder_autopilot_por_skill():
    assert agent_autopilot_enabled({"enabled_skills": ["crm_remote_control"]}) is True
    assert agent_autopilot_enabled({"enabled_skills": ["lead_triage"]}) is False
    assert agent_autopilot_enabled({}) is False


# ---------------------------------------------------------------------------
# Scoping de queries
# ---------------------------------------------------------------------------


def test_broker_solo_ve_sus_leads():
    query = scoped_entity_query("leads", USER, "broker")
    assert query["tenant_id"] == "tenant-1"
    assert {"created_by": "user-1"} in query["$or"]
    assert {"assigned_broker_id": "user-1"} in query["$or"]


def test_agency_admin_ve_todo_el_tenant():
    query = scoped_entity_query("leads", USER, "agency_admin")
    assert query == {"tenant_id": "tenant-1"}


def test_buscar_leads_aplica_scoping_en_query():
    db = FakeDB()

    async def scenario():
        return await execute_agent_tool(
            db,
            name="buscar_leads",
            arguments={"query": "Juan", "status": "nuevo"},
            current_user=USER,
            role_scope="broker",
            config={},
        )

    result = run(scenario())
    assert result["ok"] is True
    sent_query = db.leads.queries[0]
    assert sent_query["tenant_id"] == "tenant-1"
    assert "$or" in sent_query  # visibilidad del broker
    assert sent_query["status"] == "nuevo"


# ---------------------------------------------------------------------------
# Escrituras: autopilot vs confirmación
# ---------------------------------------------------------------------------


def test_crear_lead_con_superpoder_ejecuta_directo():
    db = FakeDB()
    executed = []

    async def fake_executor(action):
        executed.append(action)
        return {"executed": True, "message": "Listo", "record_ids": ["lead-1"]}

    register_agent_action_executor(fake_executor)
    try:

        async def scenario():
            return await execute_agent_tool(
                db,
                name="crear_lead",
                arguments={"name": "Juan Pérez", "phone": "+529981234567"},
                current_user=USER,
                role_scope="broker",
                config={"enabled_skills": ["crm_remote_control"]},
                channel_context={"chat_id": "123", "link_id": "link-1"},
                requested_text="crea un lead para Juan",
            )

        result = run(scenario())
    finally:
        register_agent_action_executor(None)

    assert result["executed"] is True
    assert result["record_ids"] == ["lead-1"]
    assert len(executed) == 1
    action = db.telegram_agent_pending_actions.inserted[0]
    assert action["status"] == "ready_to_execute"
    assert action["type"] == "create_lead"
    assert action["tenant_id"] == "tenant-1"
    assert action["chat_id"] == "123"
    assert action["payload"]["lead"]["phone"] == "+529981234567"


def test_crear_lead_sin_superpoder_queda_pendiente():
    db = FakeDB()
    executed = []

    async def fake_executor(action):
        executed.append(action)
        return {"executed": True}

    register_agent_action_executor(fake_executor)
    try:

        async def scenario():
            return await execute_agent_tool(
                db,
                name="crear_lead",
                arguments={"name": "Ana", "phone": "+5215512345678"},
                current_user=USER,
                role_scope="broker",
                config={"enabled_skills": ["lead_triage"]},
            )

        result = run(scenario())
    finally:
        register_agent_action_executor(None)

    assert result["executed"] is False
    assert result["status"] == "pending_confirmation"
    assert executed == []
    action = db.telegram_agent_pending_actions.inserted[0]
    assert action["status"] == "pending_confirmation"


def test_crear_lead_sin_telefono_falla():
    db = FakeDB()

    async def scenario():
        return await execute_agent_tool(
            db,
            name="crear_lead",
            arguments={"name": "Sin Teléfono"},
            current_user=USER,
            role_scope="broker",
            config={},
        )

    result = run(scenario())
    assert result["ok"] is False
    assert db.telegram_agent_pending_actions.inserted == []


def test_actualizar_lead_ambiguo_regresa_candidatos():
    db = FakeDB()
    db.leads.docs = [
        {"id": "l1", "name": "Juan Pérez", "phone": "111", "status": "nuevo"},
        {"id": "l2", "name": "Juan García", "phone": "222", "status": "contactado"},
    ]

    async def scenario():
        return await execute_agent_tool(
            db,
            name="actualizar_lead",
            arguments={"lead_query": "Juan", "status": "contactado"},
            current_user=USER,
            role_scope="broker",
            config={},
        )

    result = run(scenario())
    assert result["ok"] is False
    assert len(result["candidates"]) == 2
    assert db.telegram_agent_pending_actions.inserted == []


def test_actualizar_lead_unico_prepara_accion():
    db = FakeDB()
    db.leads.docs = [
        {"id": "l1", "name": "Juan Pérez", "phone": "111", "status": "nuevo"}
    ]

    async def scenario():
        return await execute_agent_tool(
            db,
            name="actualizar_lead",
            arguments={
                "lead_query": "Juan",
                "status": "contactado",
                "notes": "Llamó hoy",
            },
            current_user=USER,
            role_scope="broker",
            config={},
        )

    result = run(scenario())
    assert result["status"] == "pending_confirmation"
    action = db.telegram_agent_pending_actions.inserted[0]
    assert action["type"] == "update_lead"
    assert action["payload"]["lead_id"] == "l1"
    assert action["payload"]["update"]["status"] == "contactado"


# ---------------------------------------------------------------------------
# Loop de tool calling en run_agent_turn
# ---------------------------------------------------------------------------


def test_run_agent_turn_ejecuta_tools_y_responde(monkeypatch):
    db = FakeDB()
    executed = []

    async def fake_executor(action):
        executed.append(action)
        return {"executed": True, "message": "Tarea creada", "record_ids": ["task-9"]}

    tool_call = {
        "id": "call-1",
        "function": {
            "name": "crear_tarea",
            "arguments": json.dumps({"title": "Llamar a Juan mañana"}),
        },
    }
    responses = [
        {
            "content": "",
            "tool_calls": [tool_call],
            "assistant_message": {
                "role": "assistant",
                "content": None,
                "tool_calls": [tool_call],
            },
            "usage": {},
        },
        {"content": "Listo, creé la tarea para mañana.", "usage": {}},
    ]

    async def fake_call_model(messages, config, session_id, tools=None):
        assert tools, "el loop debe enviar las herramientas al modelo"
        return responses.pop(0)

    monkeypatch.setattr(agent_control, "call_model", fake_call_model)
    register_agent_action_executor(fake_executor)
    try:
        config_override = {
            "id": "cfg-test",
            "role_scope": "broker",
            "system_prompt": "Eres el agente broker.",
            "provider": "chat.z",
            "model": "glm-5",
            "temperature": 0.2,
            "tools": {},
            "enabled_skills": ["crm_remote_control"],
            "knowledge_enabled": False,
        }

        async def scenario():
            return await run_agent_turn(
                db,
                AgentRunRequest(
                    message="créame una tarea para llamar a Juan mañana",
                    include_context=False,
                    role_scope="broker",
                ),
                USER,
                source="test",
                config_override=config_override,
                channel_context={"chat_id": "777", "link_id": "link-7"},
            )

        result = run(scenario())
    finally:
        register_agent_action_executor(None)

    assert result["success"] is True
    assert result["response"] == "Listo, creé la tarea para mañana."
    assert result["tools_executed"] == [
        {"tool": "crear_tarea", "ok": True, "executed": True, "record_ids": ["task-9"]}
    ]
    assert len(executed) == 1
    assert executed[0]["chat_id"] == "777"
    # el run quedó registrado con el resumen de herramientas
    run_doc = db.agent_runs.inserted[0]
    assert run_doc["context_summary"]["tools_executed"][0]["tool"] == "crear_tarea"
