"""
MONGODB INDEXES - ROVI CRM
Crear índices para optimizar performance y asegurar unicidad
"""

from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def create_indexes():
    """Create all necessary indexes for ROVI CRM"""

    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]

    print("🔧 Creando índices en MongoDB...")

    # LEADS COLLECTION
    print("\n📋 Índices para Leads:")

    # Unique constraints for email/phone within tenant
    try:
        await db.leads.create_index(
            [("tenant_id", 1), ("email", 1)],
            unique=True,
            partialFilterExpression={"email": {"$exists": True, "$ne": None}}
        )
        print("  ✅ (tenant_id, email) - Unique")
    except Exception as e:
        print(f"  ⚠️  (tenant_id, email) - Ya existe: {e}")

    try:
        await db.leads.create_index(
            [("tenant_id", 1), ("phone", 1)],
            unique=True,
            partialFilterExpression={"phone": {"$exists": True, "$ne": None}}
        )
        print("  ✅ (tenant_id, phone) - Unique")
    except Exception as e:
        print(f"  ⚠️  (tenant_id, phone) - Ya existe: {e}")

    # Common query patterns
    await db.leads.create_index([("tenant_id", 1), ("deleted", 1)])
    print("  ✅ (tenant_id, deleted) - Query optimization")

    await db.leads.create_index([("tenant_id", 1), ("status", 1)])
    print("  ✅ (tenant_id, status) - Filter optimization")

    await db.leads.create_index([("tenant_id", 1), ("priority", 1)])
    print("  ✅ (tenant_id, priority) - Filter optimization")

    await db.leads.create_index([("tenant_id", 1), ("created_at", -1)])
    print("  ✅ (tenant_id, created_at) - Sort optimization")

    await db.leads.create_index([("tenant_id", 1), ("source", 1)])
    print("  ✅ (tenant_id, source) - Filter optimization")

    # Compound index for advanced filters
    await db.leads.create_index([
        ("tenant_id", 1),
        ("status", 1),
        ("priority", 1),
        ("created_at", -1)
    ])
    print("  ✅ (tenant_id, status, priority, created_at) - Advanced filters")

    # Text index for full-text search
    await db.leads.create_index([
        ("name", "text"),
        ("email", "text"),
        ("phone", "text"),
        ("property", "text"),
        ("notes", "text")
    ], weights={
        "name": 10,
        "email": 5,
        "phone": 5,
        "property": 3,
        "notes": 1
    })
    print("  ✅ Text search index - Full-text search")

    # USERS COLLECTION
    print("\n👤 Índices para Users:")

    try:
        await db.users.create_index("email", unique=True)
        print("  ✅ (email) - Unique")
    except Exception as e:
        print(f"  ⚠️  (email) - Ya existe: {e}")

    await db.users.create_index("tenant_id")
    print("  ✅ (tenant_id) - Query optimization")

    await db.users.create_index([("tenant_id", 1), ("role", 1)])
    print("  ✅ (tenant_id, role) - Filter optimization")

    await db.users.create_index("personal_tenant_id")
    print("  ✅ (personal_tenant_id) - Workspace lookup")

    # TENANTS COLLECTION
    print("\n🏢 Índices para Tenants:")

    try:
        await db.tenants.create_index("id", unique=True)
        print("  ✅ (id) - Unique")
    except Exception as e:
        print(f"  ⚠️  (id) - Ya existe: {e}")

    try:
        await db.tenants.create_index("slug", unique=True)
        print("  ✅ (slug) - Unique")
    except Exception as e:
        print(f"  ⚠️  (slug) - Ya existe: {e}")

    await db.tenants.create_index([("owner_user_id", 1), ("tenant_type", 1)])
    print("  ✅ (owner_user_id, tenant_type) - Query optimization")

    # TENANT MEMBERSHIPS COLLECTION
    print("\n🤝 Índices para Tenant Memberships:")

    try:
        await db.tenant_memberships.create_index([("tenant_id", 1), ("user_id", 1)], unique=True)
        print("  ✅ (tenant_id, user_id) - Unique membership")
    except Exception as e:
        print(f"  ⚠️  (tenant_id, user_id) - Ya existe: {e}")

    await db.tenant_memberships.create_index([("user_id", 1), ("status", 1)])
    print("  ✅ (user_id, status) - User memberships")

    await db.tenant_memberships.create_index([("tenant_id", 1), ("role", 1), ("status", 1)])
    print("  ✅ (tenant_id, role, status) - Tenant roster")

    await db.tenant_memberships.create_index([("tenant_id", 1), ("is_default", 1)])
    print("  ✅ (tenant_id, is_default) - Default workspace scan")

    # BROKER PAIRING SESSIONS COLLECTION
    print("\n📱 Índices para Broker Pairing Sessions:")

    try:
        await db.broker_pairing_sessions.create_index("token", unique=True)
        print("  ✅ (token) - Unique")
    except Exception as e:
        print(f"  ⚠️  (token) - Ya existe: {e}")

    await db.broker_pairing_sessions.create_index("expires_at", expireAfterSeconds=0)
    print("  ✅ (expires_at TTL) - Pairing expiration cleanup")

    await db.broker_pairing_sessions.create_index([("tenant_id", 1), ("status", 1)])
    print("  ✅ (tenant_id, status) - Pairing query optimization")

    # REFRESH TOKENS COLLECTION
    print("\n🔑 Índices para Refresh Tokens:")

    try:
        await db.refresh_tokens.create_index("jti", unique=True)
        print("  ✅ (jti) - Unique")
    except Exception as e:
        print(f"  ⚠️  (jti) - Ya existe: {e}")

    await db.refresh_tokens.create_index([("user_id", 1), ("revoked", 1)])
    print("  ✅ (user_id, revoked) - Query optimization")

    await db.refresh_tokens.create_index("exp")
    print("  ✅ (exp) - Expiration cleanup")

    # AUTH ATTEMPTS COLLECTION
    print("\n🚨 Índices para Auth Attempts:")

    await db.auth_attempts.create_index([
        ("user_id", 1),
        ("action", 1),
        ("timestamp", -1)
    ])
    print("  ✅ (user_id, action, timestamp) - Rate limiting")

    await db.auth_attempts.create_index("timestamp")
    print("  ✅ (timestamp) - Cleanup optimization")

    # CAMPAIGNS COLLECTION
    print("\n📢 Índices para Campaigns:")

    await db.campaigns.create_index([("tenant_id", 1), ("status", 1)])
    print("  ✅ (tenant_id, status) - Filter optimization")

    await db.campaigns.create_index([("tenant_id", 1), ("type", 1)])
    print("  ✅ (tenant_id, type) - Filter optimization")

    # EMAIL TEMPLATES COLLECTION
    print("\n📧 Índices para Email Templates:")

    await db.email_templates.create_index([("tenant_id", 1)])
    print("  ✅ (tenant_id) - Query optimization")

    # CALENDAR EVENTS COLLECTION
    print("\n📅 Índices para Calendar Events:")

    await db.calendar_events.create_index([("tenant_id", 1), ("start", 1)])
    print("  ✅ (tenant_id, start) - Date range queries")

    # ACTIVITIES COLLECTION
    print("\n📝 Índices para Activities:")

    await db.activities.create_index([("tenant_id", 1), ("lead_id", 1)])
    print("  ✅ (tenant_id, lead_id) - Query optimization")

    await db.activities.create_index([("tenant_id", 1), ("created_at", -1)])
    print("  ✅ (tenant_id, created_at) - Sort optimization")

    # TASKS COLLECTION
    print("\n✅ Índices para Tasks:")

    try:
        await db.tasks.create_index([("tenant_id", 1), ("id", 1)], unique=True)
        print("  ✅ (tenant_id, id) - Unique task lookup")
    except Exception as e:
        print(f"  ⚠️  (tenant_id, id) - Ya existe: {e}")

    await db.tasks.create_index([("tenant_id", 1), ("deleted", 1), ("status", 1)])
    print("  ✅ (tenant_id, deleted, status) - Board filters")

    await db.tasks.create_index([("tenant_id", 1), ("assigned_to", 1), ("status", 1)])
    print("  ✅ (tenant_id, assigned_to, status) - User workload")

    await db.tasks.create_index([("tenant_id", 1), ("lead_id", 1)])
    print("  ✅ (tenant_id, lead_id) - Lead task timeline")

    await db.tasks.create_index([("tenant_id", 1), ("due_date", 1)])
    print("  ✅ (tenant_id, due_date) - Due date filters")

    # MARKETPLACE COLLECTIONS
    print("\n🛒 Índices para ROVI Marketplace:")

    await db.marketplace_tiers.create_index([("tenant_id", 1), ("code", 1)], unique=True)
    print("  ✅ marketplace_tiers (tenant_id, code) - Tier lookup")

    await db.marketplace_subscriptions.create_index([("tenant_id", 1), ("user_id", 1), ("status", 1)])
    print("  ✅ marketplace_subscriptions (tenant_id, user_id, status) - Active tier lookup")

    await db.marketplace_listings.create_index([("tenant_id", 1), ("status", 1), ("listing_type", 1)])
    print("  ✅ marketplace_listings (tenant_id, status, listing_type) - Catalog filters")

    await db.marketplace_listings.create_index([("tenant_id", 1), ("creator_user_id", 1), ("listing_type", 1), ("status", 1)])
    print("  ✅ marketplace_listings creator limits")

    await db.marketplace_listings.create_index([
        ("title", "text"),
        ("description", "text"),
        ("category", "text"),
        ("tags", "text"),
    ])
    print("  ✅ marketplace_listings text search")

    await db.marketplace_transactions.create_index([("tenant_id", 1), ("buyer_user_id", 1), ("created_at", -1)])
    await db.marketplace_transactions.create_index([("tenant_id", 1), ("creator_user_id", 1), ("created_at", -1)])
    await db.marketplace_transactions.create_index([("tenant_id", 1), ("listing_id", 1), ("status", 1)])
    print("  ✅ marketplace_transactions buyer/seller/status indexes")

    await db.agent_skill_installations.create_index([("tenant_id", 1), ("user_id", 1), ("listing_id", 1)], unique=True)
    print("  ✅ agent_skill_installations unique user install")

    # ROVI INTERNAL COLLECTIONS
    print("\n🏢 Índices para ROVI Internal:")

    await db.rovi_prospects.create_index([("tenant_id", 1), ("stage", 1)])
    await db.rovi_prospects.create_index([("tenant_id", 1), ("score", -1)])
    await db.rovi_prospects.create_index([("tenant_id", 1), ("source", 1)])
    print("  ✅ rovi_prospects tenant/stage/score/source indexes")

    await db.rovi_service_plans.create_index([("tenant_id", 1), ("tier", 1)], unique=True)
    print("  ✅ rovi_service_plans (tenant_id, tier) - Plan lookup")

    print("\n✅ Índices creados exitosamente!")
    print("\n📊 Resumen de índices:")

    # List all indexes
    collections = [
        "leads",
        "users",
        "tenants",
        "tenant_memberships",
        "broker_pairing_sessions",
        "refresh_tokens",
        "auth_attempts",
        "campaigns",
        "email_templates",
        "calendar_events",
        "activities",
        "marketplace_tiers",
        "marketplace_subscriptions",
        "marketplace_listings",
        "marketplace_transactions",
        "agent_skill_installations",
        "rovi_prospects",
        "rovi_service_plans",
    ]

    for collection_name in collections:
        indexes = await db[collection_name].list_indexes().to_list(None)
        count = len(indexes)
        print(f"  • {collection_name}: {count} índices")

    print("\n🚀 Performance optimizado!")

    client.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(create_indexes())
