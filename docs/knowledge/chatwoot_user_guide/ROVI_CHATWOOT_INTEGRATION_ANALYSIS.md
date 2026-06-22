# Rovi + Chatwoot Integration Analysis

Date: 2026-06-17

This note summarizes the Chatwoot documentation corpus captured in this folder and the read-only VPS inspection for the Rovi omnichannel setup. Secrets, tokens, and credentials are intentionally omitted.

## Knowledge Base

Graphify outputs:

- `graphify-out/graph.html`: interactive knowledge graph.
- `graphify-out/graph.json`: GraphRAG-ready graph data.
- `graphify-out/GRAPH_REPORT.md`: audit/report with god nodes, communities, surprising links, and suggested questions.
- `raw/`: captured Chatwoot user-guide articles.
- `metadata/index.json` and `metadata/summary.json`: crawl metadata.

Graph summary:

- 132 public Chatwoot guide articles captured locally.
- 131 files included in Graphify extraction.
- 1 public document was skipped by the sensitivity heuristic.
- 871 nodes, 865 edges, 60 communities.
- Main communities: Channels and Inboxes, Agents and Roles, Captain and Agent Bots, Webhooks and Automation, WhatsApp Manual/Twilio, WhatsApp Embedded/Meta, Telegram Channel, Facebook/Instagram, API Channel Access.

## Chatwoot Concepts That Matter For Rovi

In Chatwoot, a channel is the type of communication, such as Website, Email, WhatsApp, SMS, Facebook, Instagram, or Telegram. An inbox is a concrete configured instance of a channel. Every conversation belongs to one inbox, and each inbox has its own agents, business hours, greetings, forms, and routing rules.

For Rovi, the important model is:

```text
Channel type -> Inbox -> Conversation -> Assignment / Bot / Human handoff
```

Global webhooks and AgentBots are different mechanisms:

- Global webhooks live under Settings -> Integrations -> Webhooks. They post selected account events to a URL.
- AgentBots live under Settings -> Bots and are connected per inbox. When connected, conversations are placed in pending status and events are sent to the bot URL. The bot can reply through Chatwoot APIs or hand off by opening the conversation.

For Hermes, AgentBot is the better fit than a generic global webhook because the intended flow is bot triage plus human handoff.

## Desired Rovi Architecture

Recommended target:

```text
WhatsApp / Telegram / Facebook / Website
        |
        v
Chatwoot Inbox per channel or number
        |
        v
AgentBot: Hermes Orquestador
        |
        v
hermes-chatwoot-bridge
        |
        v
Hermes agent runtime + Rovi CRM context
        |
        v
Chatwoot API reply, CRM update, or human handoff
```

This keeps Chatwoot as the omnichannel inbox and human handoff layer, while Hermes and Rovi provide automation, CRM context, lead qualification, and action proposals.

## VPS State Observed

Running services relevant to this integration:

- `chatwoot-prod-rails`: Chatwoot Rails, exposed internally on `127.0.0.1:3010`.
- `chatwoot-prod-sidekiq`, `chatwoot-prod-postgres`, `chatwoot-prod-redis`.
- `hermes-chatwoot-bridge`: internal bridge on `127.0.0.1:8006`.
- `hermes-agent`: internal Hermes runtime on `127.0.0.1:8642`.
- `openwa-api`: internal OpenWA API on `127.0.0.1:2785`.
- `openwa-dashboard`: exposed on host port `2886`.
- `rovi-backend`: public API on port `8000`.
- `rovi-frontend`: local Nginx frontend on `127.0.0.1:3000`.

Chatwoot database state:

- Accounts: 1 (`Rovi CRM`).
- Inboxes: 3.
  - `RoviCRM`: `Channel::WebWidget`.
  - `RoviOpenWA`: `Channel::Api`.
  - `WhatsApp OpenWA Rovi`: `Channel::Api`.
- Agent bots: 1.
  - `Hermes Orquestador`.
  - Bot URL points to the internal bridge: `http://hermes-chatwoot-bridge:8006/chatwoot/webhook`.
- AgentBot inbox links: 0.
- Global webhooks: 0.
- Users: 1.
- Inbox members: 3.
- Existing conversations:
  - `WhatsApp OpenWA Rovi`: 1 conversation.
  - Other two inboxes: 0 conversations.

Interpretation:

Hermes is created as an AgentBot, and the bridge exists, but Hermes is not currently connected to any Chatwoot inbox. That means Chatwoot will not send AgentBot events to Hermes until the bot is linked in each target inbox's Bot Configuration.

## Channel Plan

### WhatsApp

There are two possible strategies:

- Chatwoot native WhatsApp using Meta Cloud API.
- Existing OpenWA -> Rovi/Chatwoot API bridge.

Do not connect the same WhatsApp number to both flows without a clear routing rule. For the current VPS, OpenWA already exists and Chatwoot has API-channel inboxes for it, so the pragmatic path is to keep OpenWA for the current number and route messages into the Chatwoot API inbox. For a new official number, Chatwoot native WhatsApp Embedded Signup is cleaner.

### Telegram

Chatwoot supports a Telegram inbox using a BotFather token. The VPS currently shows Telegram polling in `rovi-backend`, so there may already be a Rovi-side Telegram agent flow.

Choose one owner:

- If Chatwoot owns Telegram: create a Telegram inbox in Chatwoot and link `Hermes Orquestador` to that inbox.
- If Rovi owns Telegram: keep Telegram polling in Rovi and optionally mirror important conversations into Chatwoot through the API channel.

Avoid having the same bot token active in two independent polling/webhook systems.

### Facebook

Use Chatwoot native Facebook Messenger inbox. Facebook setup goes through Settings -> Inboxes -> Add Inbox -> Messenger, then Facebook login, page selection, permissions, and agent assignment. Once the inbox exists, link `Hermes Orquestador` if AI triage is desired.

### Website

The existing `RoviCRM` web widget inbox can be linked to Hermes if the website chat should use AI triage. If this is mainly for human chat, keep it human-only.

## Risks And Fixes

1. AgentBot not attached to inboxes.
   - Current effect: Hermes bridge exists but does not receive Chatwoot AgentBot events.
   - Fix: in Chatwoot, open each target inbox -> Bot Configuration -> choose `Hermes Orquestador` -> Save.

2. No global webhooks configured.
   - This is not necessarily a problem if AgentBot is the chosen path.
   - Use global webhooks only for analytics, auditing, CRM sync, or side effects that should happen regardless of bot assignment.

3. OpenWA dashboard/API exposure should be reviewed.
   - `openwa-dashboard` is exposed on `0.0.0.0:2886`.
   - Nginx also proxies `openwa.rovicrm.com` to dashboard/API paths.
   - Recommended: protect dashboard/API with auth, IP allowlist, VPN, or internal-only routing.

4. Rovi backend logs expose JWTs in WebSocket query strings.
   - Observed logs include full WebSocket URLs containing `token=...`.
   - Recommended: move tokens to headers where possible, or redact query strings in access logs.

5. Chatwoot production uses `chatwoot/chatwoot:latest`.
   - Recommended: pin a known version to avoid surprise upgrades.

6. Signup is enabled in Chatwoot production.
   - `ENABLE_ACCOUNT_SIGNUP=true`.
   - Recommended: disable unless public signup is intentional.

7. Rovi backend restarted/recreated recently during inspection.
   - Observed: healthy, `restartCount=0`, started at 2026-06-17 10:26 UTC.
   - Recommended: review deployment/auto-update process if this was unexpected.

## Practical Next Steps

1. Decide the owner for each channel:
   - WhatsApp current number: OpenWA or Chatwoot native Meta.
   - Telegram bot: Rovi polling or Chatwoot Telegram inbox.
   - Facebook: Chatwoot native Messenger inbox.

2. Link `Hermes Orquestador` to the inboxes that should be automated.

3. Send one test message per inbox and confirm:
   - Conversation appears in Chatwoot.
   - Status becomes `pending` when bot-managed.
   - `hermes-chatwoot-bridge` receives event.
   - Hermes returns a reply or opens the conversation for human handoff.

4. Harden OpenWA and redact JWT logging before wider testing.

## Source Docs

- Chatwoot user guide: https://www.chatwoot.com/hc/user-guide/en
- Channels and inboxes: https://www.chatwoot.com/hc/user-guide/articles/1677492191-adding-inboxes
- Webhooks: https://www.chatwoot.com/hc/user-guide/articles/1677693021-how-to-use-webhooks
- Agent bots: https://www.chatwoot.com/hc/user-guide/articles/1677497472-how-to-use-agent-bots
- WhatsApp channel: https://www.chatwoot.com/hc/user-guide/articles/1677832735-how-to-setup-a-whats_app-channel
- Telegram channel: https://www.chatwoot.com/hc/user-guide/articles/1677838569-how-to-setup-a-telegram-channel
- Facebook channel: https://www.chatwoot.com/hc/user-guide/articles/1677778588-how-to-setup-a-facebook-channel
