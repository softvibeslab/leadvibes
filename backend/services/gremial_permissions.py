from __future__ import annotations

from typing import Any

GREMIAL_NATIONAL_ROLES = {
    "gremial_national_admin",
    "gremial_finance",
    "gremial_training_manager",
    "gremial_communications",
}
GREMIAL_DELEGATION_ROLES = {
    "gremial_delegation_admin",
    "gremial_membership_manager",
}
GREMIAL_MEMBER_ROLES = {
    "gremial_member_admin",
    "gremial_member_user",
}
GREMIAL_ROLES = GREMIAL_NATIONAL_ROLES | GREMIAL_DELEGATION_ROLES | GREMIAL_MEMBER_ROLES

# Transitional aliases let existing COPIM demo users see the generalized engine.
COPIM_TO_GREMIAL_ROLE = {
    "copim_admin": "gremial_national_admin",
    "copim_operator": "gremial_delegation_admin",
    "copim_member": "gremial_member_user",
}


def normalize_role(role: str | None) -> str:
    role = (role or "").strip()
    return COPIM_TO_GREMIAL_ROLE.get(role, role)


def is_gremial_role(role: str | None) -> bool:
    return normalize_role(role) in GREMIAL_ROLES


def is_gremial_national_user(user: dict[str, Any] | None) -> bool:
    return normalize_role((user or {}).get("role")) in GREMIAL_NATIONAL_ROLES


def is_gremial_delegation_user(user: dict[str, Any] | None) -> bool:
    return normalize_role((user or {}).get("role")) in GREMIAL_DELEGATION_ROLES


def is_gremial_member_user(user: dict[str, Any] | None) -> bool:
    return normalize_role((user or {}).get("role")) in GREMIAL_MEMBER_ROLES


def is_gremial_account(user: dict[str, Any] | None) -> bool:
    user = user or {}
    account_type = (user.get("account_type") or "").strip()
    return account_type in {"gremial", "chamber", "member_company", "copim", "copim_member"} or is_gremial_role(user.get("role"))


def get_gremial_tenant_id(user: dict[str, Any]) -> str:
    # Member accounts may keep a personal tenant but be linked to the chamber tenant.
    return user.get("linked_gremial_tenant_id") or user.get("linked_copim_tenant_id") or user.get("tenant_id") or ""


def get_gremial_delegation_id(user: dict[str, Any]) -> str | None:
    return user.get("linked_gremial_delegation_id") or user.get("linked_copim_association_id")


def get_gremial_member_id(user: dict[str, Any]) -> str | None:
    return user.get("linked_gremial_member_id") or user.get("linked_copim_member_id")


def build_gremial_query_scope(user: dict[str, Any], *, member_field: str = "id") -> dict[str, Any]:
    tenant_id = get_gremial_tenant_id(user)
    query: dict[str, Any] = {"tenant_id": tenant_id}

    if is_gremial_delegation_user(user):
        delegation_id = get_gremial_delegation_id(user)
        if delegation_id:
            query["delegation_id"] = delegation_id

    if is_gremial_member_user(user):
        member_id = get_gremial_member_id(user)
        if member_id:
            query[member_field] = member_id
        else:
            query[member_field] = "__no_member_link__"

    return query
