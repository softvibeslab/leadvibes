"""Scope de visibilidad de leads para la API REST.

Cierra la brecha F3/F4 de docs/MINIAPP_SPEC.md: hasta ahora el scope
`own_or_assigned_only` del broker solo se aplicaba en las rutas de agente
(`hermes_crud_extensions.apply_role_scope_visibility` y
`agent_control.scoped_entity_query`), pero NO en `GET /api/leads` ni en
`PUT/DELETE /api/leads/{id}`. Este módulo replica exactamente la misma
semántica para la REST:

- Broker dentro de un tenant tipo agencia → solo leads propios
  (`created_by`) o asignados (`assigned_broker_id`).
- `agency_admin` y demás roles tenant-wide/globales → todo el tenant
  (sin cambios).
- Usuarios de tenant individual → sin cambios de comportamiento.
"""

from __future__ import annotations

from hermes_crud_extensions import (BROKER_SCOPED_ROLES, GLOBAL_SCOPED_ROLES,
                                    TENANT_SCOPED_ROLES)

# Tipos de tenant donde un broker comparte workspace con otros brokers y, por
# lo tanto, debe quedar acotado a sus propios leads.
AGENCY_TENANT_TYPES = {"agency"}

# Marcador de "no ver nada" (paridad con hermes_crud_extensions._deny_scope).
DENY_SCOPE_CONDITIONS = [{"__rovi_scope_denied__": "__never__"}]


def lead_ownership_conditions(user_id: str) -> list[dict]:
    """Misma semántica que scoped_entity_query/apply_role_scope_visibility."""
    return [{"assigned_broker_id": user_id}, {"created_by": user_id}]


def merge_ownership_filter(query: dict, conditions: list[dict] | None) -> dict:
    """Agrega el $or de ownership sin pisar un $or existente (p. ej. search)."""
    if not conditions:
        return query
    if "$or" in query:
        return {"$and": [query, {"$or": conditions}]}
    return {**query, "$or": conditions}


def role_requires_lead_ownership(role: str | None) -> bool:
    normalized = (role or "").strip().lower()
    if normalized in GLOBAL_SCOPED_ROLES or normalized in TENANT_SCOPED_ROLES:
        return False
    return normalized in BROKER_SCOPED_ROLES


async def tenant_is_agency(
    db, tenant_id: str | None, current_user: dict | None = None
) -> bool:
    """True si el tenant activo es de tipo agencia (workspace compartido)."""
    if not tenant_id:
        return False
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0, "tenant_type": 1})
    if tenant:
        return (tenant.get("tenant_type") or "individual") in AGENCY_TENANT_TYPES
    # Tenants antiguos sin doc en db.tenants: usa el account_type del JWT como
    # pista conservadora (agency → scoped; individual → comportamiento actual).
    return bool(current_user) and current_user.get("account_type") == "agency"


async def resolve_lead_scope_conditions(db, current_user: dict) -> list[dict] | None:
    """Condiciones de ownership a aplicar para el usuario actual.

    Returns:
        None  → tenant-wide (agency_admin, roles superiores o tenant individual).
        list  → condiciones $or own/assigned (broker en tenant agencia), o el
                marcador deny si no hay user_id (paridad con hermes).
    """
    role = current_user.get("active_role") or current_user.get("role")
    if not role_requires_lead_ownership(role):
        return None
    tenant_id = current_user.get("active_tenant_id") or current_user.get("tenant_id")
    if not await tenant_is_agency(db, tenant_id, current_user):
        return None
    user_id = current_user.get("user_id")
    if not user_id:
        return DENY_SCOPE_CONDITIONS
    return lead_ownership_conditions(user_id)


async def apply_lead_scope(db, query: dict, current_user: dict) -> dict:
    """Aplica el scope de leads del usuario sobre una query de Mongo."""
    conditions = await resolve_lead_scope_conditions(db, current_user)
    return merge_ownership_filter(query, conditions)


def lead_matches_ownership(lead: dict | None, conditions: list[dict] | None) -> bool:
    """Evalúa en memoria si un lead ya cargado es visible bajo las condiciones."""
    if conditions is None:
        return True
    if not lead:
        return False
    for condition in conditions:
        for field, value in condition.items():
            if field.startswith("__"):
                return False  # marcador deny
            if lead.get(field) == value:
                return True
    return False
