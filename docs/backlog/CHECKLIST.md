# Checklist de implementación — Arquitectura 3 Capas

Usar este archivo para trackear el avance real. Marcar con `[x]` cada tarea completada.

---

## Fase 1 — MongoDB Multi-tenancy (Semanas 1-2)

### Código nuevo
- [ ] Crear `backend/permissions.py` con `build_resource_filter()` y `can_access_resource()`
- [ ] Crear carpeta `backend/migrations/`
- [ ] Crear `backend/migrations/001_add_org_id.py`
- [ ] Crear `backend/migrations/002_create_indexes.py`
- [ ] Crear `backend/migrations/003_verify_migration.py`

### Modificaciones en código existente
- [ ] `backend/models.py` — agregar clase `Organization` y `OrganizationType`
- [ ] `backend/models.py` — actualizar clase `User`: agregar `org_id`, mantener `tenant_id`
- [ ] `backend/models.py` — actualizar `UserResponse`: agregar `org_id`
- [ ] `backend/models.py` — agregar `org_id` + `broker_id` a modelo `Lead`
- [ ] `backend/models.py` — agregar `org_id` + `broker_id` a modelo `Activity`
- [ ] `backend/models.py` — agregar `org_id` + `broker_id` a modelo `Campaign`
- [ ] `backend/models.py` — agregar `org_id` + `broker_id` a modelo `Goal`
- [ ] `backend/models.py` — agregar `org_id` + `broker_id` a modelo `EmailTemplate`
- [ ] `backend/models.py` — agregar `org_id` + `broker_id` a modelo `GamificationRule`
- [ ] `backend/models.py` — agregar `org_id` + `broker_id` a modelos restantes
- [ ] `backend/auth.py` — incluir `org_id` en JWT payload
- [ ] `backend/auth.py` — incluir `org_id` en `get_current_user()`
- [ ] `backend/server.py` — registro de usuario crea `Organization` y asigna `org_id`
- [ ] `backend/server.py` — importar y usar `build_resource_filter()` en todos los GET de leads
- [ ] `backend/server.py` — importar y usar `build_resource_filter()` en GET de campaigns
- [ ] `backend/server.py` — importar y usar `build_resource_filter()` en GET de activities
- [ ] `backend/server.py` — importar y usar `build_resource_filter()` en dashboard stats
- [ ] `backend/server.py` — importar y usar `can_access_resource()` en GET by ID
- [ ] `backend/server.py` — llamar `create_indexes()` en startup

### Migración de datos
- [ ] Hacer backup de MongoDB antes de migrar
- [ ] Ejecutar `001_add_org_id.py` en entorno de desarrollo
- [ ] Ejecutar `002_create_indexes.py` en entorno de desarrollo
- [ ] Ejecutar `003_verify_migration.py` — debe retornar exit code 0
- [ ] Ejecutar los 3 scripts en producción
- [ ] Verificar migración en producción

### Tests
- [ ] `pytest tests/test_api_smoke.py` pasa sin errores
- [ ] `pytest tests/test_auth_unit.py` pasa sin errores
- [ ] `pytest -m integration` pasa sin errores (requiere backend corriendo)
- [ ] Test manual: broker A no puede ver leads de broker B en otra org
- [ ] Test manual: admin de agencia ve leads de todos sus brokers

---

## Fase 2 — Redis (Semanas 3-4)

### Infraestructura
- [ ] `docker-compose.yml` — agregar servicio `redis` con healthcheck
- [ ] `docker-compose.hostinger.yml` — mismo cambio para producción
- [ ] `docker-compose.dev.yml` — agregar Redis sin persistencia
- [ ] `docker-compose.preview.yml` — agregar Redis sin persistencia
- [ ] `requirements.txt` — agregar `redis[hiredis]>=5.0.0`

### Código nuevo
- [ ] Crear `backend/cache.py` con los 3 namespaces (agent sessions, cache, ratelimit)

### Modificaciones en código existente
- [ ] `backend/server.py` — importar y llamar `init_redis()` en startup
- [ ] `backend/server.py` — importar y llamar `close_redis()` en shutdown
- [ ] `backend/server.py` — agregar caché en endpoint `GET /dashboard/stats`
- [ ] `backend/server.py` — agregar caché en endpoint `GET /dashboard/pipeline`
- [ ] `backend/server.py` — invalidar caché en `POST /leads`
- [ ] `backend/server.py` — invalidar caché en `PATCH /leads/{id}`
- [ ] `backend/server.py` — invalidar caché en `DELETE /leads/{id}`
- [ ] `backend/server.py` — agregar endpoint `POST /ai/reset-session`
- [ ] `backend/ai_service.py` — integrar `get_agent_session()` y `save_agent_session()`
- [ ] `backend/ai_service.py` — integrar `check_rate_limit()` en chat endpoint
- [ ] `backend/.env` — agregar `REDIS_URL`
- [ ] Servidor producción — agregar `REDIS_URL` al `.env`

### Verificación
- [ ] `docker compose up` levanta Redis sin errores
- [ ] `docker compose exec redis redis-cli ping` responde `PONG`
- [ ] Test manual: el agente recuerda la conversación en el segundo mensaje
- [ ] Test manual: `/dashboard/stats` muestra cache hit en segundo request (verificar logs)
- [ ] Test manual: el rate limit bloquea después de 20 mensajes en 1 minuto

---

## Fase 3 — Supabase pgvector (Semanas 5-7)

### Configuración Supabase
- [ ] Crear proyecto en supabase.com
- [ ] Activar extensión `vector` en SQL Editor: `CREATE EXTENSION IF NOT EXISTS vector;`
- [ ] Ejecutar schema SQL completo (tabla + índices + RLS + función `search_knowledge`)
- [ ] Verificar que `search_knowledge()` existe: `SELECT proname FROM pg_proc WHERE proname = 'search_knowledge';`
- [ ] Guardar `SUPABASE_URL` y `SUPABASE_SERVICE_KEY`

### Dependencias
- [ ] `requirements.txt` — agregar `supabase>=2.0.0`
- [ ] `requirements.txt` — verificar `openai>=1.0.0`
- [ ] `backend/.env` — agregar `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `OPENAI_API_KEY`
- [ ] Servidor producción — agregar las 3 variables

### Código nuevo
- [ ] Crear `backend/knowledge_base.py` con `index_document()`, `upsert_document()`, `semantic_search()`, `format_rag_context()`
- [ ] Crear `backend/indexing_pipeline.py` con `index_activity()`, `index_vapi_transcript()`, `index_product()`, `index_script()`, `remove_from_index()`

### Modificaciones en código existente
- [ ] `backend/server.py` — hook en `POST /leads/{id}/activities` → llamar `index_activity()`
- [ ] `backend/server.py` — hook en `PUT /leads/{id}/activities/{id}` → llamar `index_activity()`
- [ ] `backend/server.py` — hook en `DELETE /leads/{id}/activities/{id}` → llamar `remove_from_index()`
- [ ] `backend/server.py` — hook en `POST /products` → llamar `index_product()`
- [ ] `backend/server.py` — hook en `PUT /products/{id}` → llamar `index_product()`
- [ ] `backend/server.py` — hook en `DELETE /products/{id}` → llamar `remove_from_index()`
- [ ] `backend/ai_service.py` — integrar `semantic_search()` antes de llamar al modelo
- [ ] `backend/ai_service.py` — integrar `format_rag_context()` en system prompt

### Indexación inicial (una sola vez)
- [ ] Crear y correr script `backend/migrations/004_initial_indexing.py` para indexar actividades y productos existentes

### Verificación
- [ ] Crear una actividad → verificar que aparece en Supabase Table Editor
- [ ] Hacer búsqueda de prueba: `SELECT * FROM search_knowledge('[embedding]', 'org-xxx')` en Supabase
- [ ] Test manual: el agente menciona datos del historial en una respuesta relevante
- [ ] Test manual: broker no ve documentos de otra organización (cruzar org_ids)
- [ ] Test manual: admin ve documentos de todos sus brokers
- [ ] Eliminar una actividad → verificar que desaparece de Supabase

---

## Script de indexación inicial — Fase 3

Crear `backend/migrations/004_initial_indexing.py`:

```python
"""
Migración 004 — Indexar datos existentes en Supabase pgvector.
Solo ejecutar UNA VEZ después de configurar Supabase.

Ejecutar:
    cd backend
    python migrations/004_initial_indexing.py
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from indexing_pipeline import index_activity, index_product, index_script

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "rovi_crm")
BATCH_SIZE = 50  # procesar en lotes para no saturar la API de OpenAI


async def initial_index():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    # Obtener todas las orgs para saber el org_id de cada recurso
    users = await db.users.find({}, {"id": 1, "org_id": 1}).to_list(None)
    user_to_org = {u["id"]: u.get("org_id", "") for u in users}

    # Indexar actividades
    print("Indexando actividades...")
    activities = await db.activities.find({}).to_list(None)
    indexed = 0
    for i in range(0, len(activities), BATCH_SIZE):
        batch = activities[i:i+BATCH_SIZE]
        for activity in batch:
            org_id = activity.get("org_id") or user_to_org.get(activity.get("user_id", ""), "")
            if org_id:
                try:
                    await index_activity(activity, org_id)
                    indexed += 1
                except Exception as e:
                    print(f"  Error en activity {activity.get('id')}: {e}")
        print(f"  Progreso: {min(i+BATCH_SIZE, len(activities))}/{len(activities)}")
        await asyncio.sleep(1)  # respetar rate limits de OpenAI

    print(f"Actividades indexadas: {indexed}/{len(activities)}")

    # Indexar productos
    print("\nIndexando productos...")
    products = await db.products.find({}).to_list(None)
    indexed = 0
    for product in products:
        org_id = product.get("org_id") or user_to_org.get(product.get("user_id", ""), "")
        if org_id:
            try:
                await index_product(product, org_id)
                indexed += 1
            except Exception as e:
                print(f"  Error en product {product.get('id')}: {e}")

    print(f"Productos indexados: {indexed}/{len(products)}")
    print("\nIndexación inicial completada.")
    client.close()


if __name__ == "__main__":
    asyncio.run(initial_index())
```

---

## Resumen de archivos nuevos por fase

| Fase | Archivo | Tipo |
|------|---------|------|
| 1 | `backend/permissions.py` | Nuevo |
| 1 | `backend/migrations/001_add_org_id.py` | Nuevo |
| 1 | `backend/migrations/002_create_indexes.py` | Nuevo |
| 1 | `backend/migrations/003_verify_migration.py` | Nuevo |
| 2 | `backend/cache.py` | Nuevo |
| 3 | `backend/knowledge_base.py` | Nuevo |
| 3 | `backend/indexing_pipeline.py` | Nuevo |
| 3 | `backend/migrations/004_initial_indexing.py` | Nuevo |
