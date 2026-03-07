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
    account_type: str = "individual"  # individual, agency

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    created_at: datetime = Field(default_factory=now_utc)
    onboarding_completed: bool = False
    tenant_id: str = ""
    account_type: str = "individual"  # individual, agency

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    onboarding_completed: bool
    account_type: str = "individual"

# Goals/KPIs Models
class GoalCreate(BaseModel):
    ventas_mes: int = 5
    ingresos_objetivo: float = 500000.0
    leads_contactados: int = 50
    tasa_conversion: float = 10.0
    apartados_mes: int = 10
    periodo: str = "mensual"

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
    source: str = "web"
    budget_mxn: float = 0.0
    property_interest: Optional[str] = None
    notes: Optional[str] = None
    assigned_broker_id: Optional[str] = None

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: Optional[LeadStatus] = None
    priority: Optional[LeadPriority] = None
    source: Optional[str] = None
    budget_mxn: Optional[float] = None
    property_interest: Optional[str] = None
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
    budget_mxn: float = 0.0
    property_interest: Optional[str] = None
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
    token_type: str = "bearer"
    user: UserResponse

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
    """Settings for external integrations (VAPI, Twilio, SendGrid, Google Calendar)"""
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
    # SendGrid Settings
    sendgrid_api_key: Optional[str] = None
    sendgrid_sender_email: Optional[str] = None
    sendgrid_sender_name: Optional[str] = None
    # Google Calendar Settings
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_tokens: Optional[Dict[str, Any]] = None
    google_calendar_email: Optional[str] = None
    # Status
    vapi_enabled: bool = False
    twilio_enabled: bool = False
    sendgrid_enabled: bool = False
    google_calendar_enabled: bool = False
    updated_at: datetime = Field(default_factory=now_utc)

class IntegrationSettingsUpdate(BaseModel):
    """Update model for integration settings"""
    vapi_api_key: Optional[str] = None
    vapi_phone_number_id: Optional[str] = None
    vapi_assistant_id: Optional[str] = None
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None
    sendgrid_api_key: Optional[str] = None
    sendgrid_sender_email: Optional[str] = None
    sendgrid_sender_name: Optional[str] = None
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None

# ==================== CAMPAIGNS ====================

class CampaignType(str, Enum):
    CALL = "call"
    SMS = "sms"
    EMAIL = "email"

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
    twilio_sid: Optional[str] = None
    status: SMSStatus = SMSStatus.QUEUED
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
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
    sendgrid_id: Optional[str] = None
    status: EmailStatus = EmailStatus.QUEUED
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=now_utc)


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
