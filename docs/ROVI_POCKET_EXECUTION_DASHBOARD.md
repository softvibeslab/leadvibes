# Rovi Pocket — Dashboard de Ejecución y Kanban

Fecha base del plan: 5 de abril de 2026
Supuesto de arranque: 6 de abril de 2026
Duración objetivo MVP: 12 semanas

## Dashboard Ejecutivo

| Indicador | Valor |
|-----------|-------|
| Producto | Rovi Pocket |
| Objetivo | Lanzar MVP mobile-first para broker individual |
| Ventana objetivo | 6 de abril de 2026 al 26 de junio de 2026 |
| Modalidades | Android, iOS, WebApp |
| Enfoque | Dashboard Inteligente + Leads + Agenda + Agente IA |
| Arquitectura | Nuevo repo Pocket + backend compartido |
| Cadencia propuesta | Sprints de 2 semanas |
| Meta de beta | Semana del 15 de junio de 2026 |
| Meta de release candidate | Semana del 22 de junio de 2026 |

## KPIs de ejecución del programa

| KPI | Meta |
|-----|------|
| Scope de MVP congelado | 100% en Sprint 0 |
| Historias con criterios de aceptación definidos | 100% antes de entrar a build |
| Defectos críticos abiertos al cierre de Sprint 5 | 0 |
| Cobertura de flujos críticos E2E | 80% |
| Crash-free sessions beta | >99% |
| Tiempo de cold open beta | <2.5 s |
| Respuesta IA en casos comunes | 2 a 6 s |
| Importación exitosa de contactos/CSV | >95% en pruebas beta |

## Módulos del MVP y estado de planeación

| Módulo | Estado | Inicio | Fin | Área líder | Entregable principal |
|--------|--------|--------|-----|------------|----------------------|
| Foundations | Ready | 6-abr-2026 | 17-abr-2026 | Mobile + Platform | App shell, CI/CD, design system |
| Identity & Setup | Ready | 13-abr-2026 | 24-abr-2026 | Mobile + Backend | Auth, onboarding, metas, perfil IA |
| Leads & Pipeline | Planned | 20-abr-2026 | 15-may-2026 | Mobile + Backend | Pipeline operativo mobile-first |
| Importación | Planned | 27-abr-2026 | 15-may-2026 | Backend + Mobile | CSV, contactos, dedupe |
| Dashboard Inteligente | Planned | 4-may-2026 | 29-may-2026 | Product + IA + Backend | Planner diario/semanal/mensual |
| Agente IA Conversacional | Planned | 11-may-2026 | 5-jun-2026 | IA + Backend + Mobile | Chat copiloto con tools |
| Calendario + Google | Planned | 18-may-2026 | 12-jun-2026 | Backend + Mobile | Agenda y sync confiable |
| Landing + Automatizaciones | Planned | 1-jun-2026 | 19-jun-2026 | Automation + Backend | Landing simple y workflows n8n |
| Hardening + Launch | Planned | 15-jun-2026 | 26-jun-2026 | QA + DevOps + PM | Beta, stores, RC |

## Plan por sprints

| Sprint | Fechas | Meta principal | Salida esperada |
|--------|--------|----------------|-----------------|
| Sprint 0 | 6-abr al 17-abr | Fundaciones y scope freeze | Repo, CI, design system, backlog aprobado |
| Sprint 1 | 20-abr al 1-may | Auth, onboarding, shell leads | Login, setup, primeras pantallas |
| Sprint 2 | 4-may al 15-may | Leads, importación, quick actions | Pipeline y carga inicial operativos |
| Sprint 3 | 18-may al 29-may | Dashboard Inteligente v1 | Planner diario + KPIs + recomendaciones |
| Sprint 4 | 1-jun al 12-jun | Agente IA + Calendario + Google | Copilot usable + agenda sincronizada |
| Sprint 5 | 15-jun al 26-jun | Landing, automatizaciones, QA, release | Beta, RC y preparación de tiendas |

## Responsables por área

| Área | Responsabilidad principal |
|------|---------------------------|
| Product | visión, alcance, backlog, KPIs, priorización |
| UX/UI | navegación, flujos, diseño visual, prototipos, usabilidad |
| Mobile Frontend | app Expo, UI, navegación, offline, push, integrations client-side |
| Backend | Pocket API, dominio CRM, auth, leads, calendar, analytics |
| IA | copilot, planner, context builder, scripts, guardrails |
| Automation | n8n, webhooks, workflows, email/WhatsApp transaccional |
| DevOps | CI/CD, entornos, releases, observabilidad |
| QA | estrategia de pruebas, E2E, smoke, beta readiness |

## Kanban de planeación

Leyenda:

- `Área`: área responsable primaria
- `Subtareas`: desglose mínimo ejecutable
- `Sprint`: sprint sugerido de entrada

## Ready Now

### PKT-001 — Scope freeze y PRD ejecutable

- Área: Product
- Sprint: 0
- Subtareas:
  - cerrar alcance MVP
  - cerrar kill list
  - validar criterios de éxito
  - aprobar este plan maestro

### PKT-002 — Arquitectura Pocket API y contratos

- Área: Backend / Architecture
- Sprint: 0
- Subtareas:
  - definir BFF Pocket
  - mapear endpoints reutilizables
  - listar endpoints nuevos
  - definir contratos JSON del agente IA

### PKT-003 — Nuevo repo Pocket + app shell

- Área: Mobile Frontend
- Sprint: 0
- Subtareas:
  - crear repo
  - bootstrap Expo Router
  - tabs base
  - tema y tokens
  - secure storage

### PKT-004 — CI/CD y observabilidad base

- Área: DevOps
- Sprint: 0
- Subtareas:
  - GitHub Actions
  - EAS project
  - Sentry
  - PostHog
  - environments dev/staging/prod

### PKT-005 — Design system y navegación mobile

- Área: UX/UI
- Sprint: 0
- Subtareas:
  - tab bar
  - FAB
  - card system
  - empty states
  - skeleton states

### PKT-006 — Auth y onboarding

- Área: Mobile + Backend
- Sprint: 1
- Subtareas:
  - login
  - registro
  - metas
  - perfil IA
  - permisos de contactos y notificaciones

## Next Up

### PKT-007 — Lista de leads y filtros

- Área: Mobile Frontend
- Sprint: 1
- Subtareas:
  - listado
  - búsqueda
  - filtros rápidos
  - vistas resumidas

### PKT-008 — Lead detail y quick actions

- Área: Mobile Frontend
- Sprint: 1
- Subtareas:
  - encabezado del lead
  - timeline
  - botones llamar/WhatsApp/email/agendar
  - notas rápidas

### PKT-009 — Gestión de etapas y actividades

- Área: Backend + Mobile
- Sprint: 2
- Subtareas:
  - cambio de etapa
  - registro de actividad
  - SLA de seguimiento
  - auditoría básica

### PKT-010 — Insights IA por lead

- Área: IA
- Sprint: 2
- Subtareas:
  - score operativo
  - resumen del lead
  - riesgo/oportunidad
  - siguiente mejor acción

### PKT-011 — Importación CSV

- Área: Backend
- Sprint: 2
- Subtareas:
  - upload
  - mapeo
  - preview
  - dedupe
  - import result

### PKT-012 — Importación de contactos del teléfono

- Área: Mobile Frontend
- Sprint: 2
- Subtareas:
  - permisos
  - selector
  - normalización
  - envío batch

### PKT-013 — Captura vía WhatsApp Share

- Área: Mobile + IA
- Sprint: 2
- Subtareas:
  - share intent
  - parsing de texto
  - sugerencia de creación de lead
  - guardado como nota o lead

### PKT-014 — Modelo KPI y OKR personal

- Área: Product + Backend
- Sprint: 3
- Subtareas:
  - definir KPIs
  - reglas de cálculo
  - gaps vs meta
  - dataset del dashboard

### PKT-015 — Planner diario, semanal y mensual

- Área: IA + Backend
- Sprint: 3
- Subtareas:
  - briefing diario
  - top actions del día
  - plan semanal
  - foco mensual

### PKT-016 — Gamificación personal

- Área: Product + Mobile
- Sprint: 3
- Subtareas:
  - puntos
  - streaks
  - badges
  - barras de progreso

## Later

### PKT-017 — Context Builder para Copilot

- Área: IA + Backend
- Sprint: 4
- Subtareas:
  - contexto por broker
  - contexto por lead
  - contexto por agenda
  - resumen de pipeline

### PKT-018 — UI del chat del Agente IA

- Área: Mobile Frontend
- Sprint: 4
- Subtareas:
  - chat screen
  - prompts sugeridos
  - tarjetas accionables
  - estados de carga

### PKT-019 — Tools y acciones del Copilot

- Área: Backend + IA
- Sprint: 4
- Subtareas:
  - crear nota
  - crear tarea
  - crear evento
  - mover etapa
  - redactar mensaje

### PKT-020 — Generador de scripts

- Área: IA
- Sprint: 4
- Subtareas:
  - script de llamada
  - script WhatsApp
  - script email
  - adaptación por lead

### PKT-021 — Agenda móvil y vistas hoy/semana

- Área: Mobile Frontend
- Sprint: 4
- Subtareas:
  - vista hoy
  - vista semana
  - detalle de evento
  - acciones rápidas

### PKT-022 — Google Calendar sync

- Área: Backend
- Sprint: 4
- Subtareas:
  - OAuth
  - sync create/update/delete
  - manejo de conflictos
  - reconexión

### PKT-023 — Push y recordatorios

- Área: Mobile + Backend
- Sprint: 4
- Subtareas:
  - push tokens
  - recordatorios
  - trigger por lead caliente
  - resumen matutino

### PKT-024 — Landing page simple del broker

- Área: Backend + Web/Mobile
- Sprint: 5
- Subtareas:
  - plantilla landing
  - branding básico
  - formulario
  - alta automática del lead

### PKT-025 — Flujos n8n base

- Área: Automation
- Sprint: 5
- Subtareas:
  - nuevo lead inbound
  - lead sin seguimiento
  - confirmación de visita
  - post-visita

### PKT-026 — Mensajes simples por email y WhatsApp

- Área: Automation + Backend
- Sprint: 5
- Subtareas:
  - selección múltiple
  - plantillas simples
  - logs de envío
  - confirmación humana

### PKT-027 — Analytics personales

- Área: Backend + Product
- Sprint: 5
- Subtareas:
  - overview
  - timeline
  - métricas por fuente
  - productividad semanal

### PKT-028 — Offline queue y sync

- Área: Mobile Frontend
- Sprint: 5
- Subtareas:
  - SQLite schema
  - cola local
  - reintentos
  - banner de sincronización

## Pre-Launch

### PKT-029 — QA funcional y E2E

- Área: QA
- Sprint: 5
- Subtareas:
  - smoke tests
  - E2E mobile
  - E2E web
  - checklist de beta

### PKT-030 — Beta con brokers reales

- Área: Product + QA
- Sprint: 5
- Subtareas:
  - reclutar 10 a 15 brokers
  - script de feedback
  - triage de issues
  - iteración rápida

### PKT-031 — Release Android/iOS/WebApp

- Área: DevOps + Mobile
- Sprint: 5
- Subtareas:
  - EAS Build
  - TestFlight
  - Play Internal Testing
  - PWA installable

### PKT-032 — Release readiness y runbook

- Área: PM + DevOps
- Sprint: 5
- Subtareas:
  - checklist release
  - rollback plan
  - métricas de éxito
  - ownership post-launch

## Cadencia recomendada

| Ritual | Frecuencia | Participantes |
|--------|------------|---------------|
| Sprint Planning | Cada 2 semanas | Product, UX, Mobile, Backend, IA, QA |
| Daily stand-up | Diario | Build team |
| Product / UX review | 2 veces por semana | Product, UX, Tech Lead |
| AI review | Semanal | IA, Product, Backend |
| Beta readiness review | Semanal desde Sprint 4 | PM, QA, DevOps, Leads técnicos |
| Release go/no-go | Antes del RC | PM, QA, DevOps, Tech Leads |

## Archivo complementario

El detalle tabular listo para importar a herramientas de gestión está en:

- [ROVI_POCKET_KANBAN.csv](./ROVI_POCKET_KANBAN.csv)
