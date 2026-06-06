# Architecture

## Vista General

Rovi es una aplicacion full-stack:

- Backend: FastAPI, Motor async, MongoDB, JWT, Pydantic.
- Frontend: React 19, React Router, Tailwind CSS, shadcn/ui, lucide-react.
- Integraciones: OpenAI/emergentintegrations, VAPI, Twilio, SendGrid, Google Calendar, Telegram/Hermes, Apify/scraper.
- Deploy: Docker Compose, nginx, Hostinger VPS, tres entornos.

## Backend

El backend principal vive en `backend/server.py`. La app monta un `APIRouter(prefix="/api")`, por lo que las rutas reales empiezan con `/api`.

Archivos base:

- `backend/server.py`: conexion Mongo, helpers, auth routes, CRM routes, COPIM routes, integraciones, imports, automations, webhooks e inclusion de routers modulares.
- `backend/models.py`: Pydantic models, enums, entidades CRM, COPIM, tenancy, comunicaciones, importador y automatizaciones.
- `backend/auth.py`: JWT, refresh token, password hashing, `get_current_user`, `require_role`.
- `backend/ai_service.py`: chat, analisis de leads, scripts y consultas asistidas.
- `backend/websocket_manager.py`: eventos realtime por tenant.

Routers modulares incluidos al final de `server.py`:

- `create_marketplace_router(db, analyze_lead)` -> `/api/marketplace/*`
- `create_rovi_internal_router(db)` -> `/api/rovi-internal/*`
- `create_agent_control_router(db)` -> `/api/ai-control/*`, `/api/ai-agent/*`, `/api/strategy-playground/*`
- `create_vibe_lab_router(db)` -> `/api/vibe-lab/*`
- `create_rentals_router(db)` -> `/api/rentals/*`
- `create_tasks_router(db)` -> `/api/tasks/*`
- `create_copim_member_import_router(...)` -> `/api/copim/import/members/*`

## Frontend

Archivos base:

- `frontend/src/App.js`: rutas, redirects y guards por workspace.
- `frontend/src/context/AuthContext.js`: cliente axios, JWT, refresh token, storage, `switchWorkspace`, `appMode`.
- `frontend/src/components/Sidebar.js`: menu segun `account_type`, rol y workspace.
- `frontend/src/lib/copimAccess.js`: resolucion de permisos y home autenticado.
- `frontend/src/components/ui/*`: shadcn/ui.

Las llamadas API deben usar `api` desde `useAuth()`:

```javascript
const { api } = useAuth();
const response = await api.get('/leads');
```

El `baseURL` real es `${REACT_APP_BACKEND_URL}/api` o `/api` si no hay variable.

## Datos Y Multi-Tenancy

Rovi usa `tenant_id` para aislar datos. En el JWT tambien viajan:

- `active_tenant_id`
- `active_membership_id`
- `active_role`
- `account_type`

Regla: toda operacion que lea o escriba datos de negocio debe usar el tenant activo, no un tenant inventado desde el cliente.

## Workspaces Y Roles

Tipos de tenant relevantes:

- `individual`
- `agency`
- `property_management`
- `copim`
- `association`
- `council`
- `rovi_internal`

Roles relevantes:

- CRM: `owner`, `admin`, `manager`, `broker`
- Property management: `property_manager`
- COPIM: `copim_admin`, `copim_operator`, `copim_member`
- ROVI interno: `rovi_admin`, `rovi_sales`, `rovi_marketing`, `rovi_customer_success`, `rovi_ops`

## Riesgos Arquitectonicos

- `backend/server.py` es muy grande; cada cambio ahi debe ser pequeno y muy localizado.
- Hay rutas por workspace que comparten pantalla o backend; validar redirects en `App.js` y `Sidebar.js`.
- Integraciones externas pueden no existir en local; no asumir llaves disponibles.
- Algunas features dependen de archivos preview/golden y usuarios seed.

