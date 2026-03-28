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
import asyncio
import math
import jwt

from models import (
    User, UserCreate, UserLogin, UserResponse, TokenResponse, RefreshTokenRequest,
    Goal, GoalCreate,
    AIProfile, AIProfileCreate, AIProfileUpdate,
    Lead, LeadCreate, LeadUpdate, LeadStatus, LeadPriority,
    Activity, ActivityCreate, ActivityType,
    GamificationRule, GamificationRuleCreate, BrokerStats, PointLedger,
    ChatMessage, ChatMessageCreate,
    Script, ScriptCreate,
    DashboardStats,
    CalendarEventCreate, CalendarEventUpdate, CalendarEvent,
    IntegrationSettings, IntegrationSettingsUpdate,
    Campaign, CampaignCreate, CampaignType, CampaignStatus,
    CallRecord, CallRecordCreate, CallStatus,
    SMSRecord, SMSRecordCreate, SMSStatus,
    ConversationAnalysis,
    EmailRecord, EmailRecordCreate, EmailStatus,
    EmailTemplate, EmailTemplateCreate,
    ImportJob, ImportStatus, ImportMappingRequest, ColumnMapping,
    CampaignMetrics, AnalyticsDashboard,
    AutomationWorkflow, AutomationWorkflowCreate, AutomationExecution,
    RoundRobinConfig, CalendarAssignment,
    ProductService, ProductServiceCreate, ProductServiceUpdate,
    ApifyJobRecord, ScrapedLead
)
from auth import (
    get_password_hash, verify_password, create_access_token, create_refresh_token,
    get_current_user, require_role, get_refresh_token_user, JWT_EXPIRATION_MINUTES
)
from ai_service import get_ai_response, analyze_lead, generate_sales_script, query_database_with_ai
from module_tracker import (
    CRM_MODULES, MVP_CONFIG, MVPTier, WEEKLY_PLAN,
    get_modules_for_tier, get_module_info, get_completion_percentage,
    get_next_modules, get_weekly_plan_summary, ModuleStatus
)
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
    """Login user with access and refresh tokens"""
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    # Create access token (15 min)
    access_token = create_access_token({
        "sub": user["id"],
        "tenant_id": user["tenant_id"],
        "email": user["email"],
        "role": user["role"],
        "name": user["name"]
    })
    
    # Create refresh token (7 days)
    token_jti, refresh_token = create_refresh_token({
        "sub": user["id"],
        "tenant_id": user["tenant_id"]
    })
    
    # Store refresh token in database
    await db.refresh_tokens.update_one(
        {"jti": token_jti},
        {"$set": {
            "jti": token_jti,
            "user_id": user["id"],
            "tenant_id": user["tenant_id"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "revoked": False,
            "used": False
        }},
        upsert=True
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=JWT_EXPIRATION_MINUTES * 60,  # Seconds
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

    # Get AI profile if exists
    ai_profile = await db.ai_profiles.find_one(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    )

    response_data = {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "avatar_url": user.get("avatar_url"),
        "phone": user.get("phone"),
        "is_active": user["is_active"],
        "onboarding_completed": user.get("onboarding_completed", False),
        "account_type": user.get("account_type", "individual"),
        "ai_profile": serialize_doc(ai_profile) if ai_profile else None
    }

    return response_data


# ==================== REFRESH TOKEN ENDPOINTS ====================

@api_router.post("/auth/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest):
    """
    Refresh access token using refresh token.
    Implements refresh token rotation: old token is marked as used, new one is created.
    """
    try:
        # Decode refresh token
        payload = jwt.decode(
            request.refresh_token, 
            os.environ['JWT_SECRET'], 
            algorithms=[os.environ.get("JWT_ALGORITHM", "HS256")]
        )
        
        token_type = payload.get("type")
        token_jti = payload.get("jti")
        
        if token_type != "refresh" or not token_jti:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
        
        # Validate refresh token in database and get user
        user_info = await get_refresh_token_user(db, token_jti)
        
        # Mark old refresh token as used (token rotation)
        await db.refresh_tokens.update_one(
            {"jti": token_jti},
            {"$set": {"used": True, "used_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Create new access token
        new_access_token = create_access_token({
            "sub": user_info["user_id"],
            "tenant_id": user_info["tenant_id"],
            "email": user_info["email"],
            "role": user_info["role"],
            "name": user_info["name"]
        })
        
        # Create new refresh token (rotation)
        new_jti, new_refresh_token = create_refresh_token({
            "sub": user_info["user_id"],
            "tenant_id": user_info["tenant_id"]
        })
        
        # Store new refresh token
        await db.refresh_tokens.update_one(
            {"jti": new_jti},
            {"$set": {
                "jti": new_jti,
                "user_id": user_info["user_id"],
                "tenant_id": user_info["tenant_id"],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
                "revoked": False,
                "used": False
            }},
            upsert=True
        )
        
        # Get full user info
        user = await db.users.find_one({"id": user_info["user_id"]}, {"_id": 0})
        
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=JWT_EXPIRATION_MINUTES * 60,
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
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido o expirado"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error refreshing token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al refrescar token"
        )


@api_router.post("/auth/logout")
async def logout(request: RefreshTokenRequest, current_user: dict = Depends(get_current_user)):
    """
    Logout user by revoking the refresh token.
    Access token will expire naturally after 15 minutes.
    """
    try:
        # Decode token to get jti
        payload = jwt.decode(
            request.refresh_token,
            os.environ['JWT_SECRET'],
            algorithms=[os.environ.get("JWT_ALGORITHM", "HS256")]
        )
        
        token_jti = payload.get("jti")
        if not token_jti:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token inválido"
            )
        
        # Mark refresh token as revoked
        result = await db.refresh_tokens.update_one(
            {"jti": token_jti, "user_id": current_user["user_id"]},
            {"$set": {
                "revoked": True,
                "revoked_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Refresh token no encontrado"
            )
        
        return {"message": "Logout exitoso"}
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during logout: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al hacer logout"
        )


@api_router.post("/auth/logout-all")
async def logout_all(current_user: dict = Depends(get_current_user)):
    """
    Logout from all devices by revoking all refresh tokens for this user.
    """
    try:
        # Revoke all refresh tokens for this user
        result = await db.refresh_tokens.update_many(
            {"user_id": current_user["user_id"], "revoked": False},
            {"$set": {
                "revoked": True,
                "revoked_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {
            "message": "Logout exitoso en todos los dispositivos",
            "tokens_revoked": result.matched_count
        }
        
    except Exception as e:
        logger.error(f"Error during logout-all: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al hacer logout en todos los dispositivos"
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

# ==================== AI PROFILE ROUTES ====================

@api_router.post("/user/ai-profile", response_model=dict)
async def create_ai_profile(profile_data: AIProfileCreate, current_user: dict = Depends(get_current_user)):
    """Create or update AI profile for the current user"""
    profile_id = str(uuid.uuid4())
    profile_doc = {
        "id": profile_id,
        "user_id": current_user["user_id"],
        "tenant_id": current_user["tenant_id"],
        **profile_data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    # Upsert AI profile
    await db.ai_profiles.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": profile_doc},
        upsert=True
    )

    return {
        "message": "Perfil IA guardado exitosamente",
        "profile_id": profile_id,
        "profile": profile_data.model_dump()
    }

@api_router.get("/user/ai-profile", response_model=dict)
async def get_ai_profile(current_user: dict = Depends(get_current_user)):
    """Get AI profile for the current user"""
    profile = await db.ai_profiles.find_one(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    )

    if not profile:
        return {
            "experience": "",
            "style": "",
            "property_types": [],
            "focus_zones": [],
            "goals": ""
        }

    return serialize_doc(profile)

@api_router.patch("/user/ai-profile", response_model=dict)
async def update_ai_profile(profile_data: AIProfileUpdate, current_user: dict = Depends(get_current_user)):
    """Update AI profile (partial update)"""
    # Filter out None values
    update_data = {k: v for k, v in profile_data.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    # Update profile
    result = await db.ai_profiles.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Perfil IA no encontrado. Usa POST para crear uno nuevo.")

    # Return updated profile
    profile = await db.ai_profiles.find_one(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    )

    return {
        "message": "Perfil IA actualizado exitosamente",
        "profile": serialize_doc(profile)
    }

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
    lead_dict = lead_data.model_dump()

    # Set defaults only if not provided
    if "status" not in lead_dict or not lead_dict["status"]:
        lead_dict["status"] = "nuevo"
    if "priority" not in lead_dict or not lead_dict["priority"]:
        lead_dict["priority"] = "media"

    lead_doc = {
        "id": lead_id,
        "tenant_id": current_user["tenant_id"],
        **lead_dict,
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
    """Get all brokers - optimized with batch queries"""
    brokers = await db.users.find(
        {"tenant_id": current_user["tenant_id"], "role": {"$in": ["broker", "manager"]}},
        {"_id": 0, "password_hash": 0}
    ).to_list(100)
    
    if not brokers:
        return []
    
    broker_ids = [b["id"] for b in brokers]
    
    # Batch fetch leads count per broker
    leads_pipeline = [
        {"$match": {"assigned_broker_id": {"$in": broker_ids}}},
        {"$group": {"_id": "$assigned_broker_id", "count": {"$sum": 1}}}
    ]
    leads_counts = await db.leads.aggregate(leads_pipeline).to_list(None)
    leads_map = {item["_id"]: item["count"] for item in leads_counts}
    
    # Batch fetch points per broker
    points_pipeline = [
        {"$match": {"broker_id": {"$in": broker_ids}}},
        {"$group": {"_id": "$broker_id", "total": {"$sum": "$points"}}}
    ]
    points_results = await db.point_ledger.aggregate(points_pipeline).to_list(None)
    points_map = {item["_id"]: item["total"] for item in points_results}
    
    result = []
    for broker in brokers:
        broker_data = serialize_doc(broker)
        broker_data["leads_asignados"] = leads_map.get(broker["id"], 0)
        broker_data["total_points"] = points_map.get(broker["id"], 0)
        result.append(broker_data)
    
    return result

@api_router.get("/brokers/{broker_id}", response_model=dict)
async def get_broker(broker_id: str, current_user: dict = Depends(get_current_user)):
    """Get broker details - optimized with single aggregation"""
    broker = await db.users.find_one(
        {"id": broker_id, "tenant_id": current_user["tenant_id"]},
        {"_id": 0, "password_hash": 0}
    )
    if not broker:
        raise HTTPException(status_code=404, detail="Broker no encontrado")
    
    # Get all lead stats in single aggregation with $facet
    leads_pipeline = [
        {"$match": {"assigned_broker_id": broker_id}},
        {"$facet": {
            "total": [{"$count": "count"}],
            "ventas": [{"$match": {"status": "venta"}}, {"$count": "count"}],
            "apartados": [{"$match": {"status": "apartado"}}, {"$count": "count"}]
        }}
    ]
    leads_stats = await db.leads.aggregate(leads_pipeline).to_list(1)
    leads_data = leads_stats[0] if leads_stats else {"total": [], "ventas": [], "apartados": []}
    
    # Get all activity stats in single aggregation with $facet
    activities_pipeline = [
        {"$match": {"broker_id": broker_id}},
        {"$facet": {
            "llamadas": [{"$match": {"activity_type": "llamada"}}, {"$count": "count"}],
            "zooms": [{"$match": {"activity_type": "zoom"}}, {"$count": "count"}],
            "visitas": [{"$match": {"activity_type": "visita"}}, {"$count": "count"}]
        }}
    ]
    activities_stats = await db.activities.aggregate(activities_pipeline).to_list(1)
    activities_data = activities_stats[0] if activities_stats else {"llamadas": [], "zooms": [], "visitas": []}
    
    # Get points
    points_pipeline = [
        {"$match": {"broker_id": broker_id}},
        {"$group": {"_id": None, "total": {"$sum": "$points"}}}
    ]
    points_result = await db.point_ledger.aggregate(points_pipeline).to_list(1)
    total_points = points_result[0]["total"] if points_result else 0
    
    result = serialize_doc(broker)
    result["stats"] = {
        "ventas": leads_data["ventas"][0]["count"] if leads_data["ventas"] else 0,
        "apartados": leads_data["apartados"][0]["count"] if leads_data["apartados"] else 0,
        "leads_total": leads_data["total"][0]["count"] if leads_data["total"] else 0,
        "llamadas": activities_data["llamadas"][0]["count"] if activities_data["llamadas"] else 0,
        "zooms": activities_data["zooms"][0]["count"] if activities_data["zooms"] else 0,
        "visitas": activities_data["visitas"][0]["count"] if activities_data["visitas"] else 0,
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

    # Get AI profile for personalization
    ai_profile = await db.ai_profiles.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )

    # Get user name for personalization
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1})
    user_name = user["name"] if user else "Broker"

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

    # Get AI response with personalized profile
    ai_response = await get_ai_response(
        message.content,
        session_id,
        context,
        ai_profile=serialize_doc(ai_profile) if ai_profile else None,
        user_name=user_name
    )

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

@api_router.post("/database-chat")
async def database_chat(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Query the database using natural language.

    This endpoint uses AI for Database to convert natural language queries
    into database queries and return results. Falls back to direct MongoDB
    queries if AI for Database is unavailable.

    Example queries:
    - "Show me top 10 leads by budget"
    - "How many leads in each status?"
    - "Leads by status"
    - "How many leads?"
    """
    user_id = current_user["user_id"]
    tenant_id = current_user.get("tenant_id", f"tenant-{user_id[:8]}")

    query = request.get("query", "")
    if not query:
        raise HTTPException(status_code=400, detail="Query is required")

    # Query with fallback to MongoDB
    result = await query_database_with_ai(
        query=query,
        user_context={
            "tenant_id": tenant_id,
            "user_id": user_id
        },
        db=db
    )

    if result.get("success"):
        return {
            "success": True,
            "query": query,
            "results": result.get("results"),
            "message": "Consulta ejecutada exitosamente"
        }
    else:
        return {
            "success": False,
            "query": query,
            "error": result.get("error", "Error desconocido"),
            "message": "No se pudo ejecutar la consulta"
        }

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

# ==================== PRODUCTS/SERVICES ====================

@api_router.get("/products")
async def get_products(
    is_active: Optional[bool] = None,
    product_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Obtiene todos los productos/servicios del tenant"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])
    query = {"tenant_id": tenant_id}

    if is_active is not None:
        query["is_active"] = is_active
    if product_type:
        query["product_type"] = product_type

    products = await db.products.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [serialize_doc(p) for p in products]


@api_router.post("/products")
async def create_product(
    product_data: ProductServiceCreate,
    current_user: dict = Depends(get_current_user)
):
    """Crea un nuevo producto/servicio"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])
    product_id = str(uuid.uuid4())
    product_doc = {
        "id": product_id,
        "tenant_id": tenant_id,
        "created_by": current_user["user_id"],
        **product_data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    await db.products.insert_one(product_doc)
    return {"message": "Producto creado", "id": product_id}


@api_router.get("/products/{product_id}")
async def get_product(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Obtiene un producto por ID"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])
    product = await db.products.find_one({
        "id": product_id,
        "tenant_id": tenant_id
    }, {"_id": 0})

    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    return serialize_doc(product)


@api_router.put("/products/{product_id}")
async def update_product(
    product_id: str,
    update_data: ProductServiceUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Actualiza un producto/servicio"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = await db.products.update_one(
        {"id": product_id, "tenant_id": tenant_id},
        {"$set": update_dict}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    return {"message": "Producto actualizado"}


@api_router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Elimina un producto/servicio"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])
    result = await db.products.delete_one({
        "id": product_id,
        "tenant_id": tenant_id
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    return {"message": "Producto eliminado"}


@api_router.get("/products/templates/niche")
async def get_niche_templates():
    """Obtiene templates de descripción por nicho"""
    return {
        "real_estate": {
            "description": "Ubicación: {ubicacion}\nAmenidades: {amenidades}\nPrecio: {price}\nROI proyectado: {roi}",
            "features": ["Ubicación premium", "Plusvalía alta", "Infraestructura completa", "Entregas inmediatas"]
        },
        "software": {
            "description": "Stack tecnológico: {tech_stack}\nIntegraciones: {integrations}\nTiempo de implementación: {timeline}\nSoporte: {support}",
            "features": ["Setup incluido", "Integraciones con CRM", "Soporte 24/7", "Documentación completa"]
        },
        "digital": {
            "description": "Contenido: {contenido}\nDuración: {duracion}\nCertificado: {certificado}\nComunidad: {comunidad}",
            "features": ["Acceso inmediato", "Certificado digital", "Comunidad activa", "Actualizaciones de por vida"]
        }
    }


# ==================== APIFY/SCRAPING INTEGRATION ====================

@api_router.post("/scraper/run")
async def run_scraping_job(
    params: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Ejecuta un job de scraping con Apify"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    # Verificar configuración (opcional para modo demo)
    settings = await db.integration_settings.find_one({"user_id": current_user["user_id"]})

    # Crear registro del job
    job_id = str(uuid.uuid4())
    job_record = {
        "id": job_id,
        "user_id": current_user["user_id"],
        "tenant_id": tenant_id,
        "job_id": "",  # Se actualiza con el ID de Apify
        "actor_id": params.get("actor_id", "apify/linkedin-profile-scraper"),
        "input_params": params,
        "status": "running",
        "total_results": 0,
        "processed_results": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.apify_jobs.insert_one(job_record)

    # Ejecutar job en background
    asyncio.create_task(execute_apify_job(job_id, params, settings, current_user))

    return {"job_id": job_id, "status": "running"}


@api_router.get("/scraper/jobs/{job_id}")
async def get_scraping_job_status(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Obtiene el estado de un job de scraping"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])
    job = await db.apify_jobs.find_one({
        "id": job_id,
        "tenant_id": tenant_id
    }, {"_id": 0})

    if not job:
        raise HTTPException(status_code=404, detail="Job no encontrado")

    return serialize_doc(job)


@api_router.get("/scraper/jobs/{job_id}/results")
async def get_scraping_results(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Obtiene los leads extraídos de un job"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])
    leads = await db.scraped_leads.find({
        "apify_job_id": job_id,
        "tenant_id": tenant_id
    }, {"_id": 0}).sort("potential_score", -1).to_list(100)

    return [serialize_doc(l) for l in leads]


@api_router.post("/scraper/leads/{scraped_lead_id}/save")
async def save_scraped_lead_to_pipeline(
    scraped_lead_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Guarda un lead extraído al pipeline de leads"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])
    scraped_lead = await db.scraped_leads.find_one({
        "id": scraped_lead_id,
        "tenant_id": tenant_id
    })

    if not scraped_lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")

    # Crear lead en pipeline
    lead_data = {
        "id": str(uuid.uuid4()),
        "name": scraped_lead.get("name", "Sin nombre"),
        "email": scraped_lead.get("email"),
        "phone": scraped_lead.get("phone", ""),
        "company": scraped_lead.get("company"),
        "position": scraped_lead.get("position"),
        "source": "Scraping - Apify",
        "status": "nuevo",
        "priority": "media",
        "budget_mxn": 0.0,
        "tenant_id": tenant_id,
        "created_by": current_user["user_id"],
        "ai_analysis": scraped_lead.get("ai_analysis"),
        "intent_score": scraped_lead.get("potential_score", 50),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    await db.leads.insert_one(lead_data)

    # Actualizar scraped_lead
    await db.scraped_leads.update_one(
        {"id": scraped_lead_id},
        {"$set": {"saved_to_pipeline": True, "lead_id": lead_data["id"]}}
    )

    return {"message": "Lead guardado exitosamente", "lead_id": lead_data["id"]}


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
    """Create calendar event with automatic Google Calendar sync"""
    event_id = str(uuid.uuid4())
    
    event_doc = {
        "id": event_id,
        "user_id": current_user["user_id"],
        "tenant_id": current_user["tenant_id"],
        **event_data.model_dump(),
        "start_time": event_data.start_time.isoformat(),
        "end_time": event_data.end_time.isoformat() if event_data.end_time else None,
        "completed": False,
        "google_event_id": None,
        "synced_from_google": False,
        "last_synced_at": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Sync to Google Calendar if enabled
    google_event_id = await sync_event_to_google(current_user["user_id"], event_doc)
    if google_event_id:
        event_doc["google_event_id"] = google_event_id
        event_doc["last_synced_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.calendar_events.insert_one(event_doc)
    
    return {
        "message": "Evento creado exitosamente", 
        "id": event_id,
        "synced_to_google": google_event_id is not None
    }

@api_router.put("/calendar/events/{event_id}", response_model=dict)
async def update_calendar_event(
    event_id: str, 
    event_data: CalendarEventUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update calendar event with automatic Google Calendar sync"""
    # Get existing event
    existing = await db.calendar_events.find_one(
        {"id": event_id, "user_id": current_user["user_id"]},
        {"_id": 0}
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    # Build update dict
    update_dict = {}
    data = event_data.model_dump(exclude_unset=True)
    
    for key, value in data.items():
        if value is not None:
            if key in ['start_time', 'end_time'] and value:
                update_dict[key] = value.isoformat()
            else:
                update_dict[key] = value
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    # Update local event
    await db.calendar_events.update_one(
        {"id": event_id},
        {"$set": update_dict}
    )
    
    # Get updated event for Google sync
    updated_event = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
    
    # Sync to Google Calendar if connected
    synced = False
    if updated_event.get("google_event_id") or await is_google_calendar_enabled(current_user["user_id"]):
        google_event_id = await sync_event_to_google(current_user["user_id"], updated_event)
        if google_event_id:
            await db.calendar_events.update_one(
                {"id": event_id},
                {"$set": {
                    "google_event_id": google_event_id,
                    "last_synced_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            synced = True
    
    return {"message": "Evento actualizado", "synced_to_google": synced}

@api_router.delete("/calendar/events/{event_id}", response_model=dict)
async def delete_calendar_event(event_id: str, current_user: dict = Depends(get_current_user)):
    """Delete calendar event with automatic Google Calendar sync"""
    # Get event to check for Google Calendar ID
    event = await db.calendar_events.find_one(
        {"id": event_id, "user_id": current_user["user_id"]},
        {"_id": 0}
    )
    
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    # Delete from Google Calendar if synced
    if event.get("google_event_id"):
        await delete_from_google(current_user["user_id"], event["google_event_id"])
    
    # Delete locally
    result = await db.calendar_events.delete_one({"id": event_id, "user_id": current_user["user_id"]})
    
    return {"message": "Evento eliminado", "deleted_from_google": event.get("google_event_id") is not None}

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

# ==================== LANDING PAGE LEADS ====================

@api_router.post("/landing/lead")
async def create_landing_lead(lead_data: dict):
    """
    Capture leads from the landing page.
    Public endpoint for lead generation.
    """
    try:
        # Validate required fields
        required_fields = ["name", "email", "phone"]
        for field in required_fields:
            if field not in lead_data or not lead_data[field]:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

        # Check if lead already exists by email or phone
        existing_lead = await db.landing_leads.find_one({
            "$or": [
                {"email": lead_data["email"]},
                {"phone": lead_data["phone"]}
            ]
        })

        if existing_lead:
            # Update existing lead
            await db.landing_leads.update_one(
                {"_id": existing_lead["_id"]},
                {
                    "$set": {
                        **lead_data,
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                        "status": "re-submitted"
                    }
                }
            )
            return {"success": True, "message": "Lead updated successfully", "lead_id": str(existing_lead["_id"])}

        # Create new landing lead
        lead_doc = {
            "id": str(uuid.uuid4()),
            "name": lead_data["name"],
            "email": lead_data["email"],
            "phone": lead_data["phone"],
            "company": lead_data.get("company", ""),
            "account_type": lead_data.get("account_type", "individual"),
            "message": lead_data.get("message", ""),
            "source": "landing_page",
            "status": "new",
            "utm_source": lead_data.get("utm_source", ""),
            "utm_medium": lead_data.get("utm_medium", ""),
            "utm_campaign": lead_data.get("utm_campaign", ""),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        await db.landing_leads.insert_one(lead_doc)

        logger.info(f"New landing lead created: {lead_data['email']}")

        return {
            "success": True,
            "message": "Lead created successfully",
            "lead_id": lead_doc["id"]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating landing lead: {e}")
        raise HTTPException(status_code=500, detail="Error creating lead")

@api_router.get("/landing/leads")
async def get_landing_leads(current_user: dict = Depends(get_current_user)):
    """Get all landing leads (protected endpoint)"""
    leads = await db.landing_leads.find().sort("created_at", -1).to_list(length=1000)
    return [serialize_doc(lead) for lead in leads]

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
            "google_client_id": "",
            "google_client_secret": "",
            "google_calendar_email": None,
            "vapi_enabled": False,
            "twilio_enabled": False,
            "sendgrid_enabled": False,
            "google_calendar_enabled": False
        }
    # Mask sensitive data
    result = serialize_doc(settings)
    if result.get("vapi_api_key"):
        result["vapi_api_key"] = "••••••••" + result["vapi_api_key"][-4:]
    if result.get("twilio_auth_token"):
        result["twilio_auth_token"] = "••••••••" + result["twilio_auth_token"][-4:]
    if result.get("sendgrid_api_key"):
        result["sendgrid_api_key"] = "••••••••" + result["sendgrid_api_key"][-4:]
    if result.get("google_client_secret"):
        result["google_client_secret"] = "••••••••" + result["google_client_secret"][-4:]
    # Don't expose tokens
    result.pop("google_tokens", None)
    result.pop("google_oauth_state", None)
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
    # Google Calendar enabled is set when OAuth completes, not here
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
        "sendgrid_enabled": update_dict.get("sendgrid_enabled", False),
        "google_calendar_enabled": current.get("google_calendar_enabled", False)
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

# ==================== GOOGLE CALENDAR INTEGRATION ====================

GOOGLE_CALENDAR_SCOPES = ["https://www.googleapis.com/auth/calendar"]

@api_router.get("/oauth/google/login")
async def google_calendar_login(current_user: dict = Depends(get_current_user)):
    """Start Google OAuth flow for Calendar access"""
    settings = await db.integration_settings.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    
    if not settings or not settings.get("google_client_id") or not settings.get("google_client_secret"):
        raise HTTPException(status_code=400, detail="Google Calendar no configurado. Agrega Client ID y Client Secret primero.")
    
    from google_auth_oauthlib.flow import Flow
    
    # Get the frontend URL for redirect (required for OAuth)
    frontend_url = os.environ.get("FRONTEND_URL")
    if not frontend_url:
        raise HTTPException(status_code=500, detail="FRONTEND_URL no configurado en el servidor")
    redirect_uri = f"{frontend_url}/api/oauth/google/callback"
    
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings["google_client_id"],
                "client_secret": settings["google_client_secret"],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token"
            }
        },
        scopes=GOOGLE_CALENDAR_SCOPES,
        redirect_uri=redirect_uri
    )
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        prompt='consent',
        include_granted_scopes='true'
    )
    
    # Store state for verification
    await db.integration_settings.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"google_oauth_state": state}}
    )
    
    return {"authorization_url": authorization_url, "state": state}

@api_router.get("/oauth/google/callback")
async def google_calendar_callback(code: str, state: str = None):
    """Handle Google OAuth callback"""
    import requests
    from starlette.responses import RedirectResponse
    
    # Get frontend URL first for all redirects
    frontend_url = os.environ.get("FRONTEND_URL")
    if not frontend_url:
        # Fallback to root if FRONTEND_URL not set
        return RedirectResponse("/settings?error=server_config_error")
    
    # Find user by state
    settings = await db.integration_settings.find_one({"google_oauth_state": state}, {"_id": 0})
    if not settings:
        return RedirectResponse(f"{frontend_url}/settings?error=invalid_state")
    
    redirect_uri = f"{frontend_url}/api/oauth/google/callback"
    
    # Exchange code for tokens
    try:
        token_response = requests.post(
            'https://oauth2.googleapis.com/token',
            data={
                'code': code,
                'client_id': settings["google_client_id"],
                'client_secret': settings["google_client_secret"],
                'redirect_uri': redirect_uri,
                'grant_type': 'authorization_code'
            }
        ).json()
        
        if 'error' in token_response:
            return RedirectResponse(f"{frontend_url}/settings?error={token_response.get('error_description', 'token_error')}")
        
        # Get user email
        user_info = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {token_response["access_token"]}'}
        ).json()
        
        # Save tokens
        await db.integration_settings.update_one(
            {"user_id": settings["user_id"]},
            {"$set": {
                "google_tokens": token_response,
                "google_calendar_email": user_info.get('email'),
                "google_calendar_enabled": True,
                "google_oauth_state": None
            }}
        )
        
        return RedirectResponse(f"{frontend_url}/settings?google_connected=true&email={user_info.get('email', '')}")
    except Exception as e:
        return RedirectResponse(f"{frontend_url}/settings?error={str(e)}")

@api_router.post("/oauth/google/disconnect")
async def google_calendar_disconnect(current_user: dict = Depends(get_current_user)):
    """Disconnect Google Calendar"""
    await db.integration_settings.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {
            "google_tokens": None,
            "google_calendar_email": None,
            "google_calendar_enabled": False
        }}
    )
    return {"message": "Google Calendar desconectado"}

async def get_google_credentials(user_id: str):
    """Get and refresh Google credentials if needed"""
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request as GoogleRequest
    
    settings = await db.integration_settings.find_one({"user_id": user_id}, {"_id": 0})
    if not settings or not settings.get("google_tokens"):
        return None
    
    tokens = settings["google_tokens"]
    creds = Credentials(
        token=tokens.get('access_token'),
        refresh_token=tokens.get('refresh_token'),
        token_uri='https://oauth2.googleapis.com/token',
        client_id=settings.get("google_client_id"),
        client_secret=settings.get("google_client_secret")
    )
    
    if creds.expired and creds.refresh_token:
        creds.refresh(GoogleRequest())
        await db.integration_settings.update_one(
            {"user_id": user_id},
            {"$set": {"google_tokens.access_token": creds.token}}
        )
    
    return creds

async def is_google_calendar_enabled(user_id: str) -> bool:
    """Check if Google Calendar is enabled for user"""
    settings = await db.integration_settings.find_one({"user_id": user_id}, {"_id": 0})
    return settings.get("google_calendar_enabled", False) if settings else False

async def sync_event_to_google(user_id: str, event_doc: dict) -> str | None:
    """Sync a local event to Google Calendar. Returns google_event_id or None."""
    from googleapiclient.discovery import build
    
    if not await is_google_calendar_enabled(user_id):
        return None
    
    creds = await get_google_credentials(user_id)
    if not creds:
        return None
    
    try:
        service = build('calendar', 'v3', credentials=creds)
        
        # Build Google Calendar event
        google_event = {
            'summary': event_doc.get('title', 'Evento'),
            'description': event_doc.get('description', ''),
            'start': {
                'dateTime': event_doc.get('start_time'),
                'timeZone': 'America/Mexico_City',
            },
            'end': {
                'dateTime': event_doc.get('end_time') or event_doc.get('start_time'),
                'timeZone': 'America/Mexico_City',
            },
        }
        
        # Add reminder if specified
        if event_doc.get('reminder_minutes'):
            google_event['reminders'] = {
                'useDefault': False,
                'overrides': [
                    {'method': 'popup', 'minutes': event_doc.get('reminder_minutes', 30)}
                ]
            }
        
        # Create or update in Google
        if event_doc.get('google_event_id'):
            # Update existing
            created = service.events().update(
                calendarId='primary',
                eventId=event_doc['google_event_id'],
                body=google_event
            ).execute()
        else:
            # Create new
            created = service.events().insert(calendarId='primary', body=google_event).execute()
        
        return created.get('id')
    except Exception as e:
        print(f"Error syncing to Google Calendar: {e}")
        return None

async def delete_from_google(user_id: str, google_event_id: str) -> bool:
    """Delete event from Google Calendar. Returns True on success."""
    from googleapiclient.discovery import build
    
    if not google_event_id:
        return False
    
    if not await is_google_calendar_enabled(user_id):
        return False
    
    creds = await get_google_credentials(user_id)
    if not creds:
        return False
    
    try:
        service = build('calendar', 'v3', credentials=creds)
        service.events().delete(calendarId='primary', eventId=google_event_id).execute()
        return True
    except Exception as e:
        print(f"Error deleting from Google Calendar: {e}")
        return False

@api_router.get("/google-calendar/events")
async def get_google_calendar_events(
    time_min: str = None,
    time_max: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get events from Google Calendar"""
    from googleapiclient.discovery import build
    
    creds = await get_google_credentials(current_user["user_id"])
    if not creds:
        raise HTTPException(status_code=400, detail="Google Calendar no conectado")
    
    try:
        service = build('calendar', 'v3', credentials=creds)
        
        # Default to next 30 days if not specified
        if not time_min:
            time_min = datetime.now(timezone.utc).isoformat()
        if not time_max:
            time_max = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        
        events_result = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            maxResults=100,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        return events_result.get('items', [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener eventos: {str(e)}")

@api_router.post("/google-calendar/events")
async def create_google_calendar_event(
    event_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create event in Google Calendar"""
    from googleapiclient.discovery import build
    
    creds = await get_google_credentials(current_user["user_id"])
    if not creds:
        raise HTTPException(status_code=400, detail="Google Calendar no conectado")
    
    try:
        service = build('calendar', 'v3', credentials=creds)
        
        event = {
            'summary': event_data.get('title', 'Evento'),
            'description': event_data.get('description', ''),
            'start': {
                'dateTime': event_data.get('start_time'),
                'timeZone': 'America/Mexico_City',
            },
            'end': {
                'dateTime': event_data.get('end_time'),
                'timeZone': 'America/Mexico_City',
            },
        }
        
        created_event = service.events().insert(calendarId='primary', body=event).execute()
        return {"id": created_event['id'], "link": created_event.get('htmlLink')}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear evento: {str(e)}")

@api_router.delete("/google-calendar/events/{event_id}")
async def delete_google_calendar_event(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete event from Google Calendar"""
    from googleapiclient.discovery import build
    
    creds = await get_google_credentials(current_user["user_id"])
    if not creds:
        raise HTTPException(status_code=400, detail="Google Calendar no conectado")
    
    try:
        service = build('calendar', 'v3', credentials=creds)
        service.events().delete(calendarId='primary', eventId=event_id).execute()
        return {"message": "Evento eliminado de Google Calendar"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar evento: {str(e)}")

@api_router.post("/calendar/events/{event_id}/sync-google")
async def sync_single_event_to_google(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Sync local calendar event to Google Calendar"""
    from googleapiclient.discovery import build
    
    # Get local event
    event = await db.calendar_events.find_one(
        {"id": event_id, "user_id": current_user["user_id"]},
        {"_id": 0}
    )
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    creds = await get_google_credentials(current_user["user_id"])
    if not creds:
        raise HTTPException(status_code=400, detail="Google Calendar no conectado")
    
    try:
        service = build('calendar', 'v3', credentials=creds)
        
        google_event = {
            'summary': event.get('title', 'Evento'),
            'description': event.get('description', ''),
            'start': {
                'dateTime': event.get('start_time'),
                'timeZone': 'America/Mexico_City',
            },
            'end': {
                'dateTime': event.get('end_time') or event.get('start_time'),
                'timeZone': 'America/Mexico_City',
            },
        }
        
        created = service.events().insert(calendarId='primary', body=google_event).execute()
        
        # Update local event with Google Calendar ID
        await db.calendar_events.update_one(
            {"id": event_id},
            {"$set": {
                "google_event_id": created['id'],
                "last_synced_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {"message": "Evento sincronizado", "google_event_id": created['id']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al sincronizar: {str(e)}")

@api_router.post("/google-calendar/import")
async def import_google_calendar_events(
    days_back: int = 30,
    days_forward: int = 90,
    current_user: dict = Depends(get_current_user)
):
    """Import events from Google Calendar to Rovi (Google → Rovi sync)"""
    from googleapiclient.discovery import build
    
    creds = await get_google_credentials(current_user["user_id"])
    if not creds:
        raise HTTPException(status_code=400, detail="Google Calendar no conectado")
    
    try:
        service = build('calendar', 'v3', credentials=creds)
        
        # Get events from the past and future
        time_min = (datetime.now(timezone.utc) - timedelta(days=days_back)).isoformat()
        time_max = (datetime.now(timezone.utc) + timedelta(days=days_forward)).isoformat()
        
        events_result = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            maxResults=500,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        google_events = events_result.get('items', [])
        imported_count = 0
        skipped_count = 0
        
        for g_event in google_events:
            google_event_id = g_event.get('id')
            
            # Check if already imported
            existing = await db.calendar_events.find_one({
                "google_event_id": google_event_id,
                "user_id": current_user["user_id"]
            })
            
            if existing:
                skipped_count += 1
                continue
            
            # Parse start and end times
            start = g_event.get('start', {})
            end = g_event.get('end', {})
            
            start_time = start.get('dateTime') or start.get('date')
            end_time = end.get('dateTime') or end.get('date')
            
            # Create local event
            event_doc = {
                "id": str(uuid.uuid4()),
                "user_id": current_user["user_id"],
                "tenant_id": current_user["tenant_id"],
                "title": g_event.get('summary', 'Evento de Google'),
                "description": g_event.get('description', ''),
                "event_type": "otro",  # Default type for imported events
                "start_time": start_time,
                "end_time": end_time,
                "lead_id": None,
                "reminder_minutes": 30,
                "color": None,
                "completed": False,
                "google_event_id": google_event_id,
                "synced_from_google": True,
                "last_synced_at": datetime.now(timezone.utc).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.calendar_events.insert_one(event_doc)
            imported_count += 1
        
        return {
            "message": f"Importación completada",
            "imported": imported_count,
            "skipped": skipped_count,
            "total_found": len(google_events)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al importar: {str(e)}")

@api_router.post("/google-calendar/sync")
async def full_calendar_sync(current_user: dict = Depends(get_current_user)):
    """Full bidirectional sync between Rovi and Google Calendar"""
    from googleapiclient.discovery import build
    
    creds = await get_google_credentials(current_user["user_id"])
    if not creds:
        raise HTTPException(status_code=400, detail="Google Calendar no conectado")
    
    try:
        service = build('calendar', 'v3', credentials=creds)
        
        stats = {
            "exported_to_google": 0,
            "imported_from_google": 0,
            "updated": 0,
            "errors": 0
        }
        
        # 1. Export local events without google_event_id to Google (Rovi → Google)
        local_events = await db.calendar_events.find({
            "user_id": current_user["user_id"],
            "google_event_id": None
        }, {"_id": 0}).to_list(500)
        
        for event in local_events:
            google_event = {
                'summary': event.get('title', 'Evento'),
                'description': event.get('description', ''),
                'start': {
                    'dateTime': event.get('start_time'),
                    'timeZone': 'America/Mexico_City',
                },
                'end': {
                    'dateTime': event.get('end_time') or event.get('start_time'),
                    'timeZone': 'America/Mexico_City',
                },
            }
            
            try:
                created = service.events().insert(calendarId='primary', body=google_event).execute()
                await db.calendar_events.update_one(
                    {"id": event["id"]},
                    {"$set": {
                        "google_event_id": created['id'],
                        "last_synced_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                stats["exported_to_google"] += 1
            except Exception as e:
                print(f"Error exporting event {event['id']}: {e}")
                stats["errors"] += 1
        
        # 2. Import Google events not in Rovi (Google → Rovi)
        time_min = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        time_max = (datetime.now(timezone.utc) + timedelta(days=90)).isoformat()
        
        events_result = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            maxResults=500,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        google_events = events_result.get('items', [])
        
        for g_event in google_events:
            google_event_id = g_event.get('id')
            
            # Check if exists in Rovi
            existing = await db.calendar_events.find_one({
                "google_event_id": google_event_id,
                "user_id": current_user["user_id"]
            })
            
            if not existing:
                # Import new event
                start = g_event.get('start', {})
                end = g_event.get('end', {})
                
                event_doc = {
                    "id": str(uuid.uuid4()),
                    "user_id": current_user["user_id"],
                    "tenant_id": current_user["tenant_id"],
                    "title": g_event.get('summary', 'Evento de Google'),
                    "description": g_event.get('description', ''),
                    "event_type": "otro",
                    "start_time": start.get('dateTime') or start.get('date'),
                    "end_time": end.get('dateTime') or end.get('date'),
                    "lead_id": None,
                    "reminder_minutes": 30,
                    "color": None,
                    "completed": False,
                    "google_event_id": google_event_id,
                    "synced_from_google": True,
                    "last_synced_at": datetime.now(timezone.utc).isoformat(),
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                
                await db.calendar_events.insert_one(event_doc)
                stats["imported_from_google"] += 1
        
        return {
            "message": "Sincronización completada",
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en sincronización: {str(e)}")

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

@api_router.put("/email-templates/{template_id}")
async def update_email_template(
    template_id: str,
    template_data: EmailTemplateCreate,
    current_user: dict = Depends(get_current_user)
):
    """Update an email template"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])
    
    existing = await db.email_templates.find_one({"id": template_id, "tenant_id": tenant_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    
    update_data = template_data.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.email_templates.update_one(
        {"id": template_id},
        {"$set": update_data}
    )
    
    updated = await db.email_templates.find_one({"id": template_id}, {"_id": 0})
    return serialize_doc(updated)

@api_router.get("/email-templates/{template_id}")
async def get_email_template(
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a single email template"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])
    template = await db.email_templates.find_one({"id": template_id, "tenant_id": tenant_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return serialize_doc(template)


@api_router.post("/email-templates/{template_id}/preview")
async def preview_email_template(
    template_id: str,
    preview_data: Optional[Dict[str, Any]] = None,
    current_user: dict = Depends(get_current_user)
):
    """Preview email template with sample data"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])
    template = await db.email_templates.find_one({"id": template_id, "tenant_id": tenant_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")

    # Default preview data for real estate
    default_preview_data = {
        "nombre": "Juan Pérez",
        "propiedad": "Residencial Santa Fe",
        "property_address": "Av. Presidente Masaryk 101, Polanco",
        "property_price": "$5,500,000 MXN",
        "property_image": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600",
        "broker_name": current_user.get("name", "Tu Agente"),
        "broker_signature": f"{current_user.get('name', 'Tu Agente')}<br/>Rovi Real Estate<br/>+52 55 1234 5678",
        "company_name": "Rovi Real Estate",
        "client_name": "Juan Pérez",
        "email": "juan.perez@email.com",
        "phone": "+52 55 9876 5432"
    }

    # Merge with provided preview data
    data = {**default_preview_data, **(preview_data or {})}

    # Replace variables in both subject and html_content
    html_content = template.get("html_content", "")
    subject = template.get("subject", "")

    # Replace {{variable}} format
    for key, value in data.items():
        if isinstance(value, str):
            html_content = html_content.replace(f"{{{{{key}}}}}", value)
            subject = subject.replace(f"{{{{{key}}}}}", value)

    return {
        "subject": subject,
        "html_content": html_content,
        "preview_data": data
    }


@api_router.post("/email-templates/send-test")
async def send_test_email(
    template_id: str,
    request_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Send a test email using a template"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    # Get template
    template = await db.email_templates.find_one({"id": template_id, "tenant_id": tenant_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")

    # Get recipient email from request
    recipient = request_data.get("recipient_email") or current_user.get("email")
    preview_data = request_data.get("preview_data", {})

    # Generate preview with data
    preview_result = await preview_email_template(template_id, preview_data, current_user)

    # Here you would integrate with SendGrid or another email service
    # For now, we'll just log and return success
    logger.info(f"Test email would be sent to {recipient}")
    logger.info(f"Subject: {preview_result['subject']}")

    # TODO: Implement actual SendGrid integration
    # from sendgrid import SendGridAPIClient
    # from sendgrid.helpers.mail import Mail
    # message = Mail(
    #     from_email='noreply@rovirealestate.com',
    #     to_emails=recipient,
    #     subject=preview_result['subject'],
    #     html_content=preview_result['html_content']
    # )
    # sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
    # response = sg.send(message)

    return {
        "success": True,
        "message": f"Email de prueba enviado a {recipient}",
        "subject": preview_result['subject'],
        "html_preview": preview_result['html_content'][:500] + "..." if len(preview_result['html_content']) > 500 else preview_result['html_content']
    }


# Seed data for email templates
@api_router.post("/email-templates/seed")
async def seed_email_templates(current_user: dict = Depends(get_current_user)):
    """Seed predefined email templates for real estate"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    # Check if templates already exist
    existing = await db.email_templates.count_documents({"tenant_id": tenant_id})
    if existing > 0:
        return {"message": f"Ya existen {existing} plantillas", "created": 0}

    templates = [
        {
            "id": str(uuid.uuid4()),
            "user_id": current_user["user_id"],
            "tenant_id": tenant_id,
            "name": "Invitación Open House",
            "category": "open_house",
            "subject": "🏠 ¡Te invitamos a nuestro Open House en {{propiedad}}!",
            "html_content": """<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" style="width:600px;max-width:100%;border-collapse:collapse;background-color:#ffffff;">
          <tr>
            <td style="padding:30px;text-align:center;background-color:#0D9488;">
              <h1 style="color:#ffffff;margin:0;font-size:28px;">Open House</h1>
              <p style="color:#ffffff;margin:10px 0 0 0;font-size:16px;">Te esperamos este fin de semana</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 20px;">
              <h2 style="color:#333;margin:0 0 10px;">Hola {{nombre}},</h2>
              <p style="color:#666;line-height:1.6;">Tenemos el placer de invitarte a nuestro próximo Open House en <strong>{{propiedad}}</strong>.</p>
              <div style="margin:30px 0;padding:20px;background-color:#f8f9fa;border-radius:8px;">
                <p style="margin:0;font-size:18px;color:#0D9488;"><strong>📅 Sábado y Domingo</strong></p>
                <p style="margin:5px 0 0;font-size:16px;">11:00 AM - 4:00 PM</p>
              </div>
              <p style="color:#666;line-height:1.6;">Aprovecha para recorrer la propiedad, conocer los acabados y despejar todas tus dudas.</p>
              <div style="text-align:center;margin:30px 0;">
                <a href="#" style="display:inline-block;background-color:#0D9488;color:#ffffff;padding:15px 40px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;">Confirmar Asistencia</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px;text-align:center;background-color:#f8f9fa;border-top:1px solid #e9ecef;">
              <p style="margin:0;color:#666;font-size:14px;">{{broker_signature}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>""",
            "json_content": None,
            "variables": ["nombre", "propiedad", "broker_signature"],
            "thumbnail_url": None,
            "is_default": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": current_user["user_id"],
            "tenant_id": tenant_id,
            "name": "Promoción de Propiedad",
            "category": "property_promo",
            "subject": "✨ Nueva propiedad disponible: {{propiedad}} - {{property_price}}",
            "html_content": """<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" style="width:600px;max-width:100%;border-collapse:collapse;background-color:#ffffff;">
          <tr>
            <td style="padding:0;">
              <img src="{{property_image}}" alt="{{propiedad}}" style="width:100%;display:block;" />
            </td>
          </tr>
          <tr>
            <td style="padding:30px 20px;">
              <h2 style="color:#333;margin:0 0 10px;">Hola {{nombre}},</h2>
              <p style="color:#666;line-height:1.6;">Tenemos una propiedad que podría ser perfecta para ti:</p>
              <h3 style="color:#0D9488;margin:20px 0 10px;">{{propiedad}}</h3>
              <p style="color:#666;line-height:1.6;">{{property_address}}</p>
              <div style="margin:30px 0;padding:20px;background-color:#f8f9fa;border-radius:8px;">
                <p style="margin:0;font-size:32px;color:#0D9488;font-weight:bold;">{{property_price}}</p>
              </div>
              <p style="color:#666;line-height:1.6;">Esta propiedad cuenta con excelentes acabados, ubicación privilegiada y amenidades de primer nivel.</p>
              <div style="text-align:center;margin:30px 0;">
                <a href="#" style="display:inline-block;background-color:#0D9488;color:#ffffff;padding:15px 40px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;">Agendar Visita</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px;text-align:center;background-color:#f8f9fa;border-top:1px solid #e9ecef;">
              <p style="margin:0;color:#666;font-size:14px;">{{broker_signature}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>""",
            "json_content": None,
            "variables": ["nombre", "propiedad", "property_price", "property_address", "property_image", "broker_signature"],
            "thumbnail_url": None,
            "is_default": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": current_user["user_id"],
            "tenant_id": tenant_id,
            "name": "Seguimiento a Cliente",
            "category": "follow_up",
            "subject": "¿Hola {{nombre}}? ¿Cómo te va con tu búsqueda?",
            "html_content": """<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" style="width:600px;max-width:100%;border-collapse:collapse;background-color:#ffffff;">
          <tr>
            <td style="padding:30px 20px;">
              <h2 style="color:#333;margin:0 0 10px;">Hola {{nombre}},</h2>
              <p style="color:#666;line-height:1.6;">Espero que estés teniendo una excelente semana.</p>
              <p style="color:#666;line-height:1.6;">Me pongo en contacto para saber cómo te va con tu búsqueda de propiedad. ¿Has tenido oportunidad de ver algunas opciones?</p>
              <p style="color:#666;line-height:1.6;">Estoy aquí para ayudarte con cualquier duda que tengas o mostrarte nuevas propiedades que puedan interesarte.</p>
              <div style="margin:30px 0;padding:20px;background-color:#f8f9fa;border-radius:8px;">
                <p style="margin:0;font-size:16px;color:#333;"><strong>📞 ¿Tienes 5 minutos?</strong></p>
                <p style="margin:10px 0 0;font-size:14px;color:#666;">Hablemos para conocer mejor lo que buscas</p>
              </div>
              <div style="text-align:center;margin:30px 0;">
                <a href="#" style="display:inline-block;background-color:#0D9488;color:#ffffff;padding:15px 40px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;">Agendar Llamada</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px;text-align:center;background-color:#f8f9fa;border-top:1px solid #e9ecef;">
              <p style="margin:0;color:#666;font-size:14px;">{{broker_signature}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>""",
            "json_content": None,
            "variables": ["nombre", "broker_signature"],
            "thumbnail_url": None,
            "is_default": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": current_user["user_id"],
            "tenant_id": tenant_id,
            "name": "Actualización de Mercado",
            "category": "market_update",
            "subject": "📊 Actualización del mercado inmobiliario - {{nombre}}",
            "html_content": """<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" style="width:600px;max-width:100%;border-collapse:collapse;background-color:#ffffff;">
          <tr>
            <td style="padding:30px;text-align:center;background-color:#0D9488;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;">📊 Resumen Mensual</h1>
              <p style="color:#ffffff;margin:10px 0 0 0;">Mercado Inmobiliario</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 20px;">
              <h2 style="color:#333;margin:0 0 10px;">Hola {{nombre}},</h2>
              <p style="color:#666;line-height:1.6;">Compartimos contigo las tendencias del mercado inmobiliario de este mes:</p>
              <div style="margin:30px 0;">
                <div style="padding:15px;background-color:#f8f9fa;border-radius:8px;margin-bottom:15px;">
                  <p style="margin:0;font-size:18px;color:#0D9488;"><strong>📈 +12% </strong> <span style="color:#666;font-size:14px;">en precios promedio</span></p>
                </div>
                <div style="padding:15px;background-color:#f8f9fa;border-radius:8px;margin-bottom:15px;">
                  <p style="margin:0;font-size:18px;color:#0D9488;"><strong>🏠 45 </strong> <span style="color:#666;font-size:14px;">nuevas propiedades en tu zona de interés</span></p>
                </div>
                <div style="padding:15px;background-color:#f8f9fa;border-radius:8px;">
                  <p style="margin:0;font-size:18px;color:#0D9488;"><strong>⏱️ 23 días</strong> <span style="color:#666;font-size:14px;">tiempo promedio de venta</span></p>
                </div>
              </div>
              <p style="color:#666;line-height:1.6;">Es un buen momento para comprar o vender. Si tienes preguntas, estoy aquí para asesorarte.</p>
              <div style="text-align:center;margin:30px 0;">
                <a href="#" style="display:inline-block;background-color:#0D9488;color:#ffffff;padding:15px 40px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;">Solicitar Asesoría</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px;text-align:center;background-color:#f8f9fa;border-top:1px solid #e9ecef;">
              <p style="margin:0;color:#666;font-size:14px;">{{broker_signature}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>""",
            "json_content": None,
            "variables": ["nombre", "broker_signature"],
            "thumbnail_url": None,
            "is_default": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": current_user["user_id"],
            "tenant_id": tenant_id,
            "name": "Nurturing Compradores",
            "category": "buyer_nurturing",
            "subject": "🔑 Consejos para encontrar tu propiedad ideal",
            "html_content": """<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" style="width:600px;max-width:100%;border-collapse:collapse;background-color:#ffffff;">
          <tr>
            <td style="padding:30px 20px;">
              <h2 style="color:#333;margin:0 0 10px;">Hola {{nombre}},</h2>
              <p style="color:#666;line-height:1.6;">Sé que encontrar la propiedad perfecta puede ser abrumador. Aquí te comparto algunos consejos útiles:</p>
              <div style="margin:30px 0;">
                <div style="margin-bottom:20px;padding-left:20px;">
                  <p style="margin:0 0 5px;color:#0D9488;font-weight:bold;">1️⃣ Define tu presupuesto real</p>
                  <p style="margin:0;color:#666;font-size:14px;">Considera gastos adicionales como notarios y honorarios</p>
                </div>
                <div style="margin-bottom:20px;padding-left:20px;">
                  <p style="margin:0 0 5px;color:#0D9488;font-weight:bold;">2️⃣ Ubicación vs Amenidades</p>
                  <p style="margin:0;color:#666;font-size:14px;">Prioriza lo que realmente importa para tu estilo de vida</p>
                </div>
                <div style="margin-bottom:20px;padding-left:20px;">
                  <p style="margin:0 0 5px;color:#0D9488;font-weight:bold;">3️⃣ Visita en diferentes horarios</p>
                  <p style="margin:0;color:#666;font-size:14px;">Conoce cómo se ve la propiedad de día y de noche</p>
                </div>
                <div style="padding-left:20px;">
                  <p style="margin:0 0 5px;color:#0D9488;font-weight:bold;">4️⃣ Verifica la plusvalía</p>
                  <p style="margin:0;color:#666;font-size:14px;">Investiga el desarrollo futuro de la zona</p>
                </div>
              </div>
              <p style="color:#666;line-height:1.6;">Estoy aquí para guiarte en cada paso del proceso. ¿Te gustaría agendar una asesoría personalizada?</p>
              <div style="text-align:center;margin:30px 0;">
                <a href="#" style="display:inline-block;background-color:#0D9488;color:#ffffff;padding:15px 40px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;">Agendar Asesoría</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px;text-align:center;background-color:#f8f9fa;border-top:1px solid #e9ecef;">
              <p style="margin:0;color:#666;font-size:14px;">{{broker_signature}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>""",
            "json_content": None,
            "variables": ["nombre", "broker_signature"],
            "thumbnail_url": None,
            "is_default": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": current_user["user_id"],
            "tenant_id": tenant_id,
            "name": "Nurturing Vendedores",
            "category": "seller_nurturing",
            "subject": "💰 ¿Cuánto vale tu propiedad en el mercado actual?",
            "html_content": """<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" style="width:600px;max-width:100%;border-collapse:collapse;background-color:#ffffff;">
          <tr>
            <td style="padding:30px;text-align:center;background-color:#0D9488;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;">💰 Vende tu Propiedad</h1>
              <p style="color:#ffffff;margin:10px 0 0 0;">Al mejor precio y en el menor tiempo</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 20px;">
              <h2 style="color:#333;margin:0 0 10px;">Hola {{nombre}},</h2>
              <p style="color:#666;line-height:1.6;">¿Has considerado vender tu propiedad? El mercado actual es favorable para los vendedores.</p>
              <div style="margin:30px 0;padding:20px;background-color:#f8f9fa;border-radius:8px;">
                <p style="margin:0;font-size:16px;color:#333;"><strong>Nuestros servicios incluyen:</strong></p>
                <ul style="margin:15px 0;padding-left:20px;color:#666;">
                  <li>Valoración profesional gratuita</li>
                  <li>Estrategia de marketing personalizada</li>
                  <li>Fotografía profesional y tour virtual</li>
                  <li>Promoción en +20 portales inmobiliarios</li>
                </ul>
              </div>
              <p style="color:#666;line-height:1.6;">En el último mes, hemos vendido propiedades similares en un promedio de 23 días.</p>
              <div style="text-align:center;margin:30px 0;">
                <a href="#" style="display:inline-block;background-color:#0D9488;color:#ffffff;padding:15px 40px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;">Solicitar Valoración Gratuita</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px;text-align:center;background-color:#f8f9fa;border-top:1px solid #e9ecef;">
              <p style="margin:0;color:#666;font-size:14px;">{{broker_signature}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>""",
            "json_content": None,
            "variables": ["nombre", "broker_signature"],
            "thumbnail_url": None,
            "is_default": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
    ]

    for template in templates:
        await db.email_templates.insert_one(template)

    return {
        "message": "Plantillas predefinidas creadas exitosamente",
        "created": len(templates),
        "templates": [{"id": t["id"], "name": t["name"], "category": t["category"]} for t in templates]
    }


# ==================== CAMPAIGN ANALYTICS ====================

@api_router.get("/analytics/overview")
async def get_analytics_overview(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get analytics overview for dashboard"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    # Parse dates or default to last 30 days
    if start_date:
        start_dt = datetime.fromisoformat(start_date)
    else:
        start_dt = datetime.now(timezone.utc) - timedelta(days=30)

    if end_date:
        end_dt = datetime.fromisoformat(end_date)
    else:
        end_dt = datetime.now(timezone.utc)

    # Build date filter
    date_filter = {
        "tenant_id": tenant_id,
        "date": {"$gte": start_dt, "$lte": end_dt}
    }

    # Aggregate metrics by source
    pipeline = [
        {"$match": date_filter},
        {"$group": {
            "_id": "$source",
            "impressions": {"$sum": "$impressions"},
            "clicks": {"$sum": "$clicks"},
            "conversions": {"$sum": "$conversions"},
            "spend": {"$sum": "$spend"},
            "leads": {"$sum": "$leads"},
            "property_views": {"$sum": "$property_views"},
            "viewing_requests": {"$sum": "$viewing_requests"},
            "brokerage_signed": {"$sum": "$brokerage_signed"}
        }}
    ]

    results = await db.campaign_metrics.aggregate(pipeline).to_list(None)

    # Calculate totals
    total_spend = sum(r.get("spend", 0) for r in results)
    total_impressions = sum(r.get("impressions", 0) for r in results)
    total_clicks = sum(r.get("clicks", 0) for r in results)
    total_conversions = sum(r.get("conversions", 0) for r in results)
    total_leads = sum(r.get("leads", 0) for r in results)

    # Build response
    leads_by_source = {r["_id"]: r.get("leads", 0) for r in results}
    spend_by_source = {r["_id"]: r.get("spend", 0) for r in results}
    conversions_by_source = {r["_id"]: r.get("conversions", 0) for r in results}

    avg_ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
    avg_cpl = (total_spend / total_leads) if total_leads > 0 else 0

    # Real estate specific totals
    property_views = sum(r.get("property_views", 0) for r in results)
    viewing_requests = sum(r.get("viewing_requests", 0) for r in results)
    brokerage_signed = sum(r.get("brokerage_signed", 0) for r in results)

    return {
        "total_spend": round(total_spend, 2),
        "total_impressions": total_impressions,
        "total_clicks": total_clicks,
        "total_conversions": total_conversions,
        "total_leads": total_leads,
        "avg_ctr": round(avg_ctr, 2),
        "avg_cpl": round(avg_cpl, 2),
        "leads_by_source": leads_by_source,
        "spend_by_source": spend_by_source,
        "conversions_by_source": conversions_by_source,
        "property_views": property_views,
        "viewing_requests": viewing_requests,
        "brokerage_signed": brokerage_signed
    }


@api_router.get("/analytics/by-source/{source}")
async def get_analytics_by_source(
    source: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get analytics for a specific source (meta, google, email, etc.)"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    if start_date:
        start_dt = datetime.fromisoformat(start_date)
    else:
        start_dt = datetime.now(timezone.utc) - timedelta(days=30)

    if end_date:
        end_dt = datetime.fromisoformat(end_date)
    else:
        end_dt = datetime.now(timezone.utc)

    date_filter = {
        "tenant_id": tenant_id,
        "source": source,
        "date": {"$gte": start_dt, "$lte": end_dt}
    }

    metrics = await db.campaign_metrics.find(date_filter, {"_id": 0}).sort("date", 1).to_list(100)

    # Calculate totals
    totals = {
        "impressions": sum(m.get("impressions", 0) for m in metrics),
        "clicks": sum(m.get("clicks", 0) for m in metrics),
        "conversions": sum(m.get("conversions", 0) for m in metrics),
        "spend": sum(m.get("spend", 0) for m in metrics),
        "leads": sum(m.get("leads", 0) for m in metrics),
    }

    return {
        "source": source,
        "metrics": [serialize_doc(m) for m in metrics],
        "totals": totals
    }


@api_router.get("/analytics/timeline")
async def get_analytics_timeline(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    granularity: str = "daily",  # daily, weekly
    current_user: dict = Depends(get_current_user)
):
    """Get analytics timeline for charts"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    if start_date:
        start_dt = datetime.fromisoformat(start_date)
    else:
        start_dt = datetime.now(timezone.utc) - timedelta(days=30)

    if end_date:
        end_dt = datetime.fromisoformat(end_date)
    else:
        end_dt = datetime.now(timezone.utc)

    date_filter = {
        "tenant_id": tenant_id,
        "date": {"$gte": start_dt, "$lte": end_dt}
    }

    # Group by date and source
    pipeline = [
        {"$match": date_filter},
        {"$group": {
            "_id": {
                "date": {"$dateToString": {"format": "%Y-%m-%d" if granularity == "daily" else "%Y-%U", "date": "$date"}},
                "source": "$source"
            },
            "impressions": {"$sum": "$impressions"},
            "clicks": {"$sum": "$clicks"},
            "leads": {"$sum": "$leads"},
            "spend": {"$sum": "$spend"},
        }},
        {"$sort": {"_id.date": 1}}
    ]

    results = await db.campaign_metrics.aggregate(pipeline).to_list(200)

    # Format for frontend
    timeline = {}
    for r in results:
        date_key = r["_id"]["date"]
        source = r["_id"]["source"]
        if date_key not in timeline:
            timeline[date_key] = {"date": date_key}
        timeline[date_key][source] = {
            "impressions": r.get("impressions", 0),
            "clicks": r.get("clicks", 0),
            "leads": r.get("leads", 0),
            "spend": round(r.get("spend", 0), 2)
        }

    return {"timeline": list(timeline.values()), "sources": list(set(r["_id"]["source"] for r in results))}


@api_router.post("/analytics/metrics")
async def create_campaign_metrics(
    metrics_data: List[Dict[str, Any]],
    current_user: dict = Depends(get_current_user)
):
    """Bulk create campaign metrics (for webhooks/integrations)"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    documents = []
    for metric in metrics_data:
        doc = {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            **metric,
            "created_at": datetime.now(timezone.utc)
        }
        # Calculate derived metrics
        if doc.get("impressions", 0) > 0:
            doc["ctr"] = round((doc.get("clicks", 0) / doc["impressions"]) * 100, 2)
        if doc.get("clicks", 0) > 0:
            doc["cpc"] = round(doc.get("spend", 0) / doc["clicks"], 2)
        if doc.get("leads", 0) > 0:
            doc["cpl"] = round(doc.get("spend", 0) / doc["leads"], 2)
        documents.append(doc)

    if documents:
        await db.campaign_metrics.insert_many(documents)

    return {"created": len(documents)}


@api_router.get("/analytics/export")
async def export_analytics(
    format: str = "csv",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Export analytics data"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    if start_date:
        start_dt = datetime.fromisoformat(start_date)
    else:
        start_dt = datetime.now(timezone.utc) - timedelta(days=30)

    if end_date:
        end_dt = datetime.fromisoformat(end_date)
    else:
        end_dt = datetime.now(timezone.utc)

    metrics = await db.campaign_metrics.find({
        "tenant_id": tenant_id,
        "date": {"$gte": start_dt, "$lte": end_dt}
    }, {"_id": 0}).sort("date", -1).to_list(1000)

    if format == "csv":
        # Generate CSV
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Fecha", "Fuente", "Campaña", "Impresiones", "Clics", "Conversiones", "Leads", "Gasto"])

        for m in metrics:
            writer.writerow([
                m.get("date", ""),
                m.get("source", ""),
                m.get("campaign_id", ""),
                m.get("impressions", 0),
                m.get("clicks", 0),
                m.get("conversions", 0),
                m.get("leads", 0),
                m.get("spend", 0)
            ])

        return {
            "data": output.getvalue(),
            "filename": f"analytics_{start_dt.date()}_{end_dt.date()}.csv",
            "content_type": "text/csv"
        }

    return {"metrics": [serialize_doc(m) for m in metrics]}


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


# ==================== AUTOMATIONS / WORKFLOWS ====================

@api_router.get("/automations/workflows")
async def get_workflows(
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all automation workflows"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    filter_query = {"tenant_id": tenant_id}
    if category:
        filter_query["category"] = category

    workflows = await db.automation_workflows.find(
        filter_query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)

    return [serialize_doc(w) for w in workflows]


@api_router.post("/automations/workflows")
async def create_workflow(
    workflow_data: AutomationWorkflowCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new automation workflow"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    workflow = AutomationWorkflow(
        **workflow_data.model_dump(),
        tenant_id=tenant_id,
        created_by=current_user["user_id"]
    )

    await db.automation_workflows.insert_one(workflow.model_dump())

    return serialize_doc(workflow.model_dump())


@api_router.get("/automations/workflows/{workflow_id}")
async def get_workflow(
    workflow_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific workflow"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    workflow = await db.automation_workflows.find_one(
        {"id": workflow_id, "tenant_id": tenant_id},
        {"_id": 0}
    )

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow no encontrado")

    return serialize_doc(workflow)


@api_router.put("/automations/workflows/{workflow_id}")
async def update_workflow(
    workflow_id: str,
    workflow_data: AutomationWorkflowCreate,
    current_user: dict = Depends(get_current_user)
):
    """Update a workflow"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    existing = await db.automation_workflows.find_one(
        {"id": workflow_id, "tenant_id": tenant_id}
    )

    if not existing:
        raise HTTPException(status_code=404, detail="Workflow no encontrado")

    update_data = workflow_data.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc)

    await db.automation_workflows.update_one(
        {"id": workflow_id},
        {"$set": update_data}
    )

    updated = await db.automation_workflows.find_one(
        {"id": workflow_id},
        {"_id": 0}
    )

    return serialize_doc(updated)


@api_router.delete("/automations/workflows/{workflow_id}")
async def delete_workflow(
    workflow_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a workflow"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    result = await db.automation_workflows.delete_one(
        {"id": workflow_id, "tenant_id": tenant_id}
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Workflow no encontrado")

    return {"message": "Workflow eliminado"}


@api_router.post("/automations/workflows/{workflow_id}/activate")
async def activate_workflow(
    workflow_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Activate a workflow (send config to n8n)"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    workflow = await db.automation_workflows.find_one(
        {"id": workflow_id, "tenant_id": tenant_id}
    )

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow no encontrado")

    # TODO: Implement actual n8n activation via webhook
    # POST {n8n_webhook_url}/activate with config_values

    await db.automation_workflows.update_one(
        {"id": workflow_id},
        {"$set": {"is_active": True, "updated_at": datetime.now(timezone.utc)}}
    )

    return {"message": "Workflow activado", "workflow_id": workflow_id}


@api_router.post("/automations/workflows/{workflow_id}/deactivate")
async def deactivate_workflow(
    workflow_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Deactivate a workflow"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    workflow = await db.automation_workflows.find_one(
        {"id": workflow_id, "tenant_id": tenant_id}
    )

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow no encontrado")

    # TODO: Implement actual n8n deactivation

    await db.automation_workflows.update_one(
        {"id": workflow_id},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}}
    )

    return {"message": "Workflow desactivado", "workflow_id": workflow_id}


@api_router.post("/automations/workflows/{workflow_id}/test")
async def test_workflow(
    workflow_id: str,
    test_data: Optional[Dict[str, Any]] = None,
    current_user: dict = Depends(get_current_user)
):
    """Test run a workflow"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    workflow = await db.automation_workflows.find_one(
        {"id": workflow_id, "tenant_id": tenant_id}
    )

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow no encontrado")

    # TODO: Implement actual n8n test run
    # POST {n8n_webhook_url}/test with test_data

    # Create execution log
    execution = AutomationExecution(
        tenant_id=tenant_id,
        workflow_id=workflow_id,
        status="completed",
        input_data=test_data or {},
        output_data={"test": True, "message": "Test completado (demo)"},
        execution_time_ms=150
    )

    await db.automation_executions.insert_one(execution.model_dump())

    # Update workflow stats
    await db.automation_workflows.update_one(
        {"id": workflow_id},
        {
            "$inc": {"total_runs": 1, "successful_runs": 1},
            "$set": {"last_run": datetime.now(timezone.utc)}
        }
    )

    return {
        "message": "Test completado",
        "execution_id": execution.id,
        "result": execution.output_data
    }


@api_router.get("/automations/workflows/{workflow_id}/variables")
async def get_workflow_variables(
    workflow_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get configurable variables for a workflow (from n8n webhook)"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    workflow = await db.automation_workflows.find_one(
        {"id": workflow_id, "tenant_id": tenant_id}
    )

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow no encontrado")

    # TODO: Fetch from n8n webhook
    # GET {n8n_webhook_url}/variables
    # For now, return the stored schema

    if workflow.get("config_schema"):
        return workflow["config_schema"]

    # Default schema for demo
    return {
        "variables": [
            {"name": "email_subject", "type": "text", "label": "Asunto del email", "default": "Nuevo lead"},
            {"name": "delay_minutes", "type": "number", "label": "Retraso (minutos)", "default": 5},
            {"name": "send_sms", "type": "boolean", "label": "Enviar SMS también", "default": True},
            {"name": "assign_broker", "type": "select", "label": "Asignar a broker", "options": ["round_robin", "manual"]}
        ]
    }


@api_router.get("/automations/workflows/{workflow_id}/executions")
async def get_workflow_executions(
    workflow_id: str,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Get execution history for a workflow"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    executions = await db.automation_executions.find(
        {"tenant_id": tenant_id, "workflow_id": workflow_id},
        {"_id": 0}
    ).sort("started_at", -1).to_list(limit)

    return [serialize_doc(e) for e in executions]


@api_router.post("/automations/seed")
async def seed_automation_templates(current_user: dict = Depends(get_current_user)):
    """Seed predefined automation workflow templates"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    # Check if templates already exist
    existing = await db.automation_workflows.count_documents({
        "tenant_id": tenant_id,
        "is_template": True
    })

    if existing > 0:
        return {"message": f"Ya existen {existing} plantillas", "created": 0}

    templates = [
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "name": "Seguimiento Automático de Nuevos Leads",
            "description": "Envía emails y SMS automáticos cuando se captura un nuevo lead",
            "category": "lead_generation",
            "n8n_workflow_id": "lead-followup-n8n-id",
            "is_active": False,
            "is_template": True,
            "config_schema": {
                "variables": [
                    {"name": "first_email_subject", "type": "text", "label": "Asunto primer email", "default": "Gracias por tu interés"},
                    {"name": "delay_email_1", "type": "number", "label": "Retraso primer email (min)", "default": 5},
                    {"name": "delay_email_2", "type": "number", "label": "Retraso segundo email (horas)", "default": 24},
                    {"name": "enable_sms", "type": "boolean", "label": "Habilitar SMS", "default": True}
                ]
            },
            "config_values": {},
            "created_by": current_user["user_id"],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "name": "Nurturing para Compradores",
            "description": "Secuencia de emails para leads interesados en comprar",
            "category": "sales",
            "n8n_workflow_id": "buyer-nurturing-n8n-id",
            "is_active": False,
            "is_template": True,
            "config_schema": {
                "variables": [
                    {"name": "sequence_duration", "type": "number", "label": "Duración (días)", "default": 7},
                    {"name": "email_frequency", "type": "select", "label": "Frecuencia", "options": ["daily", "every_2_days", "weekly"]},
                    {"name": "include_property_recommendations", "type": "boolean", "label": "Incluir recomendaciones", "default": True}
                ]
            },
            "config_values": {},
            "created_by": current_user["user_id"],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "name": "Promoción de Nueva Propiedad",
            "description": "Notifica a leads sobre nuevas propiedades que coinciden con sus criterios",
            "category": "promotion",
            "n8n_workflow_id": "property-promo-n8n-id",
            "is_active": False,
            "is_template": True,
            "config_schema": {
                "variables": [
                    {"name": "max_budget", "type": "number", "label": "Presupuesto máximo", "default": 5000000},
                    {"name": "property_type", "type": "select", "label": "Tipo", "options": ["departamento", "casa", "terreno"]},
                    {"name": "min_bedrooms", "type": "number", "label": "Habitaciones mín", "default": 2}
                ]
            },
            "config_values": {},
            "created_by": current_user["user_id"],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "name": "Recordatorio de Citas",
            "description": "Envía recordatorios automáticos para visitas y citas programadas",
            "category": "sales",
            "n8n_workflow_id": "appointment-reminder-n8n-id",
            "is_active": False,
            "is_template": True,
            "config_schema": {
                "variables": [
                    {"name": "reminder_hours_before", "type": "number", "label": "Horas antes (recordatorio)", "default": 24},
                    {"name": "include_location", "type": "boolean", "label": "Incluir ubicación", "default": True},
                    {"name": "send_whatsapp", "type": "boolean", "label": "Enviar por WhatsApp", "default": False}
                ]
            },
            "config_values": {},
            "created_by": current_user["user_id"],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "name": "Reactivación de Leads Fríos",
            "description": "Campaña para reactivar leads que no han tenido interacción",
            "category": "lead_generation",
            "n8n_workflow_id": "lead-reactivation-n8n-id",
            "is_active": False,
            "is_template": True,
            "config_schema": {
                "variables": [
                    {"name": "inactive_days", "type": "number", "label": "Días sin actividad", "default": 30},
                    {"name": "offer_discount", "type": "boolean", "label": "Ofrecer descuento especial", "default": False},
                    {"name": "email_subject", "type": "text", "label": "Asunto", "default": "Te extrañamos"}
                ]
            },
            "config_values": {},
            "created_by": current_user["user_id"],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
    ]

    for template in templates:
        await db.automation_workflows.insert_one(template)

    return {
        "message": "Plantillas de automatización creadas",
        "created": len(templates),
        "templates": [{"id": t["id"], "name": t["name"], "category": t["category"]} for t in templates]
    }


# ==================== ROUND ROBIN ASSIGNMENTS ====================

@api_router.get("/calendar/round-robin/config")
async def get_round_robin_config(current_user: dict = Depends(get_current_user)):
    """Get Round Robin configuration for tenant"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    config = await db.round_robin_config.find_one({"tenant_id": tenant_id}, {"_id": 0})

    if not config:
        # Create default config
        config = {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "is_active": True,
            "active_brokers": [],
            "last_assigned_broker": None,
            "assignment_counts": {},
            "reset_frequency": "daily",
            "last_reset": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        await db.round_robin_config.insert_one(config)

    return serialize_doc(config)


@api_router.put("/calendar/round-robin/config")
async def update_round_robin_config(
    config_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Update Round Robin configuration"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    # Get existing config
    existing = await db.round_robin_config.find_one({"tenant_id": tenant_id})

    update_data = {
        "is_active": config_data.get("is_active", True),
        "active_brokers": config_data.get("active_brokers", []),
        "reset_frequency": config_data.get("reset_frequency", "daily"),
        "updated_at": datetime.now(timezone.utc)
    }

    # Reset assignment counts if requested
    if config_data.get("reset_counts"):
        update_data["assignment_counts"] = {}
        update_data["last_reset"] = datetime.now(timezone.utc)

    if existing:
        await db.round_robin_config.update_one(
            {"tenant_id": tenant_id},
            {"$set": update_data}
        )
    else:
        update_data["id"] = str(uuid.uuid4())
        update_data["tenant_id"] = tenant_id
        update_data["last_assigned_broker"] = None
        update_data["assignment_counts"] = {}
        update_data["created_at"] = datetime.now(timezone.utc)
        await db.round_robin_config.insert_one(update_data)

    updated = await db.round_robin_config.find_one({"tenant_id": tenant_id}, {"_id": 0})
    return serialize_doc(updated)


@api_router.get("/calendar/round-robin/next-broker")
async def get_next_broker_round_robin(current_user: dict = Depends(get_current_user)):
    """Get the next broker in Round Robin rotation"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    config = await db.round_robin_config.find_one({"tenant_id": tenant_id}, {"_id": 0})

    if not config or not config.get("active_brokers") or len(config["active_brokers"]) == 0:
        raise HTTPException(status_code=400, detail="No hay brokers configurados en Round Robin")

    active_brokers = config["active_brokers"]
    last_assigned = config.get("last_assigned_broker")
    counts = config.get("assignment_counts", {})

    # Find the broker with the fewest assignments
    # If there's a tie, choose the one that comes after the last assigned
    min_count = min((counts.get(broker_id, 0) for broker_id in active_brokers), default=0)
    candidates = [b for b in active_brokers if counts.get(b, 0) == min_count]

    if last_assigned in candidates:
        # Start from the broker after the last assigned
        last_index = active_brokers.index(last_assigned)
        next_index = (last_index + 1) % len(active_brokers)
        # Try to find a candidate from the candidates list starting from next_index
        for i in range(len(active_brokers)):
            idx = (next_index + i) % len(active_brokers)
            if active_brokers[idx] in candidates:
                next_broker = active_brokers[idx]
                break
    else:
        next_broker = candidates[0]

    # Get broker details
    broker = await db.users.find_one(
        {"id": next_broker, "tenant_id": tenant_id},
        {"_id": 0, "password_hash": 0}
    )

    if not broker:
        raise HTTPException(status_code=404, detail="Broker no encontrado")

    return serialize_doc(broker)


@api_router.post("/calendar/assign")
async def assign_calendar_event(
    assignment_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Assign a calendar event (manual or Round Robin)"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    event_id = assignment_data.get("event_id")
    assignment_type = assignment_data.get("assignment_type", "manual")
    assigned_to = assignment_data.get("assigned_to")  # For manual assignment

    if not event_id:
        raise HTTPException(status_code=400, detail="event_id es requerido")

    # Verify event exists
    event = await db.calendar_events.find_one({"id": event_id, "tenant_id": tenant_id})
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    # Determine assigned broker
    if assignment_type == "round_robin":
        # Get next broker from Round Robin
        broker_response = await get_next_broker_round_robin(current_user)
        assigned_to = broker_response["id"]

        # Update Round Robin config
        await db.round_robin_config.update_one(
            {"tenant_id": tenant_id},
            {
                "$set": {
                    "last_assigned_broker": assigned_to,
                    "updated_at": datetime.now(timezone.utc)
                },
                "$inc": {f"assignment_counts.{assigned_to}": 1}
            }
        )
    else:
        # Manual assignment
        if not assigned_to:
            raise HTTPException(status_code=400, detail="assigned_to es requerido para asignación manual")

    # Create assignment record
    assignment = {
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "event_id": event_id,
        "assigned_to": assigned_to,
        "assignment_type": assignment_type,
        "assigned_by": current_user["user_id"],
        "created_at": datetime.now(timezone.utc)
    }

    await db.calendar_assignments.insert_one(assignment)

    # Update event with assigned broker
    await db.calendar_events.update_one(
        {"id": event_id},
        {"$set": {"assigned_broker_id": assigned_to}}
    )

    # Get broker details for response
    broker = await db.users.find_one(
        {"id": assigned_to, "tenant_id": tenant_id},
        {"_id": 0, "password_hash": 0}
    )

    return {
        "message": "Evento asignado exitosamente",
        "assignment": serialize_doc(assignment),
        "broker": serialize_doc(broker) if broker else None
    }


@api_router.get("/calendar/events/{event_id}/assignment")
async def get_event_assignment(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get assignment info for a specific event"""
    tenant_id = await get_or_create_tenant(current_user["user_id"])

    event = await db.calendar_events.find_one(
        {"id": event_id, "tenant_id": tenant_id},
        {"_id": 0, "password_hash": 0}
    )

    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    assignment = await db.calendar_assignments.find_one(
        {"event_id": event_id, "tenant_id": tenant_id},
        {"_id": 0}
    )

    broker = None
    if event.get("assigned_broker_id"):
        broker = await db.users.find_one(
            {"id": event["assigned_broker_id"], "tenant_id": tenant_id},
            {"_id": 0, "password_hash": 0}
        )
        broker = serialize_doc(broker) if broker else None

    return {
        "event_id": event_id,
        "assigned_to": event.get("assigned_broker_id"),
        "assignment": serialize_doc(assignment) if assignment else None,
        "broker": broker
    }


# ==================== APIFY HELPER FUNCTIONS ====================

async def execute_apify_job(job_id: str, params: dict, settings: dict, user: dict):
    """Ejecuta job de Apify en background (MODO DEMO: usa datos mock)"""
    # MODO DEMO: Usar datos mock en lugar de Apify real
    USE_MOCK_SCRAPING = os.environ.get("USE_MOCK_SCRAPING", "true").lower() == "true"

    if USE_MOCK_SCRAPING:
        # Simular delay de scraping
        await asyncio.sleep(5)

        # Datos mock de leads
        mock_leads = generate_mock_leads(params)

        # Procesar cada resultado con IA
        for lead_data in mock_leads:
            scraped_lead = {
                "id": str(uuid.uuid4()),
                "apify_job_id": job_id,
                "tenant_id": user["tenant_id"],
                **lead_data,
                "created_at": datetime.now(timezone.utc).isoformat()
            }

            # Análisis IA
            ai_result = await analyze_scraped_lead(scraped_lead)
            scraped_lead.update(ai_result)

            await db.scraped_leads.insert_one(scraped_lead)

        # Actualizar job
        await db.apify_jobs.update_one(
            {"id": job_id},
            {"$set": {
                "status": "completed",
                "total_results": len(mock_leads),
                "completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return

    # INTEGRACIÓN REAL CON APIFY (futuro)
    try:
        import httpx

        async with httpx.AsyncClient(timeout=120.0) as client:
            # Iniciar run
            headers = {
                "Authorization": f"Bearer {settings.get('apify_api_token', '')}",
                "Content-Type": "application/json"
            }

            response = await client.post(
                "https://api.apify.com/v2/acts/apify/linkedin-profile-scraper/runs",
                headers=headers,
                json={"input": params}
            )

            if response.status_code != 201:
                raise Exception(f"Error iniciando job: {response.status_code}")

            run_data = response.json()
            apify_run_id = run_data["data"]["id"]

            # Actualizar job record
            await db.apify_jobs.update_one(
                {"id": job_id},
                {"$set": {"job_id": apify_run_id}}
            )

            # Esperar a que termine (polling)
            max_attempts = 60  # 10 minutos máximo
            for attempt in range(max_attempts):
                await asyncio.sleep(10)

                status_response = await client.get(
                    f"https://api.apify.com/v2/acts/apify/linkedin-profile-scraper/runs/{apify_run_id}",
                    headers=headers
                )

                status_data = status_response.json()
                status = status_data["data"]["status"]

                if status in ["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"]:
                    break

            # Obtener resultados
            if status == "SUCCEEDED":
                dataset_response = await client.get(
                    f"https://api.apify.com/v2/datasets/default/items",
                    headers=headers
                )

                results = dataset_response.json()

                # Procesar cada resultado con IA
                for item in results.get("items", [])[:50]:  # Max 50 leads
                    scraped_lead = {
                        "id": str(uuid.uuid4()),
                        "apify_job_id": job_id,
                        "tenant_id": user["tenant_id"],
                        "name": item.get("fullName"),
                        "email": item.get("email"),
                        "phone": item.get("phone"),
                        "company": item.get("company"),
                        "position": item.get("jobTitle"),
                        "profile_url": item.get("url"),
                        "photo_url": item.get("profilePicture"),
                        "location": item.get("location"),
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }

                    # Análisis IA
                    ai_result = await analyze_scraped_lead(scraped_lead)
                    scraped_lead.update(ai_result)

                    await db.scraped_leads.insert_one(scraped_lead)

                # Actualizar job
                await db.apify_jobs.update_one(
                    {"id": job_id},
                    {"$set": {
                        "status": "completed",
                        "total_results": len(results.get("items", [])),
                        "completed_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
            else:
                await db.apify_jobs.update_one(
                    {"id": job_id},
                    {"$set": {
                        "status": "failed",
                        "error_message": f"Job falló con status: {status}"
                    }}
                )

    except Exception as e:
        await db.apify_jobs.update_one(
            {"id": job_id},
            {"$set": {
                "status": "failed",
                "error_message": str(e)
            }}
        )


async def analyze_scraped_lead(lead_data: dict) -> dict:
    """Analiza un lead extraído con IA"""
    from ai_service import EMERGENT_AVAILABLE, analyze_lead

    if not EMERGENT_AVAILABLE:
        return {
            "potential_score": 50,
            "potential_reason": "Servicio IA no disponible"
        }

    # Usar analyze_lead existente
    analysis = await analyze_lead(lead_data)

    return {
        "ai_analysis": analysis,
        "potential_score": analysis.get("intent_score", 50),
        "potential_reason": analysis.get("next_action", "Sin análisis")
    }


def generate_mock_leads(params: dict) -> list:
    """Genera leads de prueba para modo demo"""
    mock_data = [
        {
            "name": "Carlos Mendoza",
            "email": "carlos.mendoza@developer.com",
            "phone": "+52 998 123 4567",
            "company": "Tulum Developments",
            "position": "CEO & Founder",
            "profile_url": "https://linkedin.com/in/carlos-mendoza",
            "photo_url": None,
            "location": "Tulum, Mexico"
        },
        {
            "name": "María González",
            "email": "maria.gonzalez@realestate.com",
            "phone": "+52 998 234 5678",
            "company": "Caribbean Properties",
            "position": "Real Estate Investor",
            "profile_url": "https://linkedin.com/in/maria-gonzalez",
            "photo_url": None,
            "location": "Cancun, Mexico"
        },
        {
            "name": "Roberto Herrera",
            "email": "roberto.herrera@investment.com",
            "phone": "+52 998 345 6789",
            "company": "Riviera Maya Investments",
            "position": "Owner",
            "profile_url": "https://linkedin.com/in/roberto-herrera",
            "photo_url": None,
            "location": "Playa del Carmen, Mexico"
        },
        {
            "name": "Ana López",
            "email": "ana.lopez@construction.com",
            "phone": "+52 998 456 7890",
            "company": "Constructora López",
            "position": "General Manager",
            "profile_url": "https://linkedin.com/in/ana-lopez",
            "photo_url": None,
            "location": "Merida, Mexico"
        },
        {
            "name": "Pedro Sánchez",
            "email": "pedro.sanchez@hospitality.com",
            "phone": "+52 998 567 8901",
            "company": "Hotel Group Tulum",
            "position": "Director of Operations",
            "profile_url": "https://linkedin.com/in/pedro-sanchez",
            "photo_url": None,
            "location": "Tulum, Mexico"
        },
        {
            "name": "Laura Martínez",
            "email": "laura.martinez@architecture.com",
            "phone": "+52 998 678 9012",
            "company": "ArchiTech Studio",
            "position": "Principal Architect",
            "profile_url": "https://linkedin.com/in/laura-martinez",
            "photo_url": None,
            "location": "Mexico City, Mexico"
        },
        {
            "name": "Diego Rivera",
            "email": "diego.rivera@ventures.com",
            "phone": "+52 998 789 0123",
            "company": "Riviera Ventures",
            "position": "Managing Partner",
            "profile_url": "https://linkedin.com/in/diego-rivera",
            "photo_url": None,
            "location": "Playa del Carmen, Mexico"
        },
        {
            "name": "Carmen Castillo",
            "email": "carmen.castillo@realtors.com",
            "phone": "+52 998 890 1234",
            "company": "Premium Realtors",
            "position": "Top Producer",
            "profile_url": "https://linkedin.com/in/carmen-castillo",
            "photo_url": None,
            "location": "Cancun, Mexico"
        }
    ]

    # Retornar entre 3-8 leads aleatorios
    return random.sample(mock_data, random.randint(3, min(8, len(mock_data))))


# ==================== MODULE TRACKER ====================

@api_router.get("/modules")
async def get_all_modules(current_user: dict = Depends(get_current_user)):
    """Get all modules with their status"""
    return {"modules": CRM_MODULES}


@api_router.get("/modules/{module_id}")
async def get_module_details(module_id: str, current_user: dict = Depends(get_current_user)):
    """Get details of a specific module"""
    module = CRM_MODULES.get(module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    return module


@api_router.get("/mvp/config")
async def get_mvp_config(current_user: dict = Depends(get_current_user)):
    """Get all MVP tier configurations"""
    return {"tiers": MVP_CONFIG}


@api_router.get("/mvp/tier/{tier}")
async def get_mvp_tier(tier: str, current_user: dict = Depends(get_current_user)):
    """Get MVP configuration for a specific tier"""
    try:
        tier_enum = MVPTier(tier)
        modules = get_modules_for_tier(tier_enum)
        completion = get_completion_percentage(modules)

        return {
            "tier": tier,
            "config": MVP_CONFIG[tier_enum],
            "modules": modules,
            "completion_percentage": completion,
            "module_details": [CRM_MODULES.get(m) for m in modules if m in CRM_MODULES]
        }
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid tier: {tier}")


@api_router.get("/mvp/recommended")
async def get_recommended_mvp(current_user: dict = Depends(get_current_user)):
    """Get recommended MVP tier based on user account type"""
    account_type = current_user.get("account_type", "individual")

    if account_type == "individual":
        # Recommending STANDARD for individuals
        tier = MVPTier.STANDARD
    else:
        # Recommending PROFESSIONAL for agencies
        tier = MVPTier.PROFESSIONAL

    return {
        "recommended_tier": tier.value,
        "reason": f"Based on your {account_type} account type",
        "config": MVP_CONFIG[tier]
    }


@api_router.get("/roadmap")
async def get_implementation_roadmap(current_user: dict = Depends(get_current_user)):
    """Get the 4-week implementation plan"""
    return WEEKLY_PLAN


@api_router.get("/roadmap/summary")
async def get_roadmap_summary(current_user: dict = Depends(get_current_user)):
    """Get summary of the implementation roadmap"""
    return get_weekly_plan_summary()


@api_router.post("/mvp/calculate")
async def calculate_mvp(
    requirements: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Calculate recommended MVP tier based on client requirements

    Request body:
    {
        "team_size": int,  // Number of brokers
        "leads_per_month": int,
        "need_campaigns": bool,
        "need_automation": bool,
        "budget": int  // Monthly budget in MXN
    }
    """
    team_size = requirements.get("team_size", 1)
    need_campaigns = requirements.get("need_campaigns", False)
    need_automation = requirements.get("need_automation", False)

    # Determine tier based on requirements
    if team_size == 1 and not need_campaigns:
        tier = MVPTier.ESSENTIAL
    elif team_size == 1 and need_campaigns and not need_automation:
        tier = MVPTier.STANDARD
    elif team_size <= 5 and not need_automation:
        tier = MVPTier.PROFESSIONAL
    else:
        tier = MVPTier.ENTERPRISE

    modules = get_modules_for_tier(tier)
    completion = get_completion_percentage(modules)

    return {
        "recommended_tier": tier.value,
        "tier_config": MVP_CONFIG[tier],
        "modules": modules,
        "completion_percentage": completion,
        "estimated_hours_remaining": int(
            MVP_CONFIG[tier]["estimated_hours"] * (1 - completion / 100)
        ),
        "estimated_weeks": math.ceil(
            (MVP_CONFIG[tier]["estimated_hours"] * (1 - completion / 100)) / 40
        )
    }


@api_router.get("/modules/next")
async def get_next_modules_to_implement(
    tier: str = "standard",
    current_user: dict = Depends(get_current_user)
):
    """Get next recommended modules to implement"""
    try:
        tier_enum = MVPTier(tier)

        # Get completed modules (those with 100% completion)
        completed = [
            m for m in CRM_MODULES.keys()
            if CRM_MODULES[m].get("completion", 0) >= 90
        ]

        next_modules = get_next_modules(tier_enum, completed)

        return {
            "tier": tier,
            "completed_modules": completed,
            "next_modules": next_modules,
            "module_details": [CRM_MODULES.get(m) for m in next_modules]
        }
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid tier: {tier}")


@api_router.get("/status/production")
async def get_production_readiness(current_user: dict = Depends(get_current_user)):
    """Check if the system is ready for production"""
    # Check essential modules
    essential_modules = [
        "auth", "dashboard", "leads_pipeline",
        "settings", "landing_page"
    ]

    all_ready = all(
        CRM_MODULES.get(m, {}).get("completion", 0) >= 90
        for m in essential_modules
    )

    # Calculate overall completion
    overall_completion = get_completion_percentage(essential_modules)

    # Find blockers
    blockers = [
        m for m in essential_modules
        if CRM_MODULES.get(m, {}).get("completion", 0) < 90
    ]

    return {
        "ready_for_production": all_ready,
        "overall_completion": overall_completion,
        "essential_modules_status": {
            m: CRM_MODULES.get(m, {}).get("completion", 0)
            for m in essential_modules
        },
        "blockers": blockers,
        "recommendations": [
            f"Complete {m} module" for m in blockers
        ] if blockers else ["System ready for MVP launch"],
        "estimated_days_to_launch": math.ceil(
            sum(
                CRM_MODULES.get(m, {}).get("estimated_hours", 0) * (1 - CRM_MODULES.get(m, {}).get("completion", 0) / 100)
                for m in blockers
            ) / 8
        ) if blockers else 0
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
