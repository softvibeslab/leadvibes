# SPEC FUNCIONAL — Telegram MiniApp Rovi (Fase 0)

**Versión**: 0.1
**Fecha**: 2026-06-12
**Autor**: Workflow Architect
**Estado**: Draft (pendiente de Reality Checker pass y decisión de preguntas abiertas)
**Roles cubiertos**: `broker`, `agency_admin`

Toda afirmación sobre permisos, scopes y endpoints está anclada al código real con referencia `archivo:línea`. Lo que no existe hoy en el código está marcado explícitamente como **NO EXISTE HOY**.

---

## 1. Resumen y alcance

La MiniApp de Telegram es la interfaz gráfica móvil de las capacidades que hoy ya tienen los agentes Hermes por chat: priorizar leads, mover el pipeline, revisar agenda y tareas, consultar inventario y aprobar/rechazar acciones del agente. Se abre dentro de Telegram (WebApp SDK), se autentica con `initData` firmado por el bot y reutiliza el JWT estándar del CRM, por lo que **todas las llamadas a datos van por la API REST existente bajo `/api`** con la misma multi-tenancy (`tenant_id` en cada query).

**Estado de partida real (no greenfield):**
- Ya existe un endpoint de sesión MiniApp: `POST /api/telegram-miniapp/session` (`backend/server.py:9096-9158`) con validación HMAC de `initData` (`backend/server.py:7680-7710`).
- Ya existe una MiniApp demo en `frontend/public/miniapp/` (`index.html`, `app.js`, `styles.css`) servida bajo `/miniapp/` desde el contenedor frontend. Hoy funciona casi toda con datos demo en `localStorage` (`frontend/public/miniapp/app.js:10-90`), pero **ya hace bootstrap de sesión real** (`app.js:109-136`) y **ya consulta leads reales** con Bearer token (`app.js:434-466`).
- El sistema de vinculación por device links (QR + `/start` del bot + validación de teléfono) ya existe (`backend/server.py:8582-8695`, `7774-7841`).
- El flujo auditado de acciones (`telegram_agent_pending_actions` + `agent_action_audit` + `agent_interpretation_jobs`) ya existe y es **requisito duro** reutilizarlo para toda escritura iniciada por agente (CLAUDE.md: "don't bypass the `agent_interpretation_job` flow").

**Dentro del MVP (Fase 0):**
1. Pantalla "Hoy" (dashboard personal/equipo)
2. Leads: lista, detalle, cambio de status del pipeline, copy WhatsApp
3. Agenda: eventos + "Preparar reunión"
4. Propiedades: lista + sugerencia de match (vía agente)
5. Chat agente embebido con tarjetas Aprobar/Rechazar para acciones `pending_confirmation`
6. Solo `agency_admin`: vista de equipo / leaderboard

**Fuera del MVP:**
- Roles distintos de `broker` y `agency_admin` (`rentals`, COPIM, rovi_internal, growth_partner).
- Importación masiva (CSV/Drive) desde la MiniApp — se queda en el bot/web.
- Subida de media desde la MiniApp (Media Hub) — el bot ya lo cubre.
- Edición de propiedades (solo lectura + interés en MVP; `agency_admin` crea/edita en web).
- Campañas, VibeLab, gamificación de escritura (solo lectura de leaderboard).
- Notificaciones push propias (se apoya en los mensajes del bot).
- Workspace switching dentro de la MiniApp (la sesión usa el workspace del device link activo, `backend/server.py:9123`).

---

## 2. Matriz de capacidades

### 2.1 Fuente de verdad de permisos

Los permisos de agente por rol se cargan en runtime desde `backend/agent_knowledge/{role_scope}.json` (`backend/agent_control.py:1224`, `1253-1264`) y se evalúan con prefijo de verbo en `role_policy_allows` (`backend/agent_control.py:1269-1272`).

> **HALLAZGO**: los perfiles del repo (`backend/agent_knowledge/broker.json`, `agency_admin.json`) son MÁS NUEVOS y más amplios que los de `/Users/rogergv/Documents/SoftvibesLab/Rovi/`. Ejemplo: el broker del repo ya tiene `change_stage_own`, `import_autopilot_own` y `delete_own_after_confirmation` en leads (`backend/agent_knowledge/broker.json:16`), que NO existen en la copia externa (`broker.json:13` externa). Esta spec usa los del repo como fuente de verdad porque son los que ejecuta el código.

La visibilidad por rol se aplica en dos capas de código distintas (¡y solo en las rutas de agente, no en la API REST general — ver hallazgos en §7!):

- **Runtime de agente (chat/tools)**: `scoped_entity_query` (`backend/agent_control.py:1507-1520`) — broker: leads `$or [created_by, assigned_broker_id]`, tasks `$or [created_by, assigned_to]`, events `user_id`, properties = todo el tenant. `agency_admin` está en `TENANT_WIDE_ROLE_SCOPES` (`backend/agent_control.py:1231-1239`) → ve todo el tenant.
- **Flujo Hermes Telegram (texto)**: `apply_role_scope_visibility` (`backend/hermes_crud_extensions.py:383-409`), con `BROKER_SCOPED_ROLES = {"broker"}` y `TENANT_SCOPED_ROLES ⊇ {"agency_admin"}` (`backend/hermes_crud_extensions.py:365-366`). Broker sin `user_id` ⇒ deny total (`hermes_crud_extensions.py:379-381, 395-396`).

### 2.2 Matriz pantalla × rol × permiso

| Pantalla / acción | broker | agency_admin | Permiso de origen (archivo:línea) | Endpoint que la sirve |
|---|---|---|---|---|
| Hoy: leads calientes | ✅ propios | ✅ tenant | broker `leads: read_own` `agent_knowledge/broker.json:16`; admin `leads: read` `agent_knowledge/agency_admin.json:17`; scoping `agent_control.py:1514-1515` | `GET /api/leads` (`server.py:12999`) + filtro cliente, o `GET /api/dashboard/broker-performance-overview` (`server.py:12513`) |
| Hoy: tareas del día | ✅ propias/sin asignar | ✅ tenant | broker `tasks: read_own` `broker.json:17`; admin `tasks: read` `agency_admin.json:18`; enforcement real `visible_task_query` `tasks.py:71-84` + `MANAGER_ROLES` `tasks.py:22` | `GET /api/tasks?due=today` (`tasks.py:196-240`) |
| Hoy: próximas citas | ✅ propias | ⚠️ solo las suyas (ver hallazgo F5) | broker `events: read_own` `broker.json:18`; admin declara `events: tenant_all` `agency_admin.json:9` pero el endpoint filtra `user_id` (`server.py:15662`, `15803-15806`) | `GET /api/calendar/today` (`server.py:15796`) |
| Leads: lista + búsqueda | ✅ propios (enforcement pendiente, F3) | ✅ tenant | `broker.json:16`, `agency_admin.json:17` | `GET /api/leads` (`server.py:12999`; query `leads_improvements.py:83`) |
| Leads: detalle | ✅ | ✅ | mismas | `GET /api/leads/{id}` (`server.py:13066`) |
| Leads: crear | ✅ (se autoasigna) | ✅ | broker `leads: create` `broker.json:16`; admin `agency_admin.json:17`; el builder Hermes asigna `assigned_broker_id = user` si broker (`server.py:6677`) | `POST /api/leads` (`server.py:13096`) o vía agente |
| Leads: cambio de status (pipeline) | ✅ solo propios | ✅ cualquiera del tenant | broker `change_stage_own` `broker.json:16`; admin `change_stage` `agency_admin.json:17`; statuses válidos `models.py:14-21` | `PUT /api/leads/{id}` (`server.py:13162`) — ⚠️ hoy no valida ownership (F3) |
| Leads: reasignar broker | ❌ | ✅ | broker `brokers: []` `broker.json:21`; admin `assign_broker` `agency_admin.json:17` y `brokers: assign_leads` `agency_admin.json:22` | `PUT /api/leads/{id}` campo `assigned_broker_id` (`models.py:348`) |
| Leads: eliminar | ✅ propios, con confirmación | ✅ con confirmación | broker `delete_own_after_confirmation` `broker.json:16`; admin `delete_after_confirmation` `agency_admin.json:17`; en Hermes delete ⇒ `pending_confirmation` (`hermes_action_builders.py:432`) | vía agente (flujo auditado) — NO botón directo en MVP |
| Leads: copy WhatsApp | ✅ | ✅ | skill `whatsapp_followup` `broker.json:29`; regla "one short natural message ready to paste" (decision_rules); plantillas de tono `broker.json:93-97` | Cliente (plantilla local) o `POST /api/ai-agent/run` |
| Agenda: ver eventos | ✅ propios | ⚠️ solo propios (F5) | `broker.json:18` / `agency_admin.json:19` | `GET /api/calendar/events` (`server.py:15655`) |
| Agenda: crear/editar/borrar evento | ✅ propios | ✅ propios | `events: create, update_own, delete_own_after_confirmation` `broker.json:18` | `POST/PUT/DELETE /api/calendar/events*` (`server.py:15688`, `15721`, `15775`) con sync Google (`15708`) |
| Agenda: Preparar reunión | ✅ | ✅ | `meeting_prepare` `broker.json:18` / `agency_admin.json:19`; workflow `broker.json:78-86` / `agency_admin.json:68-76`; routing `agent_knowledge/routing_rules.json:5-16` | `POST /api/ai-agent/run` (`agent_control.py:4370-4374`) — **NO EXISTE endpoint REST dedicado** |
| Propiedades: lista | ✅ todo inventario activo del tenant | ✅ | broker `read_available` `broker.json:19` + comentario "properties: inventario visible para todo el tenant" `agent_control.py:1519` | `GET /api/products` (`server.py:14994`) |
| Propiedades: detalle | ✅ | ✅ | mismas | `GET /api/products/{id}` (`server.py:15053`) |
| Propiedades: sugerir match | ✅ | ✅ | broker `suggest_match` `broker.json:19`; skill `property_matcher` `broker.json:30` | **NO EXISTE HOY endpoint de match** — vía `POST /api/ai-agent/run` (tool `buscar_propiedades`) |
| Propiedades: crear/editar | ❌ (solo `prepare_interest`) | ✅ | broker NO tiene `create/update` en properties `broker.json:19`; admin sí `agency_admin.json:20` | `POST/PUT /api/products*` (`server.py:15024`, `15262`) — fuera de MVP en MiniApp |
| Chat agente | ✅ scope broker | ✅ scope tenant | `run_agent_turn` con `role_scope` forzado por backend (`agent_control.py:2200-2218`); tools filtradas por `role_policy_allows` (`agent_control.py:1480-1485`) | `POST /api/ai-agent/run` (`agent_control.py:4370`) |
| Chat: aprobar/rechazar acción pendiente | ✅ las suyas | ✅ las suyas | confirmación hoy SOLO por texto Telegram (`server.py:8396-8427` confirmar, `8358-8395` cancelar) | **NO EXISTE HOY endpoint REST** — propuesto `/api/telegram-miniapp/agent-actions/*` (§5) |
| Equipo / leaderboard | ❌ (analytics `own_performance_only` `broker.json:12`) | ✅ (`analytics: tenant_all` `agency_admin.json:12`; `brokers: review_performance` `agency_admin.json:22`) | `GET /api/dashboard/leaderboard` (`server.py:12755-12832`) y `GET /api/dashboard/agency-executive` → `team_performance` (`server.py:12351-12510`) — ⚠️ sin gate de rol hoy (F8) |

---

## 3. Pantallas del MVP

Convenciones de estados para TODAS las pantallas:

- **Cargando**: skeleton + texto "Cargando…". Timeout cliente 10s ⇒ estado error con botón Reintentar.
- **Vacío**: mensaje contextual + CTA (definido por pantalla).
- **Error API**: 401 ⇒ flujo re-auth (§6.1); 403 ⇒ mensaje de scope (§6.3); 5xx/red ⇒ banner "Sin conexión con ROVI" + Reintentar (§6.4).
- Toda la UI usa el JWT de la sesión MiniApp en header `Authorization: Bearer` (patrón ya implementado en `frontend/public/miniapp/app.js:138-147`).

### 3.1 Hoy (dashboard)

**Objetivo**: réplica visual del "focus mode" del agente broker (`agent_knowledge/broker.json:24, 38-45`: una prioridad clara, un mensaje listo, una acción guardada) y del "daily command center" del admin (`agency_admin.json:25, 43-49`).

**Datos**:
1. Leads calientes: `GET /api/leads?priority=alta&priority=urgente&status=nuevo&status=contactado&status=calificacion&sort_by=updated_at&page_size=10` (parámetros soportados en `server.py:12999-13014`). Criterio "hot" alineado al `lead_priority_model` (`broker.json:46-55`). Para broker, el cliente filtra adicionalmente `assigned_broker_id == user.id || created_by == user.id` mientras no exista enforcement backend (ver F3 y endpoint propuesto §5.4).
2. Tareas del día: `GET /api/tasks?due=today` + `due=overdue` (lógica `tasks.py:225-234`; scoping real por rol `tasks.py:71-84`). El response incluye `summary` (`tasks.py:237-240`).
3. Próximas citas: `GET /api/calendar/today` (`server.py:15796-15819`; ya viene enriquecido con `lead.name/phone`, `15808-15817`).

**Workflow**:
```
PASO 1: bootstrap de sesión (§4). FALLA(link_required) → pantalla onboarding (§6.2).
PASO 2: 3 fetches en paralelo. Timeout individual 10s.
  - ÉXITO total → render de 3 secciones.
  - FALLA parcial (1 de 3) → render de las otras 2 + tarjeta de error con Reintentar solo en la sección caída.
  - FALLA total → estado offline (§6.4).
PASO 3 (rama broker): tarjeta "Tu prioridad ahora" = primer lead hot (answer_shape "focus", broker.json:91).
PASO 3 (rama agency_admin): tarjeta "Command center" = totales del tenant + acceso a pestaña Equipo
        (answer_shape "command_center", agency_admin.json:84).
```

**Branches y estados**:
- Sin leads hot → "Sin leads calientes ahora. Revisa seguimientos pendientes" + CTA a Leads.
- Sin tareas hoy → "Día despejado" + CTA "Crear tarea" (abre chat agente con prompt precargado "crea tarea …" — detector `telegram_text_requests_task_creation`, ruteado en `server.py:6849-6850`).
- Sin citas hoy → CTA "Agendar seguimiento" (abre Agenda).
- Estados observables: el operador puede correlacionar las consultas del usuario vía logs de uvicorn; no se crea ningún documento (solo lecturas).

### 3.2 Leads

**Lista**:
- `GET /api/leads?search=&status=&priority=&page=&page_size=20` (`server.py:12999`). Respuesta paginada `{leads, total, page, page_size, total_pages}` (`server.py:13037-13043`).
- Filtros UI = exactamente los del pipeline real: status `nuevo → contactado → calificacion → presentacion → apartado → venta/perdido` (`backend/models.py:14-21`) y priority `baja/media/alta/urgente` (`models.py:23-27`).
- ⚠️ El cliente debe descartar `deleted: true` (el endpoint no lo filtra — hallazgo F4).
- Vacío: "No hay leads con esos filtros" + CTA "Crear lead con el agente".
- Carga incremental por página (`page` param); pull-to-refresh.

**Detalle** (`GET /api/leads/{id}`, `server.py:13066-13094`):
- Campos a mostrar (todos reales, `models.py:353-395`): `name, phone, email, status, priority, source, budget_mxn, preferred_zone, property_interest, notes, tags, intent_score, next_action, ai_analysis, last_contact`.
- Incluye `activities` (últimas 20, `server.py:13077-13080`) y `assigned_broker` (`13082-13088`).
- Error 404 → "Lead no encontrado (pudo ser eliminado)" + volver a lista.

**Cambio de status del pipeline**:
```
PASO 1: usuario toca el chip de status → bottom sheet con los 7 estados (models.py:14-21).
PASO 2: PUT /api/leads/{id} body {"status": "<nuevo_status>"} (server.py:13162; LeadUpdate.status models.py:323).
  Timeout: 10s.
  ÉXITO → optimista: chip actualizado; el backend emite WebSocket lead_updated (server.py:13233-13238),
          por lo que la web lo refleja en vivo.
  FALLA(400) "No se proporcionaron campos" (server.py:13183-13187) → no debería ocurrir (siempre mandamos status).
  FALLA(404) → lead borrado en paralelo → toast "El lead ya no existe" + refrescar lista.
  FALLA(timeout/red) → revertir chip + toast Reintentar.
PASO 3 (rama venta/perdido): pedir confirmación extra en UI ("¿Marcar como venta?") porque es fin de pipeline.
        (Regla de producto, no de código: el backend no lo exige.)
```
- **Regla de scope (broker)**: la UI solo ofrece cambio de status si `lead.assigned_broker_id == user.id || lead.created_by == user.id` (espejo de `agent_control.py:1514-1515`), porque el backend hoy NO lo valida (F3). Para `agency_admin` siempre disponible.

**Acción rápida "copy WhatsApp"**:
```
PASO 1: botón "WhatsApp" en tarjeta/detalle.
PASO 2 (rama rápida, sin red): plantilla local con tono real del rol
        (tone_examples broker.json:93-97) interpolando {{nombre}}, {{zona}}, {{razon}}.
PASO 3 (rama con agente, opcional): POST /api/ai-agent/run con
        message="prepara mensaje de WhatsApp para el lead <nombre>" — el agente responde
        "one short natural message ready to paste" (decision_rule whatsapp, broker.json copia externa:32).
PASO 4: navigator.clipboard.writeText + Telegram HapticFeedback (patrón ya implementado app.js:196-205, 495-501).
        Adicional: deep link wa.me/<phone> si lead.phone existe y !lead.whatsapp_opt_out (models.py:380).
FALLA(clipboard no disponible) → mostrar el texto seleccionable en modal.
```

### 3.3 Agenda

**Lista**: `GET /api/calendar/events?start_date=&end_date=` (`server.py:15655-15686`), agrupada por día. Hoy: `GET /api/calendar/today`. Tipos de evento reales: `seguimiento, llamada, zoom, visita, otro` (`models.py:1202`). Vacío: "Sin citas esta semana" + CTA "Agendar".

**Crear/editar**:
- `POST /api/calendar/events` con `CalendarEventCreate` (`models.py:1199-1207`: `title`, `start_time` requeridos; `lead_id`, `reminder_minutes` opcionales). El backend sincroniza a Google si está conectado y responde `synced_to_google` (`server.py:15708-15719`) → mostrar badge "Sincronizado con Google".
- `PUT /api/calendar/events/{id}` (`server.py:15721`) y `DELETE` (`15775`, borra también en Google `15788-15789`). El delete pide confirmación en UI (alineado a `delete_own_after_confirmation`, `broker.json:18`).
- FALLA(404): el evento es de otro usuario (filtro `user_id`, `server.py:15730`) o no existe → "Evento no encontrado".

**"Preparar reunión"** — mapeo 1:1 del `meeting_prep_workflow` del broker (`agent_knowledge/broker.json:78-86`; versión admin `agency_admin.json:68-76`) a UI. No existe endpoint dedicado: el MVP lo ejecuta con `POST /api/ai-agent/run` (`agent_control.py:4370-4374`), que ya tiene las tools `buscar_leads`, `buscar_tareas`, `buscar_eventos`, `buscar_propiedades` con scope por rol (`agent_control.py:1583+`, `1507-1520`) y el routing `prepare_meeting` con `answer_shape` definido (`agent_knowledge/routing_rules.json:5-16`).

```
TRIGGER: botón "Preparar reunión" en la tarjeta de un evento.
PASO 1 [UI]: POST /api/ai-agent/run
        body: { "message": "prepara la reunión '<event.title>' del <start_time> con el lead <lead.name>",
                "include_context": true }
        Timeout UI: 60s (incluye llamadas LLM + tools; MAX_TOOL_ROUNDS=4, agent_control.py:1227).
PASO 2 [Agente]: ejecuta la secuencia del workflow:
  (1) "Identificar contacto/lead y hora de reunión"   → ya viene en el prompt (evento seleccionado).
  (2) "Buscar lead propio/asignado"                   → tool buscar_leads (scope broker: own; admin: tenant).
  (3) "Resumir presupuesto, zona, urgencia…"          → campos reales del lead (budget_mxn, preferred_zone,
                                                         property_interest, notes, ai_analysis; models.py:353-395).
  (4) "Sugerir propiedades compatibles"               → tool buscar_propiedades sobre db.products.
  (5) "Preparar 3 preguntas de descubrimiento"        → LLM (answer_shape "meeting": Brief/Preguntas/Objeciones/
                                                         Propiedades/Follow-up, broker.json:90).
  (6) "Preparar un mensaje de confirmación WhatsApp"  → LLM, tono visit_confirmation (broker.json:96).
  (7) "Crear tarea de seguimiento automáticamente"    → tool de escritura → _queue_or_execute_write
                                                         (agent_control.py:1527-1576): queda pending_confirmation
                                                         salvo skill autopilot crm_remote_control
                                                         (agent_control.py:1225, 1502-1505).
PASO 3 [UI]: render del brief por secciones (answer_shape) + botón "Copiar mensaje de confirmación".
PASO 4 [UI]: si la respuesta dejó una acción pending_confirmation (action_id en el resultado de la tool,
        agent_control.py:1569-1576), mostrar tarjeta Aprobar/Rechazar (§3.5).
FALLA(timeout LLM) → "El agente tardó demasiado. Reintenta" (el run queda registrado en agent_runs,
        agent_control.py:2364-2386, success=false).
FALLA(lead inexistente) → brief degradado: "No encontré lead; prepara una vista previa" (paso 2 del workflow
        externo broker.json:37 'prepare a lead preview if it does not exist').
```

**Estados observables**: cada run queda en `db.agent_runs` con `latency_ms`, `tools_executed`, `success` (`agent_control.py:2364-2386`); cada escritura propuesta en `db.telegram_agent_pending_actions` (`agent_control.py:1556`).

### 3.4 Propiedades

- **Lista**: `GET /api/products?is_active=true&search=&niche=&operation_type=` (`server.py:14994-15021`). Campos a mostrar (`models.py:1844-1869`): `title, sku, niche, operation_type, price_mxn, images (cover), location.zone, features`. Inventario visible para ambos roles (broker: `read_available` `broker.json:19`; el runtime trata properties como tenant-wide, `agent_control.py:1519`).
- **Detalle**: `GET /api/products/{id}` (`server.py:15053`) + leads interesados `GET /api/products/{id}/interests` (`server.py:15108`) — esta última solo visible para `agency_admin` en UI (es información de otros brokers; broker `brokers: none`, `broker.json:11`).
- **Sugerencia de match**: **NO EXISTE HOY** endpoint determinístico de matching. Dos rutas en MVP:
  1. *Match por agente*: botón "Buscar match para <lead>" → `POST /api/ai-agent/run` con `message="sugiere propiedades para el lead <nombre> (presupuesto $X, zona Y)"`; el agente usa `buscar_propiedades` con filtros (skill `property_matcher`, `broker.json:30`).
  2. *Pre-filtro local*: filtrar la lista por `price_mxn <= lead.budget_mxn` y `location.zone ~ lead.preferred_zone` (campos reales `models.py:298, 304, 371`). Es el reemplazo del scoring demo actual (`app.js:342-363`).
- **Interés del lead** (`prepare_interest`, `broker.json:19`): "Vincular a lead" = `PUT /api/leads/{id}` agregando el producto a `interested_product_ids` (`models.py:339`).
- Vacío: "Sin propiedades activas" + (solo admin) CTA "Crear en ROVI web".

### 3.5 Chat agente (Hermes embebido)

**Transporte**: `POST /api/ai-agent/run` con JWT (`agent_control.py:4370-4374`). El backend resuelve `role_scope` del token — broker/agency_admin por `resolve_role_scope` (`agent_control.py:727+`) — y NUNCA confía en scope mandado por el cliente (`routing_rules.json:43-46`: "tools_must_ignore_user_supplied_scope").

```
PASO 1: usuario escribe mensaje → POST /api/ai-agent/run {message, include_context: true}.
        Timeout UI: 60s. Estado: burbuja "escribiendo…".
PASO 2: respuesta {success, run_id, response, tools_executed, …} (agent_control.py:2400-2410).
  RAMA A (solo lectura): render del texto.
  RAMA B (escritura segura con autopilot crm_remote_control): tools ya ejecutadas
        (status ready_to_execute → ejecutor execute_pending_telegram_action, registrado en server.py:7169-7171);
        render del texto + chip "Guardado en ROVI" con record_ids.
  RAMA C (escritura sin autopilot o delete): la tool dejó una acción
        status=pending_confirmation en db.telegram_agent_pending_actions (agent_control.py:1551, 1570)
        → la UI muestra TARJETA DE CONFIRMACIÓN.
PASO 3 (tarjeta): título = preview de la acción (mismo formato que los previews Telegram:
        format_pending_telegram_action_preview server.py:6894-6971, format_delete_action_preview
        hermes_action_builders.py:931-952). Botones: [Aprobar] [Rechazar].
  - Aprobar → POST /api/telegram-miniapp/agent-actions/{action_id}/confirm (NUEVO, §5.2)
      ÉXITO → chip "Ejecutado" + records creados; FALLA(409 expirada) → "El preview expiró (30 min),
      vuelve a pedirlo" (expiración expires_at: 30 min escrituras hermes_action_builders.py:284,446;
      30 min builders server.py:6642).
  - Rechazar → POST /api/telegram-miniapp/agent-actions/{action_id}/cancel (NUEVO, §5.2)
      → chip "Cancelado. No guardé cambios" (paridad con texto server.py:8378).
PASO 4: al abrir el chat, GET /api/telegram-miniapp/agent-actions?status=pending_confirmation (NUEVO, §5.2)
        para re-pintar tarjetas pendientes no resueltas (p. ej. creadas desde el bot de Telegram):
        misma cola que el bot ⇒ el usuario puede aprobar en MiniApp lo que pidió por voz en el bot.
```

**Reglas duras** (paridad con bot):
- Los DELETE siempre pasan por confirmación: en flujo texto los builders de delete nacen `pending_confirmation` (`hermes_action_builders.py:432, 474, 516, 558`) y el webhook nunca autoejecuta `delete_*` (`server.py:8438`). La MiniApp respeta lo mismo: jamás botón de borrado directo.
- Toda ejecución pasa por `execute_pending_telegram_action`, que marca `status=executed` y escribe `agent_action_audit` (`server.py:7147-7165`). La MiniApp **no** escribe directo a las colecciones por acciones de agente.
- Historial de chat: **NO EXISTE HOY** endpoint para leer `telegram_agent_messages`/`agent_runs` del propio usuario (solo audit admin, `server.py:5480-5515`). MVP: historial efímero en memoria de la sesión de la MiniApp; persistencia = pregunta abierta Q5.

**Entradas multimodales** (fotos/voz/links): fuera del chat MiniApp en MVP. Se mantienen en el bot, donde ya crean `agent_interpretation_job` ANTES de procesar (`agent_media_pipeline.py:261-312`), con `mapping_status = "queued"` si `confidence >= 0.6`, si no `needs_review` (`agent_media_pipeline.py:306`), `autopilot_allowed = entity_type != "knowledge"` (`:307`) y `delete_requires_confirmation: true` (`:308`). La MiniApp puede en fase posterior listar jobs `needs_review` para revisión humana (Q6).

### 3.6 Solo agency_admin: Equipo / Leaderboard

**Verificación de datos reales** (sí existen):
- `GET /api/dashboard/leaderboard` (`server.py:12755-12832`) → `List[BrokerStats]` (`models.py:498-509`): `broker_name, total_points, ventas, apartados, leads_asignados, llamadas, presentaciones, rank, month_progress`. Agrega sobre `point_ledger`, `leads`, `activities` (`server.py:12768-12804`).
- `GET /api/dashboard/agency-executive` (`server.py:12351-12510`) → `overview` (conversión, revenue, velocidad) + `team_performance` por broker (`12391-12406`) + `timeline`.

**Workflow**:
```
PASO 1: pestaña "Equipo" visible solo si active_role ∈ {admin, manager, owner} o role_scope = agency_admin
        (resolución hermes_bridge.py:72-73: agency/admin/manager/owner → agency_admin).
PASO 2: fetch paralelo leaderboard + agency-executive. Timeout 15s (agrega hasta 5000 leads en memoria,
        server.py:12360).
PASO 3: render ranking (rank, puntos, ventas, apartados) + tarjetas de riesgo
        ("leads sin seguimiento", "tareas vencidas") derivadas del operating_cadence diario
        (agency_admin.json:43-49) usando GET /api/tasks?due=overdue (tasks.py:230-232).
VACÍO: tenant sin brokers → "Aún no tienes equipo en este workspace" + CTA invitar (web).
FALLA: cualquiera de los dos endpoints cae → mostrar el otro + tarjeta de reintento.
```
- ⚠️ Gate de rol: **el backend hoy no restringe estos endpoints por rol** (solo `Depends(get_current_user)`, `server.py:12756, 12352`) — un broker del tenant podría llamarlos directo. La MiniApp lo oculta por UI, pero el cierre real es backend (hallazgo F8).
- ⚠️ `get_leaderboard` resuelve tenant con `get_or_create_tenant(user_id)` (`server.py:12758`) en lugar de `active_tenant_id` — con workspace switching puede apuntar al tenant equivocado (hallazgo F9).

---

## 4. Flujo de autenticación

### 4.1 Diagrama de secuencia (texto)

```
[Telegram App]          [MiniApp /miniapp/]            [Backend /api]                      [MongoDB]
      |                        |                             |                                 |
 1. Usuario abre MiniApp       |                             |                                 |
    (botón menú del bot o      |                             |                                 |
    deep link t.me/...?startapp=CODE)                        |                                 |
      |---- initData firmado -->|                            |                                 |
      |                        | 2. tg.ready(); lee tg.initData y start_param                  |
      |                        |    (app.js:34-42, 102-107)  |                                 |
      |                        |-- POST /api/telegram-miniapp/session ----------------------->|
      |                        |   {init_data, start_param}  | (server.py:9096-9098)           |
      |                        |                             | 3. validate_telegram_webapp_init_data
      |                        |                             |    (server.py:7680-7710):
      |                        |                             |    - HMAC: secret = HMAC_SHA256("WebAppData",
      |                        |                             |      ROVI_TELEGRAM_BOT_TOKEN) (7697)
      |                        |                             |    - hash sobre data_check_string ordenado (7696-7700)
      |                        |                             |    - auth_date <= 24h (7702-7704)
      |                        |                             | 4. busca device link ACTIVO por
      |                        |                             |    telegram.user_id (9104-9108) ------>| user_device_links
      |                        |                             |                                        |
      |                        |   RAMA A: sin link activo   |                                 |
      |                        |<-- 200 {status:"link_required", start_code, message} (9109-9115)
      |                        |    → onboarding §6.2        |                                 |
      |                        |                             |                                 |
      |                        |   RAMA B: link activo       |                                 |
      |                        |                             | 5. carga user, valida is_active (9117-9119)
      |                        |                             | 6. resuelve workspace del link (9121-9123)
      |                        |                             | 7. access_token = create_access_token(
      |                        |                             |      build_access_token_payload(user, ws))
      |                        |                             |    claims: sub, tenant_id, active_tenant_id,
      |                        |                             |    active_membership_id, role, active_role,
      |                        |                             |    account_type, email, name (server.py:477-491)
      |                        |                             |    TTL 24h (auth.py:18-25)
      |                        |                             | 8. refresh_token 7d, jti guardado con
      |                        |                             |    source:"telegram_miniapp" (9125-9147) -->| refresh_tokens
      |                        |<-- 200 {status:"active", access_token, refresh_token, user,
      |                        |        active_workspace, available_workspaces, device_link} (9148-9158)
      |                        | 9. guarda sesión (app.js:67-71) y llama API con
      |                        |    Authorization: Bearer (app.js:138-147; get_current_user auth.py:86-106)
```

### 4.2 Qué existe y qué falta

| Pieza | Estado | Referencia |
|---|---|---|
| Validación HMAC initData con bot token | ✅ EXISTE | `server.py:7680-7710` |
| Emisión de sesión MiniApp (access + refresh) | ✅ EXISTE — **no crear `POST /api/telegram-miniapp/auth`**; la convención ya es `POST /api/telegram-miniapp/session` | `server.py:9096-9158` |
| Resolución usuario ← device link activo por `telegram.user_id` | ✅ EXISTE | `server.py:9104-9108` |
| Onboarding de vinculación (QR/deep link + `/start` + contacto telefónico) | ✅ EXISTE | `server.py:8582-8695`, `7774-7841`, `7757-7771` |
| Refresh de sesión | ✅ EXISTE `POST /api/auth/refresh` | `server.py:4011` |
| Revocación | ✅ EXISTE `POST /api/device-links/{id}/revoke` (`server.py:8698-8711`) y `POST /api/auth/logout` (`4104`) | |
| Validación initData con el token del **bot de equipo** (multi-rol) | ❌ **NO EXISTE HOY** — `validate_telegram_webapp_init_data` solo usa `ROVI_TELEGRAM_BOT_TOKEN` (`server.py:7681-7685`), pero los device links pueden enrutar al bot de equipo (`bot_target: "team"`, `server.py:8600-8625, 8667`). Si la MiniApp se abre desde el bot de equipo, el HMAC NO valida (cada bot firma con su propio token) → 401. Requiere extender la validación para iterar sobre tokens de `telegram_agent_profiles` activos. | hallazgo F10 |

---

## 5. Contratos de handoff

Principio: **la MiniApp lee por REST y escribe por dos vías**: (a) endpoints CRUD existentes para acciones directas del humano (cambiar status, crear evento) — igual que la web; (b) el flujo auditado de agente (`telegram_agent_pending_actions` → `execute_pending_telegram_action` → `agent_action_audit`) para TODO lo que proponga el agente. Nunca se ejecuta una acción de agente sin pasar por ese ejecutor (`server.py:7147-7171`).

### 5.1 HANDOFF: MiniApp → Backend (sesión)

```
HANDOFF: MiniApp → POST /api/telegram-miniapp/session            [EXISTE: server.py:9096]
  PAYLOAD: { "init_data": string (raw initData), "start_param": string|null }   (server.py:5980-5982)
  SUCCESS (vinculado): { "status":"active", "access_token", "refresh_token", "token_type":"bearer",
                         "expires_in": int_seg, "user": {...}, "active_workspace": {...},
                         "available_workspaces": [...], "device_link": {...} }
  SUCCESS (no vinculado): { "status":"link_required", "telegram_user", "start_code", "message" }
  FAILURE: 400 initData faltante/sin hash · 401 hash inválido o auth_date > 24h ·
           403 cuenta inactiva (9118-9119) · 503 falta bot token (7686-7687)
  TIMEOUT cliente: 10s → estado offline.
  ON FAILURE 401: reintentar 1 vez tras tg.ready(); si persiste → "Abre la MiniApp desde el bot de ROVI".
```

### 5.2 HANDOFF: MiniApp → acciones de agente pendientes — **NUEVOS endpoints `/api/telegram-miniapp/*`**

Los tres son nuevos; ninguno existe hoy. Todos `Depends(get_current_user)`, y filtran SIEMPRE `user_id == current_user.user_id` y `tenant_id == active_tenant_id` (mismo dueño: nadie aprueba acciones de otro usuario).

```
HANDOFF: MiniApp → GET /api/telegram-miniapp/agent-actions?status=pending_confirmation      [NUEVO]
  Query interna: db.telegram_agent_pending_actions.find({tenant_id, user_id,
                 status:"pending_confirmation", expires_at:{$gt:now}})
                 (colección y shape: server.py:6629-6644; hermes_action_builders.py:81-96)
  SUCCESS: { "actions": [ { "id", "type", "status", "payload", "requested_text",
                            "preview": string,   // generado con format_pending_telegram_action_preview
                            "created_at", "expires_at" } ] }
  FAILURE: 401 token · ninguna otra (lista vacía es éxito).
  TIMEOUT: 10s.

HANDOFF: MiniApp → POST /api/telegram-miniapp/agent-actions/{action_id}/confirm             [NUEVO]
  PAYLOAD: {} (el id va en el path; no se permite editar el payload de la acción)
  COMPORTAMIENTO OBLIGATORIO: cargar la acción validando dueño+tenant+status=pending_confirmation+
    expires_at>now (paridad con find_recent_pending_telegram_action server.py:6495-6506) y llamar
    execute_pending_telegram_action(action) (server.py:6996-7166) — NUNCA ejecutar inline:
    ese ejecutor es el que marca executed y escribe agent_action_audit (7147-7165).
  SUCCESS: { "ok": true, "executed": true, "message": string, "record_ids": [string] }
  FAILURE: { "ok": false, "executed": false, "message": string }  // p.ej. "No encontré el lead…"
           404 acción inexistente/de otro usuario · 409 estado != pending_confirmation o expirada
  TIMEOUT: 15s. ON TIMEOUT: la UI re-consulta GET …/agent-actions (la ejecución es idempotente por
           status: una acción executed ya no es confirmable → 409, sin doble escritura).

HANDOFF: MiniApp → POST /api/telegram-miniapp/agent-actions/{action_id}/cancel              [NUEVO]
  COMPORTAMIENTO: $set {status:"cancelled", cancelled_at} + insertar agent_action_audit con
    status "cancelled" (paridad exacta con la rama de texto server.py:8358-8377).
  SUCCESS: { "ok": true, "status": "cancelled" }
  FAILURE: 404 · 409 (ya ejecutada/cancelada/expirada)
  TIMEOUT: 10s.
```

### 5.3 HANDOFF: MiniApp → Chat agente

```
HANDOFF: MiniApp → POST /api/ai-agent/run                       [EXISTE: agent_control.py:4370-4374]
  PAYLOAD: { "message": string, "include_context": true }       (role_scope NO se manda: lo resuelve
            el backend del JWT, agent_control.py:2213-2215; routing_rules.json:43-46)
  SUCCESS: { "success", "run_id", "response", "tools_executed": [...], "run", "usage", "config" }
            (agent_control.py:2400-2410)
  Escrituras dentro del run: vía _queue_or_execute_write (agent_control.py:1527-1576):
    - autopilot (skill crm_remote_control activa) → ejecuta con execute_pending_telegram_action
      registrado (server.py:7169-7171) → mismo audit.
    - sin autopilot → acción pending_confirmation + action_id devuelto en el resultado de la tool
      → la UI la resuelve con §5.2.
  FAILURE: 400 mensaje vacío · 422 role_scope inválido · 5xx proveedor LLM (run guardado success=false).
  TIMEOUT: 60s.
```

### 5.4 HANDOFF: MiniApp → CRUD directo (acciones del humano, no del agente)

Estas son las mismas rutas que usa la web; el humano que toca un botón explícito en su propia UI no necesita preview de confirmación de agente (el flujo auditado de agente aplica a acciones *propuestas por el agente*). Contratos existentes:

```
PUT /api/leads/{lead_id}            body LeadUpdate (models.py:319-351)        → 200 {"message"} | 404 | 400
                                    (server.py:13162-13246; emite WS lead_updated 13233)
POST /api/leads                     body LeadCreate (models.py:288-317; phone requerido) → 200 {id} | 400 duplicado
                                    (server.py:13096-13160; dedup validate_lead_unique_fields leads_improvements.py:20-57)
POST /api/calendar/events           body CalendarEventCreate (models.py:1199-1207) → {id, synced_to_google}
PUT /api/tasks/{task_id}/status     body {"status": TaskStatus} (tasks.py:296-306; estados models.py:413-418)
PUT /api/leads/{id} (interés)       {"interested_product_ids": [...]} (models.py:339)
```

**Restricción de paridad de scope (obligatoria para implementación):** mientras `GET /api/leads` y `PUT /api/leads/{id}` no apliquen scope broker (F3), el backend de los endpoints nuevos `/api/telegram-miniapp/*` que listen/agreguen datos para broker DEBE replicar `scoped_entity_query` (`agent_control.py:1507-1520`). Alternativa recomendada (Backend Architect decide): agregar el filtro broker directamente en los endpoints REST según `active_role`.

### 5.5 HANDOFF: Bot Telegram ↔ MiniApp (cola compartida)

No hay llamada directa: ambos convergen en MongoDB.
- El bot crea acciones (`build_pending_telegram_action_from_text`, `server.py:6840-6891`) y jobs multimodales (`build_agent_interpretation_job_doc`, `agent_media_pipeline.py:261-312`).
- La MiniApp las ve por `GET /api/telegram-miniapp/agent-actions` y las resuelve por §5.2 → el resultado es visible para el bot (audit + status).
- Inverso: una acción creada en la MiniApp vía `/api/ai-agent/run` también puede confirmarse respondiendo "sí" en el bot **solo si** tiene `link_id`/`chat_id` (el matcher del bot filtra por ambos, `server.py:6497-6503`); las creadas desde MiniApp con `channel_context` nulo (`agent_control.py:1546-1547`) solo se resuelven en MiniApp. Documentar esto en UI ("apruébalo aquí").

---

## 6. Estados observables y errores

### 6.1 Token expirado
- Access token dura 24h (`auth.py:18-25`); cualquier 401 con `detail "Token inválido o expirado"` (`auth.py:79-84`):
  1. Intentar `POST /api/auth/refresh` con el refresh token (7 días, single-use: `used` marca reutilización, `auth.py:167-172`).
  2. Si falla → re-bootstrap silencioso con `POST /api/telegram-miniapp/session` (el `initData` se re-firma cada apertura; ventana 24h `server.py:7702-7704`).
  3. Si también falla → pantalla "Sesión expirada. Cierra y vuelve a abrir la MiniApp desde el bot".
- Observable: refresh tokens de MiniApp identificables en DB por `source: "telegram_miniapp"` (`server.py:9139`).

### 6.2 Device link no vinculado (onboarding)
La respuesta `{status: "link_required"}` (`server.py:9109-9115`) dispara la pantalla de onboarding:
```
PASO 1: "Tu Telegram aún no está vinculado a ROVI."
  RAMA A (vino con start_param=CODE — QR generado en /ai-agents de la web):
    CTA "Vincular ahora" → tg.sendData({type:'rovi_device_link_start', code, …}) (patrón ya
    implementado app.js:129-132) o instrucción "Mándale /start al bot": el handler
    handle_rovi_telegram_start (server.py:7774-7841) procesa el código.
  RAMA B (sin código): instrucciones "Entra a ROVI web → Agentes IA → genera tu QR"
    (POST /api/device-links/telegram/qr-session requiere sesión web, server.py:8582).
PASO 2 (estados del link, server.py:7788-7833):
  link_not_found → "Código inválido, genera un QR nuevo."
  revoked        → "Este vínculo fue revocado."
  expired        → "El QR expiró (TTL 1-60 min, server.py:8589). Genera uno nuevo."
  awaiting_contact → el bot pide compartir teléfono (send_rovi_telegram_contact_request,
                   server.py:7757-7771) y valida contra el del CRM (phones_match,
                   hermes_bridge.py:29-36) → la MiniApp muestra "Confirma tu teléfono en el chat del bot".
PASO 3: al activarse (activate_hermes_device_link server.py:7713-7754: status active, perfil Hermes
  escrito, links Telegram previos revocados 7724-7739), el usuario regresa/reabre la MiniApp →
  el bootstrap ahora devuelve status active.
POLLING: mientras está en onboarding, reintentar POST /api/telegram-miniapp/session cada 5s, máx 24
  intentos (2 min), luego botón manual "Ya vinculé".
```
- Observable cliente: pasos del wizard. Observable operador: `user_device_links.status` (`pending → scanned/awaiting_contact → active`), visible en Agent Studio (`server.py:5450-5475`).

### 6.3 Sin permisos por scope
- 403 de `require_sales_crm_user` ("Modulo disponible solo para broker e inmobiliaria", `tasks.py:60-69`) → no debería ocurrir para roles MVP; si ocurre: "Tu rol no tiene acceso a este módulo".
- Pestaña Equipo: oculta para broker (decisión UI; backend hoy no la protege — F8).
- 404 en tareas/eventos por filtro de visibilidad (`tasks.py:88-92`, `server.py:15730`) → tratar como "no visible para tu rol", no como error técnico.
- Tarjetas de acción de otro usuario: jamás se muestran (filtro `user_id` en §5.2).

### 6.4 Offline / red
- Sin `window.Telegram.WebApp` (apertura en navegador normal): modo lectura demo actual ("Vista web", `app.js:94-97`) o mensaje "Abre esta app desde Telegram". MVP: mensaje, sin modo demo.
- Fetch fallido / timeout: banner global "Sin conexión con ROVI" + botón Reintentar; las pantallas conservan el último dato cargado en memoria. NO se encolan escrituras offline en MVP (riesgo de doble ejecución contra la cola de acciones).
- LLM caído (chat/meeting prep): el resto de la MiniApp sigue funcionando (REST no depende del LLM); mostrar "El agente no está disponible, puedes seguir usando tus datos".

---

## 7. Riesgos, hallazgos y preguntas abiertas

### Hallazgos verificados contra código (cambian el plan original)

| # | Hallazgo | Evidencia | Impacto / acción |
|---|---|---|---|
| F1 | El endpoint de auth MiniApp YA existe; no crear `POST /api/telegram-miniapp/auth` | `server.py:9096-9158` | Reusar `POST /api/telegram-miniapp/session`; la convención de naming queda `telegram-miniapp/*` para sesión y `miniapp/*` solo para los endpoints nuevos de acciones (o unificar — Q1) |
| F2 | Los perfiles de rol del repo (`backend/agent_knowledge/`) difieren de los de SoftvibesLab (repo = más nuevos: broker con `change_stage_own`, `import_autopilot_own`, media, autopilot) | diff `backend/agent_knowledge/broker.json:15-22` vs copia externa | La matriz §2 usa el repo. Sincronizar la carpeta externa o declararla obsoleta |
| F3 | **La API REST no aplica scope broker**: `GET /api/leads` filtra solo `tenant_id` (`leads_improvements.py:83`) y `PUT /api/leads/{id}` solo valida tenant (`server.py:13168-13171`). El scope `own_or_assigned_only` del broker solo existe en rutas de agente (`agent_control.py:1507-1520`, `hermes_crud_extensions.py:383-409`) | citado | En tenant agencia, un broker ve/edita leads ajenos vía REST. La MiniApp lo mitiga en UI, pero el cierre es backend. **Security/Backend: decidir si se agrega filtro por `active_role` en REST (recomendado) antes del MVP** |
| F4 | `GET /api/leads` no excluye `deleted: true` (soft delete `leads_improvements.py:174-183`) | `leads_improvements.py:83` | La MiniApp filtra en cliente; bug a corregir en backend |
| F5 | Eventos de calendario son por `user_id` (`server.py:15662, 15803`); el `events: tenant_all` declarado para agency_admin (`agency_admin.json:9`) NO es implementable con la REST actual | citado | MVP: el admin ve solo su agenda. "Agenda del equipo" requiere endpoint nuevo (Q2) |
| F6 | No existe endpoint REST para listar/confirmar/cancelar acciones `pending_confirmation`; la confirmación es solo texto Telegram (`server.py:8396-8427`) o autopilot | grep sin rutas; solo audit admin `server.py:5480-5515` | Los 3 endpoints `/api/telegram-miniapp/agent-actions*` (§5.2) son el único desarrollo backend imprescindible del MVP |
| F7 | No existe endpoint de "property match"; el matching es skill de agente (tool `buscar_propiedades`) | §3.4 | Match vía `POST /api/ai-agent/run` + pre-filtro local |
| F8 | Leaderboard y agency-executive no tienen gate de rol (cualquier usuario del tenant los llama) | `server.py:12756, 12352` | UI oculta para broker; backend debería exigir manager/admin |
| F9 | `get_leaderboard` usa `get_or_create_tenant(user_id)` en vez de `active_tenant_id` | `server.py:12758` | Con workspaces conmutados puede mostrar el tenant equivocado; preferir `dashboard/agency-executive.team_performance` (usa `active_tenant_id`, `server.py:12354`) |
| F10 | La validación de `initData` solo usa el token del bot primario (`server.py:7681-7685`), pero hay device links enrutados a bots de equipo multi-rol (`server.py:8600-8625`) con token propio. MiniApp abierta desde un bot de equipo → HMAC falla → 401 | citado | Extender `validate_telegram_webapp_init_data` para probar tokens de `telegram_agent_profiles` activos, o publicar la MiniApp solo en el bot primario (Q3) |
| F11 | La cola de acciones es compartida bot↔MiniApp, pero el matcher del bot exige `link_id + chat_id` (`server.py:6497-6503`); acciones creadas desde MiniApp sin `channel_context` no son confirmables por texto en el bot | `agent_control.py:1546-1547` | Aceptable en MVP; documentar en UI |
| F12 | Autopilot: con la skill `crm_remote_control` activa, creates/updates del agente se ejecutan SIN confirmación (`agent_control.py:1502-1505, 1540`); deletes siempre confirman (`server.py:8438`; `agent_media_pipeline.py:308`) | citado | La UI debe reflejar ambos modos (chip "Guardado" vs tarjeta Aprobar/Rechazar) |
| F13 | La MiniApp actual (`frontend/public/miniapp/app.js`) es demo-first (localStorage, propiedades DEMO `app.js:10-14`); lo reutilizable real: bootstrap de sesión (109-136), apiFetch con Bearer (138-147), búsqueda de leads (438-451), patrón sendData/clipboard/haptics (485-501) y el shell de tabs/estilos | citado | Plan: conservar shell + sesión; reemplazar datos demo por las pantallas §3 |

### Preguntas abiertas (requieren decisión)

- **Q1 — Naming**: ¿consolidamos los endpoints nuevos bajo `/api/telegram-miniapp/*` (convención existente) o `/api/telegram-miniapp/*`? La spec propone `/api/telegram-miniapp/agent-actions*`; es cosmético pero hay que fijarlo antes de implementar.
- **Q2 — Agenda de equipo (agency_admin)**: ¿se acepta "solo mi agenda" en MVP, o se crea `GET /api/telegram-miniapp/team-events` (query tenant-wide sobre `calendar_events`) para honrar `events: tenant_all`?
- **Q3 — Bot de publicación**: ¿la MiniApp se publica solo en el bot primario (`ROVI_TELEGRAM_BOT_USERNAME`, default `rovigodmode_bot`, `hermes_bridge.py:83-91`) o también en bots de equipo? Si es lo segundo, F10 es bloqueante.
- **Q4 — Cierre de scope broker en REST (F3/F4/F8)**: ¿se corrige backend antes del MVP (recomendado por seguridad) o la Fase 0 sale con mitigación solo-UI? Decisión con Security Engineer.
- **Q5 — Historial de chat**: ¿persistimos el chat MiniApp (nuevo endpoint de lectura sobre `agent_runs`/`telegram_agent_messages` del propio usuario) o es efímero por sesión?
- **Q6 — Bandeja de revisión multimodal**: ¿la MiniApp expone los `agent_interpretation_jobs` con `mapping_status: needs_review` (`agent_media_pipeline.py:306`) para aprobar/corregir desde el teléfono? Hoy solo el audit admin los lista (`server.py:5496-5499`). Propuesto para Fase 1.
- **Q7 — Autopilot por defecto**: ¿qué perfiles MVP llevan la skill `crm_remote_control` activa? Define cuántas tarjetas de confirmación verá el usuario (UX radicalmente distinta).
- **Q8 — Workspace switching**: la sesión MiniApp fija el workspace del device link (`server.py:9123`). ¿Se necesita selector de workspace en MiniApp para usuarios multi-workspace, reutilizando `POST /api/auth/switch-workspace` (`server.py:3977`)?

### Supuestos

| # | Supuesto | Verificado | Riesgo si es falso |
|---|---|---|---|
| A1 | La MiniApp se sirve detrás del mismo nginx que `/api` (paths relativos funcionan) | Parcial: CLAUDE.md ("Telegram MiniApp servida desde el contenedor frontend bajo `/miniapp/`") + fetches relativos en `app.js:115, 440` | CORS/host distinto rompería el fetch de sesión |
| A2 | `POST /api/ai-agent/run` está habilitado para cualquier usuario autenticado broker/agency_admin (no owner-only) | Sí: solo `Depends(get_current_user)` (`agent_control.py:4370-4374`); el owner-only aplica a `/ai-control/*` | El chat agente del MVP no funcionaría sin un endpoint nuevo |
| A3 | `BotFather` permitirá registrar la URL `/miniapp/` como Web App del bot primario | No verificable en código | Cambiaría el canal de distribución |
| A4 | Los `tools_executed` del run incluyen el `action_id` de acciones pendientes para pintar la tarjeta sin re-fetch | Parcial: `_queue_or_execute_write` devuelve `action_id` (`agent_control.py:1569-1576`) y `tools_executed` viaja en la respuesta (`agent_control.py:2406`); validar shape exacto en implementación | La UI siempre puede caer al `GET /api/telegram-miniapp/agent-actions` (§5.2) |

---

## Apéndice A — Inventario de endpoints del MVP

**Reutilizados (existen):**
`POST /api/telegram-miniapp/session` · `POST /api/auth/refresh` · `GET/POST/PUT /api/leads*` · `GET/POST/PUT /api/tasks*` (+`/status`) · `GET/POST/PUT/DELETE /api/calendar/events*` · `GET /api/calendar/today` · `GET /api/products*` · `GET /api/dashboard/stats|broker-performance-overview|leaderboard|agency-executive` · `POST /api/ai-agent/run` · `GET /api/ai-agent/config` · `GET /api/device-links` · `POST /api/device-links/{id}/revoke`

**Nuevos (a construir):**
1. `GET /api/telegram-miniapp/agent-actions` (lista pendientes del usuario)
2. `POST /api/telegram-miniapp/agent-actions/{id}/confirm` (ejecuta vía `execute_pending_telegram_action`)
3. `POST /api/telegram-miniapp/agent-actions/{id}/cancel`
4. (Condicional Q2) `GET /api/telegram-miniapp/team-events`
5. (Condicional F10) extensión multi-token de `validate_telegram_webapp_init_data`

## Apéndice B — Casos de prueba derivados

| Test | Disparador | Esperado |
|---|---|---|
| TC-01 | initData válido + link activo | `status:active`, JWT con `active_tenant_id` del link |
| TC-02 | initData válido sin link | `status:link_required` + onboarding |
| TC-03 | initData con hash alterado | 401 (`server.py:7699-7700`) |
| TC-04 | initData con `auth_date` > 24h | 401 (`server.py:7702-7704`) |
| TC-05 | Broker cambia status de lead propio | 200 + WS `lead_updated` |
| TC-06 | Broker intenta abrir lead ajeno (tenant agencia) | UI lo oculta; documenta F3 (backend hoy respondería 200) |
| TC-07 | Confirmar acción pendiente vigente | `executed:true`, audit insertado, status `executed` |
| TC-08 | Confirmar acción expirada (>30 min) | 409, sin escritura |
| TC-09 | Confirmar dos veces la misma acción | 2ª llamada 409 (status ya `executed`) |
| TC-10 | Cancelar acción pendiente | status `cancelled` + audit `cancelled` |
| TC-11 | Chat con autopilot activo crea lead | sin tarjeta; chip "Guardado" + `record_ids` |
| TC-12 | Chat pide eliminar lead | siempre tarjeta de confirmación (nunca autoejecución de `delete_*`) |
| TC-13 | Broker abre pestaña Equipo | no visible (UI); backend pendiente F8 |
| TC-14 | Admin abre Equipo en tenant sin brokers | estado vacío con CTA |
| TC-15 | Token expirado a mitad de sesión | refresh silencioso → si falla, re-session → si falla, pantalla expirada |
| TC-16 | MiniApp abierta fuera de Telegram | mensaje "Abre desde Telegram", sin crash |
