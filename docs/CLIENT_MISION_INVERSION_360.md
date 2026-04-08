# Cliente piloto: Misión Inversión 360 — charter técnico y operativo

**Estado:** Alcance definido por producto · Pendientes marcados con `[ ]`  
**Última actualización:** Abril 2026

---

## 1. Resumen ejecutivo

| Campo | Valor acordado |
|--------|----------------|
| **Operación** | Desarrollo inmobiliario (Mérida); captación de inversionistas (ticket desde **$500,000 MXN**) vía **webinars** |
| **Modelo comercial** | Agencia — **Plan Pro**; multi-tenant; hasta **~10 usuarios** en piloto (validar licenciamiento vs deck 5 usuarios) |
| **Meta operativa** | **Speed-to-lead &lt; 5 min** en el ciclo del webinar |
| **Entorno** | **Producción** para beta cerrada + **piloto 30 días** (estrategia ya documentada) |
| **Dominio** | **Dominio propio + HTTPS**; la URL pública dejará de ser solo `srv1318804...` (el mismo VPS puede servir el nuevo dominio vía DNS A + Nginx) |
| **Orquestación externa** | **n8n** para cadencias y flujos (ver sección 5 — estado en producto) |

---

## 1.1 VPS Hostinger — confirmado (operación)

Datos del servidor asignado al piloto (abril 2026). **No compartir** fuera del equipo; si el repo es público, quitar IP en un commit.

| Campo | Valor |
|--------|--------|
| **Proveedor / plan** | Hostinger **KVM 2** |
| **CPU / RAM / disco** | **2 vCPU** · **8 GB RAM** · **100 GB** |
| **Ubicación** | United States — Phoenix |
| **Sistema operativo** | **Ubuntu 25.10** |
| **Nombre de host** | `srv1318804.hstgr.cloud` |
| **Usuario SSH** | `root` |
| **IPv4** | `31.220.63.211` (registro **A** del dominio propio → esta IP) |
| **Renovación del plan** | **2026-04-15** (renovación automática activada — revisar facturación antes de esa fecha) |
| **Uptime referencia** | ~6 días desde el alta (servidor reciente) |

**Capacidad:** 2 vCPU y 8 GB son **suficientes para un piloto** con Docker (backend + frontend + Mongo) y tráfico moderado. Si el consumo de CPU/RAM sube (muchas campañas + IA), monitorizar y valorar upgrade a plan con más núcleos.

**Ubuntu 25.10:** es más reciente que el LTS típico (22.04/24.04). **Docker Engine** y **Compose** suelen instalarse sin problema; si algo falla en instalación, documentar el error y probar con el [script oficial de Docker](https://docs.docker.com/engine/install/ubuntu/).

**Arquitectura recomendada aquí:** **Opción A** (Docker Compose del repo) en este VPS; Nginx en el host o contenedor según tu `deploy/` para TLS y proxy al dominio final.

---

## 2. Alcance MVP — semana 1 (imprescindible)

| Módulo | Incluido | Notas |
|--------|----------|--------|
| Pipeline Kanban + leads | Sí | Multi-broker por tenant |
| Importación CSV/XLSX | Sí | Base histórica + limpieza |
| Email (SendGrid) | Sí | Cadencia de nutrición (10 días en estrategia) |
| SMS (Twilio) | Sí | Recordatorios webinar |
| Llamadas IA (VAPI) | Sí | Cualificación inmediata |
| Google Calendar (OAuth2) | Sí | Citas / cierre |
| Gamificación | Sí | Leaderboards y medallas (cuenta **agency**) |
| Round Robin | Sí | Asignación inteligente (API y calendario — validar UX en piloto) |
| Formulario web / landing | Sí | Inyección de leads campaña + registro webinar (`/api/landing/lead` y flujos existentes) |
| Automatizaciones **dentro** de Rovi | Parcial | Workflows en app; integración **n8n** vía webhooks (pendiente cierre técnico) |

---

## 3. Infraestructura: alinear guía interna con este repositorio

Tu nota interna menciona **PM2 + Nginx** y **MongoDB Atlas**. La guía oficial de **este repo** está basada en:

- **Docker Compose** (backend FastAPI + frontend nginx + **MongoDB en contenedor** en `docker-compose.hostinger.yml`), y  
- **GitHub Actions → SSH** + pull de imágenes **GHCR** (según workflows).

**Recomendación para reducir riesgo en el piloto:**

| Opción | Descripción | Cuándo usarla |
|--------|-------------|----------------|
| **A — Estándar repo (recomendada para piloto)** | VPS con Docker; Mongo en volumen local o, si preferís Atlas, cambiar `MONGO_URL` en el compose para apuntar a Atlas y **no** levantar servicio `mongodb` | Menos divergencia con CI/CD y documentación actual |
| **B — Atlas + procesos sin Docker** | PM2 para `uvicorn` + build estático del frontend; Nginx reverse proxy; Mongo solo Atlas | Requiere **runbook propio** (no está el compose completo para PM2 en este repo) |

**Nginx + SSL:** En ambos casos el patrón es **Nginx como reverse proxy** hacia frontend (puerto publicado) y API (backend), con **Let’s Encrypt** en el VPS o **Cloudflare** (proxy + certificados). Tras definir el dominio final, actualizar **`CORS_ORIGINS`** con `https://tudominio.com` (y subdominios si aplica).

**Acción IT:** Elegir **A o B** por escrito antes del primer deploy con dominio propio.

---

## 4. Integraciones — checklist (rellenar sin pegar secretos en chats)

Marcar internamente y guardar claves solo en `.env` / GitHub Secrets:

| Servicio | Estado | Uso en piloto |
|----------|--------|----------------|
| [ ] SendGrid | Ya / Aún no | Nutrición email |
| [ ] Twilio | Ya / Aún no | SMS recordatorios |
| [ ] VAPI | Ya / Aún no | Llamadas IA |
| [ ] Google Cloud (OAuth Calendar) | Ya / Aún no | Agenda |
| [ ] IA (`EMERGENT_LLM_KEY` / OpenAI) | Ya / Aún no | Análisis y scripts |

---

## 5. n8n y Rovi (transparencia técnica)

En el backend existen modelos y rutas de **automatizaciones** pensadas para enlazar **workflows n8n** (`n8n_webhook_url`, `n8n_workflow_id`). Varias acciones tienen **TODO** en código (activación/desactivación/test vía webhook real).

**Para el piloto con n8n:**

1. Desplegar instancia **n8n** (mismo VPS o servicio gestionado).  
2. Definir flujos que llamen la **API REST de Rovi** (crear actividad, mover lead, disparar campaña según endpoints existentes) o webhooks entrantes hacia n8n desde formularios.  
3. Planificar un **sprint corto** para cerrar los TODO de activación n8n **o** operar el piloto con orquestación manual/n8n solo por HTTP nodes sin depender de esos TODO.

**Acción:** Asignar a dev un issue: “Integración piloto Misión Inversión 360 — n8n ↔ API Rovi”.

---

## 6. Equipo y datos — completar

| Rol | Dato | Estado |
|-----|------|--------|
| Admin / Manager | Email | `[ ]` |
| Brokers (2–3 en piloto) | Emails | `[ ]` |
| Origen leads | Excel/CSV + formulario web + registro webinar | Acordado |
| Kickoff con cliente | Fecha y hora | `[ ]` |

---

## 7. Próximos pasos ordenados (para tu equipo)

1. **Confirmar VPS** (p. ej. 4 vCPU / 8 GB, Ubuntu 22.04) y **opción de arquitectura** (A Docker vs B PM2).  
2. **Registrar dominio** y decidir **Let’s Encrypt en servidor** vs **Cloudflare**.  
3. **Completar checklist de integraciones** y crear claves.  
4. **Actualizar secretos GitHub** y `.env` de producción con `CORS_ORIGINS` y URLs del nuevo dominio.  
5. **Deploy** siguiendo [GO_LIVE_AND_CLIENT_SETUP.md](./GO_LIVE_AND_CLIENT_SETUP.md) y [DEPLOYMENT_URLS.md](./DEPLOYMENT_URLS.md) (ajustando hosts al dominio nuevo).  
6. **Alta de usuarios** agency + prueba de gamificación + round-robin.  
7. **Kickoff** con checklist [EXECUTION_CHECKLIST.md](./EXECUTION_CHECKLIST.md) Fase 4.

---

## 8. Enlaces internos

- [EXECUTION_CHECKLIST.md](./EXECUTION_CHECKLIST.md)  
- [REQUIREMENTS_AND_INFRASTRUCTURE.md](./REQUIREMENTS_AND_INFRASTRUCTURE.md)  
- [TOOLS_PRICING_CHECKLIST.md](./TOOLS_PRICING_CHECKLIST.md)  
- [SPRINT_USER_STORIES_QA.md](./SPRINT_USER_STORIES_QA.md)  
