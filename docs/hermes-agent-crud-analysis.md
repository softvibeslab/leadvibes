# Análisis: Agente Hermes CRUD para Leads, Propiedades, Tareas y Eventos

## Resumen Ejecutivo

El **Agente Hermes** es el asistente de IA conectado vía Telegram que permite a los usuarios de Rovi realizar operaciones CRUD en cuatro entidades principales:

1. **Leads** - Prospección comercial
2. **Propiedades (Products)** - Catálogo inmobiliario
3. **Tareas (Tasks)** - Gestión de actividades
4. **Eventos (Calendar Events)** - Agenda y calendario

---

## Arquitectura del Sistema

### Componentes Principales

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Telegram      │────▶│  Webhook Handler │────▶│  Action Builder │
│   Bot          │     │  (server.py)     │     │  & Executor     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                           │
                                                           ▼
                                                    ┌──────────────┐
                                                    │   MongoDB    │
                                                    │  Collections │
                                                    └──────────────┘
```

### Archivos Clave

| Archivo | Responsabilidad |
|---------|-----------------|
| `backend/hermes_bridge.py` | Bridge entre ROVI y Hermes, gestión de profiles |
| `backend/server.py` | Webhook Telegram, ejecución de acciones CRUD |
| `backend/tasks.py` | Router específico para tareas CRUD |
| `backend/models.py` | Modelos Pydantic de todas las entidades |
| `backend/auth.py` | Autenticación JWT y resolución de usuario |

---

## Modelos de Datos

### 1. Lead (Cliente/Prospecto)

**Colección MongoDB:** `leads`

**Campos principales:**
```python
class Lead(BaseModel):
    id: str                          # UUID autogenerado
    tenant_id: str                   # Multi-tenancy
    name: str                        # Nombre completo
    email: Optional[str]             # Email opcional
    phone: str                       # Teléfono (requerido)
    status: LeadStatus               # nuevo, contactado, calificacion, etc.
    priority: LeadPriority           # baja, media, alta, urgente
    source: str                      # Fuente del lead (telegram_agent, web, etc.)
    operation_type: OperationType    # sale, rent, both
    pipeline_type: str               # sales, rentals
    budget_mxn: float                # Presuesto máximo
    property_interest: Optional[str] # Tipo de propiedad de interés
    tags: List[str]                  # Etiquetas
    assigned_broker_id: Optional[str] # Broker asignado
    created_by: str                  # Usuario que creó
    created_at: datetime
    updated_at: datetime
```

**Rutas CRUD:**
- `GET /api/leads` - Listar leads
- `POST /api/leads` - Crear lead
- `PUT /api/leads/{lead_id}` - Actualizar lead
- `DELETE /api/leads/{lead_id}` - Eliminar lead
- `GET /api/leads/{lead_id}` - Obtener lead

### 2. Product/Property (Propiedad)

**Colección MongoDB:** `products`

**Campos principales:**
```python
class ProductService(BaseModel):
    id: str                              # UUID autogenerado
    tenant_id: str                       # Multi-tenancy
    sku: str                             # SKU único
    title: str                           # Título de la propiedad
    description: str                     # Descripción
    product_type: ProductServiceType     # real_estate, software, digital, service
    operation_type: OperationType        # sale, rent, both
    niche: str                           # Residencial, Comercial, VIP, etc.
    price_mxn: float                     # Precio de venta
    commission_percentage: float         # Comisión del broker
    monthly_rent_mxn: Optional[float]    # Renta mensual (si aplica)
    nightly_rent_mxn: Optional[float]    # Renta nocturna (si aplica)
    features: List[str]                  # Características
    keywords: List[str]                  # Palabras clave
    images: List[MediaAsset]             # Imágenes
    assigned_brokers: List[str]          # Brokers asignados
    is_active: bool
    created_by: str
    created_at: datetime
    updated_at: datetime
```

**Rutas CRUD:**
- `GET /api/products` - Listar productos
- `POST /api/products` - Crear producto
- `PUT /api/products/{product_id}` - Actualizar producto
- `DELETE /api/products/{product_id}` - Eliminar producto
- `GET /api/products/{product_id}` - Obtener producto

### 3. Task (Tarea)

**Colección MongoDB:** `tasks`

**Campos principales:**
```python
class Task(BaseModel):
    id: str                          # UUID autogenerado
    tenant_id: str                   # Multi-tenancy
    title: str                       # Título de la tarea
    description: str                 # Descripción detallada
    status: TaskStatus               # pendiente, en_progreso, en_espera, completada, cancelada
    priority: TaskPriority           # baja, media, alta, urgente
    due_date: Optional[datetime]     # Fecha de vencimiento
    assigned_to: Optional[str]       # Usuario asignado
    lead_id: Optional[str]           # Lead relacionado
    tags: List[str]                  # Etiquetas
    checklist: List[TaskChecklistItem]  # Checklist de subtareas
    comments: List[TaskComment]      # Comentarios
    created_by: str
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] # Fecha de completado
```

**Rutas CRUD:**
- `GET /api/tasks` - Listar tareas
- `POST /api/tasks` - Crear tarea
- `PUT /api/tasks/{task_id}` - Actualizar tarea
- `PATCH /api/tasks/{task_id}/status` - Actualizar estado
- `POST /api/tasks/{task_id}/comments` - Agregar comentario

### 4. Calendar Event (Evento)

**Colección MongoDB:** `calendar_events`

**Campos principales:**
```python
class CalendarEvent(BaseModel):
    id: str                          # UUID autogenerado
    user_id: str                     # Usuario propietario
    tenant_id: str                   # Multi-tenancy
    title: str                       # Título del evento
    description: Optional[str]        # Descripción
    event_type: str                  # seguimiento, llamada, zoom, visita, otro
    start_time: datetime             # Fecha/hora inicio
    end_time: Optional[datetime]     # Fecha/hora fin
    lead_id: Optional[str]           # Lead relacionado
    reminder_minutes: int             # Minutos antes para recordatorio
    color: Optional[str]             # Color para visualización
    completed: bool
    google_event_id: Optional[str]    # ID sincronizado con Google Calendar
    synced_from_google: bool
    created_at: datetime
```

**Rutas CRUD:**
- `GET /api/calendar/events` - Listar eventos
- `POST /api/calendar/events` - Crear evento
- `PUT /api/calendar/events/{event_id}` - Actualizar evento
- `DELETE /api/calendar/events/{event_id}` - Eliminar evento

---

## Flujo del Agente Hermes

### 1. Conexión Telegram ↔ ROVI

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE VINCULACIÓN                            │
└─────────────────────────────────────────────────────────────────────┘

Usuario ROVI              Backend                 Telegram
     │                       │                        │
     │  1. Escanea QR        │                        │
     │───────────────────────▶│                        │
     │                       │  2. Crea link con       │
     │                       │     telegram.chat_id    │
     │                       │                        │
     │                       │  3. Genera deep_link    │
     │                       │───────────────────────▶│
     │                       │                        │
     │  4. Usuario abre      │                        │
     │     link en Telegram  │                        │
     │                       │  5. /start code        │
     │                       │◀──────────────────────│
     │                       │                        │
     │                       │  6. Valida y activa    │
     │                       │     link               │
     │◀──────────────────────│                        │
     │  7. Vinculación OK    │                        │
```

### 2. Procesamiento de Mensajes

```
┌─────────────────────────────────────────────────────────────────────┐
│              FLUJO DE PROCESAMIENTO DE MENSAJE                     │
└─────────────────────────────────────────────────────────────────────┘

Usuario          Webhook             Action Builder      MongoDB
  │                 │                     │                │
  │  "Crear lead"    │                     │                │
  │─────────────────▶│                     │                │
  │                 │  1. Identifica       │                │
  │                 │     usuario por      │                │
  │                 │     chat_id          │                │
  │                 │                     │                │
  │                 │  2. Determina tipo   │                │
  │                 │     de acción        │                │
  │                 │─────────────────────▶│                │
  │                 │                     │  3. Construye  │
  │                 │                     │     payload     │
  │                 │                     │                │
  │                 │                     │  4. Guarda      │
  │                 │                     │────┐           │
  │                 │                     │    │           │
  │                 │  5. Envía preview   │    ▼           │
  │◀────────────────│                     │  pending       │
  │  "¿Confirmar?"  │                     │  action       │
  │                 │                     │                │
  │  "sí"           │                     │                │
  │─────────────────▶│                     │                │
  │                 │  6. Ejecuta acción   │                │
  │                 │─────────────────────▶│                │
  │                 │                     │  7. INSERT en  │
  │                 │                     │────┐           │
  │                 │                     │    │           │
  │                 │  8. Respuesta      │    ▼           │
  │◀────────────────│                     │  leads/       │
  │  "Lead creado"  │                     │  products/    │
  │                 │                     │  tasks/       │
  │                 │                     │  calendar_    │
  │                 │                     │  events       │
```

---

## Detección de Intención de Acción

El agente utiliza funciones de detección de patrones para identificar qué operación CRUD debe ejecutar:

```python
# Detección de tipo de acción
telegram_text_requests_task_creation(text)      → "crear tarea"
telegram_text_requests_lead_creation(text)      → "crear lead"
telegram_text_requests_event_creation(text)     → "crear evento"
telegram_text_requests_property_creation(text)  → "crear propiedad"
telegram_text_requests_lead_update(text)       → "actualizar lead"
```

### Patrones de Texto Reconocidos

| Acción | Patrones de texto |
|--------|-------------------|
| **Crear Tarea** | "tarea", "recordar", "seguimiento", "llamar a", "visitar a" |
| **Crear Lead** | "nuevo lead", "agregar cliente", "prospecto", "interesado en" |
| **Crear Evento** | "agendar", "cita", "reunión", "visita", "evento" |
| **Crear Propiedad** | "propiedad", "inmueble", "lote", "departamento", "casa" |
| **Actualizar Lead** | "actualizar", "cambiar", "mover a", "status" |

---

## Ejecución de Acciones CRUD

### CREATE - Operación de Creación

#### Crear Lead
```python
# Endpoint: POST /api/leads
# Handler: build_pending_lead_action()
# Executor: execute_pending_telegram_action() → action_type == "create_lead"

lead_doc = {
    "id": uuid4(),
    "tenant_id": action["tenant_id"],
    "name": lead["name"],
    "phone": lead["phone"],
    "email": lead.get("email"),
    "status": "nuevo",
    "priority": lead.get("priority", "media"),
    "source": "telegram_agent",
    "tags": ["telegram", "agente-ia"],
    "telegram_action_id": action["id"],
}
await db.leads.insert_one(lead_doc)
```

#### Crear Propiedad
```python
# Endpoint: POST /api/products
# Handler: build_pending_property_action()
# Executor: execute_pending_telegram_action() → action_type == "create_property"

property_doc = {
    "id": uuid4(),
    "tenant_id": action["tenant_id"],
    "sku": property.get("sku") or f"TG-{uuid4().hex[:8].upper()}",
    "title": property["title"],
    "product_type": "real_estate",
    "niche": property.get("niche", "Residencial"),
    "price_mxn": property.get("price_mxn", 0),
    "keywords": ["telegram", "agente-ia"],
    "telegram_action_id": action["id"],
}
await db.products.insert_one(property_doc)
```

#### Crear Tarea
```python
# Endpoint: POST /api/tasks
# Handler: build_pending_task_action()
# Executor: execute_pending_telegram_action() → action_type == "create_tasks"

task_doc = {
    "id": uuid4(),
    "tenant_id": action["tenant_id"],
    "title": task["title"],
    "description": task["description"],
    "status": "pendiente",
    "priority": task.get("priority", "media"),
    "assigned_to": task.get("assigned_to"),
    "lead_id": task.get("lead_id"),
    "tags": ["telegram", "agente-ia"],
    "source": "telegram_agent",
    "telegram_action_id": action["id"],
}
await db.tasks.insert_many(task_docs)  # Soporta creación múltiple
```

#### Crear Evento
```python
# Endpoint: POST /api/calendar/events
# Handler: build_pending_event_action()
# Executor: execute_pending_telegram_action() → action_type == "create_event"

event_doc = {
    "id": uuid4(),
    "tenant_id": action["tenant_id"],
    "user_id": action["user_id"],
    "title": event["title"],
    "event_type": event.get("event_type", "seguimiento"),
    "start_time": event["start_time"],
    "lead_id": event.get("lead_id"),
    "reminder_minutes": event.get("reminder_minutes", 30),
    "telegram_action_id": action["id"],
}
await db.calendar_events.insert_one(event_doc)
```

### UPDATE - Operación de Actualización

#### Actualizar Lead
```python
# Endpoint: PUT /api/leads/{lead_id}
# Handler: build_pending_lead_update_action()
# Executor: execute_pending_telegram_action() → action_type == "update_lead"

update_payload = {
    "status": "contactado",
    "priority": "alta",
    "updated_at": now_utc(),
}
await db.leads.update_one(
    {"tenant_id": tenant_id, "id": lead_id},
    {"$set": update_payload}
)
```

### READ - Operación de Lectura

El agente puede leer datos para:
1. **Encontrar leads visibles** para asignación de tareas
2. **Validar destinatarios** (brokers) para asignación
3. **Resolver referencias** de leads relacionados

```python
# Ejemplo: buscar lead para tarea
lead = await db.leads.find_one({
    "tenant_id": tenant_id,
    "id": lead_id,
    "deleted": {"$ne": True}
})
```

### DELETE - Operación de Eliminación

Actualmente el flujo del agente NO implementa DELETE directamente. Las eliminaciones se hacen:
- Vía UI web de Rovi
- Con marcado `deleted: true` (soft delete)

---

## Seguridad y Multi-tenancy

### Aislamiento de Datos

Todas las operaciones CRUD respetan el `tenant_id`:

```python
query = {
    "tenant_id": current_user["tenant_id"],
    "deleted": {"$ne": True},
    # ... filtros adicionales
}
```

### Control de Acceso por Rol

| Rol Scope | Permisos CRUD |
|-----------|--------------|
| `broker` | CRUD de leads propios, tareas asignadas |
| `agency_admin` | CRUD de todos los leads, tareas, propiedades del workspace |
| `copim_member` | Solo eventos y tareas COPIM |
| `rovi_admin` | Acceso completo a todas las entidades |

### Validaciones Previas a CRUD

```python
# Para tareas: validar que el assignee pertenezca al tenant
async def validate_assignee(db, tenant_id, user_id):
    membership = await db.tenant_memberships.find_one({
        "tenant_id": tenant_id,
        "user_id": user_id,
        "status": "active"
    })

# Para tareas con lead: validar que el lead exista
async def validate_lead(db, tenant_id, lead_id):
    lead = await db.leads.find_one({
        "tenant_id": tenant_id,
        "id": lead_id,
        "deleted": {"$ne": True}
    })
```

---

## Flujo de Confirmación de Usuario

El agente implementa un sistema de **preview y confirmación** para todas las operaciones de escritura:

```
┌────────────────────────────────────────────────────────────────┐
│                   CICLO DE CONFIRMACIÓN                        │
└────────────────────────────────────────────────────────────────┘

Usuario                Agente Hermes              Estado
  │                        │                        │
  │  "Crear lead Juan"     │                        │
  │───────────────────────▶│                        │
  │                        │  1. Analiza intento    │
  │                        │  2. Extrae datos       │
  │                        │  3. Construye payload  │
  │                        │  4. Guarda como       │
  │                        │     PENDING            │
  │                        │                        │
  │◀───────────────────────│  5. Muestra preview    │
  │  "Nombre: Juan         │     ──────────────    │
  │   Tel: +52...          │                        │
  │   ¿Confirmar?"         │                        │
  │                        │   [status=pending]    │
  │                        │                        │
  │  "sí"                  │                        │
  │───────────────────────▶│                        │
  │                        │  6. Ejecuta INSERT     │
  │                        │  7. Actualiza status   │
  │                        │     → EXECUTED         │
  │                        │                        │
  │◀───────────────────────│  8. Confirma resultado │
  │  "Lead creado ID:123" │                        │
```

### Estados de una Acción

```python
class ActionStatus(str, Enum):
    PENDING_CONFIRMATION = "pending_confirmation"  # Esperando confirmación
    EXECUTED = "executed"                          # Acción completada
    CANCELLED = "cancelled"                        # Usuario canceló
    EXPIRED = "expired"                            # Expiró (30 min)
```

---

## Integración con Agent Studio

El agente Hermes puede configurarse via **Agent Studio** con:

1. **Profile Settings:**
   - `system_prompt`: Personalización del comportamiento
   - `enabled_skills`: Skills habilitadas
   - `tools`: Herramientas CRUD permitidas

2. **Configuración de Write Actions:**
   ```python
   agent_config["tools"]["write_actions"] = True  # Habilita CRUD
   agent_config["tools"]["read_actions"] = True   # Habilita lecturas
   ```

3. **Role Scope:**
   - Define qué tipo de usuario usa el agente
   - Afecta permisos y visibilidad de datos

---

## Funciones Auxiliares de Extracción

```python
# Extracción de teléfono
def extract_phone_from_text(text: str) -> str | None:
    # Detecta patrones de teléfono en texto
    # Normaliza a formato +52...

# Extracción de email
def extract_email_from_text(text: str) -> str | None:
    # Detecta patrones de email

# Inferencia de prioridad
def infer_priority_from_text(text: str) -> str:
    if "urgente" in text.lower(): return "urgente"
    if "importante" in text.lower(): return "alta"
    return "media"

# Inferencia de tipo de evento
def infer_event_type_from_text(text: str) -> str:
    if "llamada" in text.lower(): return "llamada"
    if "visita" in text.lower(): return "visita"
    return "seguimiento"
```

---

## Audit Trail

Todas las acciones del agente se auditan en:

**Colección:** `agent_action_audit`

```python
audit_doc = {
    "id": f"agent-action-audit-{uuid4()}",
    "tenant_id": action["tenant_id"],
    "user_id": action["user_id"],
    "link_id": action["link_id"],
    "chat_id": action.get("chat_id"),
    "role_scope": action.get("role_scope"),
    "action_id": action["id"],
    "action_type": action["type"],  # create_lead, update_lead, etc.
    "status": "executed",           # executed, cancelled
    "requested_text": action["requested_text"],
    "payload": action["payload"],
    "created_at": now_utc(),
}
```

---

## Consideraciones Técnicas

### Concurrency

- Los updates de Telegram se procesan en `background_tasks`
- Se usa `hmac.compare_digest()` para validación de webhook secret
- Se detectan updates duplicados por `update_id`

### Error Handling

```python
try:
    result = await handle_rovi_telegram_agent_message(...)
except Exception as exc:
    await db.telegram_webhook_updates.update_one(
        {"id": update_id},
        {"$set": {"status": "failed", "error": str(exc)}}
    )
    await send_telegram_message(chat_id, "Tuve un error procesando...")
```

### Performance

- Índices MongoDB en `tenant_id + id` para todas las colecciones
- Uso de `Motor` (async driver) para operaciones no bloqueantes
- typing indicator en Telegram durante procesamiento

---

## Próximos Pasos / Mejoras Posibles

1. **DELETE vía Telegram:** Implementar borrado confirmado
2. **BULK operations:** Crear/actualizar múltiples registros
3. **Attachments:** Manejar fotos/documentos en leads y propiedades
4. **Voice notes:** Transcribir y extraer datos de audios
5. **Rich previews:** Mostrar tarjetas estructuradas en Telegram
6. **Undo:** Deshacer última acción (dentro de ventana de tiempo)

---

## Referencias de Código

| Componente | Archivo | Líneas |
|------------|---------|--------|
| Webhook handler | `server.py` | 7526-7604 |
| Message handler | `server.py` | 7041-7257 |
| Action builder | `server.py` | 6089-6094 |
| Action executor | `server.py` | 6195-6340 |
| Lead action | `server.py` | 5897-5947 |
| Event action | `server.py` | 5950-5993 |
| Property action | `server.py` | 5996-6045 |
| Task action | `server.py` | 5827-5894 |
| Hermes bridge | `hermes_bridge.py` | 1-200 |
| Models | `models.py` | 1-2500 |
