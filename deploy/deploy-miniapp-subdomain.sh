#!/usr/bin/env bash
#
# Deploy the ROVI Telegram MiniApp to a dedicated subdomain as static files.
#
# Safe by design: it does NOT touch any docker container and opens NO new ports.
# It only (1) syncs the static MiniApp bundle to /var/www, (2) installs an nginx
# vhost that serves those files and reverse-proxies /api to the EXISTING backend,
# and (3) issues a TLS certificate. Production/dev/preview containers and their
# ports (3000/8000, 3100/8100, 3200/8200) are left untouched.
#
# Run as root on the VPS, from a checkout of this repo:
#   DOMAIN=miniapp.rovicrm.com API_PORT=8000 \
#   LETSENCRYPT_EMAIL=you@example.com bash deploy/deploy-miniapp-subdomain.sh
#
set -euo pipefail

DOMAIN="${DOMAIN:-miniapp.rovicrm.com}"
API_PORT="${API_PORT:-8000}"                 # 8000 prod · 8200 preview
REPO_DIR="${REPO_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
WEB_ROOT="${WEB_ROOT:-/var/www/miniapp-rovicrm}"
SITE_NAME="${SITE_NAME:-miniapp-rovicrm}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"
ENABLE_CERTBOT="${ENABLE_CERTBOT:-1}"

log() { printf '\n[%s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

require_root() {
  if [ "$(id -u)" != "0" ]; then
    echo "Run this script as root on the VPS." >&2
    exit 1
  fi
}

ensure_dns_resolves_here() {
  local server_ip resolved
  server_ip="$(curl -fsS --max-time 5 https://api.ipify.org || hostname -I | awk '{print $1}')"
  resolved="$(getent ahostsv4 "$DOMAIN" | awk '{print $1; exit}' || true)"

  if [ -z "$resolved" ]; then
    echo "DNS for $DOMAIN does not resolve. Create an A record -> $server_ip and retry." >&2
    exit 1
  fi
  if [ "$resolved" != "$server_ip" ]; then
    echo "DNS for $DOMAIN resolves to $resolved but this VPS is $server_ip." >&2
    echo "Fix the A record before issuing the certificate." >&2
    exit 1
  fi
  log "DNS OK: $DOMAIN -> $resolved"
}

sync_static_bundle() {
  local src="$REPO_DIR/frontend/public/miniapp"
  if [ ! -f "$src/index.html" ]; then
    echo "MiniApp bundle not found at $src" >&2
    exit 1
  fi
  log "Syncing MiniApp bundle -> $WEB_ROOT"
  mkdir -p "$WEB_ROOT"
  # --delete keeps the web root in sync; exclude dev-only artifacts.
  rsync -a --delete \
    --exclude '.screenshots/' \
    --exclude 'mock.js' \
    "$src/" "$WEB_ROOT/"
  chown -R www-data:www-data "$WEB_ROOT" 2>/dev/null || true
}

install_nginx_site() {
  log "Installing nginx vhost for $DOMAIN (API -> 127.0.0.1:$API_PORT)"
  local tmp="/etc/nginx/sites-available/$SITE_NAME"
  cp "$REPO_DIR/deploy/nginx-miniapp-rovicrm.conf" "$tmp"
  sed -i "s/server_name miniapp.rovicrm.com;/server_name ${DOMAIN};/" "$tmp"
  sed -i "s#proxy_pass http://127.0.0.1:8000;#proxy_pass http://127.0.0.1:${API_PORT};#" "$tmp"
  ln -sf "$tmp" "/etc/nginx/sites-enabled/$SITE_NAME"
  nginx -t
  systemctl reload nginx
}

issue_certificate() {
  if [ "$ENABLE_CERTBOT" != "1" ]; then
    log "Skipping certbot (ENABLE_CERTBOT=$ENABLE_CERTBOT)"
    return
  fi
  log "Issuing TLS certificate for $DOMAIN"
  if ! command -v certbot >/dev/null 2>&1; then
    apt-get update && apt-get install -y certbot python3-certbot-nginx
  fi
  local email_args
  if [ -n "$LETSENCRYPT_EMAIL" ]; then
    email_args=(--email "$LETSENCRYPT_EMAIL")
  else
    email_args=(--register-unsafely-without-email)
  fi
  certbot --nginx -d "$DOMAIN" --redirect --non-interactive --agree-tos "${email_args[@]}"
  nginx -t
  systemctl reload nginx
}

verify() {
  log "Verifying"
  curl -fsS "http://127.0.0.1:${API_PORT}/api/health" && printf '\n'
  curl -fsSI "https://${DOMAIN}/" | sed -n '1,12p'
  if curl -fsS "https://${DOMAIN}/" | grep -qi "rovi"; then
    log "MiniApp is live at https://${DOMAIN}/"
  else
    echo "WARNING: served page did not contain expected marker; check $WEB_ROOT" >&2
  fi
}

main() {
  require_root
  ensure_dns_resolves_here
  sync_static_bundle
  install_nginx_site
  issue_certificate
  verify
}

main "$@"
