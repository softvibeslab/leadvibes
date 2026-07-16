# MenuVibes CRM — Architecture

## Boundary
MenuVibes is a dedicated vertical inside Rovi. It reuses JWT, workspace membership, MongoDB, React layout and UI primitives, but owns its domain collections and routes.

## Backend
- Router: `backend/menuvibes.py`, prefix `/menuvibes` under global `/api`.
- Collections: `menuvibes_prospects`, `menuvibes_activities`, `menuvibes_demos`.
- Every query and final mutation includes `tenant_id` derived from the active JWT workspace.
- Guard verifies active membership and `tenants.tenant_type == menuvibes` from MongoDB.
- No `tenant_id` is accepted from request bodies.
- Legacy `leads`, `LeadStatus`, properties and sales dashboards remain untouched.

## Frontend
- Access helpers: `frontend/src/lib/menuvibesAccess.js`.
- Pages: `frontend/src/pages/menuvibes/`.
- Namespace: `/menuvibes/dashboard`, `/menuvibes/prospects`, `/menuvibes/prospects/:id`, `/menuvibes/pipeline`, `/menuvibes/demos`.
- `MenuVibesModuleRoute` protects all pages.
- Sidebar chooses MenuVibes before individual/agency fallbacks.
- AI chat is not part of the MVP.

## Compatibility
`account_type` initializes the first workspace. Runtime authorization uses active workspace `tenant_id`, `tenant_type`, role, and active membership. Existing profiles keep their routes and storage.
