from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid
import random
import csv
import io

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
    EmailTemplate, EmailTemplateCreate,
    ImportJob, ImportStatus, ImportMappingRequest, ColumnMapping
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

@api_router.get("/dashboard/kpi-detail/{kpi_type}")
async def get_kpi_detail(kpi_type: str, current_user: dict = Depends(get_current_user)):
    """Get detailed breakdown for a specific KPI"""
    tenant_id = current_user["tenant_id"]
    
    if kpi_type == "puntos":
        # Get points breakdown by activity type
        pipeline = [
            {"$match": {"tenant_id": tenant_id}},
            {"$group": {
                "_id": "$activity_type",
                "count": {"$sum": 1},
                "points": {"$sum": "$points"}
            }},
            {"$sort": {"points": -1}}
        ]
        breakdown = await db.point_ledger.aggregate(pipeline).to_list(20)
        
        colors = {
            "llamada": "bg-blue-500",
            "whatsapp": "bg-green-500",
            "email": "bg-purple-500",
            "zoom": "bg-indigo-500",
            "visita": "bg-amber-500",
            "apartado": "bg-secondary",
            "venta": "bg-accent"
        }
        
        return {
            "points_breakdown": [
                {
                    "type": item["_id"] or "otro",
                    "count": item["count"],
                    "points": item["points"],
                    "color": colors.get(item["_id"], "bg-gray-500")
                }
                for item in breakdown
            ]
        }
    
    elif kpi_type == "apartados":
        # Get recent apartados with lead info
        apartados = await db.leads.find(
            {"tenant_id": tenant_id, "status": "apartado"},
            {"_id": 0}
        ).sort("updated_at", -1).limit(20).to_list(20)
        
        return {
            "apartados_list": [
                {
                    "lead_name": a.get("name", "Lead"),
                    "property": a.get("property_interest", "Propiedad"),
                    "amount": a.get("budget_mxn", 0),
                    "date": a.get("updated_at")
                }
                for a in apartados
            ]
        }
    
    elif kpi_type == "ventas":
        # Get ventas with details
        ventas = await db.leads.find(
            {"tenant_id": tenant_id, "status": "venta"},
            {"_id": 0}
        ).sort("updated_at", -1).limit(20).to_list(20)
        
        total = sum(v.get("budget_mxn", 0) for v in ventas)
        
        return {
            "ventas_list": [
                {
                    "lead_name": v.get("name", "Lead"),
                    "property": v.get("property_interest", "Propiedad"),
                    "amount": v.get("budget_mxn", 0),
                    "date": v.get("updated_at")
                }
                for v in ventas
            ],
            "ventas_total": total
        }
    
    elif kpi_type == "brokers":
        # Get brokers with stats using aggregation (avoid N+1)
        brokers = await db.users.find(
            {"tenant_id": tenant_id, "role": {"$in": ["broker", "manager"]}, "is_active": True},
            {"_id": 0, "password_hash": 0}
        ).to_list(50)
        
        broker_ids = [b["id"] for b in brokers]
        
        # Batch get lead stats
        leads_pipeline = [
            {"$match": {"assigned_broker_id": {"$in": broker_ids}}},
            {"$group": {
                "_id": "$assigned_broker_id",
                "leads_count": {"$sum": 1},
                "ventas": {"$sum": {"$cond": [{"$eq": ["$status", "venta"]}, 1, 0]}}
            }}
        ]
        leads_stats = await db.leads.aggregate(leads_pipeline).to_list(None)
        leads_map = {s["_id"]: s for s in leads_stats}
        
        # Batch get points
        points_pipeline = [
            {"$match": {"broker_id": {"$in": broker_ids}}},
            {"$group": {"_id": "$broker_id", "total": {"$sum": "$points"}}}
        ]
        points_stats = await db.point_ledger.aggregate(points_pipeline).to_list(None)
        points_map = {p["_id"]: p["total"] for p in points_stats}
        
        brokers_list = []
        for broker in brokers:
            broker_stats = leads_map.get(broker["id"], {})
            brokers_list.append({
                "name": broker.get("name", "Broker"),
                "avatar": broker.get("avatar_url"),
                "leads_count": broker_stats.get("leads_count", 0),
                "ventas": broker_stats.get("ventas", 0),
                "points": points_map.get(broker["id"], 0)
            })
        
        # Sort by points
        brokers_list.sort(key=lambda x: x["points"], reverse=True)
        
        return {"brokers_list": brokers_list}
    
    else:
        return {"error": "KPI type not found"}

@api_router.get("/dashboard/leaderboard", response_model=List[BrokerStats])
async def get_leaderboard(current_user: dict = Depends(get_current_user)):
    """Get monthly leaderboard"""
    tenant_id = current_user["tenant_id"]
    
    # Get all brokers
    brokers = await db.users.find(
        {"tenant_id": tenant_id, "role": {"$in": ["broker", "manager"]}},
        {"_id": 0}
    ).to_list(100)
    
    broker_ids = [b["id"] for b in brokers]
    
    # Batch get points using aggregation
    points_pipeline = [
        {"$match": {"tenant_id": tenant_id, "broker_id": {"$in": broker_ids}}},
        {"$group": {"_id": "$broker_id", "total": {"$sum": "$points"}}}
    ]
    points_result = await db.point_ledger.aggregate(points_pipeline).to_list(None)
    points_map = {p["_id"]: p["total"] for p in points_result}
    
    # Batch get lead stats using aggregation
    leads_pipeline = [
        {"$match": {"tenant_id": tenant_id, "assigned_broker_id": {"$in": broker_ids}}},
        {"$group": {
            "_id": "$assigned_broker_id",
            "total": {"$sum": 1},
            "ventas": {"$sum": {"$cond": [{"$eq": ["$status", "venta"]}, 1, 0]}},
            "apartados": {"$sum": {"$cond": [{"$eq": ["$status", "apartado"]}, 1, 0]}}
        }}
    ]
    leads_result = await db.leads.aggregate(leads_pipeline).to_list(None)
    leads_map = {l["_id"]: l for l in leads_result}
    
    # Batch get activity stats using aggregation
    activities_pipeline = [
        {"$match": {"tenant_id": tenant_id, "broker_id": {"$in": broker_ids}}},
        {"$group": {
            "_id": {"broker_id": "$broker_id", "type": "$activity_type"},
            "count": {"$sum": 1}
        }}
    ]
    activities_result = await db.activities.aggregate(activities_pipeline).to_list(None)
    activities_map = {}
    for a in activities_result:
        broker_id = a["_id"]["broker_id"]
        act_type = a["_id"]["type"]
        if broker_id not in activities_map:
            activities_map[broker_id] = {}
        activities_map[broker_id][act_type] = a["count"]
    
    leaderboard = []
    for broker in brokers:
        bid = broker["id"]
        total_points = points_map.get(bid, 0)
        lead_stats = leads_map.get(bid, {})
        act_stats = activities_map.get(bid, {})
        
        leaderboard.append(BrokerStats(
            broker_id=bid,
            broker_name=broker["name"],
            avatar_url=broker.get("avatar_url"),
            total_points=total_points,
            ventas=lead_stats.get("ventas", 0),
            apartados=lead_stats.get("apartados", 0),
            leads_asignados=lead_stats.get("total", 0),
            llamadas=act_stats.get("llamada", 0),
            presentaciones=act_stats.get("zoom", 0),
            rank=0,
            month_progress=min(100, total_points / 100 * 100)
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
    
    # Batch fetch broker and lead names (avoid N+1)
    broker_ids = list(set(a.get("broker_id") for a in activities if a.get("broker_id")))
    lead_ids = list(set(a.get("lead_id") for a in activities if a.get("lead_id")))
    
    brokers_map = {}
    leads_map = {}
    
    if broker_ids:
        brokers = await db.users.find({"id": {"$in": broker_ids}}, {"_id": 0, "id": 1, "name": 1}).to_list(None)
        brokers_map = {b["id"]: b["name"] for b in brokers}
    
    if lead_ids:
        leads = await db.leads.find({"id": {"$in": lead_ids}}, {"_id": 0, "id": 1, "name": 1}).to_list(None)
        leads_map = {l["id"]: l["name"] for l in leads}
    
    # Enrich with names from maps
    for activity in activities:
        activity["broker_name"] = brokers_map.get(activity.get("broker_id"), "Desconocido")
        activity["lead_name"] = leads_map.get(activity.get("lead_id"), "Desconocido")
    
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
    
    # Batch fetch lead info (avoid N+1)
    lead_ids = list(set(e.get("lead_id") for e in events if e.get("lead_id")))
    leads_map = {}
    if lead_ids:
        leads = await db.leads.find({"id": {"$in": lead_ids}}, {"_id": 0, "id": 1, "name": 1, "phone": 1}).to_list(None)
        leads_map = {l["id"]: {"name": l["name"], "phone": l.get("phone")} for l in leads}
    
    # Enrich with lead info from map
    for event in events:
        if event.get("lead_id"):
            event["lead"] = leads_map.get(event["lead_id"])
    
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
    
    # Batch fetch lead info (avoid N+1)
    lead_ids = list(set(e.get("lead_id") for e in events if e.get("lead_id")))
    leads_map = {}
    if lead_ids:
        leads = await db.leads.find({"id": {"$in": lead_ids}}, {"_id": 0, "id": 1, "name": 1, "phone": 1}).to_list(None)
        leads_map = {l["id"]: {"name": l["name"], "phone": l.get("phone")} for l in leads}
    
    for event in events:
        if event.get("lead_id"):
            event["lead"] = leads_map.get(event["lead_id"])
    
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
        {"user_id": current_user["user_id"]},
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
    tenant_id = await get_or_create_tenant(current_user["user_id"])
    
    # Get existing settings
    existing = await db.integration_settings.find_one({"user_id": current_user["user_id"]})
    
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
            {"user_id": current_user["user_id"]},
            {"$set": update_dict}
        )
    else:
        new_settings = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["user_id"],
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
    settings = await db.integration_settings.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
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
    settings = await db.integration_settings.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
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
    tenant_id = await get_or_create_tenant(current_user["user_id"])
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
    tenant_id = await get_or_create_tenant(current_user["user_id"])
    
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
        user_id=current_user["user_id"],
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
    tenant_id = await get_or_create_tenant(current_user["user_id"])
    
    campaign = await db.campaigns.find_one({"id": campaign_id, "tenant_id": tenant_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    
    settings = await db.integration_settings.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    
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
                        user_id=current_user["user_id"],
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
                        user_id=current_user["user_id"],
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
                        user_id=current_user["user_id"],
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
    tenant_id = await get_or_create_tenant(current_user["user_id"])
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
    tenant_id = await get_or_create_tenant(current_user["user_id"])
    settings = await db.integration_settings.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    
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
            user_id=current_user["user_id"],
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
    tenant_id = await get_or_create_tenant(current_user["user_id"])
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
    tenant_id = await get_or_create_tenant(current_user["user_id"])
    settings = await db.integration_settings.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    
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
            user_id=current_user["user_id"],
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
    tenant_id = await get_or_create_tenant(current_user["user_id"])
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
    tenant_id = await get_or_create_tenant(current_user["user_id"])
    settings = await db.integration_settings.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    
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
            user_id=current_user["user_id"],
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
    settings = await db.integration_settings.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
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
    tenant_id = await get_or_create_tenant(current_user["user_id"])
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
    tenant_id = await get_or_create_tenant(current_user["user_id"])
    
    template = EmailTemplate(
        **template_data.model_dump(),
        user_id=current_user["user_id"],
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
    tenant_id = await get_or_create_tenant(current_user["user_id"])
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
    tenant_id = await get_or_create_tenant(current_user["user_id"])
    
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
    tenant_id = await get_or_create_tenant(current_user["user_id"])
    
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

# ==================== LEAD IMPORT ====================

# Lead field definitions for mapping
LEAD_FIELDS = {
    "name": {"label": "Nombre", "required": True, "type": "string"},
    "email": {"label": "Email", "required": False, "type": "email"},
    "phone": {"label": "Teléfono", "required": True, "type": "phone"},
    "source": {"label": "Fuente", "required": False, "type": "string"},
    "status": {"label": "Estado", "required": False, "type": "select", "options": ["nuevo", "contactado", "calificacion", "presentacion", "apartado", "venta"]},
    "priority": {"label": "Prioridad", "required": False, "type": "select", "options": ["baja", "media", "alta", "urgente"]},
    "budget_mxn": {"label": "Presupuesto (MXN)", "required": False, "type": "number"},
    "property_interest": {"label": "Interés Propiedad", "required": False, "type": "string"},
    "location_preference": {"label": "Ubicación Preferida", "required": False, "type": "string"},
    "notes": {"label": "Notas", "required": False, "type": "text"},
    "company": {"label": "Empresa", "required": False, "type": "string"},
    "position": {"label": "Puesto", "required": False, "type": "string"},
}

@api_router.get("/import/fields")
async def get_import_fields():
    """Get available fields for import mapping"""
    return LEAD_FIELDS

@api_router.post("/import/upload")
async def upload_import_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload file and get column headers for mapping"""
    tenant_id = current_user["tenant_id"]
    
    # Validate file type
    filename = file.filename.lower()
    if not (filename.endswith('.csv') or filename.endswith('.xlsx') or filename.endswith('.xls')):
        raise HTTPException(status_code=400, detail="Formato no soportado. Use CSV o Excel (.xlsx)")
    
    file_type = "csv" if filename.endswith('.csv') else "xlsx"
    
    try:
        content = await file.read()
        
        if file_type == "csv":
            # Try different encodings
            for encoding in ['utf-8', 'latin-1', 'cp1252']:
                try:
                    text = content.decode(encoding)
                    break
                except UnicodeDecodeError:
                    continue
            else:
                raise HTTPException(status_code=400, detail="No se pudo decodificar el archivo CSV")
            
            reader = csv.DictReader(io.StringIO(text))
            headers = reader.fieldnames or []
            rows = list(reader)
        else:
            # Excel file
            import openpyxl
            wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True)
            ws = wb.active
            
            # Get headers from first row
            headers = []
            rows = []
            for i, row in enumerate(ws.iter_rows(values_only=True)):
                if i == 0:
                    headers = [str(cell) if cell else f"Column_{j}" for j, cell in enumerate(row)]
                else:
                    if any(cell for cell in row):  # Skip empty rows
                        row_dict = {headers[j]: cell for j, cell in enumerate(row) if j < len(headers)}
                        rows.append(row_dict)
            wb.close()
        
        # Create import job
        job = ImportJob(
            user_id=current_user["user_id"],
            tenant_id=tenant_id,
            filename=file.filename,
            file_type=file_type,
            total_rows=len(rows)
        )
        
        # Store job and data temporarily
        await db.import_jobs.insert_one(job.model_dump())
        await db.import_data.insert_one({
            "job_id": job.id,
            "rows": rows,
            "created_at": datetime.now(timezone.utc)
        })
        
        # Sample data for preview (first 5 rows)
        sample_data = rows[:5] if rows else []
        
        # Auto-detect mapping suggestions
        mapping_suggestions = {}
        header_lower_map = {h.lower().strip(): h for h in headers}
        
        field_aliases = {
            "name": ["nombre", "name", "full name", "nombre completo", "cliente", "contacto"],
            "email": ["email", "correo", "e-mail", "mail", "correo electronico"],
            "phone": ["phone", "telefono", "teléfono", "celular", "mobile", "tel", "whatsapp"],
            "source": ["source", "fuente", "origen", "canal", "medio"],
            "status": ["status", "estado", "etapa", "stage"],
            "priority": ["priority", "prioridad", "urgencia"],
            "budget_mxn": ["budget", "presupuesto", "precio", "price", "monto"],
            "property_interest": ["property", "propiedad", "interes", "interest", "proyecto"],
            "location_preference": ["location", "ubicacion", "ubicación", "zona", "city", "ciudad"],
            "notes": ["notes", "notas", "comentarios", "comments", "observaciones"],
            "company": ["company", "empresa", "compañia", "organization"],
            "position": ["position", "puesto", "cargo", "title", "job title"],
        }
        
        for field, aliases in field_aliases.items():
            for alias in aliases:
                if alias in header_lower_map:
                    mapping_suggestions[field] = header_lower_map[alias]
                    break
        
        return {
            "job_id": job.id,
            "filename": file.filename,
            "total_rows": len(rows),
            "headers": headers,
            "sample_data": sample_data,
            "mapping_suggestions": mapping_suggestions,
            "available_fields": LEAD_FIELDS
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando archivo: {str(e)}")

@api_router.post("/import/preview")
async def preview_import(
    request: ImportMappingRequest,
    current_user: dict = Depends(get_current_user)
):
    """Preview import with current mapping"""
    # Get job and data
    job = await db.import_jobs.find_one({"id": request.job_id, "user_id": current_user["user_id"]}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job de importación no encontrado")
    
    import_data = await db.import_data.find_one({"job_id": request.job_id}, {"_id": 0})
    if not import_data:
        raise HTTPException(status_code=404, detail="Datos de importación no encontrados")
    
    rows = import_data.get("rows", [])
    mapping = {m.source_column: m.target_field for m in request.mapping}
    
    # Transform sample data with mapping
    preview_rows = []
    errors = []
    
    for i, row in enumerate(rows[:10]):  # Preview first 10
        transformed = {}
        row_errors = []
        
        for source_col, target_field in mapping.items():
            value = row.get(source_col, "")
            if value is not None:
                value = str(value).strip()
            
            # Validate required fields
            field_config = LEAD_FIELDS.get(target_field, {})
            if field_config.get("required") and not value:
                row_errors.append(f"{field_config.get('label', target_field)} es requerido")
            
            # Type validation
            if value:
                if field_config.get("type") == "number":
                    try:
                        value = float(str(value).replace(",", "").replace("$", ""))
                    except:
                        row_errors.append(f"{field_config.get('label', target_field)} debe ser un número")
                elif field_config.get("type") == "email" and "@" not in str(value):
                    row_errors.append(f"Email inválido: {value}")
            
            transformed[target_field] = value
        
        preview_rows.append({
            "row_number": i + 1,
            "data": transformed,
            "errors": row_errors,
            "valid": len(row_errors) == 0
        })
        
        if row_errors:
            errors.extend([{"row": i + 1, "errors": row_errors}])
    
    # Check for duplicates if enabled
    duplicates_preview = []
    if request.skip_duplicates and request.duplicate_field:
        duplicate_values = [r["data"].get(request.duplicate_field) for r in preview_rows if r["data"].get(request.duplicate_field)]
        existing = await db.leads.find(
            {request.duplicate_field: {"$in": duplicate_values}, "tenant_id": job["tenant_id"]},
            {"_id": 0, request.duplicate_field: 1}
        ).to_list(None)
        existing_values = set(doc.get(request.duplicate_field) for doc in existing)
        duplicates_preview = [v for v in duplicate_values if v in existing_values]
    
    return {
        "preview_rows": preview_rows,
        "total_rows": len(rows),
        "valid_rows": sum(1 for r in preview_rows if r["valid"]),
        "error_rows": len(errors),
        "duplicates_found": len(duplicates_preview),
        "duplicate_values": duplicates_preview[:5],
        "errors": errors[:10]
    }

@api_router.post("/import/execute")
async def execute_import(
    request: ImportMappingRequest,
    current_user: dict = Depends(get_current_user)
):
    """Execute the import with mapping"""
    tenant_id = current_user["tenant_id"]
    
    # Get job and data
    job = await db.import_jobs.find_one({"id": request.job_id, "user_id": current_user["user_id"]}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job de importación no encontrado")
    
    import_data = await db.import_data.find_one({"job_id": request.job_id}, {"_id": 0})
    if not import_data:
        raise HTTPException(status_code=404, detail="Datos de importación no encontrados")
    
    rows = import_data.get("rows", [])
    mapping = {m.source_column: m.target_field for m in request.mapping}
    
    # Update job status
    await db.import_jobs.update_one(
        {"id": request.job_id},
        {"$set": {"status": ImportStatus.PROCESSING.value, "column_mapping": mapping}}
    )
    
    imported = 0
    skipped = 0
    errors_list = []
    
    # Get existing values for duplicate check
    existing_values = set()
    if request.skip_duplicates and request.duplicate_field:
        all_values = [str(row.get(next((s for s, t in mapping.items() if t == request.duplicate_field), ""), "")).strip() for row in rows]
        all_values = [v for v in all_values if v]
        existing = await db.leads.find(
            {request.duplicate_field: {"$in": all_values}, "tenant_id": tenant_id},
            {"_id": 0, request.duplicate_field: 1}
        ).to_list(None)
        existing_values = set(str(doc.get(request.duplicate_field, "")).strip() for doc in existing)
    
    # Process all rows
    leads_to_insert = []
    for i, row in enumerate(rows):
        try:
            transformed = {}
            row_errors = []
            
            for source_col, target_field in mapping.items():
                value = row.get(source_col, "")
                if value is not None:
                    value = str(value).strip()
                
                field_config = LEAD_FIELDS.get(target_field, {})
                
                # Type conversion
                if value and field_config.get("type") == "number":
                    try:
                        value = float(str(value).replace(",", "").replace("$", ""))
                    except:
                        value = 0
                
                # Default values for select fields
                if target_field == "status" and not value:
                    value = "nuevo"
                if target_field == "priority" and not value:
                    value = "media"
                
                transformed[target_field] = value
            
            # Check required fields
            if not transformed.get("name"):
                row_errors.append("Nombre es requerido")
            if not transformed.get("phone"):
                row_errors.append("Teléfono es requerido")
            
            if row_errors:
                errors_list.append({"row": i + 1, "errors": row_errors})
                continue
            
            # Check duplicates
            if request.skip_duplicates and request.duplicate_field:
                check_value = str(transformed.get(request.duplicate_field, "")).strip()
                if check_value in existing_values:
                    skipped += 1
                    continue
                existing_values.add(check_value)
            
            # Create lead
            lead = Lead(
                name=transformed.get("name", ""),
                email=transformed.get("email"),
                phone=transformed.get("phone", ""),
                source=transformed.get("source", "importado"),
                status=transformed.get("status", "nuevo"),
                priority=transformed.get("priority", "media"),
                budget_mxn=transformed.get("budget_mxn", 0),
                property_interest=transformed.get("property_interest"),
                location_preference=transformed.get("location_preference"),
                notes=transformed.get("notes"),
                tenant_id=tenant_id,
                created_by=current_user["user_id"],
                intent_score=50
            )
            leads_to_insert.append(lead.model_dump())
            imported += 1
            
        except Exception as e:
            errors_list.append({"row": i + 1, "errors": [str(e)]})
    
    # Bulk insert leads
    if leads_to_insert:
        await db.leads.insert_many(leads_to_insert)
    
    # Update job with results
    final_status = ImportStatus.COMPLETED.value
    if errors_list and imported == 0:
        final_status = ImportStatus.FAILED.value
    elif errors_list:
        final_status = ImportStatus.PARTIAL.value
    
    await db.import_jobs.update_one(
        {"id": request.job_id},
        {"$set": {
            "status": final_status,
            "imported_count": imported,
            "skipped_count": skipped,
            "error_count": len(errors_list),
            "errors": errors_list[:50],  # Store first 50 errors
            "completed_at": datetime.now(timezone.utc)
        }}
    )
    
    # Clean up temporary data
    await db.import_data.delete_one({"job_id": request.job_id})
    
    return {
        "status": final_status,
        "imported": imported,
        "skipped": skipped,
        "errors": len(errors_list),
        "error_details": errors_list[:10],
        "message": f"Importación completada: {imported} leads importados, {skipped} duplicados omitidos, {len(errors_list)} errores"
    }

@api_router.get("/import/jobs")
async def get_import_jobs(
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Get import job history"""
    jobs = await db.import_jobs.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return [serialize_doc(j) for j in jobs]

@api_router.get("/import/jobs/{job_id}")
async def get_import_job(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific import job details"""
    job = await db.import_jobs.find_one(
        {"id": job_id, "user_id": current_user["user_id"]},
        {"_id": 0}
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job no encontrado")
    return serialize_doc(job)

@api_router.get("/import/template")
async def get_import_template():
    """Get CSV template for import"""
    # Create CSV template
    headers = ["Nombre", "Email", "Teléfono", "Fuente", "Estado", "Prioridad", "Presupuesto", "Interés Propiedad", "Ubicación", "Notas"]
    sample_row = ["Juan Pérez", "juan@ejemplo.com", "+52 999 123 4567", "Facebook Ads", "nuevo", "alta", "2500000", "Departamento 2 recámaras", "Tulum Centro", "Interesado en preventa"]
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerow(sample_row)
    
    return {
        "template_csv": output.getvalue(),
        "headers": headers,
        "sample_row": sample_row,
        "instructions": [
            "Descarga la plantilla CSV y llénala con tus leads",
            "Los campos requeridos son: Nombre y Teléfono",
            "El campo Estado acepta: nuevo, contactado, calificacion, presentacion, apartado, venta",
            "El campo Prioridad acepta: baja, media, alta, urgente"
        ]
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
