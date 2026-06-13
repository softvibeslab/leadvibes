"""Tests unitarios del scope broker de leads en la API REST (lead_scope.py).

Sin Mongo: la consulta de tenant_type se simula con un FakeDB mínimo.
"""

import asyncio

from lead_scope import (DENY_SCOPE_CONDITIONS, apply_lead_scope,
                        lead_matches_ownership, merge_ownership_filter,
                        resolve_lead_scope_conditions)


class FakeTenants:
    def __init__(self, docs):
        self.docs = docs

    async def find_one(self, query, projection=None):
        for doc in self.docs:
            if doc.get("id") == query.get("id"):
                return dict(doc)
        return None


class FakeDB:
    def __init__(self, tenants=None):
        self.tenants = FakeTenants(tenants or [])


def run(coro):
    return asyncio.run(coro)


AGENCY_DB = FakeDB([{"id": "tenant-agencia", "tenant_type": "agency"}])
INDIVIDUAL_DB = FakeDB([{"id": "tenant-personal", "tenant_type": "individual"}])
EMPTY_DB = FakeDB([])


def make_user(
    role="broker",
    tenant="tenant-agencia",
    account_type="individual",
    user_id="broker-1",
):
    return {
        "user_id": user_id,
        "tenant_id": tenant,
        "active_tenant_id": tenant,
        "role": role,
        "active_role": role,
        "account_type": account_type,
    }


def test_broker_en_tenant_agencia_queda_acotado_a_propios_o_asignados():
    conditions = run(resolve_lead_scope_conditions(AGENCY_DB, make_user()))
    assert {"assigned_broker_id": "broker-1"} in conditions
    assert {"created_by": "broker-1"} in conditions


def test_broker_en_tenant_individual_no_cambia_comportamiento():
    user = make_user(tenant="tenant-personal")
    assert run(resolve_lead_scope_conditions(INDIVIDUAL_DB, user)) is None


def test_agency_admin_y_roles_superiores_ven_todo_el_tenant():
    for role in ("agency_admin", "admin", "manager", "owner", "rovi_admin"):
        user = make_user(role=role)
        assert run(resolve_lead_scope_conditions(AGENCY_DB, user)) is None


def test_broker_en_agencia_sin_user_id_no_ve_nada():
    user = make_user()
    user["user_id"] = None
    conditions = run(resolve_lead_scope_conditions(AGENCY_DB, user))
    assert conditions == DENY_SCOPE_CONDITIONS


def test_tenant_sin_doc_usa_account_type_como_pista():
    # account_type agency → scoped; individual → comportamiento actual
    assert (
        run(resolve_lead_scope_conditions(EMPTY_DB, make_user(account_type="agency")))
        is not None
    )
    assert (
        run(
            resolve_lead_scope_conditions(
                EMPTY_DB, make_user(account_type="individual")
            )
        )
        is None
    )


def test_apply_lead_scope_agrega_or_de_ownership():
    query = run(
        apply_lead_scope(AGENCY_DB, {"tenant_id": "tenant-agencia"}, make_user())
    )
    assert query["tenant_id"] == "tenant-agencia"
    assert {"assigned_broker_id": "broker-1"} in query["$or"]


def test_merge_no_pisa_un_or_existente_de_busqueda():
    base = {"tenant_id": "t", "$or": [{"name": {"$regex": "juan", "$options": "i"}}]}
    merged = merge_ownership_filter(base, [{"assigned_broker_id": "broker-1"}])
    assert "$and" in merged
    assert merged["$and"][0]["tenant_id"] == "t"
    assert {"assigned_broker_id": "broker-1"} in merged["$and"][1]["$or"]


def test_lead_matches_ownership_evalua_en_memoria():
    conditions = [{"assigned_broker_id": "broker-1"}, {"created_by": "broker-1"}]
    assert (
        lead_matches_ownership({"assigned_broker_id": "broker-1"}, conditions) is True
    )
    assert lead_matches_ownership({"created_by": "broker-1"}, conditions) is True
    assert (
        lead_matches_ownership(
            {"created_by": "otro", "assigned_broker_id": "otro"}, conditions
        )
        is False
    )
    assert lead_matches_ownership({"created_by": "otro"}, None) is True  # tenant-wide
    assert (
        lead_matches_ownership({"created_by": "broker-1"}, DENY_SCOPE_CONDITIONS)
        is False
    )
