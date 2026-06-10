"""
HERMES CRUD EXTENSIONS

Módulo con extensiones para CRUD completo del Agente Hermes.
Este archivo AGREGA funcionalidad sin modificar código existente.

Autor: Agente Claude
Fecha: 2025-01-10
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Optional


# ============================================================================
# DETECTORES DE INTENCIÓN (NUEVOS)
# ============================================================================

def telegram_text_requests_lead_read(text: str) -> bool:
    """Detecta si el usuario quiere listar/buscar leads"""
    normalized = _normalize_action_command(text)
    lead_terms = ("lead", "leads", "cliente", "clientes", "prospecto", "prospectos")
    read_terms = ("lista", "listar", "muestrame", "mostrar", "ver", "buscar", "consulta", "consultar", "cuales", "qué", "cuanto")
    return any(term in normalized for term in lead_terms) and any(term in normalized for term in read_terms)


def telegram_text_requests_property_read(text: str) -> bool:
    """Detecta si el usuario quiere listar/buscar propiedades"""
    normalized = _normalize_action_command(text)
    property_terms = ("propiedad", "propiedades", "inmueble", "inmuebles", "lote", "lotes", "producto", "productos")
    read_terms = ("lista", "listar", "muestrame", "mostrar", "ver", "buscar", "consulta", "consultar", "cuales", "qué")
    return any(term in normalized for term in property_terms) and any(term in normalized for term in read_terms)


def telegram_text_requests_task_read(text: str) -> bool:
    """Detecta si el usuario quiere listar/buscar tareas"""
    normalized = _normalize_action_command(text)
    task_terms = ("tarea", "tareas", "pendiente", "pendientes", "seguimiento", "follow")
    read_terms = ("lista", "listar", "muestrame", "mostrar", "ver", "qué", "cuanto", "tengo")
    return any(term in normalized for term in task_terms) and any(term in normalized for term in read_terms)


def telegram_text_requests_event_read(text: str) -> bool:
    """Detecta si el usuario quiere listar/buscar eventos"""
    normalized = _normalize_action_command(text)
    event_terms = ("evento", "eventos", "cita", "citas", "reunion", "reunión", "reuniones", "agenda", "agendado")
    read_terms = ("lista", "listar", "muestrame", "mostrar", "ver", "qué", "cuanto", "tengo", "de hoy", "de mañana", "de esta semana")
    return any(term in normalized for term in event_terms) and any(term in normalized for term in read_terms)


def telegram_text_requests_property_update(text: str) -> bool:
    """Detecta si el usuario quiere actualizar una propiedad"""
    normalized = _normalize_action_command(text)
    property_terms = ("propiedad", "inmueble", "lote", "producto")
    update_terms = ("actualiza", "actualizar", "cambiar", "modificar", "editar", "precio", "comisión")
    return any(term in normalized for term in property_terms) and any(term in normalized for term in update_terms)


def telegram_text_requests_task_update(text: str) -> bool:
    """Detecta si el usuario quiere actualizar una tarea"""
    normalized = _normalize_action_command(text)
    task_terms = ("tarea", "pendiente", "seguimiento")
    update_terms = ("actualiza", "actualizar", "cambiar", "modificar", "completar", "terminar", "marcar", "hecha", "lista")
    return any(term in normalized for term in task_terms) and any(term in normalized for term in update_terms)


def telegram_text_requests_event_update(text: str) -> bool:
    """Detecta si el usuario quiere actualizar un evento"""
    normalized = _normalize_action_command(text)
    event_terms = ("evento", "cita", "reunion", "reunión", "agenda")
    update_terms = ("actualiza", "actualizar", "cambiar", "mover", "reagendar", "modificar", "horario", "hora")
    return any(term in normalized for term in event_terms) and any(term in normalized for term in update_terms)


def telegram_text_requests_lead_delete(text: str) -> bool:
    """Detecta si el usuario quiere eliminar un lead"""
    normalized = _normalize_action_command(text)
    lead_terms = ("lead", "cliente", "prospecto")
    delete_terms = ("elimina", "eliminar", "borrar", "borra", "descartar", "archivar")
    return any(term in normalized for term in lead_terms) and any(term in normalized for term in delete_terms)


def telegram_text_requests_property_delete(text: str) -> bool:
    """Detecta si el usuario quiere eliminar una propiedad"""
    normalized = _normalize_action_command(text)
    property_terms = ("propiedad", "inmueble", "lote", "producto")
    delete_terms = ("elimina", "eliminar", "borrar", "borra", "descartar", "archivar")
    return any(term in normalized for term in property_terms) and any(term in normalized for term in delete_terms)


def telegram_text_requests_task_delete(text: str) -> bool:
    """Detecta si el usuario quiere eliminar una tarea"""
    normalized = _normalize_action_command(text)
    task_terms = ("tarea", "pendiente", "seguimiento")
    delete_terms = ("elimina", "eliminar", "borrar", "borra", "cancelar", "quitar")
    return any(term in normalized for term in task_terms) and any(term in normalized for term in delete_terms)


def telegram_text_requests_event_delete(text: str) -> bool:
    """Detecta si el usuario quiere eliminar un evento"""
    normalized = _normalize_action_command(text)
    event_terms = ("evento", "cita", "reunion", "reunión", "agenda")
    delete_terms = ("elimina", "eliminar", "borrar", "borra", "cancelar", "quitar")
    return any(term in normalized for term in event_terms) and any(term in normalized for term in delete_terms)


# ============================================================================
# EXTRACTORES DE DATOS (NUEVOS)
# ============================================================================

def _normalize_action_command(text: str) -> str:
    """Normaliza texto para comparaciones (versión local del módulo)"""
    return " ".join(str(text or "").strip().lower().split())


def extract_id_from_text(text: str) -> Optional[str]:
    """Extrae ID de registros mencionados en texto (ej: 'lead ABC123', 'propiedad XYZ789')"""
    patterns = [
        r"(?:lead|cliente)\s+([A-Z0-9]{6,})",
        r"(?:propiedad|inmueble|producto)\s+([A-Z0-9]{6,})",
        r"(?:tarea|task|pendiente)\s+([A-Z0-9]{6,})",
        r"(?:evento|cita)\s+([A-Z0-9]{6,})",
        r"\b([A-Z0-9]{10,})\b",  # IDs largos solos
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).upper()
    return None


def extract_status_filter(text: str) -> Optional[list[str]]:
    """Extrae filtro de status desde texto"""
    statuses = ["nuevo", "contactado", "calificacion", "presentacion", "apartado", "venta", "perdido", "completada", "pendiente"]
    found = [s for s in statuses if s in text.lower()]
    return found if found else None


def extract_priority_filter(text: str) -> Optional[str]:
    """Extrae filtro de prioridad"""
    if "urgente" in text.lower():
        return "urgente"
    if "alta" in text.lower():
        return "alta"
    if "baja" in text.lower():
        return "baja"
    return None


def extract_price_max(text: str) -> Optional[float]:
    """Extrae precio máximo desde texto"""
    match = re.search(r"hasta\s*\$?(\d+(?:\.\d+)?)\s*([kmmb]?)", text, re.IGNORECASE)
    if match:
        price = float(match.group(1))
        multiplier = match.group(2).lower()
        if multiplier == "m":
            price *= 1_000_000
        elif multiplier == "k":
            price *= 1_000
        elif multiplier == "b":
            price *= 1_000_000_000
        return price
    # También buscar patrones como "$3M" directamente
    match = re.search(r"\$\s*(\d+(?:\.\d+)?)\s*([kmmb]?)", text, re.IGNORECASE)
    if match:
        price = float(match.group(1))
        multiplier = match.group(2).lower()
        if multiplier == "m":
            price *= 1_000_000
        elif multiplier == "k":
            price *= 1_000
        elif multiplier == "b":
            price *= 1_000_000_000
        return price
    return None


def extract_price_min(text: str) -> Optional[float]:
    """Extrae precio mínimo desde texto"""
    match = re.search(r"desde\s*\$?(\d+(?:\.\d+)?)\s*([kmmb]?)", text, re.IGNORECASE)
    if match:
        price = float(match.group(1))
        multiplier = match.group(2).lower()
        if multiplier == "m":
            price *= 1_000_000
        elif multiplier == "k":
            price *= 1_000
        elif multiplier == "b":
            price *= 1_000_000_000
        return price
    return None


def extract_niche_filter(text: str) -> Optional[str]:
    """Extrae filtro de nicho de propiedad"""
    niches = {
        "residencial": "Residencial",
        "comercial": "Comercial",
        "vip": "VIP",
        "lujo": "VIP",
        "industrial": "Industrial",
        "terreno": "Terreno",
    }
    normalized = text.lower()
    for key, value in niches.items():
        if key in normalized:
            return value
    return None


def extract_operation_type_filter(text: str) -> Optional[str]:
    """Extrae filtro de tipo de operación"""
    if "renta" in text.lower() or "alquiler" in text.lower():
        return "rent"
    if "venta" in text.lower() or "compra" in text.lower() or "vende" in text.lower():
        return "sale"
    return None


def extract_date_start(text: str) -> Optional[str]:
    """Extrae fecha de inicio para eventos"""
    now = datetime.now(timezone.utc)
    if "hoy" in text.lower():
        return now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    if "mañana" in text.lower() or "manana" in text.lower():
        return (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    if "esta semana" in text.lower():
        week_start = now - timedelta(days=now.weekday())
        return week_start.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    return None


def extract_date_end(text: str) -> Optional[str]:
    """Extrae fecha fin para eventos"""
    now = datetime.now(timezone.utc)
    if "hoy" in text.lower():
        return now.replace(hour=23, minute=59, second=59, microsecond=0).isoformat()
    if "esta semana" in text.lower():
        week_end = now + timedelta(days=6 - now.weekday())
        return week_end.replace(hour=23, minute=59, second=59, microsecond=0).isoformat()
    return None


def extract_search_term(text: str) -> Optional[str]:
    """Extrae término de búsqueda genérico"""
    # Buscar después de "buscar" o palabras similares
    patterns = [
        r"buscar\s+(?:de\s+)?(.+?)(?:\s+hasta|\s+$|\s+con|\s+donde)",
        r"buscar\s+(.+)$",
        r"mostrar\s+(.+?)(?:\s+con|\s+donde|\s+hasta|$)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            term = match.group(1).strip()
            if len(term) > 2:  # Ignorar términos muy cortos
                return term[:50]  # Limitar longitud
    return None


def extract_title_update(text: str) -> Optional[str]:
    """Extrae nuevo título para actualizaciones"""
    patterns = [
        r"(?:título|titulo)\s+(?:a\s+|=)\s*(.+?)(?:$|,|\n)",
        r"cambiar\s+(?:titulo|título)\s+(?:a\s+|por\s+)(.+?)(?:$|,|\n)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()[:100]
    return None


def extract_new_price(text: str) -> Optional[float]:
    """Extrae nuevo precio para actualizaciones"""
    patterns = [
        r"(?:precio|valor)\s+(?:a\s+|=)\s*\$?\s*(\d+(?:\.\d+)?)\s*([kmmb]?)",
        r"cambiar\s+precio\s+(?:a\s+|por)\s*\$?\s*(\d+(?:\.\d+)?)\s*([kmmb]?)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            price = float(match.group(1))
            multiplier = match.group(2).lower()
            if multiplier == "m":
                price *= 1_000_000
            elif multiplier == "k":
                price *= 1_000
            elif multiplier == "b":
                price *= 1_000_000_000
            return price
    return None


def extract_new_status(text: str, entity_type: str = "lead") -> Optional[str]:
    """Extrae nuevo status para actualizaciones"""
    if entity_type == "task":
        statuses = {"pendiente": "pendiente", "en progreso": "en_progreso", "en espera": "en_espera", "completada": "completada", "terminada": "completada", "cancelada": "cancelada"}
    else:  # lead
        statuses = {"nuevo": "nuevo", "contactado": "contactado", "calificacion": "calificacion", "presentacion": "presentacion", "apartado": "apartado", "venta": "venta", "vendido": "venta", "perdido": "perdido"}

    normalized = text.lower()
    for key, value in statuses.items():
        if key in normalized:
            return value
    return None


def extract_due_date(text: str) -> Optional[str]:
    """Extrae fecha de vencimiento para tareas"""
    now = datetime.now(timezone.utc)
    if "hoy" in text.lower():
        return now.replace(hour=18, minute=0, second=0, microsecond=0).isoformat()
    if "mañana" in text.lower() or "manana" in text.lower():
        return (now + timedelta(days=1)).replace(hour=18, minute=0, second=0, microsecond=0).isoformat()
    # Buscar patrones como "para el viernes", "para el 15"
    match = re.search(r"para\s+el\s+(\d+)", text, re.IGNORECASE)
    if match:
        day = int(match.group(1))
        if 1 <= day <= 31:
            try:
                return now.replace(day=day, hour=18, minute=0, second=0, microsecond=0).isoformat()
            except ValueError:
                pass
    return None


def extract_new_time(text: str) -> Optional[str]:
    """Extrae nueva hora para eventos (ej: "a las 3pm", "para las 10:00")"""
    now = datetime.now(timezone.utc)
    # Buscar patrones de hora
    match = re.search(r"(?:a\s+las?\s+|para\s+las?\s+)?(\d{1,2}):?(\d{2})?\s*(am|pm)?", text, re.IGNORECASE)
    if match:
        hour = int(match.group(1))
        minute = int(match.group(2)) if match.group(2) else 0
        meridiem = match.group(3)
        if meridiem and meridiem.lower() == "pm" and hour < 12:
            hour += 12
        if hour < 24 and minute < 60:
            return now.replace(hour=hour, minute=minute, second=0, microsecond=0).isoformat()
    return None


def extract_reason(text: str) -> Optional[str]:
    """Extrae razón para eliminación"""
    patterns = [
        r"(?:porque|por|razón|motivo)\s+(.+?)(?:$|,|\n)",
        r"por\s+(.+?)(?:$|,|\n)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()[:200]
    return "Eliminado desde Telegram"


# ============================================================================
# FUNCIONES DE BÚSQUEDA DE REGISTROS
# ============================================================================

def apply_role_scope_visibility(query: dict, entity: str, user_id: str | None, role_scope: str | None) -> dict:
    """Restrict record lookup for broker-scoped Telegram CRUD actions."""
    if role_scope != "broker" or not user_id:
        return query
    if entity == "lead":
        return {**query, "$or": [{"assigned_broker_id": user_id}, {"created_by": user_id}]}
    if entity == "property":
        return {
            **query,
            "$or": [
                {"responsible_broker_id": user_id},
                {"assigned_brokers": user_id},
                {"created_by": user_id},
            ],
        }
    if entity == "task":
        return {**query, "$or": [{"assigned_to": user_id}, {"created_by": user_id}]}
    if entity == "event":
        return {**query, "user_id": user_id}
    return query


async def find_lead_match(db, tenant_id: str, text: str, user_id: str | None = None, role_scope: str | None = None) -> Optional[dict]:
    """Busca lead por nombre o ID en texto"""
    # Primero intentar extraer ID
    lead_id = extract_id_from_text(text)
    if lead_id:
        lead = await db.leads.find_one(
            apply_role_scope_visibility({"tenant_id": tenant_id, "id": lead_id, "deleted": {"$ne": True}}, "lead", user_id, role_scope),
            {"_id": 0, "id": 1, "name": 1, "status": 1, "priority": 1}
        )
        if lead:
            return lead

    # Si no hay ID, buscar por nombre
    leads = await db.leads.find(
        apply_role_scope_visibility({"tenant_id": tenant_id, "deleted": {"$ne": True}}, "lead", user_id, role_scope),
        {"_id": 0, "id": 1, "name": 1, "status": 1, "priority": 1}
    ).limit(25).to_list(25)

    normalized = text.lower()
    for lead in leads:
        name = (lead.get("name") or "").lower()
        if name and name in normalized:
            return lead
    # Si no coincide exactamente, retornar el más reciente
    return leads[0] if leads else None


async def find_property_match(db, tenant_id: str, text: str, user_id: str | None = None, role_scope: str | None = None) -> Optional[dict]:
    """Busca propiedad por nombre o ID en texto"""
    # Primero intentar extraer ID
    prop_id = extract_id_from_text(text)
    if prop_id:
        prop = await db.products.find_one(
            apply_role_scope_visibility({"tenant_id": tenant_id, "id": prop_id}, "property", user_id, role_scope),
            {"_id": 0, "id": 1, "title": 1, "sku": 1, "price_mxn": 1}
        )
        if prop:
            return prop

    # Si no hay ID, buscar por título
    products = await db.products.find(
        apply_role_scope_visibility({"tenant_id": tenant_id, "is_active": True}, "property", user_id, role_scope),
        {"_id": 0, "id": 1, "title": 1, "sku": 1, "price_mxn": 1}
    ).limit(25).to_list(25)

    normalized = text.lower()
    for prop in products:
        title = (prop.get("title") or "").lower()
        if title and title in normalized:
            return prop
    return products[0] if products else None


async def find_task_match(db, tenant_id: str, user_id: str, text: str, role_scope: str | None = None) -> Optional[dict]:
    """Busca tarea por título o ID en texto"""
    # Primero intentar extraer ID
    task_id = extract_id_from_text(text)
    if task_id:
        task = await db.tasks.find_one(
            apply_role_scope_visibility({"tenant_id": tenant_id, "id": task_id, "deleted": {"$ne": True}}, "task", user_id, role_scope),
            {"_id": 0, "id": 1, "title": 1, "status": 1}
        )
        if task:
            return task

    # Si no hay ID, buscar por título (tareas del usuario)
    tasks = await db.tasks.find(
        apply_role_scope_visibility({"tenant_id": tenant_id, "deleted": {"$ne": True}}, "task", user_id, role_scope),
        {"_id": 0, "id": 1, "title": 1, "status": 1}
    ).limit(25).to_list(25)

    normalized = text.lower()
    for task in tasks:
        title = (task.get("title") or "").lower()
        if title and title in normalized:
            return task
    return tasks[0] if tasks else None


async def find_event_match(db, tenant_id: str, user_id: str, text: str, role_scope: str | None = None) -> Optional[dict]:
    """Busca evento por título o ID en texto"""
    # Primero intentar extraer ID
    event_id = extract_id_from_text(text)
    if event_id:
        event = await db.calendar_events.find_one(
            apply_role_scope_visibility({"tenant_id": tenant_id, "id": event_id}, "event", user_id, role_scope),
            {"_id": 0, "id": 1, "title": 1, "start_time": 1}
        )
        if event:
            return event

    # Si no hay ID, buscar por título (eventos del usuario)
    events = await db.calendar_events.find(
        apply_role_scope_visibility({"tenant_id": tenant_id}, "event", user_id, role_scope),
        {"_id": 0, "id": 1, "title": 1, "start_time": 1}
    ).sort("start_time", -1).limit(25).to_list(25)

    normalized = text.lower()
    for event in events:
        title = (event.get("title") or "").lower()
        if title and title in normalized:
            return event
    return events[0] if events else None


# ============================================================================
# FUNCIÓN PARA EXPORTAR - AÑADIR A BUILD_PENDING_ACTION_FROM_TEXT
# ============================================================================

HERMES_EXTENSION_FUNCTIONS = {
    "detectors": [
        "telegram_text_requests_lead_read",
        "telegram_text_requests_property_read",
        "telegram_text_requests_task_read",
        "telegram_text_requests_event_read",
        "telegram_text_requests_property_update",
        "telegram_text_requests_task_update",
        "telegram_text_requests_event_update",
        "telegram_text_requests_lead_delete",
        "telegram_text_requests_property_delete",
        "telegram_text_requests_task_delete",
        "telegram_text_requests_event_delete",
    ],
    "builders": [
        "build_pending_lead_read_action",
        "build_pending_property_read_action",
        "build_pending_task_read_action",
        "build_pending_event_read_action",
        "build_pending_property_update_action",
        "build_pending_task_update_action",
        "build_pending_event_update_action",
        "build_pending_lead_delete_action",
        "build_pending_property_delete_action",
        "build_pending_task_delete_action",
        "build_pending_event_delete_action",
    ],
}


# Exportar todas las funciones para fácil importación
__all__ = [
    # Detectores
    "telegram_text_requests_lead_read",
    "telegram_text_requests_property_read",
    "telegram_text_requests_task_read",
    "telegram_text_requests_event_read",
    "telegram_text_requests_property_update",
    "telegram_text_requests_task_update",
    "telegram_text_requests_event_update",
    "telegram_text_requests_lead_delete",
    "telegram_text_requests_property_delete",
    "telegram_text_requests_task_delete",
    "telegram_text_requests_event_delete",
    # Extractores
    "extract_id_from_text",
    "extract_status_filter",
    "extract_priority_filter",
    "extract_price_max",
    "extract_price_min",
    "extract_niche_filter",
    "extract_operation_type_filter",
    "extract_date_start",
    "extract_date_end",
    "extract_search_term",
    "extract_title_update",
    "extract_new_price",
    "extract_new_status",
    "extract_due_date",
    "extract_new_time",
    "extract_reason",
    # Buscadores de registros
    "apply_role_scope_visibility",
    "find_lead_match",
    "find_property_match",
    "find_task_match",
    "find_event_match",
    # Metadatos
    "HERMES_EXTENSION_FUNCTIONS",
]
