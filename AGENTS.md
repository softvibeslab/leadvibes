# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

**Rovi** (formerly LeadVibes) is a Mexican real estate CRM for high-value property sales in Tulum. It supports both individual brokers and agencies with gamification, lead management, campaigns, and AI-powered insights.

## Tech Stack

- **Backend**: FastAPI + MongoDB (Motor async driver) + JWT auth
- **Frontend**: React 19 + Tailwind CSS + shadcn/ui + @dnd-kit (drag-and-drop)
- **Integrations**: OpenAI (via emergentintegrations), VAPI (AI calls), Twilio (SMS), SendGrid (email), Google Calendar (OAuth2)
- **Deployment**: Docker Compose with Nginx for frontend

## Development Commands

### Backend
```bash
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
yarn start    # Development (uses craco)
yarn build    # Production build
yarn test     # Run tests
```

### Docker
```bash
# Local con puertos alternativos (evita 3000/8000/27017 ocupados):
cp docker-local.sample .env   # ajusta FRONTEND_HOST_PORT / BACKEND_HOST_PORT / MONGO_HOST_PORT si hace falta
docker compose up -d --build
# UI http://localhost:13000 · API http://localhost:18080/api/health (valores por defecto en docker-local.sample)

./scripts/docker-local-up.sh          # mismo flujo automatizado

docker compose -f docker-compose.dev.yml up -d       # Development environment
docker compose -f docker-compose.preview.yml up -d   # Preview environment
docker compose -f docker-compose.hostinger.yml up -d # Production (Hostinger deployment)
docker compose down -v                  # Stop and remove volumes
docker compose logs -f [service]        # Tail logs for a service
```
Ver [docs/DOCKER_LOCAL.md](docs/DOCKER_LOCAL.md) para detalle.

**Docker services:**
- `mongodb` - MongoDB 7 with persistent volume
- `backend` - FastAPI (Python 3.11, uvicorn)
- `frontend` - React build served via nginx

**Multi-environment deployment:**
- Production: `srv1318804.hstgr.cloud` (ports: 8000, 3000)
- Development: `dev.srv1318804.hstgr.cloud` (ports: 8100, 3100)
- Preview: `preview.srv1318804.hstgr.cloud` (ports: 8200, 3200)

See `docs/DEPLOYMENT_URLS.md` for complete deployment reference.

### Backend Testing
```bash
cd backend
pytest                                          # Unit + smoke (default: excludes integration)
pytest -m integration                           # Solo tests contra API remota (requests)
pytest tests/test_leadvibes_crm.py             # Core API tests (integration)
pytest tests/test_import_leads.py              # Import feature tests (integration)
pytest tests/test_google_calendar_email_templates.py  # Calendar/email tests (integration)
```

**Test configuration:**
- Por defecto se excluyen tests `@pytest.mark.integration` (ver `backend/pytest.ini`).
- Tests de integración usan `requests` contra un backend en ejecución; define `REACT_APP_BACKEND_URL`.
- Smoke y unit (`test_api_smoke.py`, `test_auth_unit.py`) usan `TestClient` y no requieren Mongo para `/api/health`.

### Backend Linting & Formatting
```bash
cd backend
black .                        # Format code
flake8 .                       # Lint code
isort .                        # Sort imports
mypy .                         # Type checking
```

### Frontend Linting
```bash
cd frontend
yarn lint                      # Run ESLint (configured via craco)
```

## Architecture

### Backend Structure (`backend/`)
- `server.py` - Main FastAPI app with all `/api/*` routes
- `models.py` - Pydantic models for all entities (User, Lead, Campaign, EmailTemplate, etc.)
- `auth.py` - JWT authentication, password hashing, user dependency injection
- `ai_service.py` - OpenAI integration for chat and lead analysis
- `seed_data.py` - Default gamification rules, scripts, and seed data

**Key API patterns:**
- All routes use `/api` prefix via `api_router`
- Auth required via `Depends(get_current_user)` decorator
- Multi-tenancy via `tenant_id` (derived from user_id)
- MongoDB queries use Motor's async API (`await db.collection.find_one()`)

**Health check endpoints:**
- Backend: `GET /api/health` - Returns `{"status": "healthy"}`
- Frontend (nginx): Serves on port 80 in production, 3000 in development

### Frontend Structure (`frontend/src/`)
- `App.js` - React Router with public/protected routes
- `context/AuthContext.js` - JWT auth, axios instance with interceptors
- `context/ThemeContext.js` - Light/dark mode
- `pages/` - Main page components (Dashboard, Leads, Campaigns, etc.)
- `components/ui/` - shadcn/ui components
- `lib/utils.js` - Utility functions
- `craco.config.js` - Webpack configuration with custom plugins (visual edits, health checks)

**Key patterns:**
- Protected routes use `<ProtectedRoute>` wrapper
- API calls through `api` from AuthContext (auto-includes auth header)
- `account_type` on user determines UI (individual vs agency)
- Production builds use multi-stage Docker with nginx (`frontend/nginx.conf`)
- Path alias `@/` maps to `src/` directory

### Multi-Tenancy & User Types

**Account Types:**
- `individual` - Single broker, simplified UI (no leaderboards/team views)
- `agency` - Multiple brokers, full features including leaderboards and gamification

**Tenant Isolation:** Each user gets a `tenant_id = f"tenant-{user_id[:8]}"`. All queries filter by `tenant_id` to ensure data isolation.

### Lead Pipeline

**Status flow:** nuevo → contactado → calificacion → presentacion → apartado → venta/perdido

**Features:**
- Kanban board with drag-and-drop (@dnd-kit)
- Table view with sortable columns
- Dynamic filters (status, priority, source)
- AI analysis per lead (intent score, sentiment, next action)

### Campaigns Module

Three campaign types with separate integrations:
1. **Calls** - VAPI AI Voice API for automated phone calls
2. **SMS** - Twilio for bulk SMS
3. **Email** - SendGrid with templates, open/click tracking

### Google Calendar Integration

- OAuth2 flow configured in Settings > Integrations
- Tokens stored in `IntegrationSettings.google_tokens`
- Events can sync bidirectionally (`google_event_id`, `synced_from_google` fields)
- Routes: `/api/oauth/google/*`, `/api/google-calendar/events`

### Email Template Editor

- Visual drag-and-drop editor at `/email-templates/new`
- Block types: text, image, button, divider, columns
- Templates stored with `json_content` (visual structure) and `html_content` (generated)
- Variable support: `{{nombre}}`, `{{propiedad}}`, etc.

### Lead Import

- Multi-step wizard: Upload → Map columns → Preview → Import
- Supports CSV/XLSX with auto column detection
- Duplicate detection by email or phone
- Compatible with GHL, HubSpot, Pipedrive exports

## Environment Variables

**Backend (`.env`):**
```
MONGO_URL=mongodb://...
DB_NAME=rovi_crm
JWT_SECRET=...
EMERGENT_LLM_KEY=...          # OpenAI/emergentintegrations
CORS_ORIGINS=http://localhost:3000
```

**Frontend (`.env`):**
```
REACT_APP_BACKEND_URL=http://localhost:8000
```

## Design System (Tulum Luxury Palette)

Defined in `frontend/src/index.css` as CSS variables (hsl format):
- Primary: #0D9488 (Turquesa)
- Secondary: #4D7C0F (Verde Jungla)
- Accent: #D97706 (Dorado)
- Background: #E7E5E4 (Beige Arena)

Theme toggles between light/dark via `next-themes`.

## Important Notes

- **AI Service**: Falls back gracefully if `emergentintegrations` package is unavailable (not in PyPI)
- **CORS**: Backend must allow frontend origin for cross-origin requests
- **Docker volumes**: `mongodb_data` and `backend_uploads` persist across container restarts
- **Health checks**: Both containers have healthcheck endpoints for orchestration
- **Testing**: Tests use `requests` library directly against a running backend server (not pytest-asyncio or FastAPI TestClient)
- **Frontend build**: Uses craco for custom webpack configuration; visual edits plugins only load in development mode
- **CI/CD**: GitHub Actions workflows deploy to 3 environments (main→production, dev→development, rovi_deploy→preview)
- **Server setup**: Run `deploy/setup-server.sh` on the VPS to configure nginx, docker, and subdomains
