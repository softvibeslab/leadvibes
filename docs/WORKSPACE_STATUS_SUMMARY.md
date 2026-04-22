# Workspace Status Summary

Fecha de corte: 2026-04-07

Este inventario se infiere del codigo local, la documentacion existente y los specs `draft` del repo. Para la vista navegable abre [WORKSPACE_STATUS_DASHBOARD.html](./WORKSPACE_STATUS_DASHBOARD.html).

## Vista Rapida

| Desarrollo | Estado inferido | Carpetas clave | Lectura rapida |
|---|---|---|---|
| Backend FastAPI | Operativo con zonas parciales | `backend/`, `backend/tests/`, `mongodb-init/` | Nucleo CRM amplio con `101` endpoints para auth, leads, dashboard, calendario, campanas, analytics, importacion y automatizaciones. |
| Web CRM React | Operativo con brechas puntuales | `frontend/`, `frontend/src/pages/`, `frontend/src/components/` | Producto principal con `19` rutas declaradas y `16` paginas; varios flujos ya consumen API real. |
| Rovi Pocket | Demo navegable con integracion parcial | `apps/rovi-pocket/`, `apps/rovi-pocket/src/`, `apps/rovi-pocket/design/stitch/` | Subproyecto Expo en submodulo; auth y leads pueden conectarse al backend, pero agenda/copilot/profile siguen muy apoyados en mock. |
| Infra y entrega | Documentado y utilizable | `.github/workflows/`, `deploy/`, `docker-compose*.yml`, `scripts/` | Hay `3` workflows CI/CD y stack Docker para development, preview y production. |
| Docs, specs y QA | Fuerte en documentacion, en transicion en QA | `docs/`, `.moai/specs/`, `tests/`, `test_reports/` | Hay `12` specs `draft`, bastante documentacion operativa y suite de tests mezclada entre smoke local e integraciones remotas. |

## Hallazgos Clave

- `frontend/src/pages/CalendarPage.js` consume `GET /users?role=broker`, pero ese endpoint no existe en `backend/server.py`; el calendario web queda parcialmente bloqueado para asignacion de brokers.
- `frontend/src/pages/ImportLeadsPage.js`, `frontend/src/pages/EmailEditorPage.js` y partes de `frontend/src/pages/AutomationsPage.js` usan `REACT_APP_BACKEND_URL` sin el fallback relativo que si existe en `frontend/src/context/AuthContext.js`.
- El bloque de automatizaciones tiene endpoints y UI, pero sigue marcado como parcial en docs y codigo: la pagina tiene `TODO` para editor visual/detalles y `docs/CLIENT_MISION_INVERSION_360.md` menciona cierre tecnico pendiente con n8n.
- CI corre `pytest -m "not integration"` en GitHub Actions; eso deja fuera del pipeline automatico los tests que hoy validan integraciones reales.
- `apps/rovi-pocket/` ya esta conectado como submodulo Git al repo `https://github.com/softvibeslab/rovi_pocket.git`, lo que confirma que Pocket ya se trata como desarrollo independiente dentro del workspace.

## Carpetas y Rol

| Carpeta | Rol actual |
|---|---|
| `backend/` | API FastAPI y dominio principal del CRM |
| `backend/tests/` | Tests smoke/unit e integracion del backend |
| `frontend/` | Aplicacion web principal de Rovi CRM |
| `apps/rovi-pocket/` | App Expo/React Native mobile-first para brokers |
| `apps/rovi-pocket/design/stitch/` | Referencia visual exportada desde Stitch con screenshots y assets |
| `.github/workflows/` | Pipelines de CI/CD para dev, preview y production |
| `deploy/` | Compose, nginx y scripts de despliegue |
| `docs/` | Operacion, roadmap, Pocket, QA y material de negocio |
| `.moai/specs/` | Specs retrospectivos y futuros, todos en estado `draft` |
| `tests/` | Planes de prueba por feature en markdown |
| `test_reports/` | Resultados historicos/exportados de pruebas |

## Estado por Macro Flujo

| Macro flujo | Estado | Evidencia |
|---|---|---|
| Auth y onboarding web | Operativo | Login/registro y onboarding conectados a `/auth/*`, `/goals`, `/user/ai-profile`, `/seed` |
| Dashboard, leads, brokers y gamification web | Operativo | Rutas web y endpoints activos; specs retrospectivos marcan alta completitud |
| Calendar web | Parcial | CRUD y round robin existen, pero falta resolver carga de brokers desde frontend |
| Campaigns, email y settings | Parcial | Codigo amplio y endpoints existentes, pero dependen de proveedores externos y configuracion real |
| Importacion CSV | Operativo con dependencia de env | Flujo de 4 pasos implementado contra `/import/*` |
| Analytics | Operativo basico | Endpoints `/analytics/*` y pagina React con graficas |
| Automations + n8n | Parcial | Endpoints creados, docs y UI aun muestran pendientes |
| Pocket auth + dashboard + leads | Parcial-live | Pocket puede usar backend real para login, stats y leads |
| Pocket agenda + copilot + profile | Demo | Shell navegable, pero varios bloques siguen con data local y placeholders |

## Dashboard Visual

- Archivo visual: [WORKSPACE_STATUS_DASHBOARD.html](./WORKSPACE_STATUS_DASHBOARD.html)
- Uso esperado: abrir el HTML desde el repo y navegar por desarrollos, flujos, subflujos y detalle de pantallas.
- Cobertura: web CRM, backend, Pocket, infra, documentacion, specs y QA.

