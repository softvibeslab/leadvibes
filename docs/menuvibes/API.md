# MenuVibes CRM — API Contract

All endpoints require bearer authentication and an active MenuVibes workspace.

## Pipeline
`GET /api/menuvibes/pipeline/config` returns ordered stages with `key`, `label`, `color`, `is_terminal`, `requires_next_action`.

## Prospects
- `GET /api/menuvibes/prospects?stage=&search=&assigned_to=`
- `POST /api/menuvibes/prospects`
- `GET /api/menuvibes/prospects/{id}`
- `PATCH /api/menuvibes/prospects/{id}`

Create fields: `business_name` required; optional `contact_name`, `phone`, `email`, `city`, `zone`, `business_type`, `source`, `google_maps_url`, `website_url`, `instagram_url`, `menu_source_url`, `assigned_to`, `next_action`, `next_action_at`, `notes`, `tags`.
Patch additionally accepts `stage`. Unknown fields are rejected. Responses never expose Mongo `_id`.

## Activities
- `GET /api/menuvibes/prospects/{id}/activities`
- `POST /api/menuvibes/prospects/{id}/activities`
Body: `type` (`note|call|whatsapp|email|meeting`), `summary`, optional `occurred_at`.

## Demos
- `GET /api/menuvibes/demos?prospect_id=&status=`
- `POST /api/menuvibes/demos`
- `PATCH /api/menuvibes/demos/{id}`
Fields: `prospect_id`, `slug`, `url`, `status`, `source_type`, `source_reference`, `last_verified_at`, `notes`.

## Dashboard
`GET /api/menuvibes/dashboard` returns totals, stage counts, missing/overdue follow-up, demo counts and recent prospects.

## Errors
- 400 invalid transition/assignment
- 403 not a MenuVibes workspace or insufficient role
- 404 record absent or belongs to another tenant
- 422 invalid payload or enum
