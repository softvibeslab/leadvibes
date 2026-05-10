from datetime import datetime, timezone
from typing import Any, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from auth import get_current_user


ROVI_INTERNAL_TENANT_ID = "tenant-rovi-internal"
ROVI_INTERNAL_ROLES = {
    "rovi_admin",
    "rovi_sales",
    "rovi_marketing",
    "rovi_customer_success",
    "rovi_ops",
}
ROVI_ADMIN_ROLES = {"rovi_admin", "rovi_ops"}


PIPELINE_STAGES = [
    "prospecto",
    "contactado",
    "discovery_call",
    "demo_agendada",
    "demo_completada",
    "propuesta_enviada",
    "negociacion",
    "contrato_cerrado",
    "onboarding",
    "active_user",
    "perdido",
]


STAGE_PROBABILITIES = {
    "prospecto": 0.10,
    "contactado": 0.18,
    "discovery_call": 0.30,
    "demo_agendada": 0.42,
    "demo_completada": 0.55,
    "propuesta_enviada": 0.68,
    "negociacion": 0.78,
    "contrato_cerrado": 1.0,
    "onboarding": 1.0,
    "active_user": 1.0,
    "perdido": 0.0,
}


DEFAULT_SERVICE_PLANS = [
    {
        "id": "rovi-plan-essential",
        "tier": "essential",
        "name": "ROVI CRM Essential",
        "price_mxn": 2999,
        "billing_cycle": "monthly",
        "ideal_for": "Broker individual o equipo muy pequeno",
        "max_brokers": 1,
        "features": ["Pipeline ilimitado", "Campanas email", "Analytics basico", "Soporte email"],
        "is_active": True,
    },
    {
        "id": "rovi-plan-standard",
        "tier": "standard",
        "name": "ROVI CRM Standard",
        "price_mxn": 7999,
        "billing_cycle": "monthly",
        "ideal_for": "Inmobiliarias de 2 a 10 brokers",
        "max_brokers": 10,
        "features": ["Gamificacion avanzada", "Scripts IA", "Automatizaciones", "VAPI/Twilio"],
        "is_active": True,
    },
    {
        "id": "rovi-plan-professional",
        "tier": "professional",
        "name": "ROVI CRM Professional",
        "price_mxn": 14999,
        "billing_cycle": "monthly",
        "ideal_for": "Equipos de 11 a 50 brokers",
        "max_brokers": 50,
        "features": ["Analytics avanzado", "API access", "CSM dedicado", "Training en sitio"],
        "is_active": True,
    },
    {
        "id": "rovi-plan-enterprise",
        "tier": "enterprise",
        "name": "ROVI CRM Enterprise",
        "price_mxn": 0,
        "billing_cycle": "custom",
        "ideal_for": "Redes, franquicias y asociaciones 50+ brokers",
        "max_brokers": None,
        "features": ["SLA garantizado", "Servidor dedicado", "Desarrollo custom", "Account manager"],
        "is_active": True,
    },
]


DEFAULT_PROSPECTS = [
    {
        "id": "rovi-prospect-tulum-luxury",
        "company_name": "Tulum Luxury Realty",
        "contact_name": "Mariana Cervera",
        "email": "mariana@tulumluxury.example",
        "phone": "+52 984 120 1001",
        "stage": "demo_agendada",
        "source": "LinkedIn Ads",
        "company_size": "medium",
        "broker_count": 18,
        "business_type": "agency",
        "current_crm": "excel",
        "monthly_budget_mxn": 12000,
        "expected_mrr_mxn": 14999,
        "recommended_plan": "professional",
        "owner_role": "rovi_sales",
        "assigned_to": "rovi-sales-ana",
        "pain_points": ["Pierden seguimiento", "No miden performance por broker", "Reportes manuales"],
        "urgency": "this_month",
        "last_activity": "Demo confirmada para el jueves",
        "next_action": "Preparar demo con casos de uso de 18 brokers",
    },
    {
        "id": "rovi-prospect-caribe-brokers",
        "company_name": "Caribe Brokers Group",
        "contact_name": "Hector Salinas",
        "email": "hector@caribebrokers.example",
        "phone": "+52 998 220 3100",
        "stage": "negociacion",
        "source": "Referido COPIM",
        "company_size": "small",
        "broker_count": 9,
        "business_type": "agency",
        "current_crm": "hubspot",
        "monthly_budget_mxn": 9000,
        "expected_mrr_mxn": 7999,
        "recommended_plan": "standard",
        "owner_role": "rovi_sales",
        "assigned_to": "rovi-sales-ana",
        "pain_points": ["CRM caro", "Baja adopcion del equipo", "Necesitan WhatsApp/SMS"],
        "urgency": "30_days",
        "last_activity": "Pidieron ajuste anual con descuento",
        "next_action": "Enviar propuesta anual y ROI de ahorro operativo",
    },
    {
        "id": "rovi-prospect-riviera-developers",
        "company_name": "Riviera Developers Network",
        "contact_name": "Paola Miranda",
        "email": "paola@riviera-dev.example",
        "phone": "+52 984 555 0188",
        "stage": "propuesta_enviada",
        "source": "Webinar",
        "company_size": "large",
        "broker_count": 65,
        "business_type": "developer",
        "current_crm": "salesforce",
        "monthly_budget_mxn": 45000,
        "expected_mrr_mxn": 42000,
        "recommended_plan": "enterprise",
        "owner_role": "rovi_sales",
        "assigned_to": "rovi-sales-enterprise",
        "pain_points": ["Integraciones custom", "Dashboards por desarrollo", "SLA"],
        "urgency": "quarter",
        "last_activity": "Propuesta Enterprise enviada",
        "next_action": "Agendar revision tecnica con operaciones",
    },
    {
        "id": "rovi-prospect-playa-realestate",
        "company_name": "Playa Real Estate Hub",
        "contact_name": "Andrea Molina",
        "email": "andrea@playarealestate.example",
        "phone": "+52 984 311 9191",
        "stage": "discovery_call",
        "source": "Meta Lead Ads",
        "company_size": "small",
        "broker_count": 5,
        "business_type": "agency",
        "current_crm": "none",
        "monthly_budget_mxn": 6000,
        "expected_mrr_mxn": 7999,
        "recommended_plan": "standard",
        "owner_role": "rovi_marketing",
        "assigned_to": "rovi-marketing-luis",
        "pain_points": ["No tienen CRM", "Seguimiento en WhatsApp personal"],
        "urgency": "this_month",
        "last_activity": "Respondio formulario de demo",
        "next_action": "Calificar presupuesto y pasar a Sales si confirma equipo",
    },
    {
        "id": "rovi-prospect-solo-broker",
        "company_name": "Broker Independiente Aldea Zama",
        "contact_name": "Sofia Perez",
        "email": "sofia@aldeazama.example",
        "phone": "+52 984 100 0202",
        "stage": "contactado",
        "source": "Instagram Organic",
        "company_size": "solo",
        "broker_count": 1,
        "business_type": "individual",
        "current_crm": "excel",
        "monthly_budget_mxn": 3000,
        "expected_mrr_mxn": 2999,
        "recommended_plan": "essential",
        "owner_role": "rovi_marketing",
        "assigned_to": "rovi-marketing-luis",
        "pain_points": ["Excel", "No tiene recordatorios", "Quiere campanas simples"],
        "urgency": "30_days",
        "last_activity": "Pidio precios por Instagram",
        "next_action": "Enviar comparativo Essential vs Standard",
    },
]


class RoviProspectCreate(BaseModel):
    company_name: str
    contact_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    source: str = "manual"
    company_size: str = "small"
    broker_count: int = 1
    business_type: str = "agency"
    current_crm: str = "excel"
    monthly_budget_mxn: float = 0
    expected_mrr_mxn: float = 0
    recommended_plan: Optional[str] = None
    stage: str = "prospecto"
    assigned_to: Optional[str] = None
    pain_points: list[str] = Field(default_factory=list)
    urgency: str = "30_days"
    next_action: Optional[str] = None


class RoviProspectUpdate(BaseModel):
    stage: Optional[str] = None
    assigned_to: Optional[str] = None
    monthly_budget_mxn: Optional[float] = None
    expected_mrr_mxn: Optional[float] = None
    recommended_plan: Optional[str] = None
    next_action: Optional[str] = None
    last_activity: Optional[str] = None
    pain_points: Optional[list[str]] = None


class RoviServicePlanCreate(BaseModel):
    tier: str
    name: str
    price_mxn: float = 0
    billing_cycle: str = "monthly"
    ideal_for: str
    max_brokers: Optional[int] = None
    features: list[str] = Field(default_factory=list)
    is_active: bool = True


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def serialize_doc(doc: Optional[dict]) -> Optional[dict]:
    if doc is None:
        return None
    result = {key: value for key, value in doc.items() if key != "_id"}
    for key, value in result.items():
        if isinstance(value, datetime):
            result[key] = value.isoformat()
    return result


def serialize_docs(docs: list[dict]) -> list[dict]:
    return [serialize_doc(doc) for doc in docs]


def score_prospect(prospect: dict) -> int:
    score = 20
    broker_count = int(prospect.get("broker_count") or 0)
    budget = float(prospect.get("monthly_budget_mxn") or 0)
    current_crm = prospect.get("current_crm")
    urgency = prospect.get("urgency")
    pain_points = prospect.get("pain_points") or []

    if broker_count >= 11:
        score += 22
    elif broker_count >= 2:
        score += 14
    else:
        score += 6

    if budget >= 15000:
        score += 24
    elif budget >= 8000:
        score += 18
    elif budget >= 3000:
        score += 10

    if current_crm in {"none", "excel"}:
        score += 14
    elif current_crm in {"salesforce", "hubspot"}:
        score += 8

    if urgency == "this_month":
        score += 16
    elif urgency == "30_days":
        score += 10
    elif urgency == "quarter":
        score += 5

    score += min(len(pain_points) * 4, 16)
    return max(0, min(score, 100))


def score_label(score: int) -> str:
    if score >= 85:
        return "Hot prospect"
    if score >= 70:
        return "SQL"
    if score >= 40:
        return "MQL"
    return "Bajo fit"


def recommend_plan(prospect: dict) -> str:
    broker_count = int(prospect.get("broker_count") or 1)
    budget = float(prospect.get("monthly_budget_mxn") or 0)
    if broker_count > 50 or budget >= 30000:
        return "enterprise"
    if broker_count >= 11 or budget >= 12000:
        return "professional"
    if broker_count >= 2 or budget >= 6000:
        return "standard"
    return "essential"


def enrich_prospect(prospect: dict) -> dict:
    prospect = dict(prospect)
    if not prospect.get("recommended_plan"):
        prospect["recommended_plan"] = recommend_plan(prospect)
    prospect["score"] = int(prospect.get("score") or score_prospect(prospect))
    prospect["score_label"] = score_label(prospect["score"])
    prospect["probability"] = STAGE_PROBABILITIES.get(prospect.get("stage"), 0.0)
    prospect["weighted_mrr_mxn"] = round(float(prospect.get("expected_mrr_mxn") or 0) * prospect["probability"], 2)
    return prospect


def require_rovi_internal_workspace(current_user: dict) -> dict:
    if (
        current_user.get("account_type") == "rovi_internal"
        or current_user.get("role") in ROVI_INTERNAL_ROLES
        or current_user.get("tenant_id") == ROVI_INTERNAL_TENANT_ID
    ):
        return current_user
    raise HTTPException(status_code=403, detail="Este modulo es exclusivo del workspace interno ROVI.")


def require_rovi_admin(current_user: dict) -> dict:
    user = require_rovi_internal_workspace(current_user)
    if user.get("role") not in ROVI_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Solo ROVI Admin/Ops puede realizar esta accion.")
    return user


async def ensure_rovi_internal_seed_data(db: AsyncIOMotorDatabase) -> None:
    now = now_iso()
    for plan in DEFAULT_SERVICE_PLANS:
        await db.rovi_service_plans.update_one(
            {"id": plan["id"]},
            {"$set": {**plan, "tenant_id": ROVI_INTERNAL_TENANT_ID, "updated_at": now}, "$setOnInsert": {"created_at": now}},
            upsert=True,
        )

    for prospect in DEFAULT_PROSPECTS:
        enriched = enrich_prospect(prospect)
        await db.rovi_prospects.update_one(
            {"id": enriched["id"]},
            {
                "$set": {
                    **enriched,
                    "tenant_id": ROVI_INTERNAL_TENANT_ID,
                    "updated_at": now,
                },
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )


async def build_dashboard_payload(db: AsyncIOMotorDatabase, current_user: dict) -> dict:
    await ensure_rovi_internal_seed_data(db)
    prospects = serialize_docs(await db.rovi_prospects.find({"tenant_id": ROVI_INTERNAL_TENANT_ID}).to_list(1000))
    prospects = [enrich_prospect(item) for item in prospects]
    service_plans = serialize_docs(await db.rovi_service_plans.find({"tenant_id": ROVI_INTERNAL_TENANT_ID}).to_list(100))

    active_pipeline = [item for item in prospects if item.get("stage") != "perdido"]
    closed = [item for item in prospects if item.get("stage") in {"contrato_cerrado", "onboarding", "active_user"}]
    mql_count = len([item for item in prospects if item.get("score", 0) >= 40])
    sql_count = len([item for item in prospects if item.get("score", 0) >= 70])
    demos = len([item for item in prospects if item.get("stage") in {"demo_agendada", "demo_completada"}])
    proposal_count = len([item for item in prospects if item.get("stage") in {"propuesta_enviada", "negociacion"}])

    stage_counts = [
        {"stage": stage, "count": len([item for item in prospects if item.get("stage") == stage])}
        for stage in PIPELINE_STAGES
    ]

    source_stats: dict[str, dict[str, Any]] = {}
    for item in prospects:
        source = item.get("source") or "Sin fuente"
        source_stats.setdefault(source, {"source": source, "count": 0, "weighted_mrr_mxn": 0, "closed_mrr_mxn": 0})
        source_stats[source]["count"] += 1
        source_stats[source]["weighted_mrr_mxn"] += item.get("weighted_mrr_mxn", 0)
        if item.get("stage") in {"contrato_cerrado", "onboarding", "active_user"}:
            source_stats[source]["closed_mrr_mxn"] += item.get("expected_mrr_mxn", 0)

    return {
        "workspace": {
            "tenant_id": ROVI_INTERNAL_TENANT_ID,
            "name": "ROVI Internal",
            "role": current_user.get("role"),
        },
        "metrics": {
            "total_prospects": len(prospects),
            "mql_count": mql_count,
            "sql_count": sql_count,
            "demos": demos,
            "open_proposals": proposal_count,
            "pipeline_value_mxn": round(sum(float(item.get("expected_mrr_mxn") or 0) for item in active_pipeline), 2),
            "weighted_mrr_mxn": round(sum(float(item.get("weighted_mrr_mxn") or 0) for item in active_pipeline), 2),
            "closed_mrr_mxn": round(sum(float(item.get("expected_mrr_mxn") or 0) for item in closed), 2),
            "conversion_rate": round((len(closed) / len(prospects)) * 100, 1) if prospects else 0,
        },
        "stage_counts": stage_counts,
        "source_stats": sorted(source_stats.values(), key=lambda item: item["weighted_mrr_mxn"], reverse=True),
        "hot_prospects": sorted(prospects, key=lambda item: item.get("score", 0), reverse=True)[:5],
        "service_plans": service_plans,
        "role_playbook": {
            "rovi_admin": ["MRR", "ROI por canal", "Churn", "Equipo", "Revenue Ops"],
            "rovi_sales": ["Discovery", "Demo", "Propuesta", "Negociacion", "Cierre"],
            "rovi_marketing": ["MQL", "Campanas", "CPL", "Handoff a Sales"],
            "rovi_customer_success": ["Onboarding", "Adopcion", "Churn risk", "Renewals"],
            "rovi_ops": ["Integraciones", "Datos", "Automatizaciones", "Calidad"],
        }.get(current_user.get("role"), []),
    }


def create_rovi_internal_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/rovi-internal", tags=["rovi-internal"])

    @router.get("/dashboard")
    async def get_dashboard(current_user: dict = Depends(get_current_user)):
        current_user = require_rovi_internal_workspace(current_user)
        return await build_dashboard_payload(db, current_user)

    @router.get("/prospects")
    async def list_prospects(
        stage: Optional[str] = None,
        owner_role: Optional[str] = None,
        current_user: dict = Depends(get_current_user),
    ):
        current_user = require_rovi_internal_workspace(current_user)
        await ensure_rovi_internal_seed_data(db)
        query = {"tenant_id": ROVI_INTERNAL_TENANT_ID}
        if stage and stage != "all":
            query["stage"] = stage
        if owner_role and owner_role != "all":
            query["owner_role"] = owner_role
        prospects = serialize_docs(await db.rovi_prospects.find(query).sort("score", -1).to_list(1000))
        return {"prospects": [enrich_prospect(item) for item in prospects], "stages": PIPELINE_STAGES}

    @router.post("/prospects")
    async def create_prospect(payload: RoviProspectCreate, current_user: dict = Depends(get_current_user)):
        current_user = require_rovi_internal_workspace(current_user)
        if payload.stage not in PIPELINE_STAGES:
            raise HTTPException(status_code=422, detail="Etapa de pipeline invalida.")
        now = now_iso()
        prospect = enrich_prospect({
            **payload.model_dump(),
            "id": f"rovi-prospect-{uuid.uuid4()}",
            "tenant_id": ROVI_INTERNAL_TENANT_ID,
            "created_by": current_user["user_id"],
            "owner_role": "rovi_sales" if current_user.get("role") == "rovi_sales" else "rovi_marketing",
            "last_activity": "Creado manualmente",
            "created_at": now,
            "updated_at": now,
        })
        await db.rovi_prospects.insert_one(prospect)
        return serialize_doc(prospect)

    @router.put("/prospects/{prospect_id}")
    async def update_prospect(
        prospect_id: str,
        payload: RoviProspectUpdate,
        current_user: dict = Depends(get_current_user),
    ):
        require_rovi_internal_workspace(current_user)
        updates = {key: value for key, value in payload.model_dump(exclude_unset=True).items() if value is not None}
        if "stage" in updates and updates["stage"] not in PIPELINE_STAGES:
            raise HTTPException(status_code=422, detail="Etapa de pipeline invalida.")
        existing = await db.rovi_prospects.find_one({"tenant_id": ROVI_INTERNAL_TENANT_ID, "id": prospect_id}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Prospecto no encontrado.")
        merged = enrich_prospect({**existing, **updates, "updated_at": now_iso()})
        await db.rovi_prospects.update_one(
            {"tenant_id": ROVI_INTERNAL_TENANT_ID, "id": prospect_id},
            {"$set": merged},
        )
        return serialize_doc(merged)

    @router.get("/service-plans")
    async def list_service_plans(current_user: dict = Depends(get_current_user)):
        require_rovi_internal_workspace(current_user)
        await ensure_rovi_internal_seed_data(db)
        plans = serialize_docs(await db.rovi_service_plans.find({"tenant_id": ROVI_INTERNAL_TENANT_ID}).sort("price_mxn", 1).to_list(100))
        return {"plans": plans}

    @router.post("/service-plans")
    async def create_service_plan(payload: RoviServicePlanCreate, current_user: dict = Depends(get_current_user)):
        current_user = require_rovi_admin(current_user)
        now = now_iso()
        plan = {
            **payload.model_dump(),
            "id": f"rovi-plan-{uuid.uuid4()}",
            "tenant_id": ROVI_INTERNAL_TENANT_ID,
            "created_by": current_user["user_id"],
            "created_at": now,
            "updated_at": now,
        }
        await db.rovi_service_plans.insert_one(plan)
        return serialize_doc(plan)

    @router.get("/team")
    async def get_team(current_user: dict = Depends(get_current_user)):
        require_rovi_internal_workspace(current_user)
        users = serialize_docs(await db.users.find(
            {
                "$or": [
                    {"account_type": "rovi_internal"},
                    {"role": {"$in": list(ROVI_INTERNAL_ROLES)}},
                ]
            },
            {"_id": 0, "password_hash": 0},
        ).sort("role", 1).to_list(100))
        return {"team": users}

    @router.post("/seed-demo")
    async def seed_demo(current_user: dict = Depends(get_current_user)):
        current_user = require_rovi_admin(current_user)
        await ensure_rovi_internal_seed_data(db)
        return await build_dashboard_payload(db, current_user)

    return router
