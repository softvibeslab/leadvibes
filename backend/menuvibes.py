from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field, field_validator

from auth import get_current_user


PIPELINE_STAGES = [
    {"key": "new", "label": "Nuevo", "color": "#64748b", "is_terminal": False, "requires_next_action": False},
    {"key": "researched", "label": "Investigado", "color": "#2563eb", "is_terminal": False, "requires_next_action": True},
    {"key": "contacted", "label": "Contactado", "color": "#0891b2", "is_terminal": False, "requires_next_action": True},
    {"key": "responded", "label": "Respondió", "color": "#0d9488", "is_terminal": False, "requires_next_action": True},
    {"key": "qualified", "label": "Calificado", "color": "#16a34a", "is_terminal": False, "requires_next_action": True},
    {"key": "demo", "label": "Demo", "color": "#7c3aed", "is_terminal": False, "requires_next_action": True},
    {"key": "proposal", "label": "Propuesta", "color": "#d97706", "is_terminal": False, "requires_next_action": True},
    {"key": "negotiation", "label": "Negociación", "color": "#ea580c", "is_terminal": False, "requires_next_action": True},
    {"key": "won", "label": "Ganado", "color": "#059669", "is_terminal": True, "requires_next_action": False},
    {"key": "lost", "label": "Perdido", "color": "#dc2626", "is_terminal": True, "requires_next_action": False},
    {"key": "nurture", "label": "Nutrición", "color": "#db2777", "is_terminal": False, "requires_next_action": True},
]
STAGE_KEYS = {stage["key"] for stage in PIPELINE_STAGES}
TERMINAL_STAGES = {"won", "lost"}
INTERACTION_TYPES = {"call", "whatsapp", "email", "meeting"}
MANAGER_ROLES = {"owner", "manager"}
ALLOWED_ROLES = MANAGER_ROLES | {"executive"}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat()


def serialize(document: Optional[dict]) -> Optional[dict]:
    if document is None:
        return None
    return {
        key: iso(value) if isinstance(value, datetime) else value
        for key, value in document.items()
        if key != "_id"
    }


def executive_scope(context: dict) -> dict:
    if context["role"] != "executive":
        return {}
    user_id = context["user_id"]
    return {"$or": [{"assigned_to": user_id}, {"assigned_to": None, "created_by": user_id}]}


def prospect_selector(context: dict, prospect_id: Optional[str] = None) -> dict:
    selector: dict[str, Any] = {"tenant_id": context["tenant_id"]}
    if prospect_id is not None:
        selector["id"] = prospect_id
    selector.update(executive_scope(context))
    return selector


def validate_follow_up(document: dict) -> None:
    stage = document.get("stage", "new")
    if stage not in STAGE_KEYS:
        raise HTTPException(status_code=422, detail="Etapa inválida")
    if stage not in TERMINAL_STAGES and stage != "new":
        if not document.get("assigned_to") or not document.get("next_action") or not document.get("next_action_at"):
            raise HTTPException(
                status_code=400,
                detail="La etapa activa requiere assigned_to, next_action y next_action_at",
            )


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ProspectCreate(StrictModel):
    business_name: str = Field(min_length=1, max_length=200)
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    zone: Optional[str] = None
    business_type: Optional[str] = None
    source: Optional[str] = None
    google_maps_url: Optional[str] = None
    website_url: Optional[str] = None
    instagram_url: Optional[str] = None
    menu_source_url: Optional[str] = None
    assigned_to: Optional[str] = None
    next_action: Optional[str] = None
    next_action_at: Optional[datetime] = None
    notes: Optional[str] = None
    tags: list[str] = Field(default_factory=list)

    @field_validator("business_name")
    @classmethod
    def non_blank_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("business_name no puede estar vacío")
        return value


class ProspectUpdate(StrictModel):
    business_name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    zone: Optional[str] = None
    business_type: Optional[str] = None
    source: Optional[str] = None
    google_maps_url: Optional[str] = None
    website_url: Optional[str] = None
    instagram_url: Optional[str] = None
    menu_source_url: Optional[str] = None
    assigned_to: Optional[str] = None
    next_action: Optional[str] = None
    next_action_at: Optional[datetime] = None
    notes: Optional[str] = None
    tags: Optional[list[str]] = None
    stage: Optional[Literal["new", "researched", "contacted", "responded", "qualified", "demo", "proposal", "negotiation", "won", "lost", "nurture"]] = None


class ActivityCreate(StrictModel):
    type: Literal["note", "call", "whatsapp", "email", "meeting"]
    summary: str = Field(min_length=1, max_length=4000)
    occurred_at: Optional[datetime] = None

    @field_validator("summary")
    @classmethod
    def non_blank_summary(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("summary no puede estar vacío")
        return value


class DemoStatus(str, Enum):
    requested = "requested"
    collecting = "collecting"
    building = "building"
    ready = "ready"
    presented = "presented"
    expired = "expired"


class DemoCreate(StrictModel):
    prospect_id: str = Field(min_length=1)
    slug: Optional[str] = None
    url: Optional[str] = None
    status: DemoStatus = DemoStatus.requested
    source_type: Optional[str] = None
    source_reference: Optional[str] = None
    last_verified_at: Optional[datetime] = None
    notes: Optional[str] = None


class DemoUpdate(StrictModel):
    prospect_id: Optional[str] = Field(default=None, min_length=1)
    slug: Optional[str] = None
    url: Optional[str] = None
    status: Optional[DemoStatus] = None
    source_type: Optional[str] = None
    source_reference: Optional[str] = None
    last_verified_at: Optional[datetime] = None
    notes: Optional[str] = None


async def require_menuvibes_context(db, current_user: dict) -> dict:
    tenant_id = current_user.get("active_tenant_id") or current_user.get("tenant_id")
    user_id = current_user.get("user_id")
    if not tenant_id or not user_id:
        raise HTTPException(status_code=403, detail="Workspace activo inválido")
    membership_query = {"tenant_id": tenant_id, "user_id": user_id, "status": "active"}
    if current_user.get("active_membership_id"):
        membership_query["id"] = current_user["active_membership_id"]
    membership = await db.tenant_memberships.find_one(membership_query, {"_id": 0})
    tenant = await db.tenants.find_one({"id": tenant_id, "is_active": True}, {"_id": 0})
    if not membership or not tenant or tenant.get("tenant_type") != "menuvibes":
        raise HTTPException(status_code=403, detail="Se requiere un workspace MenuVibes activo")
    role = membership.get("role")
    if role not in ALLOWED_ROLES:
        raise HTTPException(status_code=403, detail="Rol sin acceso a MenuVibes")
    return {"tenant_id": tenant_id, "user_id": user_id, "role": role, "membership": membership}


async def validate_assignment(db, context: dict, assigned_to: Optional[str]) -> None:
    if assigned_to is None:
        return
    if context["role"] == "executive" and assigned_to != context["user_id"]:
        raise HTTPException(status_code=403, detail="Un ejecutivo solo puede asignarse a sí mismo")
    membership = await db.tenant_memberships.find_one(
        {"tenant_id": context["tenant_id"], "user_id": assigned_to, "status": "active"},
        {"_id": 0, "id": 1},
    )
    if not membership:
        raise HTTPException(status_code=400, detail="El responsable no es miembro activo del workspace")


def create_menuvibes_router(db) -> APIRouter:
    router = APIRouter(prefix="/menuvibes", tags=["menuvibes"])

    async def context(current_user: dict = Depends(get_current_user)) -> dict:
        return await require_menuvibes_context(db, current_user)

    async def visible_prospect_or_404(ctx: dict, prospect_id: str) -> dict:
        prospect = await db.menuvibes_prospects.find_one(prospect_selector(ctx, prospect_id), {"_id": 0})
        if not prospect:
            raise HTTPException(status_code=404, detail="Prospecto no encontrado")
        return prospect

    @router.get("/pipeline/config")
    async def pipeline_config(_: dict = Depends(context)):
        return {"stages": PIPELINE_STAGES}

    @router.get("/prospects")
    async def list_prospects(
        stage: Optional[str] = Query(default=None),
        search: Optional[str] = Query(default=None, max_length=200),
        assigned_to: Optional[str] = Query(default=None),
        ctx: dict = Depends(context),
    ):
        if stage is not None and stage not in STAGE_KEYS:
            raise HTTPException(status_code=422, detail="Etapa inválida")
        query = prospect_selector(ctx)
        if stage:
            query["stage"] = stage
        if assigned_to:
            query["assigned_to"] = assigned_to
        if search:
            escaped = re.escape(search.strip())
            query["$and"] = [{"$or": [{"business_name": {"$regex": escaped, "$options": "i"}}, {"contact_name": {"$regex": escaped, "$options": "i"}}]}]
        rows = await db.menuvibes_prospects.find(query, {"_id": 0}).sort("updated_at", -1).to_list(1000)
        return [serialize(row) for row in rows]

    @router.post("/prospects", status_code=201)
    async def create_prospect(payload: ProspectCreate, ctx: dict = Depends(context)):
        data = payload.model_dump(exclude_none=True)
        await validate_assignment(db, ctx, data.get("assigned_to"))
        now = iso(utc_now())
        if "next_action_at" in data:
            data["next_action_at"] = iso(data["next_action_at"])
        document = {
            "id": str(uuid.uuid4()), "tenant_id": ctx["tenant_id"], "stage": "new",
            **data, "assigned_to": data.get("assigned_to"), "last_interaction_at": None,
            "created_by": ctx["user_id"], "created_at": now, "updated_at": now,
        }
        await db.menuvibes_prospects.insert_one(document)
        return serialize(document)

    @router.get("/prospects/{prospect_id}")
    async def get_prospect(prospect_id: str, ctx: dict = Depends(context)):
        return serialize(await visible_prospect_or_404(ctx, prospect_id))

    @router.patch("/prospects/{prospect_id}")
    async def update_prospect(prospect_id: str, payload: ProspectUpdate, ctx: dict = Depends(context)):
        current = await visible_prospect_or_404(ctx, prospect_id)
        changes = payload.model_dump(exclude_unset=True)
        if "business_name" in changes:
            if changes["business_name"] is None:
                raise HTTPException(status_code=422, detail="business_name no puede ser null")
            changes["business_name"] = changes["business_name"].strip()
            if not changes["business_name"]:
                raise HTTPException(status_code=422, detail="business_name no puede estar vacío")
        if "assigned_to" in changes:
            await validate_assignment(db, ctx, changes["assigned_to"])
        if "next_action_at" in changes and changes["next_action_at"] is not None:
            changes["next_action_at"] = iso(changes["next_action_at"])
        effective = {**current, **changes}
        validate_follow_up(effective)
        changes["updated_at"] = iso(utc_now())
        result = await db.menuvibes_prospects.update_one(
            prospect_selector(ctx, prospect_id), {"$set": changes}
        )
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Prospecto no encontrado")
        return serialize({**current, **changes})

    @router.get("/prospects/{prospect_id}/activities")
    async def list_activities(prospect_id: str, ctx: dict = Depends(context)):
        await visible_prospect_or_404(ctx, prospect_id)
        query = {"tenant_id": ctx["tenant_id"], "prospect_id": prospect_id}
        rows = await db.menuvibes_activities.find(query, {"_id": 0}).sort("occurred_at", -1).to_list(1000)
        return [serialize(row) for row in rows]

    @router.post("/prospects/{prospect_id}/activities", status_code=201)
    async def create_activity(prospect_id: str, payload: ActivityCreate, ctx: dict = Depends(context)):
        await visible_prospect_or_404(ctx, prospect_id)
        occurred_at = iso(payload.occurred_at or utc_now())
        now = iso(utc_now())
        document = {
            "id": str(uuid.uuid4()), "tenant_id": ctx["tenant_id"], "prospect_id": prospect_id,
            "type": payload.type, "summary": payload.summary, "occurred_at": occurred_at,
            "created_by": ctx["user_id"], "created_at": now,
        }
        await db.menuvibes_activities.insert_one(document)
        if payload.type in INTERACTION_TYPES:
            await db.menuvibes_prospects.update_one(
                prospect_selector(ctx, prospect_id),
                {"$max": {"last_interaction_at": occurred_at}, "$set": {"updated_at": now}},
            )
        return serialize(document)

    @router.get("/demos")
    async def list_demos(
        prospect_id: Optional[str] = Query(default=None),
        status: Optional[DemoStatus] = Query(default=None),
        ctx: dict = Depends(context),
    ):
        query: dict[str, Any] = {"tenant_id": ctx["tenant_id"]}
        if prospect_id:
            await visible_prospect_or_404(ctx, prospect_id)
            query["prospect_id"] = prospect_id
        elif ctx["role"] == "executive":
            visible = await db.menuvibes_prospects.find(prospect_selector(ctx), {"_id": 0, "id": 1}).to_list(10000)
            query["prospect_id"] = {"$in": [row["id"] for row in visible]}
        if status:
            query["status"] = status.value
        rows = await db.menuvibes_demos.find(query, {"_id": 0}).sort("updated_at", -1).to_list(1000)
        return [serialize(row) for row in rows]

    @router.post("/demos", status_code=201)
    async def create_demo(payload: DemoCreate, ctx: dict = Depends(context)):
        await visible_prospect_or_404(ctx, payload.prospect_id)
        data = payload.model_dump(exclude_none=True, mode="json")
        now = iso(utc_now())
        document = {
            "id": str(uuid.uuid4()), "tenant_id": ctx["tenant_id"], **data,
            "created_by": ctx["user_id"], "created_at": now, "updated_at": now,
        }
        await db.menuvibes_demos.insert_one(document)
        return serialize(document)

    @router.patch("/demos/{demo_id}")
    async def update_demo(demo_id: str, payload: DemoUpdate, ctx: dict = Depends(context)):
        query = {"tenant_id": ctx["tenant_id"], "id": demo_id}
        current = await db.menuvibes_demos.find_one(query, {"_id": 0})
        if not current:
            raise HTTPException(status_code=404, detail="Demo no encontrado")
        await visible_prospect_or_404(ctx, current["prospect_id"])
        changes = payload.model_dump(exclude_unset=True, mode="json")
        if "prospect_id" in changes and not changes["prospect_id"]:
            raise HTTPException(status_code=422, detail="prospect_id no puede ser null")
        if "status" in changes and changes["status"] is None:
            raise HTTPException(status_code=422, detail="status no puede ser null")
        if changes.get("prospect_id"):
            await visible_prospect_or_404(ctx, changes["prospect_id"])
        changes["updated_at"] = iso(utc_now())
        result = await db.menuvibes_demos.update_one(query, {"$set": changes})
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Demo no encontrado")
        return serialize({**current, **changes})

    @router.get("/dashboard")
    async def dashboard(ctx: dict = Depends(context)):
        prospects_query = prospect_selector(ctx)
        prospects = await db.menuvibes_prospects.find(prospects_query, {"_id": 0}).sort("updated_at", -1).to_list(10000)
        prospect_ids = [row["id"] for row in prospects]
        demos_query = {"tenant_id": ctx["tenant_id"], "prospect_id": {"$in": prospect_ids}}
        demos = await db.menuvibes_demos.find(demos_query, {"_id": 0}).to_list(10000)
        stage_counts = {key: 0 for key in STAGE_KEYS}
        demo_counts = {status.value: 0 for status in DemoStatus}
        missing_follow_up = 0
        overdue_follow_up = 0
        now = iso(utc_now())
        for prospect in prospects:
            stage = prospect.get("stage", "new")
            stage_counts[stage] = stage_counts.get(stage, 0) + 1
            if stage not in TERMINAL_STAGES:
                if not prospect.get("next_action") or not prospect.get("next_action_at"):
                    missing_follow_up += 1
                elif prospect["next_action_at"] < now:
                    overdue_follow_up += 1
        for demo in demos:
            key = demo.get("status", "requested")
            demo_counts[key] = demo_counts.get(key, 0) + 1
        return {
            "total_prospects": len(prospects), "stage_counts": stage_counts,
            "missing_follow_up": missing_follow_up, "overdue_follow_up": overdue_follow_up,
            "total_demos": len(demos), "demo_counts": demo_counts,
            "recent_prospects": [serialize(row) for row in prospects[:10]],
        }

    return router
