import asyncio
from datetime import datetime, timezone

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError

from menuvibes import (
    DemoCreate,
    ProspectCreate,
    ProspectUpdate,
    executive_scope,
    prospect_selector,
    require_menuvibes_context,
    validate_assignment,
    validate_follow_up,
    create_menuvibes_router,
)
from auth import get_current_user


class FakeCollection:
    def __init__(self, documents=()):
        self.documents = list(documents)
        self.queries = []

    async def find_one(self, query, projection=None):
        self.queries.append(query)
        for document in self.documents:
            if all(document.get(key) == value for key, value in query.items()):
                if projection:
                    return {
                        key: value
                        for key, value in document.items()
                        if projection.get(key, 1) and key != "_id"
                    }
                return dict(document)
        return None


class FakeDB:
    def __init__(self, memberships=(), tenants=()):
        self.tenant_memberships = FakeCollection(memberships)
        self.tenants = FakeCollection(tenants)


def run(awaitable):
    return asyncio.run(awaitable)


def user(tenant="tenant-a", user_id="user-a"):
    return {"active_tenant_id": tenant, "tenant_id": "legacy", "user_id": user_id}


def test_guard_resolves_role_from_active_membership_not_token():
    db = FakeDB(
        memberships=[{"tenant_id": "tenant-a", "user_id": "user-a", "status": "active", "role": "manager"}],
        tenants=[{"id": "tenant-a", "is_active": True, "tenant_type": "menuvibes"}],
    )

    context = run(require_menuvibes_context(db, {**user(), "role": "executive"}))

    assert context == {
        "tenant_id": "tenant-a",
        "user_id": "user-a",
        "role": "manager",
        "membership": db.tenant_memberships.documents[0],
    }
    assert db.tenant_memberships.queries == [
        {"tenant_id": "tenant-a", "user_id": "user-a", "status": "active"}
    ]


@pytest.mark.parametrize(
    "memberships,tenants",
    [
        ([], [{"id": "tenant-a", "is_active": True, "tenant_type": "menuvibes"}]),
        ([{"tenant_id": "tenant-a", "user_id": "user-a", "status": "active", "role": "owner"}],
         [{"id": "tenant-a", "is_active": True, "tenant_type": "agency"}]),
        ([{"tenant_id": "tenant-a", "user_id": "user-a", "status": "suspended", "role": "owner"}],
         [{"id": "tenant-a", "is_active": True, "tenant_type": "menuvibes"}]),
    ],
)
def test_guard_rejects_wrong_workspace_or_inactive_membership(memberships, tenants):
    with pytest.raises(HTTPException) as error:
        run(require_menuvibes_context(FakeDB(memberships, tenants), user()))
    assert error.value.status_code == 403


def test_assignment_is_tenant_scoped_and_executive_can_only_assign_self():
    db = FakeDB(memberships=[
        {"tenant_id": "tenant-a", "user_id": "user-a", "status": "active"},
        {"tenant_id": "tenant-b", "user_id": "user-b", "status": "active"},
    ])
    executive = {"tenant_id": "tenant-a", "user_id": "user-a", "role": "executive"}

    run(validate_assignment(db, executive, "user-a"))
    with pytest.raises(HTTPException) as forbidden:
        run(validate_assignment(db, executive, "user-b"))
    assert forbidden.value.status_code == 403

    manager = {**executive, "role": "manager"}
    with pytest.raises(HTTPException) as invalid:
        run(validate_assignment(db, manager, "user-b"))
    assert invalid.value.status_code == 400
    assert db.tenant_memberships.queries[-1]["tenant_id"] == "tenant-a"


def test_pipeline_follow_up_invariant_and_terminal_exemption():
    with pytest.raises(HTTPException) as missing:
        validate_follow_up({"stage": "contacted", "assigned_to": "u"})
    assert missing.value.status_code == 400

    validate_follow_up({
        "stage": "nurture", "assigned_to": "u", "next_action": "Llamar",
        "next_action_at": datetime.now(timezone.utc).isoformat(),
    })
    validate_follow_up({"stage": "won"})
    validate_follow_up({"stage": "lost"})


def test_executive_visibility_and_all_tenant_selectors():
    ctx = {"tenant_id": "tenant-a", "user_id": "user-a", "role": "executive"}
    expected_scope = {
        "$or": [
            {"assigned_to": "user-a"},
            {"assigned_to": None, "created_by": "user-a"},
        ]
    }
    assert executive_scope(ctx) == expected_scope
    assert prospect_selector(ctx, "prospect-1") == {
        "tenant_id": "tenant-a", "id": "prospect-1", **expected_scope
    }
    assert prospect_selector({**ctx, "role": "owner"}) == {"tenant_id": "tenant-a"}


def test_payload_contract_forbids_tenant_unknown_fields_and_enums():
    with pytest.raises(ValidationError):
        ProspectCreate(business_name="Taquería", tenant_id="tenant-b")
    with pytest.raises(ValidationError):
        ProspectUpdate(stage="legacy_lead_status")
    with pytest.raises(ValidationError):
        DemoCreate(prospect_id="p", status="published")
    assert ProspectCreate(business_name="  Taquería Real  ").business_name == "Taquería Real"


def _matches(document, query):
    for key, expected in query.items():
        if key == "$or":
            if not any(_matches(document, option) for option in expected):
                return False
            continue
        if key == "$and":
            if not all(_matches(document, option) for option in expected):
                return False
            continue
        actual = document.get(key)
        if isinstance(expected, dict):
            if "$in" in expected and actual not in expected["$in"]:
                return False
            if "$regex" in expected:
                import re
                flags = re.IGNORECASE if "i" in expected.get("$options", "") else 0
                if re.search(expected["$regex"], str(actual or ""), flags) is None:
                    return False
        elif actual != expected:
            return False
    return True


class FakeResult:
    def __init__(self, matched_count=0):
        self.matched_count = matched_count


class FakeCursor:
    def __init__(self, documents):
        self.documents = [dict(document) for document in documents]

    def sort(self, field, direction):
        self.documents.sort(key=lambda item: item.get(field) or "", reverse=direction < 0)
        return self

    async def to_list(self, length):
        return self.documents[:length]


class RouterCollection(FakeCollection):
    def find(self, query, projection=None):
        self.queries.append(query)
        return FakeCursor([document for document in self.documents if _matches(document, query)])

    async def insert_one(self, document):
        self.documents.append(dict(document))
        return FakeResult(1)

    async def update_one(self, query, update):
        self.queries.append(query)
        for document in self.documents:
            if not _matches(document, query):
                continue
            for key, value in update.get("$set", {}).items():
                document[key] = value
            for key, value in update.get("$max", {}).items():
                if document.get(key) is None or document.get(key) < value:
                    document[key] = value
            return FakeResult(1)
        return FakeResult(0)


class RouterDB:
    def __init__(self):
        self.tenant_memberships = RouterCollection([
            {"id": "membership-a", "tenant_id": "tenant-a", "user_id": "user-a", "status": "active", "role": "owner"},
            {"id": "membership-b", "tenant_id": "tenant-b", "user_id": "user-b", "status": "active", "role": "owner"},
        ])
        self.tenants = RouterCollection([
            {"id": "tenant-a", "is_active": True, "tenant_type": "menuvibes"},
            {"id": "tenant-b", "is_active": True, "tenant_type": "menuvibes"},
        ])
        self.menuvibes_prospects = RouterCollection([
            {"id": "foreign", "tenant_id": "tenant-b", "business_name": "Otro negocio", "stage": "new", "created_by": "user-b"},
        ])
        self.menuvibes_activities = RouterCollection()
        self.menuvibes_demos = RouterCollection()


@pytest.fixture()
def api_client():
    db = RouterDB()
    app = FastAPI()
    app.include_router(create_menuvibes_router(db), prefix="/api")

    async def current_user():
        return {
            "user_id": "user-a",
            "active_tenant_id": "tenant-a",
            "tenant_id": "tenant-a",
            "active_membership_id": "membership-a",
            "role": "owner",
        }

    app.dependency_overrides[get_current_user] = current_user
    with TestClient(app) as client:
        yield client, db


def test_http_router_enforces_tenant_scope_and_follow_up(api_client):
    client, db = api_client
    created = client.post("/api/menuvibes/prospects", json={"business_name": "Cocina Real"})
    assert created.status_code == 201
    prospect_id = created.json()["id"]
    assert created.json()["tenant_id"] == "tenant-a"

    listed = client.get("/api/menuvibes/prospects")
    assert listed.status_code == 200
    assert [row["business_name"] for row in listed.json()] == ["Cocina Real"]
    assert client.get("/api/menuvibes/prospects/foreign").status_code == 404

    invalid = client.patch(f"/api/menuvibes/prospects/{prospect_id}", json={"stage": "contacted"})
    assert invalid.status_code == 400
    valid = client.patch(f"/api/menuvibes/prospects/{prospect_id}", json={
        "stage": "contacted",
        "assigned_to": "user-a",
        "next_action": "Llamar al gerente",
        "next_action_at": "2030-01-01T12:00:00Z",
    })
    assert valid.status_code == 200
    assert valid.json()["stage"] == "contacted"
    assert all(query.get("tenant_id") == "tenant-a" for query in db.menuvibes_prospects.queries if "id" in query)


def test_http_activity_demo_and_dashboard_behavior(api_client):
    client, db = api_client
    prospect = client.post("/api/menuvibes/prospects", json={"business_name": "Bistró Uno"}).json()
    prospect_id = prospect["id"]

    note = client.post(f"/api/menuvibes/prospects/{prospect_id}/activities", json={"type": "note", "summary": "Revisar carta"})
    assert note.status_code == 201
    stored = next(row for row in db.menuvibes_prospects.documents if row["id"] == prospect_id)
    assert stored["last_interaction_at"] is None

    call = client.post(f"/api/menuvibes/prospects/{prospect_id}/activities", json={"type": "call", "summary": "Hablé con gerencia"})
    assert call.status_code == 201
    assert stored["last_interaction_at"] is not None

    assert client.post("/api/menuvibes/demos", json={"prospect_id": "foreign"}).status_code == 404
    demo = client.post("/api/menuvibes/demos", json={"prospect_id": prospect_id, "status": "ready"})
    assert demo.status_code == 201
    dashboard = client.get("/api/menuvibes/dashboard")
    assert dashboard.status_code == 200
    assert dashboard.json()["total_prospects"] == 1
    assert dashboard.json()["demo_counts"]["ready"] == 1
    assert dashboard.json()["missing_follow_up"] == 1

    won = client.patch(f"/api/menuvibes/prospects/{prospect_id}", json={"stage": "won"})
    assert won.status_code == 200
    assert client.get("/api/menuvibes/dashboard").json()["missing_follow_up"] == 0
