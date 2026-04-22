# Requisitos funcionales, técnicos e infraestructura — Rovi CRM

## 1. Alcance del producto (recordatorio)

CRM inmobiliario multi-tenant (**tenant por usuario**), orientado a brokers individuales y agencias: leads, pipeline, campañas, calendario, integraciones (VAPI, Twilio, SendGrid, Google), gamificación (agencias), IA asistida (chat, análisis de leads, perfil IA).

---

## 2. Requisitos funcionales (por área)

### 2.1 Autenticación y cuenta

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-AUTH-01 | Registro e inicio de sesión con JWT | Alta |
| RF-AUTH-02 | Perfil de usuario y renovación de sesión | Alta |
| RF-AUTH-03 | Onboarding obligatorio hasta marcar completado | Alta |
| RF-AUTH-04 | Tipo de cuenta: `individual` vs `agency` (menú y features diferenciados) | Alta |

### 2.2 Leads y pipeline

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-LEAD-01 | CRUD de leads, filtrado por tenant | Alta |
| RF-LEAD-02 | Pipeline por estados (Kanban / tabla) | Alta |
| RF-LEAD-03 | Actividades asociadas a leads | Alta |
| RF-LEAD-04 | Análisis asistido por IA y generación de scripts (según configuración) | Media |

### 2.3 Importación

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-IMP-01 | Carga CSV/XLSX, mapeo de columnas, preview, ejecución | Alta |
| RF-IMP-02 | Detección de duplicados (email/teléfono según implementación) | Alta |

### 2.4 Campañas y comunicaciones

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-CAMP-01 | Campañas tipo llamadas / SMS / email | Alta |
| RF-CAMP-02 | Envíos puntuales (single) para pruebas | Media |
| RF-CAMP-03 | Plantillas de email con editor visual | Media |

### 2.5 Calendario

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-CAL-01 | Eventos en CRM | Alta |
| RF-CAL-02 | OAuth Google Calendar, sync de eventos | Media |
| RF-CAL-03 | Round-robin y asignación (agencias) | Media |

### 2.6 Equipo y gamificación (agencia)

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-TEAM-01 | Listado y detalle de brokers | Alta |
| RF-GAMI-01 | Reglas, puntos, leaderboard en dashboard | Media |

### 2.7 Analíticas y automatizaciones

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-ANA-01 | Resúmenes, timeline, export | Media |
| RF-AUTO-01 | Workflows de automatización (configuración y ejecución) | Media |

### 2.8 Público y captación

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-PUB-01 | Landing y formulario de solicitud de demo / contacto | Media |
| RF-PUB-02 | Endpoint de captura de leads desde landing | Media |

### 2.9 Fuera de alcance típico del MVP (salvo proyecto aparte)

- Portal dedicado para inversionistas finales.  
- Cumplimiento regulatorio (LMV) automatizado dentro del CRM.  
- Modelos ML entrenados ad-hoc por cliente sin datos y sin fase de proyecto.

---

## 3. Requisitos técnicos

### 3.1 Stack

| Componente | Tecnología |
|------------|------------|
| API | Python 3.11, FastAPI, Uvicorn |
| Base de datos | MongoDB 7 (Motor async) |
| Frontend | React 19, Tailwind, shadcn/ui, React Router |
| Auth | JWT (HS256), hash de contraseñas |
| Contenedores | Docker, Docker Compose |
| CI/CD | GitHub Actions, GHCR |

### 3.2 API

- Prefijo global: `/api`.  
- Endpoints de salud: `/api/health`.  
- Aislamiento multi-tenant mediante `tenant_id` en consultas.

### 3.3 Variables de entorno (backend) — referencia

Los nombres exactos pueden variar según `server.py` y compose; validar en despliegue.

| Variable | Uso |
|----------|-----|
| `MONGO_URL` | Cadena de conexión MongoDB |
| `DB_NAME` | Nombre de base de datos |
| `JWT_SECRET` | Firma de tokens |
| `CORS_ORIGINS` | Orígenes permitidos (coma-separados) |
| `EMERGENT_LLM_KEY` | Clave para servicios de IA (OpenAI / integración emergent) |

Integraciones habituales (según UI de Settings): credenciales VAPI, Twilio, SendGrid; tokens OAuth almacenados para Google.

### 3.4 Frontend

| Variable | Uso |
|----------|-----|
| `REACT_APP_BACKEND_URL` | URL base del API en desarrollo/build |

### 3.5 Rendimiento y límites (orientativo)

- Definir con el cliente límites de envío SMS/email para no incurrir en bloqueos de proveedor.  
- Mongo: índices en colecciones de alto volumen (leads, actividades) según uso real.

---

## 4. Infraestructura

### 4.1 Topología lógica

```
Internet → DNS → Nginx (opcional TLS) → Frontend (React estático)
                                    → Backend (FastAPI) → MongoDB
                                    → Integraciones externas (Twilio, SendGrid, VAPI, Google, OpenAI)
```

### 4.2 Entornos documentados en el repo

| Entorno | Uso | Referencia |
|---------|-----|------------|
| Producción | Clientes finales | `docker-compose.hostinger.yml`, `deploy/nginx-production.conf` |
| Development | Pruebas internas | `docker-compose.dev.yml` |
| Preview | QA / demos | `docker-compose.preview.yml` |

Detalle de URLs y puertos: [DEPLOYMENT_URLS.md](./DEPLOYMENT_URLS.md).

### 4.3 Servidor (VPS)

- **CPU/RAM:** mínimo razonable para demo 2 vCPU / 4 GB RAM; producción con varios usuarios e integraciones: valorar 4 vCPU / 8 GB según carga.  
- **Disco:** SSD; monitorear crecimiento de Mongo y logs.  
- **Red:** puertos 80/443 abiertos; SSH restringido por clave.

### 4.4 Base de datos

- MongoDB en contenedor con **volumen persistente** o servicio gestionado (Atlas) si se migra la cadena `MONGO_URL`.  
- **Backup:** copias periódicas (script `backup.sh` en `deploy/` o backup del proveedor).

### 4.5 Seguridad

| Tema | Recomendación |
|------|----------------|
| Secretos | Solo en servidor/ GitHub Secrets; rotar JWT si compromiso |
| HTTPS | Obligatorio en producción con usuarios reales |
| CORS | Orígenes explícitos; no `*` en prod |
| Dependencias | Actualizar imágenes base y paquetes con calendario definido |

### 4.6 Observabilidad (mínimo viable)

- Logs de contenedores (`docker compose logs`).  
- Health check automatizado post-deploy (ya en workflow de GitHub Actions).  
- Opcional: uptime externo (UptimeRobot, etc.) apuntando a `/api/health`.

---

## 5. Criterios de aceptación del go-live técnico

- [ ] Health check OK en producción.  
- [ ] Login y flujo principal sin errores en navegador objetivo.  
- [ ] CORS correcto con la URL final (http/https).  
- [ ] Backup configurado o plan documentado.  
- [ ] Lista de secretos y responsables internos actualizada.  
