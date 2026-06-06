# Deploy aislado: Telegram MiniApp en `https://rovicrm.com/miniapp/`

Este deploy publica la MiniApp en contenedores nuevos para evitar recrear el stack principal de ROVI.

## Arquitectura

```text
https://rovicrm.com/miniapp/
  -> Nginx host
  -> rovi-miniapp-frontend:80

https://rovicrm.com/api/miniapp/*
https://rovicrm.com/api/telegram-miniapp/session
  -> Nginx host
  -> rovi-miniapp-backend:8000
  -> Mongo existente
```

El resto de `https://rovicrm.com/` y `/api/*` sigue apuntando al deploy actual.

## Archivos

- `docker-compose.miniapp.yml`
- `frontend/miniapp-nginx/Dockerfile`
- `frontend/miniapp-nginx/default.conf`
- `deploy/miniapp/rovicrm-miniapp-nginx.conf`

## Variables requeridas en el VPS

Usa el mismo `.env` de produccion si ya contiene estas variables:

```bash
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=...
DB_NAME=rovi_crm
JWT_SECRET=...
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
ROVI_TELEGRAM_BOT_TOKEN=...
ROVI_TELEGRAM_BOT_USERNAME=...
ROVI_HERMES_WEBHOOK_SECRET=...
ROVI_PUBLIC_API_BASE_URL=https://rovicrm.com
```

Variables especificas opcionales:

```bash
ROVI_DOCKER_NETWORK=leadvibes_rovi-network
MINIAPP_FRONTEND_HOST_PORT=3300
MINIAPP_BACKEND_HOST_PORT=8300
MINIAPP_CORS_ORIGINS=https://rovicrm.com,https://www.rovicrm.com
ROVI_LEADS_DATA_DIR_HOST=/root/rovi-crm/production/leads
ROVI_LEADS_DATA_DIR=/app/leads
ROVI_HERMES_PROFILES_ROOT_HOST=/root/.hermes/profiles
ROVI_HERMES_PROFILES_ROOT=/app/hermes-profiles
```

Para detectar el nombre real de la red Docker:

```bash
docker network ls | grep rovi
docker inspect rovi-backend --format '{{json .NetworkSettings.Networks}}'
```

Si el nombre no es `leadvibes_rovi-network`, ajusta `ROVI_DOCKER_NETWORK`.

## Deploy

Desde el directorio del proyecto en el VPS:

```bash
docker compose -f docker-compose.miniapp.yml up -d --build
docker compose -f docker-compose.miniapp.yml ps
```

Pruebas locales en el VPS:

```bash
curl -f http://127.0.0.1:3300/miniapp/
curl -f http://127.0.0.1:8300/api/health
```

## Nginx publico

Agregar los bloques de:

```text
deploy/miniapp/rovicrm-miniapp-nginx.conf
```

dentro del server block HTTPS de:

```text
server_name rovicrm.com www.rovicrm.com;
```

Validar y recargar:

```bash
nginx -t
systemctl reload nginx
```

## Prueba publica

```bash
curl -I https://rovicrm.com/miniapp/
curl -f https://rovicrm.com/api/health
```

La URL final para BotFather:

```text
https://rovicrm.com/miniapp/
```

## Rollback

Quitar o comentar los bloques Nginx de MiniApp y recargar:

```bash
nginx -t
systemctl reload nginx
```

Apagar contenedores aislados:

```bash
docker compose -f docker-compose.miniapp.yml down
```

Esto no elimina ni recrea `rovi-backend`, `rovi-frontend` ni `rovi-mongodb`.
