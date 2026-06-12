# Telegram: modo polling vs webhook

Desde junio 2026 la ingesta de updates de Telegram soporta dos modos, controlados
por la variable de entorno del backend `TELEGRAM_UPDATE_MODE`:

| Modo | Valor | Cómo funciona |
|---|---|---|
| Webhook (default) | `webhook` | Telegram hace POST a `/api/telegram/...`. Requiere URL pública HTTPS válida (`ROVI_PUBLIC_API_BASE_URL`). |
| Polling | `polling` | El backend corre un loop `getUpdates` (long polling, 30s) por cada bot activo. No requiere URL pública ni certificado. |

En ambos modos los updates entran al **mismo pipeline**: deduplicación por
`update_id` en `telegram_webhook_updates`, encolado y procesamiento del turno del
agente en background (el LLM nunca bloquea ni la respuesta del webhook ni el loop
de polling).

## Activar polling

```bash
# .env del backend (o environment del contenedor)
TELEGRAM_UPDATE_MODE=polling
```

Al arrancar, el backend:

1. Hace `deleteWebhook` para cada bot (Telegram no permite webhook y getUpdates a
   la vez con el mismo token).
2. Lanza un loop de polling para el bot principal ROVI (`ROVI_TELEGRAM_BOT_TOKEN`)
   y para cada perfil activo de `telegram_agent_profiles` con token configurado.
3. Refresca la lista de perfiles cada 60s (perfiles nuevos/elimnados/token
   cambiado se detectan sin reiniciar).
4. Persiste el offset confirmado en la colección `telegram_polling_state` para no
   reprocesar mensajes tras un reinicio.

## Variables opcionales

| Variable | Default | Descripción |
|---|---|---|
| `TELEGRAM_UPDATE_MODE` | `webhook` | `polling` activa el modo getUpdates |
| `TELEGRAM_POLLING_TIMEOUT_SECONDS` | `30` | Timeout del long poll de getUpdates |
| `TELEGRAM_POLLING_PROFILES_REFRESH_SECONDS` | `60` | Cada cuánto se refresca la lista de bots/perfiles |

## Reglas importantes

- **Un solo consumidor por bot token.** Telegram responde `409 Conflict` si dos
  procesos hacen getUpdates con el mismo token, o si queda un webhook activo. El
  loop maneja el 409 (re-ejecuta deleteWebhook y reintenta con backoff), pero la
  solución real es no compartir token entre entornos (prod/dev/preview) ni correr
  varias réplicas del backend con polling activo.
- **Volver a webhook:** pon `TELEGRAM_UPDATE_MODE=webhook`, reinicia el backend y
  re-registra los webhooks (endpoint `/api/telegram-agents/profiles/{id}/set-webhook`
  para perfiles; setWebhook manual para el bot principal). El polling no borra la
  configuración de webhook guardada en los perfiles, solo la desactiva en Telegram.
- **Mensajes problemáticos no bloquean la cola:** si el despacho de un update
  falla, se registra en logs y el offset avanza igual.

## Dónde mirar si algo falla

- Logs del backend: líneas `Telegram polling ...` (inicio de loops, 409, errores
  de getUpdates).
- Colección `telegram_webhook_updates`: estado por update (`queued`,
  `processing`, `processed`, `failed`, con `error` truncado).
- Colección `telegram_polling_state`: offset por bot (`bot_key`: `rovi-agent` o
  `profile:<profile_id>`).
- Tests: `backend/tests/test_telegram_polling_unit.py`.
