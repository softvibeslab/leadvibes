# Twilio WhatsApp Campaigns Implementation Plan

## Goal

Upgrade Rovi's WhatsApp campaign engine so outbound campaigns can send through Twilio Sandbox using `ContentSid` and `ContentVariables`, while preserving free-form messaging for active 24-hour conversations.

## Current Gap

Today the backend sends WhatsApp like this:

- `body=message_body`
- `from_=whatsapp_sender`
- `to=normalize_whatsapp_address(lead["phone"])`

Relevant code:

- [backend/server.py](/Users/rogergv/Documents/GitHub/leadvibes/backend/server.py:4333)
- [backend/server.py](/Users/rogergv/Documents/GitHub/leadvibes/backend/server.py:4646)
- [backend/models.py](/Users/rogergv/Documents/GitHub/leadvibes/backend/models.py:565)
- [frontend/src/pages/CampaignsPage.js](/Users/rogergv/Documents/GitHub/leadvibes/frontend/src/pages/CampaignsPage.js:892)

That works for free-form sends, but it does not model the correct Sandbox template flow for outbound campaign traffic.

## Recommended Product Model

Introduce a WhatsApp sending mode:

- `freeform`
- `template`

For campaigns:

- outbound campaigns default to `template`
- free-form is only for existing 24-hour conversations

## Data Model Changes

### `CampaignCreate` and `Campaign`

Add fields in [backend/models.py](/Users/rogergv/Documents/GitHub/leadvibes/backend/models.py:565):

- `whatsapp_mode: Optional[str] = None`
- `whatsapp_content_sid: Optional[str] = None`
- `whatsapp_content_variables: Optional[Dict[str, str]] = None`
- `whatsapp_template_label: Optional[str] = None`
- `whatsapp_requires_open_window: bool = False`

Suggested values:

- `whatsapp_mode = "template" | "freeform"`

### `WhatsAppRecordCreate` and `WhatsAppRecord`

Add:

- `delivery_mode: Optional[str] = None`
- `content_sid: Optional[str] = None`
- `content_variables: Optional[Dict[str, str]] = None`
- `twilio_error_code: Optional[str] = None`
- `twilio_error_message: Optional[str] = None`

## Backend Changes

### 1. Validation layer

In [backend/server.py](/Users/rogergv/Documents/GitHub/leadvibes/backend/server.py:3983):

- keep current connectivity test
- add a dedicated Sandbox capability test later if needed

### 2. Campaign create validation

When `campaign_type == whatsapp`:

- if `whatsapp_mode == template`
  - require `whatsapp_content_sid`
  - require `whatsapp_content_variables` or variable mappings
- if `whatsapp_mode == freeform`
  - require `message_template`

### 3. Campaign send logic

Change the WhatsApp branch in [backend/server.py](/Users/rogergv/Documents/GitHub/leadvibes/backend/server.py:4333):

#### Template mode

Use:

- `content_sid=campaign["whatsapp_content_sid"]`
- `content_variables=json.dumps(resolved_variables)`
- `from_=whatsapp_sender`
- `to=normalize_whatsapp_address(lead["phone"])`

#### Free-form mode

Keep:

- `body=message_body`

### 4. Variable resolution

Add helper to resolve placeholders per lead:

- date
- time
- name
- property interest
- broker name
- product title
- custom fields

For example:

```json
{
  "1": "{nombre}",
  "2": "{property_interest}"
}
```

should resolve into a final Twilio payload per lead.

### 5. Error handling

Persist Twilio error detail to `whatsapp_records`:

- `error_code`
- `error_message`

This matters for Sandbox because many failures are explainable:

- lead did not join sandbox
- invalid sender
- template not approved
- invalid content variables

### 6. Optional joined-sandbox tracking

New lead field or auxiliary collection:

- `whatsapp_sandbox_joined: bool`
- `whatsapp_last_inbound_at: datetime`

This will improve targeting and validation.

## Frontend Changes

### 1. Campaign composer

In [frontend/src/pages/CampaignsPage.js](/Users/rogergv/Documents/GitHub/leadvibes/frontend/src/pages/CampaignsPage.js:892):

For `whatsapp`, add:

- mode selector
  - `Template (Sandbox / outbound)`
  - `Free-form (24h window)`

### 2. Template mode form

Add fields:

- Template preset selector
- `ContentSid`
- variable inputs
- preview of resolved message body

For Sandbox MVP, presets can be:

- Appointment Reminder
- Order Notification
- Verification Code

### 3. Free-form mode form

Keep existing textarea, but add:

- warning badge
- note that it should be used only for active conversations

### 4. Audience warnings

When mode is `template`:

- warn that only joined Sandbox users will receive the message

When mode is `freeform`:

- warn that only leads with a live 24-hour window should be targeted

## Suggested API Contract

### Create campaign example

```json
{
  "name": "WhatsApp Sandbox reminder",
  "campaign_type": "whatsapp",
  "whatsapp_mode": "template",
  "whatsapp_template_label": "Appointment Reminder",
  "whatsapp_content_sid": "HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "whatsapp_content_variables": {
    "1": "{appointment_date}",
    "2": "{appointment_time}"
  },
  "lead_ids": ["lead-001"]
}
```

### Free-form example

```json
{
  "name": "WhatsApp follow-up open window",
  "campaign_type": "whatsapp",
  "whatsapp_mode": "freeform",
  "message_template": "Hola {nombre}, te comparto la ubicación y brochure. ¿Te lo envío?",
  "lead_ids": ["lead-001"]
}
```

## Testing Plan

### Phase 1. Backend payload support

- add new fields to models
- support `content_sid` + `content_variables`
- preserve free-form

### Phase 2. UI composer

- add WhatsApp mode selector
- add Sandbox template inputs
- add audience warnings

### Phase 3. Recordkeeping

- save mode
- save `content_sid`
- save variables
- save Twilio error details

### Phase 4. QA with Sandbox

- one joined test lead
- one template campaign
- one free-form reply case
- verify status transitions

### Phase 5. Production readiness

- promote from Sandbox sender to approved WhatsApp sender
- replace Sandbox presets with real Twilio Content Templates
- submit custom templates for approval

## Risks

### Functional

- sending free-form to cold leads may fail outside the 24-hour window
- sending template campaigns without joined Sandbox users will fail

### UX

- users may not understand why WhatsApp has two modes unless we explain it clearly

### Operational

- Sandbox throughput is too low for realistic blast testing
- Sandbox join expires after 3 days

## Recommendation

Implement this in two stages:

### Stage 1

- add template mode for WhatsApp campaigns
- keep free-form mode
- target Sandbox testing only

### Stage 2

- support production-grade Twilio Content Templates
- support template management and approval status visibility
- optionally support inbound-window detection and smarter segmentation

## Best Next Step

The most effective next implementation step is:

1. extend `CampaignCreate` and `WhatsAppRecord`
2. patch the WhatsApp send branch in `start_campaign`
3. patch `/whatsapp/single`
4. expose mode + template fields in `CampaignsPage`

That gets Rovi aligned with Twilio Sandbox without breaking the existing channel model.
