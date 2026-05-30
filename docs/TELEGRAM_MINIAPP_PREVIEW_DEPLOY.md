# ROVI Telegram MiniApp Preview Deploy

## Public URL

Preview serves the Telegram MiniApp from the same frontend container as ROVI CRM:

```text
http://preview.srv1318804.hstgr.cloud/miniapp/
```

The final Telegram menu URL should be:

```text
https://rovicrm.com.mx/miniapp/
```

When HTTPS is fixed for the preview subdomain, use:

```text
https://preview.srv1318804.hstgr.cloud/miniapp/
```

Telegram requires a valid HTTPS URL for the MiniApp menu button. At the time this
was added, `http://preview.srv1318804.hstgr.cloud/api/health` responds correctly,
but the HTTPS certificate for `preview.srv1318804.hstgr.cloud` does not match the
preview hostname.

## How It Connects To Preview CRM

The MiniApp is copied into:

```text
frontend/public/miniapp/
```

The frontend Nginx serves `/miniapp/` as static assets and keeps `/api/` proxied
to the preview backend container through the `rovi-backend` network alias.
Because the MiniApp calls `/api/telegram-miniapp/session` with a relative URL, it
uses the same preview CRM origin automatically.

## Required Preview Secrets

Add these secrets to GitHub Actions or the VPS `.env` used by
`docker-compose.preview.yml`:

```bash
ROVI_TELEGRAM_BOT_TOKEN=...
ROVI_TELEGRAM_BOT_USERNAME=...
ROVI_HERMES_WEBHOOK_SECRET=...
ROVI_PUBLIC_API_BASE_URL=http://preview.srv1318804.hstgr.cloud
```

If the backend preview container should write directly into Hermes profiles on
the VPS, also set:

```bash
ROVI_HERMES_PROFILES_ROOT=/hermes/profiles
ROVI_HERMES_PROFILES_ROOT_HOST=/root/.hermes/profiles
```

The host path may be different if Hermes was installed somewhere else.

## Deploy Flow

Preview deploy is triggered by the `rovi_deploy` branch:

```bash
git push origin HEAD:rovi_deploy
```

The GitHub Action rebuilds `backend-preview` and `frontend-preview`, then seeds
preview users.

If GitHub Actions is unavailable, run this on the VPS after DNS points
`rovicrm.com.mx` to the VPS:

```bash
scp /Users/rogergv/Documents/SoftvibesLab/Rovi/minirovi/rovi-broker-agent-env.md root@srv1318804.hstgr.cloud:/root/rovi-broker-agent-env.md
ssh root@srv1318804.hstgr.cloud
cd /root/rovi-crm/preview
git fetch origin rovi_deploy
git checkout -B rovi_deploy origin/rovi_deploy
chmod +x deploy/deploy-miniapp-preview-domain.sh
LETSENCRYPT_EMAIL=tu-email@dominio.com ./deploy/deploy-miniapp-preview-domain.sh
```

## Telegram BotFather

After the HTTPS certificate is valid:

1. Open BotFather.
2. Select the ROVI bot.
3. Go to `Bot Settings` > `Menu Button`.
4. Configure:

```text
https://rovicrm.com.mx/miniapp/
```
