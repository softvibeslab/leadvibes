# Rovi Pocket — Plan Maestro de Desarrollo

Fecha: 5 de abril de 2026
Estado: Propuesta ejecutiva para aprobación y arranque
Horizonte base: 10 a 12 semanas para MVP

## Resumen Ejecutivo

`Rovi Pocket` debe construirse como una nueva experiencia mobile-first enfocada exclusivamente en el broker individual de bienes raíces. Su objetivo no es replicar el CRM actual completo, sino convertirse en la herramienta diaria de ventas del broker: rápida, ligera, accionable y centrada en cierres.

### Objetivo del producto

Crear una aplicación disponible en Android, iOS y WebApp que permita al broker:

- revisar su día en segundos,
- priorizar leads y seguimientos,
- conversar con un agente IA que entienda su negocio,
- registrar actividad de forma ultrarrápida,
- coordinar su agenda y citas,
- importar y activar su base de contactos,
- automatizar seguimientos comunes,
- captar leads desde una landing simple propia.

### Diferencias clave vs Rovi actual

| Tema | Rovi actual | Rovi Pocket |
|------|-------------|-------------|
| Usuario principal | Broker individual y agencia | Solo broker individual |
| Experiencia | Web SaaS con amplitud funcional | Mobile-first, uso diario, foco operativo |
| IA | Widget/asistencia puntual | Núcleo del producto y copiloto del broker |
| Marketing | Campañas y plantillas avanzadas | Solo follow-up simple y landing personal |
| Complejidad | Alta, multipantalla, multirrol | Baja fricción, navegación corta y directa |
| Gamificación | Individual + equipo | Solo progreso y hábitos personales |

### Valor principal para el broker

- Menos tiempo administrando y más tiempo vendiendo.
- Más claridad sobre qué hacer hoy, con qué lead y por qué.
- Más consistencia en seguimiento, agenda y hábitos de cierre.
- Más velocidad para convertir contactos y conversaciones en pipeline.
- Un asistente IA verdaderamente útil, conectado al contexto real del broker.

### Decisión recomendada

La versión Pocket debe desarrollarse como `proyecto independiente` con `backend compartido y modularizado`.

No se recomienda modificar el frontend actual del CRM para convertirlo en la app Pocket.

## Recomendación de Arquitectura y Tech Stack

### Decisión: proyecto independiente vs reutilizar el actual

### Recomendación final

Construir:

- un `nuevo repositorio` para la app Pocket,
- una `Pocket API / BFF` sobre el backend actual,
- y reutilizar solo los dominios sólidos ya existentes: auth, leads, calendario, analytics básicos y parte del motor de IA.

### Justificación detallada

| Opción | Pros | Contras | Veredicto |
|--------|------|---------|-----------|
| Modificar el proyecto actual | Reusa lógica y endpoints existentes | Arrastra deuda, UI no mobile-first, releases acoplados, bundle más pesado, difícil eliminar el scope de agencia | No recomendado |
| Nuevo repo Pocket + backend compartido | UX limpia, foco claro, mejor performance, releases móviles independientes, mejor escalabilidad futura | Requiere diseño inicial de contratos y BFF | Recomendado |

### Razones de producto

- Pocket necesita otra jerarquía de navegación.
- Pocket necesita un dashboard operativo, no un dashboard administrativo.
- Pocket necesita tiempos de carga, acciones y pantallas diseñadas para celular.
- Pocket necesita que la IA sea el centro del uso, no una función secundaria.

### Razones técnicas

- El frontend actual está mezclado con rutas y módulos que Pocket no necesita.
- El backend actual puede seguir sirviendo como plataforma de dominio si se encapsula con una capa específica para Pocket.
- Una app móvil requiere notificaciones, offline, deep links, share extensions y ciclos de release distintos.

### Tech Stack recomendado

| Capa | Recomendación | Motivo |
|------|---------------|--------|
| Android / iOS / WebApp | Expo + React Native + TypeScript + Expo Router | Un solo stack moderno para mobile y web |
| UI y navegación | NativeWind + Reanimated + Gesture Handler | Interfaz móvil fluida y consistente |
| Estado y datos | TanStack Query + Zustand | Excelente balance entre caché remota y estado local |
| Validación | React Hook Form + Zod | Formularios rápidos y robustos |
| Offline | expo-sqlite + cola de sincronización | Soporte offline real para leads, notas y agenda |
| Backend | FastAPI modular + Pocket BFF | Reutilización del dominio actual sin contaminar UX |
| Base de datos | MongoDB + Redis | CRM y colas/jobs asincrónicos |
| IA | OpenAI Responses API + salidas estructuradas | Respuestas accionables y auditables |
| Automatizaciones | n8n | Rápido de integrar y fácil de operar |
| Push | Expo Notifications | Recordatorios y reactivación |
| Calendario | Google Calendar API | Alto valor para el broker diario |
| WhatsApp | Deep links + Share Extension en MVP; WhatsApp Business Cloud API en Fase 2 | Cumplimiento y velocidad |
| Email simple | Resend o SendGrid | Mejor para mensajes 1:1 y plantillas ligeras |
| Observabilidad | Sentry + PostHog | Errores, adopción y comportamiento |
| CI/CD | GitHub Actions + EAS Build + EAS Submit + EAS Update | Pipeline moderno para mobile y web |

### Arquitectura objetivo

```text
Rovi Pocket App
(Android / iOS / WebApp)

  -> Pocket API / BFF
     -> Auth Service
     -> Leads Service
     -> Calendar Service
     -> Analytics Service
     -> AI Copilot Service
     -> Landing Service
     -> Automation Service

  -> MongoDB
  -> Redis
  -> n8n
  -> Google Calendar API
  -> WhatsApp Business Cloud API / deep links
  -> Email provider
  -> Push notifications
```

## Roadmap por Fases / Cursos de Desarrollo

Se propone un programa de 8 cursos o módulos secuenciales con ejecución cruzada entre Producto, UX, Mobile, Backend, IA y QA.

### Curso 1. Pocket Foundations

### Objetivo

Crear la base técnica, visual y operativa del producto.

### Funcionalidades a entregar

- Nuevo repositorio `rovi-pocket`
- shell de navegación mobile-first
- design system base
- auth shell
- configuración de entornos
- telemetría base
- CI/CD inicial
- feature flags

### Dependencias técnicas

- aprobación de arquitectura
- naming y branding de Pocket
- contratos iniciales de Pocket API

### Estimación

- 2 semanas
- 10 a 12 persona-días netos de construcción base

### Equipo sugerido

- 1 Mobile FE
- 1 Backend
- 1 UX
- 1 DevOps parcial
- 1 PM / Architect

### Criterios de aceptación

- La app corre en Android, iOS y WebApp.
- Existe login shell funcional.
- Existe pipeline CI con lint y build.
- Hay navegación base por tabs.

### Curso 2. Broker Identity & Setup

### Objetivo

Permitir que un broker entre, configure su cuenta y comience a usar Pocket sin soporte manual.

### Funcionalidades a entregar

- login y registro
- onboarding por metas y preferencias
- perfil del broker
- configuración del perfil IA
- permisos de contactos y notificaciones
- secure storage

### Dependencias técnicas

- auth API
- perfil y goals API
- storage seguro

### Estimación

- 1.5 semanas
- 8 a 10 persona-días

### Equipo sugerido

- 1 Mobile FE
- 1 Backend
- 1 UX

### Criterios de aceptación

- Un broker nuevo puede registrarse y completar onboarding.
- Quedan guardadas metas, preferencias y perfil IA.
- El usuario llega al home listo para operar.

### Curso 3. CRM Core: Leads & Pipeline

### Objetivo

Volver útil la app desde el día 1 con un flujo de leads simple, rápido y accionable.

### Funcionalidades a entregar

- listado de leads
- filtros rápidos
- búsqueda
- lead detail
- quick actions: llamar, WhatsApp, email, agendar, nota
- cambio de etapa
- actividades y notas
- seguimiento por lead
- insights IA visibles dentro del lead

### Dependencias técnicas

- leads API
- activity model
- estados de pipeline
- caché local

### Estimación

- 2.5 semanas
- 15 a 18 persona-días

### Equipo sugerido

- 2 Mobile FE
- 1 Backend
- 1 UX

### Criterios de aceptación

- El broker puede operar su pipeline completo desde celular.
- Cada lead muestra contexto suficiente para decidir la siguiente acción.
- Las acciones críticas se ejecutan en 1 a 3 toques.

### Curso 4. Importación Inteligente

### Objetivo

Resolver la carga inicial de base de contactos y hacer que el broker tenga pipeline útil desde el primer día.

### Funcionalidades a entregar

- importación CSV
- importación desde contactos del teléfono
- deduplicación
- mapeo simplificado
- sugerencias de IA para clasificación
- captura desde Share Extension o texto compartido de WhatsApp

### Dependencias técnicas

- parser de archivos
- expo-contacts
- dedupe service
- Pocket API de importación

### Estimación

- 1.5 semanas
- 10 a 12 persona-días

### Equipo sugerido

- 1 Mobile FE
- 1 Backend
- 1 IA / Automation

### Criterios de aceptación

- El broker puede importar contactos sin fricción.
- Los duplicados se detectan claramente.
- Los nuevos leads entran al pipeline listos para trabajar.

### Curso 5. Dashboard Inteligente + Planner

### Objetivo

Construir el centro de mando diario del broker.

### Funcionalidades a entregar

- KPIs personales
- OKRs y metas
- briefing diario
- planeación del día
- planeación semanal
- planeación mensual
- recomendaciones accionables
- puntos, streaks, badges y progreso visual

### Dependencias técnicas

- metrics engine
- rules engine
- planner IA
- activity events

### Estimación

- 2 semanas
- 15 a 20 persona-días

### Equipo sugerido

- 1 Backend
- 1 IA Engineer
- 1 Mobile FE
- 1 UX

### Criterios de aceptación

- El dashboard propone qué hacer hoy.
- Cada tarjeta se conecta a una acción real.
- El broker entiende si está arriba o abajo de su meta.

### Curso 6. Agente IA Conversacional

### Objetivo

Convertir la IA en el asistente principal del broker y no en un widget secundario.

### Funcionalidades a entregar

- módulo de chat persistente
- prompts sugeridos
- consultas sobre leads, pipeline, agenda y métricas
- resúmenes por lead
- scripts de llamada, WhatsApp y email
- recomendaciones de siguiente mejor acción
- creación asistida de notas, tareas y eventos con confirmación
- memoria corta y contexto por broker

### Dependencias técnicas

- AI Copilot Service
- tool calling
- context builder
- audit log
- guardrails

### Estimación

- 2 semanas
- 15 a 18 persona-días

### Equipo sugerido

- 1 IA Engineer
- 1 Backend
- 1 Mobile FE
- 1 UX

### Criterios de aceptación

- El agente responde sobre datos reales del broker.
- El agente no inventa datos cuando no tiene contexto.
- El agente puede guiar, resumir, priorizar y generar scripts útiles.
- Toda acción sugerida o ejecutada deja rastro auditable.

### Curso 7. Calendario + Ejecución Diaria

### Objetivo

Convertir la agenda en un motor de disciplina comercial.

### Funcionalidades a entregar

- vista hoy
- vista semana
- eventos y recordatorios
- asociación evento-lead
- sync con Google Calendar
- agenda inteligente por prioridad

### Dependencias técnicas

- calendar service
- Google OAuth
- notifications

### Estimación

- 1.5 semanas
- 10 a 12 persona-días

### Equipo sugerido

- 1 Mobile FE
- 1 Backend

### Criterios de aceptación

- El broker crea y modifica eventos desde el móvil.
- Las citas críticas se sincronizan y recuerdan.
- La agenda se puede consultar y ejecutar rápidamente.

### Curso 8. Landing + Automatizaciones + Launch

### Objetivo

Cerrar el loop de captación + seguimiento + release productivo.

### Funcionalidades a entregar

- landing simple personalizable del broker
- formulario lead magnet
- entrada automática de leads al CRM
- automatizaciones básicas por email y WhatsApp
- workflows iniciales en n8n
- QA, beta, publicación y checklist de lanzamiento

### Dependencias técnicas

- landing service
- public web routes
- n8n
- email provider
- deep links / WhatsApp

### Estimación

- 2 semanas
- 12 a 15 persona-días

### Equipo sugerido

- 1 Backend
- 1 IA / Automation
- 1 Mobile FE / Web
- 1 QA
- 1 DevOps parcial

### Criterios de aceptación

- Un broker puede compartir su landing.
- Los leads entran automáticamente al CRM.
- Existen workflows básicos de seguimiento.
- La app queda lista para beta y release controlado.

## MVP y Roadmap Temporal

### MVP (versión 1.0)

### Alcance mínimo para lanzamiento en 8 a 12 semanas

- autenticación y onboarding
- dashboard inteligente v1
- módulo de leads y pipeline
- importación CSV
- importación de contactos del teléfono
- share/captura simple desde WhatsApp
- agente IA conversacional
- insights IA por lead
- scripts comerciales
- calendario
- Google Calendar
- automatizaciones básicas
- landing simple del broker
- analytics personales
- push notifications
- soporte offline básico
- gamificación personal ligera

### Fuera del MVP

- agencia y multiusuario
- campañas masivas
- editor avanzado de plantillas email
- marketing automation complejo
- lectura automática de chats personales de WhatsApp
- administración avanzada

### Roadmap a 3, 6 y 12 meses

| Horizonte | Entregables |
|-----------|-------------|
| 3 meses | MVP estable, Dashboard Inteligente v1, Agente IA v1, importación contactos/CSV, calendario, landing simple, automatizaciones base |
| 6 meses | Voice notes, Share Extension, inbox inteligente, WhatsApp Business Cloud API, forecast personal, mejores analytics |
| 12 meses | IA multimodal, matching lead-propiedad, checklist de cierre, forecast de comisión, automatizaciones avanzadas, playbooks dinámicos |

## Estimaciones Detalladas

### Tiempo total estimado

- 10 a 12 semanas calendario
- 65 a 80 persona-semanas
- 1 beta cerrada de 2 semanas

### Equipo recomendado

- 1 Senior Product Manager / Architect
- 1 Product Designer
- 2 Mobile Frontend Engineers
- 1 Backend Engineer
- 1 AI / Automation Engineer
- 1 QA part-time
- 1 DevOps part-time

### Riesgos principales y mitigación

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Scope creep desde el CRM actual | Alto | Kill list explícita y backlog independiente |
| Deuda del backend actual | Alto | Pocket API/BFF y contratos claros |
| IA poco útil o genérica | Alto | Reglas duras + contexto real + tool calling |
| Riesgos legales/compliance de WhatsApp | Alto | APIs oficiales y share manual; no scraping |
| Mala experiencia offline | Medio | SQLite + cola de sync + conflictos visibles |
| Retrasos de App Store / Play Store | Medio | Permisos mínimos y beta temprana |

## Plan Detallado de Automatizaciones e IA

### Arquitectura del Dashboard Inteligente

El Dashboard Inteligente es la funcionalidad más importante del producto.

### Componentes del dashboard

- resumen del día
- prioridad de leads
- citas de hoy
- tareas recomendadas
- avance contra meta semanal
- avance contra meta mensual
- pipeline value personal
- streak y hábitos
- recordatorios críticos

### KPIs y OKRs recomendados

#### KPIs

- Leads nuevos por semana
- First response time
- Contact rate
- Follow-up SLA
- Citas agendadas
- Citas realizadas
- Show-up rate
- Leads estancados
- Pipeline value ponderado
- Close rate
- Ingreso / comisión estimada

#### OKRs

- Cerrar X operaciones por mes
- Agendar X citas por semana
- Mantener 90% de leads con seguimiento en menos de 24 horas
- Alcanzar ingreso objetivo mensual
- Mantener streak de actividad comercial diaria

### Arquitectura del Agente IA conversacional

El agente IA debe ser el `copiloto principal` del broker.

### Qué debe poder hacer

- responder sobre cualquier lead
- responder sobre pipeline completo
- responder sobre calendario y citas
- resumir el estado comercial del broker
- explicar riesgos y oportunidades
- generar scripts
- redactar borradores de WhatsApp y email
- proponer siguiente mejor acción
- crear tareas, notas y eventos con confirmación
- ayudar a planear el día, la semana y el mes

### Arquitectura propuesta

```text
1. Data Collector
   leads + activities + pipeline + calendar + goals + metrics + streaks

2. Metrics Engine
   calcula KPIs, gaps, aging y score operativo

3. Rules Engine
   prioriza alertas duras:
   - hot leads sin contacto
   - citas hoy
   - leads estancados
   - metas atrasadas

4. Context Builder
   arma el contexto resumido para cada conversación

5. LLM Planner + Conversational Agent
   responde, resume, guía y genera scripts

6. Action Layer
   con confirmación:
   - crear tarea
   - crear nota
   - crear evento
   - mover lead de etapa
   - redactar mensajes
```

### Herramientas del agente

- `get_leads`
- `get_lead_detail`
- `get_pipeline_summary`
- `get_today_agenda`
- `get_metrics`
- `generate_script`
- `create_note`
- `create_task`
- `create_calendar_event`
- `draft_whatsapp`
- `draft_email`
- `update_lead_stage`

### Guardrails

- la IA no envía mensajes sin confirmación humana,
- la IA no inventa datos cuando no los tiene,
- toda acción queda auditada,
- toda sugerencia debe poder rastrearse a datos reales del CRM.

### Flujos de automatización recomendados con n8n

| Flujo | Trigger | Acción | Resultado esperado |
|-------|---------|--------|-------------------|
| Nuevo lead inbound | Formulario landing o importación | dedupe -> score -> crear tarea -> push | respuesta rápida |
| Lead caliente sin seguimiento | score alto y 24h sin actividad | push + borrador de WhatsApp/email | menor fuga |
| Confirmación de visita | evento para mañana | recordatorio al broker + confirmación al cliente | menos no-shows |
| Post-visita | evento completado | tarea + script de seguimiento | más consistencia |
| Reactivación de lead frío | 14 a 30 días sin contacto | sugerencia + borrador + tarea | recuperación de pipeline |

### Estrategia de automatizaciones básicas

Pocket debe permitir:

- seleccionar uno o varios leads,
- elegir plantilla corta de follow-up,
- enviar o preparar email,
- abrir WhatsApp con mensaje sugerido,
- disparar un workflow frecuente de Real Estate.

Casos de uso prioritarios:

- seguimiento a lead nuevo
- reactivación de lead frío
- confirmación de cita
- seguimiento post-visita
- envío de brochure / disponibilidad

### WhatsApp: viabilidad y recomendación

### Viable

- abrir WhatsApp con deep links,
- usar share sheet desde WhatsApp hacia Pocket,
- usar WhatsApp Business Cloud API para cuentas de negocio,
- analizar texto exportado o compartido por el usuario.

### No recomendado

- lectura automática de chats personales o grupos,
- scraping,
- APIs no oficiales,
- funciones que pongan en riesgo App Store o Play Store.

### Otras propuestas valiosas para un broker mobile-first

- Smart Follow-up Inbox
- Voice Notes to CRM
- Visit Mode
- Share Extension
- Forecast personal de cierres y comisión

## Estrategia Mobile-First y UX

### Navegación recomendada

- Bottom tab bar:
  - Inicio
  - Leads
  - Agenda
  - IA
  - Perfil

- FAB central:
  - nuevo lead
  - importar
  - nueva nota
  - nuevo evento

### Principios UX

- máximo 3 toques para acciones de alto valor,
- lead detail como pantalla central,
- dashboard accionable, no solo informativo,
- agente IA siempre accesible,
- swipe actions para llamar, WhatsApp, agendar y registrar.

### Soporte offline

- lectura offline de leads, agenda, notas y scripts,
- cola local para cambios,
- sincronización al recuperar red,
- indicador claro de pendientes.

### Push notifications

- resumen matutino,
- lead caliente sin respuesta,
- cita próxima,
- tarea vencida,
- meta semanal en riesgo.

### Objetivos de performance

- cold open menor a 2.5 segundos
- lista de leads visible en menos de 1 segundo
- detalle de lead cacheado menor a 400 ms
- respuestas del agente IA entre 2 y 6 segundos en casos comunes

## Testing, CI/CD y Despliegue

### Testing

- unit tests para lógica de planner, KPIs y dedupe
- contract tests entre app y Pocket API
- E2E mobile con Maestro
- E2E web con Playwright
- smoke tests backend
- beta cerrada con brokers reales

### CI/CD

- GitHub Actions para lint, test y quality gates
- EAS Build para Android/iOS
- EAS Submit para distribución
- EAS Update para fixes OTA
- Docker para backend y n8n por entorno

### Despliegue

- Android:
  - Internal Testing
  - Closed Beta
  - Production

- iOS:
  - TestFlight interno
  - TestFlight externo
  - App Store

- WebApp:
  - PWA instalable
  - deep links
  - auth segura

- Landing:
  - URL pública del broker
  - formulario conectado al CRM

## Próximos Pasos Inmediatos (próximas 2 semanas)

- Aprobar la decisión de arquitectura y repos separados.
- Congelar el scope MVP.
- Definir el naming final del agente IA.
- Diseñar los 6 flujos críticos:
  - login
  - home
  - lead detail
  - chat IA
  - agenda
  - importación
- Crear el repo `rovi-pocket`.
- Crear contratos iniciales de Pocket API.
- Auditar y separar endpoints reutilizables del backend actual.
- Diseñar el Dashboard Inteligente v1.
- Diseñar el módulo de Agente IA conversacional.
- Definir estrategia oficial de WhatsApp para MVP y Fase 2.
- Crear los primeros workflows base de n8n.
- Configurar Sentry, PostHog y métricas del producto.
- Reclutar 10 a 15 brokers para la beta.

## Supuestos y decisiones pendientes

### Supuestos de este plan

- Inicio operativo estimado: 6 de abril de 2026.
- Equipo mínimo disponible: 5 a 6 personas.
- El backend actual se mantiene como base en el MVP.
- El módulo de campañas masivas queda fuera del alcance.

### Decisiones pendientes

- nombre comercial final de la app,
- proveedor definitivo de email simple,
- estrategia exacta de WhatsApp para MVP,
- definición del stack de landing pública,
- alcance final de voice notes para fase 2.
