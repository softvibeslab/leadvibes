---
id: LEAD-001
version: 0.0.1
status: draft
created: 2026-03-20
updated: 2026-03-20
author: @RogerVibes
priority: medium
category: docs
labels:
  - lead-management
  - documentation
  - existing-feature
  - crm
depends_on: []
blocks: []
related_specs:
  - PIPE-001
  - SCORE-001
scope:
  packages:
    - backend/server.py
    - frontend/src/pages/LeadsPage.js
  files:
    - backend/models.py (Lead model)
    - backend/services/lead_service.py
---

# @SPEC:LEAD-001: Lead Management System - Documentación

## HISTORY

### v0.0.1 (2026-03-20)
- **INITIAL**: Documentación de Lead Management System - Creación inicial
- **AUTHOR**: @RogerVibes
- **SCOPE**: Documentar feature existente de gestión de leads (CRUD, pipeline, assignment, import/export, AI analysis)
- **CONTEXT**: Feature está 95% implementada pero falta documentación formal de requisitos y especificaciones
- **REASON**: Estandarizar y documentar feature existente para facilitar mantenimiento y futuras mejoras

---

## Environment

### Estado Actual de la Feature

- **Completitud**: 95% implementada
- **Ubicación**: `backend/server.py` (endpoints), `frontend/src/pages/LeadsPage.js` (UI)
- **Database**: MongoDB con colección `leads`
- **Integraciones**: AI Service (lead analysis), Campaigns (bulk actions)

### Arquitectura

```
Lead Management System
├── Backend (FastAPI)
│   ├── POST /api/leads (Crear lead)
│   ├── GET /api/leads (Listar con filtros)
│   ├── GET /api/leads/{id} (Detalle)
│   ├── PATCH /api/leads/{id} (Actualizar)
│   ├── DELETE /api/leads/{id} (Eliminar)
│   ├── POST /api/leads/bulk-import (CSV import)
│   ├── POST /api/leads/{id}/assign (Asignar broker)
│   └── POST /api/leads/{id}/analyze (AI analysis)
│
├── Frontend (React)
│   ├── Leads Page (Tabla + Kanban board)
│   ├── Lead Detail Modal
│   ├── Lead Form (Crear/Editar)
│   └── Bulk Import Modal
│
└── Database (MongoDB)
    └── leads collection
```

---

## Assumptions

1. **Feature Implementada**: Código existe y está funcionando en producción
2. **Documentación Retrospectiva**: Este SPEC documenta feature ya creada (no es especificación previa)
3. **Mantenimiento**: Este SPEC servirá como referencia para futuras mejoras
4. **Codificación**: Código actual sigue patrones de FastAPI y React

---

## Requirements

### Ubiquitous Requirements (Básicas)

- El sistema debe permitir crear leads con datos demográficos y presupuesto
- El sistema debe listar leads con filtros (status, broker, prioridad, fecha)
- El sistema debe mostrar pipeline visual (Kanban board)
- El sistema debe permitir asignar leads a brokers (manual o round robin)
- El sistema debe soportar importación masiva de leads (CSV)

### Event-driven Requirements (WHEN-THEN)

- **WHEN** se crea un lead, el sistema debe generar UUID único y asignar status "nuevo"
- **WHEN** se asigna un broker, el sistema debe notificar al broker via email/in-app
- **WHEN** se importa CSV, el sistema debe validar datos y crear leads en batch
- **WHEN** se solicita análisis IA, el sistema debe retornar score de intención y sentimiento
- **WHEN** se elimina un lead, el sistema debe archivarlo (soft delete) no borrar físicamente

### State-driven Requirements (WHILE-THEN)

- **WHILE** un lead está en etapa "nuevo", el sistema debe resaltarlo como "requiere atención"
- **WHILE** un lead no tiene broker asignado, el sistema debe mostrarlo en pool de leads sin asignar
- **WHILE** se importa CSV, el sistema debe mostrar progreso de importación

### Optional Requirements (WHERE-THEN)

- **WHERE** un lead viene de fuente "Referido", el sistema puede marcar como prioritario
- **WHERE** un broker está sobrecargado (>50 leads), el sistema puede sugerir reasignación
- **WHERE** se detecta lead duplicado (mismo email/teléfono), el sistema debe alertar

### Constraints (IF-THEN)

- **IF** un lead ya existe con mismo email, el sistema debe rechazar duplicado
- **IF** un lead tiene presupuesto < $500k, el sistema puede marcar como "low priority"
- **IF** un broker está de vacaciones, el sistema no debe asignarle nuevos leads
- **IF** el CSV import tiene formato inválido, el sistema debe rechazar importación con error específico
- **IF** un lead se elimina, el sistema debe mantener registro en colección `leads_archived`

---

## Specifications

### @CODE:LEAD-001:MODEL Lead Data Model

**Ubicación**: `backend/models.py`

```python
class Lead(BaseModel):
    id: str  # UUID
    first_name: str
    last_name: str
    email: Optional[str]
    phone: str
    budget: Optional[int]  # Presupuesto en MXN
    location: Optional[str]  # Tulum Centro, La Veleta, etc.
    source: str  # facebook, instagram, referido, web
    status: str  # nuevo, contactado, calificacion, presentacion, apartado, venta
    priority: str  # baja, media, alta
    assigned_broker_id: Optional[str]
    tenant_id: str
    score: Optional[int]  # 1-100 (AI analysis)
    intention: Optional[str]  # "alta", "media", "baja"
    sentiment: Optional[str]  # "positivo", "neutral", "negativo"
    created_at: datetime
    updated_at: datetime
    last_activity_at: Optional[datetime]
    notes: Optional[str]
    tags: List[str] = []
    custom_fields: Dict[str, Any] = {}
```

### @CODE:LEAD-001:API Endpoints

**Ubicación**: `backend/server.py`

#### 1. POST `/api/leads`
- **Descripción**: Crear nuevo lead
- **Auth**: Requiere JWT token
- **Body**: LeadCreate model
- **Response**: Lead creado (status 201)

#### 2. GET `/api/leads`
- **Descripción**: Listar leads con filtros
- **Query Params**:
  - `?status=nuevo`
  - `?broker_id={uuid}`
  - `?priority=alta`
  - `?source=facebook`
  - `?start_date=2026-03-01&end_date=2026-03-31`
  - `?search=juan` (búsqueda por nombre/email)
  - `?page=1&limit=20` (paginación)
- **Response**: Array de leads + metadata (total, page, pages)

#### 3. GET `/api/leads/{id}`
- **Descripción**: Obtener detalle de lead
- **Response**: Lead completo + activities + campaigns

#### 4. PATCH `/api/leads/{id}`
- **Descripción**: Actualizar lead (parcial)
- **Body**: Campos a actualizar (status, priority, notes, etc.)
- **Response**: Lead actualizado

#### 5. DELETE `/api/leads/{id}`
- **Descripción**: Eliminar lead (soft delete)
- **Response**: 204 No Content

#### 6. POST `/api/leads/bulk-import`
- **Descripción**: Importar leads desde CSV
- **Body**: Multipart form data con archivo CSV
- **Formato CSV**:
  ```csv
  first_name,last_name,email,phone,budget,location,source
  Juan,Pérez,juan@example.com,521234567890,2000000,La Veleta,facebook
  María,González,maria@example.com,529876543210,3000000,Tulum Centro,instagram
  ```
- **Response**:
  ```json
  {
    "created": 95,
    "failed": 5,
    "errors": [
      {"row": 10, "error": "Email inválido"},
      {"row": 25, "error": "Teléfono duplicado"}
    ]
  }
  ```

#### 7. POST `/api/leads/{id}/assign`
- **Descripción**: Asignar lead a broker
- **Body**: `{"broker_id": "uuid", "reason": "manual"}`
- **Assignment Rules**:
  - `manual`: Broker seleccionado manualmente
  - `round_robin`: Asignar al broker con menos leads
  - `workload_balance`: Asignar al broker con menor workload actual
- **Response**: Lead actualizado con broker asignado

#### 8. POST `/api/leads/{id}/analyze`
- **Descripción**: Analizar lead con IA (intención, sentimiento, score)
- **Integration**: AI Service (`backend/ai_service.py`)
- **Response**:
  ```json
  {
    "lead_id": "uuid",
    "score": 78,
    "intention": "alta",
    "sentiment": "positivo",
    "insights": [
      "Presupuesto suficiente para propiedades premium",
      "Fuente confiable (referido)",
      "Respondió rápidamente a primer contacto"
    ],
    "recommendation": "Priorizar - Llamar en las próximas 24h"
  }
  ```

---

### @CODE:LEAD-001:UI User Interface

**Ubicación**: `frontend/src/pages/LeadsPage.js`

#### Componentes

1. **Leads Table**
   - Columnas: Nombre, Email, Teléfono, Status, Broker, Score, Última Actividad, Acciones
   - Filtros: Status (dropdown), Broker (dropdown), Buscador (search input)
   - Ordenamiento: Por cualquier columna
   - Paginación: 20 leads por página

2. **Kanban Board**
   - Columnas: Nuevo, Contactado, Calificación, Presentación, Apartado, Venta
   - Drag & Drop: Mover leads entre columnas
   - Color Coding: Prioridad (alta = rojo, media = amarillo, baja = verde)

3. **Lead Detail Modal**
   - Información del lead (todos los campos)
   - Timeline de actividades (llamadas, emails, visitas)
   - AI Analysis (score, intención, sentimiento)
   - Acciones: Llamar, Email, WhatsApp, Actualizar status

4. **Lead Form**
   - Campos obligatorios: Nombre, Teléfono, Presupuesto, Fuente
   - Campos opcionales: Email, Ubicación, Notas
   - Validaciones: Email único, Teléfono formato MX

5. **Bulk Import Modal**
   - Upload de archivo CSV
   - Preview de datos (primeras 10 filas)
   - Validación de formato
   - Progress bar durante importación

---

## Traceability (@TAG)

- **SPEC**: @SPEC:LEAD-001
- **TEST**: `backend/tests/test_leads.py` → @TEST:LEAD-001
- **CODE**:
  - `backend/server.py` → @CODE:LEAD-001:API (Endpoints de leads)
  - `backend/models.py` → @CODE:LEAD-001:DATA (Lead model)
  - `frontend/src/pages/LeadsPage.js` → @CODE:LEAD-001:UI
- **DOC**: `docs/lead-management-guide.md` → @DOC:LEAD-001

---

## Acceptance Criteria

### Criterios de Aceptación

1. **CRUD Funcional**: Crear, leer, actualizar, eliminar leads funciona correctamente
2. **Pipeline Visual**: Kanban board con drag & drop funcionando
3. **Assignment System**: Asignación manual y round robin funcionando
4. **Bulk Import**: CSV import con validación y errores reportados
5. **AI Integration**: Análisis de lead con IA retorna score y recomendaciones

### Definición de Done

- [x] Feature implementada (95% completada)
- [ ] Tests unitarios y de integración creados
- [ ] Documentación de API (OpenAPI/Swagger) generada
- [ ] User guide para brokers creada
- [ ] Video tutorial de uso creado
