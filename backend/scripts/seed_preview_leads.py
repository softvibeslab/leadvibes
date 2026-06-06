#!/usr/bin/env python3
"""Seed demo leads for preview login users."""

from __future__ import annotations

import asyncio
import os
from datetime import datetime, timedelta, timezone

from motor.motor_asyncio import AsyncIOMotorClient


BASE_LEADS = [
    ("Ricardo Hernandez", "ricardo.preview@example.com", "+52 55 1234 5678", "presentacion", "alta", "Facebook Ads", 2500000, "Aldea Zama", "Lote residencial Aldea Zama", 85),
    ("Jennifer Smith", "jennifer.preview@example.com", "+1 305 555 1234", "apartado", "urgente", "Referido", 4500000, "Region 15", "Villa boutique en preventa", 95),
    ("Fernando Castillo", "fernando.preview@example.com", "+52 33 9876 5432", "calificacion", "media", "Google Ads", 1800000, "La Veleta", "Departamento lock-off", 65),
    ("Laura Vega", "laura.preview@example.com", "+52 81 2345 6789", "contactado", "alta", "Instagram", 3200000, "Holistika", "Terreno para casa de descanso", 78),
    ("Michael Brown", "michael.preview@example.com", "+1 416 555 7890", "nuevo", "media", "Web Organico", 5000000, "Tankah", "Terreno frente a cenote", 55),
    ("Patricia Moreno", "patricia.preview@example.com", "+52 55 8765 4321", "venta", "urgente", "Evento", 2800000, "Centro", "Casa para renta vacacional", 90),
]

TENANTS = [
    ("tenant-preview-broker", "preview-broker-user"),
    ("tenant-preview-agency", "preview-agency-admin-user"),
]


async def main() -> None:
    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ.get("DB_NAME", "rovi_crm")
    client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
    db = client[db_name]
    await client.admin.command("ping")

    now = datetime.now(timezone.utc)
    upserted = 0
    matched = 0

    for tenant_id, user_id in TENANTS:
        for idx, (name, email, phone, lead_status, priority, source, budget, zone, interest, score) in enumerate(BASE_LEADS, start=1):
            lead_id = f"preview-{tenant_id}-{idx}"
            lead_doc = {
                "id": lead_id,
                "tenant_id": tenant_id,
                "created_by": user_id,
                "assigned_broker_id": user_id,
                "name": name,
                "email": email.replace("@", f".{tenant_id}@"),
                "phone": phone,
                "status": lead_status,
                "priority": priority,
                "source": source,
                "operation_type": "sale",
                "pipeline_type": "sales",
                "budget_mxn": budget,
                "preferred_zone": zone,
                "property_interest": interest,
                "notes": f"Lead demo para validar el modulo de leads ({tenant_id}).",
                "tags": ["demo", "preview"],
                "intent_score": score,
                "email_opt_out": False,
                "sms_opt_out": False,
                "whatsapp_opt_out": False,
                "call_opt_out": False,
                "custom_fields_data": {},
                "created_at": (now - timedelta(days=idx)).isoformat(),
                "updated_at": now.isoformat(),
            }
            result = await db.leads.update_one(
                {"id": lead_id, "tenant_id": tenant_id},
                {"$set": lead_doc},
                upsert=True,
            )
            upserted += 1 if result.upserted_id else 0
            matched += result.matched_count

    print({"status": "ok", "db": db_name, "upserted": upserted, "matched": matched})
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
