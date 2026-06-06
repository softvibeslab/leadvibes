# Knowledge Base

## Producto

Rovi es una plataforma mexicana para bienes raices y operaciones asociadas. Su nucleo es un CRM para ventas de propiedades premium en Tulum, pero el repo actual incluye:

- CRM de leads y ventas para brokers individuales.
- CRM de agencia con brokers, gamificacion y dashboards.
- Property management para rentas.
- COPIM nacional/local y portal de socios.
- Marketplace de servicios, listings y agent skills.
- Tareas tipo operacion comercial.
- AI Control Tower, agentes por rol, database chat y strategy playground.
- VibeLab para audiencias, ofertas, experimentos y posts.
- Hermes/Telegram linking y miniapp preview.

## Stack

- Backend: FastAPI 0.110, Motor 3.3, MongoDB, Pydantic 2, JWT.
- Frontend: React 19, CRACO, Tailwind, shadcn/ui, React Router 7, Recharts, Playwright.
- Mensajeria/campanas: VAPI, Twilio, SendGrid, WhatsApp/Twilio.
- Calendar: Google OAuth2 y Google Calendar API.
- IA: OpenAI/litellm/google-genai y paquete privado `emergentintegrations` cuando exista.

## Pipeline De Leads

Estados:

```text
nuevo -> contactado -> calificacion -> presentacion -> apartado -> venta/perdido
```

Prioridades:

```text
baja, media, alta, urgente
```

Actividades:

```text
llamada, whatsapp, email, zoom, visita, nota, apartado, venta
```

## Reglas Backend

- Usar `await` para toda operacion Motor.
- Usar `serialize_doc()` antes de devolver documentos Mongo.
- Usar `Field(default_factory=generate_uuid)` y `Field(default_factory=now_utc)` en modelos nuevos.
- Mantener rutas bajo `/api`.
- Para rutas admin, usar `require_role(...)` o dependencia especifica del dominio.
- Para realtime, emitir eventos desde `websocket_manager.py` cuando se crean/actualizan/borran leads, importaciones o calendario.

## Reglas Frontend

- Usar `useAuth()` y su `api`.
- No crear axios suelto salvo casos muy justificados.
- Agregar rutas nuevas en `App.js`.
- Agregar navegacion en `Sidebar.js` si el modulo debe aparecer en menu.
- Validar `account_type`, `active_workspace.tenant_type` y rol.
- Usar componentes de `frontend/src/components/ui`.
- Usar `lucide-react` para iconos.

## Entornos

| Entorno | Subdominio | Backend | Frontend | DB |
| --- | --- | --- | --- | --- |
| Production | `srv1318804.hstgr.cloud` | 8000 | 3000 | `rovi_crm` |
| Development | `dev.srv1318804.hstgr.cloud` | 8100 | 3100 | `rovi_crm_dev` |
| Preview | `preview.srv1318804.hstgr.cloud` | 8200 | 3200 | `rovi_crm_preview` |

## Comandos Clave

```bash
cd backend && pytest
cd frontend && yarn build
cp docker-local.sample .env && docker compose up -d --build
curl http://localhost:18080/api/health
```

## Usuarios Preview Del Plan Golden

Password preview: `RoviPreview2026!`

- `preview.broker@rovicrm.com`
- `preview.agency@rovicrm.com`
- `preview.rentals@rovicrm.com`
- `preview.valuator@rovicrm.com`
- `preview.copim.admin@rovicrm.com`
- `preview.copim.operator@rovicrm.com`
- `preview.copim.member@rovicrm.com`
- `preview.rovi.admin@rovicrm.com`

Usarlos solo para validacion preview; no documentar ni exponer secretos reales.

