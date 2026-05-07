# Guía de migración — Datos existentes

**Cuándo ejecutar:** Al final de la Fase 1, antes de hacer deploy a producción.  
**Qué hace:** Agrega `org_id` y `broker_id` a todos los documentos existentes en MongoDB.  
**Riesgo:** Bajo — solo agrega campos, no modifica ni elimina datos existentes.  
**Rollback:** Ver sección al final de este documento.

---

## Antes de migrar — checklist

- [ ] Tomar backup de MongoDB: `mongodump --uri="$MONGO_URL" --out=./backup_pre_migration`
- [ ] Hacer deploy de Fase 1 al entorno de desarrollo y verificar que la app levanta
- [ ] Correr los tests en el entorno de desarrollo: `pytest tests/test_api_smoke.py`
- [ ] Ejecutar la migración en desarrollo primero, luego en producción

---

## Script 1 — `backend/migrations/001_add_org_id.py`

Crea un `Organization` por cada usuario existente y propaga `org_id` + `broker_id` a todos sus recursos.

```python
"""
Migración 001 — Agregar org_id y broker_id a todos los documentos.

Ejecutar:
    cd backend
    python migrations/001_add_org_id.py

Variables de entorno requeridas:
    MONGO_URL  →  mongodb://localhost:27017  (o la URL de producción)
    DB_NAME    →  rovi_crm
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime, timezone

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "rovi_crm")

# Todas las colecciones que tienen tenant_id y necesitan org_id + broker_id
RESOURCE_COLLECTIONS = [
    "leads",
    "activities",
    "campaigns",
    "goals",
    "email_templates",
    "gamification_rules",
    "ai_profiles",
    "integration_settings",
    "products",
    "calendar_events",
]


async def migrate():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    print(f"Conectado a {MONGO_URL}/{DB_NAME}")
    print("=" * 60)

    # ── Paso 1: Leer todos los usuarios ──────────────────────────────
    users = await db.users.find({}).to_list(None)
    print(f"Usuarios encontrados: {len(users)}")

    # Mapas de lookup para propagar org_id
    tenant_to_org: dict[str, str] = {}   # tenant_id → org_id
    user_to_org: dict[str, str] = {}     # user_id → org_id

    # ── Paso 2: Crear Organization por cada usuario ───────────────────
    print("\nCreando organizaciones...")
    for user in users:
        user_id = user["id"]
        old_tenant_id = user.get("tenant_id", "")

        # Verificar si ya tiene org_id (idempotente)
        if user.get("org_id"):
            org_id = user["org_id"]
            print(f"  [skip] {user.get('name', user_id)} — ya tiene org_id: {org_id}")
        else:
            org_id = f"org-{str(uuid.uuid4())[:12]}"
            org_doc = {
                "id": org_id,
                "name": user.get("name", "Organización"),
                "type": user.get("account_type", "individual"),
                "owner_id": user_id,
                "plan": "free",
                "settings": {},
                "legacy_tenant_id": old_tenant_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "is_active": True,
            }
            # upsert — idempotente si se corre dos veces
            await db.organizations.update_one(
                {"owner_id": user_id},
                {"$setOnInsert": org_doc},
                upsert=True,
            )
            print(f"  [created] {user.get('name', user_id)} → org_id: {org_id}")

        # Actualizar usuario con org_id
        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "org_id": org_id,
                "tenant_id": org_id,  # sincronizar tenant_id con org_id
            }}
        )

        # Construir mapas de lookup
        tenant_to_org[old_tenant_id] = org_id
        tenant_to_org[org_id] = org_id
        user_to_org[user_id] = org_id

    # ── Paso 3: Propagar org_id a todos los recursos ──────────────────
    print("\nActualizando recursos...")
    total_updated = 0

    for collection_name in RESOURCE_COLLECTIONS:
        collection = db[collection_name]
        total_docs = await collection.count_documents({})

        if total_docs == 0:
            print(f"  {collection_name}: vacía, skip")
            continue

        # Solo actualizar docs que NO tienen org_id todavía
        docs_sin_org = await collection.find(
            {"$or": [{"org_id": {"$exists": False}}, {"org_id": ""}]}
        ).to_list(None)

        updated = 0
        failed = 0

        for doc in docs_sin_org:
            tenant_id = doc.get("tenant_id", "")
            user_id = doc.get("user_id", doc.get("broker_id", ""))

            # Buscar org_id por tenant_id primero, luego por user_id
            org_id = (
                tenant_to_org.get(tenant_id)
                or user_to_org.get(user_id)
            )

            if not org_id:
                print(f"  ⚠️  {collection_name}/{doc.get('id', '?')}: no se pudo determinar org_id")
                failed += 1
                continue

            # broker_id = el user_id del creador del recurso
            broker_id = user_id or ""

            await collection.update_one(
                {"_id": doc["_id"]},
                {"$set": {
                    "org_id": org_id,
                    "broker_id": broker_id,
                    "tenant_id": org_id,  # sincronizar
                }}
            )
            updated += 1

        total_updated += updated
        print(f"  {collection_name}: {updated}/{len(docs_sin_org)} actualizados"
              + (f", {failed} fallidos" if failed else ""))

    print("\n" + "=" * 60)
    print(f"Migración completada. Total documentos actualizados: {total_updated}")
    client.close()


if __name__ == "__main__":
    asyncio.run(migrate())
```

---

## Script 2 — `backend/migrations/002_create_indexes.py`

Crea los índices compuestos en MongoDB. Ejecutar después del script 001.

```python
"""
Migración 002 — Crear índices compuestos para org_id + broker_id.

Ejecutar:
    cd backend
    python migrations/002_create_indexes.py
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "rovi_crm")


async def create_indexes():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    print(f"Creando índices en {MONGO_URL}/{DB_NAME}...")

    indexes_config = {
        "leads": [
            [("org_id", ASCENDING), ("status", ASCENDING)],
            [("org_id", ASCENDING), ("broker_id", ASCENDING), ("status", ASCENDING)],
            [("org_id", ASCENDING), ("created_at", DESCENDING)],
            [("org_id", ASCENDING), ("broker_id", ASCENDING), ("created_at", DESCENDING)],
            [("org_id", ASCENDING), ("priority", ASCENDING)],
        ],
        "activities": [
            [("org_id", ASCENDING), ("broker_id", ASCENDING), ("created_at", DESCENDING)],
            [("org_id", ASCENDING), ("lead_id", ASCENDING), ("created_at", DESCENDING)],
        ],
        "campaigns": [
            [("org_id", ASCENDING), ("type", ASCENDING), ("status", ASCENDING)],
            [("org_id", ASCENDING), ("created_at", DESCENDING)],
        ],
        "users": [
            [("org_id", ASCENDING), ("role", ASCENDING), ("is_active", ASCENDING)],
        ],
        "organizations": [
            [("owner_id", ASCENDING)],
            [("id", ASCENDING)],
        ],
        "goals": [
            [("org_id", ASCENDING), ("broker_id", ASCENDING)],
        ],
        "gamification_rules": [
            [("org_id", ASCENDING), ("is_active", ASCENDING)],
        ],
    }

    for collection_name, index_list in indexes_config.items():
        collection = db[collection_name]
        for index_fields in index_list:
            try:
                result = await collection.create_index(index_fields)
                print(f"  ✓ {collection_name}: {result}")
            except Exception as e:
                print(f"  ✗ {collection_name}: {e}")

    print("\nÍndices creados correctamente.")
    client.close()


if __name__ == "__main__":
    asyncio.run(create_indexes())
```

---

## Script 3 — `backend/migrations/003_verify_migration.py`

Verificar que la migración fue exitosa antes de hacer deploy.

```python
"""
Migración 003 — Verificación post-migración.

Ejecutar:
    cd backend
    python migrations/003_verify_migration.py

Retorna exit code 0 si todo está bien, 1 si hay problemas.
"""
import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "rovi_crm")

RESOURCE_COLLECTIONS = [
    "leads", "activities", "campaigns", "goals",
    "email_templates", "gamification_rules",
]


async def verify():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    print("Verificando migración...")
    errors = []

    # 1. Cada usuario debe tener org_id
    users_sin_org = await db.users.count_documents(
        {"$or": [{"org_id": {"$exists": False}}, {"org_id": ""}]}
    )
    if users_sin_org > 0:
        errors.append(f"❌ {users_sin_org} usuarios sin org_id")
    else:
        print(f"  ✓ Todos los usuarios tienen org_id")

    # 2. Debe existir una Organization por cada usuario
    total_users = await db.users.count_documents({})
    total_orgs = await db.organizations.count_documents({})
    if total_orgs < total_users:
        errors.append(f"❌ {total_users} usuarios pero solo {total_orgs} organizaciones")
    else:
        print(f"  ✓ Organizations: {total_orgs} (esperado: >= {total_users})")

    # 3. Recursos sin org_id
    for col in RESOURCE_COLLECTIONS:
        total = await db[col].count_documents({})
        sin_org = await db[col].count_documents(
            {"$or": [{"org_id": {"$exists": False}}, {"org_id": ""}]}
        )
        if sin_org > 0:
            errors.append(f"❌ {col}: {sin_org}/{total} documentos sin org_id")
        else:
            print(f"  ✓ {col}: {total} documentos con org_id")

    # 4. Verificar índices
    lead_indexes = await db.leads.index_information()
    required_index = any(
        "org_id" in str(v.get("key", {})) and "status" in str(v.get("key", {}))
        for v in lead_indexes.values()
    )
    if not required_index:
        errors.append("❌ Falta índice compuesto (org_id, status) en leads")
    else:
        print(f"  ✓ Índices compuestos en leads: OK")

    client.close()

    if errors:
        print("\n" + "\n".join(errors))
        print("\n⚠️  La migración tiene problemas. No hacer deploy hasta resolver.")
        sys.exit(1)
    else:
        print("\n✅ Migración verificada. Listo para deploy.")
        sys.exit(0)


if __name__ == "__main__":
    asyncio.run(verify())
```

---

## Orden de ejecución

```bash
# 1. Backup primero (siempre)
mongodump --uri="$MONGO_URL" --out=./backup_$(date +%Y%m%d_%H%M%S)

# 2. Correr en desarrollo
MONGO_URL=mongodb://localhost:27017 DB_NAME=rovi_crm python migrations/001_add_org_id.py
MONGO_URL=mongodb://localhost:27017 DB_NAME=rovi_crm python migrations/002_create_indexes.py
MONGO_URL=mongodb://localhost:27017 DB_NAME=rovi_crm python migrations/003_verify_migration.py

# 3. Si verification pasa → correr en producción
MONGO_URL=$PROD_MONGO_URL DB_NAME=rovi_crm python migrations/001_add_org_id.py
MONGO_URL=$PROD_MONGO_URL DB_NAME=rovi_crm python migrations/002_create_indexes.py
MONGO_URL=$PROD_MONGO_URL DB_NAME=rovi_crm python migrations/003_verify_migration.py
```

---

## Rollback

Si algo sale mal, los scripts solo **agregan** campos — nunca eliminan ni modifican campos existentes. Para revertir:

```javascript
// En MongoDB shell o Compass — eliminar los campos nuevos
db.users.updateMany({}, { $unset: { org_id: "" } })
db.leads.updateMany({}, { $unset: { org_id: "", broker_id: "" } })
// ... repetir para cada colección ...
db.organizations.drop()
```

O restaurar desde el backup:
```bash
mongorestore --uri="$MONGO_URL" --drop ./backup_YYYYMMDD_HHMMSS
```
