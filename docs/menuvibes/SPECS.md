# MenuVibes CRM — Product Specification (MVP)

Status: FROZEN for implementation  
Branch: `feature/menuvibes-crm-profile`

## Goal
Deliver a human-operated Rovi workspace for MenuVibes sales: a user can create a restaurant prospect, assign it, schedule the next action, move it through a MenuVibes pipeline, register interactions, attach a verified demo reference, and see operational alerts.

## In scope
- `account_type=menuvibes`, `tenant_type=menuvibes`; effective authorization comes from active workspace membership.
- Dedicated `/menuvibes/*` namespace, guard, home and sidebar.
- Prospect CRUD/list/detail and tenant-specific pipeline.
- Activities and `last_interaction_at`.
- Required follow-up invariants.
- Minimal demo entity linked to a prospect.
- Dashboard for incomplete and overdue follow-ups.
- Owner/manager/executive visibility and assignment rules.
- Tenant-isolation and regression tests.

## Out of scope
Supabase writes or publishing, real MenuVibes business creation, NPS/reviews, campaigns, bulk WhatsApp, media uploads, import, advanced analytics, AI agents, production deploy.

## Domain decisions
- A prospect represents one restaurant/location. `business_name` is required. A multi-location brand uses one prospect per location.
- Core pipeline stages: `new`, `researched`, `contacted`, `responded`, `qualified`, `demo`, `proposal`, `negotiation`, `won`, `lost`, `nurture`.
- Terminal stages: `won`, `lost`. `nurture` remains active and requires follow-up.
- Transition from `new` to another active stage requires `assigned_to`, `next_action`, and `next_action_at`.
- Owner/manager see all tenant prospects and may assign any active member. Executive sees assigned prospects plus unassigned prospects created by that executive; cannot assign to another user.
- A note does not update interaction time. `call`, `whatsapp`, `email`, and `meeting` do.
- Demo statuses: `requested`, `collecting`, `building`, `ready`, `presented`, `expired`.
- Demo `ready` means sales-ready only; it never means published customer.

## Acceptance criteria
1. MenuVibes login/workspace resolves to `/menuvibes/dashboard`.
2. MenuVibes users cannot access real-estate routes through direct URLs.
3. Tenant A cannot list/read/mutate tenant B prospects, activities or demos.
4. Owner can create a prospect with real business data and source.
5. Assignment validates active membership in the same tenant.
6. Stage transition invariant is enforced server-side.
7. Pipeline labels are MenuVibes-specific, not the legacy `LeadStatus` enum.
8. Interaction types update `last_interaction_at`; note does not.
9. A demo links only to a prospect in the same tenant.
10. Dashboard returns `missing_follow_up`, `overdue_follow_up`, stage counts and demo counts.
11. No endpoint calls or writes Supabase.
12. Backend tests and frontend production build pass.
