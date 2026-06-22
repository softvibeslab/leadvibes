# Rovi Facebook + Instagram Linking Checklist

Date: 2026-06-17

This checklist summarizes what is missing to connect Facebook Messenger and Instagram DM to the self-hosted Chatwoot instance at `https://chat.rovicrm.com`.

## Current VPS State

Observed in Chatwoot:

- `Channel::FacebookPage`: 0
- `Channel::Instagram`: 0
- Facebook/Instagram inboxes: 0
- Existing Chatwoot account: `Rovi CRM`
- Existing inboxes:
  - `RoviCRM` (`Channel::WebWidget`)
  - `RoviOpenWA` (`Channel::Api`)
  - `WhatsApp OpenWA Rovi` (`Channel::Api`)
- Existing AgentBot:
  - `Hermes Orquestador`
  - Internal URL: `http://hermes-chatwoot-bridge:8006/chatwoot/webhook`
- AgentBot linked inboxes: 0

Observed configuration:

- `FRONTEND_URL`: set
- `FB_APP_ID`: empty
- `FB_APP_SECRET`: empty
- `FB_VERIFY_TOKEN`: empty
- `IG_VERIFY_TOKEN`: empty
- `INSTAGRAM_APP_ID`: empty
- `INSTAGRAM_APP_SECRET`: empty
- `INSTAGRAM_VERIFY_TOKEN`: empty
- `FACEBOOK_API_VERSION`: set
- `INSTAGRAM_API_VERSION`: set

Public endpoint reachability:

- `https://chat.rovicrm.com/bot`: reachable
- `https://chat.rovicrm.com/webhooks/instagram`: reachable
- `https://chat.rovicrm.com/instagram/callback`: route exists; direct empty request returned HTTP 500, likely because OAuth parameters/config are missing.

## What Is Blocking The Link

### 1. Meta/Facebook App is not configured in Chatwoot

For Facebook Messenger, Chatwoot self-hosted requires:

- `FB_APP_ID`
- `FB_APP_SECRET`
- `FB_VERIFY_TOKEN`

For Instagram via the newer Instagram Business Login path, Chatwoot requires app config values:

- `INSTAGRAM_APP_ID`
- `INSTAGRAM_APP_SECRET`
- `INSTAGRAM_VERIFY_TOKEN`

For Instagram via the older Facebook Login path, Chatwoot uses:

- `FB_APP_ID`
- `FB_APP_SECRET`
- `IG_VERIFY_TOKEN`

Current state: all of these are empty.

### 2. Facebook Messenger product is not configured in Meta

Required Meta app setup for Messenger:

- Add Facebook Login product.
- Enable Web OAuth Login.
- Enable Login with JavaScript SDK.
- Add `chat.rovicrm.com` to allowed domains.
- Add Messenger product.
- Configure callback URL:
  - `https://chat.rovicrm.com/bot`
- Configure verify token:
  - same value as `FB_VERIFY_TOKEN`
- Subscribe page fields:
  - `messages`
  - `messaging_postbacks`
  - `message_deliveries`
  - `message_reads`
  - `message_echoes`

### 3. Instagram product is not configured in Meta

Recommended path for the current Chatwoot version is Instagram Business Login.

Required Meta app setup:

- Add Instagram product.
- Configure app ID/app secret in Chatwoot app config.
- Configure webhook callback:
  - `https://chat.rovicrm.com/webhooks/instagram`
- Configure verify token:
  - same value as `INSTAGRAM_VERIFY_TOKEN`
- Subscribe events:
  - `messages`
  - `messaging_seen`
  - `message_reactions`
- Configure Instagram Business Login redirect URL:
  - `https://chat.rovicrm.com/instagram/callback`
- App mode must be Live to receive production webhooks.

### 4. Meta permissions/app review are not done

For production Facebook Messenger, request/verify advanced access for:

- `pages_messaging`
- `pages_show_list`
- `pages_manage_metadata`
- `business_management`
- `pages_read_engagement`
- Business Asset User Profile Access

For production Instagram, request/verify relevant Instagram messaging permissions. The current Chatwoot docs mention:

- `instagram_business_basic`
- `instagram_business_manage_messages`
- `human_agent`

Older Facebook-login Instagram docs mention:

- `instagram_manage_messages`
- `instagram_basic`
- `pages_show_list`
- `pages_manage_metadata`
- `pages_messaging`
- `business_management`
- `pages_read_engagement`

### 5. Facebook page and Instagram account prerequisites

Facebook:

- The Facebook page must exist.
- The Meta developer user must have admin access to the page.

Instagram:

- Instagram account must be Professional or Business.
- For the Facebook Login path, the Instagram account must be connected to a Facebook page.
- For Instagram Business Login, the Instagram account must be allowed/tester/app-linked in the Meta app setup.

### 6. Chatwoot inboxes do not exist yet

After Meta app config is done:

- Create Facebook Messenger inbox in Chatwoot.
- Create Instagram inbox in Chatwoot.
- Add agents/collaborators.
- Optionally enable business hours, CSAT, labels, automations.
- Link `Hermes Orquestador` in Bot Configuration if AI triage is desired.

## Recommended Execution Order

1. Decide the Instagram route:
   - Prefer Instagram Business Login for new setup.
   - Use Facebook Login only if you need the legacy page-linked flow.

2. Create/configure the Meta app.

3. Add Chatwoot configuration:
   - For Facebook: environment variables in `/docker/chatwoot-prod/.env` or compose env.
   - For Instagram Business Login: `https://chat.rovicrm.com/super_admin/app_config?config=instagram`.

4. Restart Chatwoot Rails and Sidekiq.

5. Configure Meta webhooks:
   - Messenger callback: `https://chat.rovicrm.com/bot`
   - Instagram callback: `https://chat.rovicrm.com/webhooks/instagram`

6. Create inboxes in Chatwoot:
   - Facebook Messenger inbox.
   - Instagram inbox.

7. Add agents and link `Hermes Orquestador` only after manual message flow works.

8. Test:
   - Send DM to Facebook page.
   - Send DM to Instagram account.
   - Confirm conversation appears in Chatwoot.
   - Confirm reply from Chatwoot works.
   - Confirm Hermes bridge receives events if AgentBot is enabled.

## Sources

- Facebook self-hosted setup: https://developers.chatwoot.com/self-hosted/configuration/features/integrations/facebook-channel-setup
- Facebook user guide: https://www.chatwoot.com/hc/user-guide/articles/1677778588-how-to-setup-a-facebook-channel
- Instagram Business Login self-hosted setup: https://developers.chatwoot.com/self-hosted/configuration/features/integrations/instagram-via-instagram-business-login
- Instagram via Facebook Login self-hosted setup: https://developers.chatwoot.com/self-hosted/configuration/features/integrations/instagram-channel-setup
- Instagram user guide: https://www.chatwoot.com/hc/user-guide/articles/1744361165-how-to-setup-an-instagram-channel-via-instagram-login
