# LeadVibes CRM - Product Requirements Document

## Original Problem Statement
LeadVibes es un CRM simplificado para ventas inmobiliarias de alto valor (inspirado en GoHighLevel). La aplicación está diseñada para el mercado de bienes raíces de lujo en Tulum, México.

## User Personas
1. **Broker Individual**: Un agente inmobiliario independiente que gestiona sus propios leads, citas y pipeline de ventas.
2. **Inmobiliaria (Agencia)**: Una empresa con múltiples brokers que requiere gestión de equipo, leaderboards y gamificación.

## Core Requirements

### Account Types
- **Individual**: UI simplificada con pipeline, calendario y scripts personales.
- **Agency**: UI completa con gestión de equipo, leaderboards, gamificación y reportes.

### Modules
1. **Dashboard**: KPIs, métricas de rendimiento, actividad reciente
2. **Pipeline de Leads**: Tablero Kanban con drag-and-drop
3. **Calendario**: Gestión de citas y seguimientos
4. **Brokers**: (Agency only) Gestión de equipo
5. **Gamificación**: (Agency only) Puntos, reglas, leaderboards
6. **Scripts**: Guiones de venta personalizables
7. **AI Assistant**: Chat con contexto de ventas

### Design Constraints
- **Color Palette**: "Tulum Luxury"
  - Primary: #0D9488 (Turquesa Profundo)
  - Secondary: #4D7C0F (Verde Jungla)
  - Accent: #D97706 (Dorado Cálido)
  - Background: #E7E5E4 (Beige Arena)
  - Text/Borders: #6B7280 (Gris Piedra)
  - Success: #10B981 (Verde Esmeralda)
  - Error: #EF4444 (Rojo Coral)
- Dark mode support
- Mobile responsive

## Tech Stack
- **Backend**: FastAPI, MongoDB, JWT Auth
- **Frontend**: React, Tailwind CSS, shadcn/ui
- **AI**: OpenAI GPT-4o via Emergent LLM Key
- **Drag & Drop**: @dnd-kit

---

## What's Been Implemented (Feb 13, 2026)

### Backend (100% Complete)
- [x] JWT Authentication with account types
- [x] User registration/login with account_type field
- [x] Dashboard stats API
- [x] Leaderboard API
- [x] Recent activity API
- [x] Leads CRUD with status updates
- [x] Calendar events CRUD
- [x] Gamification rules API
- [x] Brokers management API
- [x] AI chat integration

### Frontend (100% Complete)
- [x] Login page with account type selector
- [x] Onboarding flow
- [x] Conditional UI based on account type:
  - Individual: 3 stat cards, no leaderboard, 5 nav items
  - Agency: 4 stat cards, leaderboard, 7 nav items
- [x] Pipeline de Leads with drag-and-drop Kanban
- [x] Calendar with month view and event creation
- [x] Tulum Luxury color palette applied
- [x] Dark/Light mode toggle

### Testing
- Backend: 19/19 tests passed (100%)
- Frontend: All features verified (100%)
- Test file: /app/backend/tests/test_leadvibes_crm.py

---

## Backlog / Future Tasks

### P1 (High Priority)
- [ ] Google Calendar integration for calendar sync

### P2 (Medium Priority)
- [ ] Scripts page functionality (currently placeholder)
- [ ] Reports/Analytics page
- [ ] Consider PostgreSQL migration (user's original preference)
- [ ] AI assistant enhancements (auto lead assignment, suggestions)

### P3 (Low Priority)
- [ ] Email/SMS notifications
- [ ] Mobile app version
- [ ] Custom gamification rules editor
- [ ] Lead import/export

---

## Credentials

### Demo User (Individual)
- Email: carlos.mendoza@leadvibes.mx
- Password: demo123

### API URL
- https://broker-dash-4.preview.emergentagent.com

---

## Architecture

```
/app/
├── backend/
│   ├── server.py       # FastAPI main
│   ├── models.py       # Pydantic models
│   ├── auth.py         # JWT auth
│   ├── ai_service.py   # OpenAI integration
│   └── seed_data.py    # Demo data
└── frontend/
    ├── src/
    │   ├── context/AuthContext.js
    │   ├── components/
    │   │   ├── Sidebar.js
    │   │   ├── Layout.js
    │   │   └── AIChat.js
    │   └── pages/
    │       ├── LoginPage.js
    │       ├── DashboardPage.js
    │       ├── LeadsPage.js
    │       ├── CalendarPage.js
    │       └── ...
    └── tailwind.config.js
```
