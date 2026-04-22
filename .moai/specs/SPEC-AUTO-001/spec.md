---
id: AUTO-001
version: 0.0.1
status: draft
created: 2026-03-20
updated: 2026-03-20
author: @RogerVibes
priority: high
category: feature
labels:
  - automation
  - workflows
  - n8n
  - webhooks
depends_on:
  - LEAD-001
  - CAL-001
blocks: []
related_specs:
  - PIPE-001
scope:
  packages:
    - backend/services/automation_service.py
    - backend/api/automations.py
  files:
    - webhook_handlers.py
    - workflow_executor.py
    - n8n_client.py
---

# @SPEC:AUTO-001: Automation Workflows con n8n

## HISTORY

### v0.0.1 (2026-03-20)
- **INITIAL**: Automation Workflows con n8n - Creación inicial
- **AUTHOR**: @RogerVibes
- **SCOPE**: Completar sistema de automatizaciones con webhook management, trigger conditions, action execution
- **CONTEXT**: Modelo de automatizaciones existe pero sin implementación. Se necesita integración con n8n para workflows personalizados
- **REASON**: Reducir tareas manuales de brokers en 40% mediante automatización de procesos repetitivos

---

## Environment

### Contexto de Negocio

- **Problema**: Brokers pierden tiempo en tareas manuales (asignación de leads, recordatorios, seguimientos)
- **Solución**: n8n (workflow automation tool) para crear workflows visuales sin código
- **Integración**: LeadVibes expone webhooks que n8n consume, y recibe webhooks de vuelta

### Infraestructura

- **n8n**: Self-hosted o cloud (n8n.io)
- **Webhook Server**: FastAPI endpoints para recibir triggers de n8n
- **HTTP Client**: LeadVibes llama webhooks de n8n cuando ocurren eventos
- **Authentication**: API keys para webhook validation

---

## Assumptions

1. **n8n Instalado**: n8n está corriendo y accesible (self-hosted o cloud)
2. **Workflows Visuales**: Admins pueden crear workflows con drag-and-drop en n8n
3. **Retry Logic**: Si n8n falla, LeadVibes reintenta hasta 3 veces
4. **Idempotency**: Webhooks son idempotentes (reenviar no causa duplicados)
5. **Logging**: Todos los webhooks se loggean para debugging

---

## Requirements

### Ubiquitous Requirements (Básicas)

- El sistema debe exponer webhooks que n8n puede consumir
- El sistema debe enviar webhooks a n8n cuando ocurren eventos
- El sistema debe soportar workflows predefinidos comunes (lead nurturing, assignment, etc.)
- El sistema debe permitir crear workflows personalizados por tenant
- El sistema debe manejar errores de webhooks con retries

### Event-driven Requirements (WHEN-THEN)

- **WHEN** se crea un lead, el sistema debe enviar webhook `lead.created` a n8n
- **WHEN** un lead cambia de etapa, el sistema debe enviar webhook `lead.stage_changed`
- **WHEN** se crea una actividad, el sistema debe enviar webhook `activity.created`
- **WHEN** n8n llama un webhook de LeadVibes, el sistema debe ejecutar acción correspondiente
- **WHEN** un webhook falla, el sistema debe reintentar con exponential backoff

### State-driven Requirements (WHILE-THEN)

- **WHILE** un workflow está ejecutándose, el sistema debe mostrar estado "en progreso"
- **WHILE** un webhook no responde, el sistema debe marcar como "failed" y loggear error
- **WHILE** un workflow tiene errores recurrentes, el sistema debe desactivarlo y alertar admin

### Optional Requirements (WHERE-THEN)

- **WHERE** un workflow es crítico, el sistema debe enviar alerta si falla
- **WHERE** un workflow tarda >5 minutos, el sistema debe timeout y marcar como failed
- **WHERE** se detecta patrón de fallos, el sistema debe sugerir corrección al admin

### Constraints (IF-THEN)

- **IF** un webhook no tiene autenticación válida, el sistema debe rechazarlo con 401
- **IF** un workflow modifica datos sensibles, el sistema debe requerir permisos adicionales
- **IF** un webhook se reintenta 3 veces sin éxito, el sistema debe marcar como permanently failed
- **IF** n8n no está disponible, el sistema debe queuear webhooks y reintentar después
- **IF** un workflow es muy lento (>30s), el sistema debe ejecutarlo en background job

---

## Specifications

### @CODE:AUTO-001:WEBHOOK Webhook System

**Ubicación**: `backend/services/webhook_service.py`

#### Webhooks Enviados por LeadVibes → n8n

1. **lead.created**
   - **Trigger**: Nuevo lead creado
   - **Payload**:
     ```json
     {
       "event": "lead.created",
       "timestamp": "2026-03-20T10:00:00Z",
       "data": {
         "lead_id": "uuid",
         "name": "Juan Pérez",
         "email": "juan@example.com",
         "phone": "+521234567890",
         "budget": 2000000,
         "source": "facebook",
         "score": 75,
         "assigned_broker_id": "broker_uuid"
       }
     }
     ```

2. **lead.stage_changed**
   - **Trigger**: Lead cambia de etapa (ej: nuevo → contactado)
   - **Payload**:
     ```json
     {
       "event": "lead.stage_changed",
       "timestamp": "2026-03-20T11:00:00Z",
       "data": {
         "lead_id": "uuid",
         "old_stage": "nuevo",
         "new_stage": "contactado",
         "changed_by": "broker_uuid"
       }
     }
     ```

3. **activity.created**
   - **Trigger**: Nueva actividad registrada
   - **Payload**:
     ```json
     {
       "event": "activity.created",
       "timestamp": "2026-03-20T12:00:00Z",
       "data": {
         "activity_id": "uuid",
         "lead_id": "uuid",
         "type": "llamada",
         "outcome": "interesado",
         "notes": "Cliente pidió más información",
         "broker_id": "broker_uuid"
       }
     }
     ```

#### Webhooks Recibidos por LeadVibes ← n8n

1. **POST `/webhooks/n8n/lead-assign`**
   - **Descripción**: n8n pide asignar lead a broker específico
   - **Body**:
     ```json
     {
       "lead_id": "uuid",
       "broker_id": "uuid",
       "reason": "Round robin assignment"
     }
     ```
   - **Response**: `{"success": true, "assigned_to": "broker_uuid"}`

2. **POST `/webhooks/n8n/send-email`**
   - **Descripción**: n8n pide enviar email a lead
   - **Body**:
     ```json
     {
       "lead_id": "uuid",
       "template": "welcome_email",
       "variables": {
         "name": "Juan",
         "property": "Lote en La Veleta"
       }
     }
     ```

3. **POST `/webhooks/n8n/create-activity`**
   - **Descripción**: n8n crea actividad automáticamente (ej: llamada de VAPI completó)
   - **Body**:
     ```json
     {
       "lead_id": "uuid",
       "type": "llamada",
       "outcome": "no contestó",
       "notes": "VAPI call completed",
       "recording_url": "https://vapi.cc/..."
     }
     ```

---

### @CODE:AUTO-001:TEMPLATES Predefined Workflows

**Ubicación**: `backend/services/workflow_templates.py`

#### Template 1: Lead Nurturing Drip Campaign

```yaml
name: "Lead Nurturing - Primeros 30 Días"
trigger: lead.created
steps:
  - wait: 0 hours
    action: send_email
    template: welcome_email

  - wait: 3 days
    condition: lead_has_activity == false
    action: send_email
    template: follow_up_1

  - wait: 7 days
    condition: lead_status == "nuevo"
    action: create_task
    task: "Llamar a lead - 7 días sin contacto"

  - wait: 14 days
    condition: lead_score < 50
    action: send_email
    template: re_engagement
```

#### Template 2: Smart Lead Assignment

```yaml
name: "Asignación Inteligente de Leads"
trigger: lead.created
steps:
  - condition: lead.source == "referido"
    action: assign_to_broker
    broker_id: top_broker_this_month

  - condition: lead.budget >= 3000000
    action: assign_to_broker
    broker_id: broker_specializing_in_luxury

  - condition: lead.location == "La Veleta"
    action: assign_to_broker
    broker_id: broker_expert_in_la_veleta

  - default:
    action: assign_to_broker
    broker_id: round_robin()
```

#### Template 3: Inactivity Alert

```yaml
name: "Alerta de Lead Inactivo"
trigger: daily_schedule
steps:
  - condition: lead.last_activity_days >= 7 AND lead.status == "nuevo"
    action: send_notification
    message: "Lead {name} lleva 7 días sin contacto"
    recipient: lead.assigned_broker

  - condition: lead.last_activity_days >= 14
    action: send_email
    template: re_engagement_campaign
    recipient: lead.email

  - condition: lead.last_activity_days >= 30
    action: change_status
    new_status: "inactivo"
```

---

### @CODE:AUTO-001:N8N n8n Client

**Ubicación**: `backend/services/n8n_client.py`

#### Cliente HTTP para n8n

```python
import httpx
from typing import Dict, Any

class N8nClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=30.0
        )

    async def trigger_workflow(self, workflow_id: str, data: Dict[str, Any]):
        """Ejecuta workflow en n8n vía webhook"""
        webhook_url = f"{self.base_url}/webhook/{workflow_id}"

        try:
            response = await self.client.post(webhook_url, json=data)
            response.raise_for_status()
            return response.json()

        except httpx.HTTPError as e:
            logger.error(f"Error triggering n8n workflow: {e}")
            raise

    async def test_connection(self) -> bool:
        """Testea si n8n está accesible"""
        try:
            response = await self.client.get(f"{self.base_url}/healthz")
            return response.status_code == 200
        except:
            return False
```

---

### @CODE:AUTO-001:API Automation Endpoints

**Ubicación**: `backend/api/automations.py` (nuevo módulo)

#### Endpoints

1. **POST `/automations/workflows`** (Admin only)
   - **Descripción**: Crear nuevo workflow personalizado
   - **Body**:
     ```json
     {
       "name": "Custom Lead Assignment",
       "trigger_event": "lead.created",
       "conditions": {...},
       "actions": [...]
     }
     ```

2. **GET `/automations/workflows`** (Admin only)
   - **Descripción**: Listar todos los workflows del tenant
   - **Response**: Array de workflows con estadísticas

3. **POST `/automations/workflows/{workflow_id}/activate`** (Admin only)
   - **Descripción**: Activar workflow

4. **POST `/automations/workflows/{workflow_id}/deactivate`** (Admin only)
   - **Descripción**: Desactivar workflow

5. **GET `/automations/webhooks/logs`** (Admin only)
   - **Descripción**: Ver logs de webhooks enviados/recibidos
   - **Query Params**: `?event=lead.created&status=failed&date=2026-03-20`

6. **POST `/automations/test-webhook`** (Admin only)
   - **Descripción**: Enviar webhook de prueba a n8n
   - **Body**:
     ```json
     {
       "workflow_id": "workflow_uuid",
       "test_data": {...}
     }
     ```

---

## Traceability (@TAG)

- **SPEC**: @SPEC:AUTO-001
- **TEST**:
  - `backend/tests/test_automations.py` → @TEST:AUTO-001
  - `backend/tests/test_webhooks.py` → @TEST:AUTO-001:WEBHOOK
  - `backend/tests/test_n8n_integration.py` → @TEST:AUTO-001:N8N
- **CODE**:
  - `backend/services/automation_service.py` → @CODE:AUTO-001:SERVICE
  - `backend/api/automations.py` → @CODE:AUTO-001:API
  - `backend/services/n8n_client.py` → @CODE:AUTO-001:N8N
- **DOC**: `docs/automation-workflows-guide.md` → @DOC:AUTO-001

---

## Acceptance Criteria

### Criterios de Aceptación

1. **Webhooks Funcionando**: LeadVibes envía webhooks a n8n en eventos clave
2. **Workflows Predefinidos**: 3+ templates de workflows comunes disponibles
3. **Retry Logic**: Webhooks fallidos se reintentan hasta 3 veces
4. **UI de Gestión**: Admin puede activar/desactivar workflows desde dashboard
5. **Logs Completos**: Todos los webhooks quedan registrados con timestamp y status

### Definición de Done

- [ ] Webhook system implementado con 5+ eventos (lead.created, activity.created, etc.)
- [ ] n8n client funcionando con autenticación
- [ ] 3 workflows templates predefinidos (lead nurturing, assignment, inactivity alert)
- [ ] Endpoints `/automations/*` funcionando y testeados
- [ ] Sistema de retries con exponential backoff
- [ ] Logs de webhooks con filtros por fecha/evento/status
- [ ] UI para gestionar workflows (activar/desactivar/ver logs)
- [ ] Documentación de cómo crear workflows personalizados en n8n
