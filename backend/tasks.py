from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from auth import get_current_user
from models import (
    Task,
    TaskComment,
    TaskCommentCreate,
    TaskCreate,
    TaskPriority,
    TaskStatus,
    TaskStatusUpdate,
    TaskUpdate,
)


MANAGER_ROLES = {"owner", "admin", "manager"}
SALES_CRM_ROLES = {"owner", "admin", "manager", "broker"}
BLOCKED_ACCOUNT_TYPES = {"property_management", "copim", "copim_member", "rovi_internal"}


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def serialize_doc(doc):
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        clean = {k: serialize_doc(v) for k, v in doc.items() if k != "_id"}
        return clean
    if isinstance(doc, datetime):
        return doc.isoformat()
    return doc


def normalize_tags(tags: list[str] | None) -> list[str]:
    seen = set()
    normalized: list[str] = []
    for tag in tags or []:
        clean = str(tag or "").strip().lower()
        if clean and clean not in seen:
            seen.add(clean)
            normalized.append(clean)
    return normalized


def is_manager_user(current_user: dict) -> bool:
    role = current_user.get("active_role") or current_user.get("role")
    return role in MANAGER_ROLES


async def require_sales_crm_user(current_user: dict = Depends(get_current_user)) -> dict:
    account_type = current_user.get("account_type")
    role = current_user.get("active_role") or current_user.get("role")
    if account_type in BLOCKED_ACCOUNT_TYPES or role not in SALES_CRM_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Modulo disponible solo para broker e inmobiliaria",
        )
    return current_user


def visible_task_query(current_user: dict) -> dict:
    tenant_id = current_user["tenant_id"]
    if is_manager_user(current_user):
        return {"tenant_id": tenant_id, "deleted": {"$ne": True}}
    user_id = current_user["user_id"]
    return {
        "tenant_id": tenant_id,
        "deleted": {"$ne": True},
        "$or": [
            {"assigned_to": user_id},
            {"created_by": user_id},
            {"assigned_to": {"$in": [None, ""]}},
        ],
    }


async def fetch_task_or_404(db: AsyncIOMotorDatabase, task_id: str, current_user: dict) -> dict:
    task = await db.tasks.find_one({**visible_task_query(current_user), "id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada")
    return task


async def validate_assignee(db: AsyncIOMotorDatabase, tenant_id: str, user_id: Optional[str]) -> None:
    if not user_id:
        return
    membership = await db.tenant_memberships.find_one(
        {"tenant_id": tenant_id, "user_id": user_id, "status": "active"},
        {"_id": 0, "id": 1},
    )
    if membership:
        return
    user = await db.users.find_one({"tenant_id": tenant_id, "id": user_id, "is_active": True}, {"_id": 0, "id": 1})
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Responsable no pertenece al workspace")


async def validate_lead(db: AsyncIOMotorDatabase, tenant_id: str, lead_id: Optional[str]) -> None:
    if not lead_id:
        return
    lead = await db.leads.find_one(
        {"tenant_id": tenant_id, "id": lead_id, "deleted": {"$ne": True}},
        {"_id": 0, "id": 1},
    )
    if not lead:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Lead no encontrado en este workspace")


async def enrich_tasks(db: AsyncIOMotorDatabase, tenant_id: str, tasks: list[dict]) -> list[dict]:
    if not tasks:
        return []

    user_ids = {
        task.get("assigned_to")
        for task in tasks
        if task.get("assigned_to")
    } | {
        task.get("created_by")
        for task in tasks
        if task.get("created_by")
    }
    lead_ids = {task.get("lead_id") for task in tasks if task.get("lead_id")}

    users = await db.users.find(
        {"id": {"$in": list(user_ids)}},
        {"_id": 0, "id": 1, "name": 1, "email": 1, "avatar_url": 1, "role": 1},
    ).to_list(500)
    leads = await db.leads.find(
        {"tenant_id": tenant_id, "id": {"$in": list(lead_ids)}},
        {"_id": 0, "id": 1, "name": 1, "phone": 1, "status": 1, "priority": 1},
    ).to_list(500)

    user_map = {user["id"]: user for user in users}
    lead_map = {lead["id"]: lead for lead in leads}

    enriched = []
    for task in tasks:
        item = serialize_doc(task)
        item["assigned_user"] = serialize_doc(user_map.get(task.get("assigned_to")))
        item["created_by_user"] = serialize_doc(user_map.get(task.get("created_by")))
        item["lead"] = serialize_doc(lead_map.get(task.get("lead_id")))
        enriched.append(item)
    return enriched


async def build_task_summary(db: AsyncIOMotorDatabase, current_user: dict) -> dict:
    query = visible_task_query(current_user)
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(1000)
    today = now_utc().date()
    open_tasks = [task for task in tasks if task.get("status") not in {TaskStatus.COMPLETADA.value, TaskStatus.CANCELADA.value}]
    overdue = [
        task for task in open_tasks
        if task.get("due_date") and parse_datetime(task["due_date"]).date() < today
    ]
    due_today = [
        task for task in open_tasks
        if task.get("due_date") and parse_datetime(task["due_date"]).date() == today
    ]
    urgent = [task for task in open_tasks if task.get("priority") == TaskPriority.URGENTE.value]

    by_status = {status_item.value: 0 for status_item in TaskStatus}
    for task in tasks:
        by_status[task.get("status", TaskStatus.PENDIENTE.value)] = by_status.get(task.get("status"), 0) + 1

    return {
        "total": len(tasks),
        "open": len(open_tasks),
        "overdue": len(overdue),
        "due_today": len(due_today),
        "urgent": len(urgent),
        "by_status": by_status,
    }


def parse_datetime(value) -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str):
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    return now_utc()


def create_tasks_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/tasks", tags=["tasks"])

    @router.get("", response_model=dict)
    async def list_tasks(
        current_user: dict = Depends(require_sales_crm_user),
        status_filter: Optional[list[TaskStatus]] = Query(None, alias="status"),
        priority: Optional[list[TaskPriority]] = Query(None),
        assigned_to: Optional[str] = None,
        lead_id: Optional[str] = None,
        due: Optional[str] = None,
        search: Optional[str] = None,
    ):
        query = visible_task_query(current_user)

        if status_filter:
            query["status"] = {"$in": [item.value for item in status_filter]}
        if priority:
            query["priority"] = {"$in": [item.value for item in priority]}
        if assigned_to and assigned_to != "all":
            query["assigned_to"] = assigned_to
        if lead_id:
            query["lead_id"] = lead_id
        if search:
            query["$and"] = query.get("$and", []) + [{
                "$or": [
                    {"title": {"$regex": search, "$options": "i"}},
                    {"description": {"$regex": search, "$options": "i"}},
                    {"tags": {"$regex": search, "$options": "i"}},
                ]
            }]

        if due:
            today = now_utc().replace(hour=0, minute=0, second=0, microsecond=0)
            tomorrow = today + timedelta(days=1)
            if due == "today":
                query["due_date"] = {"$gte": today, "$lt": tomorrow}
            elif due == "overdue":
                query["status"] = {"$nin": [TaskStatus.COMPLETADA.value, TaskStatus.CANCELADA.value]}
                query["due_date"] = {"$lt": today}
            elif due == "upcoming":
                query["due_date"] = {"$gte": tomorrow}

        tasks = await db.tasks.find(query, {"_id": 0}).sort("due_date", 1).sort("created_at", -1).to_list(500)
        return {
            "tasks": await enrich_tasks(db, current_user["tenant_id"], tasks),
            "summary": await build_task_summary(db, current_user),
        }

    @router.get("/summary", response_model=dict)
    async def get_summary(current_user: dict = Depends(require_sales_crm_user)):
        return await build_task_summary(db, current_user)

    @router.get("/{task_id}", response_model=dict)
    async def get_task(task_id: str, current_user: dict = Depends(require_sales_crm_user)):
        task = await fetch_task_or_404(db, task_id, current_user)
        return (await enrich_tasks(db, current_user["tenant_id"], [task]))[0]

    @router.post("", response_model=dict)
    async def create_task(payload: TaskCreate, current_user: dict = Depends(require_sales_crm_user)):
        tenant_id = current_user["tenant_id"]
        assigned_to = payload.assigned_to or current_user["user_id"]
        await validate_assignee(db, tenant_id, assigned_to)
        await validate_lead(db, tenant_id, payload.lead_id)

        task_data = payload.model_dump()
        task_data["assigned_to"] = assigned_to
        task_data["tags"] = normalize_tags(payload.tags)
        task = Task(
            **task_data,
            tenant_id=tenant_id,
            created_by=current_user["user_id"],
        )
        doc = task.model_dump()
        await db.tasks.insert_one(doc)
        return {"message": "Tarea creada", "task": (await enrich_tasks(db, tenant_id, [doc]))[0]}

    @router.put("/{task_id}", response_model=dict)
    async def update_task(task_id: str, payload: TaskUpdate, current_user: dict = Depends(require_sales_crm_user)):
        existing = await fetch_task_or_404(db, task_id, current_user)
        update_data = {key: value for key, value in payload.model_dump().items() if value is not None}
        if not update_data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No hay cambios para guardar")

        if "assigned_to" in update_data:
            await validate_assignee(db, current_user["tenant_id"], update_data["assigned_to"])
        if "lead_id" in update_data:
            await validate_lead(db, current_user["tenant_id"], update_data["lead_id"])
        if "tags" in update_data:
            update_data["tags"] = normalize_tags(update_data["tags"])
        if update_data.get("status") == TaskStatus.COMPLETADA.value and existing.get("status") != TaskStatus.COMPLETADA.value:
            update_data["completed_at"] = now_utc()
        elif update_data.get("status") and update_data.get("status") != TaskStatus.COMPLETADA.value:
            update_data["completed_at"] = None

        update_data["updated_at"] = now_utc()
        await db.tasks.update_one(
            {"tenant_id": current_user["tenant_id"], "id": task_id},
            {"$set": update_data},
        )
        updated = await fetch_task_or_404(db, task_id, current_user)
        return {"message": "Tarea actualizada", "task": (await enrich_tasks(db, current_user["tenant_id"], [updated]))[0]}

    @router.put("/{task_id}/status", response_model=dict)
    async def update_task_status(task_id: str, payload: TaskStatusUpdate, current_user: dict = Depends(require_sales_crm_user)):
        update_data = {"status": payload.status.value, "updated_at": now_utc()}
        update_data["completed_at"] = now_utc() if payload.status == TaskStatus.COMPLETADA else None
        await fetch_task_or_404(db, task_id, current_user)
        await db.tasks.update_one(
            {"tenant_id": current_user["tenant_id"], "id": task_id},
            {"$set": update_data},
        )
        updated = await fetch_task_or_404(db, task_id, current_user)
        return {"message": "Estado actualizado", "task": (await enrich_tasks(db, current_user["tenant_id"], [updated]))[0]}

    @router.post("/{task_id}/comments", response_model=dict)
    async def add_comment(task_id: str, payload: TaskCommentCreate, current_user: dict = Depends(require_sales_crm_user)):
        if not payload.body.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El comentario no puede estar vacío")
        await fetch_task_or_404(db, task_id, current_user)
        comment = TaskComment(
            body=payload.body.strip(),
            user_id=current_user["user_id"],
            user_name=current_user.get("name") or current_user.get("email") or "Usuario",
        ).model_dump()
        await db.tasks.update_one(
            {"tenant_id": current_user["tenant_id"], "id": task_id},
            {"$push": {"comments": comment}, "$set": {"updated_at": now_utc()}},
        )
        updated = await fetch_task_or_404(db, task_id, current_user)
        return {"message": "Comentario agregado", "task": (await enrich_tasks(db, current_user["tenant_id"], [updated]))[0]}

    @router.delete("/{task_id}", response_model=dict)
    async def delete_task(task_id: str, current_user: dict = Depends(require_sales_crm_user)):
        await fetch_task_or_404(db, task_id, current_user)
        await db.tasks.update_one(
            {"tenant_id": current_user["tenant_id"], "id": task_id},
            {"$set": {"deleted": True, "updated_at": now_utc()}},
        )
        return {"message": "Tarea eliminada"}

    @router.post("/seed-demo", response_model=dict)
    async def seed_demo_tasks(current_user: dict = Depends(require_sales_crm_user)):
        tenant_id = current_user["tenant_id"]
        existing = await db.tasks.count_documents({"tenant_id": tenant_id, "source": "preview_demo", "deleted": {"$ne": True}})
        if existing:
            return {"message": "Las tareas demo ya existen", "created": 0}

        leads = await db.leads.find({"tenant_id": tenant_id, "deleted": {"$ne": True}}, {"_id": 0, "id": 1, "name": 1}).limit(5).to_list(5)
        brokers = await db.tenant_memberships.find(
            {"tenant_id": tenant_id, "status": "active"},
            {"_id": 0, "user_id": 1, "role": 1},
        ).to_list(50)
        assignees = [item["user_id"] for item in brokers] or [current_user["user_id"]]
        today = now_utc()
        templates = [
            ("Llamar al lead caliente", "Confirmar presupuesto, zona y fecha de visita.", TaskPriority.URGENTE, 0),
            ("Enviar propuesta comparativa", "Preparar 3 opciones con ROI y amenidades.", TaskPriority.ALTA, 1),
            ("Agendar visita", "Coordinar tour con disponibilidad del broker.", TaskPriority.ALTA, 2),
            ("Actualizar CRM", "Completar notas, fuente y siguiente acción.", TaskPriority.MEDIA, 3),
            ("Seguimiento post-visita", "Enviar resumen y resolver objeciones.", TaskPriority.MEDIA, 5),
        ]
        docs = []
        for index, (title, description, priority, days) in enumerate(templates):
            lead = leads[index % len(leads)] if leads else {}
            task = Task(
                title=title,
                description=description,
                status=TaskStatus.PENDIENTE if index < 3 else TaskStatus.EN_PROGRESO,
                priority=priority,
                due_date=today + timedelta(days=days),
                assigned_to=assignees[index % len(assignees)],
                lead_id=lead.get("id"),
                tags=["demo", "seguimiento"],
                checklist=[
                    {"title": "Revisar contexto del lead", "completed": index > 1},
                    {"title": "Registrar resultado", "completed": False},
                ],
                tenant_id=tenant_id,
                created_by=current_user["user_id"],
            ).model_dump()
            task["source"] = "preview_demo"
            docs.append(task)

        if docs:
            await db.tasks.insert_many(docs)
        return {"message": "Tareas demo creadas", "created": len(docs)}

    return router
