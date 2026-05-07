# Twilio WhatsApp Sandbox Guide For Rovi Campaigns

## Purpose

This guide explains how to test WhatsApp campaigns in Rovi using the Twilio Sandbox before moving to a production WhatsApp sender.

It is based on:

- Twilio Sandbox for WhatsApp
- Twilio WhatsApp template messaging
- Twilio Content API
- The current Rovi implementation in [backend/server.py](/Users/rogergv/Documents/GitHub/leadvibes/backend/server.py:3983) and [frontend/src/pages/CampaignsPage.js](/Users/rogergv/Documents/GitHub/leadvibes/frontend/src/pages/CampaignsPage.js:892)

## Current Rovi Status

Today Rovi already supports:

- Twilio account validation
- A WhatsApp sender field in Integrations
- Single WhatsApp sends
- WhatsApp campaigns
- Delivery status webhook updates

Current limitation:

- Rovi sends WhatsApp with free-form `body`
- Sandbox business-initiated outbound messaging should use pre-approved templates via `ContentSid` and `ContentVariables`

That means the current WhatsApp campaign flow is not yet aligned with the recommended Sandbox template flow for outbound campaigns.

## What Twilio Sandbox Allows

According to Twilio's Sandbox documentation:

- The Sandbox is for testing only, not production.
- The shared Sandbox sender is `+14155238886`.
- Only users who joined your Sandbox can receive messages.
- Business-initiated Sandbox messages can use only pre-approved templates.
- When a user messages your business, a 24-hour customer service window opens.
- Inside that 24-hour window, you can send free-form messages.
- Outside that window, you must use an approved template.
- Sandbox membership expires after 3 days and the user must rejoin.
- The Sandbox can send only one message every three seconds.

Official sources:

- https://www.twilio.com/docs/whatsapp/sandbox
- https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates
- https://www.twilio.com/docs/content/content-api-resources

## How Sandbox Messaging Works In Practice

There are two outbound modes we need to support in Rovi:

### 1. Template mode

Use this when:

- you start the conversation
- the lead has not messaged recently
- you are sending a campaign blast

Twilio Sandbox provides built-in approved templates for testing, such as:

- Appointment reminder
- Order notification
- Verification code

Template sends use:

- `From=whatsapp:+14155238886`
- `To=whatsapp:+52...`
- `ContentSid=HX...`
- `ContentVariables={...}`

Example:

```bash
curl 'https://api.twilio.com/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Messages.json' -X POST \
  --data-urlencode 'To=whatsapp:+5255XXXXXXXX' \
  --data-urlencode 'From=whatsapp:+14155238886' \
  --data-urlencode 'ContentSid=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' \
  --data-urlencode 'ContentVariables={"1":"12/1","2":"3pm"}' \
  -u ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:your_auth_token
```

### 2. Free-form mode

Use this when:

- the lead already sent a WhatsApp message
- the conversation is still inside the 24-hour customer service window

This mode uses:

- `body=...`
- `from_=whatsapp:+14155238886`
- `to=whatsapp:+52...`

## Recommended Testing Flow For Rovi

### Step 1. Activate the Sandbox

In Twilio Console:

1. Open the WhatsApp Sandbox page.
2. Confirm the Sandbox terms.
3. Copy the Sandbox join code.

### Step 2. Join each test lead number

Every test phone must send:

```text
join <your-sandbox-code>
```

to:

```text
+14155238886
```

Or scan the Sandbox QR and send the prefilled message.

If a user does not join, Sandbox outbound sends fail.

### Step 3. Configure Rovi

In `Settings > Integrations`:

- `Twilio Account SID` = your `AC...`
- `Twilio Auth Token` = your Twilio Auth Token
- `Twilio WhatsApp Number` = `whatsapp:+14155238886`

Recommended format:

```text
whatsapp:+14155238886
```

### Step 4. Use Sandbox-friendly leads

For the first tests:

- use only one or two leads
- confirm their phone is in E.164 format or close enough for Twilio normalization
- confirm they joined the Sandbox
- confirm `whatsapp_opt_out` is not enabled

### Step 5. Send template-based outbound messages

For campaign-style outbound WhatsApp in Sandbox:

- do not rely on free-form `body`
- use `ContentSid` + `ContentVariables`

### Step 6. Use free-form only for follow-up replies

If the lead already wrote to your Sandbox recently:

- free-form follow-up is valid during the 24-hour window
- this is better for one-to-one follow-up than for campaign broadcasting

## Why This Matters For Campaigns

Most outbound campaigns are business-initiated. In Sandbox, that means:

- the lead must have joined
- the campaign should send with template mode
- the message content should be parameterized

So for WhatsApp campaigns in Rovi, Sandbox should be treated as:

- a template-driven channel for outbound campaigns
- a free-form channel only for active conversations

## Recommended Rovi UX For Sandbox

Inside the campaign composer, when `campaign_type = whatsapp`, show:

### Channel mode

- `Template (Sandbox / outbound campaign)`
- `Free-form (active 24h conversation only)`

### If template mode is selected

Show:

- Template selector
- `ContentSid`
- Variables editor
- Joined-Sandbox warning
- Rate limit warning

### If free-form mode is selected

Show:

- Message body textarea
- Warning that it only works inside the 24-hour customer service window

## Suggested Built-In Sandbox Templates In Rovi

For the MVP, Rovi can expose preconfigured Sandbox template presets:

### Appointment reminder

- Label: `Appointment Reminder`
- `ContentSid`: configurable in admin
- Variables:
  - `1` = date
  - `2` = time

### Order notification

- Label: `Order Notification`
- Variables:
  - `1` = order type
  - `2` = item
  - `3` = delivery date
  - `4` = details URL

### Verification code

- Label: `Verification Code`
- Variables:
  - `1` = brand
  - `2` = code

## Suggested Rovi Validation Rules

Before launching a WhatsApp Sandbox campaign, validate:

- workspace has Twilio configured
- workspace has `twilio_whatsapp_number`
- sender equals or resolves to `whatsapp:+14155238886` in Sandbox mode
- every lead has phone
- every lead is not opted out
- every target lead joined the Sandbox if we track that state
- if mode is template:
  - `ContentSid` exists
  - required variables are present
- if mode is free-form:
  - the lead has an open 24-hour conversation window

## Operational Risks

### Sandbox-specific

- leads who did not join will fail
- join expires after 3 days
- throughput is slow
- custom templates are not available in Sandbox

### Product-specific

- current Rovi campaign code uses `body`, not `ContentSid`
- free-form campaigns can appear to work in narrow cases but are not the correct general outbound campaign model for Sandbox
- without a public status callback URL, message status tracking is limited in local environments

## Recommended Migration Path

### Development / QA

- use Sandbox
- use template mode for outbound campaigns
- use free-form only for reply workflows

### Staging / Production

- move to a registered WhatsApp sender
- use Twilio Content Templates
- submit templates for WhatsApp approval
- keep `ContentSid` support in Rovi because it is also the right production pattern

## Manual Test Checklist

- Sandbox activated in Twilio
- Test phone joined with `join <code>`
- `twilio_whatsapp_number` configured as `whatsapp:+14155238886`
- One lead selected
- Lead has valid phone
- Lead does not have `whatsapp_opt_out`
- Template mode chosen
- `ContentSid` configured
- Variables filled
- Campaign launched
- `whatsapp_records` shows queued/sent
- Twilio status callback updates record when public callback URL exists

