---
id: PIPE-001
version: 0.0.1
status: draft
created: 2026-03-20
updated: 2026-03-20
author: @RogerVibes
priority: critical
category: feature
labels:
  - pipeline-management
  - automation-rules
  - workflow
  - triggers
depends_on:
  - LEAD-001
blocks: []
related_specs:
  - AUTO-001
scope:
  packages:
    - backend/services/pipeline_service.py
    - backend/api/pipeline.py
  files:
    - pipeline_rules.py
    - pipeline_triggers.py
    - pipeline_alerts.py
---

# @SPEC:PIPE-001: Advanced Pipeline Management con Reglas Automáticas

## HISTORY

### v0.0.1 (2026-03-20)
- **INITIAL**: Advanced Pipeline Management - Creación inicial
- **AUTHOR**: @RogerVibes
- **SCOPE**: Sistema de reglas automáticas para movimiento de pipeline, triggers por tiempo, alertas de leads estancados
- **CONTEXT**: Brokers pierden leads por falta de seguimiento oportuno. Se necesita automatizar movimientos de pipeline y alertas
- **REASON**: Reducir tasa de abandono de leads del 60% al 30% mediante automatización inteligente

---

## Environment

### Contexto de Negocio

- **Pipeline Actual**: 6 etapas manuales (Nuevo → Contactado → Calificación → Presentación → Apartado → Venta)
- **Problema**: Leads se estancan en etapas intermedias sin seguimiento
- **Objetivo**: Automatizar movimientos de pipeline basados en reglas de negocio

### Infraestructura

- **Backend**: FastAPI con MongoDB
- **Rule Engine**: Motor de reglas personalizado en Python
- **Scheduler**: APScheduler para triggers temporales
- **Notificaciones**: Sistema de alerts (email, in-app, SMS)

---

## Assumptions

1. **Reglas Configurables**: Cada tenant (agencia) puede configurar sus propias reglas
2. **Movimientos Automáticos**: Sistema puede cambiar status de lead sin intervención manual
3. **Alertas No Intrusivas**: Notificaciones se envían sin spammear al broker
4. **Override Manual**: Broker puede manualmente mover lead a cualquier etapa
5. **Audit Trail**: Todos los movimientos automáticos se registran en historial

---

## Requirements

### Ubiquitous Requirements (Básicas)

- El sistema debe permitir crear reglas automáticas para movimiento de pipeline
- El sistema debe ejecutar triggers basados en tiempo en etapa
- El sistema debe alertar sobre leads estancados
- El sistema debe personalizar reglas por broker o equipo
- El sistema debe mantener audit trail de movimientos automáticos

### Event-driven Requirements (WHEN-THEN)

- **WHEN** un lead pasa X días en una etapa, el sistema debe moverlo automáticamente o alertar
- **WHEN** se crea una actividad específica (ej: "visita"), el sistema debe avanzar pipeline
- **WHEN** un lead alcanza score ≥80, el sistema debe marcar como "hot lead" y alertar
- **WHEN** un broker manualmente mueve un lead, el sistema debe respetar decisión manual
- **WHEN** una regla se dispara, el sistema debe registrar trigger en historial del lead

### State-driven Requirements (WHILE-THEN)

- **WHILE** un lead está estancado >3 días, el sistema debe enviar recordatorio diario
- **WHILE** no hay actividad en lead por 7 días, el sistema debe marcar como "en riesgo"
- **WHILE** un broker tiene >10 leads en etapa "Presentación", el sistema debe sugerir priorización

### Optional Requirements (WHERE-THEN)

- **WHERE** un lead viene de fuente "Referido", el sistema puede saltarse etapa "Calificación"
- **WHERE** un broker tiene reglas personalizadas, el sistema debe aplicar esas sobre reglas globales
- **WHERE** se detecta patrón inusual (ej: leads retrocediendo en pipeline), el sistema debe alertar admin

### Constraints (IF-THEN)

- **IF** un lead ya está en etapa "Venta", el sistema no debe moverlo automáticamente
- **IF** un broker está de vacaciones, el sistema debe reasignar leads a otro broker
- **IF** una regla entra en conflicto con otra, el sistema debe priorizar regla más específica
- **IF** un lead tiene movimiento manual, el sistema debe desactivar reglas automáticas por 24h
- **IF** una regla falla al ejecutarse, el sistema debe loggear error y no afectar lead

---

## Specifications

### @CODE:PIPE-001:RULES Rule Engine

**Ubicación**: `backend/services/pipeline_service.py`

#### Tipos de Reglas

1. **Reglas de Tiempo en Etapa**
   - **Trigger**: Lead en etapa X por ≥Y días
   - **Action**: Mover a etapa Y / Enviar alerta / Cambiar prioridad
   - **Ejemplo**:
     ```json
     {
       "rule_id": "time_in_contactado",
       "stage": "contactado",
       "days": 3,
       "action": "move_to_calificacion",
       "active": true
     }
     ```

2. **Reglas de Actividad**
   - **Trigger**: Actividad específica creada (llamada, visita, apartado)
   - **Action**: Avanzar pipeline automáticamente
   - **Ejemplo**: Si se crea actividad tipo "visita", mover a "Presentación"

3. **Reglas de Score**
   - **Trigger**: Score cambia (ej: de 40 → 85)
   - **Action**: Cambiar prioridad a "Alta" y alertar broker

4. **Reglas de Inactividad**
   - **Trigger**: Sin actividad por X días
   - **Action**: Marcar como "en riesgo" y enviar alerta

#### Motor de Ejecución

```python
async def evaluate_rules(lead: Lead):
    """Evalúa todas las reglas aplicables a un lead"""
    applicable_rules = await get_rules_for_tenant(lead.tenant_id)

    for rule in applicable_rules:
        if await rule.matches(lead):
            await rule.execute(lead)
            await log_rule_execution(lead, rule)
```

---

### @CODE:PIPE-001:TRIGGERS Trigger System

**Ubicación**: `backend/services/pipeline_triggers.py`

#### Tipos de Triggers

1. **Time-Based Triggers**
   - **Cron Job**: Se ejecuta cada 1 hora
   - **Query**: `db.leads.find({"status": "contactado", "updated_at": {"$lt": now - 3 days}})`
   - **Action**: Mover a "Calificación" o enviar alerta

2. **Event-Based Triggers**
   - **Event**: `activity.created`
   - **Listener**: Si activity.type == "visita", mover lead a "Presentación"

3. **Score-Based Triggers**
   - **Event**: `lead.score_updated`
   - **Condition**: Si score ≥80, marcar como "hot lead"

#### Scheduler Configuration

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', hour='*', minute='0')  # Cada hora
async def check_stale_leads():
    """Busca leads estancados y ejecuta reglas"""
    stale_leads = await get_stale_leads()
    for lead in stale_leads:
        await evaluate_rules(lead)
```

---

### @CODE:PIPE-001:ALERTS Alert System

**Ubicación**: `backend/services/pipeline_alerts.py`

#### Tipos de Alertas

1. **Lead Estancado**
   - **Trigger**: Sin cambios por ≥3 días
   - **Mensaje**: "Lead {name} está en {stage} desde 3 días. ¿Necesitas ayuda?"

2. **Hot Lead Detectado**
   - **Trigger**: Score ≥80
   - **Mensaje**: "¡Lead {name} tiene score 85! Llámalo hoy mismo."

3. **Riesgo de Pérdida**
   - **Trigger**: Sin actividad por ≥7 días
   - **Mensaje**: "Lead {name} no tiene actividad desde hace una semana. ¿Viable?"

4. **Próxima Acción Sugerida**
   - **Trigger**: Lead entra en nueva etapa
   - **Mensaje**: "Lead {name} ahora está en {stage}. Próximo paso: {action}"

#### Canales de Notificación

- **In-App**: Badge de notificaciones en dashboard
- **Email**: Resumen diario de leads estancados
- **SMS**: (Opcional) Para alertas críticas (hot leads)
- **Slack**: (Opcional) Webhook al canal del equipo

---

### @CODE:PIPE-001:API Pipeline Management Endpoints

**Ubicación**: `backend/api/pipeline.py` (nuevo módulo)

#### Endpoints

1. **POST `/pipeline/rules`** (Admin only)
   - **Descripción**: Crear nueva regla automática
   - **Body**:
     ```json
     {
       "name": "Mover Contactado a Calificación después de 3 días",
       "trigger_type": "time_in_stage",
       "stage": "contactado",
       "days": 3,
       "action": "move_to_stage",
       "target_stage": "calificacion",
       "priority": "high"
     }
     ```

2. **GET `/pipeline/rules`** (Admin only)
   - **Descripción**: Listar todas las reglas del tenant
   - **Response**: Array de reglas con estadísticas de ejecución

3. **DELETE `/pipeline/rules/{rule_id}`** (Admin only)
   - **Descripción**: Eliminar regla

4. **GET `/pipeline/stale-leads`**
   - **Descripción**: Obtener leads estancados (sin actividad por ≥X días)
   - **Query Params**: `?days=3&stage=contactado`
   - **Use Case**: Broker pide "mis leads que necesitan atención"

5. **POST `/pipeline/force-move/{lead_id}`**
   - **Descripción**: Forzar movimiento manual de lead (override reglas)
   - **Body**: `{"target_stage": "calificacion", "reason": "Cliente pidió visita"}`
   - **Effect**: Desactiva reglas automáticas por 24h

6. **GET `/pipeline/alerts`**
   - **Descripción**: Obtener alertas activas para el broker
   - **Response**: Array de alertas priorizadas

---

## Traceability (@TAG)

- **SPEC**: @SPEC:PIPE-001
- **TEST**:
  - `backend/tests/test_pipeline_rules.py` → @TEST:PIPE-001:RULES
  - `backend/tests/test_pipeline_triggers.py` → @TEST:PIPE-001:TRIGGERS
  - `backend/tests/test_pipeline_alerts.py` → @TEST:PIPE-001:ALERTS
- **CODE**:
  - `backend/services/pipeline_service.py` → @CODE:PIPE-001:SERVICE
  - `backend/api/pipeline.py` → @CODE:PIPE-001:API
  - `backend/models.py` → @CODE:PIPE-001:DATA (PipelineRule model)
- **DOC**: `docs/pipeline-automation-guide.md` → @DOC:PIPE-001

---

## Acceptance Criteria

### Criterios de Aceptación

1. **Motor de Reglas Funcionando**: Reglas se ejecutan automáticamente según configuración
2. **Alertas en Tiempo Real**: Leads estancados generan alertas <1 hora después
3. **Override Manual**: Brokers pueden mover leads manualmente sin romper sistema
4. **Audit Trail Completo**: Todos los movimientos automáticos quedan registrados
5. **Personalización por Tenant**: Cada agencia puede tener sus propias reglas

### Definición de Done

- [ ] Motor de reglas implementado con 3+ tipos de triggers
- [ ] Scheduler configurado para ejecución cada hora
- [ ] Endpoints `/pipeline/*` funcionando y testeados
- [ ] Sistema de alertas multicanal (in-app + email)
- [ ] UI para configurar reglas (admin dashboard)
- [ ] Dashboard de "leads estancados" para brokers
- [ ] Documentación de reglas y ejemplos creada
