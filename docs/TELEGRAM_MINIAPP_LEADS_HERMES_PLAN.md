# Plan: Telegram MiniApp conectada a Leads + Hermes

## Objetivo

Crear una Telegram MiniApp para brokers e inmobiliarias que funcione como una version movil ligera de ROVI: login seguro desde Telegram, consulta de leads del VPS, pipeline operativo, calendario, acciones basicas de seguimiento y asistencia del agente Hermes.

La MiniApp no debe conectarse directo a Hermes ni leer archivos del VPS desde el navegador. La arquitectura segura sera:

```text
Telegram Bot / MiniApp
  -> ROVI FastAPI Backend
  -> MongoDB / datos importados desde leads/
  -> Hermes Agent interno en VPS
```

## Alcance MVP

### Incluye

- Login con Telegram MiniApp usando `initData`.
- Vinculacion de cuenta Telegram con usuario ROVI.
- Importacion/indexacion de datos utiles desde `leads/`.
- Inbox de leads capturados o importados.
- Pipeline basico.
- Calendario basico de seguimientos y visitas.
- Acciones de broker: llamar, WhatsApp, mensaje sugerido, crear tarea, mover etapa.
- Acciones de inmobiliaria: asignar broker, ver equipo, ver pipeline agregado.
- Hermes como asistente interno para clasificar, resumir y sugerir proximos pasos.

### No incluye en MVP

- Automatizaciones masivas sin confirmacion humana.
- Escrituras directas desde la MiniApp sin validacion backend.
- Acceso directo del frontend a archivos del VPS.
- Multiagente complejo.
- Inventario inmobiliario completo si los datos aun no estan normalizados.

## Roles

### Broker individual

Usuario que gestiona sus propios leads, tareas y calendario.

Permisos MVP:

- Ver solo sus leads.
- Crear leads desde texto/captura.
- Editar estado, prioridad, notas y siguiente accion.
- Crear tareas y eventos.
- Pedir a Hermes resumen, clasificacion y mensaje sugerido.
- Consultar historial basico del lead.

### Inmobiliaria

Cuenta de agencia con varios brokers.

Permisos MVP:

- Ver leads de la inmobiliaria.
- Filtrar por broker asignado.
- Asignar o reasignar leads.
- Ver pipeline agregado.
- Crear tareas para brokers.
- Ver calendario de equipo.
- Consultar metricas basicas por broker.

## Login y vinculacion

### Flujo recomendado

1. Usuario inicia sesion en ROVI web.
2. En Settings genera un QR/deep link de Telegram.
3. Abre el bot de Telegram y confirma identidad.
4. Backend crea o activa `user_device_links`.
5. Usuario abre la MiniApp desde Telegram.
6. MiniApp envia `Telegram.WebApp.initData` a:

```text
POST /api/telegram-miniapp/session
```

7. Backend valida HMAC de Telegram.
8. Backend responde con JWT, workspace activo y rol.
9. MiniApp usa ese JWT contra endpoints `/api/*`.

### Estados de sesion

- `anonymous`: vista web sin Telegram.
- `telegram_unlinked`: Telegram valido, pero no vinculado a ROVI.
- `active`: Telegram vinculado y token emitido.
- `expired`: token vencido, requiere renovar sesion.
- `revoked`: dispositivo revocado desde ROVI.

## Conexion con `leads/` del VPS

La carpeta `leads/` debe tratarse como fuente de datos, no como API publica.

### Fase 1: indexacion local

Crear un proceso backend/admin que lea:

- `leads/processed/*.csv`
- `.vcf`
- chats exportados `.txt`
- metadatos de imagenes si aplica

Y los normalice hacia MongoDB:

```text
lead_sources
lead_candidates
lead_import_batches
lead_messages
property_mentions
```

### Fase 2: busqueda desde MiniApp

La MiniApp consulta solo al backend:

```text
GET /api/miniapp/leads
GET /api/miniapp/leads/{id}
GET /api/miniapp/lead-candidates
POST /api/miniapp/lead-candidates/{id}/convert
```

### Fase 3: enrichment con Hermes

Hermes recibe texto/contexto y devuelve estructura:

```json
{
  "lead_type": "buyer|renter|seller|broker|noise",
  "intent_score": 82,
  "priority": "alta",
  "operation_type": "rent",
  "preferred_zone": "Playa del Carmen Centro",
  "budget_mxn": 45000,
  "bedrooms": 2,
  "summary": "Busca renta de 2 recamaras...",
  "next_action": "Confirmar fecha de entrada y agendar visita",
  "suggested_message": "Hola..."
}
```

## Modulos de la MiniApp

### 1. Inicio

Para ambos roles:

- Resumen del dia.
- Leads nuevos.
- Tareas vencidas.
- Proxima cita.
- Boton "Que hago ahora".

Broker:

- Lead caliente mas urgente.
- Mensaje sugerido para copiar.

Inmobiliaria:

- Leads sin asignar.
- Brokers con pendientes vencidos.

### 2. Leads

Broker:

- Lista de leads propios.
- Buscar por nombre, telefono, zona, presupuesto.
- Crear lead desde texto.
- Pedir analisis Hermes.
- Convertir captura/importacion en lead real.

Inmobiliaria:

- Todos los leads del workspace.
- Filtro por broker, etapa, prioridad, origen.
- Asignacion rapida.
- Vista de leads sin dueño.

### 3. Pipeline

Etapas CRM actuales:

```text
nuevo -> contactado -> calificacion -> presentacion -> apartado -> venta/perdido
```

Broker:

- Mover lead de etapa.
- Ver proximas acciones.
- Marcar seguimiento hecho.

Inmobiliaria:

- Vista agregada por etapa.
- Conteo por broker.
- Leads atorados.
- Reasignacion de oportunidades.

### 4. Calendario

Broker:

- Tareas de seguimiento.
- Visitas.
- Llamadas programadas.
- Recordatorios.

Inmobiliaria:

- Calendario de equipo.
- Filtros por broker.
- Citas sin confirmar.

Endpoints sugeridos:

```text
GET /api/miniapp/calendar
POST /api/miniapp/calendar/events
PATCH /api/miniapp/calendar/events/{id}
```

### 5. Mensajes

Broker:

- Generar mensaje de primer contacto.
- Seguimiento.
- Confirmacion de visita.
- Reactivacion.
- Post-visita.

Inmobiliaria:

- Plantillas compartidas.
- Mensajes aprobados por agencia.
- Tono de marca.

Hermes:

- Genera borradores, nunca envia sin confirmacion.

### 6. Tareas

Broker:

- Crear tarea.
- Completar tarea.
- Posponer.
- Asociar tarea a lead.

Inmobiliaria:

- Crear tarea para broker.
- Ver pendientes por broker.
- Detectar leads sin seguimiento.

### 7. Hermes

Acciones basicas:

- Clasificar captura.
- Resumir historial.
- Sugerir siguiente accion.
- Generar mensaje.
- Detectar duplicados probables.
- Extraer datos estructurados.

Endpoints sugeridos:

```text
POST /api/miniapp/hermes/classify
POST /api/miniapp/hermes/summarize
POST /api/miniapp/hermes/suggest-message
POST /api/miniapp/hermes/next-action
```

## Endpoints backend propuestos

### Sesion

```text
POST /api/telegram-miniapp/session
POST /api/telegram-miniapp/refresh
POST /api/telegram-miniapp/logout
```

### Leads MiniApp

```text
GET /api/miniapp/leads
POST /api/miniapp/leads
GET /api/miniapp/leads/{lead_id}
PATCH /api/miniapp/leads/{lead_id}
POST /api/miniapp/leads/{lead_id}/stage
POST /api/miniapp/leads/{lead_id}/assign
POST /api/miniapp/leads/{lead_id}/activity
```

### Candidatos importados desde `leads/`

```text
GET /api/miniapp/lead-candidates
GET /api/miniapp/lead-candidates/{candidate_id}
POST /api/miniapp/lead-candidates/{candidate_id}/convert
POST /api/miniapp/lead-candidates/import-batch
```

### Pipeline

```text
GET /api/miniapp/pipeline
GET /api/miniapp/pipeline/summary
```

### Calendario

```text
GET /api/miniapp/calendar
POST /api/miniapp/calendar/events
PATCH /api/miniapp/calendar/events/{event_id}
DELETE /api/miniapp/calendar/events/{event_id}
```

### Agencia

```text
GET /api/miniapp/agency/team
GET /api/miniapp/agency/metrics
GET /api/miniapp/agency/unassigned-leads
POST /api/miniapp/agency/assign-lead
```

## Cambios necesarios en MiniApp actual

Archivo actual:

```text
frontend/public/miniapp/app.js
```

Cambios:

- Remover flujo `/crm-bridge/*`.
- Usar solo `/api/telegram-miniapp/session` y `/api/miniapp/*`.
- Agregar pantalla/login state si Telegram no esta vinculado.
- Agregar refresh/logout.
- Separar datos demo de datos reales.
- Mapear estados locales a estados CRM reales.
- Crear vistas por rol:
  - `broker`
  - `agency_admin`
  - `manager`
  - `owner`
- Agregar loading, error y empty states reales.

## Seguridad

- HTTPS obligatorio para Telegram MiniApp.
- Validar `initData` en backend.
- Hermes solo por red interna o endpoint protegido.
- JWT corto y refresh controlado.
- Tenant isolation en cada query.
- No exponer rutas de filesystem del VPS.
- No exponer token de Telegram ni secretos Hermes al frontend.
- Auditar acciones: crear lead, mover etapa, asignar, completar tarea.

## Datos minimos por entidad

### Lead

```json
{
  "id": "lead-id",
  "tenant_id": "tenant-id",
  "assigned_broker_id": "user-id",
  "name": "Ana",
  "phone": "+52...",
  "email": null,
  "status": "nuevo",
  "priority": "alta",
  "source": "telegram_miniapp",
  "operation_type": "rent",
  "preferred_zone": "Playa del Carmen",
  "budget_mxn": 45000,
  "raw_interest_text": "...",
  "next_action": "...",
  "created_at": "..."
}
```

### Tarea

```json
{
  "id": "task-id",
  "lead_id": "lead-id",
  "assigned_to": "user-id",
  "title": "Dar seguimiento",
  "due_at": "...",
  "status": "pending",
  "priority": "alta"
}
```

### Evento calendario

```json
{
  "id": "event-id",
  "lead_id": "lead-id",
  "type": "visit|call|follow_up",
  "starts_at": "...",
  "ends_at": "...",
  "assigned_to": "user-id",
  "status": "scheduled"
}
```

## Fases de implementacion

### Fase 0: Preparacion VPS

- Confirmar dominio HTTPS.
- Confirmar bot de Telegram y BotFather Menu Button.
- Confirmar ubicacion real de Hermes en VPS.
- Confirmar ubicacion real de `leads/` en VPS.
- Definir variables `.env`.

### Fase 1: Login MiniApp

- Probar `/api/telegram-miniapp/session` en VPS.
- Agregar estados de sesion en MiniApp.
- Mostrar pantalla de cuenta no vinculada.
- Guardar token con expiracion.

### Fase 2: Datos `leads/`

- Crear script de importacion/indexacion.
- Normalizar CSV/chats/contactos.
- Guardar candidatos en MongoDB.
- Exponer endpoints `lead-candidates`.

### Fase 3: Leads y Pipeline

- Conectar MiniApp a `/api/miniapp/leads`.
- Crear vista de leads reales.
- Crear pipeline movil.
- Permitir mover etapa.
- Convertir candidato en lead.

### Fase 4: Calendario y tareas

- Crear endpoints de tareas/eventos.
- Mostrar agenda del dia.
- Crear tareas desde lead.
- Crear visita/llamada.

### Fase 5: Hermes

- Crear cliente backend para Hermes.
- Clasificar captura con Hermes.
- Generar mensaje.
- Resumir lead.
- Sugerir siguiente accion.

### Fase 6: Agencia

- Vista de equipo.
- Asignacion/reasignacion de leads.
- Pipeline agregado.
- Calendario de equipo.
- Metricas basicas.

## MVP recomendado de primera entrega

Primera version util:

1. Login Telegram vinculado a ROVI.
2. Lista de leads reales.
3. Crear lead desde texto.
4. Pipeline basico.
5. Tareas simples.
6. Mensaje sugerido por plantilla local.
7. Vista distinta para broker e inmobiliaria.

Despues:

1. Importador/indexador de `leads/`.
2. Hermes para clasificacion real.
3. Calendario.
4. Asignacion avanzada de agencia.
5. Metricas.

## Criterios de exito

- Un broker puede abrir Telegram, entrar a la MiniApp y ver sus leads.
- Puede crear un lead desde texto en menos de 30 segundos.
- Puede moverlo de etapa y crear seguimiento.
- Una inmobiliaria puede ver leads por broker y reasignar.
- Hermes puede clasificar una captura y devolver siguiente accion.
- Ningun dato del VPS se expone sin pasar por backend y permisos.

## Ejecucion E2E inicial

Estado: primera version implementada en repo.

Backend agregado:

- `GET /api/miniapp/summary`
- `GET /api/miniapp/leads`
- `POST /api/miniapp/leads`
- `PATCH /api/miniapp/leads/{lead_id}`
- `POST /api/miniapp/leads/{lead_id}/stage`
- `POST /api/miniapp/leads/{lead_id}/assign`
- `GET /api/miniapp/pipeline`
- `GET /api/miniapp/tasks`
- `POST /api/miniapp/tasks`
- `PATCH /api/miniapp/tasks/{task_id}`
- `GET /api/miniapp/calendar`
- `POST /api/miniapp/calendar/events`
- `GET /api/miniapp/agency/team`
- `GET /api/miniapp/lead-candidates`
- `POST /api/miniapp/lead-candidates/import-local`
- `POST /api/miniapp/lead-candidates/{candidate_id}/convert`
- `POST /api/miniapp/hermes/classify`

MiniApp conectada:

- Carga resumen, leads, tareas y agenda desde `/api/miniapp/*` cuando Telegram esta vinculado.
- Mantiene modo local/demo cuando no hay sesion.
- Captura rapida crea lead real en CRM si hay JWT activo.
- Pipeline puede avanzar lead de etapa.
- Tareas pueden crearse y completarse.
- Agenda permite crear un seguimiento rapido.
- Boton `Importar leads` lee candidatos desde `leads/processed` via backend y permite convertirlos en leads.

Validacion local realizada:

- `python3 -m py_compile backend/server.py`
- `node --check frontend/public/miniapp/app.js`

Pendiente para VPS:

- Probar con bot real y `Telegram.WebApp.initData`.
- Confirmar `ROVI_LEADS_DATA_DIR` si la carpeta `leads/` en VPS no esta junto al backend.
- Correr suite `pytest` en un entorno con dependencias instaladas.
- Conectar `/api/miniapp/hermes/classify` al gateway real de Hermes; hoy usa fallback local seguro.
