# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
docker-compose up -d                    # Full stack
docker-compose -f docker-compose.preview.yml up -d  # Preview environment
docker-compose -f docker-compose.hostinger.yml up -d  # Production (Hostinger)
```

### Backend Testing
```bash
cd backend
pytest                                          # All tests
pytest tests/test_leadvibes_crm.py             # Core API tests
pytest tests/test_import_leads.py              # Import feature tests
pytest tests/test_google_calendar_email_templates.py  # Calendar/email tests
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

### Frontend Structure (`frontend/src/`)
- `App.js` - React Router with public/protected routes
- `context/AuthContext.js` - JWT auth, axios instance with interceptors
- `context/ThemeContext.js` - Light/dark mode
- `pages/` - Main page components (Dashboard, Leads, Campaigns, etc.)
- `components/ui/` - shadcn/ui components
- `lib/utils.js` - Utility functions

**Key patterns:**
- Protected routes use `<ProtectedRoute>` wrapper
- API calls through `api` from AuthContext (auto-includes auth header)
- `account_type` on user determines UI (individual vs agency)

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
