# Diseño: CRUD Completo para Agente Hermes

## Estado Actual - Capacidades CRUD

| Entidad | CREATE | READ | UPDATE | DELETE | BULK |
|---------|--------|------|--------|--------|------|
| **Leads** | ✅ | ❌ | ✅ (solo status) | ❌ | ❌ |
| **Properties** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Tasks** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Events** | ✅ | ❌ | ❌ | ❌ | ❌ |

**Legenda:**
- ✅ = Implementado
- ❌ = No implementado

---

## Operaciones Faltantes a Implementar

### 1. Operaciones READ (Consulta)

#### 1.1 Leads - Listar y Buscar
```python
# Función: telegram_text_requests_lead_read()
# Patrones: "listar leads", "mis leads", "buscar lead", "mostrar clientes"

async def build_pending_lead_read_action(
    *, text: str, link: dict, user: dict, role_scope: str, agent_name: str
) -> dict | None:
    """Prepara una consulta de leads con filtros"""
    filters = {
        "status": extract_status_filter(text),     # "leads en contactado"
        "priority": extract_priority_filter(text),  # "leads urgentes"
        "search": extract_search_term(text),        # "buscar lead Juan"
        "limit": 10,
    }
    return {
        "id": f"telegram-agent-action-{uuid4()}",
        "type": "read_leads",
        "payload": {"filters": filters},
        # ...
    }
```

#### 1.2 Properties - Listar y Buscar
```python
# Función: telegram_text_requests_property_read()
# Patrones: "listar propiedades", "mis propiedades", "buscar inmueble"

async def build_pending_property_read_action(...) -> dict | None:
    filters = {
        "niche": extract_niche_filter(text),       # "propiedades residenciales"
        "operation_type": extract_operation(text),  # "propiedades en renta"
        "price_max": extract_price_max(text),        # "propiedades hasta 5M"
        "search": extract_search_term(text),
        "limit": 10,
    }
```

#### 1.3 Tasks - Listar y Buscar
```python
# Función: telegram_text_requests_task_read()
# Patrones: "mis tareas", "tareas pendientes", "qué tengo pendiente"

async def build_pending_task_read_action(...) -> dict | None:
    filters = {
        "status": ["pendiente", "en_progreso"],      # Por defecto activas
        "priority": extract_priority_filter(text),
        "assigned_to": user["id"],                   # Solo del usuario
        "lead_id": extract_related_lead(text),
        "limit": 10,
    }
```

#### 1.4 Events - Listar y Buscar
```python
# Función: telegram_text_requests_event_read()
# Patrones: "mi agenda", "eventos de hoy", "qué tengo agendado"

async def build_pending_event_read_action(...) -> dict | None:
    filters = {
        "start_from": extract_date_start(text),     # "eventos desde mañana"
        "start_until": extract_date_until(text),    # "eventos hasta el viernes"
        "lead_id": extract_related_lead(text),
        "limit": 10,
    }
```

### 2. Operaciones UPDATE (Actualización Completa)

#### 2.1 Property Update
```python
# Función: telegram_text_requests_property_update()
# Patrones: "actualizar propiedad", "modificar inmueble", "cambiar precio propiedad"

async def build_pending_property_update_action(...) -> dict | None:
    property_id = extract_id_from_text(text) or await_find_property_match(text)
    update_fields = {
        "title": extract_title(text),
        "price_mxn": extract_price(text),
        "commission_percentage": extract_commission(text),
        "is_active": extract_active_status(text),
    }
```

#### 2.2 Task Update
```python
# Función: telegram_text_requests_task_update()
# Patrones: "actualizar tarea", "completar tarea", "marcar tarea hecha"

async def build_pending_task_update_action(...) -> dict | None:
    task_id = extract_id_from_text(text) or await_find_task_match(text)
    update_fields = {
        "status": extract_status(text),  # "completar tarea" → status: "completada"
        "priority": extract_priority(text),
        "due_date": extract_due_date(text),
    }
```

#### 2.3 Event Update
```python
# Función: telegram_text_requests_event_update()
# Patrones: "mover evento", "cambiar hora visita", "reagendar cita"

async def build_pending_event_update_action(...) -> dict | None:
    event_id = extract_id_from_text(text) or await_find_event_match(text)
    update_fields = {
        "start_time": extract_new_start_time(text),
        "end_time": extract_new_end_time(text),
        "title": extract_title(text),
    }
```

### 3. Operaciones DELETE (Eliminación)

#### 3.1 Lead Delete
```python
# Función: telegram_text_requests_lead_delete()
# Patrones: "eliminar lead", "borrar cliente", "descartar lead"

async def build_pending_lead_delete_action(...) -> dict | None:
    lead_id = extract_id_from_text(text) or await_find_lead_match(text)
    return {
        "type": "delete_lead",
        "payload": {"lead_id": lead_id, "reason": extract_reason(text)},
    }
```

#### 3.2 Property Delete
```python
# Función: telegram_text_requests_property_delete()
# Patrones: "eliminar propiedad", "borrar inmueble"

async def build_pending_property_delete_action(...) -> dict | None:
    property_id = extract_id_from_text(text) or await_find_property_match(text)
    return {
        "type": "delete_property",
        "payload": {"property_id": property_id},
    }
```

#### 3.3 Task Delete
```python
# Función: telegram_text_requests_task_delete()
# Patrones: "eliminar tarea", "borrar pendiente"

async def build_pending_task_delete_action(...) -> dict | None:
    task_id = extract_id_from_text(text) or await_find_task_match(text)
    return {
        "type": "delete_task",
        "payload": {"task_id": task_id},
    }
```

#### 3.4 Event Delete
```python
# Función: telegram_text_requests_event_delete()
# Patrones: "cancelar evento", "borrar cita", "eliminar reunión"

async def build_pending_event_delete_action(...) -> dict | None:
    event_id = extract_id_from_text(text) or await_find_event_match(text)
    return {
        "type": "delete_event",
        "payload": {"event_id": event_id},
    }
```

---

## Ejecutores para Nuevas Acciones

### Executor para READ

```python
async def execute_read_action(action: dict) -> dict:
    action_type = action.get("type")

    if action_type == "read_leads":
        filters = (action.get("payload") or {}).get("filters") or {}
        query = build_lead_query(filters, action["tenant_id"])
        cursor = db.leads.find(query).limit(filters.get("limit", 10))
        records = await cursor.to_list(10)
        return format_read_response("leads", records)

    elif action_type == "read_properties":
        filters = (action.get("payload") or {}).get("filters") or {}
        query = build_property_query(filters, action["tenant_id"])
        cursor = db.products.find(query).limit(filters.get("limit", 10))
        records = await cursor.to_list(10)
        return format_read_response("properties", records)

    elif action_type == "read_tasks":
        filters = (action.get("payload") or {}).get("filters") or {}
        query = build_task_query(filters, action["tenant_id"], action["user_id"])
        cursor = db.tasks.find(query).limit(filters.get("limit", 10))
        records = await cursor.to_list(10)
        return format_read_response("tasks", records)

    elif action_type == "read_events":
        filters = (action.get("payload") or {}).get("filters") or {}
        query = build_event_query(filters, action["tenant_id"], action["user_id"])
        cursor = db.calendar_events.find(query).limit(filters.get("limit", 10))
        records = await cursor.to_list(10)
        return format_read_response("events", records)
```

### Executor para UPDATE (completo)

```python
async def execute_update_action(action: dict) -> dict:
    action_type = action.get("type")

    if action_type == "update_property":
        payload = action.get("payload") or {}
        property_id = payload.get("property_id")
        update_fields = {k: v for k, v in payload.get("update", {}).items() if v is not None}
        update_fields["updated_at"] = now_utc()

        result = await db.products.update_one(
            {"tenant_id": action["tenant_id"], "id": property_id},
            {"$set": update_fields}
        )
        if result.matched_count == 0:
            return {"executed": False, "message": "No encontré la propiedad."}
        return {"executed": True, "message": "Propiedad actualizada."}

    elif action_type == "update_task":
        # Similar implementación para tasks
        ...

    elif action_type == "update_event":
        # Similar implementación para events
        ...
```

### Executor para DELETE

```python
async def execute_delete_action(action: dict) -> dict:
    action_type = action.get("type")

    if action_type == "delete_lead":
        lead_id = (action.get("payload") or {}).get("lead_id")
        result = await db.leads.update_one(
            {"tenant_id": action["tenant_id"], "id": lead_id},
            {"$set": {"deleted": True, "deleted_at": now_utc()}}
        )
        if result.matched_count == 0:
            return {"executed": False, "message": "No encontré el lead."}
        return {"executed": True, "message": "Lead eliminado (soft delete)."}

    elif action_type == "delete_property":
        property_id = (action.get("payload") or {}).get("property_id")
        result = await db.products.update_one(
            {"tenant_id": action["tenant_id"], "id": property_id},
            {"$set": {"is_active": False, "deleted_at": now_utc()}}
        )
        ...

    elif action_type == "delete_task":
        task_id = (action.get("payload") or {}).get("task_id")
        result = await db.tasks.update_one(
            {"tenant_id": action["tenant_id"], "id": task_id},
            {"$set": {"deleted": True, "deleted_at": now_utc()}}
        )
        ...

    elif action_type == "delete_event":
        event_id = (action.get("payload") or {}).get("event_id")
        result = await db.calendar_events.delete_one(
            {"tenant_id": action["tenant_id"], "id": event_id}
        )
        ...
```

---

## Funciones de Utilidad para Extracción

```python
def extract_id_from_text(text: str) -> str | None:
    """Extrae ID de registros mencionados en texto"""
    # Busca patrones como "lead ABC123", "propiedad XYZ789"
    import re
    patterns = [
        r"(?:lead|cliente)\s+([A-Z0-9]{6,})",
        r"(?:propiedad|inmueble|producto)\s+([A-Z0-9]{6,})",
        r"(?:tarea|task)\s+([A-Z0-9]{6,})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).upper()
    return None

async def find_lead_match(tenant_id: str, text: str) -> str | None:
    """Busca lead por nombre en texto"""
    leads = await db.leads.find(
        {"tenant_id": tenant_id, "deleted": {"$ne": True}},
        {"_id": 0, "id": 1, "name": 1}
    ).limit(50).to_list(50)

    normalized = text.lower()
    for lead in leads:
        if lead.get("name", "").lower() in normalized:
            return lead["id"]
    return None

def extract_status_filter(text: str) -> list[str] | None:
    """Extrae filtro de status desde texto"""
    statuses = ["nuevo", "contactado", "calificacion", "presentacion", "apartado", "venta", "perdido"]
    found = [s for s in statuses if s in text.lower()]
    return found if found else None

def extract_priority_filter(text: str) -> str | None:
    """Extrae filtro de prioridad"""
    if "urgente" in text.lower():
        return "urgente"
    if "alta" in text.lower():
        return "alta"
    if "baja" in text.lower():
        return "baja"
    return None

def extract_price_max(text: str) -> float | None:
    """Extrae precio máximo desde texto"""
    import re
    match = re.search(r"hasta\s*\$?(\d+(?:\.\d+)?)\s*[kmb]?", text, re.IGNORECASE)
    if match:
        price = float(match.group(1))
        if "m" in text.lower():
            price *= 1_000_000
        elif "k" in text.lower():
            price *= 1_000
        return price
    return None
```

---

## Integración en build_pending_telegram_action_from_text

```python
async def build_pending_telegram_action_from_text(
    *, text: str, link: dict, user: dict, role_scope: str, agent_name: str
) -> dict | None:
    # ... código existente ...

    # Nuevos handlers para READ
    if telegram_text_requests_lead_read(text):
        return await build_pending_lead_read_action(
            text=text, link=link, user=user, role_scope=role_scope, agent_name=agent_name
        )
    if telegram_text_requests_property_read(text):
        return await build_pending_property_read_action(...)
    if telegram_text_requests_task_read(text):
        return await build_pending_task_read_action(...)
    if telegram_text_requests_event_read(text):
        return await build_pending_event_read_action(...)

    # Nuevos handlers para UPDATE (extendiendo lead update existente)
    if telegram_text_requests_property_update(text):
        return await build_pending_property_update_action(...)
    if telegram_text_requests_task_update(text):
        return await build_pending_task_update_action(...)
    if telegram_text_requests_event_update(text):
        return await build_pending_event_update_action(...)

    # Nuevos handlers para DELETE
    if telegram_text_requests_lead_delete(text):
        return await build_pending_lead_delete_action(...)
    if telegram_text_requests_property_delete(text):
        return await build_pending_property_delete_action(...)
    if telegram_text_requests_task_delete(text):
        return await build_pending_task_delete_action(...)
    if telegram_text_requests_event_delete(text):
        return await build_pending_event_delete_action(...)

    return None
```

---

## Ejemplos de Intercambios Usuario → Agente

### READ Examples

```
Usuario: "¿Cuáles son mis leads urgentes?"
Agente: "Encontré 3 leads urgentes:
1. Juan Pérez - tel +52... - presupuesto $5M
2. María López - tel +52... - presupuesto $3M
3. Carlos Ruiz - tel +52... - presupuesto $8M
¿Quieres ver detalles de alguno?"

Usuario: "Listar propiedades residenciales hasta 3 millones"
Agente: "Encontré 5 propiedades:
1. Lote Selva - $1.8M - Residencial
2. Depa Centro - $2.5M - Residencial
3. Casa Jungle - $2.9M - Residencial
..."
```

### UPDATE Examples

```
Usuario: "Actualizar propiedad lote ABC123 a precio $2.5M"
Agente: "Voy a actualizar:
Propiedad: Lote Selva (ABC123)
Precio: $2.5M
¿Confirmas?"

Usuario: "Completar tarea XYZ789"
Agente: "Voy a marcar como completada:
Tarea: Llamar a Juan Pérez
¿Confirmas?"
```

### DELETE Examples

```
Usuario: "Eliminar lead DEF456"
Agente: "⚠️ Estoy seguro?
Lead: Juan Pérez (DEF456)
Esta acción se puede deshacer. Responde 'sí' para eliminar."

Usuario: "sí"
Agente: "Lead eliminado. Si te equivocaste, escríbeme 'deshacer'."
```

---

## Matriz CRUD Final (Target)

| Entidad | CREATE | READ | UPDATE | DELETE | SEARCH |
|---------|--------|------|--------|--------|--------|
| **Leads** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Properties** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Tasks** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Events** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Plan de Implementación

### Fase 1: Operaciones READ (prioridad alta) ✅ COMPLETADO
- [x] `telegram_text_requests_*_read()` functions
- [x] `build_pending_*_read_action()` functions
- [x] `execute_read_action()` function
- [x] Formateadores de respuesta para Telegram

### Fase 2: Operaciones UPDATE extendidas ✅ COMPLETADO
- [x] `telegram_text_requests_*_update()` para property, task, event
- [x] `build_pending_*_update_action()` functions
- [x] `execute_update_action()` function extendido

### Fase 3: Operaciones DELETE ✅ COMPLETADO
- [x] `telegram_text_requests_*_delete()` functions
- [x] `build_pending_*_delete_action()` functions
- [x] `execute_delete_action()` function
- [x] Soft delete para todas las entidades

### Fase 4: Búsqueda avanzada ✅ COMPLETADO
- [x] Búsqueda por nombre/filtros combinados
- [x] Paginación para resultados grandes (limit por defecto: 10)
- [x] Ordenamiento por distintos campos

---

## Estado de Implementación (2025-01-10)

**Archivos creados:**
- `backend/hermes_crud_extensions.py` - Detectores y extractores para READ/UPDATE/DELETE
- `backend/hermes_action_builders.py` - Builders y executores para todas las operaciones
- `backend/hermes_server_patch.py` - Documentación de integración

**Archivos modificados:**
- `backend/server.py` - Integración de extensiones via try/except

**Capacidades CRUD implementadas:**

| Entidad | CREATE | READ | UPDATE | DELETE | SEARCH |
|---------|--------|------|--------|--------|--------|
| **Leads** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Properties** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Tasks** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Events** | ✅ | ✅ | ✅ | ✅ | ✅ |

**Patrones de usuario soportados:**
- READ: "listar leads", "mis tareas", "qué tengo agendado", "mostrar propiedades"
- UPDATE: "actualizar propiedad XYZ", "completar tarea ABC", "mover evento"
- DELETE: "eliminar lead", "borrar propiedad", "cancelar evento"

---

## Referencias de Código

| Componente | Ubicación |
|------------|-----------|
| Detectores CRUD | `hermes_crud_extensions.py` |
| Action builders | `hermes_action_builders.py` |
| Integración server | `server.py:140-158` (imports), `6089-6146` (build), `6110-6175` (format), `6419-6430` (execute), `7296-7348` (handle) |
| Modelos de datos | `models.py` |
| Routers existentes | `tasks.py`, endpoints en `server.py` |
