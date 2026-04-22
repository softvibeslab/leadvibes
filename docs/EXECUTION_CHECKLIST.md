# Checklist ejecutable — seguir en orden

Usa este documento como **guía día a día**. Marca cada ítem al completarlo. Está alineado con [GO_LIVE_AND_CLIENT_SETUP.md](./GO_LIVE_AND_CLIENT_SETUP.md) y el sprint en [SPRINT_USER_STORIES_QA.md](./SPRINT_USER_STORIES_QA.md).

---

## Fase 0 — Antes de tocar producción (1–2 días)

| # | Acción | Referencia |
|---|--------|------------|
| ☐ | Leer el índice [ROVI_OPERATIONS_INDEX.md](./ROVI_OPERATIONS_INDEX.md) | Visión general |
| ☐ | Confirmar alcance MVP por escrito (qué módulos usa el primer cliente) | Contrato interno |
| ☐ | Abrir en GitHub los issues P0 desde [USER_STORIES_FOR_GITHUB.md](./USER_STORIES_FOR_GITHUB.md) (o crearlos con plantilla “Historia de usuario”) | Backlog |
| ☐ | Etiquetar issues: `epic/E1` … `epic/E4` para las primeras entregas | Organización |
| ☐ | Verificar cuentas: VPS, GitHub, DNS (si hay dominio propio) | [TOOLS_PRICING_CHECKLIST.md](./TOOLS_PRICING_CHECKLIST.md) |
| ☐ | VPS Hostinger confirmado (Misión Inversión 360) | [CLIENT_MISION_INVERSION_360.md](./CLIENT_MISION_INVERSION_360.md) § 1.1 |

---

## Fase 1 — Infraestructura y secretos (mismo día o día 2)

| # | Acción | Referencia |
|---|--------|------------|
| ☐ | SSH al VPS: Docker y Docker Compose funcionando | [deploy/README.md](../deploy/README.md) |
| ☐ | DNS: dominio propio → registro **A** a la IPv4 del VPS (ver charter) | [CLIENT_MISION_INVERSION_360.md](./CLIENT_MISION_INVERSION_360.md) § 1.1 |
| ☐ | Clonar o sincronizar código en la ruta del servidor (`HOSTINGER_PATH`) | [DEPLOYMENT_URLS.md](./DEPLOYMENT_URLS.md) |
| ☐ | Completar `.env` en servidor: Mongo, JWT, CORS, LLM | [REQUIREMENTS_AND_INFRASTRUCTURE.md](./REQUIREMENTS_AND_INFRASTRUCTURE.md) |
| ☐ | Configurar **GitHub Secrets** para el workflow de producción | [DEPLOYMENT_URLS.md](./DEPLOYMENT_URLS.md) |
| ☐ | Si usas dominio propio: DNS → IP del VPS | Misma guía |
| ☐ | Opcional pero recomendado: **HTTPS** con Certbot y actualizar `CORS_ORIGINS` a `https://` | [DEPLOYMENT_URLS.md](./DEPLOYMENT_URLS.md) |

---

## Fase 2 — Primer deploy y humo (día 2–3)

| # | Acción | Criterio de éxito |
|---|--------|-------------------|
| ☐ | `docker compose -f docker-compose.hostinger.yml up -d` (o archivo acordado) | Contenedores `healthy` / en ejecución |
| ☐ | `curl` o navegador a `/api/health` | `{"status":"healthy"}` |
| ☐ | Abrir URL del frontend | Login visible |
| ☐ | Crear usuario de prueba o login demo | Sesión estable |
| ☐ | Anotar URL final y guardar en el runbook | [GO_LIVE_AND_CLIENT_SETUP.md](./GO_LIVE_AND_CLIENT_SETUP.md) § runbook |

---

## Fase 3 — Integraciones (antes del cliente o día 1 con cliente)

| # | Acción | Notas |
|---|--------|-------|
| ☐ | SendGrid: API key, dominio/autenticación si aplica | Test desde Settings |
| ☐ | Twilio: SID, token, número | Test SMS |
| ☐ | VAPI: credenciales | Test llamada |
| ☐ | Google Cloud: proyecto OAuth, redirect URIs del backend | OAuth calendario |
| ☐ | Variable `EMERGENT_LLM_KEY` / OpenAI en servidor | Chat y análisis IA |

Solo las que el **alcance MVP** incluya; el resto puede quedar para fase 2.

---

## Fase 4 — Setup cliente DWY (semana 1)

| # | Acción |
|---|--------|
| ☐ | Kickoff: usuarios, roles (individual vs agencia), canal de comunicación |
| ☐ | Alta de usuarios en la app |
| ☐ | Cada usuario completa **onboarding** |
| ☐ | Definir etapas del pipeline con el cliente |
| ☐ | Importación piloto (archivo pequeño → mapeo → preview → ejecutar) |
| ☐ | Revisión conjunta del pipeline con datos reales |

---

## Fase 5 — Setup cliente DWY (semana 2)

| # | Acción |
|---|--------|
| ☐ | Primera **campaña de prueba** (audiencia mínima) |
| ☐ | Validar entregabilidad email/SMS según integraciones activas |
| ☐ | Si aplica: brokers + round-robin o reglas de asignación |
| ☐ | Sesión de formación corta (30–45 min) o video grabado |

---

## Fase 6 — Cierre piloto / operación (semana 3–4)

| # | Acción |
|---|--------|
| ☐ | Export de analíticas para informe |
| ☐ | Ajuste de scripts y mensajes según feedback |
| ☐ | Decisión comercial: continuidad, plan recurrente, fase 2 |
| ☐ | Backup Mongo verificado o programado | `deploy/backup.sh` o política del VPS |

---

## Paralelo — Sprint QA (equipo dev)

| Semana | Enfoque |
|--------|---------|
| 1 | Issues P0 (E1–E4): auth, leads, import, integraciones + tests |
| 2 | P1: campañas, calendario, email templates + tests |

Detalle: [SPRINT_USER_STORIES_QA.md](./SPRINT_USER_STORIES_QA.md).

---

## Deuda técnica conocida (no bloquea el primer cliente si queda documentada)

| Tema | Acción sugerida |
|------|-----------------|
| Tests actuales son **integración** contra API remota / datos seed | Migrar a `TestClient` + fixtures en un sprint dedicado |
| Workflow CI y pytest | Revisar [CI_AND_TESTING.md](./CI_AND_TESTING.md) cuando exista |

---

## Siguiente documento que debes abrir ahora

1. Si vas a **desplegar hoy:** [DEPLOYMENT_URLS.md](./DEPLOYMENT_URLS.md) + secretos.  
2. Si vas a **organizar el equipo:** [USER_STORIES_FOR_GITHUB.md](./USER_STORIES_FOR_GITHUB.md).  
3. Si el **cliente empieza esta semana:** Fase 4 de esta misma checklist.
