# ROVI Golden Release Plan

Fecha: 2026-06-04
Rama base: `release/rovi-golden-preview-2026`
Base tecnica: `origin/rovi_deploy` en `6695de6`

## Objetivo

Unificar las mejores versiones de features en una rama golden estable antes de promover a productivo. La rama golden debe conservar lo que ya funciona en preview y sumar features por bloques pequenos, con validacion funcional por rol.

## Principio de integracion

No hacer merge completo de ramas grandes o arboles locales sucios. Integrar por feature, revisando archivos, rutas, permisos, migraciones y pruebas. Cada bloque debe quedar en un commit propio y poder revertirse sin afectar al resto.

## Estado de la base golden

La base actual ya incluye:

- Login preview y roles principales.
- Rentas / property manager.
- Chat BD en `/database-chat`.
- Dashboard Builder IA / Estratega IA con `POST /api/strategy-playground/run`.
- AI Control Tower y agentes por rol.
- Hermes / Telegram linking.
- Miniapp Telegram preview en `frontend/public/miniapp`.
- COPIM workspaces y accesos preview.

## Features candidatas

| Bloque | Estado | Fuente recomendada | Archivos principales | Riesgo |
| --- | --- | --- | --- | --- |
| Chat BD + Dashboard Builder IA | Ya en base golden | `origin/rovi_deploy` | `frontend/src/pages/DatabaseChatPage.js`, `backend/agent_control.py`, `backend/ai_service.py` | Medio: depende de llaves IA y Graphify |
| Rentas / Property Manager | Ya en base golden | `origin/rovi_deploy` | `backend/rentals.py`, `frontend/src/pages/RentalsPage.js` | Medio: validar routing por rol |
| Miniapp Telegram preview | Ya en base golden | `origin/rovi_deploy` | `frontend/public/miniapp/*`, `backend/hermes_bridge.py` | Medio: validar endpoints y dominio |
| Tasks tipo ClickUp | Candidato listo | `origin/feature/tasks-clickup-module-push` | `backend/tasks.py`, `frontend/src/pages/TasksPage.js`, `frontend/src/App.js`, `frontend/src/components/Sidebar.js`, `backend/server.py` | Medio: revisar conflictos con preview |
| Valuador | Candidato local | workspace `feature/strategy-playground` local | `backend/valuation.py`, `frontend/src/pages/ValuationPage.js`, modelos y rutas | Alto: archivos no trackeados/locales |
| OpenWA | Candidato local | workspace `feature/strategy-playground` local | `frontend/src/pages/OpenWAPage.js`, `backend/server.py`, `backend/models.py`, settings | Alto: muchos cambios dentro de `server.py` |
| Miniapp aislada productiva | Candidato local | workspace `feature/strategy-playground` local | `deploy/miniapp/*`, `docker-compose.miniapp.yml`, `frontend/miniapp-nginx/*` | Medio: infra separada |
| Telegram agent | Candidato local | workspace `feature/strategy-playground` local | `backend/telegram_agent.py`, docs Telegram | Medio: validar secretos/webhooks |
| Seeds preview | Candidato local | workspace `feature/strategy-playground` local | `backend/scripts/seed_*preview*.py` | Bajo: scripts, no runtime |

## Orden recomendado

1. Congelar base golden y validar que coincide con preview.
2. Integrar Tasks desde `origin/feature/tasks-clickup-module-push`.
3. Integrar Valuador en un commit separado.
4. Integrar OpenWA en un commit separado, revisando cuidadosamente `backend/server.py`.
5. Integrar miniapp aislada productiva como bloque de infra.
6. Integrar Telegram agent si no duplica Hermes preview.
7. Ejecutar validacion local completa.
8. Deploy a preview.
9. Validacion manual por rol.
10. Promover a productivo.

## Checklist tecnico por bloque

Para cada feature:

- Confirmar rutas frontend en `frontend/src/App.js`.
- Confirmar navegacion en `frontend/src/components/Sidebar.js`.
- Confirmar permisos por rol y `account_type`.
- Confirmar router backend incluido antes de `app.include_router(api_router)`.
- Confirmar modelos Pydantic requeridos.
- Confirmar variables de entorno/documentacion.
- Ejecutar build frontend.
- Ejecutar pruebas backend smoke.
- Probar login con usuario preview relacionado.
- Probar endpoint principal con `curl` autenticado.

## Checklist por rol

Usuarios preview:

- `preview.broker@rovicrm.com` debe ver Broker, Leads, Chat BD/Estratega, Tasks.
- `preview.agency@rovicrm.com` debe ver Agencia/Admin inmobiliaria, Leads, equipo, Chat BD/Estratega, Tasks.
- `preview.rentals@rovicrm.com` debe entrar al modo Rentas, no Broker, y ver Rentas.
- `preview.valuator@rovicrm.com` debe ver Valuador cuando el bloque este integrado.
- `preview.copim.admin@rovicrm.com` debe ver COPIM nacional.
- `preview.copim.operator@rovicrm.com` debe ver COPIM operador local.
- `preview.copim.member@rovicrm.com` debe ver portal socio COPIM.
- `preview.rovi.admin@rovicrm.com` debe ver admin interno ROVI, AI Control Tower y herramientas internas.

Password preview: `RoviPreview2026!`

## Pruebas minimas antes de preview deploy

Backend:

```bash
cd backend
pytest
```

Frontend:

```bash
cd frontend
yarn build
```

Docker local:

```bash
docker compose up -d --build
curl http://localhost:18080/api/health
```

Validacion AI:

```bash
curl -X POST http://localhost:18080/api/database-chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"How many leads?"}'

curl -X POST http://localhost:18080/api/strategy-playground/run \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question":"Dashboard ejecutivo de leads y prioridades","include_context":true}'
```

## Riesgos conocidos

- `backend/server.py` concentra muchas rutas; los cambios de OpenWA, miniapp, valuador y tasks pueden chocar.
- Graphify en preview responde sin nodos si no existe `graphify-out` montado/indexado.
- Algunas features candidatas viven como archivos no trackeados en el workspace local; deben incorporarse manualmente, no por merge directo.
- La rama `feature/tasks-clickup-module-push` esta basada en `feature/strategy-playground`; conviene extraer solo el commit/archivos de Tasks.

## Definicion de listo

La rama golden esta lista para productivo cuando:

- Todos los usuarios preview pueden entrar.
- Cada rol ve su modulo correcto.
- `/leads`, `/database-chat`, `/rentals`, `/tasks` y modulos integrados responden sin errores 500.
- `yarn build` y smoke backend pasan.
- Preview queda validado manualmente antes de tocar productivo.
