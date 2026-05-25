from datetime import datetime, timezone
from typing import Any, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from auth import get_current_user, get_password_hash


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


CAMPAIGN_STATUSES = {"draft", "scheduled", "running", "paused", "completed", "failed"}
CAMPAIGN_TYPES = {"email", "sms", "whatsapp", "call", "ads", "webinar", "referral"}


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


DEFAULT_CAMPAIGNS = [
    {
        "id": "rovi-campaign-webinar-copim",
        "name": "Webinar COPIM Revenue",
        "campaign_type": "email",
        "status": "running",
        "objective": "Generar demos con asociaciones e inmobiliarias afiliadas.",
        "segment": "COPIM y asociaciones",
        "source": "Webinar",
        "owner_role": "rovi_marketing",
        "owner_user_id": "rovi-marketing-luis",
        "budget_mxn": 8500,
        "target_mql": 35,
        "target_sql": 10,
        "sent_count": 460,
        "total_recipients": 620,
        "open_count": 188,
        "click_count": 74,
        "reply_count": 18,
        "demo_count": 6,
        "expected_mrr_mxn": 28560,
        "notes": "Nutrir asistentes con caso COPIM Marketplace + IA.",
    },
    {
        "id": "rovi-campaign-linkedin-brokers",
        "name": "LinkedIn Ads Brokers Premium",
        "campaign_type": "ads",
        "status": "running",
        "objective": "Captar inmobiliarias medianas con dolor de seguimiento.",
        "segment": "Inmobiliarias 5-25 brokers",
        "source": "LinkedIn Ads",
        "owner_role": "rovi_marketing",
        "owner_user_id": "rovi-marketing-luis",
        "budget_mxn": 12600,
        "target_mql": 24,
        "target_sql": 8,
        "sent_count": 0,
        "total_recipients": 0,
        "open_count": 0,
        "click_count": 0,
        "reply_count": 11,
        "demo_count": 3,
        "expected_mrr_mxn": 18900,
        "notes": "Creativos con ROI de adopcion por broker.",
    },
    {
        "id": "rovi-campaign-referral-copim",
        "name": "Referidos COPIM",
        "campaign_type": "whatsapp",
        "status": "draft",
        "objective": "Activar referidos con miembros y asociaciones piloto.",
        "segment": "Miembros COPIM activos",
        "source": "Referido COPIM",
        "owner_role": "rovi_sales",
        "owner_user_id": "rovi-sales-ana",
        "budget_mxn": 3000,
        "target_mql": 15,
        "target_sql": 5,
        "sent_count": 0,
        "total_recipients": 80,
        "open_count": 0,
        "click_count": 0,
        "reply_count": 0,
        "demo_count": 0,
        "expected_mrr_mxn": 12000,
        "notes": "Usar aprobacion manual antes de enviar.",
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
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    company_size: Optional[str] = None
    broker_count: Optional[int] = None
    business_type: Optional[str] = None
    current_crm: Optional[str] = None
    urgency: Optional[str] = None
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


class RoviServicePlanUpdate(BaseModel):
    tier: Optional[str] = None
    name: Optional[str] = None
    price_mxn: Optional[float] = None
    billing_cycle: Optional[str] = None
    ideal_for: Optional[str] = None
    max_brokers: Optional[int] = None
    features: Optional[list[str]] = None
    is_active: Optional[bool] = None


class RoviCampaignCreate(BaseModel):
    name: str
    campaign_type: str = "email"
    status: str = "draft"
    objective: str = ""
    segment: str = "Inmobiliarias"
    source: str = "manual"
    owner_role: str = "rovi_marketing"
    owner_user_id: Optional[str] = None
    budget_mxn: float = 0
    target_mql: int = 0
    target_sql: int = 0
    total_recipients: int = 0
    sent_count: int = 0
    open_count: int = 0
    click_count: int = 0
    reply_count: int = 0
    demo_count: int = 0
    expected_mrr_mxn: float = 0
    notes: Optional[str] = None


class RoviCampaignUpdate(BaseModel):
    name: Optional[str] = None
    campaign_type: Optional[str] = None
    status: Optional[str] = None
    objective: Optional[str] = None
    segment: Optional[str] = None
    source: Optional[str] = None
    owner_role: Optional[str] = None
    owner_user_id: Optional[str] = None
    budget_mxn: Optional[float] = None
    target_mql: Optional[int] = None
    target_sql: Optional[int] = None
    total_recipients: Optional[int] = None
    sent_count: Optional[int] = None
    open_count: Optional[int] = None
    click_count: Optional[int] = None
    reply_count: Optional[int] = None
    demo_count: Optional[int] = None
    expected_mrr_mxn: Optional[float] = None
    notes: Optional[str] = None


class RoviTeamMemberCreate(BaseModel):
    name: str
    email: str
    role: str = "rovi_sales"
    department: str = "sales"
    phone: Optional[str] = None
    password: str = "demo123"
    is_active: bool = True


class RoviTeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


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


def enrich_campaign(campaign: dict) -> dict:
    campaign = dict(campaign)
    total_recipients = int(campaign.get("total_recipients") or 0)
    sent_count = int(campaign.get("sent_count") or 0)
    open_count = int(campaign.get("open_count") or 0)
    click_count = int(campaign.get("click_count") or 0)
    reply_count = int(campaign.get("reply_count") or 0)
    demo_count = int(campaign.get("demo_count") or 0)
    budget = float(campaign.get("budget_mxn") or 0)
    expected_mrr = float(campaign.get("expected_mrr_mxn") or 0)

    campaign["delivery_rate"] = round((sent_count / total_recipients) * 100, 1) if total_recipients else 0
    campaign["open_rate"] = round((open_count / sent_count) * 100, 1) if sent_count else 0
    campaign["click_rate"] = round((click_count / sent_count) * 100, 1) if sent_count else 0
    campaign["reply_rate"] = round((reply_count / sent_count) * 100, 1) if sent_count else 0
    campaign["demo_rate"] = round((demo_count / max(reply_count, 1)) * 100, 1) if reply_count else 0
    campaign["roi_mrr"] = round(expected_mrr / budget, 2) if budget else 0
    return campaign


def summarize_campaigns(campaigns: list[dict]) -> dict:
    campaigns = [enrich_campaign(item) for item in campaigns]
    total_budget = sum(float(item.get("budget_mxn") or 0) for item in campaigns)
    expected_mrr = sum(float(item.get("expected_mrr_mxn") or 0) for item in campaigns)
    total_sent = sum(int(item.get("sent_count") or 0) for item in campaigns)
    total_replies = sum(int(item.get("reply_count") or 0) for item in campaigns)
    total_demos = sum(int(item.get("demo_count") or 0) for item in campaigns)
    by_status: dict[str, int] = {}
    by_channel: dict[str, int] = {}
    for item in campaigns:
        by_status[item.get("status") or "draft"] = by_status.get(item.get("status") or "draft", 0) + 1
        by_channel[item.get("campaign_type") or "email"] = by_channel.get(item.get("campaign_type") or "email", 0) + 1

    return {
        "campaign_count": len(campaigns),
        "active_campaigns": len([item for item in campaigns if item.get("status") in {"running", "scheduled"}]),
        "total_budget_mxn": round(total_budget, 2),
        "expected_mrr_mxn": round(expected_mrr, 2),
        "total_sent": total_sent,
        "total_replies": total_replies,
        "total_demos": total_demos,
        "reply_rate": round((total_replies / total_sent) * 100, 1) if total_sent else 0,
        "roi_mrr": round(expected_mrr / total_budget, 2) if total_budget else 0,
        "by_status": [{"status": key, "count": value} for key, value in sorted(by_status.items())],
        "by_channel": [{"channel": key, "count": value} for key, value in sorted(by_channel.items())],
    }


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

    for campaign in DEFAULT_CAMPAIGNS:
        enriched_campaign = enrich_campaign(campaign)
        await db.rovi_campaigns.update_one(
            {"id": enriched_campaign["id"]},
            {
                "$set": {
                    **enriched_campaign,
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
    campaigns = serialize_docs(await db.rovi_campaigns.find({"tenant_id": ROVI_INTERNAL_TENANT_ID}).to_list(1000))
    campaigns = [enrich_campaign(item) for item in campaigns]
    team_members = serialize_docs(await db.users.find(
        {
            "$or": [
                {"account_type": "rovi_internal"},
                {"role": {"$in": list(ROVI_INTERNAL_ROLES)}},
            ]
        },
        {"_id": 0, "password_hash": 0},
    ).to_list(100))

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

    campaign_summary = summarize_campaigns(campaigns)
    active_plans = [plan for plan in service_plans if plan.get("is_active")]
    active_team = [member for member in team_members if member.get("is_active", True)]

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
            "active_plans": len(active_plans),
            "active_team": len(active_team),
            "campaigns_running": campaign_summary["active_campaigns"],
            "campaign_roi_mrr": campaign_summary["roi_mrr"],
            "campaign_budget_mxn": campaign_summary["total_budget_mxn"],
            "campaign_expected_mrr_mxn": campaign_summary["expected_mrr_mxn"],
        },
        "stage_counts": stage_counts,
        "source_stats": sorted(source_stats.values(), key=lambda item: item["weighted_mrr_mxn"], reverse=True),
        "hot_prospects": sorted(prospects, key=lambda item: item.get("score", 0), reverse=True)[:5],
        "service_plans": service_plans,
        "campaign_summary": campaign_summary,
        "top_campaigns": sorted(campaigns, key=lambda item: item.get("expected_mrr_mxn", 0), reverse=True)[:5],
        "team_summary": {
            "total": len(team_members),
            "active": len(active_team),
            "roles": [
                {"role": role, "count": len([member for member in team_members if member.get("role") == role])}
                for role in sorted({member.get("role") for member in team_members if member.get("role")})
            ],
        },
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

    @router.delete("/prospects/{prospect_id}")
    async def delete_prospect(prospect_id: str, current_user: dict = Depends(get_current_user)):
        require_rovi_admin(current_user)
        result = await db.rovi_prospects.delete_one({"tenant_id": ROVI_INTERNAL_TENANT_ID, "id": prospect_id})
        if not result.deleted_count:
            raise HTTPException(status_code=404, detail="Prospecto no encontrado.")
        return {"deleted": True, "id": prospect_id}

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

    @router.put("/service-plans/{plan_id}")
    async def update_service_plan(
        plan_id: str,
        payload: RoviServicePlanUpdate,
        current_user: dict = Depends(get_current_user),
    ):
        require_rovi_admin(current_user)
        existing = await db.rovi_service_plans.find_one({"tenant_id": ROVI_INTERNAL_TENANT_ID, "id": plan_id}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Plan no encontrado.")
        updates = {key: value for key, value in payload.model_dump(exclude_unset=True).items() if value is not None}
        updates["updated_at"] = now_iso()
        await db.rovi_service_plans.update_one(
            {"tenant_id": ROVI_INTERNAL_TENANT_ID, "id": plan_id},
            {"$set": updates},
        )
        updated = await db.rovi_service_plans.find_one({"tenant_id": ROVI_INTERNAL_TENANT_ID, "id": plan_id}, {"_id": 0})
        return serialize_doc(updated)

    @router.delete("/service-plans/{plan_id}")
    async def delete_service_plan(plan_id: str, current_user: dict = Depends(get_current_user)):
        require_rovi_admin(current_user)
        result = await db.rovi_service_plans.delete_one({"tenant_id": ROVI_INTERNAL_TENANT_ID, "id": plan_id})
        if not result.deleted_count:
            raise HTTPException(status_code=404, detail="Plan no encontrado.")
        return {"deleted": True, "id": plan_id}

    @router.get("/campaigns")
    async def list_campaigns(
        status: Optional[str] = None,
        campaign_type: Optional[str] = None,
        current_user: dict = Depends(get_current_user),
    ):
        require_rovi_internal_workspace(current_user)
        await ensure_rovi_internal_seed_data(db)
        query = {"tenant_id": ROVI_INTERNAL_TENANT_ID}
        if status and status != "all":
            query["status"] = status
        if campaign_type and campaign_type != "all":
            query["campaign_type"] = campaign_type
        campaigns = serialize_docs(await db.rovi_campaigns.find(query).sort("updated_at", -1).to_list(1000))
        enriched = [enrich_campaign(item) for item in campaigns]
        return {"campaigns": enriched, "summary": summarize_campaigns(enriched)}

    @router.post("/campaigns")
    async def create_campaign(payload: RoviCampaignCreate, current_user: dict = Depends(get_current_user)):
        current_user = require_rovi_internal_workspace(current_user)
        if payload.status not in CAMPAIGN_STATUSES:
            raise HTTPException(status_code=422, detail="Estado de campana invalido.")
        if payload.campaign_type not in CAMPAIGN_TYPES:
            raise HTTPException(status_code=422, detail="Tipo de campana invalido.")
        now = now_iso()
        campaign = enrich_campaign({
            **payload.model_dump(),
            "id": f"rovi-campaign-{uuid.uuid4()}",
            "tenant_id": ROVI_INTERNAL_TENANT_ID,
            "owner_user_id": payload.owner_user_id or current_user.get("user_id"),
            "created_by": current_user.get("user_id"),
            "created_at": now,
            "updated_at": now,
        })
        await db.rovi_campaigns.insert_one(campaign)
        return serialize_doc(campaign)

    @router.put("/campaigns/{campaign_id}")
    async def update_campaign(
        campaign_id: str,
        payload: RoviCampaignUpdate,
        current_user: dict = Depends(get_current_user),
    ):
        require_rovi_internal_workspace(current_user)
        existing = await db.rovi_campaigns.find_one({"tenant_id": ROVI_INTERNAL_TENANT_ID, "id": campaign_id}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Campana no encontrada.")
        updates = {key: value for key, value in payload.model_dump(exclude_unset=True).items() if value is not None}
        if "status" in updates and updates["status"] not in CAMPAIGN_STATUSES:
            raise HTTPException(status_code=422, detail="Estado de campana invalido.")
        if "campaign_type" in updates and updates["campaign_type"] not in CAMPAIGN_TYPES:
            raise HTTPException(status_code=422, detail="Tipo de campana invalido.")
        merged = enrich_campaign({**existing, **updates, "updated_at": now_iso()})
        await db.rovi_campaigns.update_one(
            {"tenant_id": ROVI_INTERNAL_TENANT_ID, "id": campaign_id},
            {"$set": merged},
        )
        return serialize_doc(merged)

    @router.post("/campaigns/{campaign_id}/start")
    async def start_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
        require_rovi_internal_workspace(current_user)
        existing = await db.rovi_campaigns.find_one({"tenant_id": ROVI_INTERNAL_TENANT_ID, "id": campaign_id}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Campana no encontrada.")
        total_recipients = int(existing.get("total_recipients") or 0)
        sent_count = int(existing.get("sent_count") or 0)
        if not sent_count and total_recipients:
            sent_count = min(total_recipients, max(1, int(total_recipients * 0.35)))
        merged = enrich_campaign({
            **existing,
            "status": "running",
            "sent_count": sent_count,
            "updated_at": now_iso(),
        })
        await db.rovi_campaigns.update_one({"tenant_id": ROVI_INTERNAL_TENANT_ID, "id": campaign_id}, {"$set": merged})
        return serialize_doc(merged)

    @router.post("/campaigns/{campaign_id}/pause")
    async def pause_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
        require_rovi_internal_workspace(current_user)
        existing = await db.rovi_campaigns.find_one({"tenant_id": ROVI_INTERNAL_TENANT_ID, "id": campaign_id}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Campana no encontrada.")
        merged = enrich_campaign({**existing, "status": "paused", "updated_at": now_iso()})
        await db.rovi_campaigns.update_one({"tenant_id": ROVI_INTERNAL_TENANT_ID, "id": campaign_id}, {"$set": merged})
        return serialize_doc(merged)

    @router.delete("/campaigns/{campaign_id}")
    async def delete_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
        require_rovi_admin(current_user)
        result = await db.rovi_campaigns.delete_one({"tenant_id": ROVI_INTERNAL_TENANT_ID, "id": campaign_id})
        if not result.deleted_count:
            raise HTTPException(status_code=404, detail="Campana no encontrada.")
        return {"deleted": True, "id": campaign_id}

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

    @router.post("/team")
    async def create_team_member(payload: RoviTeamMemberCreate, current_user: dict = Depends(get_current_user)):
        current_user = require_rovi_admin(current_user)
        if payload.role not in ROVI_INTERNAL_ROLES:
            raise HTTPException(status_code=422, detail="Rol ROVI invalido.")
        existing = await db.users.find_one({"email": payload.email}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=409, detail="Ya existe un usuario con ese correo.")
        now = now_iso()
        user_id = f"rovi-user-{uuid.uuid4()}"
        user_doc = {
            "id": user_id,
            "email": payload.email,
            "name": payload.name,
            "role": payload.role,
            "department": payload.department,
            "phone": payload.phone,
            "password_hash": get_password_hash(payload.password),
            "tenant_id": ROVI_INTERNAL_TENANT_ID,
            "personal_tenant_id": ROVI_INTERNAL_TENANT_ID,
            "account_type": "rovi_internal",
            "is_active": payload.is_active,
            "onboarding_completed": True,
            "created_at": now,
            "updated_at": now,
        }
        await db.users.insert_one(user_doc)
        await db.tenant_memberships.update_one(
            {"tenant_id": ROVI_INTERNAL_TENANT_ID, "user_id": user_id},
            {
                "$set": {
                    "tenant_id": ROVI_INTERNAL_TENANT_ID,
                    "user_id": user_id,
                    "role": payload.role,
                    "status": "active" if payload.is_active else "suspended",
                    "linked_via": "manual",
                    "is_default": True,
                    "accepted_at": now,
                    "created_by_user_id": current_user.get("user_id"),
                    "updated_at": now,
                },
                "$setOnInsert": {
                    "id": f"tm-rovi-internal-{user_id}",
                    "joined_at": now,
                    "created_at": now,
                    "revoked_at": None,
                },
            },
            upsert=True,
        )
        return serialize_doc({key: value for key, value in user_doc.items() if key != "password_hash"})

    @router.put("/team/{user_id}")
    async def update_team_member(
        user_id: str,
        payload: RoviTeamMemberUpdate,
        current_user: dict = Depends(get_current_user),
    ):
        require_rovi_admin(current_user)
        existing = await db.users.find_one({"id": user_id, "account_type": "rovi_internal"}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Miembro no encontrado.")
        updates = {key: value for key, value in payload.model_dump(exclude_unset=True).items() if value is not None}
        if "role" in updates and updates["role"] not in ROVI_INTERNAL_ROLES:
            raise HTTPException(status_code=422, detail="Rol ROVI invalido.")
        password = updates.pop("password", None)
        if password:
            updates["password_hash"] = get_password_hash(password)
        updates["updated_at"] = now_iso()
        await db.users.update_one({"id": user_id, "account_type": "rovi_internal"}, {"$set": updates})
        if "role" in updates or "is_active" in updates:
            membership_updates = {"updated_at": now_iso()}
            if "role" in updates:
                membership_updates["role"] = updates["role"]
            if "is_active" in updates:
                membership_updates["status"] = "active" if updates["is_active"] else "suspended"
            await db.tenant_memberships.update_one(
                {"tenant_id": ROVI_INTERNAL_TENANT_ID, "user_id": user_id},
                {"$set": membership_updates},
            )
        updated = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
        return serialize_doc(updated)

    @router.delete("/team/{user_id}")
    async def deactivate_team_member(user_id: str, current_user: dict = Depends(get_current_user)):
        require_rovi_admin(current_user)
        existing = await db.users.find_one({"id": user_id, "account_type": "rovi_internal"}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Miembro no encontrado.")
        await db.users.update_one(
            {"id": user_id, "account_type": "rovi_internal"},
            {"$set": {"is_active": False, "updated_at": now_iso()}},
        )
        await db.tenant_memberships.update_one(
            {"tenant_id": ROVI_INTERNAL_TENANT_ID, "user_id": user_id},
            {"$set": {"status": "suspended", "updated_at": now_iso()}},
        )
        return {"deactivated": True, "id": user_id}

    @router.post("/seed-demo")
    async def seed_demo(current_user: dict = Depends(get_current_user)):
        current_user = require_rovi_admin(current_user)
        await ensure_rovi_internal_seed_data(db)
        return await build_dashboard_payload(db, current_user)

    return router
