# Rovi Runbook: Vincular Facebook Messenger e Instagram DM con Chatwoot

Fecha: 2026-06-17

Objetivo: conectar Facebook Messenger e Instagram DM a `https://chat.rovicrm.com`, crear sus inboxes en Chatwoot y, despues de probar el flujo manual, conectar `Hermes Orquestador`.

## Estado actual

- Chatwoot esta activo en `https://chat.rovicrm.com`.
- Endpoints publicos:
  - Messenger: `https://chat.rovicrm.com/bot`
  - Instagram webhook: `https://chat.rovicrm.com/webhooks/instagram`
  - Instagram callback: `https://chat.rovicrm.com/instagram/callback`
- No existen inboxes Facebook/Instagram todavia.
- Variables/config requeridas estan vacias:
  - `FB_APP_ID`
  - `FB_APP_SECRET`
  - `FB_VERIFY_TOKEN`
  - `INSTAGRAM_APP_ID`
  - `INSTAGRAM_APP_SECRET`
  - `INSTAGRAM_VERIFY_TOKEN`
- `Hermes Orquestador` existe, pero no esta vinculado a ningun inbox.

## Investigacion: MCP o CLI de Meta

Existe un producto oficial de Meta llamado Ads AI Connectors, con:

- Ads MCP remoto: `https://mcp.facebook.com/ads`
- Ads CLI: herramienta de linea de comandos para Meta Ads / Marketing API.

Pero esto sirve para publicidad/Marketing API, no para hacer el setup completo de Chatwoot Messenger/Instagram: no crea automaticamente la app, no configura todos los productos Messenger/Instagram, no hace App Review y no crea inboxes en Chatwoot.

Lo que si se puede automatizar parcialmente:

- Graph API: configurar algunas suscripciones de webhooks de apps/pages.
- Business SDKs oficiales: JavaScript, Python, PHP, Ruby y Java, encima de Graph API.
- Chatwoot API/Rails: vincular `Hermes Orquestador` a inboxes despues de crearlos.

Lo que sigue siendo manual o semi-manual:

- Crear app en Meta Developers.
- Agregar productos Messenger/Instagram.
- Configurar Instagram Business Login.
- Pasar App Review / permisos avanzados.
- Autorizar paginas/cuentas desde el flujo OAuth.

Nota importante de Meta: las suscripciones de Instagram deben configurarse desde App Dashboard.

## Paso 0: Elegir ruta de Instagram

Usar esta ruta:

- Instagram Business Login, recomendada por Chatwoot para versiones v4.1+.

Evitar esta salvo necesidad:

- Instagram via Facebook Login, legacy y con soporte futuro reducido.

## Paso 1: Crear tokens de verificacion

En tu maquina o en el VPS:

```bash
openssl rand -hex 32
openssl rand -hex 32
```

Usar uno para:

- `FB_VERIFY_TOKEN`

Y otro para:

- `INSTAGRAM_VERIFY_TOKEN`

No compartirlos en chats ni commits.

## Paso 2: Crear app en Meta Developers

En Meta Developers:

1. Ir a `https://developers.facebook.com/apps/`.
2. Crear app.
3. Seleccionar `Other`.
4. Tipo: `Business`.
5. Nombre sugerido: `Rovi CRM Omnichannel`.
6. Asociar Business Manager de Rovi si aplica.
7. En `Basic Settings`, configurar:
   - App Domains: `chat.rovicrm.com`
   - Privacy Policy URL: `https://rovicrm.com/privacy-policy.html`
   - User Data Deletion URL: `https://rovicrm.com/data-deletion.html`
   - Contact Email: `hola@rovicrm.com`
   - Category: `Business`
8. Copiar:
   - App ID
   - App Secret

Si el dropdown de Meta no muestra exactamente `Business`, usar la categoria mas cercana disponible para software/CRM/atencion comercial, por ejemplo `Business and Pages`, `Productivity` o `Utilities`.

## Paso 3: Configurar Facebook Messenger en Chatwoot

En el VPS, editar `/docker/chatwoot-prod/.env` y agregar:

```bash
FB_APP_ID=<META_APP_ID>
FB_APP_SECRET=<META_APP_SECRET>
FB_VERIFY_TOKEN=<TOKEN_GENERADO>
```

Luego reiniciar Chatwoot:

```bash
cd /docker/chatwoot-prod
docker compose up -d rails sidekiq
```

Validar sin imprimir secretos:

```bash
docker exec chatwoot-prod-rails sh -lc '
for k in FB_APP_ID FB_APP_SECRET FB_VERIFY_TOKEN; do
  v=$(printenv "$k")
  if [ -n "$v" ]; then echo "$k=SET"; else echo "$k=EMPTY"; fi
done
'
```

## Paso 4: Configurar Messenger en Meta

En Meta Dashboard:

1. Agregar producto `Facebook Login`.
2. Activar:
   - Web OAuth Login.
   - Login with JavaScript SDK.
3. Agregar dominio permitido:
   - `chat.rovicrm.com`
4. Agregar producto `Messenger`.
5. En Messenger Webhooks:
   - Callback URL: `https://chat.rovicrm.com/bot`
   - Verify Token: valor de `FB_VERIFY_TOKEN`
6. Suscribir campos:
   - `messages`
   - `messaging_postbacks`
   - `message_deliveries`
   - `message_reads`
   - `message_echoes`
7. Agregar la Facebook Page de Rovi al producto Messenger.
8. Suscribir esa Page a la app.

## Paso 5: Crear inbox Facebook en Chatwoot

En Chatwoot:

1. Ir a `Settings -> Inboxes -> Add Inbox`.
2. Elegir `Messenger`.
3. Click en Facebook Login.
4. Autorizar permisos.
5. Seleccionar la pagina de Facebook.
6. Agregar agentes.
7. Guardar.

Prueba:

1. Enviar DM a la pagina desde una cuenta permitida/tester.
2. Confirmar que aparece una conversacion en Chatwoot.
3. Responder desde Chatwoot.

## Paso 6: Configurar Instagram Business Login en Chatwoot

En Chatwoot Super Admin:

```text
https://chat.rovicrm.com/super_admin/app_config?config=instagram
```

Configurar:

- `INSTAGRAM_APP_ID`
- `INSTAGRAM_APP_SECRET`
- `INSTAGRAM_VERIFY_TOKEN`

Si el valor existe:

- `ENABLE_INSTAGRAM_CHANNEL_HUMAN_AGENT`

Activarlo solo si se requiere soporte de Human Agent tag.

## Paso 7: Configurar Instagram en Meta

En Meta Dashboard:

1. Agregar producto `Instagram`.
2. Configurar Webhooks:
   - Callback URL: `https://chat.rovicrm.com/webhooks/instagram`
   - Verify Token: valor de `INSTAGRAM_VERIFY_TOKEN`
3. Suscribir eventos:
   - `messages`
   - `messaging_seen`
   - `message_reactions`
4. Configurar Instagram Business Login:
   - Redirect URL: `https://chat.rovicrm.com/instagram/callback`
5. Agregar Instagram tester para pruebas.
6. Confirmar que la cuenta de Instagram sea Professional/Business.
7. Pasar app a Live cuando se busque produccion.

## Paso 8: Crear inbox Instagram en Chatwoot

En Chatwoot:

1. Ir a `Settings -> Inboxes -> Add Inbox`.
2. Elegir `Instagram`.
3. Autorizar con Instagram Business Login.
4. Seleccionar cuenta.
5. Agregar agentes.
6. Guardar.

Prueba:

1. Enviar DM a Instagram desde una cuenta tester.
2. Confirmar entrada en Chatwoot.
3. Responder desde Chatwoot.

## Paso 9: Solicitar permisos / App Review

Facebook Messenger normalmente necesita advanced access para:

- `pages_messaging`
- `pages_show_list`
- `pages_manage_metadata`
- `business_management`
- `pages_read_engagement`
- Business Asset User Profile Access

Instagram Business Login normalmente necesita:

- `instagram_business_basic`
- `instagram_business_manage_messages`
- `human_agent` si se usara ventana extendida/handoff humano.

## Paso 10: Conectar Hermes despues de probar manualmente

No vincular Hermes antes de comprobar que los DMs entran y salen bien.

Luego:

1. Abrir cada inbox en Chatwoot.
2. Ir a `Bot Configuration`.
3. Seleccionar `Hermes Orquestador`.
4. Guardar.

Verificar:

```bash
docker logs -f hermes-chatwoot-bridge
docker logs -f chatwoot-prod-rails
docker logs -f chatwoot-prod-sidekiq
```

Validar en DB:

```bash
docker exec chatwoot-prod-rails bundle exec rails runner '
puts "agent_bot_inboxes=#{AgentBotInbox.count}"
AgentBotInbox.find_each { |x| puts "bot=#{x.agent_bot_id} inbox=#{x.inbox_id}" }
'
```

## Paso 11: Prueba end-to-end

Para cada canal:

1. Enviar mensaje entrante.
2. Confirmar conversacion en Chatwoot.
3. Confirmar contacto creado.
4. Confirmar respuesta manual.
5. Activar Hermes.
6. Enviar otro mensaje.
7. Confirmar evento en `hermes-chatwoot-bridge`.
8. Confirmar respuesta o handoff.
9. Confirmar si debe crearse/actualizarse lead en Rovi CRM.

## Automatizacion posible

Cuando ya existan App ID/App Secret/tokens:

- Se puede aplicar `.env` y reiniciar Chatwoot por SSH.
- Se puede validar variables y rutas.
- Se puede usar Graph API para algunas suscripciones de Facebook Page.
- Se puede usar Chatwoot API/Rails para vincular AgentBot a inboxes.

No conviene automatizar sin supervision:

- App Review.
- Permisos avanzados.
- OAuth de paginas/cuentas.
- Instagram webhook setup, porque Meta lo exige desde App Dashboard.

## Fuentes oficiales

- Chatwoot Facebook self-hosted setup: https://developers.chatwoot.com/self-hosted/configuration/features/integrations/facebook-channel-setup
- Chatwoot Instagram Business Login: https://developers.chatwoot.com/self-hosted/configuration/features/integrations/instagram-via-instagram-business-login
- Chatwoot Instagram via Facebook Login: https://developers.chatwoot.com/self-hosted/configuration/features/integrations/instagram-channel-setup
- Meta Graph API: https://developers.facebook.com/docs/graph-api/
- Meta Webhooks: https://developers.facebook.com/docs/graph-api/webhooks/
- Meta App Dashboard: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/
- Meta App subscriptions edge: https://developers.facebook.com/docs/graph-api/reference/app/subscriptions/
- Meta Page subscribed apps edge: https://developers.facebook.com/docs/graph-api/reference/page/subscribed_apps/
- Meta Ads CLI: https://developers.facebook.com/documentation/ads-commerce/ads-ai-connectors/ads-cli/ads-cli-overview
