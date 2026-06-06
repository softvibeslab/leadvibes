# Wiki Rovi

Esta wiki es el punto de entrada rapido para entender Rovi como producto, sistema y operacion.

## Lectura Recomendada

1. [SOUL.md](./SOUL.md) - identidad, principios y reglas no negociables del agente experto.
2. [docs/agent/README.md](./docs/agent/README.md) - indice de la wiki especializada.
3. [docs/agent/ARCHITECTURE.md](./docs/agent/ARCHITECTURE.md) - arquitectura backend, frontend, auth y datos.
4. [docs/agent/MODULE_MAP.md](./docs/agent/MODULE_MAP.md) - modulos, rutas, archivos y responsabilidades.
5. [docs/agent/PLAYBOOK.md](./docs/agent/PLAYBOOK.md) - como trabajar features, bugs, QA y deploy.
6. [docs/agent/RUNBOOK.md](./docs/agent/RUNBOOK.md) - comandos, entornos y validaciones.

## Resumen Ejecutivo

Rovi es una plataforma full-stack basada en FastAPI, MongoDB y React. Nacio como LeadVibes CRM para brokers inmobiliarios de Tulum y ahora convive con modulos de ventas, property management, COPIM, marketplace, tareas, AI Control Tower, VibeLab, Hermes/Telegram y herramientas internas ROVI.

El backend expone rutas bajo `/api`, usa JWT con refresh tokens, Motor async para MongoDB y modelos Pydantic. El frontend usa React 19, Tailwind, shadcn/ui, React Router, `AuthContext` para API/JWT y navegacion controlada por workspace, rol y `account_type`.

## Fuentes Primarias Del Repositorio

- [AGENTS.md](./AGENTS.md) - instrucciones base para agentes en este repo.
- [CLAUDE.md](./CLAUDE.md) - arquitectura y comandos heredados.
- [rovi-crm/SKILL.md](./rovi-crm/SKILL.md) - skill especializada previa.
- [backend/server.py](./backend/server.py) - app principal FastAPI y rutas monoliticas.
- [backend/models.py](./backend/models.py) - modelos y enums del dominio.
- [frontend/src/App.js](./frontend/src/App.js) - rutas y guards.
- [frontend/src/components/Sidebar.js](./frontend/src/components/Sidebar.js) - navegacion por workspace.
- [frontend/src/context/AuthContext.js](./frontend/src/context/AuthContext.js) - sesion, tokens y cliente API.

## Operacion

- Local Docker: [docs/DOCKER_LOCAL.md](./docs/DOCKER_LOCAL.md)
- Entornos: [docs/DEPLOYMENT_URLS.md](./docs/DEPLOYMENT_URLS.md)
- Operaciones: [docs/ROVI_OPERATIONS_INDEX.md](./docs/ROVI_OPERATIONS_INDEX.md)
- Release golden: [docs/ROVI_GOLDEN_RELEASE_PLAN.md](./docs/ROVI_GOLDEN_RELEASE_PLAN.md)
- CI y testing: [docs/CI_AND_TESTING.md](./docs/CI_AND_TESTING.md)

