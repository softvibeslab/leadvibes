# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LeadVibes CRM** (aka SelvaVibes CRM) is a gamified, AI-driven sales assistant for high-end real estate teams in Tulum/Latam. It combines lead management, gamification, and AI-powered insights to help real estate brokers track leads, close deals, and compete on leaderboards.

## Architecture

### Monorepo Structure
```
leadvibes/
├── backend/          # Python FastAPI backend
├── frontend/         # React SPA with CRA + Craco
└── tests/            # Integration tests
```

### Backend (Python FastAPI)
- **Framework**: FastAPI with Motor (async MongoDB driver)
- **Database**: MongoDB (via Motor AsyncIOMotorClient)
- **Auth**: JWT tokens with bcrypt password hashing
- **AI Integration**: Emergent AI LLM service (`emergentintegrations.llm.chat.LlmChat`)
- **Entry Point**: `backend/server.py`

Key backend files:
- `server.py` - All API routes (uses APIRouter with `/api` prefix)
- `models.py` - Pydantic models (User, Lead, Activity, Goal, Gamification, etc.)
- `auth.py` - JWT authentication and role-based access control
- `ai_service.py` - AI chat, lead analysis, and script generation
- `seed_data.py` - Demo data for testing

### Frontend (React)
- **Framework**: Create React App with Craco for webpack customization
- **Routing**: React Router v7 with protected/public route patterns
- **UI Library**: Radix UI primitives with Tailwind CSS
- **State**: React Context (AuthContext, ThemeContext)
- **Charts**: Recharts for dashboard visualizations
- **Entry Point**: `frontend/src/App.js`

Key frontend directories:
- `pages/` - Main page components (Dashboard, Leads, Brokers, Calendar, etc.)
- `components/` - Shared components (Layout, Sidebar, AIChat)
- `components/ui/` - Radix UI components
- `context/` - React Context providers

## Development Commands

### Backend
```bash
cd backend

# Install dependencies (if needed)
pip install -r requirements.txt

# Run development server
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend

# Install dependencies (uses Yarn)
yarn install

# Start development server
yarn start
# Opens at http://localhost:3000

# Build for production
yarn build

# Run tests
yarn test
```

### Backend Testing
```bash
# Run specific test
pytest backend/tests/test_leadvibes_crm.py -v

# Run with coverage
pytest backend/tests/ --cov=.
```

## Design System

The app follows a **"Tulum Jungle"** tropical modern aesthetic defined in `design_guidelines.json`:
- **Primary Font**: Outfit (headings), Plus Jakarta Sans (body)
- **Primary Color**: "Selva Green" (#059669 - emerald-600)
- **Secondary**: Cyan/Teal tones
- **Gamification**: Gold/Silver/Bronze accents for leaderboard
- **UI Style**: Glassmorphism, rounded-xl/2xl cards, pill-shaped buttons
- **Spacing**: Generous padding (2-3x standard) for "luxurious" feel

Key visual patterns from `frontend/index.css`:
- `shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)]` - soft shadows
- `bg-white/70 backdrop-blur-lg` - glassmorphism
- `rounded-full` - pill buttons
- `animate-spin` - loading states

## API Architecture

### Multi-Tenancy
- Each user gets a `tenant_id = "tenant-{user_id[:8]}"`
- All queries filter by `tenant_id` for data isolation
- Demo data seeded per tenant via `/api/seed` endpoint

### Authentication Flow
1. `POST /api/auth/register` - Register user, create tenant, seed default rules/scripts
2. `POST /api/auth/login` - Login with email/password, returns JWT + user info
3. `GET /api/auth/me` - Get current user (validates JWT)
4. Protected routes use `Depends(get_current_user)` to extract user from Bearer token

### Key API Routes
- `GET /api/dashboard/stats` - Dashboard stats (points, ventas, apartados)
- `GET /api/dashboard/leaderboard` - Monthly broker rankings
- `GET /api/leads` - List leads with filters (status, priority, search)
- `POST /api/leads/{lead_id}/analyze` - AI lead analysis
- `POST /api/activities` - Log activity + award points
- `POST /api/chat` - Chat with AI assistant (context-aware with goals/stats)
- `GET /api/calendar/events` - Calendar events with date range

### Gamification System
- Points awarded via `gamification_rules` collection
- Activities create entries in `point_ledger` with `broker_id`, `points`, `action`
- Leaderboard aggregates points from `point_ledger` per broker
- Default rules seeded: `llamada: 10pts`, `whatsapp: 5pts`, `visita: 15pts`, `venta: 30pts`

## AI Integration

The AI assistant (`ai_service.py`) uses Emergent LLM service with `gpt-5.2` model:
- **Chat**: Context-aware responses including user goals and current stats
- **Lead Analysis**: Returns JSON with intent_score (0-100), sentiment, key_points, next_action
- **Script Generation**: Personalized sales scripts (apertura, seguimiento, cierre)

System prompt is in Spanish, tailored for Tulum real estate market. AI responses include:
- Sales coaching and strategy recommendations
- Lead qualification insights
- Personalized sales scripts
- Gamification progress tracking

## Frontend Patterns

### Protected Routes
Uses `ProtectedRoute` wrapper in `App.js`:
- Checks `isAuthenticated` from AuthContext
- Redirects to `/login` if not authenticated
- Redirects to `/onboarding` if `onboarding_completed === false`

### Layout Structure
`Layout` component wraps all protected pages with:
- `Sidebar` - Navigation with tropical branding
- Header with user info
- Main content area with page-specific content

### Page Organization
Each page is self-contained in `pages/` directory:
- `DashboardPage` - Stats cards, charts, leaderboard, recent activity
- `LeadsPage` - Kanban board by status, search/filter, lead details modal
- `BrokersPage` - Team list with stats
- `GamificationPage` - Leaderboard, badges, point rules
- `CalendarPage` - Event management with lead integration
- `ScriptsPage` - Sales script library (searchable by category)

## Environment Variables

Backend requires `.env` file:
```
MONGO_URL=mongodb+srv://...
DB_NAME=leadvibes
JWT_SECRET=your-secret-key
EMERGENT_LLM_KEY=your-emergent-key
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

Frontend uses Craco to load env via `craco.config.js`.

## Data Models

### Core Entities
- **User**: id, email, name, role (admin/manager/broker), tenant_id, onboarding_completed
- **Lead**: id, name, phone, email, status (nuevo/contactado/calificacion/...), priority, budget_mxn, assigned_broker_id, tenant_id
- **Activity**: id, lead_id, broker_id, activity_type, description, points_earned
- **Goal**: user_id, ventas_mes, ingresos_objetivo, leads_contactados, tasa_conversion, apartados_mes
- **GamificationRule**: tenant_id, action (llamada/whatsapp/visita/venta), points, description
- **PointLedger**: broker_id, points, action, lead_id, activity_id, tenant_id

### Lead Status Workflow
nuevo → contactado → calificacion → presentacion → apartado → venta | perdido

## Testing

Integration tests use `pytest` and verify:
- Authentication flow (register/login)
- CRUD operations for leads, activities, brokers
- Gamification point calculations
- API endpoint responses
- Leaderboard rankings

Test file: `backend/tests/test_leadvibes_crm.py`

Run tests with coverage:
```bash
pytest backend/tests/ -v --cov=. --cov-report=html
```

## Common Development Patterns

### Adding New API Routes
1. Define Pydantic models in `models.py`
2. Add route handler in `server.py` with `@api_router.{get,post,put}` decorator
3. Use `Depends(get_current_user)` for authentication
4. Filter all queries by `tenant_id` from current_user
5. Return `dict` or Pydantic response model

### Adding New Frontend Pages
1. Create page component in `frontend/src/pages/YourPage.js`
2. Add route in `App.js` under `<Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>`
3. Add navigation link in `Sidebar.js`
4. Use existing UI components from `components/ui/`
5. Fetch data via `useAuth()` context for API calls

### Styling Guidelines
- Use Tailwind utility classes from `tailwind.config.js`
- Follow "Tulum Jungle" palette (emerald/teal tones)
- Apply glassmorphism: `bg-white/70 backdrop-blur-lg border border-white/20`
- Cards: `rounded-2xl shadow-soft`
- Buttons: `rounded-full font-semibold transition-all`
- Spacing: Use `gap-6` for widget gaps, `gap-8` for section gaps

## Important Notes

- The app is designed for **Spanish-speaking users** (UI labels, AI responses, error messages)
- **Multi-tenancy is critical** - always filter by `tenant_id` to prevent cross-tenant data access
- **Gamification is core** - points drive user engagement, ensure point calculations are correct
- **AI is context-aware** - always pass user goals and stats to AI for personalized responses
- **Onboarding is mandatory** - new users must set goals before accessing main app
- **JWT tokens expire** - default 24 hours, configurable via `JWT_EXPIRATION_HOURS`
