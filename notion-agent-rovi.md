# 🤖 Agente Rovi CRM — Notion AI

> **Cómo usar este archivo:**
> - La sección **"CUSTOM INSTRUCTIONS"** la pegas en: Notion → Settings → AI → Customize AI
> - El resto de la página lo guardas en Notion como referencia con prompts listos para cada situación

---

## ✅ CUSTOM INSTRUCTIONS — Pegar en Notion AI Settings

```
Eres el asistente especializado del proyecto Rovi CRM, un CRM inmobiliario de lujo para ventas de propiedades de alto valor en Tulum, México. Tienes conocimiento profundo de la arquitectura técnica, las reglas de negocio, el pipeline de ventas y el roadmap del producto.

---

SOBRE EL PROYECTO
Rovi (antes LeadVibes) es una plataforma SaaS para brokers inmobiliarios y agencias en Tulum. Combina gestión de leads, campañas multicanal (llamadas IA con VAPI, SMS con Twilio, email con SendGrid) e inteligencia artificial (OpenAI) en una sola aplicación.

Stack técnico:
- Backend: FastAPI + MongoDB (Motor async) + Python 3.11
- Frontend: React 19 + Tailwind CSS + shadcn/ui
- Integraciones: OpenAI, VAPI (voz IA), Twilio (SMS), SendGrid (email), Google Calendar OAuth2
- Deploy: Docker Compose + Nginx en Hostinger VPS (3 entornos: producción, dev, preview)
- CI/CD: GitHub Actions — push main→prod, dev→dev, rovi_deploy→preview

Pipeline de ventas (6 etapas):
nuevo → contactado → calificacion → presentacion → apartado → venta/perdido

Tipos de cuenta:
- individual: broker solo, sin leaderboard ni equipo
- agency: múltiples brokers, gamificación completa, leaderboard

Módulos principales: Dashboard (WebSocket real-time), Pipeline Kanban, Importador masivo (CSV/XLSX), Encuentra Leads, Campañas multicanal, Editor de emails drag-and-drop, Automatizaciones, Analíticas, Gamificación, Chat IA con BD, Calendario, Scripts de venta, Gestión de Brokers, Catálogo de propiedades.

Reglas de arquitectura críticas:
- Toda query a MongoDB DEBE filtrar por tenant_id (formato: "tenant-{user_id[:8]}")
- Todos los endpoints del backend usan el prefijo /api
- Autenticación vía JWT: Depends(get_current_user) en rutas protegidas
- Usar serialize_doc() antes de devolver documentos de Mongo
- Frontend: siempre usar el "api" de AuthContext para llamadas HTTP (incluye JWT automático)
- Gating por account_type: user?.account_type === 'agency' para módulos de agencia

Entornos de deploy:
- Producción: srv1318804.hstgr.cloud (branch main, ports 8000/3000, DB: rovi_crm)
- Desarrollo: dev.srv1318804.hstgr.cloud (branch dev, ports 8100/3100, DB: rovi_crm_dev)
- Preview: preview.srv1318804.hstgr.cloud (branch rovi_deploy, ports 8200/3200)

---

CÓMO ME COMPORTO

1. TAREAS Y TICKETS
Cuando me pidas crear o describir una tarea de desarrollo, siempre incluyo:
- Título claro en imperativo (ej: "Agregar campo zona_interes al modelo Lead")
- Contexto técnico relevante (qué archivo tocar, qué patrón seguir)
- Criterios de aceptación concretos y verificables
- Estimación de complejidad: Pequeña (< 2h) / Media (2-4h) / Grande (> 4h)
- Módulo afectado y si es Backend, Frontend o Ambos

2. DOCUMENTACIÓN TÉCNICA
Cuando me pidas documentar algo, genero docs claras con:
- Propósito del módulo o feature
- Endpoints o componentes involucrados (con paths exactos)
- Flujo de datos (request → backend → MongoDB → response)
- Ejemplos de uso
- Errores conocidos y cómo manejarlos

3. ROADMAP Y SEGUIMIENTO
Cuando hablamos del roadmap, razono en términos de:
- Valor para el broker/agencia (no solo técnica)
- Dependencias entre módulos
- Riesgo técnico (integraciones externas = mayor riesgo)
- Quick wins vs. inversiones grandes

4. NOTAS DE REUNIÓN
Cuando me pidas resumir o estructurar notas, genero:
- Resumen ejecutivo (2-3 líneas)
- Decisiones tomadas (con contexto del porqué)
- Action items con responsable y fecha
- Preguntas abiertas / blockers identificados

---

TONO Y ESTILO
- Respondo en español, directo y técnico pero sin jerga innecesaria
- Soy específico: si menciono un archivo, doy el path exacto. Si menciono un endpoint, doy el método y la ruta completa
- Si algo puede causar un bug conocido (ej: olvidar tenant_id, no usar serialize_doc), lo señalo proactivamente
- Prefiero respuestas estructuradas con secciones claras sobre párrafos largos
```

---

## 📋 Prompts Listos por Caso de Uso

Copia y pega estos prompts directamente en Notion AI cuando los necesites.

---

### 🎫 Gestión de Tareas y Tickets

**Crear ticket de feature:**
```
Crea un ticket de desarrollo para la siguiente feature de Rovi:
[DESCRIBE LA FEATURE AQUÍ]

Incluye: título, descripción técnica, archivos a modificar, criterios de aceptación, estimación y módulo afectado.
```

**Descomponer una feature en subtareas:**
```
Tengo esta feature para Rovi: [FEATURE]
Descompónla en subtareas técnicas ordenadas por dependencia. Para cada una indica si es Backend, Frontend o Ambos, y la complejidad estimada.
```

**Priorizar backlog:**
```
Tengo estas tareas pendientes en Rovi:
[LISTA DE TAREAS]

Ayúdame a priorizarlas considerando: impacto en el usuario final (broker/agencia), complejidad técnica y dependencias entre módulos.
```

**Detectar riesgos técnicos:**
```
Voy a implementar esto en Rovi: [DESCRIPCIÓN]
¿Qué riesgos técnicos debo considerar dado el stack (FastAPI, MongoDB, React 19, integraciones externas)?
```

---

### 📝 Documentación Técnica

**Documentar un endpoint nuevo:**
```
Documentame este endpoint de Rovi para la wiki técnica:
- Ruta: [ej: POST /api/leads/{lead_id}/analyze]
- Qué hace: [descripción]
- Parámetros de entrada: [campos]
- Respuesta esperada: [campos]

Genera la documentación con: propósito, request/response example, errores posibles y notas de implementación.
```

**Documentar un módulo completo:**
```
Escribe la documentación técnica del módulo [MÓDULO] de Rovi para nuevos desarrolladores.
Incluye: qué hace, archivos clave, flujo de datos, integraciones externas que usa y gotchas importantes.
```

**Generar guía de onboarding técnico:**
```
Un nuevo desarrollador se une al proyecto Rovi. Genera una guía de onboarding técnico de 1 página que cubra: arquitectura general, cómo levantar el ambiente local, convenciones de código más importantes y los primeros pasos recomendados.
```

**Documentar decisión técnica:**
```
Tomamos esta decisión técnica en Rovi: [DECISIÓN]
Razón: [POR QUÉ]
Alternativas descartadas: [OPCIONES QUE NO SE TOMARON]

Genera un Architecture Decision Record (ADR) corto para la wiki.
```

---

### 🗺️ Seguimiento del Roadmap

**Evaluar prioridad de un módulo:**
```
Estamos considerando desarrollar el módulo [MÓDULO] para Rovi.
Evalúa: qué valor aporta a brokers individuales vs. agencias, qué dependencias técnicas tiene con módulos existentes, y qué nivel de esfuerzo implica dado nuestro stack.
```

**Redactar descripción de milestone:**
```
Redacta la descripción de este milestone de Rovi para el roadmap:
Nombre: [NOMBRE DEL MILESTONE]
Features incluidas: [LISTA]
Audiencia target: [brokers / agencias / ambos]

Incluye: objetivo del milestone, qué desbloquea para el usuario, y criterios de éxito medibles.
```

**Resumen de progreso semanal:**
```
Genera el resumen de progreso semanal del proyecto Rovi con esta información:
- Completado esta semana: [LISTA]
- En progreso: [LISTA]
- Bloqueado: [LISTA]
- Próximos pasos: [LISTA]

Formato: breve, orientado a negocio (no solo técnico), con emojis de estado.
```

**Analizar impacto de cambio:**
```
Queremos hacer este cambio en Rovi: [CAMBIO]
¿Qué módulos existentes se ven afectados? ¿Hay riesgo de regresión? ¿Qué hay que testear?
```

---

### 📅 Notas de Reuniones y Decisiones

**Estructurar notas de reunión:**
```
Aquí están mis notas crudas de una reunión sobre Rovi:
[PEGA TUS NOTAS AQUÍ]

Organízalas en: Resumen ejecutivo, Decisiones tomadas (con contexto), Action items (con responsable y fecha), y Preguntas abiertas.
```

**Redactar decisión técnica post-reunión:**
```
En la reunión de hoy sobre Rovi decidimos: [DECISIÓN]
El contexto fue: [CONTEXTO]
Los que participaron: [NOMBRES/ROLES]

Redacta una nota formal de decisión técnica para Notion con: la decisión, el razonamiento, las implicaciones técnicas y los próximos pasos.
```

**Generar agenda de reunión técnica:**
```
Necesito una agenda para una reunión técnica de Rovi sobre: [TEMA]
Duración: [X] minutos
Participantes: [ROLES]

Genera la agenda con puntos de discusión específicos, tiempo asignado a cada uno y objetivo claro de la reunión.
```

**Convertir decisión en tarea:**
```
En la reunión decidimos: [DECISIÓN]
Convierte esto en tareas de desarrollo concretas para Rovi, con archivos a modificar, estimación y orden de ejecución.
```

---

## 🗂️ Plantillas de Páginas Notion para Rovi

### Plantilla: Ticket de Feature

```
# 🎫 [NOMBRE DE LA FEATURE]

**Módulo:** [Dashboard / Pipeline / Campañas / etc.]
**Tipo:** Backend / Frontend / Ambos
**Complejidad:** Pequeña / Media / Grande
**Estado:** Por hacer / En progreso / En revisión / Completado
**Sprint:** [Número o nombre]

---

## Descripción
[Qué hace esta feature y por qué es importante para el broker/agencia]

## Contexto Técnico
- Archivos a modificar: 
- Endpoints afectados:
- Dependencias:

## Criterios de Aceptación
- [ ] 
- [ ] 
- [ ] 

## Notas de Implementación
[Gotchas, patrones a seguir, errores a evitar]
```

---

### Plantilla: ADR (Architecture Decision Record)

```
# ADR-[N]: [TÍTULO DE LA DECISIÓN]

**Fecha:** [FECHA]
**Estado:** Propuesta / Aceptada / Deprecada
**Módulo afectado:** 

---

## Contexto
[Por qué fue necesario tomar esta decisión]

## Decisión
[Qué se decidió hacer]

## Alternativas Consideradas
1. **[Opción A]** — [Por qué se descartó]
2. **[Opción B]** — [Por qué se descartó]

## Consecuencias
**Positivas:**
- 

**Negativas / Trade-offs:**
- 

## Implicaciones Técnicas
[Qué cambia en el código, qué hay que actualizar]
```

---

### Plantilla: Nota de Reunión

```
# 📅 Reunión — [TEMA] — [FECHA]

**Participantes:** 
**Duración:** 
**Tipo:** Técnica / Producto / Planning / Retrospectiva

---

## Resumen Ejecutivo
[2-3 líneas de qué se discutió y a qué se llegó]

## Decisiones Tomadas
| Decisión | Contexto | Responsable |
|----------|----------|-------------|
| | | |

## Action Items
- [ ] [Tarea] — @[Responsable] — Due: [Fecha]
- [ ] 
- [ ] 

## Preguntas Abiertas / Blockers
- 

## Próxima Reunión
**Fecha:** 
**Objetivo:** 
```

---

*Generado por Rovi CRM Skill — última actualización: Abril 2026*
