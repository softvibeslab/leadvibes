---
id: CAMP-001
version: 0.0.1
status: draft
created: 2026-03-20
updated: 2026-03-20
author: @RogerVibes
priority: medium
category: docs
labels:
  - campaigns
  - documentation
  - existing-feature
  - marketing
depends_on: []
blocks: []
related_specs:
  - COMM-001
  - ANAL-002
scope:
  packages:
    - backend/server.py
    - frontend/src/pages/CampaignsPage.js
  files:
    - backend/models.py (Campaign, CallRecord, SMSRecord models)
    - backend/services/campaign_service.py
---

# @SPEC:CAMP-001: Campaign Management - Documentación

## HISTORY

### v0.0.1 (2026-03-20)
- **INITIAL**: Documentación de Campaign Management - Creación inicial
- **AUTHOR**: @RogerVibes
- **SCOPE**: Documentar feature existente de gestión de campañas (CRUD, filtros, ejecución, metrics)
- **CONTEXT**: Feature está 90% implementada pero falta documentación formal de requisitos
- **REASON**: Estandarizar feature existente para facilitar mantenimiento y futuras mejoras

---

## Environment

### Estado Actual de la Feature

- **Completitud**: 90% implementada
- **Ubicación**: `backend/server.py` (endpoints), `frontend/src/pages/CampaignsPage.js` (UI)
- **Database**: MongoDB con colecciones `campaigns`, `call_records`, `sms_records`, `email_records`
- **Integraciones**: VAPI (llamadas), Twilio (SMS), SendGrid (email)

### Tipos de Campañas Soportados

1. **Call Campaign**: Llamadas automatizadas con VAPI
2. **SMS Campaign**: Mensajes de texto masivos con Twilio
3. **Email Campaign**: Emails masivos con SendGrid

---

## Assumptions

1. **Feature Implementada**: Código existe y está funcionando en producción
2. **Integraciones Externas**: VAPI, Twilio, SendGrid están configurados
3. **Async Execution**: Campañas se ejecutan en background (jobs)
4. **Rate Limiting**: Respetar límites de APIs externas

---

## Requirements

### Ubiquitous Requirements (Básicas)

- El sistema debe permitir crear campañas de llamadas, SMS y email
- El sistema debe proveer filtros avanzados para segmentar leads
- El sistema debe permitir programar campañas para fecha futura
- El sistema debe ejecutar campañas en background (async jobs)
- El sistema debe rastrear métricas (sent, delivered, failed, response_rate)

### Event-driven Requirements (WHEN-THEN)

- **WHEN** se crea una campaña, el sistema debe guardarla con status "draft"
- **WHEN** se ejecuta una campaña, el sistema debe cambiar status a "running"
- **WHEN** una campaña termina, el sistema debe cambiar status a "completed"
- **WHEN** falla un envío individual (ej: SMS no entregado), el sistema debe registrar error y continuar con resto
- **WHEN** se consultan métricas, el sistema debe agregar resultados de todos los records

### State-driven Requirements (WHILE-THEN)

- **WHILE** una campaña está en ejecución, el sistema debe mostrar progreso en tiempo real
- **WHILE** una campaña tiene alta tasa de fallos (>20%), el sistema debe pausar ejecución y alertar admin
- **WHILE** se ejecuta campaña, el sistema no debe permitir modificar filtros

### Optional Requirements (WHERE-THEN)

- **WHERE** una campaña tiene >1000 leads, el sistema debe dividir en batches
- **WHERE** se detecta patrón de fallos (ej: todos los SMS fallan), el sistema debe sugerir revisar configuración de API key
- **WHERE** una campaña está programada, el sistema debe enviar recordatorio 1 hora antes

### Constraints (IF-THEN)

- **IF** una campaña no tiene leads seleccionados, el sistema debe rechazar ejecución
- **IF** VAPI/Twilio/SendGrid APIs fallan, el sistema debe reintentar hasta 3 veces con exponential backoff
- **IF** una campaña es ejecutada manualmente, el sistema debe pedir confirmación (está seguro?)
- **IF** un lead tiene "do not contact" flag, el sistema debe excluirlo de campaña
- **IF** una campaña ya está ejecutándose, el sistema no debe permitir doble ejecución

---

## Specifications

### @CODE:CAMP-001:MODEL Campaign Data Model

**Ubicación**: `backend/models.py`

```python
class Campaign(BaseModel):
    id: str  # UUID
    name: str
    type: str  # call, sms, email
    status: str  # draft, scheduled, running, completed, failed, paused
    tenant_id: str
    created_by: str  # user_id

    # Filtros de segmentación
    filters: Dict[str, Any] = {
        "status": ["nuevo", "contactado"],
        "source": ["facebook", "instagram"],
        "budget_range": [1000000, 5000000],
        "location": ["La Veleta", "Tulum Centro"]
    }

    # Contenido del mensaje
    content: Dict[str, Any] = {}  # Depende de tipo (call script, SMS text, email template)

    # Programación
    scheduled_for: Optional[datetime]
    executed_at: Optional[datetime]
    completed_at: Optional[datetime]

    # Métricas
    total_leads: int
    sent: int = 0
    delivered: int = 0
    failed: int = 0
    response_rate: Optional[float]

    # Integraciones
    integration_config: Dict[str, Any] = {}  # VAPI assistant_id, Twilio phone_number, etc.

    created_at: datetime
    updated_at: datetime
```

### @CODE:CAMP-001:API Endpoints

**Ubicación**: `backend/server.py`

#### 1. POST `/api/campaigns`
- **Descripción**: Crear nueva campaña
- **Body**:
  ```json
  {
    "name": "Lanzamiento Lotes La Veleta - Llamadas",
    "type": "call",
    "filters": {
      "status": ["nuevo"],
      "budget": {"$gte": 2000000},
      "location": "La Veleta"
    },
    "content": {
      "vapi_assistant_id": "assistant_uuid",
      "phone_number_id": "phone_uuid"
    },
    "scheduled_for": "2026-03-25T10:00:00Z"
  }
  ```
- **Response**: Campaign creada (status 201)

#### 2. GET `/api/campaigns`
- **Descripción**: Listar campañas del tenant
- **Query Params**: `?status=running&type=call`
- **Response**: Array de campaigns

#### 3. GET `/api/campaigns/{id}`
- **Descripción**: Obtener detalle de campaña
- **Response**: Campaign + métricas + listado de leads

#### 4. PATCH `/api/campaigns/{id}`
- **Descripción**: Actualizar campaña (solo si status=draft)
- **Body**: Campos a actualizar
- **Response**: Campaign actualizada

#### 5. POST `/api/campaigns/{id}/execute`
- **Descripción**: Ejecutar campaña inmediatamente
- **Auth**: Requiere role admin o manager
- **Process**:
  1. Validar que campaña tiene leads
  2. Cambiar status a "running"
  3. Crear background job para ejecución
  4. Retornar inmediatamente (async)
- **Response**: `{"message": "Campaign started", "job_id": "job_uuid"}`

#### 6. POST `/api/campaigns/{id}/pause`
- **Descripción**: Pausar campaña en ejecución
- **Response**: Campaign con status "paused"

#### 7. POST `/api/campaigns/{id}/resume`
- **Descripción**: Resumir campaña pausada
- **Response**: Campaign con status "running"

#### 8. DELETE `/api/campaigns/{id}`
- **Descripción**: Eliminar campaña (solo si status=draft o completed)
- **Response**: 204 No Content

#### 9. GET `/api/campaigns/{id}/records`
- **Descripción**: Obtener records individuales de campaña (llamadas, SMS, emails)
- **Query Params**: `?status=failed&page=1&limit=20`
- **Response**: Array de records (CallRecord, SMSRecord, EmailRecord)

#### 10. GET `/api/campaigns/{id}/metrics`
- **Descripción**: Obtener métricas detalladas de campaña
- **Response**:
  ```json
  {
    "campaign_id": "uuid",
    "total_leads": 100,
    "sent": 100,
    "delivered": 95,
    "failed": 5,
    "response_rate": 0.35,
    "by_status": {
      "delivered": 95,
      "failed": 5
    },
    "by_reason": {
      "wrong_number": 2,
      "voicemail": 10,
      "answered": 80
    }
  }
  ```

---

### @CODE:CAMP-001:EXECUTION Campaign Execution Engine

**Ubicación**: `backend/services/campaign_service.py`

#### Flujo de Ejecución

```python
async def execute_campaign(campaign_id: str):
    """Ejecuta campaña en background"""

    # 1. Obtener campaña
    campaign = await db.campaigns.find_one({"_id": campaign_id})
    if campaign["status"] != "draft" and campaign["status"] != "scheduled":
        raise Exception("Campaign already executed")

    # 2. Filtrar leads
    leads = await filter_leads_by_criteria(campaign["filters"])

    # 3. Actualizar campaña
    await db.campaigns.update_one(
        {"_id": campaign_id},
        {
            "$set": {
                "status": "running",
                "executed_at": datetime.utcnow(),
                "total_leads": len(leads)
            }
        }
    )

    # 4. Ejecutar según tipo
    if campaign["type"] == "call":
        await execute_call_campaign(campaign, leads)
    elif campaign["type"] == "sms":
        await execute_sms_campaign(campaign, leads)
    elif campaign["type"] == "email":
        await execute_email_campaign(campaign, leads)

    # 5. Marcar como completada
    await db.campaigns.update_one(
        {"_id": campaign_id},
        {"$set": {"status": "completed", "completed_at": datetime.utcnow()}}
    )

async def execute_call_campaign(campaign: Campaign, leads: List[Lead]):
    """Ejecuta campaña de llamadas con VAPI"""

    from vapi import VapiClient

    vapi_client = VapiClient(api_key=os.getenv("VAPI_API_KEY"))

    for lead in leads:
        try:
            # Crear llamada en VAPI
            call = vapi_client.create_call(
                phone_number=lead.phone,
                assistant_id=campaign["content"]["vapi_assistant_id"]
            )

            # Guardar record
            await db.call_records.insert_one({
                "campaign_id": campaign.id,
                "lead_id": lead.id,
                "vapi_call_id": call.id,
                "status": "sent",
                "created_at": datetime.utcnow()
            })

            # Actualizar métricas
            await db.campaigns.update_one(
                {"_id": campaign.id},
                {"$inc": {"sent": 1}}
            )

        except Exception as e:
            logger.error(f"Error sending call to lead {lead.id}: {e}")

            # Guardar record con error
            await db.call_records.insert_one({
                "campaign_id": campaign.id,
                "lead_id": lead.id,
                "status": "failed",
                "error": str(e),
                "created_at": datetime.utcnow()
            })

            await db.campaigns.update_one(
                {"_id": campaign.id},
                {"$inc": {"failed": 1}}
            )
```

---

### @CODE:CAMP-001:UI Campaign Management UI

**Ubicación**: `frontend/src/pages/CampaignsPage.js`

#### Componentes

1. **Campaign List**
   - Tabla de campañas con columnas: Nombre, Tipo, Status, Leads, Enviados, Fallos, Fecha
   - Filtros: Status (dropdown), Tipo (dropdown)
   - Acciones: Ver detalle, Pausar/Resumir, Eliminar

2. **Campaign Create Wizard**
   - Paso 1: Nombre y tipo de campaña
   - Paso 2: Filtros de segmentación (status, source, budget, location)
   - Paso 3: Contenido (según tipo: VAPI assistant ID, SMS text, Email template)
   - Paso 4: Programación (ahora o fecha futura)
   - Preview: Resumen de campaña antes de crear

3. **Campaign Detail View**
   - Información de campaña
   - Métricas en tiempo real (sent, delivered, failed, response_rate)
   - Lista de leads seleccionados
   - Records individuales (CallRecord, SMSRecord, EmailRecord)
   - Acciones: Pausar, Resumir, Reintentar fallidos

4. **Campaign Metrics Dashboard**
   - Gráficos de entregas (sent vs delivered vs failed)
   - Gráficos de respuesta (response rate)
   - Tabla de razones de fallo (wrong number, voicemail, etc.)

---

## Traceability (@TAG)

- **SPEC**: @SPEC:CAMP-001
- **TEST**: `backend/tests/test_campaigns.py` → @TEST:CAMP-001
- **CODE**:
  - `backend/server.py` → @CODE:CAMP-001:API (Endpoints de campañas)
  - `backend/services/campaign_service.py` → @CODE:CAMP-001:SERVICE
  - `backend/models.py` → @CODE:CAMP-001:DATA (Campaign model)
  - `frontend/src/pages/CampaignsPage.js` → @CODE:CAMP-001:UI
- **DOC**: `docs/campaign-management-guide.md` → @DOC:CAMP-001

---

## Acceptance Criteria

### Criterios de Aceptación

1. **CRUD de Campañas**: Crear, leer, actualizar, eliminar campañas funciona
2. **Segmentación Avanzada**: Filtros complejos (status, source, budget, location) funcionan
3. **Ejecución Async**: Campañas se ejecutan en background sin bloquear UI
4. **Métricas en Tiempo Real**: Progress de campaña visible mientras se ejecuta
5. **Integraciones**: VAPI, Twilio, SendGrid funcionan correctamente

### Definición de Done

- [x] Feature implementada (90% completada)
- [ ] Tests unitarios y de integración creados
- [ ] Documentación de API generada
- [ ] User guide para crear campañas creada
- [ ] Video tutorial de ejecución de campañas creado
