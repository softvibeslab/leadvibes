# Documentación del Backend - Rovi CRM

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura](#arquitectura)
3. [Configuración del Entorno](#configuración-del-entorno)
4. [Modelos de Datos](#modelos-de-datos)
5. [API Endpoints](#api-endpoints)
6. [Autenticación y Autorización](#autenticación-y-autorización)
7. [Integraciones](#integraciones)
8. [Servicios](#servicios)
9. [Base de Datos](#base-de-datos)
10. [Pruebas](#pruebas)

---

## Visión General

El backend de Rovi CRM está construido con **FastAPI** y **MongoDB**, diseñado como una API RESTful asíncrona para gestionar un sistema CRM inmobiliario multi-tenant.

### Características Principales

- Arquitectura asíncrona con Motor (MongoDB async)
- Multi-tenant con aislamiento de datos por `tenant_id`
- Autenticación JWT con bcrypt
- Integración con OpenAI para análisis de leads
- Integraciones con VAPI, Twilio, SendGrid, Google Calendar
- Sistema de gamificación con puntos y leaderboards

---

## Arquitectura

### Estructura de Archivos

```
backend/
├── server.py           # Aplicación principal FastAPI con todos los endpoints
├── models.py           # Modelos Pydantic para validación
├── auth.py             # Utilidades de autenticación
├── ai_service.py       # Servicios de IA con OpenAI
├── seed_data.py        # Datos iniciales para nuevos tenants
├── requirements.txt    # Dependencias de Python
├── .env                # Variables de entorno
└── tests/              # Pruebas
    ├── test_leadvibes_crm.py
    ├── test_import_leads.py
    └── test_google_calendar_email_templates.py
```

### Flujo de Datos

```
Cliente Frontend → API Gateway (FastAPI) → Motor (MongoDB)
                      ↓
                 AuthService
                 AIService
            IntegrationServices
```

---

## Configuración del Entorno

### Variables de Entorno Requeridas

Crea un archivo `.env` en el directorio `backend/`:

```bash
# Base de Datos
MONGO_URL=mongodb://localhost:27017
DB_NAME=rovi_crm

# JWT
JWT_SECRET=tu_secreto_super_seguro_aqui
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# IA (Emergent Integrations - OpenAI)
EMERGENT_LLM_KEY=tu_api_key_aqui

# Integraciones (Opcionales - configurables por usuario)
VAPI_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
SENDGRID_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Instalación

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate     # Windows

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servidor
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

---

## Modelos de Datos

### Usuarios

#### UserCreate
```python
{
    "email": "user@example.com",
    "password": "password123",
    "name": "Nombre Usuario",
    "role": "broker",           # admin, manager, broker
    "phone": "+521234567890",
    "account_type": "individual" # individual, agency
}
```

#### UserResponse
```python
{
    "id": "uuid",
    "email": "user@example.com",
    "name": "Nombre Usuario",
    "role": "broker",
    "avatar_url": "https://...",
    "phone": "+521234567890",
    "is_active": true,
    "onboarding_completed": false,
    "account_type": "individual"
}
```

### Leads

#### LeadStatus (Enum)
- `nuevo` - Lead recién creado
- `contactado` - Primer contacto realizado
- `calificacion` - En proceso de calificación
- `presentacion` - Presentación realizada
- `apartado` - Apartado de propiedad
- `venta` - Venta cerrada
- `perdido` - Lead perdido

#### LeadPriority (Enum)
- `baja` - Baja prioridad
- `media` - Prioridad media
- `alta` - Alta prioridad
- `urgente` - Urgente

#### Lead
```python
{
    "id": "uuid",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+521234567890",
    "status": "nuevo",
    "priority": "media",
    "source": "web",
    "budget_mxn": 5000000.0,
    "property_interest": "Lote en La Veleta",
    "location_preference": "Tulum",
    "notes": "Interesado en lotes de lujo",
    "company": null,
    "position": null,
    "assigned_broker_id": "uuid",
    "created_by": "uuid",
    "tenant_id": "tenant-abc123",
    "created_at": "2026-03-07T00:00:00Z",
    "updated_at": "2026-03-07T00:00:00Z",
    "ai_analysis": {...},
    "intent_score": 75,
    "next_action": "Llamar para agendar visita"
}
```

### Actividades

#### ActivityType (Enum)
- `llamada` - Llamada telefónica
- `whatsapp` - Mensaje de WhatsApp
- `email` - Correo electrónico
- `zoom` - Videollamada
- `visita` - Visita presencial
- `nota` - Nota interna
- `apartado` - Apartado de propiedad
- `venta` - Venta cerrada

### Calendario

#### CalendarEvent
```python
{
    "id": "uuid",
    "title": "Visita Lote 123",
    "description": "Mostrar lote en La Veleta",
    "event_type": "visita",  # seguimiento, llamada, zoom, visita, otro
    "start_time": "2026-03-10T10:00:00Z",
    "end_time": "2026-03-10T11:00:00Z",
    "lead_id": "uuid",
    "reminder_minutes": 30,
    "color": "#0D9488",
    "user_id": "uuid",
    "tenant_id": "tenant-abc123",
    "completed": false,
    "google_event_id": "google_event_id",
    "synced_from_google": false,
    "last_synced_at": "2026-03-07T00:00:00Z",
    "created_at": "2026-03-07T00:00:00Z"
}
```

### Campañas

#### CampaignType (Enum)
- `call` - Llamadas masivas con VAPI
- `sms` - SMS masivos con Twilio
- `email` - Email marketing con SendGrid

#### CampaignStatus (Enum)
- `draft` - Borrador
- `scheduled` - Programada
- `running` - En ejecución
- `completed` - Completada
- `paused` - Pausada
- `failed` - Fallida

### Registros de Comunicación

#### CallRecord
```python
{
    "id": "uuid",
    "user_id": "uuid",
    "tenant_id": "tenant-abc123",
    "lead_id": "uuid",
    "lead_name": "Juan Pérez",
    "phone_number": "+521234567890",
    "campaign_id": "uuid",
    "vapi_call_id": "vapi_id",
    "status": "completed",
    "duration_seconds": 245.5,
    "transcript": "Texto de la conversación...",
    "recording_url": "https://...",
    "summary": "Resumen de la llamada",
    "sentiment": "positive",
    "outcome": "interesado",
    "scheduled_at": "2026-03-07T10:00:00Z",
    "started_at": "2026-03-07T10:00:00Z",
    "ended_at": "2026-03-07T10:04:05Z",
    "created_at": "2026-03-07T00:00:00Z"
}
```

#### SMSRecord
```python
{
    "id": "uuid",
    "user_id": "uuid",
    "tenant_id": "tenant-abc123",
    "lead_id": "uuid",
    "lead_name": "Juan Pérez",
    "phone_number": "+521234567890",
    "message": "Hola, te contactamos de Rovi...",
    "campaign_id": "uuid",
    "twilio_sid": "twilio_sid",
    "status": "delivered",
    "error_message": null,
    "sent_at": "2026-03-07T10:00:00Z",
    "delivered_at": "2026-03-07T10:00:05Z",
    "created_at": "2026-03-07T00:00:00Z"
}
```

#### EmailRecord
```python
{
    "id": "uuid",
    "user_id": "uuid",
    "tenant_id": "tenant-abc123",
    "lead_id": "uuid",
    "email": "juan@example.com",
    "subject": "Propiedades en Tulum",
    "template_id": "uuid",
    "campaign_id": "uuid",
    "status": "opened",
    "sendgrid_message_id": "msg_id",
    "opened_at": "2026-03-07T11:00:00Z",
    "clicked_at": "2026-03-07T11:05:00Z",
    "bounced_reason": null,
    "sent_at": "2026-03-07T10:00:00Z",
    "created_at": "2026-03-07T00:00:00Z"
}
```

### Plantillas de Email

#### EmailTemplate
```python
{
    "id": "uuid",
    "user_id": "uuid",
    "tenant_id": "tenant-abc123",
    "name": "Bienvenida",
    "subject": "Bienvenido a Rovi Real Estate",
    "html_content": "<html>...</html>",
    "json_content": {...},  # Estructura del editor visual
    "variables": ["nombre", "propiedad"],
    "thumbnail_url": "https://...",
    "is_default": false,
    "created_at": "2026-03-07T00:00:00Z",
    "updated_at": "2026-03-07T00:00:00Z"
}
```

### Gamificación

#### GamificationRule
```python
{
    "id": "uuid",
    "action": "llamada",
    "points": 1,
    "description": "Por cada llamada realizada",
    "icon": "phone",
    "tenant_id": "tenant-abc123",
    "is_active": true,
    "created_at": "2026-03-07T00:00:00Z"
}
```

#### PointLedger
```python
{
    "id": "uuid",
    "broker_id": "uuid",
    "points": 5,
    "action": "visita",
    "description": "Visita con lead Juan Pérez",
    "lead_id": "uuid",
    "activity_id": "uuid",
    "tenant_id": "tenant-abc123",
    "created_at": "2026-03-07T00:00:00Z"
}
```

### Importación de Leads

#### ImportJob
```python
{
    "id": "uuid",
    "user_id": "uuid",
    "tenant_id": "tenant-abc123",
    "status": "processing",  # pending, processing, completed, failed
    "file_name": "leads.csv",
    "total_rows": 100,
    "processed_rows": 50,
    "successful_rows": 45,
    "failed_rows": 5,
    "column_mapping": {...},
    "error_log": [...],
    "created_at": "2026-03-07T00:00:00Z",
    "completed_at": null
}
```

---

## API Endpoints

### Prefijo
Todos los endpoints tienen el prefijo `/api`

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registrar nuevo usuario |
| POST | `/auth/login` | Iniciar sesión |
| GET | `/auth/me` | Obtener usuario actual |

#### POST /auth/register
```json
// Request
{
    "email": "user@example.com",
    "password": "password123",
    "name": "Juan Pérez",
    "role": "broker",
    "phone": "+521234567890",
    "account_type": "individual"
}

// Response
{
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "user": {
        "id": "uuid",
        "email": "user@example.com",
        "name": "Juan Pérez",
        "role": "broker",
        "account_type": "individual",
        ...
    }
}
```

### Metas y Onboarding

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/goals` | Crear o actualizar metas del usuario |
| GET | `/goals` | Obtener metas del usuario |

### Dashboard

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/dashboard/stats` | Estadísticas del dashboard |
| GET | `/dashboard/kpi-detail/{kpi_type}` | Detalle de KPI específico |
| GET | `/dashboard/leaderboard` | Leaderboard mensual |
| GET | `/dashboard/recent-activity` | Actividad reciente |

### Leads

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/leads` | Obtener todos los leads (con filtros) |
| GET | `/leads/{lead_id}` | Obtener lead específico |
| POST | `/leads` | Crear nuevo lead |
| PUT | `/leads/{lead_id}` | Actualizar lead |
| DELETE | `/leads/{lead_id}` | Eliminar lead |
| POST | `/leads/{lead_id}/analyze` | Analizar lead con IA |
| POST | `/leads/{lead_id}/generate-script` | Generar script de ventas |

#### GET /leads (Query Params)
- `status`: Filtrar por estado (nuevo, contactado, etc.)
- `priority`: Filtrar por prioridad (baja, media, alta, urgente)
- `source`: Filtrar por fuente
- `assigned_broker_id`: Filtrar por broker asignado
- `search`: Búsqueda en nombre/email/teléfono

### Actividades

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/activities` | Crear nueva actividad |
| GET | `/activities` | Obtener todas las actividades |

### Brokers

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/brokers` | Obtener todos los brokers |
| GET | `/brokers/{broker_id}` | Obtener broker específico |

### Gamificación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/gamification/rules` | Obtener reglas de gamificación |
| POST | `/gamification/rules` | Crear regla de gamificación |
| GET | `/gamification/points` | Obtener historial de puntos |

### Chat con IA

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/chat` | Enviar mensaje al asistente IA |
| GET | `/chat/history` | Obtener historial de chat |

### Scripts

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/scripts` | Obtener todos los scripts |
| POST | `/scripts` | Crear nuevo script |
| GET | `/scripts/{script_id}` | Obtener script específico |
| PUT | `/scripts/{script_id}` | Actualizar script |
| DELETE | `/scripts/{script_id}` | Eliminar script |

### Calendario

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/calendar/events` | Obtener eventos del calendario |
| POST | `/calendar/events` | Crear nuevo evento |
| PUT | `/calendar/events/{event_id}` | Actualizar evento |
| DELETE | `/calendar/events/{event_id}` | Eliminar evento |
| GET | `/calendar/today` | Obtener eventos de hoy |

### Configuración de Integraciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/settings/integrations` | Obtener configuración |
| PUT | `/settings/integrations` | Actualizar configuración |
| POST | `/settings/integrations/test-vapi` | Probar conexión VAPI |
| POST | `/settings/integrations/test-twilio` | Probar conexión Twilio |
| POST | `/settings/integrations/test-sendgrid` | Probar conexión SendGrid |

### Campañas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/campaigns` | Obtener todas las campañas |
| POST | `/campaigns` | Crear nueva campaña |
| GET | `/campaigns/{campaign_id}` | Obtener campaña específica |
| PUT | `/campaigns/{campaign_id}` | Actualizar campaña |
| DELETE | `/campaigns/{campaign_id}` | Eliminar campaña |
| POST | `/campaigns/{campaign_id}/start` | Iniciar campaña |

### Comunicaciones

#### Llamadas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/calls` | Obtener registros de llamadas |
| POST | `/calls/single` | Realizar llamada individual |
| GET | `/calls/{call_id}/analysis` | Obtener análisis de llamada |

#### SMS
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/sms` | Obtener registros SMS |
| POST | `/sms/single` | Enviar SMS individual |

#### Emails
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/emails` | Obtener registros de emails |
| POST | `/emails/single` | Enviar email individual |

### Plantillas de Email

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/email-templates` | Obtener plantillas |
| POST | `/email-templates` | Crear plantilla |
| GET | `/email-templates/{template_id}` | Obtener plantilla específica |
| PUT | `/email-templates/{template_id}` | Actualizar plantilla |
| DELETE | `/email-templates/{template_id}` | Eliminar plantilla |

### Google Calendar

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/oauth/google/login` | Iniciar flujo OAuth |
| GET | `/oauth/google/callback` | Callback de OAuth |
| POST | `/oauth/google/disconnect` | Desconectar Google |
| GET | `/google-calendar/events` | Obtener eventos de Google |
| POST | `/google-calendar/events` | Crear evento en Google |
| DELETE | `/google-calendar/events/{event_id}` | Eliminar evento de Google |
| POST | `/calendar/events/{event_id}/sync-google` | Sincronizar evento con Google |
| POST | `/google-calendar/import` | Importar eventos de Google |
| POST | `/google-calendar/sync` | Sincronizar todos los eventos |

### Importación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/import/fields` | Obtener campos importables |
| POST | `/import/upload` | Subir archivo CSV/Excel |
| POST | `/import/preview` | Previsualizar datos |
| POST | `/import/execute` | Ejecutar importación |
| GET | `/import/jobs` | Obtener trabajos de importación |
| GET | `/import/jobs/{job_id}` | Obtener trabajo específico |
| GET | `/import/template` | Descargar plantilla CSV |

### Utilidades

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Endpoint raíz |
| GET | `/health` | Health check |

---

## Autenticación y Autorización

### JWT Flow

1. **Registro/Login**: El cliente recibe un `access_token` JWT
2. **Almacenamiento**: El frontend guarda el token en `localStorage`
3. **Requests**: El token se envía en el header `Authorization: Bearer {token}`
4. **Verificación**: Cada endpoint protegido verifica el token con `get_current_user()`

### Dependencias de FastAPI

```python
# Obtener usuario actual
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict

# Requerir rol específico
@require_role(["admin", "manager"])
async def admin_only_endpoint(current_user: dict = Depends(get_current_user)):
    ...
```

### Roles de Usuario

- **admin**: Acceso completo al sistema
- **manager**: Acceso a dashboard de equipo, gamificación
- **broker**: Acceso a sus propios leads y actividades

### Multi-tenancy

Cada usuario tiene un `tenant_id` derivado de su ID. Todas las consultas a la base de datos incluyen:

```python
{"tenant_id": current_user["tenant_id"], ...}
```

Esto garantiza el aislamiento completo de datos entre diferentes usuarios/agencias.

---

## Integraciones

### VAPI (AI Voice Calls)

**Propósito**: Llamadas automáticas con IA para campañas masivas

**Configuración**:
- `vapi_api_key`: API key de VAPI
- `vapi_phone_number_id`: ID del número de teléfono
- `vapi_assistant_id`: ID del asistente de IA

**Funciones**:
- Llamadas automatizadas
- Transcripción de conversaciones
- Análisis de sentimiento
- Resumen automático de llamadas

### Twilio (SMS)

**Propósito**: Envío de SMS masivos y individuales

**Configuración**:
- `twilio_account_sid`: SID de cuenta
- `twilio_auth_token`: Token de autenticación
- `twilio_phone_number`: Número de teléfono

**Funciones**:
- Envío de SMS individuales
- Campañas de SMS masivos
- Seguimiento de estado de entrega
- Webhooks para actualizaciones de estado

### SendGrid (Email)

**Propósito**: Email marketing y transaccional

**Configuración**:
- `sendgrid_api_key`: API key de SendGrid
- `sendgrid_sender_email`: Email remitente
- `sendgrid_sender_name`: Nombre del remitente

**Funciones**:
- Envío de emails individuales
- Campañas de email masivo
- Tracking de aperturas y clics
- Plantillas personalizables

### Google Calendar

**Propósito**: Sincronización bidireccional de calendario

**Configuración**:
- `google_client_id`: OAuth2 Client ID
- `google_client_secret`: OAuth2 Client Secret

**Funciones**:
- Conexión OAuth2 con Google
- Sincronización de eventos
- Importación de eventos de Google
- Creación de eventos en Google Calendar

### OpenAI (via Emergent)

**Propósito**: Análisis de leads y generación de contenido

**Configuración**:
- `EMERGENT_LLM_KEY`: API key de Emergent Integrations

**Funciones**:
- Análisis de intención de compra
- Generación de scripts de ventas
- Asistente de chat contextual
- Puntuación de leads

---

## Servicios

### AIService (ai_service.py)

#### get_ai_response
Genera respuestas del asistente de chat con contexto del CRM.

```python
await get_ai_response(
    user_message="¿Cómo puedo mejorar mis ventas?",
    session_id="user-uuid",
    context={
        "user_goals": {...},
        "stats": {...}
    }
)
```

#### analyze_lead
Analiza un lead y proporciona insights de IA.

```python
await analyze_lead({
    "id": "lead-uuid",
    "name": "Juan Pérez",
    "budget_mxn": 5000000,
    ...
})
# Returns: {
#     "intent_score": 75,
#     "sentiment": "positivo",
#     "key_points": [...],
#     "next_action": "...",
#     "opening_script": "..."
# }
```

#### generate_sales_script
Genera un script de ventas personalizado.

```python
await generate_sales_script(
    lead_data={...},
    script_type="apertura"  # apertura, cierre, seguimiento
)
```

---

## Base de Datos

### Colecciones de MongoDB

1. **users** - Usuarios y perfiles
2. **leads** - Información de leads
3. **activities** - Actividades de brokers
4. **goals** - Metas y KPIs
5. **gamification_rules** - Reglas de puntos
6. **point_ledger** - Historial de puntos
7. **scripts** - Scripts de ventas
8. **calendar_events** - Eventos de calendario
9. **integration_settings** - Configuración de integraciones
10. **campaigns** - Campañas de marketing
11. **call_records** - Registros de llamadas
12. **sms_records** - Registros de SMS
13. **email_records** - Registros de emails
14. **email_templates** - Plantillas de email
15. **google_calendar_events** - Eventos sincronizados
16. **import_jobs** - Trabajos de importación
17. **import_data** - Datos temporales de importación
18. **chat_messages** - Historial de chat

### Índices Recomendados

```javascript
// Leads
db.leads.createIndex({ "tenant_id": 1, "status": 1 })
db.leads.createIndex({ "tenant_id": 1, "priority": 1 })
db.leads.createIndex({ "tenant_id": 1, "assigned_broker_id": 1 })

// Activities
db.activities.createIndex({ "tenant_id": 1, "broker_id": 1, "created_at": -1 })

// Calendar Events
db.calendar_events.createIndex({ "tenant_id": 1, "user_id": 1, "start_time": 1 })

// Campaigns
db.campaigns.createIndex({ "tenant_id": 1, "status": 1 })

// Point Ledger
db.point_ledger.createIndex({ "tenant_id": 1, "broker_id": 1, "created_at": -1 })
```

---

## Pruebas

### Ejecutar Todas las Pruebas

```bash
cd backend
pytest
```

### Ejecutar Prueba Específica

```bash
pytest tests/test_leadvibes_crm.py
```

### Ejecutar con Verbosidad

```bash
pytest -v tests/test_leadvibes_crm.py::TestAuth::test_login_individual_user
```

### Archivo de Pruebas

Las pruebas usan la variable de entorno `REACT_APP_BACKEND_URL` o por defecto:
```
https://lead-bulk-upload.preview.emergentagent.com
```

### Estructura de Tests

```python
class TestAuth:
    def test_health_check(self): ...
    def test_login_individual_user(self): ...
    def test_register_agency_user(self): ...

class TestLeads:
    def test_get_leads(self): ...
    def test_create_lead(self): ...
    ...
```

---

## Configuración de Producción

### CORS

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tu-dominio.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Logging

```python
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### Seguridad

1. Usar variables de entorno para secrets
2. Implementar rate limiting
3. Validar todos los inputs con Pydantic
4. Sanitizar datos de MongoDB antes de retornar
5. Implementar refresh tokens para JWT

---

## Solución de Problemas

### Errores Comunes

**Error: Token inválido o expirado**
- Verificar que `JWT_SECRET` sea el mismo en frontend y backend
- Verificar que el token no haya expirado (24 horas por defecto)

**Error: Conexión a MongoDB**
- Verificar que `MONGO_URL` sea correcta
- Verificar que el servidor de MongoDB esté accesible
- Verificar las credenciales de conexión

**Error: IA no responde**
- Verificar que `EMERGENT_LLM_KEY` sea válida
- Verificar la conexión con Emergent Integrations
- Revisar logs del servidor para más detalles

---

## Licencia

Confidencial - Rovi Real Estate
