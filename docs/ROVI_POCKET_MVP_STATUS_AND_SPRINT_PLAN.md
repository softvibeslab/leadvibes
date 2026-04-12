# Rovi Pocket — Informe de Estado y Planeación Scrum para MVP

Fecha de corte: 8 de abril de 2026
Horizonte objetivo del MVP: 26 de junio de 2026
Base analizada: código local, subrepo `apps/rovi-pocket/`, backend FastAPI compartido y documentación vigente

## Resumen ejecutivo

`Rovi Pocket` ya superó la fase de idea y demo estática. Hoy existe un subproducto Expo funcional con:

- shell mobile-first navegable,
- login contra backend real,
- consumo real de auth, leads, lead detail y generación de guiones,
- flujo demo sólido para producto y venta interna.

El punto clave es este: `el MVP no está bloqueado por UI`.

El riesgo real está en la capa de integración y endurecimiento:

- persistencia de sesión,
- agenda real,
- actividades y cambios de etapa persistidos,
- copiloto conectado a backend,
- QA de flujos críticos,
- pipeline de beta/release.

La mejor decisión para lanzar el MVP no es seguir agregando pantallas, sino cerrar un `MVP operativo recortado`, con foco en broker individual y ejecución diaria.

## Estado actual por stream

| Stream | Estado | Lectura ejecutiva |
|--------|--------|-------------------|
| Foundations | 85% | Repo Pocket independiente, shell Expo, tema, tabs, demo guiada y EAS listos. |
| Auth / Identity | 45% | Existe login real contra backend, pero falta persistencia de token, logout robusto, onboarding real y storage seguro. |
| Leads / Pipeline | 55% | Lista y detalle ya viven en la app; parte de leads se carga del backend, pero cambios de etapa y actividades siguen sin flujo real completo. |
| Dashboard Momentum | 40% | La narrativa y UI ya están fuertes, pero agenda, planner y varias señales siguen apoyadas en mock local. |
| Copilot IA | 20% | La experiencia conversacional está bien representada, pero no existe query real del copiloto ni tool layer productivo. |
| Agenda | 15% | La pantalla existe y comunica valor, pero aún opera sobre datos demo. |
| Perfil / Broker OS | 35% | Muestra progreso e integraciones, pero es más panel demo que centro real de configuración. |
| Importación | 30% | El backend principal ya tiene flujo de importación CSV en web, pero Pocket todavía no lo aterriza como experiencia móvil. |
| DevOps / Release | 70% | CI, Docker local, EAS y documentación de operación avanzaron bien; falta beta pipeline cerrada y observabilidad móvil real. |
| QA | 35% | Hay smoke/unit en backend y typecheck en Pocket, pero falta cobertura E2E de flujos MVP y readiness de beta. |

## Evidencia del estado real

- Login real y carga de datos base: [App.tsx](/Users/newproject/Documents/GitHub/leadvibes/apps/rovi-pocket/App.tsx), [pocketApi.ts](/Users/newproject/Documents/GitHub/leadvibes/apps/rovi-pocket/src/lib/pocketApi.ts)
- URL de backend actual y fallback local: [config.ts](/Users/newproject/Documents/GitHub/leadvibes/apps/rovi-pocket/src/lib/config.ts)
- Flujo actual de auth: [AuthScreen.tsx](/Users/newproject/Documents/GitHub/leadvibes/apps/rovi-pocket/src/screens/AuthScreen.tsx)
- Pipeline y Lead Insight Lab ya navegables: [LeadsScreen.tsx](/Users/newproject/Documents/GitHub/leadvibes/apps/rovi-pocket/src/screens/LeadsScreen.tsx)
- Agenda aún sobre data demo: [AgendaScreen.tsx](/Users/newproject/Documents/GitHub/leadvibes/apps/rovi-pocket/src/screens/AgendaScreen.tsx)
- Copilot aún sobre thread demo: [CopilotScreen.tsx](/Users/newproject/Documents/GitHub/leadvibes/apps/rovi-pocket/src/screens/CopilotScreen.tsx)
- Estado documentado del subproyecto: [IMPLEMENTATION_STATUS.md](/Users/newproject/Documents/GitHub/leadvibes/apps/rovi-pocket/docs/IMPLEMENTATION_STATUS.md)
- Estado global del workspace: [WORKSPACE_STATUS_SUMMARY.md](/Users/newproject/Documents/GitHub/leadvibes/docs/WORKSPACE_STATUS_SUMMARY.md)

## Alcance recomendado del MVP de lanzamiento

### Incluido en MVP

- login con backend real y sesión persistente,
- dashboard momentum con datos reales mínimos,
- listado y detalle de leads con acciones críticas,
- cambio de etapa y registro básico de actividad,
- generación de script comercial,
- agenda diaria real con follow-up y eventos básicos,
- copiloto v1 orientado a consulta y recomendación,
- importación CSV,
- build Android interna y WebApp usable,
- QA funcional de flujos críticos.

### Fuera del MVP o sólo si sobra capacidad

- importación de contactos del teléfono,
- share extension de WhatsApp,
- gamificación completa,
- landing pública del broker,
- automatizaciones n8n amplias,
- offline con cola de sincronización,
- push notifications avanzadas,
- sincronización Google Calendar bidireccional completa.

## Riesgos principales

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Seguir ampliando UI antes de cerrar integración | Alto | Congelar scope visual y priorizar contratos, estado y flujos persistentes |
| Depender del backend actual sin capa Pocket clara | Alto | Definir contrato Pocket mínimo y encapsular respuestas en Mobile |
| Copilot demasiado ambicioso para MVP | Alto | Reducirlo a consulta contextual + scripts + siguiente mejor acción |
| Agenda real y actividades no aterrizadas | Alto | Tratar agenda/follow-up como parte de la ruta crítica, no como mejora posterior |
| QA móvil tardío | Alto | Empezar smoke funcional por sprint y no esperar al cierre |

## Ruta crítica del MVP

Secuencia recomendada:

1. `PKMVP-001` — Congelar alcance MVP y definition of done.
2. `PKMVP-002` — Cerrar contrato Pocket y mapear endpoints actuales/requeridos.
3. `PKMVP-003` — Persistencia de sesión y hardening de auth.
4. `PKMVP-004` — Leads reales, cambio de etapa y actividades.
5. `PKMVP-005` — Dashboard momentum con datos reales.
6. `PKMVP-006` — Agenda real con follow-up/eventos básicos.
7. `PKMVP-007` — Copilot v1 con query real y scripts.
8. `PKMVP-010` — QA funcional + smoke E2E.
9. `PKMVP-011` — Beta interna y release candidate.

Todo lo demás puede correr en paralelo si no bloquea esta cadena.

## Replaneación Scrum

### Sprint 0 — Cierre de foundations y freeze

Fechas: 8 de abril de 2026 al 17 de abril de 2026

Objetivo:
cerrar el scope real del MVP y convertir la demo actual en una base integrada, no sólo presentable.

Salida esperada:

- backlog MVP aprobado,
- contrato Pocket mínimo,
- auth persistence definida,
- plan QA y release skeleton aprobados.

### Sprint 1 — Auth y operación base

Fechas: 20 de abril de 2026 al 1 de mayo de 2026

Objetivo:
dejar al broker entrando, manteniendo sesión y operando leads reales sin romper el flujo.

Salida esperada:

- sesión persistente,
- dashboard con señales mínimas reales,
- listado y detalle de leads consolidados,
- acciones críticas definidas técnicamente.

### Sprint 2 — Pipeline operativo y carga inicial

Fechas: 4 de mayo de 2026 al 15 de mayo de 2026

Objetivo:
hacer que Pocket sea útil desde el día 1 para mover leads y subir base inicial.

Salida esperada:

- cambio de etapa,
- actividades/notas/follow-up,
- importación CSV MVP,
- agenda mínima ligada al lead.

### Sprint 3 — Inteligencia operativa

Fechas: 18 de mayo de 2026 al 29 de mayo de 2026

Objetivo:
conectar dashboard y copiloto con datos reales del broker.

Salida esperada:

- momentum dashboard real,
- copiloto v1,
- scripts comerciales reales,
- recomendaciones accionables por lead.

### Sprint 4 — Integración, beta y hardening

Fechas: 1 de junio de 2026 al 12 de junio de 2026

Objetivo:
integrar extremo a extremo y entrar a beta interna estable.

Salida esperada:

- smoke funcional móvil,
- bugs P0/P1 triageados,
- build Android interna estable,
- observabilidad mínima activa.

### Sprint 5 — Release candidate

Fechas: 15 de junio de 2026 al 26 de junio de 2026

Objetivo:
cerrar defectos críticos, validar con brokers piloto y preparar salida controlada.

Salida esperada:

- QA sign-off,
- beta feedback consolidado,
- release candidate Android/Web,
- runbook operativo y ownership por área.

## Responsables por área

| Área | Responsable sugerido | Mandato |
|------|----------------------|---------|
| Product | PM / Product Owner | scope, backlog, definición de MVP, aceptación |
| UX/UI | Lead Product Designer | flujos, estados, consistencia, usabilidad |
| Mobile Frontend | Lead Mobile | app Expo, navegación, estado local, integraciones cliente |
| Backend | Lead Backend | contratos, auth, leads, actividades, agenda, import |
| IA | Lead AI | query del copiloto, scripts, contexto, guardrails |
| DevOps | DevOps Lead | CI/CD, EAS, observabilidad, entornos |
| QA | QA Lead | smoke, UAT, beta readiness, severidad de bugs |

## Decisiones recomendadas hoy

1. Congelar el MVP con el alcance recortado de este documento.
2. Mover `Google Calendar full sync`, `WhatsApp share`, `offline`, `landing` y `gamificación completa` fuera de ruta crítica.
3. Tratar `actividades`, `agenda real` y `copilot v1` como parte del core de lanzamiento.
4. Usar el backlog CSV adjunto como base para ClickUp import y planificación por sprint.

## Entregables asociados

- Informe ejecutivo-técnico: este documento
- Backlog importable para ClickUp: [ROVI_POCKET_MVP_CLICKUP_IMPORT.csv](/Users/newproject/Documents/GitHub/leadvibes/docs/ROVI_POCKET_MVP_CLICKUP_IMPORT.csv)
