# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Rovi** (formerly LeadVibes) is a Mexican real estate CRM for high-value property sales in Tulum. It supports individual brokers, agencies, property managers (rentals), the COPIM association network, and Rovi's internal operations team. Core features: lead management, campaigns, gamification, AI-powered insights, and conversational AI agents reachable via Telegram/WhatsApp (the "Hermes" system).

Note: `AGENTS.md` is a near-mirror of this file for Codex; keep both in sync when updating.

## Tech Stack

- **Backend**: FastAPI + MongoDB (Motor async driver) + JWT auth
- **Frontend**: React 19 + react-router-dom 7 + Tailwind CSS + shadcn/ui (Radix) + @dnd-kit + craco
- **AI**: Configurable LLM provider via `ROVI_AI_*` env vars (OpenAI by default, z.ai/GLM supported); legacy `emergentintegrations` fallback in `ai_service.py`
- **Messaging agents**: Telegram bots (webhooks), WhatsApp via OpenWA
- **Other integrations**: VAPI (AI calls), Twilio (SMS), SendGrid (email), Google Calendar (OAuth2), Pentaract (optional media storage)
- **Deployment**: Docker Compose with nginx for frontend; GitHub Actions → ghcr.io → Hostinger VPS

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
yarn test     # Unit tests (craco test)
yarn lint     # ESLint
yarn test:e2e          # Playwright E2E tests
yarn test:e2e:ui       # Playwright UI mode
yarn test:e2e:debug    # Playwright debug mode
```

### Docker
```bash
# Local con puertos alternativos (evita 3000/8000/27017 ocupados):
cp docker-local.sample .env   # ajusta FRONTEND_HOST_PORT / BACKEND_HOST_PORT / MONGO_HOST_PORT si hace falta
docker compose up -d --build
# UI http://localhost:13000 · API http://localhost:18080/api/health (valores por defecto en docker-local.sample)

./scripts/docker-local-up.sh          # mismo flujo automatizado

docker compose -f docker-compose.dev.yml up -d       # Development environment (ports 8100/3100)
docker compose -f docker-compose.preview.yml up -d   # Preview environment (ports 8200/3200)
docker compose -f docker-compose.hostinger.yml up -d # Production (Hostinger deployment)
docker compose -f docker-compose.agent.yml up -d     # Isolated AI-agent feature testing (ports 8001/3001, Mongo 27018)
docker compose down -v                  # Stop and remove volumes
docker compose logs -f [service]        # Tail logs for a service
```
Ver [docs/DOCKER_LOCAL.md](docs/DOCKER_LOCAL.md) para detalle.

**Docker services:** `mongodb` (MongoDB 7, persistent volume), `backend` (FastAPI, Python 3.11), `frontend` (React build via nginx).

**Multi-environment deployment:**
- Production: `srv1318804.hstgr.cloud` (ports: 8000, 3000) ← branch `main`
- Development: `dev.srv1318804.hstgr.cloud` (ports: 8100, 3100) ← branch `dev`
- Preview: `preview.srv1318804.hstgr.cloud` (ports: 8200, 3200) ← branch `rovi_deploy`

See `docs/DEPLOYMENT_URLS.md` for complete deployment reference.

### Backend Testing
```bash
cd backend
pytest                                          # Unit + smoke (default: excludes integration)
pytest -m integration                           # Solo tests contra API remota (requests)
pytest tests/test_hermes_scope_unit.py          # Hermes role-scope unit tests
pytest tests/test_agent_media_pipeline.py       # Multimodal pipeline unit tests
pytest tests/test_leadvibes_crm.py              # Core API tests (integration)
pytest tests/test_import_leads.py               # Import feature tests (integration)
```

**Test configuration:**
- Por defecto se excluyen tests `@pytest.mark.integration` (ver `backend/pytest.ini`).
- Tests de integración usan `requests` contra un backend en ejecución; define `REACT_APP_BACKEND_URL`.
- Unit tests (`test_auth_unit.py`, `test_hermes_scope_unit.py`, `test_openwa_integration_unit.py`, `test_vibe_lab_unit.py`, `test_agent_media_pipeline.py`) y smoke (`test_api_smoke.py`) usan `TestClient` y no requieren Mongo para `/api/health`.

### Backend Linting & Formatting
```bash
cd backend
black . && isort . && flake8 . && mypy .
```

## Architecture

### Backend Structure (`backend/`)

`server.py` is a ~21k-line monolith holding the main `api_router` (prefix `/api`) plus auth, leads, campaigns, properties, Media Hub, Agent Studio, device links, and Telegram/Hermes webhook endpoints. Feature modules register sub-routers included at the bottom of `server.py`:

| Module | Route prefix (under `/api`) | Purpose |
|---|---|---|
| `marketplace.py` | `/marketplace` | Property marketplace, lead capture from listings |
| `rentals.py` | `/rentals` | Property management: listings, tenants, payments, maintenance |
| `vibe_lab.py` | `/vibe-lab` | AI marketing lab: campaign generation, A/B testing, creative scoring |
| `rovi_internal.py` | `/rovi-internal` | Rovi's internal ops: sales CRM, partner metrics |
| `agent_control.py` | `/ai-control/*` | AI Control Tower: agent profiles, skills, knowledge bases (owner-only) |
| `tasks.py` | `/tasks` | Task CRUD and assignments |
| `openwa_integration.py` | `/whatsapp/openwa` | WhatsApp agent integration via OpenWA |
| `copim_member_import.py` | `/copim/import/members` | Bulk COPIM member CSV import |
| `module_tracker.py` | — | Feature/module readiness tracking |

Supporting modules: `models.py` (Pydantic schemas), `auth.py` (JWT, `get_current_user`), `ai_service.py` (LLM calls), `websocket_manager.py` (per-tenant real-time updates), `seed_data.py` (gamification rules, scripts).

**Key API patterns:**
- All routes use `/api` prefix via `api_router`
- Auth required via `Depends(get_current_user)`
- Multi-tenancy via `tenant_id` — all queries filter by it
- MongoDB queries use Motor's async API (`await db.collection.find_one()`)
- Health check: `GET /api/health` returns `{"status": "healthy"}` (no Mongo required)

### Hermes Agent System (Telegram/WhatsApp AI agents)

Conversational agents that let CRM users operate leads/properties/tasks from Telegram:

- `hermes_bridge.py` — Resolves user role → Hermes `role_scope` (broker, agency_admin, rentals, copim_member, rovi_orchestrator, growth_partner…); generates per-user profile files (`.env.rovi`, `rovi_user_profile.json`) under `ROVI_HERMES_PROFILES_ROOT`
- `hermes_action_builders.py` — Builds CRUD actions queued as `pending_confirmation` or `ready_to_execute`
- `hermes_crud_extensions.py` — Text extraction (status/priority/price/date filters), entity matching, visibility scope enforcement
- `agent_media_pipeline.py` — Multimodal interpretation: classifies incoming media (audio→STT, image→OCR, video→keyframes, files, URLs), detects intent (lead/property/task/event/campaign/knowledge), and creates an `agent_interpretation_job` doc **before** any processing. Autopilot execution allowed only when confidence ≥ 0.6 and intent is not knowledge-type; otherwise routed to human review
- Telegram webhooks: `/api/telegram/rovi-agent/webhook/{secret}` and `/api/telegram/webhook/{profile_id}/{secret}`; pairing via device links (`/api/device-links/*`)
- Media ingested by agents lands in the **Media Hub** (`media_assets` collection; local `/backend/uploads/` or Pentaract storage per `ROVI_MEDIA_STORAGE_PROVIDER`)

### Frontend Structure (`frontend/src/`)
- `App.js` - React Router with public/protected routes and role-based route guards
- `context/AuthContext.js` - JWT auth, axios instance with interceptors, workspace switching
- `context/ThemeContext.js` - Light/dark mode
- `hooks/useWebSocket.js` - Real-time updates from backend WebSocket
- `pages/` - Page components; `Copim*Page.js` files form the COPIM portal
- `components/ui/` - shadcn/ui components
- `lib/copimAccess.js` - COPIM role/access helpers
- `craco.config.js` - Webpack config with custom plugins (visual edits, health checks)

**Route guards in `App.js`:** `ProtectedRoute` (base), `SalesCrmRoute` (individual/agency tenants), `PropertyManagerRoute` (`account_type === 'property_management'` → `/rentals`), `RoviInternalRoute` (`/rovi/*`, with `ownerOnly` for the AI Control Tower), `AgentStudioAdminRoute`, and COPIM guards (`CopimNationalRoute`, `CopimLocalAssociationRoute`, `CopimMemberPortalRoute`, `CopimAssociationRoute`).

**Key patterns:**
- API calls through `api` from AuthContext (auto-includes auth header)
- `account_type` / `tenantType` / `role` on user determine which UI sections render
- Path alias `@/` maps to `src/`
- Production builds use multi-stage Docker with nginx (`frontend/nginx.conf`)
- Telegram MiniApp is served from the same frontend container under `/miniapp/` (static assets in `frontend/public/miniapp/`)

### Multi-Tenancy, Roles & Auth

**Account types:** `individual` (single broker, simplified UI), `agency` (full features, leaderboards), `property_management` (rentals UI), plus COPIM and Rovi-internal workspaces.

**Tenant isolation:** Personal tenants use `tenant_id = f"tenant-{user_id[:8]}"`; agency/COPIM workspaces have their own tenant ids. The JWT carries `active_tenant_id`, `active_role`, and `active_membership_id` (workspace switching). Refresh tokens (7 days, revocable, stored in DB) complement 24h access tokens.

**Signup requires an invitation code** (`ROVI_SIGNUP_INVITATION_CODE`, default "VIBES") checked in `POST /api/auth/register`.

**Role families:** standard (`broker`, `agency_admin`, `rentals`), COPIM (`copim_council`, `copim_association`, `copim_member`), Rovi internal (`rovi_admin`, `rovi_sales`, `rovi_orchestrator`, …), VibeLab agent roles. The AI Control Tower is further restricted to emails in `CONTROL_TOWER_OWNER_EMAILS`.

### COPIM Module

Association membership management (real estate professional associations / CIIB): members, memberships, invoicing, courses, events, community posts, and credentials. Collections: `copim_associations`, `copim_members`, `copim_memberships`, `copim_invoices`, `copim_events`, `copim_courses`, `copim_event_registrations`, `copim_course_enrollments`, `copim_association_posts`. Bulk member import (CSV with column mapping + dedup) via `copim_member_import.py`. Frontend portal spans the `Copim*Page.js` pages with national/association/member route tiers.

### Lead Pipeline

**Status flow:** nuevo → contactado → calificacion → presentacion → apartado → venta/perdido

- Kanban board with drag-and-drop (@dnd-kit), table view, dynamic filters
- AI analysis per lead (intent score, sentiment, next action)
- Import wizard: Upload → Map columns → Preview → Import (CSV/XLSX, dedup by email/phone, compatible with GHL/HubSpot/Pipedrive exports)

### Campaigns Module

1. **Calls** - VAPI AI Voice API
2. **SMS** - Twilio
3. **Email** - SendGrid with templates, open/click tracking; visual drag-and-drop template editor at `/email-templates/new` (stores `json_content` + generated `html_content`, variables like `{{nombre}}`)

### Google Calendar Integration

- OAuth2 flow in Settings > Integrations; tokens in `IntegrationSettings.google_tokens`
- Bidirectional sync (`google_event_id`, `synced_from_google`)
- Routes: `/api/oauth/google/*`, `/api/google-calendar/events`

## Environment Variables

**Backend (`.env`) — core:**
```
MONGO_URL=mongodb://...
DB_NAME=rovi_crm
JWT_SECRET=...
CORS_ORIGINS=http://localhost:3000
ROVI_SIGNUP_INVITATION_CODE=VIBES
```

**AI provider:** `ROVI_AI_PROVIDER`, `ROVI_AI_DEFAULT_MODEL`, `ROVI_AI_BASE_URL`, `ROVI_AI_API_KEY` (legacy: `EMERGENT_LLM_KEY`).

**Telegram/Hermes:** `ROVI_TELEGRAM_BOT_TOKEN`, `ROVI_TELEGRAM_BOT_USERNAME`, `ROVI_TELEGRAM_WEBHOOK_SECRET`, per-role bot usernames (`ROVI_BROKER_TELEGRAM_BOT_USERNAME`, etc.), `TELEGRAM_AGENT_PROFILES` (JSON), `ROVI_HERMES_PROFILES_ROOT`, `ROVI_HERMES_AGENT_BASE_URL`, `ROVI_PUBLIC_API_BASE_URL`.

**Media storage:** `ROVI_MEDIA_STORAGE_PROVIDER` (`local` | `pentaract`), `PENTARACT_BASE_URL`, `PENTARACT_TOKEN`, `PENTARACT_STORAGE_ID`.

**Other integrations:** `SENDGRID_API_KEY`, Twilio/VAPI keys, `AIFORDB_API_KEY`.

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
- **Docker volumes**: `mongodb_data` and `backend_uploads` persist across container restarts; Media Hub uploads must persist in production
- **Integration tests** use `requests` against a running backend (not TestClient); unit/smoke tests use TestClient
- **Frontend build**: craco custom webpack config; visual-edits plugins only load in development mode
- **CI/CD**: GitHub Actions (`.github/workflows/deploy-*.yml`) build Docker images, push to ghcr.io, and deploy via SSH (main→production, dev→development, rovi_deploy→preview); the dev workflow also runs black/flake8/isort/mypy
- **Server setup**: Run `deploy/setup-server.sh` on the VPS to configure nginx, docker, and subdomains
- **Agent actions are audited**: agent interpretation jobs follow created → in_review → approved → executed; don't bypass the `agent_interpretation_job` flow when extending agent capabilities
