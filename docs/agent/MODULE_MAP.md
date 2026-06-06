# Module Map

## CRM Ventas

Frontend:

- `frontend/src/pages/DashboardPage.js`
- `frontend/src/pages/LeadsPage.js`
- `frontend/src/pages/ProductsPage.js`
- `frontend/src/pages/ImportLeadsPage.js`
- `frontend/src/pages/CalendarPage.js`
- `frontend/src/pages/CampaignsPage.js`
- `frontend/src/pages/AnalyticsPage.js`
- `frontend/src/pages/AutomationsPage.js`
- `frontend/src/pages/ScriptsPage.js`
- `frontend/src/pages/DatabaseChatPage.js`

Backend:

- `/api/leads`
- `/api/activities`
- `/api/products`
- `/api/lead-product-interests`
- `/api/custom-fields`
- `/api/import/*`
- `/api/calendar/*`
- `/api/campaigns`, `/api/calls`, `/api/sms`, `/api/whatsapp`, `/api/emails`
- `/api/analytics/*`
- `/api/automations/*`
- `/api/scripts`
- `/api/database-chat`

Permisos: `individual` y `agency`; agencia tambien usa brokers y gamificacion.

## Agencia

Frontend:

- `frontend/src/pages/BrokersPage.js`
- `frontend/src/pages/GamificationPage.js`

Backend:

- `/api/brokers`
- `/api/brokers/pairing-*`
- `/api/gamification/*`
- `/api/dashboard/leaderboard`

Permisos: `agency`, roles manager/admin/owner cuando aplique.

## Tareas

Frontend:

- `frontend/src/pages/TasksPage.js`

Backend:

- `backend/tasks.py`
- `/api/tasks`
- `/api/tasks/summary`
- `/api/tasks/{task_id}`
- `/api/tasks/{task_id}/status`
- `/api/tasks/{task_id}/comments`

Permisos: usuarios de sales CRM. Revisar `require_sales_crm_user`.

## Rentas / Property Management

Frontend:

- `frontend/src/pages/RentalsPage.js`

Backend:

- `backend/rentals.py`
- `/api/rentals/dashboard`
- `/api/rentals/properties`
- `/api/rentals/bookings`
- `/api/rentals/calendar*`
- `/api/rentals/staff`
- `/api/rentals/tasks`
- `/api/rentals/financials`
- `/api/rentals/expenses`
- `/api/rentals/import/*`

Permisos: `property_management` o rol `property_manager`.

## COPIM

Frontend nacional/local:

- `frontend/src/pages/CopimOverviewPage.js`
- `frontend/src/pages/CopimAssociationsPage.js`
- `frontend/src/pages/CopimMembersPage.js`
- `frontend/src/pages/CopimMembershipsPage.js`
- `frontend/src/pages/CopimInvoicesPage.js`
- `frontend/src/pages/CopimEventsPage.js`
- `frontend/src/pages/CopimCoursesWorkspacePage.js`
- `frontend/src/pages/CopimMemberImportPage.js`
- `frontend/src/pages/CopimAssociation*Page.js`

Frontend socio:

- `frontend/src/pages/CopimMemberHomePage.js`
- `frontend/src/pages/CopimMemberProfilePage.js`
- `frontend/src/pages/CopimMemberCoursesPage.js`
- `frontend/src/pages/CopimMemberPaymentsPage.js`
- `frontend/src/pages/CopimMemberCredentialPage.js`
- `frontend/src/pages/CopimMemberDirectoryPage.js`

Backend:

- `/api/copim/dashboard`
- `/api/copim/associations`
- `/api/copim/members`
- `/api/copim/memberships`
- `/api/copim/invoices`
- `/api/copim/events`
- `/api/copim/courses`
- `/api/copim/member-portal/*`
- `/api/copim/import/members/*`

Permisos: `copim_admin`, `copim_operator`, `copim_member`; validar guards en `App.js` y helpers en `copimAccess.js`.

## ROVI Interno

Frontend:

- `frontend/src/pages/RoviInternalWorkspacePage.js`
- `frontend/src/pages/RoviAIControlTowerPage.js`
- `frontend/src/pages/VibeLabPage.js`
- `frontend/src/pages/MarketplacePage.js`

Backend:

- `backend/rovi_internal.py` -> `/api/rovi-internal/*`
- `backend/agent_control.py` -> `/api/ai-control/*`, `/api/ai-agent/*`, `/api/strategy-playground/run`
- `backend/vibe_lab.py` -> `/api/vibe-lab/*`
- `backend/marketplace.py` -> `/api/marketplace/*`

Permisos: `rovi_internal` y roles `rovi_*`; AI Control puede ser owner-only en frontend.

## Integraciones

Backend:

- `/api/settings/integrations`
- `/api/settings/integrations/test-vapi`
- `/api/settings/integrations/test-twilio`
- `/api/settings/integrations/test-whatsapp`
- `/api/settings/integrations/test-sendgrid`
- `/api/oauth/google/*`
- `/api/google-calendar/*`
- `/api/webhooks/twilio/messaging-status`
- `/api/webhooks/sendgrid`
- `/api/webhooks/external-lead`

Frontend:

- `frontend/src/pages/SettingsPage.js`
- `frontend/src/pages/CampaignsPage.js`
- `frontend/src/pages/CalendarPage.js`

