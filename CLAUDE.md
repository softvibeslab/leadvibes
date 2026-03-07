# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rovi (LeadVibes) is a CRM system for real estate professionals in Mexico/Latin America. It's a monorepo with a FastAPI/Python backend and a React 19 frontend, designed for both individual agents and agencies.

## Commands

### Frontend (React)
```bash
cd frontend
yarn install          # Install dependencies
yarn start           # Start dev server (http://localhost:3000)
yarn build           # Production build
yarn test            # Run tests
```

Frontend uses CRACO for custom webpack configuration and requires `yarn` (not npm) as the package manager.

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt    # Install dependencies
uvicorn server:app --reload        # Run dev server
pytest                             # Run tests
pytest tests/test_specific.py      # Run specific test file
```

Backend runs on port 8000 by default. Set `MONGO_URL` and `DB_NAME` environment variables.

### Environment Variables
- Frontend: `REACT_APP_BACKEND_URL` - Backend API URL
- Backend: `MONGO_URL`, `DB_NAME` - MongoDB connection

## Architecture

### Backend (`/backend`)
- **Framework**: FastAPI with async/await support
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: JWT with bcrypt password hashing
- **Main files**:
  - `server.py` - All API routes (uses `/api` prefix)
  - `models.py` - Pydantic models for request/response validation
  - `auth.py` - Authentication utilities (`get_current_user`, `require_role`)
  - `ai_service.py` - OpenAI integration via Emergent integrations
  - `seed_data.py` - Default data for new tenants

Multi-tenant architecture: each user has a `tenant_id` (derived from user ID). All data queries filter by `tenant_id`.

### Frontend (`/frontend`)
- **Framework**: React 19 with React Router v7
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI primitives)
- **State Management**: React Context only (AuthContext, ThemeContext)
- **Build**: CRACO custom config with visual edits plugin

**Key directories**:
- `src/pages/` - Main page components (DashboardPage, LeadsPage, etc.)
- `src/components/ui/` - shadcn/ui components
- `src/components/` - Layout, Sidebar, AIChat
- `src/context/` - AuthContext, ThemeContext
- `src/plugins/` - Custom webpack/dev server plugins

### Core Entities
- **Users**: Individual or Agency account types
- **Leads**: Kanban status tracking (Nuevo, Contactado, etc.)
- **Activities**: Calls, meetings, emails linked to leads
- **Gamification**: Points system with rules and leaderboards
- **Calendar**: Events with Google Calendar sync
- **Campaigns**: SMS (Twilio), Email (SendGrid), Voice (VAPI)
- **Integrations**: Configurable API keys in settings

### Authentication Flow
1. Login → JWT token stored in `localStorage.leadvibes_token`
2. Axios interceptor adds `Bearer ${token}` header
3. Protected routes check `isAuthenticated` and redirect unauthenticated users
4. Onboarding required if `onboarding_completed` is false

### API Patterns
- All routes prefixed with `/api`
- Auth routes: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`
- Protected routes use `Depends(get_current_user)` dependency
- Tenant filtering: queries always include `tenant_id` filter

### Testing
- Backend: `pytest` in `/backend/tests/`
- Tests use `BASE_URL` from `REACT_APP_BACKEND_URL` env var
- Default: `https://lead-bulk-upload.preview.emergentagent.com`

## Documentation

For detailed documentation, see the `/docs` directory:
- **[docs/BACKEND.md](docs/BACKEND.md)** - Complete backend API documentation
- **[docs/FRONTEND.md](docs/FRONTEND.md)** - Complete frontend component documentation
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Step-by-step deployment guide
- **[docs/README.md](docs/README.md)** - Documentation index
