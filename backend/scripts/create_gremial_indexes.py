#!/usr/bin/env python3
from __future__ import annotations

import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).resolve().parents[1]
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "rovi_crm")

INDEXES = {
    "gremial_delegations": [
        ([('tenant_id', 1), ('name', 1)], {}),
        ([('tenant_id', 1), ('state', 1), ('status', 1)], {}),
    ],
    "gremial_members": [
        ([('tenant_id', 1), ('company_name', 1)], {}),
        ([('tenant_id', 1), ('delegation_id', 1), ('company_name', 1)], {}),
        ([('tenant_id', 1), ('member_status', 1), ('state', 1), ('membership_tier', 1)], {}),
        ([('tenant_id', 1), ('email', 1)], {}),
        ([('tenant_id', 1), ('rfc', 1)], {}),
    ],
    "gremial_memberships": [
        ([('tenant_id', 1), ('renewal_date', 1)], {}),
        ([('tenant_id', 1), ('delegation_id', 1), ('payment_status', 1)], {}),
        ([('tenant_id', 1), ('member_id', 1)], {}),
    ],
    "gremial_affiliation_leads": [
        ([('tenant_id', 1), ('created_at', -1)], {}),
        ([('tenant_id', 1), ('delegation_id', 1), ('stage', 1)], {}),
    ],
    "gremial_services": [
        ([('tenant_id', 1), ('title', 1)], {}),
        ([('tenant_id', 1), ('category', 1), ('status', 1)], {}),
    ],
    "gremial_opportunities": [
        ([('tenant_id', 1), ('created_at', -1)], {}),
        ([('tenant_id', 1), ('status', 1), ('state', 1), ('sector', 1)], {}),
    ],
    "gremial_tenders": [
        ([('tenant_id', 1), ('published_at', -1)], {}),
        ([('tenant_id', 1), ('status', 1), ('state', 1), ('dependency', 1)], {}),
    ],
    "gremial_courses": [
        ([('tenant_id', 1), ('starts_at', 1)], {}),
        ([('tenant_id', 1), ('status', 1), ('category', 1), ('state', 1)], {}),
    ],
    "gremial_events": [
        ([('tenant_id', 1), ('starts_at', 1)], {}),
        ([('tenant_id', 1), ('status', 1), ('event_type', 1), ('state', 1)], {}),
    ],
    "gremial_ai_recommendations": [
        ([('tenant_id', 1), ('status', 1), ('priority', -1)], {}),
        ([('tenant_id', 1), ('member_id', 1), ('created_at', -1)], {}),
    ],
}

async def main() -> None:
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    created = []
    for collection_name, indexes in INDEXES.items():
        collection = db[collection_name]
        for keys, kwargs in indexes:
            name = await collection.create_index(keys, background=True, **kwargs)
            created.append(f"{collection_name}: {name}")
    client.close()
    print("Índices gremiales verificados/creados:")
    for item in created:
        print(f"- {item}")

if __name__ == "__main__":
    asyncio.run(main())
