"""
Migración inicial a tenants explícitos + memberships.

Objetivo:
- Crear tenant personal para cada usuario si no existe
- Crear colección tenants explícita
- Crear memberships para el tenant actual legacy
- No mover leads ni datos operativos; solo preparar la nueva capa de acceso
"""

from __future__ import annotations

import asyncio
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient


ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / ".env")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def slugify(value: str) -> str:
    text = (value or "").strip().lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-{2,}", "-", text).strip("-")
    return text or "workspace"


def build_personal_tenant_id(user: dict[str, Any]) -> str:
    existing = user.get("personal_tenant_id")
    if existing:
        return existing
    return f"personal-{user['id'][:8]}"


def infer_membership_role(user: dict[str, Any]) -> str:
    role = (user.get("role") or "broker").lower()
    if role in {"owner", "admin", "manager", "broker"}:
        return role
    return "broker"


async def ensure_tenant(db, tenant_id: str, *, name: str, tenant_type: str, owner_user_id: str) -> None:
    slug = slugify(name)
    existing = await db.tenants.find_one({"id": tenant_id}, {"_id": 0, "id": 1})
    if existing:
        await db.tenants.update_one(
            {"id": tenant_id},
            {"$set": {
                "name": name,
                "slug": slug,
                "tenant_type": tenant_type,
                "owner_user_id": owner_user_id,
                "is_active": True,
                "updated_at": now_iso(),
            }}
        )
        return

    await db.tenants.insert_one({
        "id": tenant_id,
        "name": name,
        "slug": slug,
        "tenant_type": tenant_type,
        "owner_user_id": owner_user_id,
        "is_active": True,
        "branding": {},
        "settings": {},
        "created_at": now_iso(),
        "updated_at": now_iso(),
    })


async def ensure_membership(
    db,
    *,
    tenant_id: str,
    user_id: str,
    role: str,
    is_default: bool,
    created_by_user_id: str,
) -> None:
    existing = await db.tenant_memberships.find_one(
        {"tenant_id": tenant_id, "user_id": user_id},
        {"_id": 0, "id": 1, "status": 1},
    )

    payload = {
        "tenant_id": tenant_id,
        "user_id": user_id,
        "role": role,
        "status": "active",
        "linked_via": "legacy_migration",
        "is_default": is_default,
        "accepted_at": now_iso(),
        "created_by_user_id": created_by_user_id,
        "updated_at": now_iso(),
    }

    if existing:
        await db.tenant_memberships.update_one(
            {"tenant_id": tenant_id, "user_id": user_id},
            {"$set": payload}
        )
        return

    await db.tenant_memberships.insert_one({
        "id": f"tm-{tenant_id}-{user_id}",
        **payload,
        "joined_at": now_iso(),
        "created_at": now_iso(),
        "revoked_at": None,
    })


async def migrate_memberships():
    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ["DB_NAME"]

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    users = await db.users.find({}, {"_id": 0}).to_list(None)
    print(f"Procesando {len(users)} usuarios...")

    migrated = 0
    for user in users:
        user_id = user["id"]
        user_name = user.get("name") or user.get("email") or user_id
        current_tenant_id = user.get("tenant_id") or f"tenant-{user_id[:8]}"
        personal_tenant_id = build_personal_tenant_id(user)
        account_type = user.get("account_type", "individual")
        role = infer_membership_role(user)

        current_tenant_type = "agency" if account_type == "agency" else "individual"
        current_tenant_name = (
            f"{user_name} Workspace"
            if current_tenant_type == "individual"
            else f"{user_name} Inmobiliaria"
        )
        personal_tenant_name = f"{user_name} Personal"

        await ensure_tenant(
            db,
            current_tenant_id,
            name=current_tenant_name,
            tenant_type=current_tenant_type,
            owner_user_id=user_id,
        )

        if personal_tenant_id != current_tenant_id:
            await ensure_tenant(
                db,
                personal_tenant_id,
                name=personal_tenant_name,
                tenant_type="individual",
                owner_user_id=user_id,
            )

        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "tenant_id": current_tenant_id,
                "personal_tenant_id": personal_tenant_id,
            }}
        )

        if personal_tenant_id == current_tenant_id:
            await ensure_membership(
                db,
                tenant_id=current_tenant_id,
                user_id=user_id,
                role="owner" if role == "broker" else role,
                is_default=True,
                created_by_user_id=user_id,
            )
        else:
            await ensure_membership(
                db,
                tenant_id=personal_tenant_id,
                user_id=user_id,
                role="owner",
                is_default=account_type != "agency",
                created_by_user_id=user_id,
            )
            await ensure_membership(
                db,
                tenant_id=current_tenant_id,
                user_id=user_id,
                role="owner" if account_type == "agency" and role in {"admin", "manager", "broker"} else role,
                is_default=account_type == "agency",
                created_by_user_id=user_id,
            )

        migrated += 1
        print(f"  OK {user_name} -> personal={personal_tenant_id} current={current_tenant_id}")

    print(f"Migración completada. Usuarios procesados: {migrated}")
    client.close()


if __name__ == "__main__":
    asyncio.run(migrate_memberships())
