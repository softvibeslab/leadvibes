#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Creando .env desde docker-local.sample ..."
  cp docker-local.sample .env
  echo "Edita .env si necesitas otros puertos o contraseñas."
fi

echo "Levantando stack (build si hace falta)..."
docker compose up -d --build

echo ""
echo "UI:     http://localhost:${FRONTEND_HOST_PORT:-13000}"
echo "Health: http://localhost:${BACKEND_HOST_PORT:-18080}/api/health"
echo "Logs:   docker compose logs -f"
