# 🚀 PROMPT MAESTRO COMPLETO - ROVI OWNERS
## Guía Detallada para Crear el Sistema desde Cero

**Versión:** 2.0 - Actualizada con 15 Módulos Completos  
**Fecha:** Mayo 2026  
**Duración Estimada:** 8-10 semanas  
**Nivel:** Experto - Para desarrolladores Full Stack  
**Stack:** FastAPI + MongoDB + React 19 + Tailwind CSS

---

## 📋 ÍNDICE DEL PROMPT

1. [CONTEXTO COMPLETO DEL PROYECTO](#contexto)
2. [ARQUITECTURA DEL SISTEMA](#arquitectura)
3. [MODELOS DE DATOS](#modelos)
4. [ENDPOINTS API COMPLETOS](#endpoints)
5. [FRONTEND - COMPONENTES POR NIVEL](#frontend)
6. [BASE DE DATOS Y MIGRACIÓN](#database)
7. [INTEGRACIONES EXTERNAS](#integraciones)
8. [PLAN DE IMPLEMENTACIÓN](#implementacion)

---

## 1. CONTEXTO COMPLETO DEL PROYECTO {#contexto}

### ¿QUÉ ES ROVI OWNERS?

**Transformación de ROVI CRM:** De plataforma inmobiliaria a plataforma B2B SaaS para venta de software.

**Modelo de Negocio:**
- **Antes:** Vendíamos ROVI CRM a inmobiliarias para vender casas
- **Ahora:** Usamos ROVI CRM para vender ROVI CRM a inmobiliarias
- **Estrategia:** "Dogfooding" - Usamos nuestro propio producto para venderlo

**Público Objetivo (ICP - Ideal Customer Profile):**
- Inmobiliarias en México (zonas turísticas: Tulum, Playa del Carmen, Cancún)
- Tamaño: 2-50 brokers
- CRM actual: Excel, CRM básico, o buscando reemplazar Salesforce/HubSpot
- Presupuesto: $3,000 - $15,000 MXN mensuales
- Pain Points: Pierden leads, no hacen seguimiento, proceso manual

**Oferta de Productos:**
1. **Essential:** $2,999/mes - 1 broker
2. **Standard:** $7,999/mes - 2-10 brokers
3. **Professional:** $14,999/mes - 11-50 brokers
4. **Enterprise:** Cotización - 50+ brokers

---

### LOS 3 NIVELES DE ACCESO

#### NIVEL 1: ROVI ADMIN GENERAL (Control Total)
**Usuarios:** CEO, COO, Directivos, Gerentes Generales
**Permisos:** Visibilidad global de toda la empresa
**Responsabilidad:** Estrategia, decisiones de inversión, supervisión

**Módulos Exclusivos:**
- Dashboard Global (Marketing + Sales metrics)
- Analytics Avanzado (ROI, Churn, Conversiones)
- Control Total de Base de Datos
- Encuentra Leads (Scraper configuración)
- Gamificación (configurar reglas y bonos)
- Gestión de Equipo (crear, editar, eliminar usuarios)
- Integraciones y Settings (Stripe, Vapi, Twilio, SendGrid, Google Calendar)

#### NIVEL 2: ROVI SALES (Conversión)
**Usuarios:** Sales Executives, Account Executives, Closers
**Permisos:** Solo SUS prospectos y SUS métricas
**Responsabilidad:** Cerrar ventas, cumplir meta mensual

**Módulos Exclusivos:**
- Dashboard Personal ("Mi Performance")
- Pipeline de Prospectos (Kanban board)
- Scripts de Venta (guiones probados)
- Productos/Servicios (catálogo de planes)
- Calendario (agenda personal)
- Analytics Personal (mis métricas)
- Importación de Leads (cargar bases externas)
- Automatizaciones (follow-ups automáticos)
- Chat con IA (asistente de redacción)

#### NIVEL 3: ROVI MARKETING (Generación de Demanda)
**Usuarios:** Marketing Specialists, Campaign Managers, Content Creators
**Permisos:** Campañas, leads generados, métricas de marketing
**Responsabilidad:** Generar leads calificados para Sales

**Módulos Exclusivos:**
- Dashboard Marketing (leads, campañas, CPL)
- Campañas (Email, SMS, VAPI Calls)
- Email Templates (crear/editar plantillas)
- Automatizaciones (flujo de nutrición)
- Importación de Leads (cargar bases externas)
- Analytics Marketing (CPL, aperture rate, clicks)
- Chat con IA (generar copy, posts, contenido)

---

## 2. ARQUITECTURA DEL SISTEMA {#arquitectura}

### STACK TECNOLÓGICO

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 19)                     │
│  ┌───────────────┬───────────────┬───────────────┐          │
│  │ Nivel 1 Admin │  Nivel 2 Sales │ Nivel 3 Mktg  │          │
│  └───────────────┴───────────────┴───────────────┘          │
│         │                │                 │                   │
│         └────────────────┴─────────────────┘                 │
│                        │                                     │
│                  ┌──────▼───────┐                             │
│                  │  API Router  │                             │
│                  └──────┬───────┘                             │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   BACKEND (FastAPI)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /api/prospects    /api/service-plans   /api/team    │   │
│  │  /api/campaigns    /api/analytics      /api/gamification│ │
│  │  /api/import-leads /api/automations    /api/ai-chat │   │
│  └──────────────────────────────────────────────────────┘   │
│                         │                                     │
│                  ┌────────▼────────┐                        │
│                  │   MongoDB (v7)   │                        │
│                  │  - prospects    │                        │
│                  │  - service_plans│                        │
│                  │  - users        │                        │
│                  │  - campaigns    │                        │
│                  │  - gamification │                        │
│                  └─────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### ESTRUCTURA DE CARPETAS

```
leadvibes_2704/
├── backend/
│   ├── server.py                 # Main FastAPI app
│   ├── models.py                 # Pydantic models (todos)
│   ├── auth.py                   # JWT authentication
│   ├── scoring_algorithms.py    # Prospect scoring logic
│   ├── gamification_engine.py   # Points calculation
│   ├── ai_service.py            # OpenAI integration
│   ├── import_export.py         # Lead import/export
│   ├── automation_engine.py     # Workflow automation
│   ├── integration_stripe.py   # Stripe payments
│   ├── integration_vapi.py     # VAPI AI calls
│   ├── integration_twilio.py   # SMS messaging
│   ├── integration_sendgrid.py # Email marketing
│   └── scripts/
│       ├── export_db_backup.py
│       ├── migrate_to_rovi_owners.py
│       └── seed_gamification_rules.py
│
├── frontend/
│   ├── src/
│   │   ├── App.js               # React Router con rutas por nivel
│   │   ├── context/
│   │   │   └── AuthContext.js   # JWT auth, axios instance
│   │   ├── pages/
│   │   │   ├── Dashboard/
│   │   │   │   ├── AdminDashboard.js
│   │   │   │   ├── SalesDashboard.js
│   │   │   │   └── MarketingDashboard.js
│   │   │   ├── ProspectsPage.js
│   │   │   ├── CampaignsPage.js
│   │   │   ├── TeamPage.js
│   │   │   ├── ServicePlansPage.js
│   │   │   ├── ImportLeadsPage.js
│   │   │   ├── AutomationsPage.js
│   │   │   ├── AIChatPage.js
│   │   │   ├── AnalyticsPage.js
│   │   │   ├── GamificationPage.js
│   │   │   ├── CalendarPage.js
│   │   │   ├── ScriptsPage.js
│   │   │   ├── OnboardingPage.js
│   │   │   ├── ChurnPredictionPage.js
│   │   │   └── ReferralsPage.js
│   │   └── components/
│   │       ├── Sidebar.js       # Navegación por nivel
│   │       ├── ProspectCard.js
│   │       ├── PipelineBoard.js
│   │       ├── GamificationBadge.js
│   │       └── ui/               # shadcn/ui components
│   └── package.json
│
└── docker-compose.yml           # Multi-container deployment
```

---

## 3. MODELOS DE DATOS {#modelos}

### IMPORTAR ESTE CÓDIGO EN `backend/models.py`:

```python
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

# ============================================================================
# ENUMS - NUEVOS PARA SOFTWARE SALES
# ============================================================================

class ProspectStatus(str, Enum):
    """Estados del pipeline de venta de software"""
    PROSPECTO = "prospecto"
    DISCOVERY_CALL = "discovery_call"
    DEMO_AGENDADA = "demo_agendada"
    DEMO_COMPLETADA = "demo_completada"
    PROPUESTA_ENVIADA = "propuesta_enviada"
    NEGOCIACION = "negociacion"
    CONTRATO_CERRADO = "contrato_cerrado"
    ONBOARDING = "onboarding"
    ACTIVE_USER = "active_user"
    PERDIDO = "perdido"

class CompanySize(str, Enum):
    """Tamaño de empresa del prospecto"""
    SOLO = "solo"           # 1 broker
    SMALL = "small"         # 2-10 brokers
    MEDIUM = "medium"       # 11-50 brokers
    LARGE = "large"         # 50+ brokers

class BusinessType(str, Enum):
    """Tipo de negocio del prospecto"""
    INDIVIDUAL = "individual"
    AGENCY = "agency"
    DEVELOPER = "developer"
    FRANCHISE = "franchise"

class CurrentCRM(str, Enum):
    """CRM actual del prospecto"""
    EXCEL = "excel"
    NONE = "none"
    SALESFORCE = "salesforce"
    HUBSPOT = "hubspot"
    PIPELINE = "pipeline"
    CUSTOM = "custom"

class ServiceTier(str, Enum):
    """Niveles de servicio de ROVI CRM"""
    ESSENTIAL = "essential"
    STANDARD = "standard"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"

class Department(str, Enum):
    """Departamentos del equipo ROVI"""
    SALES = "sales"
    MARKETING = "marketing"
    CUSTOMER_SUCCESS = "customer_success"
    OPERATIONS = "operations"
    MANAGEMENT = "management"

class TeamRole(str, Enum):
    """Roles dentro del equipo"""
    # Management
    CEO = "ceo"
    COO = "coo"
    HEAD_OF_SALES = "head_of_sales"
    HEAD_OF_MARKETING = "head_of_marketing"
    
    # Sales
    SALES_EXECUTIVE = "sales_executive"
    SALES_MANAGER = "sales_manager"
    ENTERPRISE_AE = "enterprise_ae"
    
    # Marketing
    MARKETING_SPECIALIST = "marketing_specialist"
    CONTENT_CREATOR = "content_creator"
    CAMPAIGN_MANAGER = "campaign_manager"
    
    # Customer Success
    CUSTOMER_SUCCESS_MANAGER = "csm"
    ONBOARDING_SPECIALIST = "onboarding_specialist"
    
    # Operations
    SALES_OPS = "sales_ops"
    MARKETING_OPS = "marketing_ops"

class ActivityCategory(str, Enum):
    """Categorías de actividad para gamificación"""
    SALES = "sales"
    MARKETING = "marketing"
    CROSS_DEPARTMENT = "cross_department"

# ============================================================================
# MODEL 1: PROSPECT (Reemplaza a Lead)
# ============================================================================

class ProspectCreate(BaseModel):
    """Modelo para crear nuevo prospecto B2B"""
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company_name: str
    company_size: CompanySize = CompanySize.SMALL
    business_type: BusinessType = BusinessType.AGENCY
    current_crm: CurrentCRM = CurrentCRM.EXCEL
    service_interest: Optional[str] = None  # CRM, Marketing Suite, Full Stack
    estimated_monthly_budget: Optional[float] = None
    implementation_timeline: Optional[str] = None  # Inmediato, 1-3 meses, 3-6 meses
    pain_points: List[str] = []
    source: str = "outbound"  # inbound_demo_request, outbound_call, referral, trade_show
    priority: str = "media"  # baja, media, alta, urgente

class ProspectUpdate(BaseModel):
    """Modelo para actualizar prospecto"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: Optional[ProspectStatus] = None
    priority: Optional[str] = None
    service_interest: Optional[str] = None
    estimated_monthly_budget: Optional[float] = None
    pain_points: Optional[List[str]] = None
    decision_maker_role: Optional[str] = None
    assigned_sales_executive: Optional[str] = None
    contract_value: Optional[float] = None
    tier_purchased: Optional[ServiceTier] = None
    billing_cycle: Optional[str] = None
    notes: Optional[str] = None

class Prospect(BaseModel):
    """Modelo completo de Prospect para software sales"""
    model_config = {"extra": "ignore"}
    
    # Campos base
    id: str = Field(default_factory=lambda: f"prospect-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    
    # Status y prioridad
    status: ProspectStatus = ProspectStatus.PROSPECTO
    priority: str = "media"
    source: str
    
    # Campos B2B
    company_name: str
    company_size: CompanySize = CompanySize.SMALL
    business_type: BusinessType = BusinessType.AGENCY
    current_crm: CurrentCRM = CurrentCRM.EXCEL
    decision_maker_role: Optional[str] = None
    
    # Calificación
    service_interest: Optional[str] = None
    estimated_monthly_budget: Optional[float] = None
    implementation_timeline: Optional[str] = None
    pain_points: List[str] = []
    
    # Scoring (calculado automáticamente)
    prospect_score: int = 50
    lead_fit_score: int = 50
    
    # Asignación
    assigned_sales_executive: Optional[str] = None
    assigned_marketing_specialist: Optional[str] = None
    created_by: Optional[str] = None
    
    # Metadata
    tenant_id: str = "default"  # ROVI owners usa tenant default
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    last_contact_at: Optional[datetime] = None
    
    # Contratación (cuando se convierte en cliente)
    contract_signed_at: Optional[datetime] = None
    contract_value: Optional[float] = None
    billing_cycle: Optional[str] = None
    tier_purchased: Optional[ServiceTier] = None
    
    # Referidos
    referral_source: Optional[str] = None
    referred_by: Optional[str] = None

# ============================================================================
# MODEL 2: SERVICE PLAN (Catálogo de planes)
# ============================================================================

class ServicePlanCreate(BaseModel):
    """Crear nuevo plan de servicio"""
    name: str  # "ROVI CRM Essential"
    tier: ServiceTier
    pricing_monthly_mxn: float
    pricing_annual_mxn: float
    currency: str = "MXN"
    annual_discount_percentage: float = 0.17
    features: List[str] = []
    max_brokers: Optional[int] = None
    description: str
    value_proposition: str

class ServicePlan(BaseModel):
    """Catálogo de planes de servicio de ROVI CRM"""
    model_config = {"extra": "ignore"}
    
    id: str = Field(default_factory=lambda: f"plan-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    name: str  # "ROVI CRM Essential"
    tier: ServiceTier
    
    # Pricing
    pricing_monthly_mxn: float
    pricing_annual_mxn: float
    currency: str = "MXN"
    annual_discount_percentage: float = 0.17
    
    # Target
    ideal_for: List[str] = []
    company_size_range: List[str] = []
    
    # Features y límites
    features: List[str] = []
    max_brokers: Optional[int] = None
    max_leads: Optional[int] = None
    max_campaigns: Optional[int] = None
    
    # Value prop
    description: str
    value_proposition: str
    
    # ROI y casos de éxito
    avg_increase_deals_percentage: float = 0.35
    time_saved_hours_per_week: float = 15
    roi_timeline_months: float = 3
    
    # Estado
    is_active: bool = True
    launch_date: Optional[datetime] = None
    sunset_date: Optional[datetime] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

# ============================================================================
# MODEL 3: TEAM MEMBER (Actualización de User)
# ============================================================================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: TeamRole = TeamRole.SALES_EXECUTIVE
    phone: Optional[str] = None
    department: Department = Department.SALES
    account_type: str = "individual"  # Mantener, pero usar solo "individual"

class User(BaseModel):
    """Usuario extendido con campos de team member"""
    model_config = {"extra": "ignore"}
    id: str
    email: EmailStr
    name: str
    role: TeamRole = TeamRole.SALES_EXECUTIVE
    department: Department = Department.SALES
    phone: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    tenant_id: str = "default"
    account_type: str = "individual"
    onboarding_completed: bool = False
    
    # Campos nuevos para team management
    avatar_url: Optional[str] = None
    kpi_targets: Optional[dict] = None
    permissions: List[str] = []
    total_points: int = 0
    current_month_rank: Optional[int] = None
    badges: List[str] = []
    base_salary: Optional[float] = None
    commission_per_sale: Optional[float] = None
    bonus_for_quota_exceeded: Optional[float] = None

# ============================================================================
# MODEL 4: GAMIFICATION RULE v2 (Cross-level)
# ============================================================================

class GamificationRuleCreate(BaseModel):
    """Crear nueva regla de gamificación"""
    name: str
    description: str
    activity_type: str  # discovery_call, demo_completed, lead_calificado, etc.
    category: ActivityCategory = ActivityCategory.SALES
    points: int
    eligible_departments: List[Department] = []
    icon: str = "star"
    bonus_points: int = 0
    bonus_condition: Optional[str] = None

class GamificationRule(BaseModel):
    """Regla de gamificación cross-level"""
    model_config = {"extra": "ignore"}
    id: str = Field(default_factory=lambda: f"rule-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    name: str
    description: str
    activity_type: str
    category: ActivityCategory = ActivityCategory.SALES
    points: int
    eligible_departments: List[Department] = []
    icon: str = "star"
    is_active: bool = True
    tenant_id: str = "default"
    created_at: datetime = Field(default_factory=datetime.now)

# ============================================================================
# MODEL 5: CAMPAIGN (Para Marketing)
# ============================================================================

class CampaignType(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    VAPI_CALL = "vapi_call"

class CampaignCreate(BaseModel):
    """Crear nueva campaña de marketing"""
    name: str
    campaign_type: CampaignType
    description: Optional[str] = None
    target_audience: List[str] = []  # IDs de prospects o segmentos
    scheduled_date: Optional[datetime] = None
    status: str = "draft"  # draft, scheduled, running, paused, completed

class Campaign(BaseModel):
    """Campaña de marketing"""
    model_config = {"extra": "ignore"}
    id: str = Field(default_factory=lambda: f"campaign-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    name: str
    campaign_type: CampaignType
    description: Optional[str] = None
    target_audience_size: int = 0
    scheduled_date: Optional[datetime] = None
    status: str = "draft"
    
    # Results tracking
    sent_count: int = 0
    delivered_count: int = 0
    opened_count: int = 0
    clicked_count: int = 0
    converted_count: int = 0
    
    created_by: str
    tenant_id: str = "default"
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

# ============================================================================
# MODEL 6: AUTOMATION (Automatizaciones)
# ============================================================================

class AutomationTrigger(str, Enum):
    PROSPECT_CREATED = "prospect_created"
    DEMO_COMPLETED = "demo_completed"
    PROPOSAL_SENT = "proposal_sent"
    PROSPECT_NO_ACTIVITY = "prospect_no_activity"

class AutomationCreate(BaseModel):
    """Crear nueva automatización"""
    name: str
    description: str
    trigger: AutomationTrigger
    trigger_condition: Optional[str] = None  # Ej: "no activity for 30 days"
    actions: List[dict] = []  # Ej: [{"type": "email", "template_id": "xxx"}]
    is_active: bool = True

class Automation(BaseModel):
    """Automatización de workflow"""
    model_config = {"extra": "ignore"}
    id: str = Field(default_factory=lambda: f"automation-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    name: str
    description: str
    trigger: AutomationTrigger
    trigger_condition: Optional[str] = None
    actions: List[dict] = []
    is_active: bool = True
    run_count: int = 0
    last_run: Optional[datetime] = None
    created_by: str
    tenant_id: str = "default"
    created_at: datetime = Field(default_factory=datetime.now)

# ============================================================================
# MODEL 7: EMAIL TEMPLATE
# ============================================================================

class EmailTemplateCreate(BaseModel):
    """Crear nueva plantilla de email"""
    name: str
    subject: str
    body: str  # HTML content con variables {{nombre}}, {{empresa}}, etc.
    variables: List[str] = []  # Lista de variables usadas

class EmailTemplate(BaseModel):
    """Plantilla de email personalizable"""
    model_config = {"extra": "ignore"}
    id: str = Field(default_factory=lambda: f"template-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    name: str
    subject: str
    body: str
    html_content: str
    variables: List[str] = []
    created_by: str
    tenant_id: str = "default"
    created_at: datetime = Field(default_factory=datetime.now)

# ============================================================================
# MODEL 8: IMPORT LEAD BATCH
# ============================================================================

class ImportJobCreate(BaseModel):
    """Crear nuevo trabajo de importación"""
    file_name: str
    total_records: int
    column_mapping: dict = {}  # {"Columna A": "name", "Columna B": "email"}
    assigned_to: Optional[str] = None

class ImportJob(BaseModel):
    """Trabajo de importación de leads"""
    model_config = {"extra": "ignore"}
    id: str = Field(default_factory=lambda: f"import-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    file_name: str
    total_records: int = 0
    successful_imports: int = 0
    duplicate_count: int = 0
    error_count: int = 0
    status: str = "processing"  # processing, completed, failed
    column_mapping: dict = {}
    created_by: str
    tenant_id: str = "default"
    created_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
```

---

## 4. ENDPOINTS API COMPLETOS {#endpoints}

### AGREGAR ESTE CÓDIGO EN `backend/server.py`:

```python
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime
from models import (
    ProspectCreate, ProspectUpdate, Prospect,
    ServicePlanCreate, ServicePlan,
    UserCreate, User,
    GamificationRuleCreate, GamificationRule,
    CampaignCreate, Campaign,
    AutomationCreate, Automation,
    EmailTemplateCreate, EmailTemplate,
    ImportJobCreate, ImportJob
)
from auth import get_current_user
from scoring_algorithms import calculate_software_prospect_score
from gamification_engine import award_points

api_router = APIRouter(prefix="/api")

# ============================================================================
# ENDPOINTS 1-5: PROSPECTS (CRUD + Scoring)
# ============================================================================

@api_router.post("/prospects", response_model=dict)
async def create_prospect(
    prospect_data: ProspectCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Crear nuevo prospecto B2B
    
    Sales: Puede crear prospectos manualmente
    Marketing: Los prospectos creados se asignan automáticamente a Sales
    """
    
    # Validar que company_name no exista (lead duplicado)
    existing = await db.prospects.find_one({
        "company_name": prospect_data.company_name,
        "tenant_id": current_user["tenant_id"]
    })
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"Empresa {prospect_data.company_name} ya existe como prospecto"
        )
    
    # Crear prospecto
    prospect_id = f"prospect-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    tenant_id = current_user["tenant_id"]
    
    # Calcular prospect score automáticamente
    prospect_score = calculate_software_prospect_score(prospect_data.dict())
    
    # Asignar a sales executive (round-robin o manual)
    if current_user["department"] == "sales":
        assigned_sales = current_user["id"]
    else:
        assigned_sales = await round_robin_assign_sales_executive(db)
    
    prospect_doc = {
        "id": prospect_id,
        **prospect_data.dict(),
        "prospect_score": prospect_score,
        "lead_fit_score": prospect_score,  # Inicialmente igual
        "status": ProspectStatus.PROSPECTO,
        "assigned_sales_executive": assigned_sales,
        "assigned_marketing_specialist": current_user["id"] if current_user["department"] == "marketing" else None,
        "tenant_id": tenant_id,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    await db.prospects.insert_one(prospect_doc)
    
    # Si viene de Marketing, dar puntos al marketer
    if current_user["department"] == "marketing":
        await award_points(
            db, 
            current_user["id"], 
            "lead_created",
            prospect_id,
            points=25
        )
    
    return {
        "prospect_id": prospect_id, 
        "prospect_score": prospect_score,
        "assigned_to": assigned_sales
    }


@api_router.get("/prospects", response_model=List[dict])
async def get_prospects(
    status: Optional[ProspectStatus] = None,
    priority: Optional[str] = None,
    company_size: Optional[CompanySize] = None,
    assigned_sales: Optional[str] = None,
    prospect_score_min: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Listar prospects con filtros avanzados
    
    Sales: Ve solo SUS prospectos
    Admin: Ve TODOS los prospectos
    Marketing: Ve solo prospectos que creó
    """
    
    tenant_id = current_user["tenant_id"]
    
    # Build query
    query = {"tenant_id": tenant_id}
    
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if company_size:
        query["company_size"] = company_size
    if prospect_score_min:
        query["prospect_score"] = {"$gte": prospect_score_min}
    
    # Sales solo ve sus prospects, Admin ve todos
    if current_user["role"] not in ["ceo", "coo", "head_of_sales", "admin"]:
        if current_user["department"] == "sales":
            query["assigned_sales_executive"] = current_user["id"]
        elif current_user["department"] == "marketing":
            query["assigned_marketing_specialist"] = current_user["id"]
    
    cursor = db.prospects.find(query).sort("created_at", -1)
    prospects = await cursor.to_list(length=100)
    
    return [serialize_doc(p) for p in prospects]


@api_router.put("/prospects/{prospect_id}", response_model=dict)
async def update_prospect(
    prospect_id: str,
    prospect_update: ProspectUpdate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Actualizar prospecto
    
    Sales: Puede actualizar sus prospectos
    Admin: Puede actualizar cualquier prospecto
    """
    
    tenant_id = current_user["tenant_id"]
    
    # Verificar que prospecto existe
    prospect = await db.prospects.find_one({
        "id": prospect_id,
        "tenant_id": tenant_id
    })
    
    if not prospect:
        raise HTTPException(status_code=404, detail="Prospecto no encontrado")
    
    # Update solo campos permitidos
    update_data = {k: v for k, v in prospect_update.dict(exclude_unset=True).items() if v is not None}
    
    # Si el status cambia a "contrato_cerrado", procesar conversión
    if prospect_update.status == ProspectStatus.CONTRATO_CERRADO:
        update_data["contract_signed_at"] = datetime.now()
        
        # Otorgar puntos de gamificación al sales executive
        await award_points(
            db, 
            prospect.get("assigned_sales_executive"),
            "contrato_cerrado",
            prospect_id,
            points=1000,
            value_multiplier=prospect_update.contract_value or 0
        )
        
        # Trigger onboarding
        await init_customer_onboarding(db, prospect_id, update_data)
    
    update_data["updated_at"] = datetime.now()
    
    await db.prospects.update_one(
        {"id": prospect_id, "tenant_id": tenant_id},
        {"$set": update_data}
    )
    
    return {"prospect_id": prospect_id, "updated": True}


@api_router.post("/prospects/{prospect_id}/score", response_model=dict)
async def calculate_prospect_score(
    prospect_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Recalcular score de prospecto manualmente
    
    Útil cuando un prospecto ha cambiado significativamente
    """
    
    tenant_id = current_user["tenant_id"]
    
    prospect = await db.prospects.find_one({
        "id": prospect_id,
        "tenant_id": tenant_id
    })
    
    if not prospect:
        raise HTTPException(status_code=404, detail="Prospecto no encontrado")
    
    # Recalcular score
    new_score = calculate_software_prospect_score(prospect)
    
    # Actualizar en BD
    await db.prospects.update_one(
        {"id": prospect_id, "tenant_id": tenant_id},
        {"$set": {
            "prospect_score": new_score,
            "updated_at": datetime.now()
        }}
    )
    
    return {"prospect_id": prospect_id, "old_score": prospect["prospect_score"], "new_score": new_score}


@api_router.delete("/prospects/{prospect_id}", response_model=dict)
async def delete_prospect(
    prospect_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Eliminar prospecto (solo Admin)
    """
    
    if current_user["role"] not in ["admin", "ceo", "coo"]:
        raise HTTPException(status_code=403, detail="Solo Admin puede eliminar prospectos")
    
    tenant_id = current_user["tenant_id"]
    
    result = await db.prospects.delete_one({
        "id": prospect_id,
        "tenant_id": tenant_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Prospecto no encontrado")
    
    return {"prospect_id": prospect_id, "deleted": True}

# ============================================================================
# ENDPOINTS 6-8: SERVICE PLANS
# ============================================================================

@api_router.get("/service-plans", response_model=List[dict])
async def get_service_plans(
    tier: Optional[ServiceTier] = None,
    active_only: bool = True,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Listar planes de servicio
    
    Todos los niveles pueden ver planes (necesitan saber qué ofrecer)
    Solo Admin puede crear/editar planes
    """
    
    query = {}
    if tier:
        query["tier"] = tier
    if active_only:
        query["is_active"] = True
    
    cursor = db.service_plans.find(query).sort("pricing_monthly_mxn", 1)
    plans = await cursor.to_list(length=20)
    
    return [serialize_doc(p) for p in plans]


@api_router.post("/service-plans", response_model=dict)
async def create_service_plan(
    plan_data: ServicePlanCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Crear nuevo plan de servicio (Solo Admin)
    """
    
    if current_user["role"] not in ["admin", "ceo", "coo"]:
        raise HTTPException(status_code=403, detail="Solo Admin puede crear planes")
    
    plan_id = f"plan-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    
    plan_doc = {
        "id": plan_id,
        **plan_data.dict(),
        "is_active": True,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    await db.service_plans.insert_one(plan_doc)
    
    return {"service_plan_id": plan_id, "created": True}

# ============================================================================
# ENDPOINTS 9-11: GAMIFICATION
# ============================================================================

@api_router.get("/gamification/rules", response_model=List[dict])
async def get_gamification_rules(
    category: Optional[ActivityCategory] = None,
    active_only: bool = True,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Listar reglas de gamificación"""
    
    query = {}
    if category:
        query["category"] = category
    if active_only:
        query["is_active"] = True
    
    cursor = db.gamification_rules_v2.find(query).sort("points", -1)
    rules = await cursor.to_list(length=50)
    
    return [serialize_doc(r) for r in rules]


@api_router.post("/gamification/rules", response_model=dict)
async def create_gamification_rule(
    rule_data: GamificationRuleCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Crear nueva regla de gamificación (Solo Admin)"""
    
    if current_user["role"] not in ["admin", "ceo", "coo"]:
        raise HTTPException(status_code=403, detail="Solo Admin puede crear reglas")
    
    rule_id = f"rule-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    
    rule_doc = {
        "id": rule_id,
        **rule_data.dict(),
        "is_active": True,
        "tenant_id": current_user["tenant_id"],
        "created_at": datetime.now()
    }
    
    await db.gamification_rules_v2.insert_one(rule_doc)
    
    return {"gamification_rule_id": rule_id, "created": True}


@api_router.get("/gamification/leaderboard", response_model=dict)
async def get_leaderboard(
    department: Optional[Department] = None,
    period: str = "month",  # week, month, quarter, year
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Obtener ranking de gamificación (Hall of Fame)
    
    Cross-level: Muestra ranking de Sales y Marketing juntos
    """
    
    # Calcular fecha de inicio según periodo
    now = datetime.now()
    if period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now.replace(day=1)
    elif period == "quarter":
        quarter = (now.month - 1) // 3 + 1
        start_date = now.replace(month=(quarter - 1) * 3 + 1, day=1)
    elif period == "year":
        start_date = now.replace(month=1, day=1)
    else:
        start_date = now.replace(day=1)
    
    # Agregación pipeline
    pipeline = [
        {"$match": {"created_at": {"$gte": start_date}}},
        {"$group": {
            "_id": "$broker_id",
            "total_points": {"$sum": "$points"},
            "activities": {"$sum": 1}
        }},
        {"$sort": {"total_points": -1}},
        {"$limit": 10}
    ]
    
    results = await db.point_ledger.aggregate(pipeline).to_list(None)
    
    # Enriquecer con info de usuarios
    leaderboard = []
    for result in results:
        user = await db.users.find_one({"id": result["_id"]})
        if user:
            leaderboard.append({
                "user_id": result["_id"],
                "name": user["name"],
                "department": user.get("department", "sales"),
                "role": user.get("role", "sales_executive"),
                "total_points": result["total_points"],
                "activities_completed": result["activities"]
            })
    
    return {"period": period, "leaderboard": leaderboard}

# ============================================================================
# ENDPOINTS 12-14: CAMPAIGNS (Marketing)
# ============================================================================

@api_router.post("/campaigns", response_model=dict)
async def create_campaign(
    campaign_data: CampaignCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Crear nueva campaña de marketing
    
    Marketing: Puede crear campañas
    Admin: Puede ver todas las campañas
    """
    
    if current_user["department"] != "marketing" and current_user["role"] not in ["admin", "ceo", "coo"]:
        raise HTTPException(status_code=403, detail="Solo Marketing puede crear campañas")
    
    campaign_id = f"campaign-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    
    campaign_doc = {
        "id": campaign_id,
        **campaign_data.dict(),
        "created_by": current_user["id"],
        "tenant_id": current_user["tenant_id"],
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    await db.campaigns.insert_one(campaign_doc)
    
    # Dar puntos a marketing por lanzar campaña
    await award_points(
        db, 
        current_user["id"],
        "campaign_created",
        campaign_id,
        points=75
    )
    
    return {"campaign_id": campaign_id, "created": True}


@api_router.get("/campaigns", response_model=List[dict])
async def get_campaigns(
    status: Optional[str] = None,
    campaign_type: Optional[CampaignType] = None,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Listar campañas"""
    
    query = {"tenant_id": current_user["tenant_id"]}
    
    if status:
        query["status"] = status
    if campaign_type:
        query["campaign_type"] = campaign_type
    
    # Marketing ve solo sus campañas, Admin ve todas
    if current_user["department"] == "marketing":
        query["created_by"] = current_user["id"]
    
    cursor = db.campaigns.find(query).sort("created_at", -1)
    campaigns = await cursor.to_list(length=50)
    
    return [serialize_doc(c) for c in campaigns]


@api_router.post("/campaigns/{campaign_id}/send", response_model=dict)
async def send_campaign(
    campaign_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Ejecutar campaña inmediatamente
    
    Email: Envía correos a través de SendGrid
    SMS: Envía mensajes a través de Twilio
    VAPI: Inicia llamadas automatizadas
    """
    
    campaign = await db.campaigns.find_one({
        "id": campaign_id,
        "tenant_id": current_user["tenant_id"]
    })
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    
    # Actualizar status
    await db.campaigns.update_one(
        {"id": campaign_id},
        {"$set": {"status": "running", "updated_at": datetime.now()}}
    )
    
    # Ejecutar según tipo
    if campaign["campaign_type"] == CampaignType.EMAIL:
        # Lógica para enviar emails
        await send_email_campaign(campaign, db)
    elif campaign["campaign_type"] == CampaignType.SMS:
        # Lógica para enviar SMS
        await send_sms_campaign(campaign, db)
    elif campaign["campaign_type"] == CampaignType.VAPI_CALL:
        # Lógica para iniciar llamadas VAPI
        await start_vapi_campaign(campaign, db)
    
    return {"campaign_id": campaign_id, "status": "sent"}

# ============================================================================
# ENDPOINTS 15-17: IMPORT LEADS
# ============================================================================

@api_router.post("/import/leads", response_model=dict)
async def import_leads(
    file_data: dict,  # {"file_name": "leads.csv", "column_mapping": {...}}
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Importar leads desde CSV/Excel
    
    Sales: Puede importar leads para su pipeline
    Marketing: Puede importar leads para campañas
    """
    
    import_id = f"import-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    
    import_job = ImportJobCreate(
        file_name=file_data["file_name"],
        total_records=file_data.get("total_records", 0),
        column_mapping=file_data.get("column_mapping", {}),
        assigned_to=file_data.get("assigned_to")
    )
    
    # Crear job de importación
    import_doc = {
        "id": import_id,
        **import_job.dict(),
        "status": "processing",
        "created_by": current_user["id"],
        "tenant_id": current_user["tenant_id"],
        "created_at": datetime.now()
    }
    
    await db.import_jobs.insert_one(import_doc)
    
    # Procesar importación en background
    # (Usar Celery o similar para tareas async)
    
    return {
        "import_id": import_id,
        "status": "processing",
        "message": "La importación se está procesando. Usar el endpoint /import/{import_id}/status para verificar progreso."
    }


@api_router.get("/import/{import_id}/status", response_model=dict)
async def get_import_status(
    import_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Verificar estado de importación"""
    
    import_job = await db.import_jobs.find_one({
        "id": import_id,
        "tenant_id": current_user["tenant_id"]
    })
    
    if not import_job:
        raise HTTPException(status_code=404, detail="Importación no encontrada")
    
    return {
        "import_id": import_id,
        "status": import_job["status"],
        "total_records": import_job["total_records"],
        "successful_imports": import_job.get("successful_imports", 0),
        "duplicate_count": import_job.get("duplicate_count", 0),
        "error_count": import_job.get("error_count", 0),
        "created_at": import_job["created_at"],
        "completed_at": import_job.get("completed_at")
    }

# ============================================================================
# ENDPOINTS 18-20: AUTOMATIZATIONS
# ============================================================================

@api_router.post("/automations", response_model=dict)
async def create_automation(
    automation_data: AutomationCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Crear nueva automatización
    
    Sales: Crear automatizaciones de follow-up
    Marketing: Crear automatizaciones de nutrición
    """
    
    automation_id = f"automation-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    
    automation_doc = {
        "id": automation_id,
        **automation_data.dict(),
        "created_by": current_user["id"],
        "tenant_id": current_user["tenant_id"],
        "created_at": datetime.now()
    }
    
    await db.automations.insert_one(automation_doc)
    
    return {"automation_id": automation_id, "created": True}


@api_router.get("/automations", response_model=List[dict])
async def get_automations(
    is_active: bool = True,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Listar automatizaciones"""
    
    query = {
        "tenant_id": current_user["tenant_id"],
        "is_active": is_active
    }
    
    # Sales ve solo sus automatizaciones, Admin ve todas
    if current_user["department"] == "sales":
        query["created_by"] = current_user["id"]
    
    cursor = db.automations.find(query).sort("created_at", -1)
    automations = await cursor.to_list(length=50)
    
    return [serialize_doc(a) for a in automations]


@api_router.post("/automations/{automation_id}/run", response_model=dict)
async def run_automation(
    automation_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Ejecutar automatización manualmente
    """
    
    automation = await db.automations.find_one({
        "id": automation_id,
        "tenant_id": current_user["tenant_id"]
    })
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automatización no encontrada")
    
    # Ejecutar acciones de la automatización
    # (Lógica en automation_engine.py)
    
    await db.automations.update_one(
        {"id": automation_id},
        {"$inc": {"run_count": 1}, "$set": {"last_run": datetime.now()}}
    )
    
    return {"automation_id": automation_id, "status": "executed"}

# ============================================================================
# ENDPOINTS 21-23: AI CHAT
# ============================================================================

@api_router.post("/ai-chat/generate", response_model=dict)
async def generate_ai_content(
    request_data: dict,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Generar contenido con IA
    
    Sales: Generar emails, respuestas a objeciones, scripts
    Marketing: Generar posts, copies, campañas
    """
    
    prompt = request_data.get("prompt")
    content_type = request_data.get("content_type")  # email, objection, post, script
    
    # Llamar a OpenAI
    from ai_service import generate_content
    
    generated_content = await generate_content(
        prompt=prompt,
        content_type=content_type,
        user_context=current_user
    )
    
    return {
        "generated_content": generated_content,
        "content_type": content_type
    }


@api_router.post("/ai-chat/improve", response_model=dict)
async def improve_ai_content(
    request_data: dict,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Mejorar contenido existente con IA
    """
    
    content = request_data.get("content")
    improvement_type = request_data.get("improvement_type")  # clarity, tone, length
    
    from ai_service import improve_content
    
    improved_content = await improve_content(
        content=content,
        improvement_type=improvement_type,
        user_context=current_user
    )
    
    return {
        "original_content": content,
        "improved_content": improved_content,
        "improvement_type": improvement_type
    }

# ============================================================================
# ENDPOINTS 24-26: ANALYTICS
# ============================================================================

@api_router.get("/analytics/dashboard", response_model=dict)
async def get_analytics_dashboard(
    period: str = "month",  # week, month, quarter, year
    level: str = "personal",  # personal, department, global
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Obtener métricas de dashboard
    
    Nivel Admin: Métricas globales (Marketing + Sales)
    Nivel Sales: Métricas personales
    Nivel Marketing: Métricas de marketing
    """
    
    # Calcular fecha de inicio según periodo
    now = datetime.now()
    if period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now.replace(day=1)
    elif period == "quarter":
        quarter = (now.month - 1) // 3 + 1
        start_date = now.replace(month=(quarter - 1) * 3 + 1, day=1)
    else:
        start_date = now.replace(day=1)
    
    # Recopilar métricas según nivel
    if current_user["role"] in ["admin", "ceo", "coo"]:
        # Admin: Métricas globales
        metrics = await get_global_analytics(db, start_date, now)
    elif current_user["department"] == "sales":
        # Sales: Métricas personales
        metrics = await get_sales_analytics(db, start_date, now, current_user["id"])
    elif current_user["department"] == "marketing":
        # Marketing: Métricas de marketing
        metrics = await get_marketing_analytics(db, start_date, now, current_user["id"])
    
    return {
        "period": period,
        "start_date": start_date,
        "end_date": now,
        "metrics": metrics
    }


@api_router.get("/analytics/conversions", response_model=dict)
async def get_conversion_analytics(
    period: str = "month",
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Obtener tasas de conversión del pipeline
    """
    
    # Pipeline conversion funnel
    funnel = {
        "prospects": await count_prospects_by_status(db, ProspectStatus.PROSPECTO),
        "discovery_calls": await count_prospects_by_status(db, ProspectStatus.DISCOVERY_CALL),
        "demos_agendadas": await count_prospects_by_status(db, ProspectStatus.DEMO_AGENDADA),
        "demos_completadas": await count_prospects_by_status(db, ProspectStatus.DEMO_COMPLETADA),
        "propuestas_enviadas": await count_prospects_by_status(db, ProspectStatus.PROPUESTA_ENVIADA),
        "contratos_cerrados": await count_prospects_by_status(db, ProspectStatus.CONTRATO_CERRADO)
    }
    
    # Calcular tasas de conversión
    if funnel["prospects"] > 0:
        conversion_to_closed = (funnel["contratos_cerrados"] / funnel["prospects"]) * 100
    else:
        conversion_to_closed = 0
    
    return {
        "funnel": funnel,
        "overall_conversion_rate": f"{conversion_to_closed:.1f}%"
    }


@api_router.get("/analytics/roi", response_model=dict)
async def get_roi_analytics(
    period: str = "month",
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Obtener ROI por canal de marketing
    """
    
    # Agregación para calcular ROI
    pipeline = [
        {"$group": {
            "_id": "$source",
            "leads_generated": {"$sum": 1},
            "total_cost": {"$sum": "$cost_per_lead"},
            "deals_closed": {"$sum": "$contract_value"}
        }},
        {"$sort": {"deals_closed": -1}}
    ]
    
    results = await db.prospects.aggregate(pipeline).to_list(None)
    
    # Calcular ROI para cada fuente
    roi_by_source = []
    for result in results:
        if result["total_cost"] > 0:
            roi = ((result["deals_closed"] - result["total_cost"]) / result["total_cost"]) * 100
        else:
            roi = 0
        
        roi_by_source.append({
            "source": result["_id"],
            "leads_generated": result["leads_generated"],
            "total_cost": result["total_cost"],
            "deals_closed": result["deals_closed"],
            "roi_percentage": f"{roi:.1f}x"
        })
    
    return {"period": period, "roi_by_source": roi_by_source}

# ============================================================================
# ENDPOINTS 27-30: TEAM MANAGEMENT
# ============================================================================

@api_router.get("/team", response_model=List[dict])
async def get_team_members(
    department: Optional[Department] = None,
    role: Optional[TeamRole] = None,
    is_active: bool = True,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Listar miembros del equipo con filtros
    
    Admin: Ve todo el equipo
    Sales/Marketing: Solo ve su departamento
    """
    
    query = {
        "tenant_id": current_user["tenant_id"],
        "is_active": is_active
    }
    
    if department:
        query["department"] = department
    if role:
        query["role"] = role
    
    # Sales y Marketing solo ven su propio departamento
    if current_user["department"] in ["sales", "marketing"]:
        query["department"] = current_user["department"]
    
    cursor = db.users.find(query).sort("name", 1)
    team = await cursor.to_list(length=50)
    
    return [serialize_doc(member) for member in team]


@api_router.post("/team", response_model=dict)
async def create_team_member(
    user_data: UserCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Crear nuevo miembro del equipo (Solo Admin/Management)
    """
    
    if current_user["role"] not in ["admin", "ceo", "coo", "head_of_sales", "head_of_marketing"]:
        raise HTTPException(status_code=403, detail="Solo Management puede crear usuarios")
    
    # Verificar email único
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    user_id = f"user-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    tenant_id = current_user["tenant_id"]
    
    # Password hash
    from auth import get_password_hash
    password_hash = get_password_hash(user_data.password)
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "role": user_data.role,
        "department": user_data.department,
        "phone": user_data.phone,
        "password_hash": password_hash,
        "tenant_id": tenant_id,
        "created_at": datetime.now(),
        "onboarding_completed": False,
        "is_active": True,
        "total_points": 0
    }
    
    await db.users.insert_one(user_doc)
    
    # Crear registro en gamification
    await db.point_ledger.insert_one({
        "id": f"ledger-{datetime.now().strftime('%Y%m%d%H%M%S%f')}",
        "broker_id": user_id,
        "points": 0,
        "action": "user_created",
        "description": f"Usuario {user_data.name} creado",
        "tenant_id": tenant_id,
        "created_at": datetime.now()
    })
    
    return {"team_member_id": user_id, "created": True}


@api_router.put("/team/{user_id}/status", response_model=dict)
async def update_team_member_status(
    user_id: str,
    status_data: dict,  # {"status": "paused", "reasign_to": "user_id"}
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Actualizar estado de miembro del equipo (pausar, reactivar, desactivar)
    """
    
    if current_user["role"] not in ["admin", "ceo", "coo"]:
        raise HTTPException(status_code=403, detail="Solo Admin puede actualizar estados")
    
    # Implementar lógica de pausar/reactivar/desactivar
    # ...
    
    return {"user_id": user_id, "status": "updated"}

# ============================================================================
# ENDPOINTS 31-33: CALENDARIO
# ============================================================================

@api_router.get("/calendar/events", response_model=List[dict])
async def get_calendar_events(
    start_date: str,
    end_date: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Obtener eventos del calendario
    
    Sales: Ve solo sus eventos
    Admin: Ve todos los eventos
    """
    
    query = {
        "tenant_id": current_user["tenant_id"],
        "start_date": {"$gte": start_date},
        "end_date": {"$lte": end_date}
    }
    
    # Sales solo ve sus eventos, Admin ve todos
    if current_user["department"] == "sales":
        query["assigned_to"] = current_user["id"]
    
    cursor = db.calendar_events.find(query).sort("start_date", 1)
    events = await cursor.to_list(length=100)
    
    return [serialize_doc(e) for e in events]


@api_router.post("/calendar/events", response_model=dict)
async def create_calendar_event(
    event_data: dict,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Crear nuevo evento de calendario
    """
    
    event_id = f"event-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    
    event_doc = {
        "id": event_id,
        **event_data,
        "created_by": current_user["id"],
        "tenant_id": current_user["tenant_id"],
        "created_at": datetime.now()
    }
    
    await db.calendar_events.insert_one(event_doc)
    
    return {"event_id": event_id, "created": True}

# ============================================================================
# ENDPOINTS 34-36: SCRIPTS DE VENTA
# ============================================================================

@api_router.get("/scripts", response_model=List[dict])
async def get_sales_scripts(
    script_type: Optional[str] = None,  # discovery_call, demo, objection, closing
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Obtener scripts de venta
    
    Sales: Puede usar scripts
    Admin: Puede editar scripts
    """
    
    query = {"tenant_id": current_user["tenant_id"]}
    
    if script_type:
        query["script_type"] = script_type
    
    cursor = db.sales_scripts.find(query).sort("name", 1)
    scripts = await cursor.to_list(length=50)
    
    return [serialize_doc(s) for s in scripts]


@api_router.get("/scripts/{script_id}", response_model=dict)
async def get_sales_script(
    script_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Obtener script específico"""
    
    script = await db.sales_scripts.find_one({
        "id": script_id,
        "tenant_id": current_user["tenant_id"]
    })
    
    if not script:
        raise HTTPException(status_code=404, detail="Script no encontrado")
    
    return serialize_doc(script)

# ============================================================================
# ENDPOINTS 37-40: CONFIGURACIÓN E INTEGRACIONES
# ============================================================================

@api_router.get("/settings/integrations", response_model=dict)
async def get_integrations_status(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Obtener estado de todas las integraciones
    """
    
    integrations = {
        "stripe": await check_stripe_connection(),
        "vapi": await check_vapi_connection(),
        "twilio": await check_twilio_connection(),
        "sendgrid": await check_sendgrid_connection(),
        "google_calendar": await check_google_calendar_connection()
    }
    
    return {"integrations": integrations}


@api_router.post("/settings/integrations/stripe", response_model=dict)
async def configure_stripe(
    config: dict,  # {"api_key": "...", "webhook_secret": "..."}
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Configurar integración con Stripe (Solo Admin)
    """
    
    if current_user["role"] not in ["admin", "ceo", "coo"]:
        raise HTTPException(status_code=403, detail="Solo Admin puede configurar integraciones")
    
    # Guardar configuración en encriptado
    # ...
    
    return {"stripe": "configured", "status": "active"}


@api_router.post("/settings/integrations/vapi", response_model=dict)
async def configure_vapi(
    config: dict,  # {"api_key": "...", "phone_number": "..."}
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Configurar integración con VAPI (Solo Admin)"""
    
    if current_user["role"] not in ["admin", "ceo", "coo"]:
        raise HTTPException(status_code=403, detail="Solo Admin puede configurar integraciones")
    
    return {"vapi": "configured", "status": "active"}


# ============================================================================
# FUNCIONES AUXILIARES
# ============================================================================

def serialize_doc(doc):
    """Convierte ObjectId a string para serialización JSON"""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc
```

---

## 5. FRONTEND - COMPONENTES POR NIVEL {#frontend}

### ESTRUCTURA DE RUTAS EN `frontend/src/App.js`:

```javascript
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Nivel 1 - Admin
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import TeamPage from './pages/TeamPage';
import AnalyticsPage from './pages/AnalyticsPage';
import OnboardingPage from './pages/OnboardingPage';
import ChurnPredictionPage from './pages/ChurnPredictionPage';
import ReferralsPage from './pages/ReferralsPage';
import SettingsPage from './pages/SettingsPage';

// Nivel 2 - Sales
import SalesDashboard from './pages/Dashboard/SalesDashboard';
import ProspectsPage from './pages/ProspectsPage';
import ServicePlansPage from './pages/ServicePlansPage';
import ScriptsPage from './pages/ScriptsPage';
import CalendarPage from './pages/CalendarPage';
import SalesAnalyticsPage from './pages/Analytics/SalesAnalyticsPage';
import ImportLeadsPage from './pages/ImportLeadsPage';
import AutomationsPage from './pages/AutomationsPage';
import AIChatPage from './pages/AIChatPage';

// Nivel 3 - Marketing
import MarketingDashboard from './pages/Dashboard/MarketingDashboard';
import CampaignsPage from './pages/CampaignsPage';
import EmailTemplatesPage from './pages/EmailTemplatesPage';
import MarketingAnalyticsPage from './pages/Analytics/MarketingAnalyticsPage';

// Públicas
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<LandingPage />} />
          
          {/* Rutas protegidas */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardWrapper />
            </ProtectedRoute>
          } />
          
          {/* Nivel 1 - Admin */}
          <Route path="/team" element={
            <ProtectedRoute requiredRole={["admin", "ceo", "coo"]}>
              <TeamPage />
            </ProtectedRoute>
          } />
          
          <Route path="/analytics" element={
            <ProtectedRoute requiredRole={["admin", "ceo", "coo"]}>
              <AnalyticsPage />
            </ProtectedRoute>
          } />
          
          {/* Nivel 2 - Sales */}
          <Route path="/prospects" element={
            <ProtectedRoute requiredDepartment={["sales"]}>
              <ProspectsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/import-leads" element={
            <ProtectedRoute requiredDepartment={["sales", "marketing"]}>
              <ImportLeadsPage />
            </ProtectedRoute>
          } />
          
          {/* Nivel 3 - Marketing */}
          <Route path="/campaigns" element={
            <ProtectedRoute requiredDepartment={["marketing"]}>
              <CampaignsPage />
            </ProtectedRoute>
          } />
          
          {/* Compartidos */}
          <Route path="/gamification" element={<GamificationPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/scripts" element={<ScriptsPage />} />
          <Route path="/automations" element={<AutomationsPage />} />
          <Route path="/ai-chat" element={<AIChatPage />} />
          
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Componente wrapper que muestra dashboard correcto según rol
function DashboardWrapper() {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  
  // Redirigir según rol
  if (user.role === "admin" || user.role === "ceo" || user.role === "coo") {
    return <AdminDashboard />;
  } else if (user.department === "sales") {
    return <SalesDashboard />;
  } else if (user.department === "marketing") {
    return <MarketingDashboard />;
  }
  
  return <AdminDashboard />; // Default
}
```

---

## 6. BASE DE DATOS Y MIGRACIÓN {#database}

### SCRIPT DE MIGRACIÓN COMPLETO

Crear archivo `backend/scripts/migrate_to_rovi_owners.py`:

```python
#!/usr/bin/env python3
"""
Script de migración: Real Estate → Software Sales
"""
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import uuid

load_dotenv()

async def migrate_leads_to_prospects():
    """Migrar leads existentes a prospects con campos B2B"""
    
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    print("🔄 Iniciando migración de leads → prospects...")
    
    # Crear índices
    await db.prospects.create_index([("company_name", 1)], unique=True)
    await db.prospects.create_index([("status", 1)])
    await db.prospects.create_index([("prospect_score", -1)])
    
    # Contar leads
    total_leads = await db.leads.count_documents({})
    print(f"📊 Total leads a migrar: {total_leads}")
    
    migrated_count = 0
    batch_size = 100
    skip = 0
    
    while True:
        leads = await db.leads.find().skip(skip).limit(batch_size).to_list(None)
        
        if not leads:
            break
        
        prospects_batch = []
        
        for lead in leads:
            # Mapear estados
            status_mapping = {
                "nuevo": "prospecto",
                "contactado": "discovery_call",
                "calificacion": "demo_agendada",
                "presentacion": "demo_completada",
                "apartado": "propuesta_enviada",
                "venta": "contrato_cerrado"
            }
            
            status = status_mapping.get(lead.get("status", "nuevo"), "prospecto")
            
            # Crear prospecto
            prospect = {
                "_id": lead["id"],
                "name": lead["name"],
                "email": lead.get("email"),
                "phone": lead.get("phone"),
                "status": status,
                "priority": lead.get("priority", "media"),
                "source": lead.get("source", "migration"),
                
                # Campos B2B (defaults para migración)
                "company_name": lead.get("name", "Lead Migration") + " Inmobiliaria",
                "company_size": "small",
                "business_type": "agency",
                "current_crm": "excel",
                "service_interest": "crm",
                "estimated_monthly_budget": 5000,
                "implementation_timeline": "1-3_months",
                "pain_points": [],
                
                # Scoring
                "prospect_score": 50,
                "lead_fit_score": 50,
                
                # Asignación
                "assigned_sales_executive": lead.get("assigned_broker_id"),
                "tenant_id": "default",
                
                # Metadata
                "created_at": lead.get("created_at", datetime.now()),
                "updated_at": datetime.now(),
                "migration_note": "Migrated from real estate lead model"
            }
            
            prospects_batch.append(prospect)
        
        # Insertar batch
        if prospects_batch:
            await db.prospects.insert_many(prospects_batch)
            migrated_count += len(prospects_batch)
            print(f"✅ Migrados {migrated_count}/{total_leads} prospects...")
        
        skip += batch_size
    
    print(f"\n🎉 Migración completada: {migrated_count} prospects")
    return migrated_count


async def create_default_service_plans():
    """Crear planes de servicio por defecto"""
    
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    print("\n🔄 Creando planes de servicio por defecto...")
    
    service_plans = [
        {
            "id": "plan-essential",
            "name": "ROVI CRM Essential",
            "tier": "essential",
            "pricing_monthly_mxn": 2999,
            "pricing_annual_mxn": 29990,
            "currency": "MXN",
            "annual_discount_percentage": 0.17,
            "features": [
                "Pipeline de leads ilimitado",
                "Gamificación básica",
                "Email campaigns",
                "Analytics estándar",
                "Soporte email"
            ],
            "max_brokers": 1,
            "ideal_for": ["brokers_individuales"],
            "company_size_range": ["solo"],
            "description": "Perfecto para brokers independientes",
            "value_proposition": "Ahorra 15+ horas/semana en gestión de leads",
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "id": "plan-standard",
            "name": "ROVI CRM Standard",
            "tier": "standard",
            "pricing_monthly_mxn": 7999,
            "pricing_annual_mxn": 79990,
            "currency": "MXN",
            "annual_discount_percentage": 0.17,
            "features": [
                "Todo de Essential +",
                "Gamificación avanzada",
                "Scripts IA personalizados",
                "Automatizaciones",
                "Integraciones (Vapi, Twilio)",
                "Soporte prioritario"
            ],
            "max_brokers": 10,
            "ideal_for": ["agencias_pequeñas"],
            "company_size_range": ["2-10"],
            "description": "Para agencias en crecimiento",
            "value_proposition": "Automatiza marketing y aumenta productividad",
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "id": "plan-professional",
            "name": "ROVI CRM Professional",
            "tier": "professional",
            "pricing_monthly_mxn": 14999,
            "pricing_annual_mxn": 149990,
            "currency": "MXN",
            "annual_discount_percentage": 0.17,
            "features": [
                "Todo de Standard +",
                "Analytics avanzado",
                "API access completo",
                "Customer Success Manager dedicado",
                "Training en sitio"
            ],
            "max_brokers": 50,
            "ideal_for": ["agencias_medianas"],
            "company_size_range": ["11-50"],
            "description": "Potencia al máximo tu operación",
            "value_proposition": "Plataforma completa para escalar",
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "id": "plan-enterprise",
            "name": "ROVI CRM Enterprise",
            "tier": "enterprise",
            "pricing_monthly_mxn": 50000,
            "pricing_annual_mxn": 500000,
            "currency": "MXN",
            "annual_discount_percentage": 0.17,
            "features": [
                "Todo de Professional +",
                "SLA garantizado",
                "Dedicated server",
                "Custom development",
                "Account Manager dedicado"
            ],
            "max_brokers": None,  # Ilimitado
            "ideal_for": ["desarrolladoras", "franquicias"],
            "company_size_range": ["50+"],
            "description": "Solución enterprise a medida",
            "value_proposition": "Transformación digital completa",
            "is_active": True,
            "created_at": datetime.now()
        }
    ]
    
    await db.service_plans.insert_many(service_plans)
    print(f"✅ {len(service_plans)} planes de servicio creados")


async def create_default_gamification_rules():
    """Crear reglas de gamificación cross-level"""
    
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    print("\n🔄 Creando reglas de gamificación cross-level...")
    
    gamification_rules = [
        # SALES RULES
        {
            "id": "rule-discovery-call",
            "name": "Discovery Call Completada",
            "description": "Por completar llamada de discovery con prospecto",
            "activity_type": "discovery_call",
            "category": "sales",
            "points": 50,
            "eligible_departments": ["sales"],
            "icon": "phone",
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "id": "rule-demo-agendada",
            "name": "Demo Agendada",
            "description": "Por lograr agendar demo con prospecto",
            "activity_type": "demo_agendada",
            "category": "sales",
            "points": 100,
            "eligible_departments": ["sales"],
            "icon": "calendar",
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "id": "rule-demo-completada",
            "name": "Demo Completada",
            "description": "Por completar demo con prospecto",
            "activity_type": "demo_completada",
            "category": "sales",
            "points": 150,
            "eligible_departments": ["sales"],
            "icon": "video",
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "id": "rule-propuesta-enviada",
            "name": "Propuesta Enviada",
            "description": "Por enviar propuesta de servicio a prospecto",
            "activity_type": "propuesta_enviada",
            "category": "sales",
            "points": 200,
            "eligible_departments": ["sales"],
            "icon": "file-text",
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "id": "rule-contrato-cerrado",
            "name": "Contrato Cerrado",
            "description": "Por cerrar venta de suscripción",
            "activity_type": "contrato_cerrado",
            "category": "sales",
            "points": 1000,
            "eligible_departments": ["sales"],
            "icon": "trophy",
            "bonus_points": 500,
            "bonus_condition": "contract_value >= 10000",
            "is_active": True,
            "created_at": datetime.now()
        },
        
        # MARKETING RULES
        {
            "id": "rule-lead-calificado",
            "name": "Lead Calificado",
            "description": "Por calificar lead que pasa a Sales",
            "activity_type": "lead_calificado",
            "category": "marketing",
            "points": 50,
            "eligible_departments": ["marketing"],
            "icon": "filter",
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "id": "rule-demo-request-inbound",
            "name": "Demo Request Inbound",
            "description": "Prospecto pidió demo espontáneamente",
            "activity_type": "demo_request_inbound",
            "category": "marketing",
            "points": 100,
            "eligible_departments": ["marketing"],
            "icon": "sparkles",
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "id": "rule-campaign-launched",
            "name": "Campaign Lanzada",
            "description": "Por lanzar campaña de marketing",
            "activity_type": "campaign_launched",
            "category": "marketing",
            "points": 75,
            "eligible_departments": ["marketing"],
            "icon": "radio",
            "max_per_day": 10,
            "is_active": True,
            "created_at": datetime.now()
        }
    ]
    
    await db.gamification_rules_v2.insert_many(gamification_rules)
    print(f"✅ {len(gamification_rules)} reglas de gamificación creadas")


async def main_migration():
    """Ejecutar migración completa"""
    
    try:
        print("=" * 60)
        print("ROVI OWNERS MIGRATION")
        print("=" * 60)
        print(f"Starting at: {datetime.now()}")
        print()
        
        # 1. Migrar leads → prospects
        await migrate_leads_to_prospects()
        
        # 2. Crear planes de servicio
        await create_default_service_plans()
        
        # 3. Crear gamification rules
        await create_default_gamification_rules()
        
        print("\n" + "=" * 60)
        print("🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE")
        print("=" * 60)
        print("\n✅ Leads migrados a prospects")
        print("✅ Planes de servicio creados")
        print("✅ Gamification cross-level configurada")
        print("\n📋 Próximos pasos:")
        print("   1. Iniciar backend: uvicorn server:app --reload")
        print("   2. Iniciar frontend: cd frontend && yarn start")
        print("   3. Verificar endpoints: curl http://localhost:8000/api/prospects")
        print("   4. Probar frontend: http://localhost:3000/prospects")
        
    except Exception as e:
        print(f"\n❌ Error en migración: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main_migration())
```

---

## 7. INTEGRACIONES EXTERNAS {#integraciones}

### INTEGRACIÓN CON STRIPE (Pagos)

Archivo: `backend/integration_stripe.py`

```python
import stripe
from fastapi import HTTPException

stripe.api_key = os.environ.get("STRIPE_API_KEY")

async def create_stripe_customer(prospect_data, plan_tier):
    """Crear customer en Stripe al cerrar contrato"""
    
    try:
        customer = stripe.Customer.create(
            email=prospect_data["email"],
            name=prospect_data["company_name"],
            metadata={
                "prospect_id": prospect_data["id"],
                "tenant_id": prospect_data["tenant_id"],
                "company_size": prospect_data["company_size"]
            }
        )
        return customer.id
    
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Error en Stripe: {str(e)}")


async def create_subscription(customer_id, plan_id):
    """Crear suscripción en Stripe"""
    
    # Plan IDs en Stripe (deben crearse previamente)
    plan_ids = {
        "essential": "price_essential",
        "standard": "price_standard",
        "professional": "price_professional",
        "enterprise": "price_enterprise"
    }
    
    try:
        subscription = stripe.Subscription.create(
            customer=customer_id,
            items=[{"price": plan_ids[plan_tier]}],
            payment_behavior="default_incomplete",
            expand=["latest_invoice"]
        )
        return subscription
    
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Error creando suscripción: {str(e)}")


async def handle_webhook_event(event_data):
    """Manejar webhooks de Stripe"""
    
    event_type = event_data["type"]
    
    if event_type == "invoice.paid":
        # Factura pagada → Activar servicio
        invoice = event_data["data"]["object"]
        await activate_subscription(invoice["subscription"])
    
    elif event_type == "customer.subscription.deleted":
        # Suscripción cancelada → Procesar churn
        subscription = event_data["data"]["object"]
        await process_churn(subscription)


async def activate_subscription(subscription_id):
    """Activar servicio cuando se paga"""
    # Lógica para activar features del cliente
    pass


async def process_churn(subscription):
    """Procesar cancelación de suscripción"""
    # Lógica para marcar cliente como churned
    pass
```

### INTEGRACIÓN CON VAPI.AI (Llamadas IA)

Archivo: `backend/integration_vapi.py`

```python
import requests
from typing import List

VAPI_API_KEY = os.environ.get("VAPI_API_KEY")
VAPI_PHONE_NUMBER_ID = os.environ.get("VAPI_PHONE_NUMBER_ID")

async def create_vapi_call(prospect_phone, script_text):
    """
    Crear llamada automatizada con VAPI
    """
    
    payload = {
        "phone_number_id": VAPI_PHONE_NUMBER_ID,
        "to": prospect_phone,
        "machine_detection": {"enabled": True, "provider": "twilio"},
        "vscp_request": {
            "project_id": os.environ.get("VAPI_PROJECT_ID"),
            "jjr_file_id": os.environ.get("VAPI_JJR_FILE_ID"),  # Script de IA
            "jjr_input_overrides": {
                "prospect_name": prospect_data.get("name"),
                "company_name": prospect_data.get("company_name")
            }
        }
    }
    
    response = requests.post(
        "https://api.vapi.ai/call",
        headers={"Authorization": f"Bearer {VAPI_API_KEY}"},
        json=payload
    )
    
    return response.json()


async def get_vapi_call_status(call_id):
    """Obtener estado de llamada VAPI"""
    
    response = requests.get(
        f"https://api.vapi.ai/call/{call_id}",
        headers={"Authorization": f"Bearer {VAPI_API_KEY}"}
    )
    
    return response.json()


async def transcribe_vapi_call(call_id):
    """Transcribir llamada completada"""
    
    response = requests.get(
        f"https://api.vapi.ai/call/{call_id}/transcript",
        headers={"Authorization": f"Bearer {VAPI_API_KEY}"}
    )
    
    return response.json()
```

### INTEGRACIÓN CON TWILIO (SMS)

Archivo: `backend/integration_twilio.py`

```python
from twilio.rest import Client

TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER")

twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

async def send_sms(phone_number: str, message: str):
    """Enviar SMS"""
    
    try:
        message = twilio_client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=phone_number
        )
        return {"sid": message.sid, "status": "sent"}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error enviando SMS: {str(e)}")


async def send_bulk_sms(phone_numbers: List[str], message: str):
    """Enviar SMS masivo"""
    
    results = []
    for phone in phone_numbers:
        result = await send_sms(phone, message)
        results.append(result)
    
    return {
        "total": len(phone_numbers),
        "sent": len([r for r in results if r["status"] == "sent"]),
        "failed": len([r for r in results if r["status"] != "sent"])
    }
```

### INTEGRACIÓN CON SENDGRID (Email Marketing)

Archivo: `backend/integration_sendgrid.py`

```python
import sendgrid
from sendgrid.helpers.mail import Mail, Attachment, Email

SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")
sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)

async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    from_email: str = "noreply@rovicrm.com"
):
    """Enviar email individual"""
    
    message = Mail(
        from_email=from_email,
        to_emails=to_email,
        subject=subject,
        html_content=html_content
    )
    
    try:
        response = sg.send(message)
        return {"status_code": response.status_code, "body": response.body}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error enviando email: {str(e)}")


async def send_bulk_email(recipients: List[str], subject: str, template_id: str, substitutions: dict):
    """Enviar email masivo usando SendGrid template"""
    
    from sendgrid.helpers.mail import Mail, Personalization
    
    personalizations = []
    for recipient in recipients:
        personalizations.append(
            Personalization(
                to=[recipient],
                substitutions=substitutions.get(recipient, {})
            )
        )
    
    message = Mail(
        from_email="noreply@rovicrm.com",
        to_emails=recipients,
        subject=subject,
        template_id=template_id,
        personalizations=personalizations
    )
    
    try:
        response = sg.send(message)
        return {
            "total": len(recipients),
            "delivered": response.headers.get("X-Message-Id"),
            "status": "sent"
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error enviando bulk email: {str(e)}")


async def get_email_stats(message_id: str):
    """Obtener estadísticas de email enviado"""
    
    response = sg.client.messages.messages.get(message_id)
    
    stats = response.body.get("stats", {})
    
    return {
        "opens": stats.get("opens", 0),
        "clicks": stats.get("clicks", 0),
        "delivered": stats.get("delivered", False),
        "spam_reports": stats.get("spam_reports", 0)
    }
```

---

## 8. PLAN DE IMPLEMENTACIÓN {#implementacion}

### SEMANA 1: FUNDACIÓN Y ARQUITECTURA

**Días 1-2: Setup**
- [ ] Crear repositorio `feature/rovi-owners-adaptation`
- [ ] Configurar Docker Compose para desarrollo
- [ ] Setup de variables de entorno

**Días 3-5: Modelos de Datos**
- [ ] Actualizar `backend/models.py` con nuevos enums y modelos
- [ ] Crear modelos: Prospect, ServicePlan, GamificationRule v2, Campaign, Automation, EmailTemplate
- [ ] Probar imports y sintaxis

**Deliverables:**
- Branch creado
- Modelos definidos en código
- Tests unitarios de modelos pasando

---

### SEMANA 2: ENDPOINTS CORE

**Días 1-3: Prospects Endpoints**
- [ ] POST /api/prospects (con scoring automático)
- [ ] GET /api/prospects (con filtros)
- [ ] PUT /api/prospects/{id}
- [ ] DELETE /api/prospects/{id}
- [ ] POST /api/prospects/{id}/score

**Días 4-5: Service Plans Endpoints**
- [ ] GET /api/service-plans
- [ ] POST /api/service-plans (solo Admin)

**Deliverables:**
- 8+ endpoints de prospects funcionales
- Service plans endpoints funcionales
- Tests de integración pasando

---

### SEMANA 3: GAMIFICACIÓN Y ANALYTICS

**Días 1-3: Gamification**
- [ ] GET /api/gamification/rules
- [ ] POST /api/gamification/rules (Admin)
- [ ] GET /api/gamification/leaderboard
- [ ] Implementar `gamification_engine.py` (award_points)

**Días 4-5: Analytics**
- [ ] GET /api/analytics/dashboard
- [ ] GET /api/analytics/conversions
- [ ] GET /api/analytics/roi

**Deliverables:**
- Gamification cross-level funcional
- Dashboard analytics por nivel
- Leaderboard cross-level visible

---

### SEMANA 4: CAMPAÑAS Y MARKETING

**Días 1-3: Campaigns**
- [ ] POST /api/campaigns
- [ ] GET /api/campaigns
- [ ] POST /api/campaigns/{id}/send

**Días 4-5: Email Templates**
- [ ] GET /api/email-templates
- [ ] POST /api/email-templates
- [ ] PUT /api/email-templates/{id}

**Deliverables:**
- Campañas funcionales (Email, SMS, VAPI)
- Templates personalizables con variables
- Estadísticas de campañas

---

### SEMANA 5: IMPORTACIÓN Y AUTOMATIZACIONES

**Días 1-3: Import Leads**
- [ ] POST /api/import/leads
- [ ] GET /api/import/{id}/status
- [ ] Script de migración de datos

**Días 4-5: Automatizaciones**
- [ ] POST /api/automations
- [ ] GET /api/automations
- [ ] POST /api/automations/{id}/run

**Deliverables:**
- Importación de CSV/Excel funcional
- Automatizaciones de follow-up activas
- Detectores de duplicados funcionando

---

### SEMANA 6: AI CHAT Y SCRIPTS

**Días 1-3: AI Chat**
- [ ] POST /api/ai-chat/generate
- [ ] POST /api/ai-chat/improve
- [ ] Integración con OpenAI API

**Días 4-5: Sales Scripts**
- [ ] GET /api/scripts
- [ ] GET /api/scripts/{id}
- [ ] Base de datos de scripts iniciales

**Deliverables:**
- Chat IA funcional para generar contenido
- Scripts de venta para todas las etapas
- Mejora de contenido con IA

---

### SEMANA 7: FRONTEND - DASHBOARDS

**Días 1-2: Admin Dashboard**
- [ ] Crear `AdminDashboard.js`
- [ ] Vista global de métricas
- [ ] Gráficos de conversión y ROI

**Días 3-4: Sales Dashboard**
- [ ] Crear `SalesDashboard.js`
- [ ] Métricas personales
- [ ] Progreso hacia metas

**Días 5: Marketing Dashboard**
- [ ] Crear `MarketingDashboard.js`
- [ ] Métricas de campañas
- [ ] Costo por lead

**Deliverables:**
- 3 dashboards especializados funcionales
- Gráficos interactivos
- Actualización en tiempo real

---

### SEMANA 8: FRONTEND - MÓDULOS ESPECIALES

**Días 1-2: ProspectsPage**
- [ ] Crear `ProspectsPage.js`
- [ ] Pipeline Kanban con arrastrar y soltar
- [ ] Filtros avanzados
- [ ] Tarjetas de prospecto con score

**Días 3-4: Campaigns y Automatizaciones**
- [ ] Crear `CampaignsPage.js`
- [ ] Crear `AutomationsPage.js`
- [ ] Crear `ImportLeadsPage.js`

**Días 5: AIChat y Scripts**
- [ ] Crear `AIChatPage.js`
- [ ] Crear `ScriptsPage.js`
- [ ] Chat interactivo con IA

**Deliverables:**
- 5 módulos de frontend completos
- Interfaz intuitiva sin tecnicismos
- Responsive design (móvil y desktop)

---

### SEMANA 9-10: TESTING Y VALIDACIÓN

**Días 1-3: Testing Unitario**
- [ ] Tests de todos los endpoints
- [ ] Tests de gamification engine
- [ ] Tests de scoring algorithms
- [ ] >80% cobertura de código

**Días 4-5: Testing Integración**
- [ ] Flujo completo: Marketing → Sales → Cierre
- [ ] Validar gamificación cross-level
- [ ] Testear integraciones (Stripe, Vapi, Twilio)

**Días 6-7: Bug Fixes y Polish**
- [ ] Fix bugs encontrados en testing
- [ ] Optimizar performance
- [ ] UI/UX improvements

**Días 8-10: Documentación y Handoff**
- [ ] Crear documentación de usuario por nivel
- [ ] Grabar demos de cada módulo
- [ ] Training session con equipo
- [ ] Deploy a staging para validación final

**Deliverables:**
- Sistema estable en staging
- Documentación completa
- Equipo entrenado
- Ready para producción

---

## 🎯 CRITERIOS DE ÉXITO DEL PROYECTO

### Técnicos:
- ✅ Todos los 15 módulos implementados
- ✅ <5 bugs críticos en producción
- ✅ Performance: <200ms response time
- ✅ Frontend y backend se comunican sin errores

### Funcionales:
- ✅ Pipeline de prospects funciona para software sales
- ✅ Scoring algorithms calculan correctamente
- ✅ Gamificación cross-level otorga puntos justos
- ✅ Cross-level visibility (Marketing ve impacto en Sales)

### De Negocio:
- ✅ Equipo interno usando el sistema diariamente
- ✅ +20% en productividad de Sales
- ✅ +15% en qualification rate de Marketing
- ✅ Primer cliente externo cerrado usando el sistema

---

## 📞 SOPORTE Y MANTENIMIENTO

### Para Desarrolladores:

**Documentación técnica:**
- `backend/models.py` - Todos los modelos con comentarios
- `backend/server.py` - Todos los endpoints con ejemplos
- `ROVI_OWNERS/` - Documentación de requisitos y arquitectura

**Comandos útiles:**
```bash
# Ver logs de backend
tail -f backend/uvicorn.log

# Reiniciar servicios
docker-compose restart backend

# Verificar MongoDB
mongosh
use rovi_owners_dev
db.prospects.count()

# Tests
pytest backend/tests/ -v
```

### Para Usuarios (Marketing y Ventas):

**Soporte:**
- Documentación de usuario: `ROVI_OWNERS/GUIA_PARA_MERCADOLOGA.pdf`
- Videos de demostración de cada módulo
- Sesión de training onboard de 2 horas

**Tips diarios:**
- Admin: Revisar Analytics Dashboard cada mañana
- Sales: Actualizar pipeline al final del día
- Marketing: Ver resultados de campañas cada viernes

---

## 🎉 LISTO PARA COMENZAR

**Requisitos previos:**
- [ ] Python 3.11+ instalado
- [ ] Node.js 18+ instalado
- [ ] MongoDB 7+ corriendo
- [ ] Docker y Docker Compose instalados
- [ ] Cuenta de OpenAI (para Chat IA)

**Comenzar:**
1. Clonar este repositorio
2. Crear branch: `git checkout -b feature/rovi-owners-adaptation`
3. Leer este prompt completo
4. Seguir plan de 8 semanas
5. ¡Construir el futuro de ROVI CRM!

---

**Documento creado:** Mayo 2026  
**Versión:** 2.0 - Con 15 Módulos Completos  
**Próxima revisión:** Post-implementación  
**Dueño:** Para desarrolladores Full Stack

**¿Preguntas?** Consultar `ROVI_OWNERS/README.md` o contactar al equipo técnico.
