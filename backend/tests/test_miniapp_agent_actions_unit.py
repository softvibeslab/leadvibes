"""Tests unitarios de los endpoints MiniApp de acciones pendientes del agente.

GET /api/telegram-miniapp/agent-actions, POST .../confirm y POST .../cancel,
con TestClient y un FakeDB en memoria (sin Mongo). El JWT es real (auth.py),
solo se simula la base.
"""

from datetime import datetime, timedelta, timezone

import pytest

from auth import create_access_token

# ---------------------------------------------------------------------------
# Fake Mongo (matching mínimo para las queries usadas por estos endpoints)
# ---------------------------------------------------------------------------


def _normalize_dt(value):
    if isinstance(value, datetime) and value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _matches(doc, query):
    for key, expected in query.items():
        if key == "$or":
            if not any(_matches(doc, cond) for cond in expected):
                return False
            continue
        if key == "$and":
            if not all(_matches(doc, cond) for cond in expected):
                return False
            continue
        value = doc.get(key)
        if isinstance(expected, dict) and any(
            str(op).startswith("$") for op in expected
        ):
            for op, operand in expected.items():
                if op == "$gt":
                    left, right = _normalize_dt(value), _normalize_dt(operand)
                    if left is None or not left > right:
                        return False
                elif op == "$ne":
                    if value == operand:
                        return False
                elif op == "$in":
                    if value not in operand:
                        return False
                elif op == "$nin":
                    if value in operand:
                        return False
                elif op == "$regex":
                    continue  # no usado en asserts de estos tests
                else:
                    return False
        elif value != expected:
            return False
    return True


class FakeCursor:
    def __init__(self, docs):
        self.docs = docs

    def sort(self, *args, **kwargs):
        return self

    def skip(self, n):
        self.docs = self.docs[n:]
        return self

    def limit(self, n):
        self.docs = self.docs[:n]
        return self

    async def to_list(self, length=None):
        return [dict(doc) for doc in (self.docs[:length] if length else self.docs)]


class FakeCollection:
    def __init__(self):
        self.docs = []

    def find(self, query=None, projection=None):
        return FakeCursor([dict(d) for d in self.docs if _matches(d, query or {})])

    async def find_one(self, query=None, projection=None, sort=None):
        for doc in self.docs:
            if _matches(doc, query or {}):
                return dict(doc)
        return None

    async def insert_one(self, doc):
        self.docs.append(dict(doc))

    async def insert_many(self, docs):
        for doc in docs:
            await self.insert_one(doc)

    async def update_one(self, query, update, upsert=False):
        for doc in self.docs:
            if _matches(doc, query):
                doc.update(update.get("$set", {}))

                class R:
                    matched_count = 1
                    modified_count = 1

                return R()
        if upsert:
            await self.insert_one(
                {
                    **{k: v for k, v in query.items() if not str(k).startswith("$")},
                    **update.get("$set", {}),
                }
            )

        class R:
            matched_count = 0
            modified_count = 0

        return R()

    async def find_one_and_update(
        self, query, update, return_document=False, **kwargs
    ):
        for doc in self.docs:
            if _matches(doc, query):
                pre = dict(doc)
                doc.update(update.get("$set", {}))
                return doc if return_document else pre
        return None

    async def count_documents(self, query=None):
        return len([d for d in self.docs if _matches(d, query or {})])

    def aggregate(self, pipeline):
        return FakeCursor([])


class FakeDB:
    def __init__(self):
        self._cols = {}

    def __getattr__(self, name):
        cols = object.__getattribute__(self, "_cols")
        if name not in cols:
            cols[name] = FakeCollection()
        return cols[name]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

TENANT = "tenant-agencia"


def auth_headers(user_id="user-1", tenant=TENANT, role="broker"):
    token = create_access_token(
        {
            "sub": user_id,
            "tenant_id": tenant,
            "active_tenant_id": tenant,
            "role": role,
            "active_role": role,
            "account_type": "individual",
            "email": "test@rovi.mx",
            "name": "Test",
        }
    )
    return {"Authorization": f"Bearer {token}"}


def pending_action(
    action_id="telegram-agent-action-1",
    user_id="user-1",
    tenant=TENANT,
    status="pending_confirmation",
    expires_in_minutes=30,
):
    now = datetime.now(timezone.utc)
    return {
        "id": action_id,
        "type": "create_tasks",
        "status": status,
        "tenant_id": tenant,
        "user_id": user_id,
        "link_id": "link-1",
        "chat_id": "chat-1",
        "role_scope": "broker",
        "agent_name": "Agente Broker ROVI",
        "requested_text": "crea una tarea para llamar al lead Juan",
        "payload": {
            "tasks": [
                {
                    "title": "Llamar: Juan",
                    "description": "Solicitud desde Telegram",
                    "status": "pendiente",
                    "priority": "alta",
                    "assigned_to": user_id,
                    "assigned_to_name": "Test",
                    "tags": ["telegram", "agente-ia", "preview"],
                }
            ]
        },
        "created_at": now,
        "expires_at": now + timedelta(minutes=expires_in_minutes),
    }


@pytest.fixture
def fake_db(monkeypatch, app):
    import server

    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    return db


# ---------------------------------------------------------------------------
# Auth requerida
# ---------------------------------------------------------------------------


def test_endpoints_requieren_jwt(client):
    assert client.get("/api/telegram-miniapp/agent-actions").status_code in (401, 403)
    assert client.post("/api/telegram-miniapp/agent-actions/x/confirm").status_code in (
        401,
        403,
    )
    assert client.post("/api/telegram-miniapp/agent-actions/x/cancel").status_code in (
        401,
        403,
    )


# ---------------------------------------------------------------------------
# GET /agent-actions
# ---------------------------------------------------------------------------


def test_lista_solo_acciones_pendientes_vigentes_del_usuario(client, fake_db):
    fake_db.telegram_agent_pending_actions.docs.extend(
        [
            pending_action("accion-mia"),
            pending_action("accion-ajena", user_id="user-2"),
            pending_action("accion-expirada", expires_in_minutes=-5),
            pending_action("accion-ejecutada", status="executed"),
        ]
    )
    response = client.get("/api/telegram-miniapp/agent-actions", headers=auth_headers())
    assert response.status_code == 200
    actions = response.json()["actions"]
    assert [a["id"] for a in actions] == ["accion-mia"]
    assert actions[0]["preview"].startswith("Puedo guardar esto en ROVI")
    assert actions[0]["status"] == "pending_confirmation"
    assert "expires_at" in actions[0] and "created_at" in actions[0]


# ---------------------------------------------------------------------------
# POST /confirm
# ---------------------------------------------------------------------------


def test_confirmar_ejecuta_via_ejecutor_compartido_con_audit(client, fake_db):
    fake_db.telegram_agent_pending_actions.docs.append(pending_action())
    response = client.post(
        "/api/telegram-miniapp/agent-actions/telegram-agent-action-1/confirm",
        headers=auth_headers(),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True and body["executed"] is True
    assert len(body["record_ids"]) == 1

    # La tarea se creó vía execute_pending_telegram_action
    assert len(fake_db.tasks.docs) == 1
    assert fake_db.tasks.docs[0]["telegram_action_id"] == "telegram-agent-action-1"
    # El ejecutor marcó executed y dejó audit (flujo auditado compartido)
    assert fake_db.telegram_agent_pending_actions.docs[0]["status"] == "executed"
    assert fake_db.telegram_agent_pending_actions.docs[0]["confirmed_via"] == "miniapp"
    assert fake_db.agent_action_audit.docs[0]["status"] == "executed"
    assert fake_db.agent_action_audit.docs[0]["action_id"] == "telegram-agent-action-1"


def test_confirmar_dos_veces_devuelve_409_sin_doble_escritura(client, fake_db):
    fake_db.telegram_agent_pending_actions.docs.append(pending_action())
    first = client.post(
        "/api/telegram-miniapp/agent-actions/telegram-agent-action-1/confirm",
        headers=auth_headers(),
    )
    assert first.status_code == 200
    second = client.post(
        "/api/telegram-miniapp/agent-actions/telegram-agent-action-1/confirm",
        headers=auth_headers(),
    )
    assert second.status_code == 409
    assert len(fake_db.tasks.docs) == 1


def test_confirmar_accion_inexistente_404(client, fake_db):
    response = client.post(
        "/api/telegram-miniapp/agent-actions/no-existe/confirm", headers=auth_headers()
    )
    assert response.status_code == 404


def test_confirmar_accion_de_otro_usuario_403(client, fake_db):
    fake_db.telegram_agent_pending_actions.docs.append(
        pending_action("accion-ajena", user_id="user-2")
    )
    response = client.post(
        "/api/telegram-miniapp/agent-actions/accion-ajena/confirm",
        headers=auth_headers(),
    )
    assert response.status_code == 403
    assert fake_db.tasks.docs == []


def test_confirmar_accion_expirada_409(client, fake_db):
    fake_db.telegram_agent_pending_actions.docs.append(
        pending_action("accion-expirada", expires_in_minutes=-5)
    )
    response = client.post(
        "/api/telegram-miniapp/agent-actions/accion-expirada/confirm",
        headers=auth_headers(),
    )
    assert response.status_code == 409
    assert fake_db.tasks.docs == []


# ---------------------------------------------------------------------------
# POST /cancel
# ---------------------------------------------------------------------------


def test_cancelar_marca_cancelled_con_auditoria_miniapp(client, fake_db):
    fake_db.telegram_agent_pending_actions.docs.append(pending_action())
    response = client.post(
        "/api/telegram-miniapp/agent-actions/telegram-agent-action-1/cancel",
        headers=auth_headers(),
    )
    assert response.status_code == 200
    assert response.json() == {"ok": True, "status": "cancelled"}

    doc = fake_db.telegram_agent_pending_actions.docs[0]
    assert doc["status"] == "cancelled"
    assert doc["cancelled_via"] == "miniapp"
    assert doc["cancelled_by"] == "user-1"
    audit = fake_db.agent_action_audit.docs[0]
    assert audit["status"] == "cancelled"
    assert audit["source"] == "miniapp"
    # No se ejecutó nada
    assert fake_db.tasks.docs == []


def test_cancelar_accion_ya_resuelta_409(client, fake_db):
    fake_db.telegram_agent_pending_actions.docs.append(
        pending_action("accion-ejecutada", status="executed")
    )
    response = client.post(
        "/api/telegram-miniapp/agent-actions/accion-ejecutada/cancel",
        headers=auth_headers(),
    )
    assert response.status_code == 409


def test_cancelar_de_otro_usuario_403_e_inexistente_404(client, fake_db):
    fake_db.telegram_agent_pending_actions.docs.append(
        pending_action("accion-ajena", user_id="user-2")
    )
    assert (
        client.post(
            "/api/telegram-miniapp/agent-actions/accion-ajena/cancel",
            headers=auth_headers(),
        ).status_code
        == 403
    )
    assert (
        client.post(
            "/api/telegram-miniapp/agent-actions/no-existe/cancel",
            headers=auth_headers(),
        ).status_code
        == 404
    )


# ---------------------------------------------------------------------------
# Wiring del scope broker en GET /api/leads (Tarea 1, F3/F4)
# ---------------------------------------------------------------------------


def _seed_leads(fake_db):
    fake_db.tenants.docs.append({"id": TENANT, "tenant_type": "agency"})
    fake_db.leads.docs.extend(
        [
            {
                "id": "lead-propio",
                "tenant_id": TENANT,
                "created_by": "user-1",
                "name": "Mío",
            },
            {
                "id": "lead-asignado",
                "tenant_id": TENANT,
                "assigned_broker_id": "user-1",
                "created_by": "user-2",
                "name": "Asignado",
            },
            {
                "id": "lead-ajeno",
                "tenant_id": TENANT,
                "created_by": "user-2",
                "assigned_broker_id": "user-2",
                "name": "Ajeno",
            },
            {
                "id": "lead-borrado",
                "tenant_id": TENANT,
                "created_by": "user-1",
                "deleted": True,
                "name": "Borrado",
            },
        ]
    )


def test_get_leads_broker_en_agencia_solo_ve_propios_y_excluye_borrados(
    client, fake_db
):
    _seed_leads(fake_db)
    response = client.get("/api/leads", headers=auth_headers(role="broker"))
    assert response.status_code == 200
    ids = {lead["id"] for lead in response.json()["leads"]}
    assert ids == {"lead-propio", "lead-asignado"}


def test_get_leads_agency_admin_ve_todo_el_tenant_sin_borrados(client, fake_db):
    _seed_leads(fake_db)
    response = client.get(
        "/api/leads", headers=auth_headers(user_id="admin-1", role="agency_admin")
    )
    assert response.status_code == 200
    ids = {lead["id"] for lead in response.json()["leads"]}
    assert ids == {"lead-propio", "lead-asignado", "lead-ajeno"}


def test_put_lead_ajeno_devuelve_404_para_broker_en_agencia(client, fake_db):
    _seed_leads(fake_db)
    response = client.put(
        "/api/leads/lead-ajeno",
        json={"status": "contactado"},
        headers=auth_headers(role="broker"),
    )
    assert response.status_code == 404
    assert fake_db.leads.docs[2].get("status") is None
