---
name: rovi-crm
description: >
  Skill especializada en el proyecto Rovi CRM — un CRM inmobiliario de lujo para Tulum, México.
  Úsala siempre que el usuario trabaje en este proyecto, ya sea para desarrollar features,
  corregir bugs, tomar decisiones de arquitectura, escribir queries MongoDB, crear componentes
  React, entender las reglas de negocio del pipeline de leads, configurar integraciones
  (VAPI, Twilio, SendGrid, Google Calendar, OpenAI), o hacer deploy a los entornos de
  Hostinger. Se activa ante cualquier pregunta sobre el código de Rovi/LeadVibes, sobre
  el dominio inmobiliario de la plataforma, o sobre cómo extender/modificar cualquier módulo
  del sistema. No esperes a que el usuario lo pida explícitamente — si la conversación
  toca FastAPI, MongoDB, React y bienes raíces en el mismo contexto, usa esta skill.
---

# Rovi CRM — Skill de Desarrollo

Rovi (antes LeadVibes) es un CRM inmobiliario mexicano para ventas de propiedades de
alto valor en Tulum. Combina gestión de leads, campañas multicanal e IA en una sola
plataforma para brokers individuales y agencias.

---

## 1. Arquitectura del Sistema

### Stack
- **Backend**: FastAPI + MongoDB (Motor async) + Python 3.11
- **Frontend**: React 19 + Tailwind CSS + shadcn/ui + @dnd-kit
- **Integraciones**: OpenAI (emergentintegrations), VAPI (llamadas IA), Twilio (SMS), SendGrid (email), Google Calendar OAuth2
- **Deployment**: Docker Compose + Nginx en Hostinger VPS

### Estructura de archivos
```
leadvibes/
├── backend/
│   ├── server.py        # FastAPI app + TODOS los endpoints /api/*
│   ├── models.py        # Pydantic models (User, Lead, Campaign, etc.)
│   ├── auth.py          # JWT auth, password hashing, dependencias
│   ├── ai_service.py    # Integración OpenAI / emergentintegrations
│   ├── seed_data.py     # Reglas de gamificación y scripts por defecto
│   └── tests/           # pytest (unit + smoke + integration)
└── frontend/src/
    ├── App.js                    # React Router, rutas públicas/protegidas
    ├── context/AuthContext.js    # JWT auth, instancia axios con interceptores
    ├── context/ThemeContext.js   # Light/dark mode
    ├── pages/                    # Páginas principales
    └── components/ui/            # shadcn/ui components
```

---

## 2. Patrones del Backend

### Patrón base de un endpoint
```python
@api_router.post("/mi-recurso", response_model=dict)
async def crear_recurso(
    data: MiModeloCreate,
    current_user: dict = Depends(get_current_user)
):
    tenant_id = await get_or_create_tenant(current_user["user_id"])
    doc = {
        **data.model_dump(),
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.mi_coleccion.insert_one(doc)
    return serialize_doc(doc)
```

### Reglas críticas del backend
- **Multi-tenancy**: SIEMPRE filtrar por `tenant_id` en todas las queries. El `tenant_id` se obtiene con `await get_or_create_tenant(current_user["user_id"])` (formato: `tenant-{user_id[:8]}`).
- **Autenticación**: `Depends(get_current_user)` para rutas protegidas; `Depends(require_role(["admin"]))` para rutas de admin.
- **Motor async**: todas las queries deben usar `await`. Usar `.find()` con `async for` o `await .find().to_list(length=None)`.
- **serialize_doc**: usar la función `serialize_doc(doc)` antes de devolver documentos de Mongo (convierte `_id` ObjectId a string).
- **Modelos Pydantic**: definir en `models.py`. Usar `Field(default_factory=generate_uuid)` para IDs y `Field(default_factory=now_utc)` para timestamps.
- **Todos los endpoints** tienen el prefijo `/api` vía `api_router = APIRouter(prefix="/api")`.

### Enums del dominio (en models.py)
```python
class LeadStatus(str, Enum):
    NUEVO = "nuevo"
    CONTACTADO = "contactado"
    CALIFICACION = "calificacion"
    PRESENTACION = "presentacion"
    APARTADO = "apartado"
    VENTA = "venta"
    PERDIDO = "perdido"

class LeadPriority(str, Enum):
    BAJA = "baja" | MEDIA = "media" | ALTA = "alta" | URGENTE = "urgente"

class ActivityType(str, Enum):
    LLAMADA | WHATSAPP | EMAIL | ZOOM | VISITA | NOTA | APARTADO | VENTA
```

### Auth: niveles de acceso
- `role = "broker"` — acceso estándar
- `role = "manager"` — gestión de equipo
- `role = "admin"` — acceso total
- `account_type = "individual"` — broker solo, sin leaderboard/equipo
- `account_type = "agency"` — múltiples brokers, gamificación completa

---

## 3. Patrones del Frontend

### Llamadas a la API
Siempre usar el `api` de `AuthContext` (ya incluye el header JWT automáticamente):
```javascript
import { useAuth } from '../context/AuthContext';
const { api, user } = useAuth();

// GET
const res = await api.get('/leads');

// POST
const res = await api.post('/leads', { nombre: 'Juan', status: 'nuevo' });
```

### Gating por account_type
```javascript
const { user } = useAuth();

// Solo mostrar para agencias:
{user?.account_type === 'agency' && <GamificacionModule />}

// Solo para individuales:
{user?.account_type === 'individual' && <SimplifiedView />}
```

### Componentes UI disponibles (shadcn/ui)
Importar desde `../components/ui/`:
- `Button`, `Input`, `Label`, `Textarea`
- `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`
- `Badge`, `Avatar`, `AvatarFallback`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`
- `Progress`, `Skeleton`, `ScrollArea`, `Switch`

### Iconos
Usar `lucide-react`. Ejemplos: `LayoutDashboard`, `Users`, `Trophy`, `Radio`, `Zap`, `Database`, `Settings`, `Package`, `Search`, `Upload`, `CalendarDays`, `BarChart3`, `FileText`, `UserCircle`.

### Nuevas páginas
1. Crear el archivo en `frontend/src/pages/MiPaginaPage.js`
2. Agregar la ruta en `frontend/src/App.js` dentro de `<ProtectedRoute>`
3. Agregar el ítem al sidebar en `frontend/src/components/Sidebar.js` (array de navegación)

### Path alias
`@/` mapea a `src/`. Ejemplo: `import { cn } from '@/lib/utils'`

---

## 4. Design System (Tulum Luxury Palette)

Definido en `frontend/src/index.css` como CSS variables (formato hsl):

```css
/* Colores principales */
--primary: #0D9488          /* Turquesa */
--secondary: #4D7C0F        /* Verde Jungla */
--accent: #D97706           /* Dorado */
--background: #E7E5E4       /* Beige Arena */
```

En Tailwind: usar `bg-primary`, `text-primary`, `border-primary`, etc. — nunca hardcodear los hex en componentes.

---

## 5. Dominio de Negocio

### Pipeline de Ventas (6 etapas)
```
nuevo → contactado → calificacion → presentacion → apartado → venta/perdido
```
- **nuevo**: Lead recién captado
- **contactado**: Primer contacto realizado
- **calificacion**: Se evalúa intención y capacidad de compra (score IA)
- **presentacion**: Se muestra la propiedad
- **apartado**: Reserva/depósito pagado
- **venta**: Cierre exitoso
- **perdido**: Oportunidad cerrada sin venta

### Tipos de propiedades (Tulum)
Lotes, Condominios, Casas, Villas, Penthouses — principalmente en La Veleta, Tulum Centro, Aldea Zama, Region 15.

### Fuentes de leads comunes
Facebook Ads, Google Ads, Referidos, Portales (Inmuebles24, Vivanuncios), Instagram, LinkedIn, Eventos.

### KPIs clave del negocio
- Tasa de conversión (leads → ventas)
- Leads nuevos por período
- Ingresos por cierre
- Apartados activos
- Tiempo promedio en pipeline

---

## 6. Módulos Clave

### Lead Analysis (IA)
- Endpoint: `POST /api/leads/{lead_id}/analyze`
- Genera: `intent_score` (0–100), sentimiento, próximo paso recomendado
- Usa: `ai_service.py` con OpenAI via `emergentintegrations`
- El paquete `emergentintegrations` **no está en PyPI** — falla gracefully si no disponible

### Campañas
- **Llamadas**: `POST /api/campaigns` con `type: "call"` → VAPI Voice API
- **SMS**: `POST /api/sms/single` → Twilio
- **Email**: `POST /api/emails/single` → SendGrid (con tracking de apertura/clic)
- Config de integraciones en `GET/POST /api/settings/integrations`

### Google Calendar
- OAuth2 flow: `GET /api/oauth/google/login` → callback → tokens en `IntegrationSettings.google_tokens`
- Sync bidireccional via `google_event_id` y `synced_from_google`
- Round-robin de asignación: `GET /api/calendar/round-robin/next-broker`

### Importador
- Multi-step: Upload → Mapeo columnas → Preview → Execute
- Endpoints: `/api/import/upload`, `/api/import/preview`, `/api/import/execute`
- Compatible con exports de GHL, HubSpot, Pipedrive (CSV/XLSX)
- Detección de duplicados por email o teléfono: `POST /api/leads/check-duplicates`

### Gamificación (solo `agency`)
- Reglas: `GET/POST /api/gamification/rules`
- Puntos: `GET /api/gamification/points`
- Leaderboard: `GET /api/dashboard/leaderboard`
- Se muestra en frontend SOLO cuando `user.account_type === 'agency'`

### Automatizaciones
- Workflows: `GET/POST /api/automations/workflows`
- Activar: `POST /api/automations/workflows/{id}/activate`
- Testing: `POST /api/automations/workflows/{id}/test`

---

## 7. Testing

```bash
# Backend — Unit + smoke (sin Mongo real)
cd backend && pytest

# Solo integration (necesita backend corriendo)
cd backend && pytest -m integration

# Test principal de integración
pytest tests/test_leadvibes_crm.py

# Linting
black . && flake8 . && isort .
```

Los tests de integración usan `requests` contra `REACT_APP_BACKEND_URL`. Los smoke tests usan `TestClient` de FastAPI y no requieren Mongo.

---

## 8. Deploy y Entornos

### Los 3 entornos en Hostinger VPS (`srv1318804.hstgr.cloud`)

| Entorno     | Branch     | Subdominio               | Backend Port | Frontend Port | DB               |
|-------------|------------|--------------------------|--------------|---------------|------------------|
| Production  | `main`     | `srv1318804.hstgr.cloud` | 8000         | 3000          | `rovi_crm`       |
| Development | `dev`      | `dev.srv1318804...`      | 8100         | 3100          | `rovi_crm_dev`   |
| Preview     | rovi_deploy| `preview.srv1318804...`  | 8200         | 3200          | `rovi_crm_preview`|

### Comandos de deploy

```bash
# Local con puertos alternativos (evitar conflictos)
cp docker-local.sample .env
docker compose up -d --build

# Por entorno específico
docker compose -f docker-compose.hostinger.yml up -d   # Production
docker compose -f docker-compose.dev.yml up -d          # Development
docker compose -f docker-compose.preview.yml up -d      # Preview

# Logs
docker compose logs -f backend
docker compose logs -f frontend
```

### Variables de entorno críticas
```bash
# Backend
MONGO_URL=mongodb://...
DB_NAME=rovi_crm
JWT_SECRET=...
EMERGENT_LLM_KEY=...    # OpenAI via emergentintegrations
CORS_ORIGINS=http://localhost:3000

# Frontend
REACT_APP_BACKEND_URL=http://localhost:8000
```

### CI/CD
- GitHub Actions: `.github/workflows/`
- Push a `main` → deploy a producción
- Push a `dev` → deploy a desarrollo
- Push a `rovi_deploy` → deploy a preview
- Pipeline: tests → lint → build Docker → push GHCR → SSH deploy

---

## 9. Checklist al agregar una nueva feature

### Backend
- [ ] Definir/actualizar el Pydantic model en `models.py`
- [ ] Agregar endpoints en `server.py` con el prefijo `/api`
- [ ] Incluir `Depends(get_current_user)` en todos los endpoints protegidos
- [ ] Filtrar SIEMPRE por `tenant_id` en queries MongoDB
- [ ] Usar `serialize_doc()` antes de devolver documentos
- [ ] Agregar test en `tests/` (al menos smoke)

### Frontend
- [ ] Crear el componente/página en `pages/`
- [ ] Agregar ruta en `App.js`
- [ ] Agregar item al sidebar en `Sidebar.js` (en el array correcto según account_type)
- [ ] Usar `api` de `AuthContext` para llamadas HTTP
- [ ] Aplicar gating por `account_type` si aplica
- [ ] Usar componentes de `shadcn/ui` y colores del design system

---

## 10. Errores frecuentes y cómo evitarlos

| Error | Causa | Solución |
|-------|-------|----------|
| Query devuelve datos de otros usuarios | Falta filtro `tenant_id` | Siempre `{"tenant_id": tenant_id, ...}` |
| `emergentintegrations` not found | No está en PyPI público | Usar try/except, el AI service falla gracefully |
| CORS error en frontend | Backend no permite el origen | Agregar URL a `CORS_ORIGINS` en `.env` |
| `_id` ObjectId serialization error | Mongo devuelve ObjectId directo | Siempre pasar por `serialize_doc()` |
| Frontend no muestra módulo de agencia | Falta gating | `user?.account_type === 'agency'` |
| Build React falla con craco | Config webpack | `yarn build` usa craco; plugins visuales solo en dev |
