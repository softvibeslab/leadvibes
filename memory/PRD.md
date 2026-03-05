# Rovi - CRM Inmobiliario

## Original Problem Statement
Rovi (antes LeadVibes) es un CRM simplificado para ventas inmobiliarias de alto valor, diseñado para el mercado de bienes raíces de lujo en México.

## User Personas
1. **Broker Individual**: Agente inmobiliario independiente que gestiona sus propios leads, citas y pipeline.
2. **Inmobiliaria (Agencia)**: Empresa con múltiples brokers que requiere gestión de equipo, leaderboards y gamificación.

## Core Features Implemented

### Authentication & Account Types
- JWT authentication
- Two account types: Individual (simplified UI) and Agency (full features)
- User registration with account type selection

### Dashboard
- KPI cards with click-to-expand detail modals:
  - Puntos del Mes (desglose por tipo de actividad)
  - Apartados (lista de propiedades apartadas)
  - Ventas Cerradas (lista con montos y totales)
  - Brokers Activos (rendimiento del equipo - Agency only)
- Leaderboard (Agency only)
- Recent activity feed
- Gamification rules display

### Pipeline de Leads
- Dual view: Kanban board + Table view
- Drag-and-drop status updates
- Dynamic bubble filters (status, priority, source)
- Sortable table columns
- Lead detail modal with AI analysis

### Calendar Module
- Month view with Spanish locale
- Event creation and management
- Event types: llamada, visita, zoom, presentacion, seguimiento
- Daily event list

### Campaigns Module (NEW)
- **Llamadas Masivas** - VAPI AI Voice integration
- **SMS Masivos** - Twilio integration
- **Email Marketing** - SendGrid integration
- Campaign creation with lead filters
- History tracking for calls, SMS, emails
- Open/click tracking for emails
- Conversation analysis (DEMO/mockup)

### Settings
- Profile management
- Goals/KPIs configuration
- **Integrations tab**:
  - VAPI (AI calls)
  - Twilio (SMS)
  - SendGrid (Email)
- Theme toggle (light/dark)

### AI Assistant
- Contextual chat powered by OpenAI GPT-4o
- Sales-focused responses
- Integration with CRM data

## Tech Stack
- **Backend**: FastAPI, MongoDB, JWT
- **Frontend**: React, Tailwind CSS, shadcn/ui, @dnd-kit
- **Integrations**: OpenAI, VAPI, Twilio, SendGrid
- **UI**: Tulum Luxury color palette

## Design System
- Primary: #0D9488 (Turquesa)
- Secondary: #4D7C0F (Verde Jungla)
- Accent: #D97706 (Dorado)
- Background: #E7E5E4 (Beige Arena)
- Fully responsive (mobile + desktop)

---

## Session Changelog (Mar 5, 2026)

### Added
- ✅ Mobile responsive layout with hamburger menu
- ✅ Pipeline table view with sortable columns
- ✅ Dynamic bubble filters for leads
- ✅ Campaigns module with VAPI, Twilio, SendGrid
- ✅ Settings integrations page
- ✅ KPI detail modals on Dashboard click
- ✅ Renamed app from "LeadVibes" to "Rovi"

### Modified
- ✅ Sidebar simplified navigation code
- ✅ Dashboard responsive cards
- ✅ Calendar responsive layout
- ✅ Leads page dual view

---

## API Endpoints

### Core
- POST /api/auth/register, /login
- GET /api/dashboard/stats, /leaderboard, /kpi-detail/{type}
- GET/POST /api/leads, PUT /api/leads/{id}
- GET/POST /api/calendar/events

### Campaigns
- GET/POST /api/campaigns
- POST /api/campaigns/{id}/start
- GET /api/calls, POST /api/calls/single
- GET /api/sms, POST /api/sms/single
- GET /api/emails, POST /api/emails/single
- GET/POST /api/email-templates

### Settings
- GET/PUT /api/settings/integrations
- POST /api/settings/integrations/test-vapi
- POST /api/settings/integrations/test-twilio
- POST /api/settings/integrations/test-sendgrid

---

## Credentials
- **Demo User**: carlos.mendoza@leadvibes.mx / demo123
- **API URL**: https://lead-bulk-upload.preview.emergentagent.com

---

## Backlog

### P1 (High Priority)
- [ ] Google Calendar sync integration
- [ ] Webhook endpoints for VAPI/Twilio/SendGrid callbacks

### P2 (Medium Priority)
- [ ] Scripts page functionality
- [ ] Reports/Analytics page
- [ ] Email template builder with visual editor
- [ ] Consider PostgreSQL migration

### P3 (Low Priority)
- [ ] Push notifications
- [ ] Mobile app version
- [ ] Custom gamification rules editor
- [ ] Lead import/export (CSV)
