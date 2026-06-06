# OpenWA Local Test Runbook

Este flujo permite probar Rovi localmente contra el OpenWA que ya corre en el VPS antes de desplegar cambios.

## Estado del VPS

- Rovi production: `rovi-backend`, `rovi-frontend`, `rovi-mongodb`
- OpenWA: `/docker/openwa/docker-compose.yml`
- API OpenWA: `127.0.0.1:2785` en el VPS
- Dashboard OpenWA: `:2886` publicado en el VPS

## 1. Túnel SSH local

Desde tu máquina:

```bash
ssh -L 2785:127.0.0.1:2785 root@31.220.63.211
```

En otra terminal verifica:

```bash
curl http://127.0.0.1:2785/api/health
```

## 2. Variables backend local

En `backend/.env` o en la shell local:

```bash
export OPENWA_API_BASE_URL=http://127.0.0.1:2785/api
export OPENWA_API_KEY=<openwa-api-key>
export OPENWA_ROVI_WEBHOOK_SECRET=<shared-webhook-secret>
```

No guardes llaves reales en git.

## 3. Levantar backend local

```bash
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

## 4. Probar desde Rovi API

Con token JWT de un usuario Rovi:

```bash
curl -H "Authorization: Bearer $ROVI_TOKEN" \
  http://127.0.0.1:8000/api/whatsapp/openwa/health
```

Crear una sesión:

```bash
curl -X POST \
  -H "Authorization: Bearer $ROVI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"rovi-test-broker","auto_start":true}' \
  http://127.0.0.1:8000/api/whatsapp/openwa/sessions
```

Obtener QR:

```bash
curl -H "Authorization: Bearer $ROVI_TOKEN" \
  http://127.0.0.1:8000/api/whatsapp/openwa/sessions/<session_id>/qr
```

Enviar texto a un chat existente:

```bash
curl -X POST \
  -H "Authorization: Bearer $ROVI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chat_id":"+529841855257","text":"Prueba desde Rovi local"}' \
  http://127.0.0.1:8000/api/whatsapp/openwa/sessions/<session_id>/send-text
```

## 5. Webhook inbound

Para pruebas locales con webhook público, usa un túnel temporal hacia el backend local y registra:

```bash
POST /api/whatsapp/openwa/sessions/<session_id>/webhooks
{
  "url": "https://<public-tunnel>/api/whatsapp/openwa/webhook",
  "events": ["message", "message_ack", "session_status"]
}
```

El endpoint valida `x-rovi-openwa-secret` si `OPENWA_ROVI_WEBHOOK_SECRET` está configurado.

## 6. Antes de producción

- Rotar `OPENWA_API_KEY`.
- Quitar llaves de logs.
- Restringir `openwa-dashboard` por Nginx auth o allowlist.
- Conectar `rovi-backend` a `openwa-network` o crear una red Docker compartida.
- Cambiar `OPENWA_API_BASE_URL` en producción a `http://openwa-api:2785/api`.
