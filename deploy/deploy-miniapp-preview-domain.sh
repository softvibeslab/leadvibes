#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${DOMAIN:-rovicrm.com.mx}"
PROJECT_DIR="${PROJECT_DIR:-/root/rovi-crm/preview}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.preview.yml}"
AGENT_ENV_FILE="${AGENT_ENV_FILE:-/root/rovi-broker-agent-env.md}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"
ENABLE_CERTBOT="${ENABLE_CERTBOT:-1}"
INCLUDE_WWW="${INCLUDE_WWW:-0}"

log() {
  printf '\n[%s] %s\n' "$(date -u +%H:%M:%S)" "$*"
}

require_root() {
  if [ "$(id -u)" != "0" ]; then
    echo "Run this script as root on the VPS." >&2
    exit 1
  fi
}

ensure_domain_resolves_here() {
  local server_ip
  local resolved
  server_ip="$(curl -fsS --max-time 5 https://api.ipify.org || hostname -I | awk '{print $1}')"
  resolved="$(getent ahostsv4 "$DOMAIN" | awk '{print $1; exit}' || true)"

  if [ -z "$resolved" ]; then
    echo "DNS for $DOMAIN does not resolve yet. Create an A record pointing to $server_ip." >&2
    exit 1
  fi

  if [ "$resolved" != "$server_ip" ]; then
    echo "DNS for $DOMAIN resolves to $resolved, but this VPS appears to be $server_ip." >&2
    echo "Fix the A record before issuing the certificate." >&2
    exit 1
  fi
}

extract_agent_env() {
  if [ ! -f "$AGENT_ENV_FILE" ]; then
    echo "Agent env file not found: $AGENT_ENV_FILE" >&2
    echo "Copy rovi-broker-agent-env.md to the VPS or set AGENT_ENV_FILE=/path/to/file." >&2
    exit 1
  fi

  awk '
    /^[[:space:]]*```/ { in_code = !in_code; next }
    in_code && /^[A-Za-z_][A-Za-z0-9_]*=/ { print }
  ' "$AGENT_ENV_FILE"
}

upsert_env_var() {
  local key="$1"
  local value="$2"
  local env_file="$3"

  if grep -qE "^${key}=" "$env_file"; then
    python3 - "$env_file" "$key" "$value" <<'PY'
import sys
path, key, value = sys.argv[1:4]
lines = []
with open(path, "r", encoding="utf-8") as fh:
    for line in fh:
        if line.startswith(f"{key}="):
            lines.append(f"{key}={value}\n")
        else:
            lines.append(line)
with open(path, "w", encoding="utf-8") as fh:
    fh.writelines(lines)
PY
  else
    printf '%s=%s\n' "$key" "$value" >> "$env_file"
  fi
}

sync_repo() {
  log "Syncing rovi_deploy in $PROJECT_DIR"
  cd "$PROJECT_DIR"
  git config --global --add safe.directory "$PROJECT_DIR" || true
  git fetch origin rovi_deploy
  git checkout -B rovi_deploy origin/rovi_deploy
  git reset --hard origin/rovi_deploy
}

write_env() {
  log "Writing preview .env with Telegram/Hermes variables"
  cd "$PROJECT_DIR"
  touch .env

  while IFS='=' read -r key value; do
    [ -n "$key" ] || continue
    upsert_env_var "$key" "$value" .env
  done < <(extract_agent_env)

  upsert_env_var "ROVI_PUBLIC_API_BASE_URL" "https://${DOMAIN}" .env
  upsert_env_var "CORS_ORIGINS_PREVIEW" "http://localhost:3200,http://31.220.63.211:3200,http://preview.srv1318804.hstgr.cloud,https://preview.srv1318804.hstgr.cloud,https://${DOMAIN},http://${DOMAIN}" .env
}

restart_preview() {
  log "Building/restarting preview containers"
  cd "$PROJECT_DIR"
  docker compose -f "$COMPOSE_FILE" up -d --build --force-recreate
  docker compose -f "$COMPOSE_FILE" exec -T backend-preview python scripts/seed_preview_access_users.py || true
}

install_nginx_site() {
  log "Installing Nginx site for $DOMAIN"
  cp "$PROJECT_DIR/deploy/nginx-rovicrm-miniapp.conf" /etc/nginx/sites-available/rovicrm-miniapp
  sed -i "s/server_name rovicrm.com.mx;/server_name ${DOMAIN};/" /etc/nginx/sites-available/rovicrm-miniapp
  ln -sf /etc/nginx/sites-available/rovicrm-miniapp /etc/nginx/sites-enabled/rovicrm-miniapp
  nginx -t
  systemctl reload nginx
}

issue_certificate() {
  if [ "$ENABLE_CERTBOT" != "1" ]; then
    log "Skipping certbot because ENABLE_CERTBOT=$ENABLE_CERTBOT"
    return
  fi

  log "Issuing certificate for $DOMAIN"
  if ! command -v certbot >/dev/null 2>&1; then
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
  fi

  local email_args
  if [ -n "$LETSENCRYPT_EMAIL" ]; then
    email_args=(--email "$LETSENCRYPT_EMAIL")
  else
    email_args=(--register-unsafely-without-email)
  fi

  local domains=(-d "$DOMAIN")
  if [ "$INCLUDE_WWW" = "1" ] && getent ahostsv4 "www.${DOMAIN}" >/dev/null 2>&1; then
    domains+=(-d "www.${DOMAIN}")
  fi

  certbot --nginx "${domains[@]}" --redirect --non-interactive --agree-tos "${email_args[@]}"
  nginx -t
  systemctl reload nginx
}

verify() {
  log "Verifying public routes"
  curl -fsS "http://127.0.0.1:8200/api/health"
  printf '\n'
  curl -fsSI "http://127.0.0.1:3200/miniapp/" | sed -n '1,8p'
  curl -fsSI "https://${DOMAIN}/miniapp/" | sed -n '1,12p'
  curl -fsS "https://${DOMAIN}/miniapp/" | grep -q "ROVI MiniApp Broker"
  log "MiniApp is live at https://${DOMAIN}/miniapp/"
}

main() {
  require_root
  ensure_domain_resolves_here
  sync_repo
  write_env
  restart_preview
  install_nginx_site
  issue_certificate
  verify
}

main "$@"
