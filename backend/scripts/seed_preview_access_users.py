#!/usr/bin/env python3
"""Seed deterministic preview access users for every ROVI role family."""

import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

sys.path.append(str(Path(__file__).resolve().parents[1]))

from auth import get_password_hash
from rovi_internal import ROVI_INTERNAL_TENANT_ID, ensure_rovi_internal_seed_data


load_dotenv()


PREVIEW_PASSWORD = os.environ.get("PREVIEW_ACCESS_PASSWORD", "RoviPreview2026!")
NATIONAL_COPIM_TENANT_ID = "tenant-preview-copim"
LOCAL_COPIM_TENANT_ID = "tenant-preview-copim-local"
RENTALS_TENANT_ID = "tenant-preview-rentals"


PREVIEW_USERS = [
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
        "tenant_id": RENTALS_TENANT_ID,
        "tenant_type": "property_management",
        "workspace_name": "Preview Rentas Operacion",
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
    {
        "id": "preview-rovi-sales-user",
        "email": "preview.rovi.sales@rovicrm.com",
        "name": "Preview ROVI Sales",
        "role": "rovi_sales",
        "account_type": "rovi_internal",
        "tenant_id": ROVI_INTERNAL_TENANT_ID,
        "tenant_type": "rovi_internal",
        "workspace_name": "ROVI Internal",
    },
    {
        "id": "preview-rovi-marketing-user",
        "email": "preview.rovi.marketing@rovicrm.com",
        "name": "Preview ROVI Marketing",
        "role": "rovi_marketing",
        "account_type": "rovi_internal",
        "tenant_id": ROVI_INTERNAL_TENANT_ID,
        "tenant_type": "rovi_internal",
        "workspace_name": "ROVI Internal",
    },
    {
        "id": "preview-rovi-cs-user",
        "email": "preview.rovi.cs@rovicrm.com",
        "name": "Preview ROVI Customer Success",
        "role": "rovi_customer_success",
        "account_type": "rovi_internal",
        "tenant_id": ROVI_INTERNAL_TENANT_ID,
        "tenant_type": "rovi_internal",
        "workspace_name": "ROVI Internal",
    },
    {
        "id": "preview-rovi-ops-user",
        "email": "preview.rovi.ops@rovicrm.com",
        "name": "Preview ROVI Operaciones",
        "role": "rovi_ops",
        "account_type": "rovi_internal",
        "tenant_id": ROVI_INTERNAL_TENANT_ID,
        "tenant_type": "rovi_internal",
        "workspace_name": "ROVI Internal",
    },
]


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def iso_now() -> str:
    return now_utc().isoformat()


async def upsert_tenant(db, *, tenant_id: str, name: str, tenant_type: str, owner_user_id: str, settings: dict | None = None) -> None:
    now = iso_now()
    await db.tenants.update_one(
        {"id": tenant_id},
        {
            "$set": {
                "id": tenant_id,
                "name": name,
                "slug": tenant_id.replace("tenant-", ""),
                "tenant_type": tenant_type,
                "owner_user_id": owner_user_id,
                "is_active": True,
                "branding": {"primary_color": "#0D9488"},
                "settings": settings or {"seeded_for": "preview"},
                "updated_at": now,
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )


async def upsert_membership(db, *, tenant_id: str, user_id: str, role: str, is_default: bool, created_by_user_id: str) -> None:
    now = iso_now()
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
                "created_by_user_id": created_by_user_id,
                "updated_at": now,
            },
            "$setOnInsert": {
                "id": f"tm-{tenant_id}-{user_id}",
                "joined_at": now,
                "created_at": now,
                "revoked_at": None,
            },
        },
        upsert=True,
    )


async def upsert_user(db, user: dict) -> None:
    now = iso_now()
    tenant_id = user["tenant_id"]
    personal_tenant_id = user.get("personal_tenant_id") or tenant_id
    user_payload = {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "phone": user.get("phone", "+52 984 000 0000"),
        "password_hash": get_password_hash(PREVIEW_PASSWORD),
        "avatar_url": user.get("avatar_url"),
        "is_active": True,
        "onboarding_completed": True,
        "tenant_id": tenant_id,
        "personal_tenant_id": personal_tenant_id,
        "account_type": user["account_type"],
        "updated_at": now,
    }
    for optional_field in (
        "department",
        "linked_copim_association_id",
        "linked_copim_member_id",
        "linked_copim_tenant_id",
    ):
        if user.get(optional_field):
            user_payload[optional_field] = user[optional_field]

    await db.users.update_one(
        {"email": user["email"]},
        {"$set": user_payload, "$setOnInsert": {"created_at": now}},
        upsert=True,
    )

    await upsert_tenant(
        db,
        tenant_id=tenant_id,
        name=user["workspace_name"],
        tenant_type=user["tenant_type"],
        owner_user_id=user["id"],
    )
    await upsert_membership(
        db,
        tenant_id=tenant_id,
        user_id=user["id"],
        role=user["role"],
        is_default=True,
        created_by_user_id=user["id"],
    )


async def seed_copim_preview_data(db) -> None:
    now = iso_now()
    await upsert_tenant(
        db,
        tenant_id=NATIONAL_COPIM_TENANT_ID,
        name="Preview COPIM Nacional",
        tenant_type="copim",
        owner_user_id="preview-copim-admin-user",
        settings={"scope": "national_preview"},
    )
    await upsert_tenant(
        db,
        tenant_id=LOCAL_COPIM_TENANT_ID,
        name="Preview Asociacion Riviera Maya",
        tenant_type="association",
        owner_user_id="preview-copim-operator-user",
        settings={"scope": "local_preview"},
    )

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
        "renewals_due": 0,
        "credentials_issued": 1,
        "directory_visible_members": 1,
        "upcoming_events": 1,
        "revenue_due": 0,
        "updated_at": now,
    }
    await db.copim_associations.update_one(
        {"tenant_id": LOCAL_COPIM_TENANT_ID, "id": association_doc["id"]},
        {"$set": association_doc, "$setOnInsert": {"created_at": now}},
        upsert=True,
    )
    await db.copim_associations.update_one(
        {"tenant_id": NATIONAL_COPIM_TENANT_ID, "id": association_doc["id"]},
        {"$set": {**association_doc, "tenant_id": NATIONAL_COPIM_TENANT_ID}, "$setOnInsert": {"created_at": now}},
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
    await upsert_membership(
        db,
        tenant_id=LOCAL_COPIM_TENANT_ID,
        user_id="preview-copim-member-user",
        role="copim_member",
        is_default=True,
        created_by_user_id="preview-copim-operator-user",
    )


async def seed_rentals_preview_data(db) -> None:
    now = now_utc()
    property_id = "preview-rental-casa-luna"
    staff_id = "preview-rental-staff-limpieza"
    booking_id = "preview-rental-booking-airbnb"

    property_doc = {
        "id": property_id,
        "tenant_id": RENTALS_TENANT_ID,
        "created_by": "preview-rentals-manager-user",
        "title": "Casa Luna Preview",
        "address": "Aldea Zama, Tulum",
        "zone": "Aldea Zama",
        "operation_type": "rent",
        "rental_type": "short_term",
        "status": "active",
        "bedrooms": 2,
        "bathrooms": 2,
        "max_guests": 4,
        "nightly_price_mxn": 3400,
        "monthly_price_mxn": 52000,
        "cleaning_fee_mxn": 750,
        "deposit_mxn": 6000,
        "commission_rate": 0.18,
        "platforms": ["Airbnb", "Booking.com", "Directo"],
        "amenities": ["wifi", "pool", "parking", "workspace"],
        "images": [
            {
                "id": "preview-rental-image-1",
                "url": "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
                "type": "image",
                "label": "Fachada",
                "sort_order": 1,
            }
        ],
        "notes": "Propiedad demo para validar reservas, calendario, tareas, finanzas e integraciones.",
        "updated_at": now,
    }
    await db.rental_properties.update_one(
        {"tenant_id": RENTALS_TENANT_ID, "id": property_id},
        {"$set": property_doc, "$setOnInsert": {"created_at": now}},
        upsert=True,
    )

    staff_doc = {
        "id": staff_id,
        "tenant_id": RENTALS_TENANT_ID,
        "created_by": "preview-rentals-manager-user",
        "name": "Equipo Limpieza Preview",
        "email": "limpieza.preview@rovicrm.com",
        "phone": "+52 984 555 0199",
        "role": "Limpieza",
        "responsibilities": ["Limpieza checkout", "Inventario blancos", "Amenidades"],
        "specialties": ["Airbnb", "Booking.com"],
        "status": "active",
        "notes": "Responsable demo para tareas operativas.",
        "updated_at": now,
    }
    await db.rental_staff.update_one(
        {"tenant_id": RENTALS_TENANT_ID, "id": staff_id},
        {"$set": staff_doc, "$setOnInsert": {"created_at": now}},
        upsert=True,
    )

    check_in = now + timedelta(days=5)
    check_out = now + timedelta(days=8)
    booking_doc = {
        "id": booking_id,
        "tenant_id": RENTALS_TENANT_ID,
        "created_by": "preview-rentals-manager-user",
        "property_id": property_id,
        "guest_name": "Mariana Demo",
        "guest_email": "mariana.demo@example.com",
        "guest_phone": "+52 998 123 4567",
        "source": "Airbnb",
        "check_in": check_in,
        "check_out": check_out,
        "guests_count": 3,
        "status": "confirmed",
        "total_amount_mxn": 10950,
        "paid_amount_mxn": 10950,
        "cleaning_fee_mxn": 750,
        "deposit_mxn": 6000,
        "platform_fee_mxn": 690,
        "nights": 3,
        "balance_due_mxn": 0,
        "notes": "Reserva demo para validar calendario.",
        "updated_at": now,
    }
    await db.rental_bookings.update_one(
        {"tenant_id": RENTALS_TENANT_ID, "id": booking_id},
        {"$set": booking_doc, "$setOnInsert": {"created_at": now}},
        upsert=True,
    )

    task_docs = [
        {
            "id": "preview-rental-task-cleaning",
            "task_type": "cleaning",
            "title": "Limpieza checkout Casa Luna",
            "due_at": check_out.replace(hour=11, minute=0, second=0, microsecond=0),
            "priority": "high",
            "schedule_type": "event_based",
            "linked_event_type": "checkout",
            "notes": "Revisar blancos, amenidades y reporte de danos.",
        },
        {
            "id": "preview-rental-task-power",
            "task_type": "utilities",
            "title": "Pagar recibo de luz",
            "due_at": now + timedelta(days=10),
            "priority": "medium",
            "schedule_type": "recurring",
            "recurrence_rule": "monthly",
            "notes": "Pago mensual programado.",
        },
    ]
    for task in task_docs:
        task_doc = {
            **task,
            "tenant_id": RENTALS_TENANT_ID,
            "created_by": "preview-rentals-manager-user",
            "property_id": property_id,
            "booking_id": booking_id if task["id"] == "preview-rental-task-cleaning" else None,
            "assigned_staff_id": staff_id,
            "assigned_to": "Equipo Limpieza Preview",
            "next_due_at": task.get("due_at"),
            "status": "todo",
            "updated_at": now,
        }
        await db.rental_tasks.update_one(
            {"tenant_id": RENTALS_TENANT_ID, "id": task_doc["id"]},
            {"$set": task_doc, "$setOnInsert": {"created_at": now}},
            upsert=True,
        )

    await db.rental_expenses.update_one(
        {"tenant_id": RENTALS_TENANT_ID, "id": "preview-rental-expense-maintenance"},
        {
            "$set": {
                "id": "preview-rental-expense-maintenance",
                "tenant_id": RENTALS_TENANT_ID,
                "created_by": "preview-rentals-manager-user",
                "property_id": property_id,
                "staff_id": staff_id,
                "category": "maintenance",
                "amount_mxn": 1450,
                "description": "Reparacion menor de cerradura",
                "expense_date": now - timedelta(days=2),
                "vendor": "Mantenimiento Tulum",
                "payment_method": "transfer",
                "status": "paid",
                "updated_at": now,
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )
    await db.rental_external_sales.update_one(
        {"tenant_id": RENTALS_TENANT_ID, "id": "preview-rental-sale-tour"},
        {
            "$set": {
                "id": "preview-rental-sale-tour",
                "tenant_id": RENTALS_TENANT_ID,
                "created_by": "preview-rentals-manager-user",
                "property_id": property_id,
                "booking_id": booking_id,
                "staff_id": staff_id,
                "guest_name": "Mariana Demo",
                "concept": "Tour privado a cenotes",
                "amount_mxn": 2400,
                "sale_date": now - timedelta(days=1),
                "payment_method": "card",
                "status": "collected",
                "source": "direct",
                "updated_at": now,
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )


async def main() -> None:
    mongo_url = os.environ.get("MONGO_URL")
    if not mongo_url:
        raise RuntimeError("MONGO_URL no esta configurado")

    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get("DB_NAME", "rovi_crm_preview")]

    try:
        for user in PREVIEW_USERS:
            await upsert_user(db, user)

        await seed_copim_preview_data(db)
        await seed_rentals_preview_data(db)
        await ensure_rovi_internal_seed_data(db)

        print("Preview access users seeded")
        print(f"Password: {PREVIEW_PASSWORD}")
        for user in PREVIEW_USERS:
            print(f"- {user['email']} ({user['role']})")
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
