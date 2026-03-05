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
    notes: Optional[str] = None
    assigned_broker_id: Optional[str] = None
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

class CalendarEvent(CalendarEventCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    tenant_id: str
    completed: bool = False
    created_at: datetime = Field(default_factory=now_utc)



# ==================== INTEGRATION SETTINGS ====================

class IntegrationSettings(BaseModel):
    """Settings for external integrations (VAPI, Twilio)"""
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
    # Status
    vapi_enabled: bool = False
    twilio_enabled: bool = False
    updated_at: datetime = Field(default_factory=now_utc)

class IntegrationSettingsUpdate(BaseModel):
    """Update model for integration settings"""
    vapi_api_key: Optional[str] = None
    vapi_phone_number_id: Optional[str] = None
    vapi_assistant_id: Optional[str] = None
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None

# ==================== CAMPAIGNS ====================

class CampaignType(str, Enum):
    CALL = "call"
    SMS = "sms"

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
