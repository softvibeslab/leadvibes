"""
PARCHE PARA SERVER.PY - INTEGRACIÓN DE HERMES CRUD COMPLETO

Este archivo contiene las modificaciones necesarias para integrar
las nuevas funcionalidades CRUD en server.py SIN modificar código existente.

Instrucciones de aplicación:
1. Buscar las secciones marcadas con "# === HERMES EXTENSION ===" en server.py
2. Agregar el código correspondiente después de cada marca

Autor: Agente Claude
Fecha: 2025-01-10
"""

# ============================================================================
# SECCIÓN 1: Imports (al principio del archivo, después de imports existentes)
# ============================================================================

# === HERMES EXTENSION: Agregar imports ===
# Agregar estas líneas después de los imports existentes en server.py:

try:
    from hermes_crud_extensions import (
        telegram_text_requests_lead_read,
        telegram_text_requests_property_read,
        telegram_text_requests_task_read,
        telegram_text_requests_event_read,
        telegram_text_requests_property_update,
        telegram_text_requests_task_update,
        telegram_text_requests_event_update,
        telegram_text_requests_lead_delete,
        telegram_text_requests_property_delete,
        telegram_text_requests_task_delete,
        telegram_text_requests_event_delete,
    )
    from hermes_action_builders import (
        build_pending_lead_read_action,
        build_pending_property_read_action,
        build_pending_task_read_action,
        build_pending_event_read_action,
        build_pending_property_update_action,
        build_pending_task_update_action,
        build_pending_event_update_action,
        build_pending_lead_delete_action,
        build_pending_property_delete_action,
        build_pending_task_delete_action,
        build_pending_event_delete_action,
        execute_hermes_read_action,
        execute_hermes_update_action,
        execute_hermes_delete_action,
        format_read_action_preview,
        format_update_action_preview,
        format_delete_action_preview,
    )
    HERMES_EXTENSIONS_AVAILABLE = True
except ImportError:
    HERMES_EXTENSIONS_AVAILABLE = False
    logger.warning("Hermes CRUD extensions not available - READ/UPDATE/DELETE operations will be limited")


# ============================================================================
# SECCIÓN 2: build_pending_telegram_action_from_text (línea ~6089)
# ============================================================================

# === HERMES EXTENSION: Agregar nuevos detectores en build_pending_telegram_action_from_text ===
# Reemplazar la función completa o agregar estas líneas después del último "if" existente:

"""
async def build_pending_telegram_action_from_text(
    *,
    text: str,
    link: dict,
    user: dict,
    role_scope: str,
    agent_name: str,
) -> dict | None:
    if telegram_text_requests_task_creation(text):
        return await build_pending_task_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name)
    if telegram_text_requests_lead_creation(text):
        return await build_pending_lead_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name)
    if telegram_text_requests_event_creation(text):
        return await build_pending_event_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name)
    if telegram_text_requests_property_creation(text):
        return await build_pending_property_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name)
    if telegram_text_requests_lead_update(text):
        return await build_pending_lead_update_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name)

    # === HERMES EXTENSION: Nuevas operaciones READ/UPDATE/DELETE ===
    if HERMES_EXTENSIONS_AVAILABLE:
        # Operaciones READ
        if telegram_text_requests_lead_read(text):
            return await build_pending_lead_read_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name, db=db)
        if telegram_text_requests_property_read(text):
            return await build_pending_property_read_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name, db=db)
        if telegram_text_requests_task_read(text):
            return await build_pending_task_read_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name, db=db)
        if telegram_text_requests_event_read(text):
            return await build_pending_event_read_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name, db=db)

        # Operaciones UPDATE (extendidas)
        if telegram_text_requests_property_update(text):
            return await build_pending_property_update_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name, db=db)
        if telegram_text_requests_task_update(text):
            return await build_pending_task_update_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name, db=db)
        if telegram_text_requests_event_update(text):
            return await build_pending_event_update_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name, db=db)

        # Operaciones DELETE
        if telegram_text_requests_lead_delete(text):
            return await build_pending_lead_delete_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name, db=db)
        if telegram_text_requests_property_delete(text):
            return await build_pending_property_delete_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name, db=db)
        if telegram_text_requests_task_delete(text):
            return await build_pending_task_delete_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name, db=db)
        if telegram_text_requests_event_delete(text):
            return await build_pending_event_delete_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name, db=db)
    # === FIN HERMES EXTENSION ===

    return None
"""


# ============================================================================
# SECCIÓN 3: format_pending_telegram_action_preview (línea ~6110)
# ============================================================================

# === HERMES EXTENSION: Agregar nuevos formateadores ===
# Agregar estos casos al final de la función, antes del return final:

"""
def format_pending_telegram_action_preview(action: dict) -> str:
    action_type = action.get("type")

    # ... código existente (cases para create_tasks, create_lead, etc.) ...

    # === HERMES EXTENSION: Nuevos formateadores ===
    if action_type in ("read_leads", "read_properties", "read_tasks", "read_events"):
        # Para READ, ejecutar inmediatamente y formatear resultado
        if HERMES_EXTENSIONS_AVAILABLE:
            result = await execute_hermes_read_action(action, db)
            return format_read_action_preview(result)

    if action_type in ("update_property", "update_task", "update_event"):
        return format_update_action_preview(action)

    if action_type in ("delete_lead", "delete_property", "delete_task", "delete_event"):
        return format_delete_action_preview(action)
    # === FIN HERMES EXTENSION ===

    return "Preparé un cambio para ROVI. ¿Confirmas que lo guarde?"
"""


# ============================================================================
# SECCIÓN 4: execute_pending_telegram_action (línea ~6195)
# ============================================================================

# === HERMES EXTENSION: Agregar nuevos ejecutores ===
# Agregar estos casos antes del "else" final:

"""
async def execute_pending_telegram_action(action: dict) -> dict:
    now = datetime.now(timezone.utc)
    action_type = action.get("type")

    # ... código existente (cases para create_tasks, create_lead, etc.) ...

    # === HERMES EXTENSION: Nuevos ejecutores ===
    if HERMES_EXTENSIONS_AVAILABLE:
        # Ya ejecutado en preview para READ, pero manejar aquí si viene directo
        if action_type in ("read_leads", "read_properties", "read_tasks", "read_events"):
            return await execute_hermes_read_action(action, db)

        if action_type in ("update_property", "update_task", "update_event"):
            return await execute_hermes_update_action(action, db)

        if action_type in ("delete_lead", "delete_property", "delete_task", "delete_event"):
            return await execute_hermes_delete_action(action, db)
    # === FIN HERMES EXTENSION ===

    else:
        return {"executed": False, "message": "Este tipo de acción todavía no tiene ejecutor."}
"""


# ============================================================================
# SECCIÓN 5: handle_rovi_telegram_agent_message (línea ~7041)
# ============================================================================

# === HERMES EXTENSION: Manejo especial para READ (sin confirmación) ===
# En la función handle_rovi_telegram_agent_message, modificar la parte que
# maneja acciones con tools_enabled["write_actions"]:

"""
if tools_enabled.get("write_actions"):
    action = await build_pending_telegram_action_from_text(
        text=text,
        link=link,
        user=user,
        role_scope=role_scope,
        agent_name=agent_name,
    )
    if action:
        # === HERMES EXTENSION: Para READ, ejecutar inmediatamente ===
        if action.get("type") in ("read_leads", "read_properties", "read_tasks", "read_events"):
            if HERMES_EXTENSIONS_AVAILABLE:
                result = await execute_hermes_read_action(action, db)
                response_text = format_read_action_preview(result)
                delivery = await send_telegram_message_with_token(get_rovi_telegram_bot_token(), chat_id, response_text)
                # Guardar audit trail
                await db.telegram_agent_messages.insert_one({
                    "id": f"telegram-agent-message-{uuid.uuid4()}",
                    "profile_id": link.get("hermes_profile_name") or "rovi-device-link",
                    "link_id": link["id"],
                    "tenant_id": link.get("tenant_id"),
                    "user_id": link["user_id"],
                    "role_scope": role_scope,
                    "chat_id": chat_id,
                    "telegram_user_id": str(telegram_user.get("id") or ""),
                    "message": text,
                    "response": response_text,
                    "delivery": delivery,
                    "agent_action_id": action["id"],
                    "action_type": action["type"],
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })
                return {"ok": True, "status": "read_executed", "delivery": delivery}
        # === FIN HERMES EXTENSION ===

        response_text = format_pending_telegram_action_preview(action)
        delivery = await send_telegram_message_with_token(get_rovi_telegram_bot_token(), chat_id, response_text)
        # ... resto del código existente ...
"""


# ============================================================================
# VERSIÓN COMPLETA DE LAS FUNCIONES MODIFICADAS
# ============================================================================

FULL_PENDING_ACTION_FROM_TEXT = """
async def build_pending_telegram_action_from_text(
    *,
    text: str,
    link: dict,
    user: dict,
    role_scope: str,
    agent_name: str,
) -> dict | None:
    # Operaciones CREATE existentes
    if telegram_text_requests_task_creation(text):
        return await build_pending_task_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name)
    if telegram_text_requests_lead_creation(text):
        return await build_pending_lead_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name)
    if telegram_text_requests_event_creation(text):
        return await build_pending_event_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name)
    if telegram_text_requests_property_creation(text):
        return await build_pending_property_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name)
    if telegram_text_requests_lead_update(text):
        return await build_pending_lead_update_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name)

    # === HERMES EXTENSION: Nuevas operaciones ===
    if HERMES_EXTENSIONS_AVAILABLE:
        # Operaciones READ
        if telegram_text_requests_lead_read(text):
            return await build_pending_lead_read_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name, db=db)
        if telegram_text_requests_property_read(text):
            return await build_pending_property_read_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name, db=db)
        if telegram_text_requests_task_read(text):
            return await build_pending_task_read_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name, db=db)
        if telegram_text_requests_event_read(text):
            return await build_pending_event_read_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name, db=db)

        # Operaciones UPDATE
        if telegram_text_requests_property_update(text):
            return await build_pending_property_update_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name, db=db)
        if telegram_text_requests_task_update(text):
            return await build_pending_task_update_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name, db=db)
        if telegram_text_requests_event_update(text):
            return await build_pending_event_update_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name, db=db)

        # Operaciones DELETE
        if telegram_text_requests_lead_delete(text):
            return await build_pending_lead_delete_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name, db=db)
        if telegram_text_requests_property_delete(text):
            return await build_pending_property_delete_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name, db=db)
        if telegram_text_requests_task_delete(text):
            return await build_pending_task_delete_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name, db=db)
        if telegram_text_requests_event_delete(text):
            return await build_pending_event_delete_action(text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name, db=db)

    return None
"""


FULL_ACTION_PREVIEW = """
def format_pending_telegram_action_preview(action: dict) -> str:
    action_type = action.get("type")

    # Casos existentes
    if action_type == "create_tasks":
        return format_pending_task_action_preview(action)
    if action_type == "create_lead":
        lead = (action.get("payload") or {}).get("lead") or {}
        lines = [
            "Puedo guardar este lead en ROVI, pero primero te muestro el preview:",
            "",
            f"Nombre: {lead.get('name')}",
            f"Teléfono: {lead.get('phone') or 'pendiente'}",
            f"Email: {lead.get('email') or 'pendiente'}",
            f"Prioridad: {lead.get('priority')}",
            f"Fuente: {lead.get('source')}",
        ]
        if lead.get("missing_fields"):
            lines.append(f"Campos faltantes: {', '.join(lead.get('missing_fields'))}")
        lines.extend(["", "¿Confirmas que lo guarde en ROVI?", "Responde `sí` para guardar o `no` para cancelar."])
        return "\n".join(lines)
    if action_type == "create_event":
        event = (action.get("payload") or {}).get("event") or {}
        lines = [
            "Puedo guardar este evento en ROVI, pero primero te muestro el preview:",
            "",
            f"Título: {event.get('title')}",
            f"Tipo: {event.get('event_type')}",
            f"Inicio sugerido: {event.get('start_time')}",
        ]
        if event.get("lead_name"):
            lines.append(f"Lead: {event.get('lead_name')}")
        if event.get("missing_fields"):
            lines.append(f"Por confirmar: {', '.join(event.get('missing_fields'))}")
        lines.extend(["", "¿Confirmas que lo guarde en ROVI?", "Responde `sí` para guardar o `no` para cancelar."])
        return "\n".join(lines)
    if action_type == "create_property":
        property_doc = (action.get("payload") or {}).get("property") or {}
        lines = [
            "Puedo guardar esta propiedad en ROVI, pero primero te muestro el preview:",
            "",
            f"Título: {property_doc.get('title')}",
            f"SKU: {property_doc.get('sku')}",
            f"Nicho: {property_doc.get('niche')}",
            f"Precio: {property_doc.get('price_mxn') or 'pendiente'}",
        ]
        if property_doc.get("missing_fields"):
            lines.append(f"Campos faltantes: {', '.join(property_doc.get('missing_fields'))}")
        lines.extend(["", "¿Confirmas que lo guarde en ROVI?", "Responde `sí` para guardar o `no` para cancelar."])
        return "\n".join(lines)
    if action_type == "update_lead":
        payload = action.get("payload") or {}
        lines = [
            "Puedo actualizar este lead en ROVI, pero primero te muestro el preview:",
            "",
            f"Lead: {payload.get('lead_name')}",
            f"Cambios: {json.dumps(payload.get('update') or {}, ensure_ascii=False)}",
            "",
            "¿Confirmas que lo actualice en ROVI?",
            "Responde `sí` para guardar o `no` para cancelar.",
        ]
        return "\n".join(lines)

    # === HERMES EXTENSION: Nuevos formateadores ===
    if action_type in ("read_leads", "read_properties", "read_tasks", "read_events"):
        if HERMES_EXTENSIONS_AVAILABLE:
            result = await execute_hermes_read_action(action, db)
            return format_read_action_preview(result)

    if action_type in ("update_property", "update_task", "update_event"):
        return format_update_action_preview(action)

    if action_type in ("delete_lead", "delete_property", "delete_task", "delete_event"):
        return format_delete_action_preview(action)

    return "Preparé un cambio para ROVI. ¿Confirmas que lo guarde?"
"""


FULL_EXECUTOR = """
async def execute_pending_telegram_action(action: dict) -> dict:
    now = datetime.now(timezone.utc)
    action_type = action.get("type")

    # Casos existentes (CREATE operations)
    if action_type == "create_tasks":
        # ... código existente ...
    elif action_type == "create_lead":
        # ... código existente ...
    elif action_type == "create_event":
        # ... código existente ...
    elif action_type == "create_property":
        # ... código existente ...
    elif action_type == "update_lead":
        # ... código existente ...

    # === HERMES EXTENSION: Nuevos ejecutores ===
    elif HERMES_EXTENSIONS_AVAILABLE:
        if action_type in ("read_leads", "read_properties", "read_tasks", "read_events"):
            return await execute_hermes_read_action(action, db)

        if action_type in ("update_property", "update_task", "update_event"):
            return await execute_hermes_update_action(action, db)

        if action_type in ("delete_lead", "delete_property", "delete_task", "delete_event"):
            return await execute_hermes_delete_action(action, db)
    # === FIN HERMES EXTENSION ===

    else:
        return {"executed": False, "message": "Este tipo de acción todavía no tiene ejecutor."}

    # ... código de audit trail existente ...
"""
