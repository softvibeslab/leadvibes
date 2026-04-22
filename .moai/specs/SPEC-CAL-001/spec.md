---
id: CAL-001
version: 0.0.1
status: draft
created: 2026-03-20
updated: 2026-03-20
author: @RogerVibes
priority: medium
category: docs
labels:
  - calendar
  - documentation
  - existing-feature
  - scheduling
depends_on: []
blocks: []
related_specs:
  - AUTO-001
scope:
  packages:
    - backend/server.py
    - frontend/src/pages/CalendarPage.js
  files:
    - backend/models.py (CalendarEvent model)
    - backend/services/calendar_service.py
---

# @SPEC:CAL-001: Calendar & Scheduling - Documentación

## HISTORY

### v0.0.1 (2026-03-20)
- **INITIAL**: Documentación de Calendar & Scheduling - Creación inicial
- **AUTHOR**: @RogerVibes
- **SCOPE**: Documentar feature existente de calendario (eventos, recordatorios, Google Calendar sync planeada)
- **CONTEXT**: Feature está 85% implementada pero falta documentación formal
- **REASON**: Estandarizar feature de calendario para facilitar mantenimiento y futura integración con Google Calendar

---

## Environment

### Estado Actual de la Feature

- **Completitud**: 85% implementada
- **Ubicación**: `backend/server.py` (endpoints), `frontend/src/pages/CalendarPage.js` (UI)
- **Database**: MongoDB con colección `calendar_events`
- **Integraciones**: Google Calendar (planeada, no implementada aún)

### Features Actuales

- ✅ CRUD de eventos (Crear, leer, actualizar, eliminar)
- ✅ Eventos recurrentes (diario, semanal, mensual)
- ✅ Recordatorios (notificaciones antes del evento)
- ✅ Round robin assignment (distribución automática de eventos entre brokers)
- ⏳ Google Calendar sync (planeado para Q2 2026)

---

## Assumptions

1. **Feature Implementada**: Código existe y está funcionando en producción
2. **Calendario Independiente**: Sistema funciona sin Google Calendar (calendario interno)
3. **Round Robin**: Algoritmo distribuye eventos equitativamente entre brokers disponibles
4. **Recordatorios**: Sistema envía notificaciones (in-app, email) antes de eventos

---

## Requirements

### Ubiquitous Requirements (Básicas)

- El sistema debe permitir crear eventos con título, descripción, fecha, lead asociado
- El sistema debe mostrar calendario mensual/semanal/diario
- El sistema debe soportar eventos recurrentes (diario, semanal, mensual)
- El sistema debe enviar recordatorios antes de eventos
- El sistema debe permitir round robin assignment de eventos

### Event-driven Requirements (WHEN-THEN)

- **WHEN** se crea un evento, el sistema debe validar que no haya conflicto con otro evento del mismo broker
- **WHEN** se crea evento recurrente, el sistema debe generar todas las instancias
- **WHEN** se acerca la hora del evento (ej: 1 hora antes), el sistema debe enviar recordatorio
- **WHEN** se elimina evento recurrente, el sistema debe preguntar si eliminar solo esta instancia o todas
- **WHEN** se asigna evento con round robin, el sistema debe seleccionar broker con menos eventos en ese horario

### State-driven Requirements (WHILE-THEN)

- **WHILE** un evento está en progreso (hora actual dentro del rango del evento), el sistema debe mostrar "Ahora" en UI
- **WHILE** un broker tiene >5 eventos en un día, el sistema debe sugerir redistribuir carga
- **WHILE** un evento no tiene broker asignado, el sistema debe mostrar en pool de eventos sin asignar

### Optional Requirements (WHERE-THEN)

- **WHERE** un evento se mueve de fecha/hora, el sistema puede notificar al lead sobre cambio
- **WHERE** un broker está de vacaciones, el sistema puede reasignar sus eventos automáticamente
- **WHERE** se detecta patrón (ej: broker siempre agenda visitas a las 3pm), el sistema puede sugerir optimal times

### Constraints (IF-THEN)

- **IF** un evento se crea en el pasado, el sistema debe advertir pero permitir (para eventos recién creados de cosas que pasaron)
- **IF** un broker ya tiene evento en mismo horario, el sistema debe rechazar nuevo evento (conflicto)
- **IF** un evento es "todo el día", el sistema no debe pedir hora específica
- **IF** un evento recurrente no tiene fecha de fin, el sistema debe preguntar cuántas instancias generar
- **IF** se elimina un evento, el sistema debe preguntar si notificar al lead

---

## Specifications

### @CODE:CAL-001:MODEL Calendar Event Model

**Ubicación**: `backend/models.py`

```python
class CalendarEvent(BaseModel):
    id: str  # UUID
    tenant_id: str
    broker_id: Optional[str]  # Si None, evento sin asignar
    lead_id: Optional[str]

    # Detalles del evento
    title: str
    description: Optional[str]
    location: Optional[str]

    # Fechas y horas
    start_time: datetime
    end_time: datetime
    is_all_day: bool = False

    # Recurrencia
    is_recurring: bool = False
    recurrence_rule: Optional[str]  # "FREQ=DAILY;INTERVAL=1", "FREQ=WEEKLY;BYDAY=MO,WE,FR"
    recurrence_end: Optional[datetime]  # Fecha fin de recurrencia
    parent_event_id: Optional[str]  # Si es instancia de evento recurrente

    # Recordatorios
    reminders: List[int] = []  # Minutos antes: [60, 15] (1 hora antes, 15 min antes)

    # Estado
    status: str  # scheduled, completed, cancelled

    created_at: datetime
    updated_at: datetime
```

### @CODE:CAL-001:API Endpoints

**Ubicación**: `backend/server.py`

#### 1. POST `/api/calendar/events`
- **Descripción**: Crear nuevo evento
- **Body**:
  ```json
  {
    "title": "Visita Lote La Veleta",
    "description": "Presentar lote premium en La Veleta",
    "start_time": "2026-03-25T15:00:00Z",
    "end_time": "2026-03-25T16:00:00Z",
    "lead_id": "lead_uuid",
    "broker_id": "broker_uuid",
    "location": "La Veleta, Tulum",
    "reminders": [60, 15]
  }
  ```
- **Response**: Evento creado (status 201)

#### 2. GET `/api/calendar/events`
- **Descripción**: Listar eventos del broker
- **Query Params**:
  - `?start=2026-03-01&end=2026-03-31` (rango de fechas)
  - `?broker_id={uuid}` (opcional, por defecto broker actual)
  - `?status=scheduled`
- **Response**: Array de eventos

#### 3. GET `/api/calendar/events/{id}`
- **Descripción**: Obtener detalle de evento
- **Response**: Evento + lead info + broker info

#### 4. PATCH `/api/calendar/events/{id}`
- **Descripción**: Actualizar evento
- **Body**: Campos a actualizar
- **Response**: Evento actualizado

#### 5. DELETE `/api/calendar/events/{id}`
- **Descripción**: Eliminar evento
- **Query Param**: `?delete_all=true` (para eventos recurrentes: eliminar todas las instancias)
- **Response**: 204 No Content

#### 6. POST `/api/calendar/events/{id}/assign`
- **Descripción**: Asignar evento a broker (round robin o manual)
- **Body**:
  ```json
  {
    "broker_id": "broker_uuid",  // Opcional, si None hace round robin
    "method": "round_robin"  // round_robin, manual
  }
  ```
- **Response**: Evento actualizado con broker asignado

#### 7. GET `/api/calendar/availability`
- **Descripción**: Obtener disponibilidad de brokers para fecha/hora
- **Query Params**: `?date=2026-03-25&hour=15`
- **Response**:
  ```json
  {
    "available_brokers": [
      {"broker_id": "uuid", "name": "María González", "events_count": 2},
      {"broker_id": "uuid", "name": "Juan Pérez", "events_count": 0}
    ],
    "unavailable_brokers": [
      {"broker_id": "uuid", "name": "Pedro López", "reason": "Ya tiene evento en este horario"}
    ]
  }
  ```

---

### @CODE:CAL-001:ROUND Round Robin Assignment

**Ubicación**: `backend/services/calendar_service.py`

```python
async def assign_event_round_robin(event_id: str):
    """Asigna evento a broker con menor carga de trabajo"""

    event = await db.calendar_events.find_one({"_id": event_id})

    # Obtener brokers disponibles
    available_brokers = await get_available_brokers_for_event(event)

    # Contar eventos de cada broker en el mismo día
    broker_workload = {}
    event_date = event.start_time.date()

    for broker in available_brokers:
        events_count = await db.calendar_events.count_documents({
            "broker_id": broker.id,
            "start_time": {
                "$gte": datetime.combine(event_date, time.min),
                "$lte": datetime.combine(event_date, time.max)
            },
            "status": "scheduled"
        })
        broker_workload[broker.id] = events_count

    # Seleccionar broker con menos eventos
    selected_broker_id = min(broker_workload, key=broker_workload.get)

    # Asignar evento
    await db.calendar_events.update_one(
        {"_id": event_id},
        {"$set": {"broker_id": selected_broker_id}}
    )

    # Notificar broker
    await send_notification(
        selected_broker_id,
        "Nuevo evento asignado",
        f"{event.title} - {event.start_time.strftime('%Y-%m-%d %H:%M')}"
    )
```

---

### @CODE:CAL-001:REMINDERS Reminder System

**Ubicación**: `backend/services/calendar_service.py`

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', hour='*', minute='0')  # Cada hora
async def check_reminders():
    """Busca eventos que necesitan recordatorio"""

    now = datetime.utcnow()
    upcoming_events = await db.calendar_events.find({
        "status": "scheduled",
        "start_time": {"$gt": now}
    }).to_list(None)

    for event in upcoming_events:
        for reminder_minutes in event.reminders:
            reminder_time = event.start_time - timedelta(minutes=reminder_minutes)

            # Si ya es hora de enviar recordatorio
            if now >= reminder_time and now < event.start_time:
                # Verificar que no se haya enviado ya
                already_sent = await db.reminders_sent.count_documents({
                    "event_id": event.id,
                    "reminder_minutes": reminder_minutes
                })

                if not already_sent:
                    # Enviar recordatorio
                    await send_notification(
                        event.broker_id,
                        f"Recordatorio: {event.title}",
                        f"En {reminder_minutes} minutos - {event.location or 'Sin ubicación'}"
                    )

                    # Marcar como enviado
                    await db.reminders_sent.insert_one({
                        "event_id": event.id,
                        "reminder_minutes": reminder_minutes,
                        "sent_at": now
                    })
```

---

### @CODE:CAL-001:UI Calendar UI

**Ubicación**: `frontend/src/pages/CalendarPage.js`

#### Componentes

1. **Calendar Views**
   - Month View (calendario mensual)
   - Week View (semana con horas)
   - Day View (día con horas detalladas)
   - List View (lista de próximos eventos)

2. **Event Creation Modal**
   - Título (input)
   - Descripción (textarea)
   - Fecha y hora (datetime picker)
   - Lead asociado (dropdown)
   - Broker asignado (dropdown o round robin)
   - Ubicación (input)
   - Recordatorios (multi-select: 15 min, 1 hora, 1 día)

3. **Event Detail Modal**
   - Información del evento
   - Lead info (si está asociado)
   - Broker info
   - Acciones: Editar, Eliminar, Completar

4. **Mini Calendar**
   - Calendario pequeño para navegación rápida
   - Highlight días con eventos

---

## Traceability (@TAG)

- **SPEC**: @SPEC:CAL-001
- **TEST**: `backend/tests/test_calendar.py` → @TEST:CAL-001
- **CODE**:
  - `backend/server.py` → @CODE:CAL-001:API (Endpoints de calendario)
  - `backend/services/calendar_service.py` → @CODE:CAL-001:SERVICE
  - `backend/models.py` → @CODE:CAL-001:DATA (CalendarEvent model)
  - `frontend/src/pages/CalendarPage.js` → @CODE:CAL-001:UI
- **DOC**: `docs/calendar-system-guide.md` → @DOC:CAL-001

---

## Acceptance Criteria

### Criterios de Aceptación

1. **CRUD de Eventos**: Crear, leer, actualizar, eliminar eventos funciona
2. **Vistas Múltiples**: Calendar month, week, day views funcionan
3. **Eventos Recurrentes**: Sistema genera instancias de eventos recurrentes
4. **Recordatorios**: Sistema envía notificaciones antes de eventos
5. **Round Robin**: Asignación automática distribuye carga equitativamente

### Definición de Done

- [x] Feature implementada (85% completada)
- [ ] Tests unitarios y de integración creados
- [ ] Documentación de API generada
- [ ] User guide para brokers creada
- [ ] Plan de integración con Google Calendar documentado
