# Mapa de Sitio de la App

Fuente principal: [frontend/src/App.js](/root/leadvibes/frontend/src/App.js:1) y rutas API en [backend/server.py](/root/leadvibes/backend/server.py:1).

## Vista general

```text
Rovi / LeadVibes
├── Público
│   ├── /
│   ├── /landing
│   ├── /for-brokers
│   ├── /demo-request
│   ├── /contact-sales
│   ├── /module-tracker
│   ├── /pricing-calculator
│   ├── /copim-presentacion
│   ├── /copim-memberships
│   ├── /copim-demo
│   ├── /copim-dashboard-demo
│   ├── /link-broker
│   ├── /login
│   └── /lead-search
├── Autenticado
│   ├── /onboarding
│   ├── /dashboard
│   ├── /leads
│   ├── /brokers
│   ├── /gamification
│   ├── /calendar
│   ├── /campaigns
│   ├── /analytics
│   ├── /automations
│   ├── /import
│   ├── /encuentra-leads
│   ├── /products
│   ├── /marketplace
│   ├── /scripts
│   ├── /database-chat
│   ├── /settings
│   └── /email-templates/*
└── COPIM
    ├── Home
    │   ├── /copim
    │   └── /copim/dashboard
    ├── Nacional
    │   ├── /copim/associations
    │   ├── /copim/courses
    │   ├── /copim/community
    │   └── /copim/intelligence
    ├── Asociación local
    │   ├── /copim/association/profile
    │   ├── /copim/association/campaigns
    │   ├── /copim/association/properties
    │   ├── /copim/association/courses
    │   ├── /copim/association/community
    │   └── /copim/association/modules
    ├── Operación asociación
    │   ├── /copim/members
    │   ├── /copim/memberships
    │   ├── /copim/invoices
    │   ├── /copim/events
    │   └── /copim/marketplace
    └── Portal miembro
        ├── /copim/member
        ├── /copim/member/profile
        ├── /copim/member/campaigns
        ├── /copim/member/properties
        ├── /copim/member/courses
        ├── /copim/member/membership
        ├── /copim/member/payments
        ├── /copim/member/credential
        ├── /copim/member/events
        ├── /copim/member/community
        ├── /copim/member/modules
        ├── /copim/member/marketplace
        └── /copim/member/directory
```

## Frontend por tipo de acceso

### Público

| Ruta | Pantalla | Propósito |
| --- | --- | --- |
| `/` | `LandingPage` | Home comercial principal |
| `/landing` | `LandingPage` | Alias de landing |
| `/for-brokers` | `BrokerLandingPage` | Landing para brokers |
| `/demo-request` | `DemoRequestPage` | Solicitud de demo |
| `/contact-sales` | `DemoRequestPage enterprise` | Contacto ventas enterprise |
| `/module-tracker` | `ModuleTrackerPage` | Roadmap / tracking público |
| `/pricing-calculator` | `PricingCalculatorPage` | Calculadora comercial |
| `/copim-presentacion` | `CopimPresentationPage` | Presentación COPIM |
| `/copim-memberships` | `CopimPresentationPage` | Alias comercial COPIM |
| `/copim-demo` | `CopimDashboardDemoPage` | Demo COPIM |
| `/copim-dashboard-demo` | `CopimDashboardDemoPage` | Alias demo COPIM |
| `/link-broker` | `BrokerLinkPage` | Vinculación de broker |
| `/login` | `LoginPage` | Acceso |
| `/lead-search` | `LeadSearchDashboard` | Búsqueda de leads pública |

### Autenticado general

| Ruta | Pantalla | Propósito |
| --- | --- | --- |
| `/onboarding` | `OnboardingPage` | Configuración inicial |
| `/dashboard` | `DashboardPage` | KPIs y resumen |
| `/leads` | `LeadsPage` | Gestión de leads |
| `/brokers` | `BrokersPage` | Gestión de brokers |
| `/gamification` | `GamificationPage` | Reglas y puntos |
| `/calendar` | `CalendarPage` | Agenda y eventos |
| `/campaigns` | `CampaignsPage` | Campañas multicanal |
| `/analytics` | `AnalyticsPage` | Analítica |
| `/automations` | `AutomationsPage` | Automatizaciones |
| `/import` | `ImportLeadsPage` | Importador de leads |
| `/encuentra-leads` | `EncuentraLeadsPage` | Descubrimiento / scraping |
| `/products` | `ProductsPage` | Inventario / propiedades / servicios |
| `/marketplace` | `MarketplacePage` | Marketplace |
| `/scripts` | `ScriptsPage` | Scripts de ventas |
| `/database-chat` | `DatabaseChatPage` | Chat con base de datos |
| `/settings` | `SettingsPage` | Integraciones y configuración |
| `/email-templates/new` | `EmailEditorPage` | Crear template |
| `/email-templates/:templateId` | `EmailEditorPage` | Editar template |

## COPIM por perfil

### Home y redirección

| Ruta | Comportamiento |
| --- | --- |
| `/copim` | Redirige según rol |
| `/copim/dashboard` | Dashboard nacional |

### COPIM nacional

| Ruta | Pantalla |
| --- | --- |
| `/copim/associations` | `CopimAssociationsPage` |
| `/copim/courses` | `CopimCoursesWorkspacePage` |
| `/copim/community` | `CopimDashboardDemoPage` en modo embebido |
| `/copim/intelligence` | `CopimDashboardDemoPage` en modo embebido |

### COPIM asociación local

| Ruta | Pantalla |
| --- | --- |
| `/copim/association/profile` | `CopimAssociationProfilePage` |
| `/copim/association/campaigns` | `CopimAssociationCampaignsPage` |
| `/copim/association/properties` | `CopimAssociationPropertiesPage` |
| `/copim/association/courses` | `CopimAssociationCoursesPage` |
| `/copim/association/community` | `CopimAssociationCommunityPage` |
| `/copim/association/modules` | `CopimAssociationModulesPage` |

### COPIM operación de asociación

| Ruta | Pantalla |
| --- | --- |
| `/copim/members` | `CopimMembersPage` |
| `/copim/memberships` | `CopimMembershipsPage` |
| `/copim/invoices` | `CopimInvoicesPage` |
| `/copim/events` | `CopimEventsPage` |
| `/copim/marketplace` | `MarketplacePage` |

### COPIM portal del miembro

| Ruta | Pantalla |
| --- | --- |
| `/copim/member` | `CopimMemberHomePage` |
| `/copim/member/profile` | `CopimMemberProfilePage` |
| `/copim/member/campaigns` | `CopimMemberCampaignsPage` |
| `/copim/member/properties` | `CopimMemberPropertiesPage` |
| `/copim/member/courses` | `CopimMemberCoursesPage` |
| `/copim/member/membership` | `CopimMemberMembershipPage` |
| `/copim/member/payments` | `CopimMemberPaymentsPage` |
| `/copim/member/credential` | `CopimMemberCredentialPage` |
| `/copim/member/events` | `CopimMemberEventsPage` |
| `/copim/member/community` | `CopimMemberCommunityPage` |
| `/copim/member/modules` | `CopimMemberModulesPage` |
| `/copim/member/marketplace` | `MarketplacePage` |
| `/copim/member/directory` | `CopimMemberDirectoryPage` |

## Reglas de navegación

- Las rutas privadas usan `ProtectedRoute`.
- Si el usuario no completó onboarding, se redirige a `/onboarding`.
- COPIM tiene guards específicos por tipo de usuario:
  - `CopimNationalRoute`
  - `CopimLocalAssociationRoute`
  - `CopimAssociationRoute`
  - `CopimMemberPortalRoute`
- La ruta `*` redirige visualmente a `LandingPage`.

## Mapa funcional del backend

Base API: `/api`

### Autenticación y sesión

- `/auth/register`
- `/auth/login`
- `/auth/me`
- `/auth/workspaces`
- `/auth/switch-workspace`
- `/auth/refresh`
- `/auth/logout`
- `/auth/logout-all`
- `/auth/complete-onboarding`

### CRM core

- `/dashboard/*`
- `/leads*`
- `/activities`
- `/brokers*`
- `/goals`
- `/user/ai-profile`
- `/scripts*`
- `/database-chat`
- `/chat*`

### Productos y customización

- `/products*`
- `/lead-product-interests*`
- `/custom-fields*`
- `/products/templates/niche`

### Captación e importación

- `/landing/lead`
- `/landing/leads`
- `/scraper/*`
- endpoints de importación dentro del flujo de leads/carga

### Campañas e integraciones

- `/campaigns*`
- `/campaign-segments*`
- `/calls*`
- `/sms*`
- `/whatsapp*`
- `/emails*`
- `/settings/integrations*`

### Calendario

- `/calendar/events*`
- `/calendar/today`
- `/google-calendar/*`
- `/oauth/google/*`

### Email templates

- `/email-templates*`

### COPIM

- `/copim/dashboard`
- `/copim/associations*`
- `/copim/members*`
- `/copim/memberships*`
- `/copim/invoices*`
- `/copim/events*`
- `/copim/courses*`
- `/copim/local-association/*`
- `/copim/member-portal/*`

## Observaciones

- La app no tiene un solo sitemap lineal; en realidad son 4 productos montados sobre la misma base:
  - sitio comercial
  - CRM autenticado
  - operación COPIM
  - portal COPIM para miembros
- `MarketplacePage` se reutiliza en contexto general, COPIM asociación y COPIM miembro.
- El editor de email vive fuera del `Layout`, como experiencia fullscreen.
