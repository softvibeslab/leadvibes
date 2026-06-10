"""
HERMES ACTION BUILDERS & EXECUTORS

Módulo con action builders y executors para CRUD completo del Agente Hermes.
Este archivo AGREGA funcionalidad sin modificar código existente.

Autor: Agente Claude
Fecha: 2025-01-10
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Optional


# Importar extractores y utilidades del módulo de extensiones
from hermes_crud_extensions import (
    extract_id_from_text,
    extract_status_filter,
    extract_priority_filter,
    extract_price_max,
    extract_price_min,
    extract_niche_filter,
    extract_operation_type_filter,
    extract_date_start,
    extract_date_end,
    extract_search_term,
    extract_title_update,
    extract_new_price,
    extract_new_status,
    extract_due_date,
    extract_new_time,
    extract_reason,
    find_lead_match,
    find_property_match,
    find_task_match,
    find_event_match,
)


# ============================================================================
# ACTION BUILDERS - OPERACIONES READ
# ============================================================================

async def build_pending_lead_read_action(
    *,
    text: str,
    link: dict,
    user: dict,
    role_scope: str,
    agent_name: str,
    db: Any,  # Motor database
) -> dict | None:
    """Construye acción de lectura de leads"""
    tenant_id = link.get("tenant_id") or user.get("tenant_id")
    if not tenant_id:
        return None

    filters = {
        "status": extract_status_filter(text),
        "priority": extract_priority_filter(text),
        "search": extract_search_term(text),
        "limit": 10,  # Default limit
    }
    # Remover filtros None
    filters = {k: v for k, v in filters.items() if v is not None}

    now = datetime.now(timezone.utc)
    action = {
        "id": f"telegram-agent-action-{uuid.uuid4()}",
        "type": "read_leads",
        "status": "ready_to_execute",  # No requiere confirmación para READ
        "tenant_id": tenant_id,
        "user_id": user["id"],
        "link_id": link["id"],
        "chat_id": (link.get("telegram") or {}).get("chat_id"),
        "role_scope": role_scope,
        "agent_name": agent_name,
        "requested_text": text,
        "payload": {"filters": filters},
        "created_at": now,
        "expires_at": now + timedelta(minutes=5),  # READ expira rápido
    }
    await db.telegram_agent_pending_actions.insert_one(action)
    return action


async def build_pending_property_read_action(
    *,
    text: str,
    link: dict,
    user: dict,
    role_scope: str,
    agent_name: str,
    db: Any,
) -> dict | None:
    """Construye acción de lectura de propiedades"""
    tenant_id = link.get("tenant_id") or user.get("tenant_id")
    if not tenant_id:
        return None

    filters = {
        "niche": extract_niche_filter(text),
        "operation_type": extract_operation_type_filter(text),
        "price_max": extract_price_max(text),
        "price_min": extract_price_min(text),
        "search": extract_search_term(text),
        "limit": 10,
    }
    filters = {k: v for k, v in filters.items() if v is not None}

    now = datetime.now(timezone.utc)
    action = {
        "id": f"telegram-agent-action-{uuid.uuid4()}",
        "type": "read_properties",
        "status": "ready_to_execute",
        "tenant_id": tenant_id,
        "user_id": user["id"],
        "link_id": link["id"],
        "chat_id": (link.get("telegram") or {}).get("chat_id"),
        "role_scope": role_scope,
        "agent_name": agent_name,
        "requested_text": text,
        "payload": {"filters": filters},
        "created_at": now,
        "expires_at": now + timedelta(minutes=5),
    }
    await db.telegram_agent_pending_actions.insert_one(action)
    return action


async def build_pending_task_read_action(
    *,
    text: str,
    link: dict,
    user: dict,
    role_scope: str,
    agent_name: str,
    db: Any,
) -> dict | None:
    """Construye acción de lectura de tareas"""
    tenant_id = link.get("tenant_id") or user.get("tenant_id")
    if not tenant_id:
        return None

    filters = {
        "status": extract_status_filter(text) or ["pendiente", "en_progreso"],  # Default: activas
        "priority": extract_priority_filter(text),
        "limit": 10,
    }
    filters = {k: v for k, v in filters.items() if v is not None}

    now = datetime.now(timezone.utc)
    action = {
        "id": f"telegram-agent-action-{uuid.uuid4()}",
        "type": "read_tasks",
        "status": "ready_to_execute",
        "tenant_id": tenant_id,
        "user_id": user["id"],
        "link_id": link["id"],
        "chat_id": (link.get("telegram") or {}).get("chat_id"),
        "role_scope": role_scope,
        "agent_name": agent_name,
        "requested_text": text,
        "payload": {"filters": filters},
        "created_at": now,
        "expires_at": now + timedelta(minutes=5),
    }
    await db.telegram_agent_pending_actions.insert_one(action)
    return action


async def build_pending_event_read_action(
    *,
    text: str,
    link: dict,
    user: dict,
    role_scope: str,
    agent_name: str,
    db: Any,
) -> dict | None:
    """Construye acción de lectura de eventos"""
    tenant_id = link.get("tenant_id") or user.get("tenant_id")
    if not tenant_id:
        return None

    filters = {
        "start_from": extract_date_start(text),
        "start_until": extract_date_end(text),
        "limit": 10,
    }
    filters = {k: v for k, v in filters.items() if v is not None}

    now = datetime.now(timezone.utc)
    action = {
        "id": f"telegram-agent-action-{uuid.uuid4()}",
        "type": "read_events",
        "status": "ready_to_execute",
        "tenant_id": tenant_id,
        "user_id": user["id"],
        "link_id": link["id"],
        "chat_id": (link.get("telegram") or {}).get("chat_id"),
        "role_scope": role_scope,
        "agent_name": agent_name,
        "requested_text": text,
        "payload": {"filters": filters},
        "created_at": now,
        "expires_at": now + timedelta(minutes=5),
    }
    await db.telegram_agent_pending_actions.insert_one(action)
    return action


# ============================================================================
# ACTION BUILDERS - OPERACIONES UPDATE
# ============================================================================

async def build_pending_property_update_action(
    *,
    text: str,
    link: dict,
    user: dict,
    role_scope: str,
    agent_name: str,
    db: Any,
) -> dict | None:
    """Construye acción de actualización de propiedad"""
    tenant_id = link.get("tenant_id") or user.get("tenant_id")
    if not tenant_id:
        return None

    property_doc = await find_property_match(db, tenant_id, text)
    if not property_doc:
        return None

    update_fields = {}
    new_price = extract_new_price(text)
    if new_price is not None:
        update_fields["price_mxn"] = new_price

    new_title = extract_title_update(text)
    if new_title:
        update_fields["title"] = new_title

    # Activar/desactivar
    if "activa" in text.lower() or "reactivar" in text.lower():
        update_fields["is_active"] = True
    elif "desactiva" in text.lower() or "inactiva" in text.lower():
        update_fields["is_active"] = False

    if not update_fields:
        return None

    now = datetime.now(timezone.utc)
    action = {
        "id": f"telegram-agent-action-{uuid.uuid4()}",
        "type": "update_property",
        "status": "ready_to_execute",
        "tenant_id": tenant_id,
        "user_id": user["id"],
        "link_id": link["id"],
        "chat_id": (link.get("telegram") or {}).get("chat_id"),
        "role_scope": role_scope,
        "agent_name": agent_name,
        "requested_text": text,
        "payload": {
            "property_id": property_doc["id"],
            "property_title": property_doc.get("title"),
            "update": update_fields,
        },
        "created_at": now,
        "expires_at": now + timedelta(minutes=30),
    }
    await db.telegram_agent_pending_actions.insert_one(action)
    return action


async def build_pending_task_update_action(
    *,
    text: str,
    link: dict,
    user: dict,
    role_scope: str,
    agent_name: str,
    db: Any,
) -> dict | None:
    """Construye acción de actualización de tarea"""
    tenant_id = link.get("tenant_id") or user.get("tenant_id")
    if not tenant_id:
        return None

    task_doc = await find_task_match(db, tenant_id, user["id"], text)
    if not task_doc:
        return None

    update_fields = {}
    new_status = extract_new_status(text, entity_type="task")
    if new_status:
        update_fields["status"] = new_status

    new_priority = extract_priority_filter(text)
    if new_priority:
        update_fields["priority"] = new_priority

    new_due = extract_due_date(text)
    if new_due:
        update_fields["due_date"] = new_due

    if not update_fields:
        return None

    now = datetime.now(timezone.utc)
    action = {
        "id": f"telegram-agent-action-{uuid.uuid4()}",
        "type": "update_task",
        "status": "ready_to_execute",
        "tenant_id": tenant_id,
        "user_id": user["id"],
        "link_id": link["id"],
        "chat_id": (link.get("telegram") or {}).get("chat_id"),
        "role_scope": role_scope,
        "agent_name": agent_name,
        "requested_text": text,
        "payload": {
            "task_id": task_doc["id"],
            "task_title": task_doc.get("title"),
            "update": update_fields,
        },
        "created_at": now,
        "expires_at": now + timedelta(minutes=30),
    }
    await db.telegram_agent_pending_actions.insert_one(action)
    return action


async def build_pending_event_update_action(
    *,
    text: str,
    link: dict,
    user: dict,
    role_scope: str,
    agent_name: str,
    db: Any,
) -> dict | None:
    """Construye acción de actualización de evento"""
    tenant_id = link.get("tenant_id") or user.get("tenant_id")
    if not tenant_id:
        return None

    event_doc = await find_event_match(db, tenant_id, user["id"], text)
    if not event_doc:
        return None

    update_fields = {}
    new_time = extract_new_time(text)
    if new_time:
        # Calcular nuevo end_time (45 min después del start)
        start_dt = datetime.fromisoformat(new_time)
        end_dt = start_dt + timedelta(minutes=45)
        update_fields["start_time"] = new_time
        update_fields["end_time"] = end_dt.isoformat()

    new_title = extract_title_update(text)
    if new_title:
        update_fields["title"] = new_title

    if not update_fields:
        return None

    now = datetime.now(timezone.utc)
    action = {
        "id": f"telegram-agent-action-{uuid.uuid4()}",
        "type": "update_event",
        "status": "ready_to_execute",
        "tenant_id": tenant_id,
        "user_id": user["id"],
        "link_id": link["id"],
        "chat_id": (link.get("telegram") or {}).get("chat_id"),
        "role_scope": role_scope,
        "agent_name": agent_name,
        "requested_text": text,
        "payload": {
            "event_id": event_doc["id"],
            "event_title": event_doc.get("title"),
            "update": update_fields,
        },
        "created_at": now,
        "expires_at": now + timedelta(minutes=30),
    }
    await db.telegram_agent_pending_actions.insert_one(action)
    return action


# ============================================================================
# ACTION BUILDERS - OPERACIONES DELETE
# ============================================================================

async def build_pending_lead_delete_action(
    *,
    text: str,
    link: dict,
    user: dict,
    role_scope: str,
    agent_name: str,
    db: Any,
) -> dict | None:
    """Construye acción de eliminación de lead (soft delete)"""
    tenant_id = link.get("tenant_id") or user.get("tenant_id")
    if not tenant_id:
        return None

    lead_doc = await find_lead_match(db, tenant_id, text)
    if not lead_doc:
        return None

    now = datetime.now(timezone.utc)
    action = {
        "id": f"telegram-agent-action-{uuid.uuid4()}",
        "type": "delete_lead",
        "status": "pending_confirmation",
        "tenant_id": tenant_id,
        "user_id": user["id"],
        "link_id": link["id"],
        "chat_id": (link.get("telegram") or {}).get("chat_id"),
        "role_scope": role_scope,
        "agent_name": agent_name,
        "requested_text": text,
        "payload": {
            "lead_id": lead_doc["id"],
            "lead_name": lead_doc.get("name"),
            "reason": extract_reason(text),
        },
        "created_at": now,
        "expires_at": now + timedelta(minutes=30),
    }
    await db.telegram_agent_pending_actions.insert_one(action)
    return action


async def build_pending_property_delete_action(
    *,
    text: str,
    link: dict,
    user: dict,
    role_scope: str,
    agent_name: str,
    db: Any,
) -> dict | None:
    """Construye acción de eliminación de propiedad"""
    tenant_id = link.get("tenant_id") or user.get("tenant_id")
    if not tenant_id:
        return None

    property_doc = await find_property_match(db, tenant_id, text)
    if not property_doc:
        return None

    now = datetime.now(timezone.utc)
    action = {
        "id": f"telegram-agent-action-{uuid.uuid4()}",
        "type": "delete_property",
        "status": "pending_confirmation",
        "tenant_id": tenant_id,
        "user_id": user["id"],
        "link_id": link["id"],
        "chat_id": (link.get("telegram") or {}).get("chat_id"),
        "role_scope": role_scope,
        "agent_name": agent_name,
        "requested_text": text,
        "payload": {
            "property_id": property_doc["id"],
            "property_title": property_doc.get("title"),
            "reason": extract_reason(text),
        },
        "created_at": now,
        "expires_at": now + timedelta(minutes=30),
    }
    await db.telegram_agent_pending_actions.insert_one(action)
    return action


async def build_pending_task_delete_action(
    *,
    text: str,
    link: dict,
    user: dict,
    role_scope: str,
    agent_name: str,
    db: Any,
) -> dict | None:
    """Construye acción de eliminación de tarea"""
    tenant_id = link.get("tenant_id") or user.get("tenant_id")
    if not tenant_id:
        return None

    task_doc = await find_task_match(db, tenant_id, user["id"], text)
    if not task_doc:
        return None

    now = datetime.now(timezone.utc)
    action = {
        "id": f"telegram-agent-action-{uuid.uuid4()}",
        "type": "delete_task",
        "status": "pending_confirmation",
        "tenant_id": tenant_id,
        "user_id": user["id"],
        "link_id": link["id"],
        "chat_id": (link.get("telegram") or {}).get("chat_id"),
        "role_scope": role_scope,
        "agent_name": agent_name,
        "requested_text": text,
        "payload": {
            "task_id": task_doc["id"],
            "task_title": task_doc.get("title"),
            "reason": extract_reason(text),
        },
        "created_at": now,
        "expires_at": now + timedelta(minutes=30),
    }
    await db.telegram_agent_pending_actions.insert_one(action)
    return action


async def build_pending_event_delete_action(
    *,
    text: str,
    link: dict,
    user: dict,
    role_scope: str,
    agent_name: str,
    db: Any,
) -> dict | None:
    """Construye acción de eliminación de evento"""
    tenant_id = link.get("tenant_id") or user.get("tenant_id")
    if not tenant_id:
        return None

    event_doc = await find_event_match(db, tenant_id, user["id"], text)
    if not event_doc:
        return None

    now = datetime.now(timezone.utc)
    action = {
        "id": f"telegram-agent-action-{uuid.uuid4()}",
        "type": "delete_event",
        "status": "pending_confirmation",
        "tenant_id": tenant_id,
        "user_id": user["id"],
        "link_id": link["id"],
        "chat_id": (link.get("telegram") or {}).get("chat_id"),
        "role_scope": role_scope,
        "agent_name": agent_name,
        "requested_text": text,
        "payload": {
            "event_id": event_doc["id"],
            "event_title": event_doc.get("title"),
            "reason": extract_reason(text),
        },
        "created_at": now,
        "expires_at": now + timedelta(minutes=30),
    }
    await db.telegram_agent_pending_actions.insert_one(action)
    return action


# ============================================================================
# EXECUTORS - NUEVAS OPERACIONES
# ============================================================================

async def execute_hermes_read_action(action: dict, db: Any) -> dict:
    """Ejecuta acciones de lectura (READ)"""
    action_type = action.get("type")
    filters = (action.get("payload") or {}).get("filters") or {}
    tenant_id = action["tenant_id"]
    limit = filters.get("limit", 10)

    if action_type == "read_leads":
        query = {"tenant_id": tenant_id, "deleted": {"$ne": True}}
        if filters.get("status"):
            if isinstance(filters["status"], list):
                query["status"] = {"$in": filters["status"]}
            else:
                query["status"] = filters["status"]
        if filters.get("priority"):
            query["priority"] = filters["priority"]
        if filters.get("search"):
            regex = {"$regex": filters["search"], "$options": "i"}
            query["$or"] = [{"name": regex}, {"email": regex}, {"phone": {"$regex": filters["search"].replace(r"\D", "")}}]

        cursor = db.leads.find(query, {"_id": 0}).sort("created_at", -1).limit(limit)
        records = await cursor.to_list(limit)

        return {
            "executed": True,
            "message": f"Encontré {len(records)} lead{'s' if len(records) != 1 else ''}.",
            "records": records,
            "count": len(records),
        }

    elif action_type == "read_properties":
        query = {"tenant_id": tenant_id, "is_active": True}
        if filters.get("niche"):
            query["niche"] = filters["niche"]
        if filters.get("operation_type"):
            query["operation_type"] = filters["operation_type"]
        if filters.get("price_max"):
            query["price_mxn"] = {"$lte": filters["price_max"]}
        if filters.get("price_min"):
            query.setdefault("price_mxn", {})["$gte"] = filters["price_min"]
        if filters.get("search"):
            regex = {"$regex": filters["search"], "$options": "i"}
            query["$or"] = [{"title": regex}, {"sku": regex}, {"description": regex}]

        cursor = db.products.find(query, {"_id": 0}).sort("created_at", -1).limit(limit)
        records = await cursor.to_list(limit)

        return {
            "executed": True,
            "message": f"Encontré {len(records)} propiedad{'es' if len(records) != 1 else ''}.",
            "records": records,
            "count": len(records),
        }

    elif action_type == "read_tasks":
        # Para tasks, agregar filtro de visibilidad del usuario
        query = {
            "tenant_id": tenant_id,
            "deleted": {"$ne": True},
            "$or": [
                {"assigned_to": action["user_id"]},
                {"created_by": action["user_id"]},
            ],
        }
        if filters.get("status"):
            if isinstance(filters["status"], list):
                query["status"] = {"$in": filters["status"]}
            else:
                query["status"] = filters["status"]
        if filters.get("priority"):
            query["priority"] = filters["priority"]

        cursor = db.tasks.find(query, {"_id": 0}).sort("created_at", -1).limit(limit)
        records = await cursor.to_list(limit)

        return {
            "executed": True,
            "message": f"Encontré {len(records)} tarea{'s' if len(records) != 1 else ''}.",
            "records": records,
            "count": len(records),
        }

    elif action_type == "read_events":
        query = {"tenant_id": tenant_id, "user_id": action["user_id"]}
        if filters.get("start_from"):
            query["start_time"] = {"$gte": filters["start_from"]}
        if filters.get("start_until"):
            if "start_time" in query:
                query["start_time"]["$lte"] = filters["start_until"]
            else:
                query["start_time"] = {"$lte": filters["start_until"]}

        cursor = db.calendar_events.find(query, {"_id": 0}).sort("start_time", 1).limit(limit)
        records = await cursor.to_list(limit)

        return {
            "executed": True,
            "message": f"Encontré {len(records)} evento{'s' if len(records) != 1 else ''}.",
            "records": records,
            "count": len(records),
        }

    return {"executed": False, "message": "Tipo de lectura no reconocido"}


async def execute_hermes_update_action(action: dict, db: Any) -> dict:
    """Ejecuta acciones de actualización (UPDATE extendido)"""
    action_type = action.get("type")
    now = datetime.now(timezone.utc)

    if action_type == "update_property":
        payload = action.get("payload") or {}
        property_id = payload.get("property_id")
        update_fields = {k: v for k, v in payload.get("update", {}).items() if v is not None}
        update_fields["updated_at"] = now.isoformat()

        result = await db.products.update_one(
            {"tenant_id": action["tenant_id"], "id": property_id},
            {"$set": update_fields}
        )
        if result.matched_count == 0:
            return {"executed": False, "message": "No encontré la propiedad para actualizar."}

        return {
            "executed": True,
            "message": "Propiedad actualizada.",
            "record_ids": [property_id],
        }

    elif action_type == "update_task":
        payload = action.get("payload") or {}
        task_id = payload.get("task_id")
        update_fields = {k: v for k, v in payload.get("update", {}).items() if v is not None}
        update_fields["updated_at"] = now.isoformat()

        # Si se completa la tarea, agregar completed_at
        if update_fields.get("status") == "completada":
            update_fields["completed_at"] = now.isoformat()

        result = await db.tasks.update_one(
            {"tenant_id": action["tenant_id"], "id": task_id},
            {"$set": update_fields}
        )
        if result.matched_count == 0:
            return {"executed": False, "message": "No encontré la tarea para actualizar."}

        return {
            "executed": True,
            "message": "Tarea actualizada.",
            "record_ids": [task_id],
        }

    elif action_type == "update_event":
        payload = action.get("payload") or {}
        event_id = payload.get("event_id")
        update_fields = {k: v for k, v in payload.get("update", {}).items() if v is not None}

        result = await db.calendar_events.update_one(
            {"tenant_id": action["tenant_id"], "id": event_id},
            {"$set": update_fields}
        )
        if result.matched_count == 0:
            return {"executed": False, "message": "No encontré el evento para actualizar."}

        return {
            "executed": True,
            "message": "Evento actualizado.",
            "record_ids": [event_id],
        }

    return {"executed": False, "message": "Tipo de actualización no reconocido"}


async def execute_hermes_delete_action(action: dict, db: Any) -> dict:
    """Ejecuta acciones de eliminación (DELETE - soft delete)"""
    action_type = action.get("type")
    now = datetime.now(timezone.utc)

    if action_type == "delete_lead":
        lead_id = (action.get("payload") or {}).get("lead_id")
        result = await db.leads.update_one(
            {"tenant_id": action["tenant_id"], "id": lead_id},
            {"$set": {"deleted": True, "deleted_at": now.isoformat()}}
        )
        if result.matched_count == 0:
            return {"executed": False, "message": "No encontré el lead para eliminar."}

        return {
            "executed": True,
            "message": "Lead eliminado.",
            "record_ids": [lead_id],
        }

    elif action_type == "delete_property":
        property_id = (action.get("payload") or {}).get("property_id")
        # Soft delete: marcar como inactivo
        result = await db.products.update_one(
            {"tenant_id": action["tenant_id"], "id": property_id},
            {"$set": {"is_active": False, "deleted_at": now.isoformat()}}
        )
        if result.matched_count == 0:
            return {"executed": False, "message": "No encontré la propiedad para eliminar."}

        return {
            "executed": True,
            "message": "Propiedad eliminada (desactivada).",
            "record_ids": [property_id],
        }

    elif action_type == "delete_task":
        task_id = (action.get("payload") or {}).get("task_id")
        result = await db.tasks.update_one(
            {"tenant_id": action["tenant_id"], "id": task_id},
            {"$set": {"deleted": True, "deleted_at": now.isoformat()}}
        )
        if result.matched_count == 0:
            return {"executed": False, "message": "No encontré la tarea para eliminar."}

        return {
            "executed": True,
            "message": "Tarea eliminada.",
            "record_ids": [task_id],
        }

    elif action_type == "delete_event":
        event_id = (action.get("payload") or {}).get("event_id")
        # Para eventos, hard delete
        result = await db.calendar_events.delete_one(
            {"tenant_id": action["tenant_id"], "id": event_id}
        )
        if result.deleted_count == 0:
            return {"executed": False, "message": "No encontré el evento para eliminar."}

        return {
            "executed": True,
            "message": "Evento eliminado.",
            "record_ids": [event_id],
        }

    return {"executed": False, "message": "Tipo de eliminación no reconocido"}


# ============================================================================
# FORMATEADORES DE PREVIEW PARA NUEVAS ACCIONES
# ============================================================================

def format_read_action_preview(action: dict) -> str:
    """Formatea respuesta de acciones de lectura"""
    records = action.get("records", [])
    count = action.get("count", len(records))
    action_type = action.get("type")

    if action_type == "read_leads":
        if count == 0:
            return "No encontré leads con esos criterios."
        lines = [f"Encontré {count} lead{'s' if count != 1 else ''}:"]
        for i, lead in enumerate(records[:10], 1):
            lines.append(f"{i}. {lead.get('name')} - {lead.get('phone')} - {lead.get('status')} - {lead.get('priority')}")
        if count > 10:
            lines.append(f"... y {count - 10} más.")
        return "\n".join(lines)

    elif action_type == "read_properties":
        if count == 0:
            return "No encontré propiedades con esos criterios."
        lines = [f"Encontré {count} propiedad{'es' if count != 1 else ''}:"]
        for i, prop in enumerate(records[:10], 1):
            price = prop.get("price_mxn", 0)
            price_str = f"${price:,.0f}" if price else "Precio no disponible"
            lines.append(f"{i}. {prop.get('title')} - {price_str} - {prop.get('niche', 'N/D')}")
        if count > 10:
            lines.append(f"... y {count - 10} más.")
        return "\n".join(lines)

    elif action_type == "read_tasks":
        if count == 0:
            return "No encontré tareas pendientes."
        lines = [f"Encontré {count} tarea{'s' if count != 1 else ''}:"]
        for i, task in enumerate(records[:10], 1):
            due = task.get("due_date")
            due_str = f" - vence {due[:10]}" if due else ""
            lines.append(f"{i}. {task.get('title')} - {task.get('status')}{due_str}")
        if count > 10:
            lines.append(f"... y {count - 10} más.")
        return "\n".join(lines)

    elif action_type == "read_events":
        if count == 0:
            return "No encontré eventos agendados."
        lines = [f"Encontré {count} evento{'s' if count != 1 else ''}:"]
        for i, event in enumerate(records[:10], 1):
            start = event.get("start_time", "")
            start_str = start[:16] if start else "Sin hora"
            lines.append(f"{i}. {event.get('title')} - {start_str}")
        if count > 10:
            lines.append(f"... y {count - 10} más.")
        return "\n".join(lines)

    return str(action.get("message", "Consulta ejecutada"))


def format_update_action_preview(action: dict) -> str:
    """Formatea preview de acciones de actualización"""
    action_type = action.get("type")

    if action_type == "update_property":
        payload = action.get("payload") or {}
        update = payload.get("update") or {}
        lines = [
            "Voy a actualizar esta propiedad:",
            "",
            f"Propiedad: {payload.get('property_title')}",
        ]
        if "price_mxn" in update:
            lines.append(f"Precio nuevo: ${update['price_mxn']:,.0f}")
        if "title" in update:
            lines.append(f"Título nuevo: {update['title']}")
        if "is_active" in update:
            lines.append(f"Estado: {'Activa' if update['is_active'] else 'Inactiva'}")
        lines.extend(["", "¿Confirmas que lo actualice?"])
        return "\n".join(lines)

    elif action_type == "update_task":
        payload = action.get("payload") or {}
        update = payload.get("update") or {}
        lines = [
            "Voy a actualizar esta tarea:",
            "",
            f"Tarea: {payload.get('task_title')}",
        ]
        if "status" in update:
            lines.append(f"Estado nuevo: {update['status']}")
        if "priority" in update:
            lines.append(f"Prioridad nueva: {update['priority']}")
        if "due_date" in update:
            lines.append(f"Fecha nueva: {update['due_date'][:10]}")
        lines.extend(["", "¿Confirmas que lo actualice?"])
        return "\n".join(lines)

    elif action_type == "update_event":
        payload = action.get("payload") or {}
        update = payload.get("update") or {}
        lines = [
            "Voy a actualizar este evento:",
            "",
            f"Evento: {payload.get('event_title')}",
        ]
        if "start_time" in update:
            lines.append(f"Hora nueva: {update['start_time'][:16]}")
        if "title" in update:
            lines.append(f"Título nuevo: {update['title']}")
        lines.extend(["", "¿Confirmas que lo actualice?"])
        return "\n".join(lines)

    return "Voy a hacer una actualización. ¿Confirmas?"


def format_delete_action_preview(action: dict) -> str:
    """Formatea preview de acciones de eliminación"""
    action_type = action.get("type")
    payload = action.get("payload") or {}

    entity_names = {
        "delete_lead": ("lead", payload.get("lead_name", "este lead")),
        "delete_property": ("propiedad", payload.get("property_title", "esta propiedad")),
        "delete_task": ("tarea", payload.get("task_title", "esta tarea")),
        "delete_event": ("evento", payload.get("event_title", "este evento")),
    }

    entity_type, entity_name = entity_names.get(action_type, ("registro", "este registro"))

    lines = [
        f"⚠️ Estoy seguro de eliminar {entity_type}?",
        "",
        f"{entity_type.capitalize()}: {entity_name}",
        "",
        "Esta acción se puede deshacer. Responde 'sí' para eliminar o 'no' para cancelar.",
    ]
    return "\n".join(lines)


# ============================================================================
# EXPORTACIONES
# ============================================================================

__all__ = [
    # READ builders
    "build_pending_lead_read_action",
    "build_pending_property_read_action",
    "build_pending_task_read_action",
    "build_pending_event_read_action",
    # UPDATE builders
    "build_pending_property_update_action",
    "build_pending_task_update_action",
    "build_pending_event_update_action",
    # DELETE builders
    "build_pending_lead_delete_action",
    "build_pending_property_delete_action",
    "build_pending_task_delete_action",
    "build_pending_event_delete_action",
    # Executors
    "execute_hermes_read_action",
    "execute_hermes_update_action",
    "execute_hermes_delete_action",
    # Formatters
    "format_read_action_preview",
    "format_update_action_preview",
    "format_delete_action_preview",
]
