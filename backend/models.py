from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid

def generate_uuid():
    return str(uuid.uuid4())

def now_utc():
    return datetime.now(timezone.utc)

# Enums
class LeadStatus(str, Enum):
    NUEVO = "nuevo"
    CONTACTADO = "contactado"
    CALIFICACION = "calificacion"
    PRESENTACION = "presentacion"
    APARTADO = "apartado"
    VENTA = "venta"
    PERDIDO = "perdido"

class LeadPriority(str, Enum):
    BAJA = "baja"
    MEDIA = "media"
    ALTA = "alta"
    URGENTE = "urgente"

class ActivityType(str, Enum):
    LLAMADA = "llamada"
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    ZOOM = "zoom"
    VISITA = "visita"
    NOTA = "nota"
    APARTADO = "apartado"
    VENTA = "venta"


class OperationType(str, Enum):
    SALE = "sale"
    RENT = "rent"
    BOTH = "both"

# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = "broker"  # admin, manager, broker
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "broker"
    phone: Optional[str] = None
    account_type: str = "individual"  # individual, agency, copim, copim_member, rovi_internal
    invitation_code: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class OnboardingCompletionRequest(BaseModel):
    context: Optional[str] = None
    metadata: Dict[str, Any] = {}


class BrokerCreate(BaseModel):
    name: str
    email: EmailStr
    password: Optional[str] = None
    phone: Optional[str] = None
    role: str = "broker"
    is_active: bool = True


class BrokerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    created_at: datetime = Field(default_factory=now_utc)
    onboarding_completed: bool = False
    tenant_id: str = ""
    personal_tenant_id: Optional[str] = None
    account_type: str = "individual"  # individual, agency, copim, copim_member, rovi_internal
    linked_copim_association_id: Optional[str] = None
    ai_profile: Optional['AIProfile'] = None  # Perfil personalizado para el asistente IA (forward reference)

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    onboarding_completed: bool
    personal_tenant_id: Optional[str] = None
    account_type: str = "individual"
    linked_copim_association_id: Optional[str] = None
    ai_profile: Optional['AIProfile'] = None  # Forward reference


class AuthWorkspaceSummary(BaseModel):
    tenant_id: str
    membership_id: Optional[str] = None
    name: str
    slug: Optional[str] = None
    role: str
    tenant_type: str = "individual"
    status: str = "active"
    is_default: bool = False
    linked_via: Optional[str] = None


class TenantType(str, Enum):
    INDIVIDUAL = "individual"
    AGENCY = "agency"
    PROPERTY_MANAGEMENT = "property_management"
    COPIM = "copim"
    ASSOCIATION = "association"
    COUNCIL = "council"
    GREMIAL = "gremial"
    CHAMBER = "chamber"
    DELEGATION = "delegation"
    MEMBER_COMPANY = "member_company"
    ROVI_INTERNAL = "rovi_internal"


class MembershipRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MANAGER = "manager"
    BROKER = "broker"
    PROPERTY_MANAGER = "property_manager"
    COPIM_ADMIN = "copim_admin"
    COPIM_OPERATOR = "copim_operator"
    COPIM_MEMBER = "copim_member"
    GREMIAL_NATIONAL_ADMIN = "gremial_national_admin"
    GREMIAL_DELEGATION_ADMIN = "gremial_delegation_admin"
    GREMIAL_MEMBERSHIP_MANAGER = "gremial_membership_manager"
    GREMIAL_FINANCE = "gremial_finance"
    GREMIAL_TRAINING_MANAGER = "gremial_training_manager"
    GREMIAL_COMMUNICATIONS = "gremial_communications"
    GREMIAL_MEMBER_ADMIN = "gremial_member_admin"
    GREMIAL_MEMBER_USER = "gremial_member_user"
    ROVI_ADMIN = "rovi_admin"
    ROVI_SALES = "rovi_sales"
    ROVI_MARKETING = "rovi_marketing"
    ROVI_CUSTOMER_SUCCESS = "rovi_customer_success"
    ROVI_OPS = "rovi_ops"


class MembershipStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    REVOKED = "revoked"


class MembershipLinkSource(str, Enum):
    SELF_SIGNUP = "self_signup"
    QR = "qr"
    INVITE_LINK = "invite_link"
    MANUAL = "manual"
    LEGACY_MIGRATION = "legacy_migration"


class PairingSessionStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class TenantBase(BaseModel):
    name: str
    slug: str
    tenant_type: TenantType = TenantType.INDIVIDUAL
    is_active: bool = True
    branding: Dict[str, Any] = {}
    settings: Dict[str, Any] = {}


class TenantCreate(TenantBase):
    owner_user_id: str


class Tenant(TenantBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    owner_user_id: str
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class TenantMembershipCreate(BaseModel):
    tenant_id: str
    user_id: str
    role: MembershipRole = MembershipRole.BROKER
    status: MembershipStatus = MembershipStatus.PENDING
    linked_via: MembershipLinkSource = MembershipLinkSource.MANUAL
    is_default: bool = False


class TenantMembershipUpdate(BaseModel):
    role: Optional[MembershipRole] = None
    status: Optional[MembershipStatus] = None
    linked_via: Optional[MembershipLinkSource] = None
    is_default: Optional[bool] = None
    accepted_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None


class TenantMembership(TenantMembershipCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    joined_at: datetime = Field(default_factory=now_utc)
    accepted_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    created_by_user_id: Optional[str] = None
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class BrokerPairingSessionCreate(BaseModel):
    tenant_id: str
    invited_role: MembershipRole = MembershipRole.BROKER
    expires_in_minutes: int = 10


class BrokerPairingSession(BrokerPairingSessionCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    status: PairingSessionStatus = PairingSessionStatus.PENDING
    token: str
    expires_at: datetime
    created_by_user_id: str
    confirmed_by_user_id: Optional[str] = None
    confirmed_membership_id: Optional[str] = None
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)

# AI Profile Models
class AIProfileCreate(BaseModel):
    """Perfil para personalizar el asistente IA del broker"""
    experience: str = ""  # "7 años vendiendo en Tulum"
    style: str = ""  # "Directo y amigable", "Formal y detallado"
    property_types: List[str] = []  # ["Lotes", "Casas"]
    focus_zones: List[str] = []  # ["Tulum Centro", "La Veleta"]
    goals: str = ""  # "5 ventas/mes de $2M"

class AIProfileUpdate(BaseModel):
    """Actualizar perfil IA del broker (todos campos opcionales)"""
    experience: Optional[str] = None
    style: Optional[str] = None
    property_types: Optional[List[str]] = None
    focus_zones: Optional[List[str]] = None
    goals: Optional[str] = None

class AIProfile(AIProfileCreate):
    """Perfil IA completo con ID y timestamps"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    tenant_id: str
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)

# Goals/KPIs Models
class GoalCreate(BaseModel):
    ventas_mes: int = 5
    ingresos_objetivo: float = 500000.0
    leads_contactados: int = 50
    tasa_conversion: float = 10.0
    apartados_mes: int = 10
    periodo: str = "mensual"
    utilidades_actuales_mensuales: float = 0.0
    utilidades_meta_mensuales: float = 0.0

class Goal(GoalCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    tenant_id: str
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)

# Lead Models
class LeadCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: str
    status: Optional[LeadStatus] = None
    priority: Optional[LeadPriority] = None
    source: str = "web"
    operation_type: OperationType = OperationType.SALE
    pipeline_type: str = "sales"
    rental_intent: Optional[str] = None
    budget_mxn: float = 0.0
    monthly_budget_mxn: Optional[float] = None
    nightly_budget_mxn: Optional[float] = None
    desired_check_in: Optional[datetime] = None
    desired_check_out: Optional[datetime] = None
    guests_count: Optional[int] = None
    preferred_zone: Optional[str] = None
    property_interest: Optional[str] = None
    raw_interest_text: Optional[str] = None
    interest_source: Optional[str] = None
    interested_product_ids: List[str] = []
    interested_products_snapshot: List[Dict[str, Any]] = []
    tags: List[str] = []
    email_opt_out: bool = False
    sms_opt_out: bool = False
    whatsapp_opt_out: bool = False
    call_opt_out: bool = False
    custom_fields_data: Dict[str, Any] = {}
    notes: Optional[str] = None
    assigned_broker_id: Optional[str] = None

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: Optional[LeadStatus] = None
    priority: Optional[LeadPriority] = None
    source: Optional[str] = None
    operation_type: Optional[OperationType] = None
    pipeline_type: Optional[str] = None
    rental_intent: Optional[str] = None
    budget_mxn: Optional[float] = None
    monthly_budget_mxn: Optional[float] = None
    nightly_budget_mxn: Optional[float] = None
    desired_check_in: Optional[datetime] = None
    desired_check_out: Optional[datetime] = None
    guests_count: Optional[int] = None
    preferred_zone: Optional[str] = None
    property_interest: Optional[str] = None
    raw_interest_text: Optional[str] = None
    interest_source: Optional[str] = None
    interested_product_ids: Optional[List[str]] = None
    interested_products_snapshot: Optional[List[Dict[str, Any]]] = None
    tags: Optional[List[str]] = None
    email_opt_out: Optional[bool] = None
    sms_opt_out: Optional[bool] = None
    whatsapp_opt_out: Optional[bool] = None
    call_opt_out: Optional[bool] = None
    custom_fields_data: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    assigned_broker_id: Optional[str] = None
    ai_analysis: Optional[Dict[str, Any]] = None
    intent_score: Optional[int] = None
    next_action: Optional[str] = None

class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    name: str
    email: Optional[str] = None
    phone: str
    status: LeadStatus = LeadStatus.NUEVO
    priority: LeadPriority = LeadPriority.MEDIA
    source: str = "web"
    operation_type: OperationType = OperationType.SALE
    pipeline_type: str = "sales"
    rental_intent: Optional[str] = None
    budget_mxn: float = 0.0
    monthly_budget_mxn: Optional[float] = None
    nightly_budget_mxn: Optional[float] = None
    desired_check_in: Optional[datetime] = None
    desired_check_out: Optional[datetime] = None
    guests_count: Optional[int] = None
    preferred_zone: Optional[str] = None
    property_interest: Optional[str] = None
    raw_interest_text: Optional[str] = None
    interest_source: Optional[str] = None
    interested_product_ids: List[str] = []
    interested_products_snapshot: List[Dict[str, Any]] = []
    tags: List[str] = []
    email_opt_out: bool = False
    sms_opt_out: bool = False
    whatsapp_opt_out: bool = False
    call_opt_out: bool = False
    custom_fields_data: Dict[str, Any] = {}
    location_preference: Optional[str] = None
    notes: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    assigned_broker_id: Optional[str] = None
    created_by: Optional[str] = None
    tenant_id: str = ""
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)
    ai_analysis: Optional[Dict[str, Any]] = None
    intent_score: int = 50
    next_action: Optional[str] = None
    last_contact: Optional[datetime] = None

# Activity Models
class ActivityCreate(BaseModel):
    lead_id: str
    activity_type: ActivityType
    description: str
    outcome: Optional[str] = None

class Activity(ActivityCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    broker_id: str
    tenant_id: str
    created_at: datetime = Field(default_factory=now_utc)
    points_earned: int = 0


class TaskStatus(str, Enum):
    PENDIENTE = "pendiente"
    EN_PROGRESO = "en_progreso"
    EN_ESPERA = "en_espera"
    COMPLETADA = "completada"
    CANCELADA = "cancelada"


class TaskPriority(str, Enum):
    BAJA = "baja"
    MEDIA = "media"
    ALTA = "alta"
    URGENTE = "urgente"


class TaskChecklistItem(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    title: str
    completed: bool = False


class TaskCommentCreate(BaseModel):
    body: str


class TaskComment(TaskCommentCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    user_name: str
    created_at: datetime = Field(default_factory=now_utc)


class TaskCreate(BaseModel):
    title: str
    description: str = ""
    status: TaskStatus = TaskStatus.PENDIENTE
    priority: TaskPriority = TaskPriority.MEDIA
    due_date: Optional[datetime] = None
    assigned_to: Optional[str] = None
    lead_id: Optional[str] = None
    tags: List[str] = []
    checklist: List[TaskChecklistItem] = []


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    assigned_to: Optional[str] = None
    lead_id: Optional[str] = None
    tags: Optional[List[str]] = None
    checklist: Optional[List[TaskChecklistItem]] = None


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class Task(TaskCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    created_by: str
    comments: List[TaskComment] = []
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)
    completed_at: Optional[datetime] = None

# Gamification Models
class GamificationRuleCreate(BaseModel):
    action: str
    points: int
    description: str
    icon: str = "star"

class GamificationRule(GamificationRuleCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=now_utc)

class BrokerStats(BaseModel):
    broker_id: str
    broker_name: str
    avatar_url: Optional[str] = None
    total_points: int = 0
    ventas: int = 0
    apartados: int = 0
    leads_asignados: int = 0
    llamadas: int = 0
    presentaciones: int = 0
    rank: int = 0
    month_progress: float = 0.0

class PointLedger(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    broker_id: str
    points: int
    action: str
    description: str
    lead_id: Optional[str] = None
    activity_id: Optional[str] = None
    tenant_id: str
    created_at: datetime = Field(default_factory=now_utc)

# Chat Models
class ChatMessageCreate(BaseModel):
    content: str

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    tenant_id: str
    role: str  # user, assistant
    content: str
    created_at: datetime = Field(default_factory=now_utc)

# Script Models
class ScriptCreate(BaseModel):
    title: str
    category: str
    content: str
    tags: List[str] = []

class Script(ScriptCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    created_by: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)

# Dashboard Models
class DashboardStats(BaseModel):
    total_points: int = 0
    points_goal: int = 100
    points_progress: float = 0.0
    apartados: int = 0
    apartados_goal: int = 10
    ventas: int = 0
    ventas_goal: int = 5
    brokers_activos: int = 0
    leads_nuevos: int = 0
    conversion_rate: float = 0.0

# Token Response
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: Optional[int] = None  # Seconds until access token expires
    user: UserResponse
    active_workspace: Optional[AuthWorkspaceSummary] = None
    available_workspaces: List[AuthWorkspaceSummary] = []


class AuthMeResponse(BaseModel):
    user: UserResponse
    active_workspace: Optional[AuthWorkspaceSummary] = None
    available_workspaces: List[AuthWorkspaceSummary] = []


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class SwitchWorkspaceRequest(BaseModel):
    tenant_id: str

# COPIM Management Models
class CopimAssociationCreate(BaseModel):
    name: str
    state: str
    city: Optional[str] = None
    tagline: Optional[str] = None
    logo_url: Optional[str] = None
    bio: Optional[str] = None
    mission: Optional[str] = None
    vision: Optional[str] = None
    president_name: Optional[str] = None
    president_email: Optional[EmailStr] = None
    admin_name: Optional[str] = None
    admin_email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: str = "active"  # active, onboarding, inactive
    member_goal: int = 0
    national_score: int = 0
    national_badge: Optional[str] = None
    annual_events_count: int = 0
    active_courses_count: int = 0
    achievements: List[Dict[str, Any]] = Field(default_factory=list)
    leadership_team: List[Dict[str, Any]] = Field(default_factory=list)
    coverage_zone: Optional[str] = None
    website: Optional[str] = None
    notes: Optional[str] = None


class CopimAssociationUpdate(BaseModel):
    name: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    tagline: Optional[str] = None
    logo_url: Optional[str] = None
    bio: Optional[str] = None
    mission: Optional[str] = None
    vision: Optional[str] = None
    president_name: Optional[str] = None
    president_email: Optional[EmailStr] = None
    admin_name: Optional[str] = None
    admin_email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    member_goal: Optional[int] = None
    national_score: Optional[int] = None
    national_badge: Optional[str] = None
    annual_events_count: Optional[int] = None
    active_courses_count: Optional[int] = None
    achievements: Optional[List[Dict[str, Any]]] = None
    leadership_team: Optional[List[Dict[str, Any]]] = None
    coverage_zone: Optional[str] = None
    website: Optional[str] = None
    notes: Optional[str] = None


class CopimCommunityPostCreate(BaseModel):
    channel_id: str
    content: str


class CopimCommunityCommentCreate(BaseModel):
    content: str


class CopimMemberCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    association_id: Optional[str] = None
    title: Optional[str] = None
    city: Optional[str] = None
    specialty: Optional[str] = None
    company_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    certifications: List[str] = Field(default_factory=list)
    join_date: Optional[datetime] = None
    member_status: str = "pending"  # pending, active, suspended
    review_state: str = "submitted"  # submitted, awaiting_info, approved, rejected
    membership_tier: str = "base"
    credential_status: str = "pending"  # pending, issued, blocked
    credential_id: Optional[str] = None
    directory_visible: bool = True
    amount_due: float = 0.0
    validation_checklist: Dict[str, bool] = Field(default_factory=dict)
    validation_notes: Optional[str] = None
    requested_information: Optional[str] = None
    linked_user_id: Optional[str] = None
    portal_access_enabled: bool = False
    notes: Optional[str] = None


class CopimMemberUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    association_id: Optional[str] = None
    title: Optional[str] = None
    city: Optional[str] = None
    specialty: Optional[str] = None
    company_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    certifications: Optional[List[str]] = None
    join_date: Optional[datetime] = None
    member_status: Optional[str] = None
    review_state: Optional[str] = None
    membership_tier: Optional[str] = None
    credential_status: Optional[str] = None
    credential_id: Optional[str] = None
    directory_visible: Optional[bool] = None
    amount_due: Optional[float] = None
    validation_checklist: Optional[Dict[str, bool]] = None
    validation_notes: Optional[str] = None
    requested_information: Optional[str] = None
    linked_user_id: Optional[str] = None
    portal_access_enabled: Optional[bool] = None
    notes: Optional[str] = None


class CopimMemberReviewUpdate(BaseModel):
    validation_checklist: Optional[Dict[str, bool]] = None
    validation_notes: Optional[str] = None
    requested_information: Optional[str] = None


class CopimMemberPortalProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    city: Optional[str] = None
    specialty: Optional[str] = None
    company_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    certifications: Optional[List[str]] = None
    directory_visible: Optional[bool] = None


class CopimMembershipCreate(BaseModel):
    member_id: str
    association_id: Optional[str] = None
    plan_name: str
    plan_price: float
    billing_period: str = "annual"  # monthly, quarterly, annual
    renewal_date: datetime
    payment_status: str = "due"  # active, due, overdue, cancelled
    balance_due: float = 0.0
    auto_renew: bool = False
    reminder_enabled: bool = True
    payment_method: Optional[str] = None
    invoice_status: str = "not_requested"  # not_requested, pending, issued
    paid_at: Optional[datetime] = None
    benefits_summary: Optional[str] = None
    notes: Optional[str] = None


class CopimMembershipUpdate(BaseModel):
    member_id: Optional[str] = None
    association_id: Optional[str] = None
    plan_name: Optional[str] = None
    plan_price: Optional[float] = None
    billing_period: Optional[str] = None
    renewal_date: Optional[datetime] = None
    payment_status: Optional[str] = None
    balance_due: Optional[float] = None
    auto_renew: Optional[bool] = None
    reminder_enabled: Optional[bool] = None
    payment_method: Optional[str] = None
    invoice_status: Optional[str] = None
    paid_at: Optional[datetime] = None
    benefits_summary: Optional[str] = None
    notes: Optional[str] = None


class CopimInvoiceCreate(BaseModel):
    membership_id: Optional[str] = None
    member_id: str
    association_id: Optional[str] = None
    invoice_number: str
    concept: str
    subtotal: float
    tax_amount: float = 0.0
    total_amount: float
    balance_due: float
    currency: str = "MXN"
    issue_date: datetime
    due_date: datetime
    invoice_status: str = "draft"  # draft, issued, sent, paid, cancelled
    payment_status: str = "pending"  # pending, paid, overdue, cancelled
    recipient_name: Optional[str] = None
    recipient_rfc: Optional[str] = None
    recipient_email: Optional[EmailStr] = None
    cfdi_use: Optional[str] = None
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    sent_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    notes: Optional[str] = None


class CopimInvoiceUpdate(BaseModel):
    membership_id: Optional[str] = None
    member_id: Optional[str] = None
    association_id: Optional[str] = None
    invoice_number: Optional[str] = None
    concept: Optional[str] = None
    subtotal: Optional[float] = None
    tax_amount: Optional[float] = None
    total_amount: Optional[float] = None
    balance_due: Optional[float] = None
    currency: Optional[str] = None
    issue_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    invoice_status: Optional[str] = None
    payment_status: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_rfc: Optional[str] = None
    recipient_email: Optional[EmailStr] = None
    cfdi_use: Optional[str] = None
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    sent_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    notes: Optional[str] = None


class CopimEventCreate(BaseModel):
    title: str
    association_id: Optional[str] = None
    event_type: str = "networking"  # networking, capacitacion, certificacion, asamblea, webinar
    event_format: str = "presencial"  # presencial, virtual, hibrido
    venue: Optional[str] = None
    visibility: str = "members"  # members, association, public
    status: str = "published"  # draft, published, completed, cancelled
    registration_open: bool = True
    speaker_name: Optional[str] = None
    start_at: datetime
    end_at: Optional[datetime] = None
    capacity: int = 0
    registered_count: int = 0
    checked_in_count: int = 0
    description: Optional[str] = None


class CopimEventUpdate(BaseModel):
    title: Optional[str] = None
    association_id: Optional[str] = None
    event_type: Optional[str] = None
    event_format: Optional[str] = None
    venue: Optional[str] = None
    visibility: Optional[str] = None
    status: Optional[str] = None
    registration_open: Optional[bool] = None
    speaker_name: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    capacity: Optional[int] = None
    registered_count: Optional[int] = None
    checked_in_count: Optional[int] = None
    description: Optional[str] = None


class CopimCourseInstructorInput(BaseModel):
    id: Optional[str] = None
    name: str
    role: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class CopimCourseMaterialInput(BaseModel):
    id: Optional[str] = None
    title: str
    material_type: str = "file"  # file, video, pdf, slide, link, transcript
    source_name: Optional[str] = None
    content_type: Optional[str] = None
    url: Optional[str] = None
    summary: Optional[str] = None
    size_label: Optional[str] = None
    is_downloadable: bool = True


class CopimCourseLessonInput(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    duration_minutes: int = 10
    lesson_type: str = "video"  # video, document, live, quiz
    video_source: Optional[str] = None  # youtube, upload, external
    video_url: Optional[str] = None
    transcript: Optional[str] = None
    subtitle_text: Optional[str] = None
    notes: Optional[str] = None
    is_preview: bool = False
    resources: List[CopimCourseMaterialInput] = Field(default_factory=list)


class CopimCourseModuleInput(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    lessons: List[CopimCourseLessonInput] = Field(default_factory=list)


class CopimCourseCreate(BaseModel):
    association_id: Optional[str] = None
    scope: str = "national"  # national, association
    title: str
    subtitle: Optional[str] = None
    summary: Optional[str] = None
    description: Optional[str] = None
    category: str = "Capacitacion"
    modality: str = "Video on demand"  # video, live, hybrid
    audience: str = "socios"  # socios, staff, public
    visibility: str = "members"  # members, association, public
    status: str = "draft"  # draft, published, archived
    cover_image_url: Optional[str] = None
    hero_image_url: Optional[str] = None
    pricing_type: str = "free"  # free, premium
    price_amount: float = 0.0
    currency: str = "MXN"
    marketplace_enabled: bool = False
    certificate_enabled: bool = False
    certificate_title: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    learning_objectives: List[str] = Field(default_factory=list)
    language: str = "es-MX"
    estimated_minutes: int = 0
    onboarding_notes: Optional[str] = None
    instructors: List[CopimCourseInstructorInput] = Field(default_factory=list)
    modules: List[CopimCourseModuleInput] = Field(default_factory=list)
    materials: List[CopimCourseMaterialInput] = Field(default_factory=list)


class CopimCourseUpdate(BaseModel):
    association_id: Optional[str] = None
    scope: Optional[str] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    summary: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    modality: Optional[str] = None
    audience: Optional[str] = None
    visibility: Optional[str] = None
    status: Optional[str] = None
    cover_image_url: Optional[str] = None
    hero_image_url: Optional[str] = None
    pricing_type: Optional[str] = None
    price_amount: Optional[float] = None
    currency: Optional[str] = None
    marketplace_enabled: Optional[bool] = None
    certificate_enabled: Optional[bool] = None
    certificate_title: Optional[str] = None
    tags: Optional[List[str]] = None
    learning_objectives: Optional[List[str]] = None
    language: Optional[str] = None
    estimated_minutes: Optional[int] = None
    onboarding_notes: Optional[str] = None
    instructors: Optional[List[CopimCourseInstructorInput]] = None
    modules: Optional[List[CopimCourseModuleInput]] = None
    materials: Optional[List[CopimCourseMaterialInput]] = None


class CopimCourseAIDraftRequest(BaseModel):
    title: str
    category: Optional[str] = None
    audience: Optional[str] = None
    prompt: Optional[str] = None
    material_titles: List[str] = Field(default_factory=list)
    material_text: Optional[str] = None


# ROVI Marketplace Models
class MarketplaceTierCode(str, Enum):
    BASIC = "basic"
    PRO = "pro"
    PREMIUM = "premium"
    PARTNER = "partner"


class MarketplaceListingType(str, Enum):
    DIGITAL_ARTIFACT = "digital_artifact"
    PROFESSIONAL_SERVICE = "professional_service"
    AGENT_SKILL = "agent_skill"
    INTEGRATION = "integration"


class MarketplaceListingStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    PAUSED = "paused"
    ARCHIVED = "archived"


class MarketplaceTransactionStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    IN_ESCROW = "in_escrow"
    DELIVERED = "delivered"
    COMPLETED = "completed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class MarketplaceEntitlementType(str, Enum):
    DOWNLOAD = "download"
    SERVICE_ORDER = "service_order"
    AGENT_SKILL = "agent_skill"


class MarketplaceEntitlementStatus(str, Enum):
    ACTIVE = "active"
    REVOKED = "revoked"
    EXPIRED = "expired"


class MarketplaceTierCreate(BaseModel):
    code: MarketplaceTierCode
    name: str
    description: Optional[str] = None
    monthly_price_mxn: float = 0.0
    can_buy: bool = True
    can_sell: bool = False
    max_active_digital_artifacts: int = 0
    max_active_services: int = 0
    max_active_agent_skills: int = 0
    inherited_tiers: List[MarketplaceTierCode] = Field(default_factory=list)
    platform_commission_rate: float = 0.15
    association_commission_rate: float = 0.10
    creator_commission_rate: float = 0.75
    features: List[str] = Field(default_factory=list)
    is_active: bool = True


class MarketplaceTier(MarketplaceTierCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str = ""
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class DigitalArtifactPayload(BaseModel):
    artifact_type: str = "template"  # template, course, contract, social_asset, script, guide
    file_urls: List[str] = Field(default_factory=list)
    preview_url: Optional[str] = None
    license_terms: str = "single_tenant_use"
    version: str = "1.0.0"
    estimated_minutes: Optional[int] = None


class ProfessionalServicePackage(BaseModel):
    name: str = "Base"
    price_mxn: float
    delivery_days: int
    revisions: int = 1
    deliverables: List[str] = Field(default_factory=list)


class ProfessionalServicePayload(BaseModel):
    service_category: str = "marketing"  # landing_page, funnel, ads, design, legal, valuation
    packages: List[ProfessionalServicePackage] = Field(default_factory=list)
    requirements_prompt: Optional[str] = None
    escrow_required: bool = True


class AgentSkillPayload(BaseModel):
    skill_slug: str
    skill_version: str = "1.0.0"
    skill_markdown: Optional[str] = None
    skill_file_url: Optional[str] = None
    install_mode: str = "tenant_agent"  # tenant_agent, broker_agent, copim_agent
    compatible_agents: List[str] = Field(default_factory=lambda: ["commercial_diagnosis_agent"])
    required_mcp_tools: List[str] = Field(default_factory=list)
    token_budget_hint: int = 500


class MarketplaceListingCreate(BaseModel):
    listing_type: MarketplaceListingType
    title: str
    subtitle: Optional[str] = None
    description: str
    category: str
    tags: List[str] = Field(default_factory=list)
    price_mxn: float = 0.0
    currency: str = "MXN"
    cover_image_url: Optional[str] = None
    gallery_urls: List[str] = Field(default_factory=list)
    target_roles: List[str] = Field(default_factory=list)
    minimum_tier: MarketplaceTierCode = MarketplaceTierCode.BASIC
    association_id: Optional[str] = None
    digital_artifact: Optional[DigitalArtifactPayload] = None
    professional_service: Optional[ProfessionalServicePayload] = None
    agent_skill: Optional[AgentSkillPayload] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class MarketplaceListingUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    price_mxn: Optional[float] = None
    cover_image_url: Optional[str] = None
    gallery_urls: Optional[List[str]] = None
    target_roles: Optional[List[str]] = None
    minimum_tier: Optional[MarketplaceTierCode] = None
    status: Optional[MarketplaceListingStatus] = None
    digital_artifact: Optional[DigitalArtifactPayload] = None
    professional_service: Optional[ProfessionalServicePayload] = None
    agent_skill: Optional[AgentSkillPayload] = None
    metadata: Optional[Dict[str, Any]] = None


class MarketplaceListing(MarketplaceListingCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str = ""
    creator_user_id: str
    status: MarketplaceListingStatus = MarketplaceListingStatus.DRAFT
    sales_count: int = 0
    rating_average: float = 0.0
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class MarketplacePurchaseRequest(BaseModel):
    listing_id: str
    package_name: Optional[str] = None
    buyer_notes: Optional[str] = None
    payment_provider: str = "manual"
    payment_reference: Optional[str] = None


class MarketplaceCommissionSplit(BaseModel):
    recipient_type: str  # creator, association, platform
    recipient_id: Optional[str] = None
    amount_mxn: float
    rate: float
    status: str = "pending"


class MarketplaceTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    listing_id: str
    listing_type: MarketplaceListingType
    buyer_user_id: str
    creator_user_id: str
    association_id: Optional[str] = None
    package_name: Optional[str] = None
    gross_amount_mxn: float
    currency: str = "MXN"
    status: MarketplaceTransactionStatus = MarketplaceTransactionStatus.PENDING
    payment_provider: str = "manual"
    payment_reference: Optional[str] = None
    commission_splits: List[MarketplaceCommissionSplit] = Field(default_factory=list)
    buyer_notes: Optional[str] = None
    delivery_due_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class MarketplaceEntitlement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    buyer_user_id: str
    listing_id: str
    transaction_id: str
    entitlement_type: MarketplaceEntitlementType
    status: MarketplaceEntitlementStatus = MarketplaceEntitlementStatus.ACTIVE
    download_urls: List[str] = Field(default_factory=list)
    max_downloads: int = 10
    download_count: int = 0
    expires_at: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class AgentSkillInstallation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    user_id: str
    listing_id: str
    skill_slug: str
    skill_version: str
    status: str = "active"
    installed_at: datetime = Field(default_factory=now_utc)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class MCPJsonRpcRequest(BaseModel):
    jsonrpc: str = "2.0"
    id: Optional[Any] = None
    method: str
    params: Dict[str, Any] = Field(default_factory=dict)


class CopimCourseProgressUpdate(BaseModel):
    lesson_id: str
    mark_completed: bool = True

# Calendar Event Models
class CalendarEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: str = "seguimiento"  # seguimiento, llamada, zoom, visita, otro
    start_time: datetime
    end_time: Optional[datetime] = None
    lead_id: Optional[str] = None
    reminder_minutes: int = 30
    color: Optional[str] = None

class CalendarEventUpdate(BaseModel):
    """Update model for calendar events"""
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    lead_id: Optional[str] = None
    reminder_minutes: Optional[int] = None
    color: Optional[str] = None
    completed: Optional[bool] = None

class CalendarEvent(CalendarEventCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    tenant_id: str
    completed: bool = False
    google_event_id: Optional[str] = None  # ID del evento en Google Calendar
    synced_from_google: bool = False  # True si fue importado de Google
    last_synced_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=now_utc)



# ==================== INTEGRATION SETTINGS ====================

class IntegrationSettings(BaseModel):
    """Settings for external integrations (VAPI, Twilio, SendGrid, Google Calendar, Apify)"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    tenant_id: str
    # VAPI Settings
    vapi_api_key: Optional[str] = None
    vapi_phone_number_id: Optional[str] = None
    vapi_assistant_id: Optional[str] = None
    # Twilio Settings
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None
    twilio_whatsapp_number: Optional[str] = None
    # SendGrid Settings
    sendgrid_api_key: Optional[str] = None
    sendgrid_sender_email: Optional[str] = None
    sendgrid_sender_name: Optional[str] = None
    # Google Calendar Settings
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_tokens: Optional[Dict[str, Any]] = None
    google_calendar_email: Optional[str] = None
    # Apify Settings
    apify_api_token: Optional[str] = None
    # Status
    vapi_enabled: bool = False
    twilio_enabled: bool = False
    twilio_whatsapp_enabled: bool = False
    sendgrid_enabled: bool = False
    google_calendar_enabled: bool = False
    apify_enabled: bool = False
    updated_at: datetime = Field(default_factory=now_utc)

class IntegrationSettingsUpdate(BaseModel):
    """Update model for integration settings"""
    vapi_api_key: Optional[str] = None
    vapi_phone_number_id: Optional[str] = None
    vapi_assistant_id: Optional[str] = None
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None
    twilio_whatsapp_number: Optional[str] = None
    sendgrid_api_key: Optional[str] = None
    sendgrid_sender_email: Optional[str] = None
    sendgrid_sender_name: Optional[str] = None
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    apify_api_token: Optional[str] = None

# ==================== CAMPAIGNS ====================

class CampaignType(str, Enum):
    CALL = "call"
    SMS = "sms"
    EMAIL = "email"
    WHATSAPP = "whatsapp"

class CampaignStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    RUNNING = "running"
    COMPLETED = "completed"
    PAUSED = "paused"
    FAILED = "failed"

class CampaignCreate(BaseModel):
    """Create a new campaign"""
    name: str
    campaign_type: CampaignType
    message_template: Optional[str] = None  # For SMS
    email_subject: Optional[str] = None  # For Email campaigns
    email_template_id: Optional[str] = None  # Use existing email template
    saved_segment_id: Optional[str] = None
    ab_test_enabled: bool = False
    ab_test_name: Optional[str] = None
    ab_test_split_percentage: int = 50
    variant_b_message_template: Optional[str] = None
    variant_b_email_subject: Optional[str] = None
    lead_ids: List[str] = []
    lead_filter: Optional[Dict[str, Any]] = None  # Filter criteria
    scheduled_at: Optional[datetime] = None

class Campaign(CampaignCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    tenant_id: str
    status: CampaignStatus = CampaignStatus.DRAFT
    total_recipients: int = 0
    sent_count: int = 0
    delivered_count: int = 0
    failed_count: int = 0
    variant_a_sent_count: int = 0
    variant_b_sent_count: int = 0
    created_at: datetime = Field(default_factory=now_utc)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

# ==================== CALL RECORDS ====================

class CallStatus(str, Enum):
    QUEUED = "queued"
    RINGING = "ringing"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    NO_ANSWER = "no_answer"
    BUSY = "busy"

class CallRecordCreate(BaseModel):
    """Create a call record"""
    lead_id: str
    phone_number: str
    campaign_id: Optional[str] = None
    scheduled_at: Optional[datetime] = None

class CallRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    tenant_id: str
    lead_id: str
    lead_name: Optional[str] = None
    phone_number: str
    campaign_id: Optional[str] = None
    vapi_call_id: Optional[str] = None
    status: CallStatus = CallStatus.QUEUED
    duration_seconds: Optional[float] = None
    transcript: Optional[str] = None
    recording_url: Optional[str] = None
    summary: Optional[str] = None
    sentiment: Optional[str] = None
    outcome: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=now_utc)

# ==================== SMS RECORDS ====================

class SMSStatus(str, Enum):
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    UNDELIVERED = "undelivered"

class SMSRecordCreate(BaseModel):
    """Create an SMS record"""
    lead_id: str
    phone_number: str
    message: str
    campaign_id: Optional[str] = None

class SMSRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    tenant_id: str
    lead_id: str
    lead_name: Optional[str] = None
    phone_number: str
    message: str
    campaign_id: Optional[str] = None
    ab_variant: Optional[str] = None
    twilio_sid: Optional[str] = None
    status: SMSStatus = SMSStatus.QUEUED
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=now_utc)

# ==================== WHATSAPP RECORDS ====================

class WhatsAppStatus(str, Enum):
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    UNDELIVERED = "undelivered"
    READ = "read"

class WhatsAppRecordCreate(BaseModel):
    lead_id: str
    phone_number: str
    message: str
    campaign_id: Optional[str] = None

class WhatsAppRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    tenant_id: str
    lead_id: str
    lead_name: Optional[str] = None
    phone_number: str
    message: str
    campaign_id: Optional[str] = None
    ab_variant: Optional[str] = None
    twilio_sid: Optional[str] = None
    status: WhatsAppStatus = WhatsAppStatus.QUEUED
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=now_utc)

# ==================== CONVERSATION ANALYSIS (DEMO) ====================

class ConversationAnalysis(BaseModel):
    """Mock conversation analysis model"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    call_id: str
    lead_name: str
    duration_seconds: float
    sentiment: str  # positive, neutral, negative
    intent_detected: str
    key_topics: List[str] = []
    action_items: List[str] = []
    follow_up_recommended: bool = False
    follow_up_reason: Optional[str] = None
    confidence_score: float = 0.0
    created_at: datetime = Field(default_factory=now_utc)


# ==================== EMAIL RECORDS ====================

class EmailStatus(str, Enum):
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    CLICKED = "clicked"
    BOUNCED = "bounced"
    FAILED = "failed"

class EmailTemplate(BaseModel):
    """Email template model with visual editor support"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    tenant_id: str
    name: str
    category: Optional[str] = None  # "open_house", "property_promo", "follow_up", "market_update", "buyer_nurturing", "seller_nurturing"
    subject: str
    html_content: str
    json_content: Optional[Dict[str, Any]] = None  # Visual editor JSON structure
    variables: List[str] = []  # e.g., ["nombre", "propiedad", "precio"]
    thumbnail_url: Optional[str] = None
    is_default: bool = False
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)

class EmailTemplateCreate(BaseModel):
    name: str
    category: Optional[str] = None
    subject: str
    html_content: str
    json_content: Optional[Dict[str, Any]] = None
    variables: List[str] = []

class EmailRecordCreate(BaseModel):
    """Create an email record"""
    lead_id: str
    email: str
    subject: str
    html_content: str
    campaign_id: Optional[str] = None

class EmailRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    tenant_id: str
    lead_id: str
    lead_name: Optional[str] = None
    email: str
    subject: str
    html_content: str
    campaign_id: Optional[str] = None
    ab_variant: Optional[str] = None
    sendgrid_id: Optional[str] = None
    status: EmailStatus = EmailStatus.QUEUED
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=now_utc)


class CampaignSegmentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    campaign_type: Optional[CampaignType] = None
    lead_filter: Dict[str, Any] = {}
    color: Optional[str] = None


class CampaignSegmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    campaign_type: Optional[CampaignType] = None
    lead_filter: Optional[Dict[str, Any]] = None
    color: Optional[str] = None
    last_estimated_count: Optional[int] = None


class CampaignSegment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    tenant_id: str
    name: str
    description: Optional[str] = None
    campaign_type: Optional[CampaignType] = None
    lead_filter: Dict[str, Any] = {}
    color: Optional[str] = None
    last_estimated_count: int = 0
    last_used_at: Optional[datetime] = None
    campaign_count: int = 0
    total_sent_count: int = 0
    total_delivered_count: int = 0
    total_failed_count: int = 0
    total_opened_count: int = 0
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


# ==================== IMPORT JOBS ====================

class ImportStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"

class ImportJob(BaseModel):
    """Track lead import jobs"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    tenant_id: str
    filename: str
    file_type: str  # csv, xlsx
    import_kind: str = "leads"
    total_rows: int = 0
    imported_count: int = 0
    skipped_count: int = 0
    error_count: int = 0
    errors: List[Dict[str, Any]] = []
    column_mapping: Dict[str, str] = {}
    status: ImportStatus = ImportStatus.PENDING
    created_at: datetime = Field(default_factory=now_utc)
    completed_at: Optional[datetime] = None

class ColumnMapping(BaseModel):
    """Column mapping for import"""
    source_column: str
    target_field: str

class ImportMappingRequest(BaseModel):
    """Request to start import with mapping"""
    job_id: str
    mapping: List[ColumnMapping]
    skip_duplicates: bool = True
    duplicate_field: str = "email"  # Field to check for duplicates


class CombinedImportMappingRequest(BaseModel):
    """Request for combined leads + products import"""
    job_id: str
    leads_mapping: List[ColumnMapping]
    products_mapping: List[ColumnMapping]
    skip_duplicates: bool = True
    duplicate_field: str = "email"


# ==================== CAMPAIGN ANALYTICS ====================

class CampaignMetrics(BaseModel):
    """Campaign metrics for analytics dashboard"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    campaign_id: Optional[str] = None
    source: str  # "meta", "google", "email", "sms", "call"
    date: datetime = Field(default_factory=now_utc)

    # Metrics
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0
    spend: float = 0.0
    leads: int = 0

    # Calculated metrics
    ctr: float = 0.0  # Click-through rate
    cpc: float = 0.0  # Cost per click
    cpl: float = 0.0  # Cost per lead
    roas: float = 0.0  # Return on ad spend

    # Real estate specific metrics
    property_views: int = 0
    viewing_requests: int = 0
    brokerage_signed: int = 0

    created_at: datetime = Field(default_factory=now_utc)


class AnalyticsDashboard(BaseModel):
    """Analytics dashboard summary"""
    total_spend: float = 0.0
    total_impressions: int = 0
    total_clicks: int = 0
    total_conversions: int = 0
    total_leads: int = 0
    avg_ctr: float = 0.0
    avg_cpl: float = 0.0
    leads_by_source: Dict[str, int] = {}
    spend_by_source: Dict[str, float] = {}
    conversions_by_source: Dict[str, int] = {}


# ==================== AUTOMATIONS / WORKFLOWS ====================

class AutomationWorkflow(BaseModel):
    """Automation workflow model (n8n integration)"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    name: str
    description: Optional[str] = None
    category: str  # "lead_generation", "sales", "promotion", "custom"
    n8n_workflow_id: Optional[str] = None  # ID del workflow en n8n
    n8n_webhook_url: Optional[str] = None  # URL del webhook de n8n
    is_active: bool = False
    is_template: bool = False  # Si es una plantilla predefinida

    # Configuración dinámica del workflow
    config_schema: Optional[Dict[str, Any]] = None  # Schema de variables (del webhook n8n)
    config_values: Dict[str, Any] = {}  # Valores configurados

    # Estadísticas
    last_run: Optional[datetime] = None
    total_runs: int = 0
    successful_runs: int = 0
    failed_runs: int = 0

    created_by: str
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class AutomationWorkflowCreate(BaseModel):
    """Create a new automation workflow"""
    name: str
    description: Optional[str] = None
    category: str
    n8n_workflow_id: Optional[str] = None
    config_values: Dict[str, Any] = {}


class AutomationExecution(BaseModel):
    """Execution log for automation workflow"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    workflow_id: str
    status: str  # "running", "completed", "failed", "cancelled"
    started_at: datetime = Field(default_factory=now_utc)
    completed_at: Optional[datetime] = None
    input_data: Dict[str, Any] = {}
    output_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    execution_time_ms: Optional[int] = None


# ==================== ROUND ROBIN ASSIGNMENTS ====================

class RoundRobinConfig(BaseModel):
    """Round Robin configuration for lead/event assignment"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    is_active: bool = True
    active_brokers: List[str] = []  # List of broker IDs participating in Round Robin
    last_assigned_broker: Optional[str] = None  # Last broker that received an assignment
    assignment_counts: Dict[str, int] = {}  # Track assignments per broker for balance
    reset_frequency: str = "daily"  # "daily", "weekly", "never"
    last_reset: Optional[datetime] = None
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class CalendarAssignment(BaseModel):
    """Assignment record for calendar events"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    event_id: str
    assigned_to: str  # broker ID
    assignment_type: str  # "manual" or "round_robin"
    assigned_by: str  # user ID who made the assignment
    created_at: datetime = Field(default_factory=now_utc)


# ==================== PRODUCTS/SERVICES ====================

class ProductServiceType(str, Enum):
    REAL_ESTATE = "real_estate"
    SOFTWARE = "software"
    DIGITAL = "digital"
    SERVICE = "service"


class MediaAsset(BaseModel):
    """Asset de media para productos"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    url: str
    filename: Optional[str] = None
    alt: Optional[str] = None
    is_cover: bool = False
    order: int = 0
    source: str = "upload"
    media_asset_id: Optional[str] = None


class CustomFieldType(str, Enum):
    TEXT = "text"
    TEXTAREA = "textarea"
    NUMBER = "number"
    SELECT = "select"
    MULTI_SELECT = "multi_select"
    BOOLEAN = "boolean"
    DATE = "date"
    URL = "url"


class CustomFieldEntityType(str, Enum):
    LEADS = "leads"
    PRODUCTS = "products"


class CustomFieldDefinitionCreate(BaseModel):
    """Crear definición de campo personalizado"""
    label: str
    key: str
    entity_type: CustomFieldEntityType
    field_type: CustomFieldType
    options: List[str] = []
    required: bool = False
    is_active: bool = True
    show_in_table: bool = False
    show_in_card: bool = False
    show_in_filters: bool = False
    sort_order: int = 0


class CustomFieldDefinitionUpdate(BaseModel):
    """Actualizar definición de campo personalizado"""
    label: Optional[str] = None
    key: Optional[str] = None
    field_type: Optional[CustomFieldType] = None
    options: Optional[List[str]] = None
    required: Optional[bool] = None
    is_active: Optional[bool] = None
    show_in_table: Optional[bool] = None
    show_in_card: Optional[bool] = None
    show_in_filters: Optional[bool] = None
    sort_order: Optional[int] = None


class CustomFieldDefinition(CustomFieldDefinitionCreate):
    """Definición completa de campo personalizado"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    created_by: str
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class ProductLocation(BaseModel):
    """Ubicación geográfica de una propiedad/producto"""
    model_config = ConfigDict(extra="ignore")
    address: Optional[str] = None
    formatted_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    zone: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    place_id: Optional[str] = None
    google_maps_url: Optional[str] = None
    visibility: Optional[str] = "exact"
    source: Optional[str] = "manual"
    confidence: Optional[float] = None
    notes: Optional[str] = None


class ProductServiceCreate(BaseModel):
    """Crear producto/servicio"""
    sku: str
    title: str
    description: str
    product_type: ProductServiceType
    operation_type: OperationType = OperationType.SALE
    niche: str  # "Residencial", "Comercial", "VIP", etc.
    price_mxn: float = 0.0
    commission_percentage: float = 0.0
    responsible_broker_id: Optional[str] = None
    responsible_broker_name: Optional[str] = None
    responsible_broker_email: Optional[str] = None
    monthly_rent_mxn: Optional[float] = None
    nightly_rent_mxn: Optional[float] = None
    rental_type: Optional[str] = None
    features: List[str] = []
    aliases: List[str] = []
    keywords: List[str] = []
    external_id: Optional[str] = None
    is_active: bool = True
    assigned_campaigns: List[str] = []  # IDs de campañas
    assigned_brokers: List[str] = []  # IDs de brokers
    images: List[MediaAsset] = []
    location: Optional[ProductLocation] = None
    custom_fields_data: Dict[str, Any] = {}


class ProductServiceUpdate(BaseModel):
    """Actualizar producto/servicio"""
    sku: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    product_type: Optional[ProductServiceType] = None
    operation_type: Optional[OperationType] = None
    niche: Optional[str] = None
    price_mxn: Optional[float] = None
    commission_percentage: Optional[float] = None
    responsible_broker_id: Optional[str] = None
    responsible_broker_name: Optional[str] = None
    responsible_broker_email: Optional[str] = None
    monthly_rent_mxn: Optional[float] = None
    nightly_rent_mxn: Optional[float] = None
    rental_type: Optional[str] = None
    features: Optional[List[str]] = None
    aliases: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    external_id: Optional[str] = None
    is_active: Optional[bool] = None
    assigned_campaigns: Optional[List[str]] = None
    assigned_brokers: Optional[List[str]] = None
    images: Optional[List[MediaAsset]] = None
    location: Optional[ProductLocation] = None
    custom_fields_data: Optional[Dict[str, Any]] = None


class ProductService(ProductServiceCreate):
    """Producto/Servicio completo"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    created_by: str
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


# ==================== RENTALS / PROPERTY MANAGEMENT ====================

class RentalType(str, Enum):
    SHORT_TERM = "short_term"
    MID_TERM = "mid_term"
    LONG_TERM = "long_term"


class RentalPropertyStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    MAINTENANCE = "maintenance"
    ARCHIVED = "archived"


class BookingStatus(str, Enum):
    INQUIRY = "inquiry"
    RESERVED = "reserved"
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    CHECKED_OUT = "checked_out"
    CANCELLED = "cancelled"


class RentalTaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    CANCELLED = "cancelled"


class RentalOwnerCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None


class RentalOwner(RentalOwnerCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    created_by: str
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class RentalPropertyCreate(BaseModel):
    title: str
    owner_id: Optional[str] = None
    address: Optional[str] = None
    zone: Optional[str] = None
    operation_type: OperationType = OperationType.RENT
    rental_type: RentalType = RentalType.SHORT_TERM
    status: RentalPropertyStatus = RentalPropertyStatus.ACTIVE
    bedrooms: int = 1
    bathrooms: float = 1
    max_guests: int = 2
    nightly_price_mxn: float = 0.0
    monthly_price_mxn: float = 0.0
    cleaning_fee_mxn: float = 0.0
    deposit_mxn: float = 0.0
    commission_rate: float = 0.20
    platforms: List[str] = []
    amenities: List[str] = []
    images: List[MediaAsset] = []
    notes: Optional[str] = None


class RentalPropertyUpdate(BaseModel):
    title: Optional[str] = None
    owner_id: Optional[str] = None
    address: Optional[str] = None
    zone: Optional[str] = None
    operation_type: Optional[OperationType] = None
    rental_type: Optional[RentalType] = None
    status: Optional[RentalPropertyStatus] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    max_guests: Optional[int] = None
    nightly_price_mxn: Optional[float] = None
    monthly_price_mxn: Optional[float] = None
    cleaning_fee_mxn: Optional[float] = None
    deposit_mxn: Optional[float] = None
    commission_rate: Optional[float] = None
    platforms: Optional[List[str]] = None
    amenities: Optional[List[str]] = None
    images: Optional[List[MediaAsset]] = None
    notes: Optional[str] = None


class RentalProperty(RentalPropertyCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    created_by: str
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class RentalGuestCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    nationality: Optional[str] = None
    document_id: Optional[str] = None
    notes: Optional[str] = None


class RentalGuest(RentalGuestCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    created_by: str
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class RentalStaffCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: str = "Operaciones"
    responsibilities: List[str] = []
    specialties: List[str] = []
    status: str = "active"
    notes: Optional[str] = None


class RentalStaffUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    responsibilities: Optional[List[str]] = None
    specialties: Optional[List[str]] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class RentalStaff(RentalStaffCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    created_by: str
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class RentalBookingCreate(BaseModel):
    property_id: str
    guest_id: Optional[str] = None
    guest_name: str
    guest_email: Optional[EmailStr] = None
    guest_phone: Optional[str] = None
    source: str = "direct"
    check_in: datetime
    check_out: datetime
    guests_count: int = 1
    status: BookingStatus = BookingStatus.RESERVED
    total_amount_mxn: float = 0.0
    paid_amount_mxn: float = 0.0
    cleaning_fee_mxn: float = 0.0
    deposit_mxn: float = 0.0
    platform_fee_mxn: float = 0.0
    notes: Optional[str] = None


class RentalBookingUpdate(BaseModel):
    property_id: Optional[str] = None
    guest_id: Optional[str] = None
    guest_name: Optional[str] = None
    guest_email: Optional[EmailStr] = None
    guest_phone: Optional[str] = None
    source: Optional[str] = None
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    guests_count: Optional[int] = None
    status: Optional[BookingStatus] = None
    total_amount_mxn: Optional[float] = None
    paid_amount_mxn: Optional[float] = None
    cleaning_fee_mxn: Optional[float] = None
    deposit_mxn: Optional[float] = None
    platform_fee_mxn: Optional[float] = None
    notes: Optional[str] = None


class RentalBooking(RentalBookingCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    created_by: str
    nights: int = 0
    balance_due_mxn: float = 0.0
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class RentalCalendarEventCreate(BaseModel):
    property_id: str
    title: Optional[str] = None
    event_type: str = "blocked"
    start_date: datetime
    end_date: datetime
    status: str = "active"
    source: str = "manual"
    notes: Optional[str] = None


class RentalCalendarEventUpdate(BaseModel):
    property_id: Optional[str] = None
    title: Optional[str] = None
    event_type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None


class RentalCalendarEvent(RentalCalendarEventCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    created_by: str
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class RentalExpenseCreate(BaseModel):
    property_id: str
    booking_id: Optional[str] = None
    staff_id: Optional[str] = None
    category: str = "maintenance"
    amount_mxn: float
    description: str
    expense_date: datetime = Field(default_factory=now_utc)
    vendor: Optional[str] = None
    payment_method: str = "transfer"
    status: str = "paid"
    receipt_url: Optional[str] = None
    notes: Optional[str] = None


class RentalExpenseUpdate(BaseModel):
    property_id: Optional[str] = None
    booking_id: Optional[str] = None
    staff_id: Optional[str] = None
    category: Optional[str] = None
    amount_mxn: Optional[float] = None
    description: Optional[str] = None
    expense_date: Optional[datetime] = None
    vendor: Optional[str] = None
    payment_method: Optional[str] = None
    status: Optional[str] = None
    receipt_url: Optional[str] = None
    notes: Optional[str] = None


class RentalExpense(RentalExpenseCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    created_by: str
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class RentalExternalSaleCreate(BaseModel):
    property_id: Optional[str] = None
    booking_id: Optional[str] = None
    staff_id: Optional[str] = None
    guest_name: Optional[str] = None
    concept: str
    amount_mxn: float
    sale_date: datetime = Field(default_factory=now_utc)
    payment_method: str = "transfer"
    status: str = "collected"
    source: str = "manual"
    notes: Optional[str] = None


class RentalExternalSaleUpdate(BaseModel):
    property_id: Optional[str] = None
    booking_id: Optional[str] = None
    staff_id: Optional[str] = None
    guest_name: Optional[str] = None
    concept: Optional[str] = None
    amount_mxn: Optional[float] = None
    sale_date: Optional[datetime] = None
    payment_method: Optional[str] = None
    status: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None


class RentalExternalSale(RentalExternalSaleCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    created_by: str
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class RentalCashClosureCreate(BaseModel):
    closure_date: datetime = Field(default_factory=now_utc)
    responsible_staff_id: Optional[str] = None
    notes: Optional[str] = None


class RentalCashClosureUpdate(BaseModel):
    responsible_staff_id: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class RentalCashClosure(RentalCashClosureCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    created_by: str
    status: str = "closed"
    bookings_collected_mxn: float = 0.0
    external_sales_mxn: float = 0.0
    expenses_paid_mxn: float = 0.0
    expenses_pending_mxn: float = 0.0
    balance_due_mxn: float = 0.0
    net_mxn: float = 0.0
    snapshot: dict = {}
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class RentalTaskCreate(BaseModel):
    property_id: str
    booking_id: Optional[str] = None
    assigned_staff_id: Optional[str] = None
    task_type: str = "cleaning"
    title: str
    due_at: Optional[datetime] = None
    priority: str = "medium"
    assigned_to: Optional[str] = None
    schedule_type: str = "one_time"
    recurrence_rule: Optional[str] = None
    linked_event_type: Optional[str] = None
    next_due_at: Optional[datetime] = None
    status: RentalTaskStatus = RentalTaskStatus.TODO
    notes: Optional[str] = None


class RentalTaskUpdate(BaseModel):
    property_id: Optional[str] = None
    booking_id: Optional[str] = None
    assigned_staff_id: Optional[str] = None
    task_type: Optional[str] = None
    title: Optional[str] = None
    due_at: Optional[datetime] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    schedule_type: Optional[str] = None
    recurrence_rule: Optional[str] = None
    linked_event_type: Optional[str] = None
    next_due_at: Optional[datetime] = None
    status: Optional[RentalTaskStatus] = None
    notes: Optional[str] = None


class RentalTask(RentalTaskCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    created_by: str
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


# ==================== VIBE LAB ====================

class VibeSegment(str, Enum):
    BUY_SELL = "buy_sell"
    WOMEN_FAMILY = "women_family"
    WELLNESS = "wellness"
    BUSINESS = "business"
    EXPATS_FOODIES = "expats_foodies"
    OTHER = "other"


class OutreachMode(str, Enum):
    MANUAL_PERMISSION = "manual_permission"
    SEMI_AUTOMATED = "semi_automated"
    AGGRESSIVE_CONTROLLED = "aggressive_controlled"


class AudienceGroupCreate(BaseModel):
    name: str
    link: Optional[str] = None
    group_type: Optional[str] = None
    platform: str = "WhatsApp"
    segment: VibeSegment = VibeSegment.OTHER
    is_full: bool = False
    is_excluded: bool = False
    exclusion_reason: Optional[str] = None
    score: int = 0
    best_offer_type: Optional[str] = None
    proposed_value: Optional[str] = None
    notes: Optional[str] = None
    source_file: Optional[str] = None
    tags: List[str] = []
    metadata: Dict[str, Any] = {}


class AudienceGroup(AudienceGroupCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    created_by: str
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class VibeOfferCreate(BaseModel):
    title: str
    offer_type: str
    segment: VibeSegment = VibeSegment.OTHER
    target_segments: List[VibeSegment] = []
    description: str
    value_prop: str
    price_mxn: float = 0.0
    delivery_minutes: int = 30
    cta: str = "Responder INFO"
    payment_link: Optional[str] = None
    fulfillment_prompt: Optional[str] = None
    assets: List[Dict[str, Any]] = []
    tags: List[str] = []
    is_active: bool = True


class VibeOffer(VibeOfferCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    created_by: str
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class VibeExperimentVariant(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    key: str = "A"
    name: str
    copy_text: str = Field(alias="copy")
    asset_url: Optional[str] = None
    cta: str = "Responder INFO"
    utm_code: Optional[str] = None
    expected_signal: Optional[str] = None


class VibeExperimentStatus(str, Enum):
    DRAFT = "draft"
    READY = "ready"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"


class VibeExperimentCreate(BaseModel):
    name: str
    offer_id: Optional[str] = None
    segment: VibeSegment = VibeSegment.OTHER
    audience_group_ids: List[str] = []
    outreach_mode: OutreachMode = OutreachMode.MANUAL_PERMISSION
    status: VibeExperimentStatus = VibeExperimentStatus.DRAFT
    hypothesis: str = ""
    success_metric: str = "payments"
    landing_url: Optional[str] = None
    variants: List[VibeExperimentVariant] = []
    planned_start_at: Optional[datetime] = None


class VibeExperiment(VibeExperimentCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    created_by: str
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class VibePostStatus(str, Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    PUBLISHED_MANUAL = "published_manual"
    SKIPPED = "skipped"


class VibePostCreate(BaseModel):
    experiment_id: str
    audience_group_id: str
    variant_key: str = "A"
    outreach_mode: OutreachMode = OutreachMode.MANUAL_PERMISSION
    message: str
    status: VibePostStatus = VibePostStatus.DRAFT
    requires_approval: bool = True
    approval_warning: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    metadata: Dict[str, Any] = {}


class VibePost(VibePostCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    created_by: str
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class ExperimentMetricCreate(BaseModel):
    experiment_id: str
    post_id: Optional[str] = None
    audience_group_id: Optional[str] = None
    variant_key: str = "A"
    replies: int = 0
    clicks: int = 0
    payments: int = 0
    revenue_mxn: float = 0.0
    refunds: int = 0
    complaints: int = 0
    delivery_minutes_avg: Optional[float] = None
    notes: Optional[str] = None
    recorded_at: datetime = Field(default_factory=now_utc)


class ExperimentMetric(ExperimentMetricCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    created_by: str
    created_at: datetime = Field(default_factory=now_utc)


class LeadProductInterestType(str, Enum):
    PRINCIPAL = "principal"
    SECUNDARIO = "secundario"
    UPSELL = "upsell"
    CROSS_SELL = "cross_sell"


class LeadProductInterestStatus(str, Enum):
    NUEVO_INTERES = "nuevo_interes"
    CONTACTADO = "contactado"
    ENVIO_INFO = "envio_info"
    VISITA_AGENDADA = "visita_agendada"
    NEGOCIACION = "negociacion"
    DESCARTADO = "descartado"
    CERRADO = "cerrado"


class LeadProductInterestCreate(BaseModel):
    lead_id: str
    product_id: str
    interest_type: LeadProductInterestType = LeadProductInterestType.PRINCIPAL
    interest_status: LeadProductInterestStatus = LeadProductInterestStatus.NUEVO_INTERES
    priority: LeadPriority = LeadPriority.MEDIA
    source: str = "manual"
    notes: Optional[str] = None


class LeadProductInterestUpdate(BaseModel):
    interest_type: Optional[LeadProductInterestType] = None
    interest_status: Optional[LeadProductInterestStatus] = None
    priority: Optional[LeadPriority] = None
    source: Optional[str] = None
    notes: Optional[str] = None


class LeadProductInterest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    product_tenant_id: str
    lead_id: str
    product_id: str
    interest_type: LeadProductInterestType = LeadProductInterestType.PRINCIPAL
    interest_status: LeadProductInterestStatus = LeadProductInterestStatus.NUEVO_INTERES
    priority: LeadPriority = LeadPriority.MEDIA
    source: str = "manual"
    notes: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


# ==================== APIFY/SCRAPING ====================

class ApifyJobRecord(BaseModel):
    """Registro de job de scraping de Apify"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    tenant_id: str
    job_id: str  # ID del job en Apify
    actor_id: str  # Actor de Apify usado
    input_params: Dict[str, Any]  # Parámetros de búsqueda
    status: str  # running, completed, failed, timed_out
    total_results: int = 0
    processed_results: int = 0
    results_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=now_utc)
    completed_at: Optional[datetime] = None


class ScrapedLead(BaseModel):
    """Lead extraído por scraping"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    apify_job_id: str
    tenant_id: str
    # Datos del lead
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    profile_url: Optional[str] = None
    photo_url: Optional[str] = None
    location: Optional[str] = None
    # Análisis IA
    ai_analysis: Optional[Dict[str, Any]] = None
    potential_score: int = 50  # 0-100
    potential_reason: Optional[str] = None
    # Estado
    saved_to_pipeline: bool = False
    lead_id: Optional[str] = None  # ID si fue guardado en Leads
    created_at: datetime = Field(default_factory=now_utc)
