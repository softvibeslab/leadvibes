# Go-live, setup con el cliente (DWY) y operación continua

## 1. Objetivo

Dejar **Rovi CRM** en producción de forma repetible y realizar el **acompañamiento al primer cliente** (configuración, datos, integraciones, formación) sin ambigüedad de alcance.

---

## 2. Fases del plan (resumen)

| Fase | Nombre | Duración orientativa |
|------|--------|----------------------|
| A | Pre-requisitos y entorno | 1–3 días |
| B | Infraestructura y despliegue | 1–2 días |
| C | Validación técnica (smoke tests) | 1 día |
| D | Setup del cliente (DWY) | 1–4 semanas (piloto 30 días opcional) |
| E | Go-live comercial y handover | 1 día + soporte acordado |

---

## 3. Paso a paso: poner en vivo la plataforma

### Fase A — Pre-requisitos

1. **Repositorio y ramas:** `main` estable; CI (GitHub Actions) revisado.  
2. **Cuentas de servicios:** ver checklist en [TOOLS_PRICING_CHECKLIST.md](./TOOLS_PRICING_CHECKLIST.md) (VPS, GitHub, integraciones opcionales).  
3. **Dominio y DNS:** apuntar registros A/AAAA al VPS o configurar subdominios según [DEPLOYMENT_URLS.md](./DEPLOYMENT_URLS.md).  
4. **Secretos:** preparar valores para `MONGO_*`, `JWT_SECRET`, `CORS_ORIGINS`, `EMERGENT_LLM_KEY`, SSH deploy, URLs de health.  
5. **Decisión HTTPS:** tras DNS, usar Certbot (instrucciones en `DEPLOYMENT_URLS.md`) y actualizar `CORS_ORIGINS` a `https://`.

### Fase B — Despliegue

1. **Servidor (Hostinger u otro VPS):** Docker y Docker Compose instalados; usuario SSH con clave.  
2. **Directorio de producción:** p. ej. `/root/rovi-crm/production` (alineado con secretos `HOSTINGER_PATH`).  
3. **Archivos:** `docker-compose.hostinger.yml` (o el compose acordado), `deploy/nginx-production.conf` si aplica.  
4. **Variables:** archivo `.env` en el servidor (no commitear). Plantilla conceptual en [REQUIREMENTS_AND_INFRASTRUCTURE.md](./REQUIREMENTS_AND_INFRASTRUCTURE.md).  
5. **Imágenes:** pull desde GHCR tras push a `main` o build local en el servidor según proceso actual del equipo.  
6. **Levantar stack:** `docker compose -f docker-compose.hostinger.yml up -d` (ajustar nombre de archivo si el proyecto usa otro).  
7. **Backup:** configurar `deploy/backup.sh` o política de snapshots/volumen Mongo (ver infra doc).

### Fase C — Validación antes de clientes

1. `GET /api/health` → respuesta `healthy`.  
2. Frontend carga en la URL pública.  
3. **Login** con usuario de prueba en tenant de staging o cuenta demo.  
4. **Flujo mínimo:** crear lead → mover etapa → crear evento en calendario (opcional) → envío de prueba de email/SMS solo si integraciones activas.  
5. Revisar logs: `docker compose logs -f backend` (y frontend/mongodb según necesidad).

---

## 4. Paso a paso: setup con el cliente (DWY)

### Semana 0 — Kickoff

| Paso | Acción | Responsable |
|------|--------|-------------|
| 1 | Contrato o anexo con **alcance MVP** (módulos incluidos / excluidos) | Comercial |
| 2 | Lista de **usuarios** (emails, roles: individual vs agencia) | Cliente |
| 3 | **Datos:** fuentes (Excel, CRM anterior), volumen estimado, campos obligatorios | Cliente + ops |
| 4 | **Integraciones prioritarias:** email, SMS, llamadas IA, Google Calendar (orden realista) | Cliente + ops |
| 5 | Canal de **comunicación** (Slack, grupo WhatsApp, email) y ventanas de reunión | Ambos |

### Semana 1 — Datos y configuración base

1. Crear cuentas de usuario o enviar invitaciones según proceso acordado.  
2. Completar **onboarding** en la app (cada usuario).  
3. Definir **etapas del pipeline** alineadas al negocio del cliente.  
4. **Importación:** subir archivo de prueba → mapeo de columnas → preview → import ejecutado.  
5. **Settings → Integraciones:** pegar claves; ejecutar **test** de SendGrid, Twilio, VAPI según lo contratado.  
6. **Google Calendar:** OAuth desde Settings; verificar sincronización en cuenta de prueba.

### Semana 2 — Campaña piloto

1. Crear **plantilla de email** o usar seed si aplica.  
2. Definir **campaña** (tipo: email/SMS/llamadas) con audiencia acotada (lista de prueba).  
3. **No** lanzar a base completa hasta validar entregabilidad y métricas básicas.  
4. Si hay equipo: configurar **brokers** y **round-robin** si el flujo lo requiere.

### Semana 3–4 — Operación y cierre de piloto

1. Revisión semanal de **pipeline** y campañas activas.  
2. Ajuste de **scripts** y mensajes según feedback.  
3. Export de **analíticas** para informe de piloto.  
4. Decisión: pasar a **Plan Pro** recurrente, ampliar alcance o fase 2 (automatizaciones avanzadas, etc.).

---

## 5. Runbook operativo (post go-live)

| Situación | Acción |
|-----------|--------|
| Backend no responde | Verificar contenedor backend, Mongo, disco, `docker compose ps`, logs |
| Error 502/504 | Nginx upstream; puertos internos; firewall |
| Login masivo fallido | JWT/CORS; reloj del servidor; HTTPS mixed content |
| Pérdida de datos | Restaurar desde backup Mongo; no borrar volúmenes sin snapshot |
| Deploy fallido en CI | Revisar GitHub Actions; secretos SSH; espacio en disco en VPS |

**Rollback rápido:** desplegar imagen Docker con tag/commit anterior y `docker compose up -d --force-recreate`.

---

## 6. Entregables al cliente (checklist de cierre DWY)

- [ ] URL de producción y (si aplica) preview.  
- [ ] Usuarios creados y primera sesión completada.  
- [ ] Documento de **integraciones** (qué está conectado y con qué cuenta).  
- [ ] Guía breve de **pipeline + importación + campaña** (1–2 páginas o Loom).  
- [ ] Contacto de **soporte** y tiempos de respuesta acordados.  

---

## 7. Relación con otros documentos

- Requisitos detallados: [REQUIREMENTS_AND_INFRASTRUCTURE.md](./REQUIREMENTS_AND_INFRASTRUCTURE.md)  
- Herramientas y costos: [TOOLS_PRICING_CHECKLIST.md](./TOOLS_PRICING_CHECKLIST.md)  
- Calidad y sprint de pruebas: [SPRINT_USER_STORIES_QA.md](./SPRINT_USER_STORIES_QA.md)  
