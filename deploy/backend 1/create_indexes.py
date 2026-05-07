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

    print("\n✅ Índices creados exitosamente!")
    print("\n📊 Resumen de índices:")

    # List all indexes
    collections = ["leads", "users", "refresh_tokens", "auth_attempts",
                   "campaigns", "email_templates", "calendar_events", "activities"]

    for collection_name in collections:
        count = len((await db[collection_name].list_indexes()).to_list())
        print(f"  • {collection_name}: {count} índices")

    print("\n🚀 Performance optimizado!")

    client.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(create_indexes())
