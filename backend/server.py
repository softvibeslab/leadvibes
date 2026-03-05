from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid
import random

from models import (
    User, UserCreate, UserLogin, UserResponse, TokenResponse,
    Goal, GoalCreate,
    Lead, LeadCreate, LeadUpdate, LeadStatus, LeadPriority,
    Activity, ActivityCreate, ActivityType,
    GamificationRule, GamificationRuleCreate, BrokerStats, PointLedger,
    ChatMessage, ChatMessageCreate,
    Script, ScriptCreate,
    DashboardStats,
    CalendarEventCreate, CalendarEvent,
    IntegrationSettings, IntegrationSettingsUpdate,
    Campaign, CampaignCreate, CampaignType, CampaignStatus,
    CallRecord, CallRecordCreate, CallStatus,
    SMSRecord, SMSRecordCreate, SMSStatus,
    ConversationAnalysis,
    EmailRecord, EmailRecordCreate, EmailStatus,
    EmailTemplate, EmailTemplateCreate
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, require_role
)
from ai_service import get_ai_response, analyze_lead, generate_sales_script
from seed_data import (
    SEED_BROKERS, SEED_LEADS, SEED_GAMIFICATION_RULES, SEED_SCRIPTS,
    generate_seed_activities, generate_seed_points
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Rovi CRM API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Helper functions
def serialize_doc(doc: dict) -> dict:
    """Remove MongoDB _id and convert datetime objects"""
    if doc is None:
        return None
    result = {k: v for k, v in doc.items() if k != '_id'}
    for key, value in result.items():
        if isinstance(value, datetime):
            result[key] = value.isoformat()
    return result

async def get_or_create_tenant(user_id: str) -> str:
    """Get or create tenant for user"""
    return f"tenant-{user_id[:8]}"

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    # Create user
    user_id = str(uuid.uuid4())
    tenant_id = f"tenant-{user_id[:8]}"
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "role": user_data.role,
        "phone": user_data.phone,
        "password_hash": get_password_hash(user_data.password),
        "avatar_url": None,
        "is_active": True,
        "onboarding_completed": False,
        "tenant_id": tenant_id,
        "account_type": user_data.account_type,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Seed default gamification rules for new tenant
    for rule in SEED_GAMIFICATION_RULES:
        rule_doc = {**rule, "tenant_id": tenant_id, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()}
        await db.gamification_rules.update_one(
            {"id": rule["id"], "tenant_id": tenant_id},
            {"$set": rule_doc},
            upsert=True
        )
    
    # Seed default scripts
    for script in SEED_SCRIPTS:
        script_doc = {
            **script,
            "tenant_id": tenant_id,
            "created_by": user_id,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.scripts.update_one(
            {"id": script["id"], "tenant_id": tenant_id},
            {"$set": script_doc},
            upsert=True
        )
    
    # Create token
    token = create_access_token({
        "sub": user_id,
        "tenant_id": tenant_id,
        "email": user_data.email,
        "role": user_data.role,
        "name": user_data.name
    })
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            role=user_data.role,
            phone=user_data.phone,
            is_active=True,
            onboarding_completed=False,
            account_type=user_data.account_type
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login user"""
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    token = create_access_token({
        "sub": user["id"],
        "tenant_id": user["tenant_id"],
        "email": user["email"],
        "role": user["role"],
        "name": user["name"]
    })
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            avatar_url=user.get("avatar_url"),
            phone=user.get("phone"),
            is_active=user["is_active"],
            onboarding_completed=user.get("onboarding_completed", False),
            account_type=user.get("account_type", "individual")
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        avatar_url=user.get("avatar_url"),
        phone=user.get("phone"),
        is_active=user["is_active"],
        onboarding_completed=user.get("onboarding_completed", False),
        account_type=user.get("account_type", "individual")
    )

# ==================== GOALS/ONBOARDING ROUTES ====================

@api_router.post("/goals", response_model=dict)
async def create_or_update_goals(goals_data: GoalCreate, current_user: dict = Depends(get_current_user)):
    """Create or update user goals (onboarding)"""
    goal_id = str(uuid.uuid4())
    goal_doc = {
        "id": goal_id,
        "user_id": current_user["user_id"],
        "tenant_id": current_user["tenant_id"],
        **goals_data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Upsert goal
    await db.goals.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": goal_doc},
        upsert=True
    )
    
    # Mark onboarding as complete
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"onboarding_completed": True}}
    )
    
    return {"message": "Metas guardadas exitosamente", "goal_id": goal_id}

@api_router.get("/goals", response_model=dict)
async def get_goals(current_user: dict = Depends(get_current_user)):
    """Get user goals"""
    goal = await db.goals.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not goal:
        return {
            "ventas_mes": 5,
            "ingresos_objetivo": 500000,
            "leads_contactados": 50,
            "tasa_conversion": 10,
            "apartados_mes": 10,
            "periodo": "mensual"
        }
    return serialize_doc(goal)

# ==================== DASHBOARD ROUTES ====================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Get dashboard statistics"""
    tenant_id = current_user["tenant_id"]
    
    # Get goals
    goal = await db.goals.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    ventas_goal = goal.get("ventas_mes", 5) if goal else 5
    apartados_goal = goal.get("apartados_mes", 10) if goal else 10
    
    # Count stats
    leads_nuevos = await db.leads.count_documents({"tenant_id": tenant_id, "status": "nuevo"})
    ventas = await db.leads.count_documents({"tenant_id": tenant_id, "status": "venta"})
    apartados = await db.leads.count_documents({"tenant_id": tenant_id, "status": "apartado"})
    total_leads = await db.leads.count_documents({"tenant_id": tenant_id})
    brokers_activos = await db.users.count_documents({"tenant_id": tenant_id, "is_active": True, "role": {"$in": ["broker", "manager"]}})
    
    # Calculate total points for user/tenant
    pipeline = [
        {"$match": {"tenant_id": tenant_id}},
        {"$group": {"_id": None, "total": {"$sum": "$points"}}}
    ]
    points_result = await db.point_ledger.aggregate(pipeline).to_list(1)
    total_points = points_result[0]["total"] if points_result else 0
    
    # Calculate conversion rate
    conversion_rate = (ventas / total_leads * 100) if total_leads > 0 else 0
    
    # Points goal (based on activities)
    points_goal = ventas_goal * 30 + apartados_goal * 15 + 50  # Estimated monthly goal
    
    return DashboardStats(
        total_points=total_points,
        points_goal=points_goal,
        points_progress=(total_points / points_goal * 100) if points_goal > 0 else 0,
        apartados=apartados,
        apartados_goal=apartados_goal,
        ventas=ventas,
        ventas_goal=ventas_goal,
        brokers_activos=brokers_activos,
        leads_nuevos=leads_nuevos,
        conversion_rate=round(conversion_rate, 1)
    )

@api_router.get("/dashboard/leaderboard", response_model=List[BrokerStats])
async def get_leaderboard(current_user: dict = Depends(get_current_user)):
    """Get monthly leaderboard"""
    tenant_id = current_user["tenant_id"]
    
    # Get all brokers
    brokers = await db.users.find(
        {"tenant_id": tenant_id, "role": {"$in": ["broker", "manager"]}},
        {"_id": 0}
    ).to_list(100)
    
    leaderboard = []
    for broker in brokers:
        # Get points
        pipeline = [
            {"$match": {"tenant_id": tenant_id, "broker_id": broker["id"]}},
            {"$group": {"_id": None, "total": {"$sum": "$points"}}}
        ]
        points_result = await db.point_ledger.aggregate(pipeline).to_list(1)
        total_points = points_result[0]["total"] if points_result else 0
        
        # Get activity counts
        ventas = await db.leads.count_documents({"tenant_id": tenant_id, "assigned_broker_id": broker["id"], "status": "venta"})
        apartados = await db.leads.count_documents({"tenant_id": tenant_id, "assigned_broker_id": broker["id"], "status": "apartado"})
        leads_asignados = await db.leads.count_documents({"tenant_id": tenant_id, "assigned_broker_id": broker["id"]})
        llamadas = await db.activities.count_documents({"tenant_id": tenant_id, "broker_id": broker["id"], "activity_type": "llamada"})
        presentaciones = await db.activities.count_documents({"tenant_id": tenant_id, "broker_id": broker["id"], "activity_type": "zoom"})
        
        leaderboard.append(BrokerStats(
            broker_id=broker["id"],
            broker_name=broker["name"],
            avatar_url=broker.get("avatar_url"),
            total_points=total_points,
            ventas=ventas,
            apartados=apartados,
            leads_asignados=leads_asignados,
            llamadas=llamadas,
            presentaciones=presentaciones,
            rank=0,
            month_progress=min(100, total_points / 100 * 100)  # Assuming 100 points is monthly goal
        ))
    
    # Sort by points and assign ranks
    leaderboard.sort(key=lambda x: x.total_points, reverse=True)
    for i, broker in enumerate(leaderboard):
        broker.rank = i + 1
    
    return leaderboard

@api_router.get("/dashboard/recent-activity", response_model=List[dict])
async def get_recent_activity(limit: int = 10, current_user: dict = Depends(get_current_user)):
    """Get recent activities"""
    tenant_id = current_user["tenant_id"]
    
    activities = await db.activities.find(
        {"tenant_id": tenant_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Enrich with broker and lead names
    for activity in activities:
        broker = await db.users.find_one({"id": activity.get("broker_id")}, {"_id": 0, "name": 1})
        lead = await db.leads.find_one({"id": activity.get("lead_id")}, {"_id": 0, "name": 1})
        activity["broker_name"] = broker["name"] if broker else "Desconocido"
        activity["lead_name"] = lead["name"] if lead else "Desconocido"
    
    return [serialize_doc(a) for a in activities]

# ==================== LEADS ROUTES ====================

@api_router.get("/leads", response_model=List[dict])
async def get_leads(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_broker_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all leads with filters"""
    tenant_id = current_user["tenant_id"]
    
    query = {"tenant_id": tenant_id}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if assigned_broker_id:
        query["assigned_broker_id"] = assigned_broker_id
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    
    leads = await db.leads.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [serialize_doc(l) for l in leads]

@api_router.get("/leads/{lead_id}", response_model=dict)
async def get_lead(lead_id: str, current_user: dict = Depends(get_current_user)):
    """Get single lead with details"""
    lead = await db.leads.find_one(
        {"id": lead_id, "tenant_id": current_user["tenant_id"]},
        {"_id": 0}
    )
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    
    # Get activities
    activities = await db.activities.find(
        {"lead_id": lead_id, "tenant_id": current_user["tenant_id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    # Get assigned broker info
    broker = None
    if lead.get("assigned_broker_id"):
        broker = await db.users.find_one(
            {"id": lead["assigned_broker_id"]},
            {"_id": 0, "id": 1, "name": 1, "avatar_url": 1, "email": 1}
        )
    
    result = serialize_doc(lead)
    result["activities"] = [serialize_doc(a) for a in activities]
    result["assigned_broker"] = serialize_doc(broker) if broker else None
    
    return result

@api_router.post("/leads", response_model=dict)
async def create_lead(lead_data: LeadCreate, current_user: dict = Depends(get_current_user)):
    """Create new lead"""
    lead_id = str(uuid.uuid4())
    lead_doc = {
        "id": lead_id,
        "tenant_id": current_user["tenant_id"],
        **lead_data.model_dump(),
        "status": "nuevo",
        "priority": "media",
        "intent_score": 50,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.leads.insert_one(lead_doc)
    return {"message": "Lead creado exitosamente", "id": lead_id}

@api_router.put("/leads/{lead_id}", response_model=dict)
async def update_lead(lead_id: str, lead_data: LeadUpdate, current_user: dict = Depends(get_current_user)):
    """Update lead"""
    update_dict = {k: v for k, v in lead_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.leads.update_one(
        {"id": lead_id, "tenant_id": current_user["tenant_id"]},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    
    return {"message": "Lead actualizado exitosamente"}

@api_router.post("/leads/{lead_id}/analyze", response_model=dict)
async def analyze_lead_ai(lead_id: str, current_user: dict = Depends(get_current_user)):
    """Analyze lead with AI"""
    lead = await db.leads.find_one(
        {"id": lead_id, "tenant_id": current_user["tenant_id"]},
        {"_id": 0}
    )
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    
    analysis = await analyze_lead(lead)
    
    # Update lead with analysis
    await db.leads.update_one(
        {"id": lead_id},
        {"$set": {
            "ai_analysis": analysis,
            "intent_score": analysis.get("intent_score", 50),
            "next_action": analysis.get("next_action"),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return analysis

@api_router.post("/leads/{lead_id}/generate-script", response_model=dict)
async def generate_lead_script(
    lead_id: str,
    script_type: str = "apertura",
    current_user: dict = Depends(get_current_user)
):
    """Generate personalized sales script for lead"""
    lead = await db.leads.find_one(
        {"id": lead_id, "tenant_id": current_user["tenant_id"]},
        {"_id": 0}
    )
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    
    script = await generate_sales_script(lead, script_type)
    return {"script": script, "type": script_type}

# ==================== ACTIVITIES ROUTES ====================

@api_router.post("/activities", response_model=dict)
async def create_activity(activity_data: ActivityCreate, current_user: dict = Depends(get_current_user)):
    """Create new activity and award points"""
    activity_id = str(uuid.uuid4())
    
    # Get points for this activity type
    rule = await db.gamification_rules.find_one(
        {"tenant_id": current_user["tenant_id"], "action": activity_data.activity_type},
        {"_id": 0}
    )
    points_earned = rule["points"] if rule else 0
    
    activity_doc = {
        "id": activity_id,
        "tenant_id": current_user["tenant_id"],
        "broker_id": current_user["user_id"],
        **activity_data.model_dump(),
        "points_earned": points_earned,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.activities.insert_one(activity_doc)
    
    # Record points in ledger
    if points_earned > 0:
        point_doc = {
            "id": str(uuid.uuid4()),
            "broker_id": current_user["user_id"],
            "points": points_earned,
            "action": activity_data.activity_type,
            "description": f"Puntos por {activity_data.activity_type}",
            "lead_id": activity_data.lead_id,
            "activity_id": activity_id,
            "tenant_id": current_user["tenant_id"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.point_ledger.insert_one(point_doc)
    
    # Update lead's last contact
    await db.leads.update_one(
        {"id": activity_data.lead_id},
        {"$set": {
            "last_contact": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Actividad registrada", "id": activity_id, "points_earned": points_earned}

@api_router.get("/activities", response_model=List[dict])
async def get_activities(
    lead_id: Optional[str] = None,
    broker_id: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get activities with filters"""
    query = {"tenant_id": current_user["tenant_id"]}
    if lead_id:
        query["lead_id"] = lead_id
    if broker_id:
        query["broker_id"] = broker_id
    
    activities = await db.activities.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return [serialize_doc(a) for a in activities]

# ==================== BROKERS ROUTES ====================

@api_router.get("/brokers", response_model=List[dict])
async def get_brokers(current_user: dict = Depends(get_current_user)):
    """Get all brokers"""
    brokers = await db.users.find(
        {"tenant_id": current_user["tenant_id"], "role": {"$in": ["broker", "manager"]}},
        {"_id": 0, "password_hash": 0}
    ).to_list(100)
    
    result = []
    for broker in brokers:
        # Get stats
        leads_count = await db.leads.count_documents({"assigned_broker_id": broker["id"]})
        pipeline = [
            {"$match": {"broker_id": broker["id"]}},
            {"$group": {"_id": None, "total": {"$sum": "$points"}}}
        ]
        points_result = await db.point_ledger.aggregate(pipeline).to_list(1)
        total_points = points_result[0]["total"] if points_result else 0
        
        broker_data = serialize_doc(broker)
        broker_data["leads_asignados"] = leads_count
        broker_data["total_points"] = total_points
        result.append(broker_data)
    
    return result

@api_router.get("/brokers/{broker_id}", response_model=dict)
async def get_broker(broker_id: str, current_user: dict = Depends(get_current_user)):
    """Get broker details"""
    broker = await db.users.find_one(
        {"id": broker_id, "tenant_id": current_user["tenant_id"]},
        {"_id": 0, "password_hash": 0}
    )
    if not broker:
        raise HTTPException(status_code=404, detail="Broker no encontrado")
    
    # Get detailed stats
    ventas = await db.leads.count_documents({"assigned_broker_id": broker_id, "status": "venta"})
    apartados = await db.leads.count_documents({"assigned_broker_id": broker_id, "status": "apartado"})
    leads_total = await db.leads.count_documents({"assigned_broker_id": broker_id})
    
    # Get activity breakdown
    llamadas = await db.activities.count_documents({"broker_id": broker_id, "activity_type": "llamada"})
    zooms = await db.activities.count_documents({"broker_id": broker_id, "activity_type": "zoom"})
    visitas = await db.activities.count_documents({"broker_id": broker_id, "activity_type": "visita"})
    
    # Get points
    pipeline = [
        {"$match": {"broker_id": broker_id}},
        {"$group": {"_id": None, "total": {"$sum": "$points"}}}
    ]
    points_result = await db.point_ledger.aggregate(pipeline).to_list(1)
    total_points = points_result[0]["total"] if points_result else 0
    
    result = serialize_doc(broker)
    result["stats"] = {
        "ventas": ventas,
        "apartados": apartados,
        "leads_total": leads_total,
        "llamadas": llamadas,
        "zooms": zooms,
        "visitas": visitas,
        "total_points": total_points
    }
    
    return result

# ==================== GAMIFICATION ROUTES ====================

@api_router.get("/gamification/rules", response_model=List[dict])
async def get_gamification_rules(current_user: dict = Depends(get_current_user)):
    """Get gamification rules"""
    rules = await db.gamification_rules.find(
        {"tenant_id": current_user["tenant_id"], "is_active": True},
        {"_id": 0}
    ).to_list(100)
    return [serialize_doc(r) for r in rules]

@api_router.post("/gamification/rules", response_model=dict)
async def create_gamification_rule(
    rule_data: GamificationRuleCreate,
    current_user: dict = Depends(require_role(["admin", "manager"]))
):
    """Create new gamification rule"""
    rule_id = str(uuid.uuid4())
    rule_doc = {
        "id": rule_id,
        "tenant_id": current_user["tenant_id"],
        **rule_data.model_dump(),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.gamification_rules.insert_one(rule_doc)
    return {"message": "Regla creada exitosamente", "id": rule_id}

@api_router.get("/gamification/points", response_model=List[dict])
async def get_point_ledger(
    broker_id: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get point ledger"""
    query = {"tenant_id": current_user["tenant_id"]}
    if broker_id:
        query["broker_id"] = broker_id
    
    points = await db.point_ledger.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return [serialize_doc(p) for p in points]

# ==================== CHAT/AI ROUTES ====================

@api_router.post("/chat", response_model=dict)
async def chat_with_ai(message: ChatMessageCreate, current_user: dict = Depends(get_current_user)):
    """Chat with AI assistant"""
    user_id = current_user["user_id"]
    tenant_id = current_user["tenant_id"]
    session_id = f"chat-{user_id}"
    
    # Save user message
    user_msg_id = str(uuid.uuid4())
    user_msg_doc = {
        "id": user_msg_id,
        "user_id": user_id,
        "tenant_id": tenant_id,
        "role": "user",
        "content": message.content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_messages.insert_one(user_msg_doc)
    
    # Get context for AI
    goal = await db.goals.find_one({"user_id": user_id}, {"_id": 0})
    
    # Get dashboard stats for context
    ventas = await db.leads.count_documents({"tenant_id": tenant_id, "status": "venta"})
    apartados = await db.leads.count_documents({"tenant_id": tenant_id, "status": "apartado"})
    
    pipeline = [
        {"$match": {"tenant_id": tenant_id}},
        {"$group": {"_id": None, "total": {"$sum": "$points"}}}
    ]
    points_result = await db.point_ledger.aggregate(pipeline).to_list(1)
    total_points = points_result[0]["total"] if points_result else 0
    
    context = {
        "user_goals": goal,
        "stats": {
            "total_points": total_points,
            "ventas": ventas,
            "apartados": apartados
        }
    }
    
    # Get AI response
    ai_response = await get_ai_response(message.content, session_id, context)
    
    # Save AI response
    ai_msg_id = str(uuid.uuid4())
    ai_msg_doc = {
        "id": ai_msg_id,
        "user_id": user_id,
        "tenant_id": tenant_id,
        "role": "assistant",
        "content": ai_response,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_messages.insert_one(ai_msg_doc)
    
    return {
        "id": ai_msg_id,
        "content": ai_response,
        "role": "assistant"
    }

@api_router.get("/chat/history", response_model=List[dict])
async def get_chat_history(limit: int = 50, current_user: dict = Depends(get_current_user)):
    """Get chat history"""
    messages = await db.chat_messages.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Reverse to get chronological order
    messages.reverse()
    return [serialize_doc(m) for m in messages]

# ==================== SCRIPTS ROUTES ====================

@api_router.get("/scripts", response_model=List[dict])
async def get_scripts(
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get sales scripts"""
    query = {"tenant_id": current_user["tenant_id"], "is_active": True}
    if category:
        query["category"] = category
    
    scripts = await db.scripts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [serialize_doc(s) for s in scripts]

@api_router.post("/scripts", response_model=dict)
async def create_script(script_data: ScriptCreate, current_user: dict = Depends(get_current_user)):
    """Create new script"""
    script_id = str(uuid.uuid4())
    script_doc = {
        "id": script_id,
        "tenant_id": current_user["tenant_id"],
        "created_by": current_user["user_id"],
        **script_data.model_dump(),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.scripts.insert_one(script_doc)
    return {"message": "Script creado exitosamente", "id": script_id}

@api_router.get("/scripts/{script_id}", response_model=dict)
async def get_script(script_id: str, current_user: dict = Depends(get_current_user)):
    """Get single script"""
    script = await db.scripts.find_one(
        {"id": script_id, "tenant_id": current_user["tenant_id"]},
        {"_id": 0}
    )
    if not script:
        raise HTTPException(status_code=404, detail="Script no encontrado")
    return serialize_doc(script)

# ==================== SEED DATA ROUTE ====================

@api_router.post("/seed", response_model=dict)
async def seed_demo_data(current_user: dict = Depends(get_current_user)):
    """Seed demo data for the tenant"""
    tenant_id = current_user["tenant_id"]
    
    # Seed brokers (as users)
    for broker in SEED_BROKERS:
        broker_doc = {**broker, "tenant_id": tenant_id, "created_at": datetime.now(timezone.utc).isoformat()}
        await db.users.update_one(
            {"id": broker["id"], "tenant_id": tenant_id},
            {"$set": broker_doc},
            upsert=True
        )
    
    # Seed leads
    for lead in SEED_LEADS:
        lead_doc = {
            **lead,
            "tenant_id": tenant_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.leads.update_one(
            {"id": lead["id"], "tenant_id": tenant_id},
            {"$set": lead_doc},
            upsert=True
        )
    
    # Seed activities
    activities = generate_seed_activities(tenant_id)
    for activity in activities:
        await db.activities.update_one(
            {"id": activity["id"], "tenant_id": tenant_id},
            {"$set": activity},
            upsert=True
        )
    
    # Seed points
    points = generate_seed_points(tenant_id)
    for point in points:
        await db.point_ledger.update_one(
            {"id": point["id"], "tenant_id": tenant_id},
            {"$set": point},
            upsert=True
        )
    
    return {"message": "Datos de demo cargados exitosamente", "brokers": 5, "leads": 20}

# ==================== CALENDAR ROUTES ====================

@api_router.get("/calendar/events", response_model=List[dict])
async def get_calendar_events(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get calendar events"""
    query = {"user_id": current_user["user_id"]}
    
    if start_date:
        query["start_time"] = {"$gte": start_date}
    if end_date:
        if "start_time" in query:
            query["start_time"]["$lte"] = end_date
        else:
            query["start_time"] = {"$lte": end_date}
    
    events = await db.calendar_events.find(query, {"_id": 0}).sort("start_time", 1).to_list(500)
    
    # Enrich with lead info if available
    for event in events:
        if event.get("lead_id"):
            lead = await db.leads.find_one({"id": event["lead_id"]}, {"_id": 0, "name": 1, "phone": 1})
            event["lead"] = lead
    
    return [serialize_doc(e) for e in events]

@api_router.post("/calendar/events", response_model=dict)
async def create_calendar_event(event_data: CalendarEventCreate, current_user: dict = Depends(get_current_user)):
    """Create calendar event"""
    event_id = str(uuid.uuid4())
    
    event_doc = {
        "id": event_id,
        "user_id": current_user["user_id"],
        "tenant_id": current_user["tenant_id"],
        **event_data.model_dump(),
        "start_time": event_data.start_time.isoformat(),
        "end_time": event_data.end_time.isoformat() if event_data.end_time else None,
        "completed": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.calendar_events.insert_one(event_doc)
    return {"message": "Evento creado exitosamente", "id": event_id}

@api_router.put("/calendar/events/{event_id}", response_model=dict)
async def update_calendar_event(event_id: str, completed: bool = None, current_user: dict = Depends(get_current_user)):
    """Update calendar event"""
    update_dict = {}
    if completed is not None:
        update_dict["completed"] = completed
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    result = await db.calendar_events.update_one(
        {"id": event_id, "user_id": current_user["user_id"]},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    return {"message": "Evento actualizado"}

@api_router.delete("/calendar/events/{event_id}", response_model=dict)
async def delete_calendar_event(event_id: str, current_user: dict = Depends(get_current_user)):
    """Delete calendar event"""
    result = await db.calendar_events.delete_one({"id": event_id, "user_id": current_user["user_id"]})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    return {"message": "Evento eliminado"}

@api_router.get("/calendar/today", response_model=List[dict])
async def get_today_events(current_user: dict = Depends(get_current_user)):
    """Get today's events"""
    today = datetime.now(timezone.utc).date()
    start = datetime(today.year, today.month, today.day, 0, 0, 0, tzinfo=timezone.utc).isoformat()
    end = datetime(today.year, today.month, today.day, 23, 59, 59, tzinfo=timezone.utc).isoformat()
    
    events = await db.calendar_events.find({
        "user_id": current_user["user_id"],
        "start_time": {"$gte": start, "$lte": end}
    }, {"_id": 0}).sort("start_time", 1).to_list(50)
    
    for event in events:
        if event.get("lead_id"):
            lead = await db.leads.find_one({"id": event["lead_id"]}, {"_id": 0, "name": 1, "phone": 1})
            event["lead"] = lead
    
    return [serialize_doc(e) for e in events]

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "Rovi CRM API v1.0", "status": "running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ==================== INTEGRATION SETTINGS ====================

@api_router.get("/settings/integrations")
async def get_integration_settings(current_user: dict = Depends(get_current_user)):
    """Get integration settings for the current user"""
    settings = await db.integration_settings.find_one(
        {"user_id": current_user["id"]},
        {"_id": 0}
    )
    if not settings:
        # Return empty settings
        return {
            "vapi_api_key": "",
            "vapi_phone_number_id": "",
            "vapi_assistant_id": "",
            "twilio_account_sid": "",
            "twilio_auth_token": "",
            "twilio_phone_number": "",
            "sendgrid_api_key": "",
            "sendgrid_sender_email": "",
            "sendgrid_sender_name": "",
            "vapi_enabled": False,
            "twilio_enabled": False,
            "sendgrid_enabled": False
        }
    # Mask sensitive data
    result = serialize_doc(settings)
    if result.get("vapi_api_key"):
        result["vapi_api_key"] = "••••••••" + result["vapi_api_key"][-4:]
    if result.get("twilio_auth_token"):
        result["twilio_auth_token"] = "••••••••" + result["twilio_auth_token"][-4:]
    if result.get("sendgrid_api_key"):
        result["sendgrid_api_key"] = "••••••••" + result["sendgrid_api_key"][-4:]
    return result

@api_router.put("/settings/integrations")
async def update_integration_settings(
    update_data: IntegrationSettingsUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update integration settings"""
    tenant_id = await get_or_create_tenant(current_user["id"])
    
    # Get existing settings
    existing = await db.integration_settings.find_one({"user_id": current_user["id"]})
    
    update_dict = {}
    data = update_data.model_dump(exclude_unset=True)
    
    for key, value in data.items():
        if value is not None and value != "":
            # Don't update if masked value
            if "••••" not in str(value):
                update_dict[key] = value
    
    # Check if integrations are enabled
    if existing:
        current = {k: v for k, v in existing.items() if k != "_id"}
        current.update(update_dict)
    else:
        current = update_dict
    
    # Set enabled flags
    update_dict["vapi_enabled"] = bool(
        current.get("vapi_api_key") and 
        current.get("vapi_phone_number_id")
    )
    update_dict["twilio_enabled"] = bool(
        current.get("twilio_account_sid") and 
        current.get("twilio_auth_token") and 
        current.get("twilio_phone_number")
    )
    update_dict["sendgrid_enabled"] = bool(
        current.get("sendgrid_api_key") and 
        current.get("sendgrid_sender_email")
    )
    update_dict["updated_at"] = datetime.now(timezone.utc)
    
    if existing:
        await db.integration_settings.update_one(
            {"user_id": current_user["id"]},
            {"$set": update_dict}
        )
    else:
        new_settings = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "tenant_id": tenant_id,
            **update_dict
        }
        await db.integration_settings.insert_one(new_settings)
    
    return {
        "message": "Configuración actualizada", 
        "vapi_enabled": update_dict.get("vapi_enabled", False), 
        "twilio_enabled": update_dict.get("twilio_enabled", False),
        "sendgrid_enabled": update_dict.get("sendgrid_enabled", False)
    }

@api_router.post("/settings/integrations/test-vapi")
async def test_vapi_connection(current_user: dict = Depends(get_current_user)):
    """Test VAPI connection"""
    settings = await db.integration_settings.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not settings or not settings.get("vapi_api_key"):
        raise HTTPException(status_code=400, detail="VAPI no configurado")
    
    try:
        from vapi import Vapi
        vapi_client = Vapi(token=settings["vapi_api_key"])
        # Try to list calls to verify connection
        calls = vapi_client.calls.list(limit=1)
        return {"status": "success", "message": "Conexión exitosa con VAPI"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error de conexión: {str(e)}")

@api_router.post("/settings/integrations/test-twilio")
async def test_twilio_connection(current_user: dict = Depends(get_current_user)):
    """Test Twilio connection"""
    settings = await db.integration_settings.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not settings or not settings.get("twilio_account_sid"):
        raise HTTPException(status_code=400, detail="Twilio no configurado")
    
    try:
        from twilio.rest import Client
        client = Client(settings["twilio_account_sid"], settings["twilio_auth_token"])
        # Verify account
        account = client.api.accounts(settings["twilio_account_sid"]).fetch()
        return {"status": "success", "message": f"Conexión exitosa - Cuenta: {account.friendly_name}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error de conexión: {str(e)}")

# ==================== CAMPAIGNS ====================

@api_router.get("/campaigns")
async def get_campaigns(
    campaign_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all campaigns"""
    tenant_id = await get_or_create_tenant(current_user["id"])
    query = {"tenant_id": tenant_id}
    if campaign_type:
        query["campaign_type"] = campaign_type
    
    campaigns = await db.campaigns.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [serialize_doc(c) for c in campaigns]

@api_router.post("/campaigns")
async def create_campaign(
    campaign_data: CampaignCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new campaign"""
    tenant_id = await get_or_create_tenant(current_user["id"])
    
    # Get leads count
    lead_count = len(campaign_data.lead_ids)
    if campaign_data.lead_filter:
        # Count leads matching filter
        filter_query = {"tenant_id": tenant_id}
        if campaign_data.lead_filter.get("status"):
            filter_query["status"] = {"$in": campaign_data.lead_filter["status"]}
        if campaign_data.lead_filter.get("priority"):
            filter_query["priority"] = {"$in": campaign_data.lead_filter["priority"]}
        lead_count = await db.leads.count_documents(filter_query)
    
    campaign = Campaign(
        **campaign_data.model_dump(),
        user_id=current_user["id"],
        tenant_id=tenant_id,
        total_recipients=lead_count
    )
    
    await db.campaigns.insert_one(campaign.model_dump())
    return serialize_doc(campaign.model_dump())

@api_router.post("/campaigns/{campaign_id}/start")
async def start_campaign(
    campaign_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Start a campaign - sends calls or SMS"""
    tenant_id = await get_or_create_tenant(current_user["id"])
    
    campaign = await db.campaigns.find_one({"id": campaign_id, "tenant_id": tenant_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    
    settings = await db.integration_settings.find_one({"user_id": current_user["id"]}, {"_id": 0})
    
    # Get leads
    leads = []
    if campaign.get("lead_ids"):
        leads = await db.leads.find(
            {"id": {"$in": campaign["lead_ids"]}, "tenant_id": tenant_id},
            {"_id": 0}
        ).to_list(1000)
    elif campaign.get("lead_filter"):
        filter_query = {"tenant_id": tenant_id}
        if campaign["lead_filter"].get("status"):
            filter_query["status"] = {"$in": campaign["lead_filter"]["status"]}
        if campaign["lead_filter"].get("priority"):
            filter_query["priority"] = {"$in": campaign["lead_filter"]["priority"]}
        leads = await db.leads.find(filter_query, {"_id": 0}).to_list(1000)
    
    if not leads:
        raise HTTPException(status_code=400, detail="No hay leads para esta campaña")
    
    # Update campaign status
    await db.campaigns.update_one(
        {"id": campaign_id},
        {"$set": {"status": CampaignStatus.RUNNING.value, "started_at": datetime.now(timezone.utc)}}
    )
    
    results = {"success": 0, "failed": 0, "errors": []}
    
    if campaign["campaign_type"] == CampaignType.CALL.value:
        # Process calls with VAPI
        if not settings or not settings.get("vapi_enabled"):
            raise HTTPException(status_code=400, detail="VAPI no está configurado")
        
        try:
            from vapi import Vapi
            vapi_client = Vapi(token=settings["vapi_api_key"])
            
            for lead in leads:
                try:
                    call_response = vapi_client.calls.create(
                        assistant_id=settings["vapi_assistant_id"],
                        phone_number_id=settings["vapi_phone_number_id"],
                        customer={"number": lead["phone"]}
                    )
                    
                    call_record = CallRecord(
                        user_id=current_user["id"],
                        tenant_id=tenant_id,
                        lead_id=lead["id"],
                        lead_name=lead["name"],
                        phone_number=lead["phone"],
                        campaign_id=campaign_id,
                        vapi_call_id=call_response.id if hasattr(call_response, 'id') else str(call_response),
                        status=CallStatus.QUEUED
                    )
                    await db.call_records.insert_one(call_record.model_dump())
                    results["success"] += 1
                except Exception as e:
                    results["failed"] += 1
                    results["errors"].append(f"{lead['name']}: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error VAPI: {str(e)}")
    
    elif campaign["campaign_type"] == CampaignType.SMS.value:
        # Process SMS with Twilio
        if not settings or not settings.get("twilio_enabled"):
            raise HTTPException(status_code=400, detail="Twilio no está configurado")
        
        try:
            from twilio.rest import Client
            twilio_client = Client(settings["twilio_account_sid"], settings["twilio_auth_token"])
            
            for lead in leads:
                try:
                    # Personalize message
                    message_body = campaign.get("message_template", "").replace("{nombre}", lead["name"])
                    
                    message = twilio_client.messages.create(
                        body=message_body,
                        from_=settings["twilio_phone_number"],
                        to=lead["phone"]
                    )
                    
                    sms_record = SMSRecord(
                        user_id=current_user["id"],
                        tenant_id=tenant_id,
                        lead_id=lead["id"],
                        lead_name=lead["name"],
                        phone_number=lead["phone"],
                        message=message_body,
                        campaign_id=campaign_id,
                        twilio_sid=message.sid,
                        status=SMSStatus.SENT,
                        sent_at=datetime.now(timezone.utc)
                    )
                    await db.sms_records.insert_one(sms_record.model_dump())
                    results["success"] += 1
                except Exception as e:
                    results["failed"] += 1
                    results["errors"].append(f"{lead['name']}: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error Twilio: {str(e)}")
    
    elif campaign["campaign_type"] == CampaignType.EMAIL.value:
        # Process Emails with SendGrid
        if not settings or not settings.get("sendgrid_enabled"):
            raise HTTPException(status_code=400, detail="SendGrid no está configurado")
        
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail, TrackingSettings, ClickTracking, OpenTracking
            
            sg = SendGridAPIClient(settings["sendgrid_api_key"])
            
            for lead in leads:
                if not lead.get("email"):
                    results["failed"] += 1
                    results["errors"].append(f"{lead['name']}: Sin email")
                    continue
                    
                try:
                    # Personalize message
                    subject = campaign.get("email_subject", "Mensaje de Rovi").replace("{nombre}", lead["name"])
                    html_content = campaign.get("message_template", "").replace("{nombre}", lead["name"])
                    
                    message = Mail(
                        from_email=(settings["sendgrid_sender_email"], settings.get("sendgrid_sender_name", "Rovi")),
                        to_emails=lead["email"],
                        subject=subject,
                        html_content=html_content
                    )
                    
                    # Enable tracking
                    tracking_settings = TrackingSettings()
                    tracking_settings.click_tracking = ClickTracking(enable=True)
                    tracking_settings.open_tracking = OpenTracking(enable=True)
                    message.tracking_settings = tracking_settings
                    
                    response = sg.send(message)
                    
                    email_record = EmailRecord(
                        user_id=current_user["id"],
                        tenant_id=tenant_id,
                        lead_id=lead["id"],
                        lead_name=lead["name"],
                        email=lead["email"],
                        subject=subject,
                        html_content=html_content,
                        campaign_id=campaign_id,
                        sendgrid_id=response.headers.get("X-Message-Id", ""),
                        status=EmailStatus.SENT if response.status_code == 202 else EmailStatus.FAILED,
                        sent_at=datetime.now(timezone.utc)
                    )
                    await db.email_records.insert_one(email_record.model_dump())
                    results["success"] += 1
                except Exception as e:
                    results["failed"] += 1
                    results["errors"].append(f"{lead['name']}: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error SendGrid: {str(e)}")
    
    # Update campaign
    await db.campaigns.update_one(
        {"id": campaign_id},
        {"$set": {
            "status": CampaignStatus.COMPLETED.value,
            "completed_at": datetime.now(timezone.utc),
            "sent_count": results["success"],
            "failed_count": results["failed"]
        }}
    )
    
    return results

# ==================== CALL RECORDS ====================

@api_router.get("/calls")
async def get_call_records(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get call history"""
    tenant_id = await get_or_create_tenant(current_user["id"])
    calls = await db.call_records.find(
        {"tenant_id": tenant_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    return [serialize_doc(c) for c in calls]

@api_router.post("/calls/single")
async def create_single_call(
    call_data: CallRecordCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a single call to a lead"""
    tenant_id = await get_or_create_tenant(current_user["id"])
    settings = await db.integration_settings.find_one({"user_id": current_user["id"]}, {"_id": 0})
    
    if not settings or not settings.get("vapi_enabled"):
        raise HTTPException(status_code=400, detail="VAPI no está configurado")
    
    # Get lead info
    lead = await db.leads.find_one({"id": call_data.lead_id, "tenant_id": tenant_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    
    try:
        from vapi import Vapi
        vapi_client = Vapi(token=settings["vapi_api_key"])
        
        call_params = {
            "assistant_id": settings["vapi_assistant_id"],
            "phone_number_id": settings["vapi_phone_number_id"],
            "customer": {"number": call_data.phone_number}
        }
        
        if call_data.scheduled_at:
            call_params["schedule_plan"] = {"earliest_at": call_data.scheduled_at.isoformat()}
        
        call_response = vapi_client.calls.create(**call_params)
        
        call_record = CallRecord(
            user_id=current_user["id"],
            tenant_id=tenant_id,
            lead_id=call_data.lead_id,
            lead_name=lead["name"],
            phone_number=call_data.phone_number,
            vapi_call_id=call_response.id if hasattr(call_response, 'id') else str(call_response),
            status=CallStatus.SCHEDULED if call_data.scheduled_at else CallStatus.QUEUED,
            scheduled_at=call_data.scheduled_at
        )
        await db.call_records.insert_one(call_record.model_dump())
        
        return serialize_doc(call_record.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear llamada: {str(e)}")

# ==================== SMS RECORDS ====================

@api_router.get("/sms")
async def get_sms_records(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get SMS history"""
    tenant_id = await get_or_create_tenant(current_user["id"])
    sms_list = await db.sms_records.find(
        {"tenant_id": tenant_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    return [serialize_doc(s) for s in sms_list]

@api_router.post("/sms/single")
async def send_single_sms(
    sms_data: SMSRecordCreate,
    current_user: dict = Depends(get_current_user)
):
    """Send a single SMS to a lead"""
    tenant_id = await get_or_create_tenant(current_user["id"])
    settings = await db.integration_settings.find_one({"user_id": current_user["id"]}, {"_id": 0})
    
    if not settings or not settings.get("twilio_enabled"):
        raise HTTPException(status_code=400, detail="Twilio no está configurado")
    
    # Get lead info
    lead = await db.leads.find_one({"id": sms_data.lead_id, "tenant_id": tenant_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    
    try:
        from twilio.rest import Client
        twilio_client = Client(settings["twilio_account_sid"], settings["twilio_auth_token"])
        
        message = twilio_client.messages.create(
            body=sms_data.message,
            from_=settings["twilio_phone_number"],
            to=sms_data.phone_number
        )
        
        sms_record = SMSRecord(
            user_id=current_user["id"],
            tenant_id=tenant_id,
            lead_id=sms_data.lead_id,
            lead_name=lead["name"],
            phone_number=sms_data.phone_number,
            message=sms_data.message,
            twilio_sid=message.sid,
            status=SMSStatus.SENT,
            sent_at=datetime.now(timezone.utc)
        )
        await db.sms_records.insert_one(sms_record.model_dump())
        
        return serialize_doc(sms_record.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al enviar SMS: {str(e)}")

# ==================== EMAIL RECORDS ====================

@api_router.get("/emails")
async def get_email_records(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get email history"""
    tenant_id = await get_or_create_tenant(current_user["id"])
    emails = await db.email_records.find(
        {"tenant_id": tenant_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    return [serialize_doc(e) for e in emails]

@api_router.post("/emails/single")
async def send_single_email(
    email_data: EmailRecordCreate,
    current_user: dict = Depends(get_current_user)
):
    """Send a single email to a lead"""
    tenant_id = await get_or_create_tenant(current_user["id"])
    settings = await db.integration_settings.find_one({"user_id": current_user["id"]}, {"_id": 0})
    
    if not settings or not settings.get("sendgrid_enabled"):
        raise HTTPException(status_code=400, detail="SendGrid no está configurado")
    
    # Get lead info
    lead = await db.leads.find_one({"id": email_data.lead_id, "tenant_id": tenant_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, TrackingSettings, ClickTracking, OpenTracking
        
        sg = SendGridAPIClient(settings["sendgrid_api_key"])
        
        message = Mail(
            from_email=(settings["sendgrid_sender_email"], settings.get("sendgrid_sender_name", "Rovi")),
            to_emails=email_data.email,
            subject=email_data.subject,
            html_content=email_data.html_content
        )
        
        # Enable click and open tracking
        tracking_settings = TrackingSettings()
        tracking_settings.click_tracking = ClickTracking(enable=True)
        tracking_settings.open_tracking = OpenTracking(enable=True)
        message.tracking_settings = tracking_settings
        
        response = sg.send(message)
        
        email_record = EmailRecord(
            user_id=current_user["id"],
            tenant_id=tenant_id,
            lead_id=email_data.lead_id,
            lead_name=lead["name"],
            email=email_data.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
            campaign_id=email_data.campaign_id,
            sendgrid_id=response.headers.get("X-Message-Id", ""),
            status=EmailStatus.SENT if response.status_code == 202 else EmailStatus.FAILED,
            sent_at=datetime.now(timezone.utc)
        )
        await db.email_records.insert_one(email_record.model_dump())
        
        return serialize_doc(email_record.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al enviar email: {str(e)}")

@api_router.post("/settings/integrations/test-sendgrid")
async def test_sendgrid_connection(current_user: dict = Depends(get_current_user)):
    """Test SendGrid connection"""
    settings = await db.integration_settings.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not settings or not settings.get("sendgrid_api_key"):
        raise HTTPException(status_code=400, detail="SendGrid no configurado")
    
    try:
        from sendgrid import SendGridAPIClient
        sg = SendGridAPIClient(settings["sendgrid_api_key"])
        # Test API key by getting sender identities
        response = sg.client.verified_senders.get()
        return {"status": "success", "message": "Conexión exitosa con SendGrid"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error de conexión: {str(e)}")

# ==================== EMAIL TEMPLATES ====================

@api_router.get("/email-templates")
async def get_email_templates(current_user: dict = Depends(get_current_user)):
    """Get all email templates"""
    tenant_id = await get_or_create_tenant(current_user["id"])
    templates = await db.email_templates.find(
        {"tenant_id": tenant_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return [serialize_doc(t) for t in templates]

@api_router.post("/email-templates")
async def create_email_template(
    template_data: EmailTemplateCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new email template"""
    tenant_id = await get_or_create_tenant(current_user["id"])
    
    template = EmailTemplate(
        **template_data.model_dump(),
        user_id=current_user["id"],
        tenant_id=tenant_id
    )
    
    await db.email_templates.insert_one(template.model_dump())
    return serialize_doc(template.model_dump())

@api_router.delete("/email-templates/{template_id}")
async def delete_email_template(
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an email template"""
    tenant_id = await get_or_create_tenant(current_user["id"])
    result = await db.email_templates.delete_one({"id": template_id, "tenant_id": tenant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return {"message": "Plantilla eliminada"}

# ==================== CONVERSATION ANALYSIS (DEMO/MOCKUP) ====================

@api_router.get("/calls/{call_id}/analysis")
async def get_call_analysis(
    call_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get conversation analysis for a call (DEMO - returns mock data)"""
    tenant_id = await get_or_create_tenant(current_user["id"])
    
    call = await db.call_records.find_one({"id": call_id, "tenant_id": tenant_id}, {"_id": 0})
    if not call:
        raise HTTPException(status_code=404, detail="Llamada no encontrada")
    
    # Return mock analysis data
    sentiments = ["positivo", "neutral", "negativo"]
    intents = ["interesado en comprar", "buscando información", "comparando opciones", "listo para decidir", "solo curiosidad"]
    topics = [
        ["precio", "ubicación", "amenidades"],
        ["financiamiento", "enganche", "mensualidades"],
        ["fecha de entrega", "acabados", "garantía"],
        ["seguridad", "plusvalía", "rentabilidad"]
    ]
    actions = [
        ["Enviar brochure por WhatsApp", "Agendar visita presencial"],
        ["Enviar cotización personalizada", "Llamar en 2 días"],
        ["Compartir opciones de financiamiento", "Agendar llamada con asesor"],
        ["Enviar video del desarrollo", "Invitar a evento de preventa"]
    ]
    
    mock_analysis = ConversationAnalysis(
        call_id=call_id,
        lead_name=call.get("lead_name", "Lead"),
        duration_seconds=call.get("duration_seconds", random.randint(60, 300)),
        sentiment=random.choice(sentiments),
        intent_detected=random.choice(intents),
        key_topics=random.choice(topics),
        action_items=random.choice(actions),
        follow_up_recommended=random.choice([True, True, False]),
        follow_up_reason="El prospecto mostró alto interés en la propiedad" if random.choice([True, False]) else None,
        confidence_score=round(random.uniform(0.75, 0.98), 2)
    )
    
    return serialize_doc(mock_analysis.model_dump())

@api_router.get("/analytics/communications")
async def get_communications_analytics(
    current_user: dict = Depends(get_current_user)
):
    """Get communications analytics (calls + SMS)"""
    tenant_id = await get_or_create_tenant(current_user["id"])
    
    # Get call stats
    total_calls = await db.call_records.count_documents({"tenant_id": tenant_id})
    completed_calls = await db.call_records.count_documents({"tenant_id": tenant_id, "status": "completed"})
    
    # Get SMS stats
    total_sms = await db.sms_records.count_documents({"tenant_id": tenant_id})
    delivered_sms = await db.sms_records.count_documents({"tenant_id": tenant_id, "status": "delivered"})
    
    # Get campaign stats
    total_campaigns = await db.campaigns.count_documents({"tenant_id": tenant_id})
    
    # Recent activity
    recent_calls = await db.call_records.find(
        {"tenant_id": tenant_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(5)
    
    recent_sms = await db.sms_records.find(
        {"tenant_id": tenant_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(5)
    
    # Get email stats
    total_emails = await db.email_records.count_documents({"tenant_id": tenant_id})
    sent_emails = await db.email_records.count_documents({"tenant_id": tenant_id, "status": {"$in": ["sent", "delivered", "opened", "clicked"]}})
    opened_emails = await db.email_records.count_documents({"tenant_id": tenant_id, "status": {"$in": ["opened", "clicked"]}})
    
    recent_emails = await db.email_records.find(
        {"tenant_id": tenant_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(5)
    
    return {
        "calls": {
            "total": total_calls,
            "completed": completed_calls,
            "success_rate": round((completed_calls / total_calls * 100) if total_calls > 0 else 0, 1)
        },
        "sms": {
            "total": total_sms,
            "delivered": delivered_sms,
            "delivery_rate": round((delivered_sms / total_sms * 100) if total_sms > 0 else 0, 1)
        },
        "emails": {
            "total": total_emails,
            "sent": sent_emails,
            "opened": opened_emails,
            "open_rate": round((opened_emails / sent_emails * 100) if sent_emails > 0 else 0, 1)
        },
        "campaigns": {
            "total": total_campaigns
        },
        "recent_calls": [serialize_doc(c) for c in recent_calls],
        "recent_sms": [serialize_doc(s) for s in recent_sms],
        "recent_emails": [serialize_doc(e) for e in recent_emails]
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
