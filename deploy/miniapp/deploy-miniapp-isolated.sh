#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-$(pwd)}"
DOMAIN="${DOMAIN:-rovicrm.com}"
NGINX_SITE="${NGINX_SITE:-}"

cd "$PROJECT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required" >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose plugin is required" >&2
  exit 1
fi

if [ -z "${ROVI_DOCKER_NETWORK:-}" ]; then
  DETECTED_NETWORK="$(docker inspect rovi-backend --format '{{range $name, $_ := .NetworkSettings.Networks}}{{$name}}{{end}}' 2>/dev/null || true)"
  if [ -n "$DETECTED_NETWORK" ]; then
    export ROVI_DOCKER_NETWORK="$DETECTED_NETWORK"
  else
    export ROVI_DOCKER_NETWORK="leadvibes_rovi-network"
  fi
fi

export MINIAPP_FRONTEND_HOST_PORT="${MINIAPP_FRONTEND_HOST_PORT:-3300}"
export MINIAPP_BACKEND_HOST_PORT="${MINIAPP_BACKEND_HOST_PORT:-8300}"
export ROVI_PUBLIC_API_BASE_URL="${ROVI_PUBLIC_API_BASE_URL:-https://${DOMAIN}}"
export MINIAPP_CORS_ORIGINS="${MINIAPP_CORS_ORIGINS:-https://${DOMAIN},https://www.${DOMAIN}}"

echo "Using Docker network: ${ROVI_DOCKER_NETWORK}"
echo "Building isolated MiniApp containers..."
docker compose -f docker-compose.miniapp.yml up -d --build

echo "Checking containers..."
docker compose -f docker-compose.miniapp.yml ps
curl -f "http://127.0.0.1:${MINIAPP_FRONTEND_HOST_PORT}/miniapp/" >/dev/null
curl -f "http://127.0.0.1:${MINIAPP_BACKEND_HOST_PORT}/api/health" >/dev/null

if [ -n "$NGINX_SITE" ]; then
  if [ ! -f "$NGINX_SITE" ]; then
    echo "NGINX_SITE does not exist: $NGINX_SITE" >&2
    exit 1
  fi
  echo
  echo "NGINX_SITE was provided, but this script will not edit it automatically."
  echo "Add the location blocks from deploy/miniapp/rovicrm-miniapp-nginx.conf to:"
  echo "  $NGINX_SITE"
fi

echo
echo "MiniApp containers are ready."
echo "Now add deploy/miniapp/rovicrm-miniapp-nginx.conf to the ${DOMAIN} HTTPS server block, then run:"
echo "  nginx -t && systemctl reload nginx"
echo
echo "Public URL:"
echo "  https://${DOMAIN}/miniapp/"
