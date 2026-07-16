# MenuVibes CRM — Test Plan

## Backend unit/contract
- Tenant type and workspace initialization.
- MenuVibes guard checks active membership and tenant type.
- Tenant-scoped CRUD for prospects, activities and demos.
- Assignment membership validation.
- Executive visibility restrictions.
- Pipeline transition invariant.
- Activity interaction timestamp behavior.
- Dashboard formulas and exclusion of terminal stages from follow-up alerts.
- Unknown fields/status produce 422.

## Frontend/build
- Access helper recognizes active MenuVibes workspace.
- Authenticated home resolves to `/menuvibes/dashboard`.
- Sales CRM guard rejects MenuVibes.
- Dedicated navigation contains no real-estate modules.
- Production build completes with no new warnings/errors attributable to MenuVibes.

## Smoke
- API health.
- Authenticated MenuVibes dashboard and prospect flow against isolated local/test DB when environment permits.
- Browser renders dashboard and pipeline; console has no JS exceptions.

## Security
- Scan diff for credentials.
- Verify every Mongo selector for domain data contains `tenant_id`.
- Confirm no Supabase import/client usage in the MenuVibes router.
