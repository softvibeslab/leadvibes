# Marketplace Digital Products Implementation Plan

## Objetivo

Convertir el marketplace de ROVI en un sistema donde los socios puedan comprar productos digitales, cursos, packs documentales, servicios y Agent Skills con entrega clara despues del pago.

El demo debe explicar tres casos:

- Producto digital simple: compra una plantilla y descarga un PDF.
- Producto digital compuesto: compra un pack de contratos y descarga un ZIP.
- Agent Skill: compra o instala una habilidad y el agente muestra que esa skill esta activa.

## Mockups Actuales

Archivos demo creados:

- `/marketplace-mock/plantillas-comunicacion-copim.pdf`
- `/marketplace-mock/pack-contratos-rovi.zip`

Listings mock relevantes:

| Tipo | Listing | Entrega |
|---|---|---|
| `digital_artifact` | Plantillas de Comunicacion COPIM | PDF descargable |
| `digital_artifact` | Pack Contratos y Promesas COPIM | ZIP descargable |
| `agent_skill` | Skill Analista Riviera Maya | Skill visible en Agente Comercial ROVI |
| `agent_skill` | Skill Fideicomisos Riviera Maya | Skill visible en Agente Legal-Comercial |

## Modelo De Datos Recomendado

### Marketplace Listing

El modelo actual ya cubre la base:

- `listing_type`
- `title`
- `description`
- `price_mxn`
- `digital_artifact`
- `professional_service`
- `agent_skill`
- `metadata`

Agregar o formalizar en `digital_artifact`:

```json
{
  "artifact_type": "template | contract_pack | guide | script | course_material",
  "file_urls": ["/downloads/..."],
  "preview_url": "/previews/...",
  "license_terms": "single_tenant_use",
  "version": "1.0.0",
  "estimated_minutes": 15,
  "file_format": "pdf | zip | docx | xlsx",
  "delivery_mode": "instant_download"
}
```

Agregar o formalizar en `agent_skill`:

```json
{
  "skill_slug": "analista-riviera-maya",
  "skill_version": "1.0.0",
  "skill_markdown": "...",
  "skill_file_url": "/skills/analista-riviera-maya/SKILL.md",
  "install_mode": "tenant_agent | broker_agent | copim_agent",
  "compatible_agents": ["agente-comercial-rovi"],
  "required_mcp_tools": ["rovi.list_leads", "rovi.retrieve_lead_summary"],
  "token_budget_hint": 500
}
```

### Purchase Entitlements

Crear una coleccion nueva: `marketplace_entitlements`.

Campos sugeridos:

```json
{
  "id": "entitlement-id",
  "tenant_id": "tenant-id",
  "buyer_user_id": "user-id",
  "listing_id": "listing-id",
  "transaction_id": "transaction-id",
  "entitlement_type": "download | service_order | agent_skill",
  "status": "active | revoked | expired",
  "download_urls": ["/signed-url"],
  "max_downloads": 10,
  "download_count": 0,
  "expires_at": null,
  "created_at": "iso-date"
}
```

## Flujo Producto Digital PDF

1. Usuario abre listing tipo `digital_artifact`.
2. Compra el producto.
3. Backend crea `marketplace_transaction` con status `paid`.
4. Backend crea `marketplace_entitlement` tipo `download`.
5. Frontend cambia CTA de `Comprar` a `Descargar PDF`.
6. Al descargar, backend valida entitlement y entrega URL firmada.
7. Se incrementa `download_count`.

## Flujo Pack ZIP

1. Creador sube varios archivos o un ZIP final.
2. Sistema guarda el asset en storage privado.
3. Listing muestra formato `ZIP` y lista de entregables.
4. Tras compra, el comprador descarga ZIP.
5. En biblioteca aparece como `Pack documental`.

Regla importante: si el pack contiene documentos legales, mostrar disclaimer de revision legal antes de uso real.

## Flujo Agent Skill

1. Usuario compra o instala una skill gratuita.
2. Backend valida compra o permiso.
3. Backend crea `agent_skill_installations`.
4. El agente lee skills activas por `tenant_id` y `user_id`.
5. La UI del marketplace muestra estado `Instalada`.
6. La UI del agente muestra:
   - nombre de la skill
   - version
   - capacidades visibles
   - herramientas MCP requeridas
7. En runtime, el agente carga el `skill_markdown` o `skill_file_url` como contexto operativo.

## Fases De Implementacion

### Fase 1: Demo Comercial

- Mantener assets mock en `frontend/public/marketplace-mock`.
- Mostrar boton de descarga PDF/ZIP despues de compra demo.
- Mostrar panel de Agente con Skills activas.
- Mantener transacciones demo con splits creador/asociacion/plataforma.

### Fase 2: Entrega Real De Digitales

- Crear endpoints:
  - `POST /api/marketplace/listings/{id}/assets`
  - `GET /api/marketplace/purchases`
  - `GET /api/marketplace/entitlements/{id}/download`
- Guardar archivos en storage privado.
- Generar URLs firmadas temporales.
- Validar tenant, comprador, status de compra y limites de descarga.

### Fase 3: Biblioteca Del Comprador

- Agregar tab `Mis compras`.
- Separar:
  - Descargas
  - Servicios contratados
  - Skills instaladas
  - Cursos activos
- Mostrar historial, version, fecha de compra y boton de soporte.

### Fase 4: Skill Runtime

- Crear endpoint:
  - `GET /api/marketplace/agent-skills/installed`
- Conectar instalaciones con AI Control Tower.
- Resolver skills activas por agente compatible.
- Inyectar `skill_markdown` como contexto controlado.
- Auditar cada tool call MCP ejecutada por una skill.

### Fase 5: Monetizacion Y Gobernanza

- Aprobar productos antes de publicar.
- Definir comisiones por tier.
- Agregar reembolsos y revocacion de entitlement.
- Agregar metricas:
  - GMV
  - ventas por categoria
  - descargas
  - instalaciones de skills
  - conversion de curso
  - revenue por asociacion

## Riesgos A Cuidar

- No entregar archivos por URL publica permanente en produccion.
- No permitir que una skill use herramientas MCP no declaradas.
- No mezclar compra de skill con permiso de ejecutar acciones destructivas.
- No prometer validez legal de contratos sin revision profesional.
- No dejar descargas ilimitadas sin trazabilidad.
- No publicar productos sin curaduria si COPIM presta su marca.

## Criterio De Exito MVP

El MVP esta listo cuando:

- Un usuario compra un PDF y puede descargarlo.
- Un usuario compra un ZIP y puede descargarlo.
- Un usuario instala una Agent Skill y el agente la muestra como activa.
- Cada compra genera transaccion, split y entitlement.
- Un admin puede auditar que se compro, quien cobro y que se entrego.
