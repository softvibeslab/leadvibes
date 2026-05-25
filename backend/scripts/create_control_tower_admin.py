#!/usr/bin/env python3
"""Create/update the private ROVI AI Control Tower admin user.

Usage:
  CONTROL_TOWER_ADMIN_EMAIL=rgarciavital@gmail.com \
  CONTROL_TOWER_ADMIN_PASSWORD='strong-password' \
  python backend/scripts/create_control_tower_admin.py
"""
from __future__ import annotations

import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

sys.path.append(str(Path(__file__).resolve().parents[1]))

from auth import get_password_hash  # noqa: E402
from rovi_internal import ROVI_INTERNAL_TENANT_ID, ensure_rovi_internal_seed_data  # noqa: E402


load_dotenv(Path(__file__).resolve().parents[2] / ".env")

ADMIN_EMAIL = os.environ.get("CONTROL_TOWER_ADMIN_EMAIL", "rgarciavital@gmail.com").strip().lower()
ADMIN_NAME = os.environ.get("CONTROL_TOWER_ADMIN_NAME", "Roger GV").strip() or "Roger GV"
ADMIN_PASSWORD = os.environ.get("CONTROL_TOWER_ADMIN_PASSWORD")
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "rovi_crm")

if not ADMIN_PASSWORD:
    raise SystemExit("Missing CONTROL_TOWER_ADMIN_PASSWORD env var.")
if not MONGO_URL:
    raise SystemExit("Missing MONGO_URL env var.")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def main() -> None:
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    now = now_iso()

    existing = await db.users.find_one({"email": ADMIN_EMAIL}, {"_id": 0})
    user_id = existing.get("id") if existing else f"rovi-owner-{uuid.uuid4().hex[:10]}"

    await db.tenants.update_one(
        {"id": ROVI_INTERNAL_TENANT_ID},
        {
            "$set": {
                "id": ROVI_INTERNAL_TENANT_ID,
                "name": "ROVI Internal",
                "slug": "rovi-internal",
                "tenant_type": "rovi_internal",
                "owner_user_id": user_id,
                "is_active": True,
                "updated_at": now,
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )

    await db.users.update_one(
        {"email": ADMIN_EMAIL},
        {
            "$set": {
                "id": user_id,
                "email": ADMIN_EMAIL,
                "name": ADMIN_NAME,
                "role": "rovi_admin",
                "password_hash": get_password_hash(ADMIN_PASSWORD),
                "tenant_id": ROVI_INTERNAL_TENANT_ID,
                "personal_tenant_id": ROVI_INTERNAL_TENANT_ID,
                "account_type": "rovi_internal",
                "is_active": True,
                "onboarding_completed": True,
                "updated_at": now,
            },
            "$setOnInsert": {
                "avatar_url": None,
                "phone": None,
                "created_at": now,
            },
        },
        upsert=True,
    )

    await db.tenant_memberships.update_one(
        {"tenant_id": ROVI_INTERNAL_TENANT_ID, "user_id": user_id},
        {
            "$set": {
                "tenant_id": ROVI_INTERNAL_TENANT_ID,
                "user_id": user_id,
                "role": "rovi_admin",
                "status": "active",
                "linked_via": "manual",
                "is_default": True,
                "accepted_at": now,
                "revoked_at": None,
                "updated_at": now,
            },
            "$setOnInsert": {
                "id": f"tm-rovi-control-owner-{user_id}",
                "joined_at": now,
                "created_at": now,
                "created_by_user_id": user_id,
            },
        },
        upsert=True,
    )

    await ensure_rovi_internal_seed_data(db)
    print(f"CONTROL_TOWER_ADMIN_READY email={ADMIN_EMAIL} user_id={user_id}")


if __name__ == "__main__":
    asyncio.run(main())
