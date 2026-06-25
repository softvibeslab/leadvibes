from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Any, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field

from auth import get_current_user
from services.gremial_permissions import (
    build_gremial_query_scope,
    get_gremial_delegation_id,
    get_gremial_member_id,
    get_gremial_tenant_id,
    is_gremial_account,
    is_gremial_delegation_user,
    is_gremial_member_user,
    is_gremial_national_user,
)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:12]}"


class GremialDelegationCreate(BaseModel):
    name: str
    state: str
    city: Optional[str] = None
    president_name: Optional[str] = None
    admin_email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: str = "active"
    website: Optional[str] = None
    notes: Optional[str] = None

class GremialDelegationUpdate(BaseModel):
    name: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    president_name: Optional[str] = None
    admin_email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    website: Optional[str] = None
    notes: Optional[str] = None

class GremialMemberCreate(BaseModel):
    company_name: str
    email: EmailStr
    legal_name: Optional[str] = None
    rfc: Optional[str] = None
    phone: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    delegation_id: Optional[str] = None
    sector: Optional[str] = None
    specialties: list[str] = Field(default_factory=list)
    company_size: Optional[str] = None
    employees_count: Optional[int] = None
    representative_name: Optional[str] = None
    representative_email: Optional[EmailStr] = None
    member_status: str = "pending"
    membership_tier: str = "base"
    notes: Optional[str] = None


class GremialMemberUpdate(BaseModel):
    company_name: Optional[str] = None
    email: Optional[EmailStr] = None
    legal_name: Optional[str] = None
    rfc: Optional[str] = None
    phone: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    delegation_id: Optional[str] = None
    sector: Optional[str] = None
    specialties: Optional[list[str]] = None
    company_size: Optional[str] = None
    employees_count: Optional[int] = None
    representative_name: Optional[str] = None
    representative_email: Optional[EmailStr] = None
    member_status: Optional[str] = None
    membership_tier: Optional[str] = None
    notes: Optional[str] = None


class GremialMembershipCreate(BaseModel):
    member_id: str
    delegation_id: Optional[str] = None
    plan_name: str = "Afiliación anual"
    plan_price: float = 0.0
    billing_period: str = "annual"
    renewal_date: datetime
    payment_status: str = "due"
    balance_due: float = 0.0
    benefits_summary: Optional[str] = None
    notes: Optional[str] = None


class GremialMembershipUpdate(BaseModel):
    plan_name: Optional[str] = None
    plan_price: Optional[float] = None
    billing_period: Optional[str] = None
    renewal_date: Optional[datetime] = None
    payment_status: Optional[str] = None
    balance_due: Optional[float] = None
    benefits_summary: Optional[str] = None
    notes: Optional[str] = None


class GremialAffiliationLeadCreate(BaseModel):
    company_name: str
    contact_name: str
    email: EmailStr
    phone: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    interest: str = "afiliacion"
    source: str = "manual"
    delegation_id: Optional[str] = None
    stage: str = "nuevo"
    assigned_user_id: Optional[str] = None
    notes: Optional[str] = None


class GremialAffiliationLeadUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    interest: Optional[str] = None
    source: Optional[str] = None
    delegation_id: Optional[str] = None
    stage: Optional[str] = None
    assigned_user_id: Optional[str] = None
    notes: Optional[str] = None


class GremialLeadStageUpdate(BaseModel):
    stage: str
    notes: Optional[str] = None


class GremialDocumentCreate(BaseModel):
    document_type: str
    file_url: str
    status: str = "submitted"
    expires_at: Optional[datetime] = None
    notes: Optional[str] = None


class GremialServiceCreate(BaseModel):
    title: str
    category: str = "beneficio"
    description: Optional[str] = None
    scope: str = "national"
    status: str = "active"
    included_tiers: list[str] = Field(default_factory=list)


class GremialServiceUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    scope: Optional[str] = None
    status: Optional[str] = None
    included_tiers: Optional[list[str]] = None


class GremialServiceRequestCreate(BaseModel):
    member_id: Optional[str] = None
    notes: Optional[str] = None


class GremialOpportunityCreate(BaseModel):
    title: str
    opportunity_type: str = "private"
    description: Optional[str] = None
    state: Optional[str] = None
    delegation_id: Optional[str] = None
    sector: Optional[str] = None
    specialties: list[str] = Field(default_factory=list)
    budget: Optional[float] = None
    status: str = "draft"
    closes_at: Optional[datetime] = None


class GremialOpportunityUpdate(BaseModel):
    title: Optional[str] = None
    opportunity_type: Optional[str] = None
    description: Optional[str] = None
    state: Optional[str] = None
    delegation_id: Optional[str] = None
    sector: Optional[str] = None
    specialties: Optional[list[str]] = None
    budget: Optional[float] = None
    status: Optional[str] = None
    closes_at: Optional[datetime] = None


class GremialTenderCreate(GremialOpportunityCreate):
    dependency: Optional[str] = None
    tender_number: Optional[str] = None
    published_at: Optional[datetime] = None


class GremialTenderUpdate(GremialOpportunityUpdate):
    dependency: Optional[str] = None
    tender_number: Optional[str] = None
    published_at: Optional[datetime] = None


class GremialCourseCreate(BaseModel):
    title: str
    category: str = "capacitacion"
    description: Optional[str] = None
    modality: str = "online"
    instructor: Optional[str] = None
    state: Optional[str] = None
    delegation_id: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    capacity: Optional[int] = None
    price: float = 0.0
    status: str = "draft"


class GremialCourseUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    modality: Optional[str] = None
    instructor: Optional[str] = None
    state: Optional[str] = None
    delegation_id: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    capacity: Optional[int] = None
    price: Optional[float] = None
    status: Optional[str] = None


class GremialEventCreate(BaseModel):
    title: str
    event_type: str = "networking"
    description: Optional[str] = None
    venue: Optional[str] = None
    state: Optional[str] = None
    delegation_id: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    capacity: Optional[int] = None
    price: float = 0.0
    status: str = "draft"


class GremialEventUpdate(BaseModel):
    title: Optional[str] = None
    event_type: Optional[str] = None
    description: Optional[str] = None
    venue: Optional[str] = None
    state: Optional[str] = None
    delegation_id: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    capacity: Optional[int] = None
    price: Optional[float] = None
    status: Optional[str] = None


class GremialApplicationCreate(BaseModel):
    notes: Optional[str] = None


class GremialReviewUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


class RecommendationUpdate(BaseModel):
    status: str


def serialize(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if not doc:
        return None
    return {k: v for k, v in doc.items() if k != "_id"}


def serialize_list(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [serialize(item) for item in items]


def _safe_regex(value: str) -> dict[str, str]:
    escaped = "".join(f"\\{ch}" if ch in ".*+?^${}()|[]\\" else ch for ch in str(value or "").strip())
    return {"$regex": escaped, "$options": "i"}


def _add_text_search(query: dict[str, Any], q: Optional[str], fields: list[str]) -> None:
    if q and q.strip():
        query["$or"] = [{field: _safe_regex(q)} for field in fields]


def _add_exact_filter(query: dict[str, Any], field: str, value: Optional[str]) -> None:
    if value and value != "all":
        query[field] = value


async def _paginated_response(collection, query: dict[str, Any], *, page: int, page_size: int, sort: list[tuple[str, int]]):
    safe_page = max(1, int(page or 1))
    safe_size = min(100, max(12, int(page_size or 24)))
    total = await collection.count_documents(query)
    rows = await collection.find(query, {"_id": 0}).sort(sort).skip((safe_page - 1) * safe_size).limit(safe_size).to_list(safe_size)
    return {
        "items": serialize_list(rows),
        "total": total,
        "page": safe_page,
        "page_size": safe_size,
        "pages": max(1, (total + safe_size - 1) // safe_size),
    }


def require_gremial_user(current_user: dict = Depends(get_current_user)) -> dict:
    if not is_gremial_account(current_user):
        raise HTTPException(status_code=403, detail="Este módulo es solo para plataformas gremiales")
    return current_user


def require_gremial_admin(current_user: dict = Depends(require_gremial_user)) -> dict:
    if is_gremial_member_user(current_user):
        raise HTTPException(status_code=403, detail="Este recurso es solo para administración gremial")
    return current_user


def require_gremial_national(current_user: dict = Depends(require_gremial_user)) -> dict:
    if not is_gremial_national_user(current_user):
        raise HTTPException(status_code=403, detail="Este recurso es solo para nivel nacional")
    return current_user


async def _resolve_delegation_for_lead(db, tenant_id: str, payload: GremialAffiliationLeadCreate) -> Optional[str]:
    if payload.delegation_id:
        return payload.delegation_id
    if not payload.state:
        return None
    delegation = await db.gremial_delegations.find_one(
        {"tenant_id": tenant_id, "state": payload.state}, {"_id": 0, "id": 1}
    )
    return delegation.get("id") if delegation else None


async def _profile_completion(member: dict[str, Any], db) -> int:
    fields = [
        member.get("company_name"), member.get("email"), member.get("phone"), member.get("rfc"),
        member.get("state"), member.get("city"), member.get("delegation_id"), member.get("sector"),
        member.get("representative_name"), member.get("specialties"),
    ]
    base = int((sum(1 for item in fields if item not in (None, "", [])) / len(fields)) * 75)
    docs = await db.gremial_documents.count_documents({
        "tenant_id": member.get("tenant_id"), "member_id": member.get("id"), "status": "approved"
    })
    return min(100, base + min(25, docs * 8))


async def _generate_recommendations(db, tenant_id: str, scope: dict[str, Any]) -> list[dict[str, Any]]:
    now = datetime.now(timezone.utc)
    recommendations: list[dict[str, Any]] = []

    memberships = await db.gremial_memberships.find({**scope}, {"_id": 0}).to_list(1000)
    member_ids = [item.get("member_id") for item in memberships if item.get("member_id")]
    members = await db.gremial_members.find({"tenant_id": tenant_id, "id": {"$in": member_ids}}, {"_id": 0}).to_list(1000)
    member_map = {member["id"]: member for member in members}

    for membership in memberships:
        member = member_map.get(membership.get("member_id"), {})
        renewal_raw = membership.get("renewal_date")
        renewal_dt = None
        if isinstance(renewal_raw, str):
            try:
                renewal_dt = datetime.fromisoformat(renewal_raw.replace("Z", "+00:00"))
            except ValueError:
                renewal_dt = None
        elif isinstance(renewal_raw, datetime):
            renewal_dt = renewal_raw

        if membership.get("payment_status") == "overdue" or float(membership.get("balance_due") or 0) > 0:
            recommendations.append({
                "id": f"rec-overdue-{membership['id']}",
                "tenant_id": tenant_id,
                "delegation_id": membership.get("delegation_id"),
                "member_id": membership.get("member_id"),
                "category": "cobranza",
                "priority": "high" if membership.get("payment_status") == "overdue" else "medium",
                "title": "Seguimiento de cuota pendiente",
                "explanation": f"{member.get('company_name', 'Afiliado')} tiene saldo pendiente de ${membership.get('balance_due', 0)}.",
                "suggested_action": "Crear tarea de cobranza y enviar recordatorio por WhatsApp/email.",
                "status": "open",
                "created_at": now_iso(),
            })
        if renewal_dt and 0 <= (renewal_dt - now).days <= 30:
            recommendations.append({
                "id": f"rec-renewal-{membership['id']}",
                "tenant_id": tenant_id,
                "delegation_id": membership.get("delegation_id"),
                "member_id": membership.get("member_id"),
                "category": "renovacion",
                "priority": "medium",
                "title": "Renovación próxima",
                "explanation": f"La membresía de {member.get('company_name', 'afiliado')} vence en menos de 30 días.",
                "suggested_action": "Enviar propuesta de renovación con beneficios usados y próximos servicios recomendados.",
                "status": "open",
                "created_at": now_iso(),
            })

    incomplete_members = await db.gremial_members.find({**scope, "profile_completion": {"$lt": 80}}, {"_id": 0}).to_list(200)
    for member in incomplete_members:
        recommendations.append({
            "id": f"rec-profile-{member['id']}",
            "tenant_id": tenant_id,
            "delegation_id": member.get("delegation_id"),
            "member_id": member.get("id"),
            "category": "expediente",
            "priority": "medium",
            "title": "Expediente incompleto",
            "explanation": f"{member.get('company_name')} tiene expediente al {member.get('profile_completion', 0)}%.",
            "suggested_action": "Solicitar documentos faltantes antes de habilitar postulaciones a oportunidades.",
            "status": "open",
            "created_at": now_iso(),
        })

    return recommendations


def create_gremial_router(db) -> APIRouter:
    router = APIRouter(prefix="/gremial", tags=["gremial"])

    @router.get("/config", response_model=dict)
    async def get_config(current_user: dict = Depends(require_gremial_user)):
        tenant_id = get_gremial_tenant_id(current_user)
        config = await db.gremial_configs.find_one({"tenant_id": tenant_id}, {"_id": 0})
        return config or {
            "tenant_id": tenant_id,
            "vertical": "gremial",
            "name": "Rovi Gremial OS",
            "labels": {"delegation": "Delegación", "member": "Afiliado", "membership": "Membresía"},
        }

    @router.get("/dashboard", response_model=dict)
    async def dashboard(current_user: dict = Depends(require_gremial_user)):
        tenant_id = get_gremial_tenant_id(current_user)
        scope = build_gremial_query_scope(current_user)
        delegation_id = get_gremial_delegation_id(current_user)
        member_id = get_gremial_member_id(current_user)

        if is_gremial_member_user(current_user):
            member = await db.gremial_members.find_one(scope, {"_id": 0})
            membership = await db.gremial_memberships.find_one({"tenant_id": tenant_id, "member_id": member_id}, {"_id": 0}) if member_id else None
            invoices = await db.gremial_memberships.find({"tenant_id": tenant_id, "member_id": member_id, "balance_due": {"$gt": 0}}, {"_id": 0}).to_list(20) if member_id else []
            opportunities = await db.gremial_opportunities.find({"tenant_id": tenant_id, "status": {"$in": ["published", "open"]}}, {"_id": 0}).sort("created_at", -1).to_list(10)
            return {
                "scope": "member",
                "member": member,
                "membership": membership,
                "pending_payments": invoices,
                "recommended_opportunities": opportunities,
            }

        member_count = await db.gremial_members.count_documents(scope)
        active_members = await db.gremial_members.count_documents({**scope, "member_status": "active"})
        leads_open = await db.gremial_affiliation_leads.count_documents({**scope, "stage": {"$nin": ["convertido", "perdido"]}})
        memberships_due = await db.gremial_memberships.count_documents({**scope, "payment_status": {"$in": ["due", "overdue"]}})
        revenue_docs = await db.gremial_memberships.find({**scope, "balance_due": {"$gt": 0}}, {"_id": 0, "balance_due": 1}).to_list(1000)
        revenue_due = sum(float(item.get("balance_due") or 0) for item in revenue_docs)
        opportunities = await db.gremial_opportunities.count_documents({**scope, "status": {"$in": ["published", "open"]}})
        tenders = await db.gremial_tenders.count_documents({**scope, "status": {"$in": ["published", "open"]}})
        courses = await db.gremial_courses.count_documents({**scope, "status": {"$in": ["published", "open"]}})
        events = await db.gremial_events.count_documents({**scope, "status": {"$in": ["published", "open"]}})
        delegations = await db.gremial_delegations.find({"tenant_id": tenant_id} if is_gremial_national_user(current_user) else {"tenant_id": tenant_id, "id": delegation_id}, {"_id": 0}).to_list(200)
        recommendations = await db.gremial_ai_recommendations.find({**scope, "status": "open"}, {"_id": 0}).sort("priority", -1).to_list(8)

        return {
            "scope": "national" if is_gremial_national_user(current_user) else "delegation",
            "kpis": {
                "member_count": member_count,
                "active_members": active_members,
                "leads_open": leads_open,
                "memberships_due": memberships_due,
                "revenue_due": revenue_due,
                "opportunities": opportunities,
                "tenders": tenders,
                "courses": courses,
                "events": events,
            },
            "delegations": delegations,
            "recommendations": recommendations,
        }

    @router.get("/delegations", response_model=Any)
    async def list_delegations(
        current_user: dict = Depends(require_gremial_admin),
        page: int = Query(1, ge=1),
        page_size: int = Query(60, ge=12, le=100),
        q: Optional[str] = None,
        status: Optional[str] = None,
        state: Optional[str] = None,
        paginated: bool = False,
    ):
        tenant_id = get_gremial_tenant_id(current_user)
        query = {"tenant_id": tenant_id}
        if is_gremial_delegation_user(current_user):
            query["id"] = get_gremial_delegation_id(current_user)
        _add_text_search(query, q, ["name", "state", "city", "president_name", "admin_email", "notes"])
        _add_exact_filter(query, "status", status)
        _add_exact_filter(query, "state", state)
        if paginated:
            return await _paginated_response(db.gremial_delegations, query, page=page, page_size=page_size, sort=[("name", 1)])
        return serialize_list(await db.gremial_delegations.find(query, {"_id": 0}).sort("name", 1).to_list(500))

    @router.post("/delegations", response_model=dict)
    async def create_delegation(payload: GremialDelegationCreate, current_user: dict = Depends(require_gremial_national)):
        tenant_id = get_gremial_tenant_id(current_user)
        doc = {"id": new_id("gdel"), "tenant_id": tenant_id, **payload.model_dump(), "created_at": now_iso(), "updated_at": now_iso()}
        await db.gremial_delegations.insert_one(doc)
        return serialize(doc)

    @router.put("/delegations/{delegation_id}", response_model=dict)
    async def update_delegation(delegation_id: str, payload: GremialDelegationUpdate, current_user: dict = Depends(require_gremial_national)):
        tenant_id = get_gremial_tenant_id(current_user)
        update = payload.model_dump(exclude_unset=True)
        if not update:
            raise HTTPException(status_code=400, detail="No hay cambios para guardar")
        update["updated_at"] = now_iso()
        result = await db.gremial_delegations.update_one({"tenant_id": tenant_id, "id": delegation_id}, {"$set": update})
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Delegación no encontrada")
        return serialize(await db.gremial_delegations.find_one({"tenant_id": tenant_id, "id": delegation_id}, {"_id": 0}))

    @router.get("/members", response_model=Any)
    async def list_members(
        current_user: dict = Depends(require_gremial_user),
        page: int = Query(1, ge=1),
        page_size: int = Query(60, ge=12, le=100),
        q: Optional[str] = None,
        status: Optional[str] = None,
        state: Optional[str] = None,
        tier: Optional[str] = None,
        paginated: bool = False,
    ):
        scope = build_gremial_query_scope(current_user)
        _add_text_search(scope, q, ["company_name", "legal_name", "representative_name", "email", "rfc", "state", "city", "sector", "member_status", "membership_tier"])
        _add_exact_filter(scope, "member_status", status)
        _add_exact_filter(scope, "state", state)
        _add_exact_filter(scope, "membership_tier", tier)
        if paginated:
            return await _paginated_response(db.gremial_members, scope, page=page, page_size=page_size, sort=[("company_name", 1)])
        return serialize_list(await db.gremial_members.find(scope, {"_id": 0}).sort("company_name", 1).to_list(1000))

    @router.post("/members", response_model=dict)
    async def create_member(payload: GremialMemberCreate, current_user: dict = Depends(require_gremial_admin)):
        tenant_id = get_gremial_tenant_id(current_user)
        delegation_id = get_gremial_delegation_id(current_user) if is_gremial_delegation_user(current_user) else payload.delegation_id
        doc = {"id": new_id("gmem"), "tenant_id": tenant_id, **payload.model_dump(), "delegation_id": delegation_id, "profile_completion": 0, "engagement_score": 50, "created_at": now_iso(), "updated_at": now_iso()}
        doc["profile_completion"] = await _profile_completion(doc, db)
        await db.gremial_members.insert_one(doc)
        return serialize(doc)

    @router.get("/members/{member_id}", response_model=dict)
    async def get_member(member_id: str, current_user: dict = Depends(require_gremial_user)):
        scope = build_gremial_query_scope(current_user)
        scope["id"] = member_id
        member = await db.gremial_members.find_one(scope, {"_id": 0})
        if not member:
            raise HTTPException(status_code=404, detail="Afiliado no encontrado")
        docs = await db.gremial_documents.find({"tenant_id": member["tenant_id"], "member_id": member_id}, {"_id": 0}).to_list(100)
        membership = await db.gremial_memberships.find_one({"tenant_id": member["tenant_id"], "member_id": member_id}, {"_id": 0})
        return {"member": member, "documents": docs, "membership": membership}

    @router.put("/members/{member_id}", response_model=dict)
    async def update_member(member_id: str, payload: GremialMemberUpdate, current_user: dict = Depends(require_gremial_admin)):
        scope = build_gremial_query_scope(current_user)
        scope["id"] = member_id
        update = payload.model_dump(exclude_unset=True)
        if is_gremial_delegation_user(current_user):
            update.pop("delegation_id", None)
        if not update:
            raise HTTPException(status_code=400, detail="No hay cambios para guardar")
        existing = await db.gremial_members.find_one(scope, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Afiliado no encontrado")
        merged = {**existing, **update}
        update["updated_at"] = now_iso()
        update["profile_completion"] = await _profile_completion(merged, db)
        await db.gremial_members.update_one(scope, {"$set": update})
        return serialize(await db.gremial_members.find_one(scope, {"_id": 0}))

    @router.get("/memberships", response_model=Any)
    async def list_memberships(
        current_user: dict = Depends(require_gremial_user),
        page: int = Query(1, ge=1),
        page_size: int = Query(60, ge=12, le=100),
        q: Optional[str] = None,
        status: Optional[str] = None,
        period: Optional[str] = None,
        paginated: bool = False,
    ):
        scope = build_gremial_query_scope(current_user, member_field="member_id")
        _add_text_search(scope, q, ["plan_name", "member_id", "payment_status", "billing_period", "benefits_summary", "notes"])
        _add_exact_filter(scope, "payment_status", status)
        _add_exact_filter(scope, "billing_period", period)
        if paginated:
            response = await _paginated_response(db.gremial_memberships, scope, page=page, page_size=page_size, sort=[("renewal_date", 1)])
            summary_scope = dict(scope)
            if summary_scope.get("payment_status") in ["due", "overdue"]:
                pending_scope = dict(summary_scope)
            elif summary_scope.get("payment_status"):
                pending_scope = {**summary_scope, "payment_status": "__none__"}
            else:
                pending_scope = {**summary_scope, "payment_status": {"$in": ["due", "overdue"]}}
            response["summary"] = {
                "pending": await db.gremial_memberships.count_documents(pending_scope),
                "balance_due": sum((row.get("balance_due") or 0) for row in await db.gremial_memberships.find(summary_scope, {"_id": 0, "balance_due": 1}).to_list(10000)),
            }
            return response
        return serialize_list(await db.gremial_memberships.find(scope, {"_id": 0}).sort("renewal_date", 1).to_list(1000))

    @router.post("/memberships", response_model=dict)
    async def create_membership(payload: GremialMembershipCreate, current_user: dict = Depends(require_gremial_admin)):
        tenant_id = get_gremial_tenant_id(current_user)
        delegation_id = get_gremial_delegation_id(current_user) if is_gremial_delegation_user(current_user) else payload.delegation_id
        doc = {"id": new_id("gmship"), "tenant_id": tenant_id, **payload.model_dump(), "delegation_id": delegation_id, "created_at": now_iso(), "updated_at": now_iso()}
        await db.gremial_memberships.insert_one(doc)
        return serialize(doc)

    @router.put("/memberships/{membership_id}", response_model=dict)
    async def update_membership(membership_id: str, payload: GremialMembershipUpdate, current_user: dict = Depends(require_gremial_admin)):
        scope = build_gremial_query_scope(current_user, member_field="member_id")
        scope["id"] = membership_id
        update = payload.model_dump(exclude_unset=True)
        if not update:
            raise HTTPException(status_code=400, detail="No hay cambios para guardar")
        update["updated_at"] = now_iso()
        result = await db.gremial_memberships.update_one(scope, {"$set": update})
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Membresía no encontrada")
        return serialize(await db.gremial_memberships.find_one(scope, {"_id": 0}))

    @router.post("/memberships/{membership_id}/mark-paid", response_model=dict)
    async def mark_membership_paid(membership_id: str, current_user: dict = Depends(require_gremial_admin)):
        scope = build_gremial_query_scope(current_user, member_field="member_id")
        scope["id"] = membership_id
        update = {"payment_status": "paid", "balance_due": 0, "paid_at": now_iso(), "updated_at": now_iso()}
        result = await db.gremial_memberships.update_one(scope, {"$set": update})
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Membresía no encontrada")
        return serialize(await db.gremial_memberships.find_one(scope, {"_id": 0}))

    @router.get("/affiliation-leads", response_model=list[dict])
    async def list_leads(current_user: dict = Depends(require_gremial_admin)):
        scope = build_gremial_query_scope(current_user)
        return serialize_list(await db.gremial_affiliation_leads.find(scope, {"_id": 0}).sort("created_at", -1).to_list(1000))

    @router.post("/affiliation-leads", response_model=dict)
    async def create_lead(payload: GremialAffiliationLeadCreate, current_user: dict = Depends(require_gremial_admin)):
        tenant_id = get_gremial_tenant_id(current_user)
        delegation_id = await _resolve_delegation_for_lead(db, tenant_id, payload) or get_gremial_delegation_id(current_user)
        doc = {"id": new_id("glead"), "tenant_id": tenant_id, **payload.model_dump(), "delegation_id": delegation_id, "created_at": now_iso(), "updated_at": now_iso()}
        await db.gremial_affiliation_leads.insert_one(doc)
        return serialize(doc)

    @router.put("/affiliation-leads/{lead_id}", response_model=dict)
    async def update_lead(lead_id: str, payload: GremialAffiliationLeadUpdate, current_user: dict = Depends(require_gremial_admin)):
        scope = build_gremial_query_scope(current_user)
        scope["id"] = lead_id
        update = payload.model_dump(exclude_unset=True)
        if is_gremial_delegation_user(current_user):
            update.pop("delegation_id", None)
        if not update:
            raise HTTPException(status_code=400, detail="No hay cambios para guardar")
        update["updated_at"] = now_iso()
        result = await db.gremial_affiliation_leads.update_one(scope, {"$set": update})
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Prospecto no encontrado")
        return serialize(await db.gremial_affiliation_leads.find_one(scope, {"_id": 0}))

    @router.patch("/affiliation-leads/{lead_id}/stage", response_model=dict)
    async def update_lead_stage(lead_id: str, payload: GremialLeadStageUpdate, current_user: dict = Depends(require_gremial_admin)):
        scope = build_gremial_query_scope(current_user)
        scope["id"] = lead_id
        update = {"stage": payload.stage, "updated_at": now_iso()}
        if payload.notes:
            update["notes"] = payload.notes
        result = await db.gremial_affiliation_leads.update_one(scope, {"$set": update})
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Prospecto no encontrado")
        return serialize(await db.gremial_affiliation_leads.find_one(scope, {"_id": 0}))

    @router.post("/affiliation-leads/{lead_id}/convert", response_model=dict)
    async def convert_lead(lead_id: str, current_user: dict = Depends(require_gremial_admin)):
        scope = build_gremial_query_scope(current_user)
        scope["id"] = lead_id
        lead = await db.gremial_affiliation_leads.find_one(scope, {"_id": 0})
        if not lead:
            raise HTTPException(status_code=404, detail="Prospecto no encontrado")
        member_doc = {
            "id": new_id("gmem"), "tenant_id": lead["tenant_id"], "company_name": lead["company_name"],
            "email": lead["email"], "phone": lead.get("phone"), "state": lead.get("state"), "city": lead.get("city"),
            "delegation_id": lead.get("delegation_id"), "representative_name": lead.get("contact_name"),
            "member_status": "active", "membership_tier": "base", "profile_completion": 60, "engagement_score": 50,
            "created_from_lead_id": lead_id, "created_at": now_iso(), "updated_at": now_iso(),
        }
        await db.gremial_members.insert_one(member_doc)
        membership_doc = {
            "id": new_id("gmship"), "tenant_id": lead["tenant_id"], "member_id": member_doc["id"],
            "delegation_id": lead.get("delegation_id"), "plan_name": "Afiliación anual", "plan_price": 0,
            "billing_period": "annual", "renewal_date": datetime.now(timezone.utc) + timedelta(days=365),
            "payment_status": "due", "balance_due": 0, "created_at": now_iso(), "updated_at": now_iso(),
        }
        await db.gremial_memberships.insert_one(membership_doc)
        await db.gremial_affiliation_leads.update_one(scope, {"$set": {"stage": "convertido", "converted_member_id": member_doc["id"], "updated_at": now_iso()}})
        return {"member": serialize(member_doc), "membership": serialize(membership_doc)}

    @router.get("/services", response_model=list[dict])
    async def list_services(current_user: dict = Depends(require_gremial_user)):
        tenant_id = get_gremial_tenant_id(current_user)
        return serialize_list(await db.gremial_services.find({"tenant_id": tenant_id, "status": {"$ne": "archived"}}, {"_id": 0}).sort("title", 1).to_list(500))

    @router.post("/services", response_model=dict)
    async def create_service(payload: GremialServiceCreate, current_user: dict = Depends(require_gremial_admin)):
        doc = {"id": new_id("gsvc"), "tenant_id": get_gremial_tenant_id(current_user), **payload.model_dump(), "created_at": now_iso(), "updated_at": now_iso()}
        await db.gremial_services.insert_one(doc)
        return serialize(doc)

    @router.put("/services/{service_id}", response_model=dict)
    async def update_service(service_id: str, payload: GremialServiceUpdate, current_user: dict = Depends(require_gremial_admin)):
        tenant_id = get_gremial_tenant_id(current_user)
        update = payload.model_dump(exclude_unset=True)
        if not update:
            raise HTTPException(status_code=400, detail="No hay cambios para guardar")
        update["updated_at"] = now_iso()
        result = await db.gremial_services.update_one({"tenant_id": tenant_id, "id": service_id}, {"$set": update})
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Servicio no encontrado")
        return serialize(await db.gremial_services.find_one({"tenant_id": tenant_id, "id": service_id}, {"_id": 0}))

    @router.post("/services/{service_id}/status", response_model=dict)
    async def update_service_status(service_id: str, payload: GremialReviewUpdate, current_user: dict = Depends(require_gremial_admin)):
        tenant_id = get_gremial_tenant_id(current_user)
        result = await db.gremial_services.update_one({"tenant_id": tenant_id, "id": service_id}, {"$set": {"status": payload.status, "status_notes": payload.notes, "updated_at": now_iso()}})
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Servicio no encontrado")
        return serialize(await db.gremial_services.find_one({"tenant_id": tenant_id, "id": service_id}, {"_id": 0}))

    @router.post("/services/{service_id}/request", response_model=dict)
    async def request_service(service_id: str, payload: GremialServiceRequestCreate, current_user: dict = Depends(require_gremial_user)):
        tenant_id = get_gremial_tenant_id(current_user)
        member_id = payload.member_id or get_gremial_member_id(current_user)
        if not member_id:
            raise HTTPException(status_code=400, detail="No hay afiliado asociado")
        member = await db.gremial_members.find_one({"tenant_id": tenant_id, "id": member_id}, {"_id": 0, "delegation_id": 1})
        doc = {"id": new_id("gsvcr"), "tenant_id": tenant_id, "delegation_id": member.get("delegation_id") if member else get_gremial_delegation_id(current_user), "service_id": service_id, "member_id": member_id, "status": "open", "notes": payload.notes, "created_at": now_iso(), "updated_at": now_iso()}
        await db.gremial_service_requests.insert_one(doc)
        return serialize(doc)

    @router.get("/service-requests", response_model=list[dict])
    async def list_service_requests(current_user: dict = Depends(require_gremial_user)):
        scope = build_gremial_query_scope(current_user, member_field="member_id")
        return serialize_list(await db.gremial_service_requests.find(scope, {"_id": 0}).sort("created_at", -1).to_list(500))

    @router.post("/service-requests/{request_id}/status", response_model=dict)
    async def update_service_request_status(request_id: str, payload: GremialReviewUpdate, current_user: dict = Depends(require_gremial_admin)):
        scope = build_gremial_query_scope(current_user, member_field="member_id")
        scope["id"] = request_id
        update = {"status": payload.status, "review_notes": payload.notes, "reviewed_by_user_id": current_user.get("id"), "reviewed_at": now_iso(), "updated_at": now_iso()}
        result = await db.gremial_service_requests.update_one(scope, {"$set": update})
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Solicitud no encontrada")
        return serialize(await db.gremial_service_requests.find_one(scope, {"_id": 0}))

    @router.get("/opportunities", response_model=list[dict])
    async def list_opportunities(current_user: dict = Depends(require_gremial_user)):
        scope = build_gremial_query_scope(current_user)
        if is_gremial_member_user(current_user):
            scope.pop("id", None)
            scope.pop("member_id", None)
            scope["status"] = {"$in": ["published", "open"]}
        return serialize_list(await db.gremial_opportunities.find(scope, {"_id": 0}).sort("created_at", -1).to_list(1000))

    @router.post("/opportunities", response_model=dict)
    async def create_opportunity(payload: GremialOpportunityCreate, current_user: dict = Depends(require_gremial_admin)):
        delegation_id = get_gremial_delegation_id(current_user) if is_gremial_delegation_user(current_user) else payload.delegation_id
        doc = {"id": new_id("gopp"), "tenant_id": get_gremial_tenant_id(current_user), **payload.model_dump(), "delegation_id": delegation_id, "created_at": now_iso(), "updated_at": now_iso()}
        await db.gremial_opportunities.insert_one(doc)
        return serialize(doc)

    @router.put("/opportunities/{opportunity_id}", response_model=dict)
    async def update_opportunity(opportunity_id: str, payload: GremialOpportunityUpdate, current_user: dict = Depends(require_gremial_admin)):
        scope = build_gremial_query_scope(current_user)
        scope["id"] = opportunity_id
        update = payload.model_dump(exclude_unset=True)
        if is_gremial_delegation_user(current_user):
            update.pop("delegation_id", None)
        if not update:
            raise HTTPException(status_code=400, detail="No hay cambios para guardar")
        update["updated_at"] = now_iso()
        result = await db.gremial_opportunities.update_one(scope, {"$set": update})
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Oportunidad no encontrada")
        return serialize(await db.gremial_opportunities.find_one(scope, {"_id": 0}))

    @router.post("/opportunities/{opportunity_id}/status", response_model=dict)
    async def update_opportunity_status(opportunity_id: str, payload: GremialReviewUpdate, current_user: dict = Depends(require_gremial_admin)):
        scope = build_gremial_query_scope(current_user)
        scope["id"] = opportunity_id
        update = {"status": payload.status, "status_notes": payload.notes, "updated_at": now_iso()}
        result = await db.gremial_opportunities.update_one(scope, {"$set": update})
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Oportunidad no encontrada")
        return serialize(await db.gremial_opportunities.find_one(scope, {"_id": 0}))

    @router.post("/opportunities/{opportunity_id}/apply", response_model=dict)
    async def apply_opportunity(opportunity_id: str, payload: GremialApplicationCreate | None = None, current_user: dict = Depends(require_gremial_user)):
        tenant_id = get_gremial_tenant_id(current_user)
        member_id = get_gremial_member_id(current_user)
        if not member_id:
            raise HTTPException(status_code=400, detail="Solo afiliados con portal pueden postular")
        doc = {"id": new_id("gapp"), "tenant_id": tenant_id, "opportunity_id": opportunity_id, "member_id": member_id, "status": "submitted", "notes": payload.notes if payload else None, "submitted_at": now_iso(), "updated_at": now_iso()}
        await db.gremial_opportunity_applications.update_one(
            {"tenant_id": tenant_id, "opportunity_id": opportunity_id, "member_id": member_id}, {"$set": doc}, upsert=True
        )
        return serialize(doc)

    @router.get("/opportunity-applications", response_model=list[dict])
    async def list_opportunity_applications(current_user: dict = Depends(require_gremial_user)):
        scope = build_gremial_query_scope(current_user, member_field="member_id")
        return serialize_list(await db.gremial_opportunity_applications.find(scope, {"_id": 0}).sort("submitted_at", -1).to_list(500))

    @router.post("/opportunity-applications/{application_id}/status", response_model=dict)
    async def update_opportunity_application_status(application_id: str, payload: GremialReviewUpdate, current_user: dict = Depends(require_gremial_admin)):
        scope = build_gremial_query_scope(current_user, member_field="member_id")
        scope["id"] = application_id
        update = {"status": payload.status, "review_notes": payload.notes, "reviewed_by_user_id": current_user.get("id"), "reviewed_at": now_iso(), "updated_at": now_iso()}
        result = await db.gremial_opportunity_applications.update_one(scope, {"$set": update})
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Postulación no encontrada")
        return serialize(await db.gremial_opportunity_applications.find_one(scope, {"_id": 0}))

    @router.get("/tenders", response_model=list[dict])
    async def list_tenders(current_user: dict = Depends(require_gremial_user)):
        scope = build_gremial_query_scope(current_user)
        if is_gremial_member_user(current_user):
            scope.pop("id", None)
            scope.pop("member_id", None)
            scope["status"] = {"$in": ["published", "open"]}
        return serialize_list(await db.gremial_tenders.find(scope, {"_id": 0}).sort("published_at", -1).to_list(1000))

    @router.post("/tenders", response_model=dict)
    async def create_tender(payload: GremialTenderCreate, current_user: dict = Depends(require_gremial_admin)):
        delegation_id = get_gremial_delegation_id(current_user) if is_gremial_delegation_user(current_user) else payload.delegation_id
        doc = {"id": new_id("gtender"), "tenant_id": get_gremial_tenant_id(current_user), **payload.model_dump(), "delegation_id": delegation_id, "created_at": now_iso(), "updated_at": now_iso()}
        await db.gremial_tenders.insert_one(doc)
        return serialize(doc)

    @router.put("/tenders/{tender_id}", response_model=dict)
    async def update_tender(tender_id: str, payload: GremialTenderUpdate, current_user: dict = Depends(require_gremial_admin)):
        scope = build_gremial_query_scope(current_user)
        scope["id"] = tender_id
        update = payload.model_dump(exclude_unset=True)
        if is_gremial_delegation_user(current_user):
            update.pop("delegation_id", None)
        if not update:
            raise HTTPException(status_code=400, detail="No hay cambios para guardar")
        update["updated_at"] = now_iso()
        result = await db.gremial_tenders.update_one(scope, {"$set": update})
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Licitación no encontrada")
        return serialize(await db.gremial_tenders.find_one(scope, {"_id": 0}))

    @router.post("/tenders/{tender_id}/status", response_model=dict)
    async def update_tender_status(tender_id: str, payload: GremialReviewUpdate, current_user: dict = Depends(require_gremial_admin)):
        scope = build_gremial_query_scope(current_user)
        scope["id"] = tender_id
        update = {"status": payload.status, "status_notes": payload.notes, "updated_at": now_iso()}
        result = await db.gremial_tenders.update_one(scope, {"$set": update})
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Licitación no encontrada")
        return serialize(await db.gremial_tenders.find_one(scope, {"_id": 0}))

    @router.post("/tenders/{tender_id}/apply", response_model=dict)
    async def apply_tender(tender_id: str, payload: GremialApplicationCreate | None = None, current_user: dict = Depends(require_gremial_user)):
        tenant_id = get_gremial_tenant_id(current_user)
        member_id = get_gremial_member_id(current_user)
        if not member_id:
            raise HTTPException(status_code=400, detail="Solo afiliados con portal pueden postular")
        doc = {"id": new_id("gtapp"), "tenant_id": tenant_id, "tender_id": tender_id, "member_id": member_id, "status": "submitted", "notes": payload.notes if payload else None, "submitted_at": now_iso(), "updated_at": now_iso()}
        await db.gremial_tender_applications.update_one(
            {"tenant_id": tenant_id, "tender_id": tender_id, "member_id": member_id}, {"$set": doc}, upsert=True
        )
        return serialize(doc)

    @router.get("/tender-applications", response_model=list[dict])
    async def list_tender_applications(current_user: dict = Depends(require_gremial_user)):
        scope = build_gremial_query_scope(current_user, member_field="member_id")
        return serialize_list(await db.gremial_tender_applications.find(scope, {"_id": 0}).sort("submitted_at", -1).to_list(500))

    @router.post("/tender-applications/{application_id}/status", response_model=dict)
    async def update_tender_application_status(application_id: str, payload: GremialReviewUpdate, current_user: dict = Depends(require_gremial_admin)):
        scope = build_gremial_query_scope(current_user, member_field="member_id")
        scope["id"] = application_id
        update = {"status": payload.status, "review_notes": payload.notes, "reviewed_by_user_id": current_user.get("id"), "reviewed_at": now_iso(), "updated_at": now_iso()}
        result = await db.gremial_tender_applications.update_one(scope, {"$set": update})
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Postulación no encontrada")
        return serialize(await db.gremial_tender_applications.find_one(scope, {"_id": 0}))

    @router.get("/courses", response_model=list[dict])
    async def list_courses(current_user: dict = Depends(require_gremial_user)):
        scope = build_gremial_query_scope(current_user)
        if is_gremial_member_user(current_user):
            scope.pop("id", None)
            scope.pop("member_id", None)
            scope["status"] = {"$in": ["published", "open"]}
        return serialize_list(await db.gremial_courses.find(scope, {"_id": 0}).sort("starts_at", 1).to_list(1000))

    @router.post("/courses", response_model=dict)
    async def create_course(payload: GremialCourseCreate, current_user: dict = Depends(require_gremial_admin)):
        delegation_id = get_gremial_delegation_id(current_user) if is_gremial_delegation_user(current_user) else payload.delegation_id
        doc = {"id": new_id("gcourse"), "tenant_id": get_gremial_tenant_id(current_user), **payload.model_dump(), "delegation_id": delegation_id, "created_at": now_iso(), "updated_at": now_iso()}
        await db.gremial_courses.insert_one(doc)
        return serialize(doc)

    @router.put("/courses/{course_id}", response_model=dict)
    async def update_course(course_id: str, payload: GremialCourseUpdate, current_user: dict = Depends(require_gremial_admin)):
        scope = build_gremial_query_scope(current_user)
        scope["id"] = course_id
        update = payload.model_dump(exclude_unset=True)
        if is_gremial_delegation_user(current_user):
            update.pop("delegation_id", None)
        if not update:
            raise HTTPException(status_code=400, detail="No hay cambios para guardar")
        update["updated_at"] = now_iso()
        result = await db.gremial_courses.update_one(scope, {"$set": update})
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Curso no encontrado")
        return serialize(await db.gremial_courses.find_one(scope, {"_id": 0}))

    @router.post("/courses/{course_id}/status", response_model=dict)
    async def update_course_status(course_id: str, payload: GremialReviewUpdate, current_user: dict = Depends(require_gremial_admin)):
        scope = build_gremial_query_scope(current_user)
        scope["id"] = course_id
        result = await db.gremial_courses.update_one(scope, {"$set": {"status": payload.status, "status_notes": payload.notes, "updated_at": now_iso()}})
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Curso no encontrado")
        return serialize(await db.gremial_courses.find_one(scope, {"_id": 0}))

    @router.post("/courses/{course_id}/register", response_model=dict)
    async def register_course(course_id: str, payload: GremialApplicationCreate | None = None, current_user: dict = Depends(require_gremial_user)):
        tenant_id = get_gremial_tenant_id(current_user)
        member_id = get_gremial_member_id(current_user)
        if not member_id:
            raise HTTPException(status_code=400, detail="Solo afiliados con portal pueden registrarse")
        course = await db.gremial_courses.find_one({"tenant_id": tenant_id, "id": course_id, "status": {"$in": ["published", "open"]}}, {"_id": 0})
        if not course:
            raise HTTPException(status_code=404, detail="Curso no disponible")
        doc = {"id": new_id("gcreg"), "tenant_id": tenant_id, "course_id": course_id, "member_id": member_id, "delegation_id": course.get("delegation_id"), "status": "registered", "notes": payload.notes if payload else None, "registered_at": now_iso(), "updated_at": now_iso()}
        await db.gremial_course_registrations.update_one({"tenant_id": tenant_id, "course_id": course_id, "member_id": member_id}, {"$set": doc}, upsert=True)
        return serialize(doc)

    @router.get("/course-registrations", response_model=list[dict])
    async def list_course_registrations(current_user: dict = Depends(require_gremial_user)):
        scope = build_gremial_query_scope(current_user, member_field="member_id")
        return serialize_list(await db.gremial_course_registrations.find(scope, {"_id": 0}).sort("registered_at", -1).to_list(500))

    @router.post("/course-registrations/{registration_id}/status", response_model=dict)
    async def update_course_registration_status(registration_id: str, payload: GremialReviewUpdate, current_user: dict = Depends(require_gremial_admin)):
        scope = build_gremial_query_scope(current_user, member_field="member_id")
        scope["id"] = registration_id
        update = {"status": payload.status, "review_notes": payload.notes, "reviewed_by_user_id": current_user.get("id"), "reviewed_at": now_iso(), "updated_at": now_iso()}
        result = await db.gremial_course_registrations.update_one(scope, {"$set": update})
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Registro no encontrado")
        return serialize(await db.gremial_course_registrations.find_one(scope, {"_id": 0}))

    @router.get("/events", response_model=list[dict])
    async def list_events(current_user: dict = Depends(require_gremial_user)):
        scope = build_gremial_query_scope(current_user)
        if is_gremial_member_user(current_user):
            scope.pop("id", None)
            scope.pop("member_id", None)
            scope["status"] = {"$in": ["published", "open"]}
        return serialize_list(await db.gremial_events.find(scope, {"_id": 0}).sort("starts_at", 1).to_list(1000))

    @router.post("/events", response_model=dict)
    async def create_event(payload: GremialEventCreate, current_user: dict = Depends(require_gremial_admin)):
        delegation_id = get_gremial_delegation_id(current_user) if is_gremial_delegation_user(current_user) else payload.delegation_id
        doc = {"id": new_id("gevent"), "tenant_id": get_gremial_tenant_id(current_user), **payload.model_dump(), "delegation_id": delegation_id, "created_at": now_iso(), "updated_at": now_iso()}
        await db.gremial_events.insert_one(doc)
        return serialize(doc)

    @router.put("/events/{event_id}", response_model=dict)
    async def update_event(event_id: str, payload: GremialEventUpdate, current_user: dict = Depends(require_gremial_admin)):
        scope = build_gremial_query_scope(current_user)
        scope["id"] = event_id
        update = payload.model_dump(exclude_unset=True)
        if is_gremial_delegation_user(current_user):
            update.pop("delegation_id", None)
        if not update:
            raise HTTPException(status_code=400, detail="No hay cambios para guardar")
        update["updated_at"] = now_iso()
        result = await db.gremial_events.update_one(scope, {"$set": update})
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Evento no encontrado")
        return serialize(await db.gremial_events.find_one(scope, {"_id": 0}))

    @router.post("/events/{event_id}/status", response_model=dict)
    async def update_event_status(event_id: str, payload: GremialReviewUpdate, current_user: dict = Depends(require_gremial_admin)):
        scope = build_gremial_query_scope(current_user)
        scope["id"] = event_id
        result = await db.gremial_events.update_one(scope, {"$set": {"status": payload.status, "status_notes": payload.notes, "updated_at": now_iso()}})
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Evento no encontrado")
        return serialize(await db.gremial_events.find_one(scope, {"_id": 0}))

    @router.post("/events/{event_id}/register", response_model=dict)
    async def register_event(event_id: str, payload: GremialApplicationCreate | None = None, current_user: dict = Depends(require_gremial_user)):
        tenant_id = get_gremial_tenant_id(current_user)
        member_id = get_gremial_member_id(current_user)
        if not member_id:
            raise HTTPException(status_code=400, detail="Solo afiliados con portal pueden registrarse")
        event = await db.gremial_events.find_one({"tenant_id": tenant_id, "id": event_id, "status": {"$in": ["published", "open"]}}, {"_id": 0})
        if not event:
            raise HTTPException(status_code=404, detail="Evento no disponible")
        doc = {"id": new_id("gereg"), "tenant_id": tenant_id, "event_id": event_id, "member_id": member_id, "delegation_id": event.get("delegation_id"), "status": "registered", "notes": payload.notes if payload else None, "registered_at": now_iso(), "updated_at": now_iso()}
        await db.gremial_event_registrations.update_one({"tenant_id": tenant_id, "event_id": event_id, "member_id": member_id}, {"$set": doc}, upsert=True)
        return serialize(doc)

    @router.get("/event-registrations", response_model=list[dict])
    async def list_event_registrations(current_user: dict = Depends(require_gremial_user)):
        scope = build_gremial_query_scope(current_user, member_field="member_id")
        return serialize_list(await db.gremial_event_registrations.find(scope, {"_id": 0}).sort("registered_at", -1).to_list(500))

    @router.post("/event-registrations/{registration_id}/status", response_model=dict)
    async def update_event_registration_status(registration_id: str, payload: GremialReviewUpdate, current_user: dict = Depends(require_gremial_admin)):
        scope = build_gremial_query_scope(current_user, member_field="member_id")
        scope["id"] = registration_id
        update = {"status": payload.status, "review_notes": payload.notes, "reviewed_by_user_id": current_user.get("id"), "reviewed_at": now_iso(), "updated_at": now_iso()}
        result = await db.gremial_event_registrations.update_one(scope, {"$set": update})
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Registro no encontrado")
        return serialize(await db.gremial_event_registrations.find_one(scope, {"_id": 0}))

    @router.get("/documents", response_model=list[dict])
    async def list_documents(current_user: dict = Depends(require_gremial_user)):
        tenant_id = get_gremial_tenant_id(current_user)
        query = {"tenant_id": tenant_id}
        if is_gremial_member_user(current_user):
            query["member_id"] = get_gremial_member_id(current_user)
        elif is_gremial_delegation_user(current_user):
            members = await db.gremial_members.find({"tenant_id": tenant_id, "delegation_id": get_gremial_delegation_id(current_user)}, {"_id": 0, "id": 1}).to_list(1000)
            query["member_id"] = {"$in": [item["id"] for item in members]}
        return serialize_list(await db.gremial_documents.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000))

    @router.post("/members/{member_id}/documents", response_model=dict)
    async def create_document(member_id: str, payload: GremialDocumentCreate, current_user: dict = Depends(require_gremial_user)):
        tenant_id = get_gremial_tenant_id(current_user)
        if is_gremial_member_user(current_user) and get_gremial_member_id(current_user) != member_id:
            raise HTTPException(status_code=403, detail="No puedes modificar otro expediente")
        doc = {"id": new_id("gdoc"), "tenant_id": tenant_id, "member_id": member_id, **payload.model_dump(), "created_at": now_iso(), "updated_at": now_iso()}
        await db.gremial_documents.insert_one(doc)
        await db.gremial_members.update_one({"tenant_id": tenant_id, "id": member_id}, {"$set": {"updated_at": now_iso()}})
        return serialize(doc)

    @router.post("/documents/{document_id}/approve", response_model=dict)
    async def approve_document(document_id: str, current_user: dict = Depends(require_gremial_admin)):
        tenant_id = get_gremial_tenant_id(current_user)
        document = await db.gremial_documents.find_one({"tenant_id": tenant_id, "id": document_id}, {"_id": 0})
        if not document:
            raise HTTPException(status_code=404, detail="Documento no encontrado")
        member = await db.gremial_members.find_one({"tenant_id": tenant_id, "id": document.get("member_id")}, {"_id": 0})
        if is_gremial_delegation_user(current_user) and member and member.get("delegation_id") != get_gremial_delegation_id(current_user):
            raise HTTPException(status_code=403, detail="No puedes revisar expedientes de otra delegación")
        await db.gremial_documents.update_one({"tenant_id": tenant_id, "id": document_id}, {"$set": {"status": "approved", "reviewed_by_user_id": current_user.get("id"), "reviewed_at": now_iso(), "updated_at": now_iso()}})
        if member:
            completion = await _profile_completion(member, db)
            await db.gremial_members.update_one({"tenant_id": tenant_id, "id": member["id"]}, {"$set": {"profile_completion": completion, "updated_at": now_iso()}})
        return serialize(await db.gremial_documents.find_one({"tenant_id": tenant_id, "id": document_id}, {"_id": 0}))

    @router.post("/documents/{document_id}/reject", response_model=dict)
    async def reject_document(document_id: str, payload: GremialReviewUpdate, current_user: dict = Depends(require_gremial_admin)):
        tenant_id = get_gremial_tenant_id(current_user)
        document = await db.gremial_documents.find_one({"tenant_id": tenant_id, "id": document_id}, {"_id": 0})
        if not document:
            raise HTTPException(status_code=404, detail="Documento no encontrado")
        member = await db.gremial_members.find_one({"tenant_id": tenant_id, "id": document.get("member_id")}, {"_id": 0})
        if is_gremial_delegation_user(current_user) and member and member.get("delegation_id") != get_gremial_delegation_id(current_user):
            raise HTTPException(status_code=403, detail="No puedes revisar expedientes de otra delegación")
        await db.gremial_documents.update_one(
            {"tenant_id": tenant_id, "id": document_id},
            {"$set": {"status": "rejected", "review_notes": payload.notes, "reviewed_by_user_id": current_user.get("id"), "reviewed_at": now_iso(), "updated_at": now_iso()}},
        )
        if member:
            completion = await _profile_completion(member, db)
            await db.gremial_members.update_one({"tenant_id": tenant_id, "id": member["id"]}, {"$set": {"profile_completion": completion, "updated_at": now_iso()}})
        return serialize(await db.gremial_documents.find_one({"tenant_id": tenant_id, "id": document_id}, {"_id": 0}))

    @router.get("/ai/recommendations", response_model=list[dict])
    async def list_recommendations(current_user: dict = Depends(require_gremial_user)):
        scope = build_gremial_query_scope(current_user, member_field="member_id")
        return serialize_list(await db.gremial_ai_recommendations.find(scope, {"_id": 0}).sort("created_at", -1).to_list(500))

    @router.post("/ai/recommendations/generate", response_model=dict)
    async def generate_recommendations(current_user: dict = Depends(require_gremial_admin)):
        tenant_id = get_gremial_tenant_id(current_user)
        scope = build_gremial_query_scope(current_user, member_field="member_id")
        recommendations = await _generate_recommendations(db, tenant_id, scope)
        if recommendations:
            for recommendation in recommendations:
                await db.gremial_ai_recommendations.update_one({"id": recommendation["id"]}, {"$set": recommendation}, upsert=True)
        return {"generated": len(recommendations), "recommendations": recommendations[:25]}

    @router.post("/ai/recommendations/{recommendation_id}/status", response_model=dict)
    async def update_recommendation_status(recommendation_id: str, payload: RecommendationUpdate, current_user: dict = Depends(require_gremial_admin)):
        tenant_id = get_gremial_tenant_id(current_user)
        await db.gremial_ai_recommendations.update_one({"tenant_id": tenant_id, "id": recommendation_id}, {"$set": {"status": payload.status, "updated_at": now_iso()}})
        return serialize(await db.gremial_ai_recommendations.find_one({"tenant_id": tenant_id, "id": recommendation_id}, {"_id": 0}))

    return router
