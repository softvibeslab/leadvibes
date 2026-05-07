# ROVI Marketplace - Arquitectura Backend Inicial

## Tesis estrategica

El PDF de estrategia posiciona ROVI como una infraestructura soberana para COPIM, no como un CRM cerrado. La ventaja contra Fital es mover la conversacion de "software gratis" a "propiedad de una economia digital": COPIM controla datos, propiedad intelectual, comisiones y la aduana transaccional del ecosistema inmobiliario.

## Modulos de negocio

### 1. Productos digitales

Artefactos tipo Gumroad/Skool:

- plantillas de contrato
- scripts de venta
- cursos y masterclasses
- assets para redes sociales
- guias y playbooks comerciales

Los usuarios en tier Basic compran. Los usuarios Pro/Premium pueden publicar segun limites de su membresia.

### 2. Servicios profesionales tipo Gig

Servicios estandarizados tipo Fiverr:

- landing pages
- embudos de venta
- campanas Meta/Google
- diseno publicitario
- valuacion, legal, notaria, seguros

La transaccion puede quedar en escrow: ROVI retiene pago hasta entrega y cobra intermediacion.

### 3. Agent Skills

Skills vendibles como propiedad intelectual empaquetada en `SKILL.md`. Ejemplos:

- Especialista en Fideicomisos Riviera Maya
- Calificador de Leads de Alto Valor
- Analista de Mercado Tulum
- Negociador de Objeciones de Preventa

Al comprar una Skill, el broker la instala en su agente IA y gana conocimiento procedimental reutilizable.

### 4. MCP para CRM e IA

El endpoint `/api/marketplace/mcp` implementa una pasarela JSON-RPC inicial con:

- `initialize`
- `tools/list`
- `tools/call`

Herramientas expuestas:

- `rovi.list_leads`
- `rovi.retrieve_lead_summary`
- `rovi.qualify_lead`

Todas requieren JWT y operan solo dentro del `tenant_id` activo.

## Colecciones Mongo

- `marketplace_tiers`
- `marketplace_subscriptions`
- `marketplace_listings`
- `marketplace_transactions`
- `agent_skill_installations`

## Comision tripartita

Cada transaccion genera splits:

- creator: ingreso del vendedor/creador
- association: comision para COPIM/asociacion
- platform: comision ROVI

Los porcentajes viven en el tier efectivo. Por defecto:

- Basic/Pro: 75% creador, 10% asociacion, 15% ROVI
- Premium: 78% creador, 10% asociacion, 12% ROVI
- Partner: 80% creador, 5% asociacion, 15% ROVI

## Endpoints principales

- `GET /api/marketplace/strategy-summary`
- `GET /api/marketplace/tiers`
- `POST /api/marketplace/tiers`
- `GET /api/marketplace/me`
- `GET /api/marketplace/listings`
- `POST /api/marketplace/listings`
- `PUT /api/marketplace/listings/{listing_id}`
- `POST /api/marketplace/listings/{listing_id}/publish`
- `POST /api/marketplace/purchase`
- `GET /api/marketplace/transactions`
- `POST /api/marketplace/agent-skills/{listing_id}/install`
- `POST /api/marketplace/mcp`

## Siguiente fase recomendada

1. Integrar pagos reales con Stripe/Mercado Pago.
2. Agregar entregables y aprobacion de servicios en escrow.
3. Crear UI de catalogo y panel de vendedor.
4. Conectar Agent Skills al runtime real del asistente IA.
5. Agregar reviews, refunds y disputas.
6. Crear marketplace publico/privado por asociacion.
