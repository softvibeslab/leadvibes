# SelvaVibes CRM - Product Requirements Document

## Información General
- **Nombre**: SelvaVibes CRM
- **Versión**: 1.0.0
- **Fecha de creación**: Enero 2026
- **Stack tecnológico**: React + FastAPI + MongoDB + OpenAI GPT-5.2

## Problema a Resolver
CRM + marketing automation simplificado para inmobiliarias de alto valor (lotes residenciales en Tulum), con fuerte componente de gamificación para equipos de ventas y un asistente de IA central.

## User Personas
1. **Broker de Ventas**: Usuario principal que contacta leads, registra actividades, gana puntos
2. **Manager**: Supervisa equipo, ve reportes, configura reglas de gamificación
3. **Admin**: Configuración del sistema, gestión de usuarios

## Core Requirements (Estáticos)
- Autenticación JWT + multi-tenant
- Dashboard con KPIs y leaderboard
- Gestión de leads con Kanban
- Sistema de gamificación (puntos por acciones)
- Asistente IA conversacional
- Scripts de ventas biblioteca
- Dark/Light mode toggle

## Lo Implementado (MVP - Enero 2026)
### Backend (FastAPI)
- [x] Auth: /api/auth/register, /api/auth/login, /api/auth/me
- [x] Goals: /api/goals (onboarding KPIs)
- [x] Dashboard: /api/dashboard/stats, leaderboard, recent-activity
- [x] Leads CRUD: /api/leads/* con análisis IA
- [x] Activities: /api/activities con puntos automáticos
- [x] Gamification: /api/gamification/rules, points
- [x] Scripts: /api/scripts/*
- [x] AI Chat: /api/chat con GPT-5.2
- [x] Seed data: 5 brokers, 20 leads de Tulum

### Frontend (React + Tailwind + Shadcn)
- [x] Login/Register con tabs
- [x] Onboarding wizard 3 pasos
- [x] Dashboard con 4 KPI cards, leaderboard, actividad reciente
- [x] Leads Kanban (6 columnas por estado)
- [x] Modal detalle lead con análisis IA y scripts
- [x] Brokers page con cards y stats
- [x] Gamification page con reglas y leaderboard
- [x] Scripts library
- [x] Settings page
- [x] AI Chat floating widget
- [x] Dark/Light mode toggle
- [x] Diseño "Tulum Jungle" (emerald colors)

## Backlog Priorizado
### P0 (Crítico)
- [ ] Integración WhatsApp real (Twilio/WhatsApp Business API)
- [ ] Notificaciones en tiempo real (WebSockets)

### P1 (Importante)
- [ ] Pipeline visual drag-and-drop
- [ ] Calendario de seguimientos
- [ ] Reportes exportables (PDF/Excel)
- [ ] Asignación automática de leads

### P2 (Deseable)
- [ ] Email templates y envío
- [ ] Integración con portales inmobiliarios
- [ ] App móvil (React Native)
- [ ] Recordatorios automáticos

## Próximos Pasos
1. Integrar WhatsApp API para comunicación real
2. Agregar WebSockets para notificaciones en vivo
3. Implementar pipeline visual con drag-and-drop
4. Agregar calendario de reuniones/seguimientos

## Credenciales de Demo
- Email: demo@test.com
- Password: demo123
- (Después de seed): carlos.mendoza@selvavibes.mx / demo123
