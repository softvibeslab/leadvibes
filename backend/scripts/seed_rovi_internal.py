#!/usr/bin/env python3
import asyncio
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

sys.path.append(str(Path(__file__).resolve().parents[1]))

from auth import get_password_hash
from rovi_internal import ROVI_INTERNAL_TENANT_ID, ensure_rovi_internal_seed_data


load_dotenv()


DEMO_PASSWORD = "demo123"


ROVI_INTERNAL_USERS = [
    {
        "id": "rovi-admin-demo",
        "email": "admin@rovicrm.com",
        "name": "ROVI Admin General",
        "role": "rovi_admin",
        "department": "management",
    },
    {
        "id": "rovi-sales-ana",
        "email": "sales@rovicrm.com",
        "name": "Ana Torres Sales",
        "role": "rovi_sales",
        "department": "sales",
    },
    {
        "id": "rovi-marketing-luis",
        "email": "marketing@rovicrm.com",
        "name": "Luis Herrera Marketing",
        "role": "rovi_marketing",
        "department": "marketing",
    },
    {
        "id": "rovi-cs-demo",
        "email": "cs@rovicrm.com",
        "name": "Majo Customer Success",
        "role": "rovi_customer_success",
        "department": "customer_success",
    },
    {
        "id": "rovi-ops-demo",
        "email": "ops@rovicrm.com",
        "name": "ROVI Operaciones",
        "role": "rovi_ops",
        "department": "operations",
    },
]


async def main() -> None:
    mongo_url = os.environ.get("MONGO_URL")
    if not mongo_url:
        raise RuntimeError("MONGO_URL no esta configurado")

    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get("DB_NAME", "rovi_crm")]
    now = datetime.now(timezone.utc).isoformat()

    await db.tenants.update_one(
        {"id": ROVI_INTERNAL_TENANT_ID},
        {
            "$set": {
                "id": ROVI_INTERNAL_TENANT_ID,
                "name": "ROVI Internal",
                "slug": "rovi-internal",
                "tenant_type": "rovi_internal",
                "owner_user_id": "rovi-admin-demo",
                "is_active": True,
                "branding": {"primary_color": "#0A4DAF"},
                "settings": {"workspace": "internal_saas_sales"},
                "updated_at": now,
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )

    for index, user in enumerate(ROVI_INTERNAL_USERS):
        user_doc = {
            **user,
            "password_hash": get_password_hash(DEMO_PASSWORD),
            "tenant_id": ROVI_INTERNAL_TENANT_ID,
            "personal_tenant_id": ROVI_INTERNAL_TENANT_ID,
            "account_type": "rovi_internal",
            "is_active": True,
            "onboarding_completed": True,
            "updated_at": now,
        }
        await db.users.update_one(
            {"email": user["email"]},
            {"$set": user_doc, "$setOnInsert": {"created_at": now}},
            upsert=True,
        )
        await db.tenant_memberships.update_one(
            {"tenant_id": ROVI_INTERNAL_TENANT_ID, "user_id": user["id"]},
            {
                "$set": {
                    "tenant_id": ROVI_INTERNAL_TENANT_ID,
                    "user_id": user["id"],
                    "role": user["role"],
                    "status": "active",
                    "linked_via": "manual",
                    "is_default": True,
                    "accepted_at": now,
                    "created_by_user_id": "rovi-admin-demo",
                    "updated_at": now,
                },
                "$setOnInsert": {
                    "id": f"tm-rovi-internal-{user['id']}",
                    "joined_at": now,
                    "created_at": now,
                    "revoked_at": None,
                },
            },
            upsert=True,
        )

    await ensure_rovi_internal_seed_data(db)

    print("ROVI Internal workspace seeded")
    print(f"Password demo: {DEMO_PASSWORD}")
    for user in ROVI_INTERNAL_USERS:
        print(f"- {user['email']} ({user['role']})")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
