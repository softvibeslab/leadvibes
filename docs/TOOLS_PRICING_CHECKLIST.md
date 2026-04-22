# Checklist de herramientas, precios orientativos y documentación

**Aviso:** Los precios de terceros cambian por región y fecha. Usa los enlaces de **Documentación / Pricing** para confirmar el importe actual. El precio comercial de **Rovi** es el definido por tu negocio (ej. presentación Raven: Plan Pro **299 USD/mes** hasta 5 usuarios).

---

## 1. Checklist maestro (pre go-live)

### 1.1 Infraestructura y código

| # | Herramienta | ¿Listo? | Notas |
|---|-------------|---------|-------|
| 1 | Repositorio GitHub (`softvibeslab/leadvibes` o el tuyo) | ☐ | Ramas protegidas, `main` para prod |
| 2 | GitHub Actions + secretos deploy | ☐ | Ver [DEPLOYMENT_URLS.md](./DEPLOYMENT_URLS.md) |
| 3 | GHCR (imágenes Docker) | ☐ | Incluido en flujo de CI |
| 4 | VPS / Hostinger (Docker) | ☐ | IP, SSH, Docker Compose |
| 5 | DNS y (opcional) dominio propio | ☐ | Registros A/AAAA |
| 6 | HTTPS (Certbot + Nginx) | ☐ | Tras DNS estable |

### 1.2 Producto Rovi (entorno)

| # | Item | ¿Listo? |
|---|------|---------|
| 1 | MongoDB con volumen persistente | ☐ |
| 2 | Variables `.env` en servidor | ☐ |
| 3 | `CORS_ORIGINS` = URL real del frontend | ☐ |
| 4 | `JWT_SECRET` fuerte y único | ☐ |
| 5 | Prueba `/api/health` | ☐ |

### 1.3 Integraciones (según alcance del cliente)

| # | Servicio | ¿Contratado? | ¿Claves en Settings? | ¿Test OK? |
|---|----------|--------------|----------------------|-----------|
| 1 | SendGrid (email) | ☐ | ☐ | ☐ |
| 2 | Twilio (SMS) | ☐ | ☐ | ☐ |
| 3 | VAPI (llamadas IA) | ☐ | ☐ | ☐ |
| 4 | Google Cloud (OAuth Calendar) | ☐ | ☐ | ☐ |
| 5 | OpenAI / LLM (`EMERGENT_LLM_KEY`) | ☐ | N/A env | ☐ |

### 1.4 Cliente (DWY)

| # | Entregable | ¿Hecho? |
|---|------------|---------|
| 1 | Usuarios creados / onboarding | ☐ |
| 2 | Importación piloto | ☐ |
| 3 | Primera campaña de prueba | ☐ |
| 4 | Sesión de formación o video | ☐ |

---

## 2. Tabla de herramientas: precios orientativos y enlaces

*Actualizar precios en el sitio oficial antes de presupuestar al cliente.*

| Herramienta | Para qué sirve en Rovi | Precio orientativo | Pricing oficial | Documentación |
|-------------|-------------------------|--------------------|-----------------|---------------|
| **Rovi / LeadVibes** | CRM (producto propio) | Plan comercial acordado (ej. **299 USD/mes** / 5 usu — deck Raven) | *(interno)* | [Índice ops](./ROVI_OPERATIONS_INDEX.md), [CLAUDE.md](../CLAUDE.md) |
| **Hostinger VPS** | Servidor Docker, Nginx | Desde pocos USD/mes según plan | https://www.hostinger.com/vps-hosting | https://support.hostinger.com/ |
| **GitHub** | Código, Actions, GHCR | Free/Team/Enterprise | https://github.com/pricing | https://docs.github.com/ |
| **MongoDB** | Base de datos (local Docker o Atlas) | Atlas: tier gratuito / de pago | https://www.mongodb.com/pricing | https://www.mongodb.com/docs/ |
| **VAPI** | Llamadas con voz IA | Por minuto / plan | https://vapi.ai/pricing | https://docs.vapi.ai/ |
| **Twilio** | SMS | Pay-as-you-go | https://www.twilio.com/pricing | https://www.twilio.com/docs |
| **SendGrid** | Email transaccional/marketing | Planes Free y de pago | https://sendgrid.com/pricing/ | https://docs.sendgrid.com/ |
| **Google Cloud** | Consola para OAuth Calendar | Uso mínimo frecuente | https://cloud.google.com/pricing | https://developers.google.com/calendar |
| **OpenAI API** | IA (chat, análisis) si aplica | Por token | https://openai.com/api/pricing/ | https://platform.openai.com/docs |

### Certificados y dominio (si aplica)

| Herramienta | Uso | Enlace útil |
|-------------|-----|-------------|
| **Let’s Encrypt** | TLS gratuito | https://letsencrypt.org/docs/ |
| **Certbot** | Emisión en servidor | https://certbot.eff.org/ |

---

## 3. URLs del proyecto (referencia interna)

Según despliegue documentado:

| Entorno | URL ejemplo |
|---------|----------------|
| Producción | `http://srv1318804.hstgr.cloud` (sustituir por dominio final) |
| Dev | `http://dev.srv1318804.hstgr.cloud` |
| Preview | `http://preview.srv1318804.hstgr.cloud` |

Detalle de puertos y secretos: [DEPLOYMENT_URLS.md](./DEPLOYMENT_URLS.md).

---

## 4. Documentación del repositorio (mapa rápido)

| Documento | Ruta |
|-----------|------|
| Índice operaciones | [ROVI_OPERATIONS_INDEX.md](./ROVI_OPERATIONS_INDEX.md) |
| Go-live y cliente | [GO_LIVE_AND_CLIENT_SETUP.md](./GO_LIVE_AND_CLIENT_SETUP.md) |
| Requisitos e infra | [REQUIREMENTS_AND_INFRASTRUCTURE.md](./REQUIREMENTS_AND_INFRASTRUCTURE.md) |
| Sprint QA | [SPRINT_USER_STORIES_QA.md](./SPRINT_USER_STORIES_QA.md) |
| URLs deploy | [DEPLOYMENT_URLS.md](./DEPLOYMENT_URLS.md) |
| Deploy Docker | [deploy/README.md](../deploy/README.md) |
| Guía desarrollo | [CLAUDE.md](../CLAUDE.md) |

---

## 5. Resumen de costos mensuales (plantilla para presupuesto)

Rellena con cifras reales tras revisar cada sitio:

| Concepto | Proveedor | Estimación mensual (USD) |
|----------|-----------|---------------------------|
| VPS | Hostinger / otro | ___ |
| Rovi (licencia cliente) | Interno | ___ |
| Email | SendGrid | ___ |
| SMS | Twilio | ___ |
| Llamadas IA | VAPI | ___ (variable) |
| IA texto | OpenAI | ___ (variable) |
| Dominio | Registrador | ___ |
| **Total orientativo** | | **___** |
