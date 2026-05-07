"""
MONGODB INDEXES - ROVI CRM (FIXED VERSION)
Crear índices para optimizar performance y asegurar unicidad
"""

from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

async def create_indexes():
    """Create all necessary indexes for ROVI CRM"""

    # Build MongoDB URL from environment variables
    mongo_user = os.environ.get('MONGO_ROOT_USERNAME', 'admin')
    mongo_pass = os.environ.get('MONGO_ROOT_PASSWORD', '')
    mongo_host = os.environ.get('MONGO_HOST', 'localhost')
    mongo_port = os.environ.get('MONGO_HOST_PORT', '27017')

    if mongo_pass:
        mongo_url = f"mongodb://{mongo_user}:{mongo_pass}@{mongo_host}:{mongo_port}"
    else:
        mongo_url = f"mongodb://{mongo_host}:{mongo_port}"

    db_name = os.environ.get('DB_NAME', 'rovi_crm')

    print(f"🔧 Conectando a MongoDB: {mongo_host}:{mongo_port}")
    print(f"📊 Database: {db_name}")

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    print("\n🔧 Creando índices en MongoDB...")

    try:
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
            print(f"  ⚠️  (tenant_id, email) - Ya existe o error: {e}")

        try:
            await db.leads.create_index(
                [("tenant_id", 1), ("phone", 1)],
                unique=True,
                partialFilterExpression={"phone": {"$exists": True, "$ne": None}}
            )
            print("  ✅ (tenant_id, phone) - Unique")
        except Exception as e:
            print(f"  ⚠️  (tenant_id, phone) - Ya existe o error: {e}")

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

        print("\n✅ Índices creados exitosamente!")
        print(f"\n📊 Resumen de colecciones:")

        # List indexes for main collections
        main_collections = ["leads", "users", "refresh_tokens", "auth_attempts"]

        for collection_name in main_collections:
            try:
                indexes = await db[collection_name].list_indexes()
                index_list = await indexes.to_list()
                print(f"  • {collection_name}: {len(index_list)} índices")
            except:
                print(f"  • {collection_name}: Colección no existe aún")

        print("\n🚀 Performance optimizado!")

    except Exception as e:
        print(f"\n❌ Error creando índices: {e}")
    finally:
        client.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(create_indexes())
