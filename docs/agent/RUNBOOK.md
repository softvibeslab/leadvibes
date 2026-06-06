# Runbook

## Backend Local

```bash
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

Health:

```bash
curl http://localhost:8000/api/health
```

## Frontend Local

```bash
cd frontend
yarn start
```

Build:

```bash
cd frontend
yarn build
```

## Docker Local

```bash
cp docker-local.sample .env
docker compose up -d --build
curl http://localhost:18080/api/health
```

Default local Docker UI: `http://localhost:13000`.

## Tests

Backend unit/smoke:

```bash
cd backend
pytest
```

Backend integration contra API corriendo:

```bash
cd backend
REACT_APP_BACKEND_URL=http://localhost:8000 pytest -m integration
```

Frontend:

```bash
cd frontend
yarn build
yarn test
yarn test:e2e
```

## Lint/Formato

Backend:

```bash
cd backend
black .
isort .
flake8 .
mypy .
```

Frontend:

```bash
cd frontend
yarn lint
```

## Entornos VPS

| Entorno | Compose | URL |
| --- | --- | --- |
| Production | `docker-compose.hostinger.yml` | `http://srv1318804.hstgr.cloud` |
| Development | `docker-compose.dev.yml` | `http://dev.srv1318804.hstgr.cloud` |
| Preview | `docker-compose.preview.yml` | `http://preview.srv1318804.hstgr.cloud` |

## Validacion Golden Minima

```bash
cd backend && pytest
cd ../frontend && yarn build
docker compose up -d --build
curl http://localhost:18080/api/health
```

Validar manualmente, al menos:

- broker preview entra a dashboard/leads/tasks/database-chat.
- agency preview ve brokers/gamificacion.
- rentals preview entra a `/rentals`.
- copim admin/local/member caen en su portal correcto.
- rovi admin ve Revenue HQ y AI Control si corresponde.

