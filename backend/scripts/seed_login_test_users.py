#!/usr/bin/env python3
"""Seed login test users for ROVI production/demo environments.

Run inside the backend container or any shell with MONGO_URL/DB_NAME set:
  LOGIN_TEST_USERS_PASSWORD='RoviPreview2026!' python scripts/seed_login_test_users.py
"""

from __future__ import annotations

import asyncio
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
sys.path.append(str(BACKEND_ROOT))

from auth import get_password_hash  # noqa: E402
from rovi_internal import ROVI_INTERNAL_TENANT_ID, ensure_rovi_internal_seed_data  # noqa: E402


load_dotenv(REPO_ROOT / ".env")
load_dotenv(BACKEND_ROOT / ".env")


PASSWORD = os.environ.get("LOGIN_TEST_USERS_PASSWORD", "RoviPreview2026!")
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "rovi_crm")

NATIONAL_COPIM_TENANT_ID = "tenant-preview-copim"
LOCAL_COPIM_TENANT_ID = "tenant-preview-copim-local"


TEST_USERS = [
    {
        "id": "preview-broker-user",
        "email": "preview.broker@rovicrm.com",
        "name": "Preview Broker Individual",
        "role": "broker",
        "account_type": "individual",
        "tenant_id": "tenant-preview-broker",
        "tenant_type": "individual",
        "workspace_name": "Preview Broker Personal",
    },
    {
        "id": "preview-agency-admin-user",
        "email": "preview.agency@rovicrm.com",
        "name": "Preview Admin Inmobiliaria",
        "role": "admin",
        "account_type": "agency",
        "tenant_id": "tenant-preview-agency",
        "tenant_type": "agency",
        "workspace_name": "Preview Inmobiliaria",
    },
    {
        "id": "preview-rentals-manager-user",
        "email": "preview.rentals@rovicrm.com",
        "name": "Preview Property Manager",
        "role": "property_manager",
        "account_type": "property_management",
        "tenant_id": "tenant-preview-rentals",
        "tenant_type": "property_management",
        "workspace_name": "Preview Rentas Operacion",
    },
    {
        "id": "preview-valuator-user",
        "email": "preview.valuator@rovicrm.com",
        "name": "Preview Valuador Certificado",
        "role": "certified_valuator",
        "account_type": "valuation",
        "tenant_id": "tenant-preview-valuation",
        "tenant_type": "valuation",
        "workspace_name": "Preview Valuacion Normativa",
    },
    {
        "id": "preview-copim-admin-user",
        "email": "preview.copim.admin@rovicrm.com",
        "name": "Preview COPIM Nacional",
        "role": "copim_admin",
        "account_type": "copim",
        "tenant_id": NATIONAL_COPIM_TENANT_ID,
        "tenant_type": "copim",
        "workspace_name": "Preview COPIM Nacional",
    },
    {
        "id": "preview-copim-operator-user",
        "email": "preview.copim.operator@rovicrm.com",
        "name": "Preview COPIM Operador Local",
        "role": "copim_operator",
        "account_type": "copim",
        "tenant_id": LOCAL_COPIM_TENANT_ID,
        "tenant_type": "association",
        "workspace_name": "Preview Asociacion Local",
        "linked_copim_association_id": "preview-association-riviera",
    },
    {
        "id": "preview-copim-member-user",
        "email": "preview.copim.member@rovicrm.com",
        "name": "Preview Asociado COPIM",
        "role": "copim_member",
        "account_type": "copim_member",
        "tenant_id": "tenant-preview-copim-member-personal",
        "tenant_type": "individual",
        "workspace_name": "Preview Asociado Personal",
        "linked_copim_tenant_id": LOCAL_COPIM_TENANT_ID,
        "linked_copim_association_id": "preview-association-riviera",
        "linked_copim_member_id": "preview-member-001",
    },
    {
        "id": "preview-rovi-admin-user",
        "email": "preview.rovi.admin@rovicrm.com",
        "name": "Preview ROVI Admin",
        "role": "rovi_admin",
        "account_type": "rovi_internal",
        "tenant_id": ROVI_INTERNAL_TENANT_ID,
        "tenant_type": "rovi_internal",
        "workspace_name": "ROVI Internal",
    },
]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def upsert_tenant(db, user: dict) -> None:
    now = now_iso()
    await db.tenants.update_one(
        {"id": user["tenant_id"]},
        {
            "$set": {
                "id": user["tenant_id"],
                "name": user["workspace_name"],
                "slug": user["tenant_id"],
                "tenant_type": user["tenant_type"],
                "owner_user_id": user["id"],
                "is_active": True,
                "branding": {"primary_color": "#0D9488"},
                "settings": {"seeded_for": "login_test_users"},
                "updated_at": now,
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )


async def upsert_membership(db, tenant_id: str, user_id: str, role: str, is_default: bool = True) -> None:
    now = now_iso()
    await db.tenant_memberships.update_one(
        {"tenant_id": tenant_id, "user_id": user_id},
        {
            "$set": {
                "tenant_id": tenant_id,
                "user_id": user_id,
                "role": role,
                "status": "active",
                "linked_via": "manual",
                "is_default": is_default,
                "accepted_at": now,
                "revoked_at": None,
                "updated_at": now,
            },
            "$setOnInsert": {
                "id": f"tm-{tenant_id}-{user_id}",
                "joined_at": now,
                "created_at": now,
                "created_by_user_id": user_id,
            },
        },
        upsert=True,
    )


async def upsert_user(db, user: dict, password_hash: str) -> None:
    now = now_iso()
    user_payload = {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "phone": user.get("phone", "+52 984 000 0000"),
        "password_hash": password_hash,
        "avatar_url": user.get("avatar_url"),
        "is_active": True,
        "onboarding_completed": True,
        "tenant_id": user["tenant_id"],
        "personal_tenant_id": user.get("personal_tenant_id") or user["tenant_id"],
        "account_type": user["account_type"],
        "updated_at": now,
    }
    for key in ("linked_copim_association_id", "linked_copim_member_id", "linked_copim_tenant_id"):
        if user.get(key):
            user_payload[key] = user[key]

    await db.users.update_one(
        {"email": user["email"]},
        {"$set": user_payload, "$setOnInsert": {"created_at": now}},
        upsert=True,
    )
    await upsert_tenant(db, user)
    await upsert_membership(db, user["tenant_id"], user["id"], user["role"])


async def seed_copim_member_fixture(db) -> None:
    now = now_iso()
    association_doc = {
        "id": "preview-association-riviera",
        "tenant_id": LOCAL_COPIM_TENANT_ID,
        "name": "COPIM Riviera Maya Preview",
        "state": "Quintana Roo",
        "city": "Tulum",
        "status": "active",
        "admin_name": "Preview COPIM Operador Local",
        "admin_email": "preview.copim.operator@rovicrm.com",
        "phone": "+52 984 111 2233",
        "member_count": 1,
        "active_members": 1,
        "pending_members": 0,
        "updated_at": now,
    }
    for tenant_id in (LOCAL_COPIM_TENANT_ID, NATIONAL_COPIM_TENANT_ID):
        await db.copim_associations.update_one(
            {"tenant_id": tenant_id, "id": association_doc["id"]},
            {"$set": {**association_doc, "tenant_id": tenant_id}, "$setOnInsert": {"created_at": now}},
            upsert=True,
        )

    member_doc = {
        "id": "preview-member-001",
        "tenant_id": LOCAL_COPIM_TENANT_ID,
        "association_id": "preview-association-riviera",
        "full_name": "Preview Asociado COPIM",
        "email": "preview.copim.member@rovicrm.com",
        "phone": "+52 984 444 7788",
        "city": "Tulum",
        "state": "Quintana Roo",
        "specialty": "Residential",
        "company_name": "Preview Realty",
        "member_status": "active",
        "credential_status": "issued",
        "credential_id": "COPIM-PREVIEW-001",
        "directory_visible": True,
        "portal_access_enabled": True,
        "linked_user_id": "preview-copim-member-user",
        "updated_at": now,
    }
    await db.copim_members.update_one(
        {"tenant_id": LOCAL_COPIM_TENANT_ID, "id": member_doc["id"]},
        {"$set": member_doc, "$setOnInsert": {"created_at": now}},
        upsert=True,
    )
    await upsert_membership(db, LOCAL_COPIM_TENANT_ID, "preview-copim-member-user", "copim_member")


async def main() -> None:
    if not MONGO_URL:
        raise RuntimeError("MONGO_URL no esta configurado")

    client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    db = client[DB_NAME]
    password_hash = get_password_hash(PASSWORD)

    try:
        await client.admin.command("ping")
        for user in TEST_USERS:
            await upsert_user(db, user, password_hash)
        await seed_copim_member_fixture(db)
        await ensure_rovi_internal_seed_data(db)

        print(f"LOGIN_TEST_USERS_READY db={DB_NAME}")
        print(f"Password: {PASSWORD}")
        for user in TEST_USERS:
            print(f"- {user['email']} ({user['role']})")
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
