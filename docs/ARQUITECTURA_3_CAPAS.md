# Plan Maestro: Arquitectura de 3 Capas — Rovi CRM

> **Objetivo:** Evolucionar Rovi de un CRM monolítico con multi-tenancy frágil a una arquitectura escalable que soporte: (1) aislamiento robusto broker/inmobiliaria, (2) estado conversacional del agente de IA, y (3) búsqueda semántica sobre el conocimiento del negocio.

---

## Estado actual vs. objetivo

| Aspecto | Hoy | Objetivo |
|---|---|---|
| Multi-tenancy | `tenant_id = "tenant-{user_id[:8]}"` (flat, frágil) | `org_id` + `broker_id` con jerarquía real |
| Caché / estado | Ninguno | Redis con TTL por sesión |
| IA / RAG | Consulta directa a MongoDB en cada mensaje | Vector store + RAG estructurado |
| Filtrado agente | Todo por `tenant_id` sin distinción de roles | Broker ve solo lo suyo; inmobiliaria ve toda su org |

---

## Resumen de las 3 Fases

```
FASE 1 — MongoDB Refactor (Semanas 1-2)
  └── Nuevo modelo org_id + broker_id
  └── Migración de datos existentes
  └── Nuevos índices compuestos
  └── Middleware de permisos centralizado

FASE 2 — Redis Layer (Semanas 3-4)
  └── Sesiones del agente de IA (contexto conversacional)
  └── Caché de queries frecuentes
  └── Rate limiting por org/broker
  └── Colas para campañas masivas

FASE 3 — Supabase pgvector RAG (Semanas 5-7)
  └── Vector store para conocimiento del negocio
  └── Pipeline de embeddings (leads, notas, llamadas VAPI)
  └── Filtrado semántico por org_id / broker_id
  └── Integración con el agente de IA existente
```

---

## FASE 1 — Refactor de Multi-tenancy en MongoDB

### Problema actual

```python
# server.py línea 179 — frágil y plano
tenant_id = f"tenant-{user_id[:8]}"
```

Este diseño trata a todos los usuarios como entidades independientes. No existe el concepto de "inmobiliaria que agrupa brokers". Cuando una agencia quiere ver los leads de todos sus brokers, no hay un query limpio.

### Nuevo modelo de jerarquía

```
Organization (inmobiliaria o broker independiente)
  ├── id: org_id  (ej: "org-abc123")
  ├── type: "agency" | "individual"
  └── Users (brokers/managers)
       ├── user_id: "usr-xyz789"
       ├── org_id: "org-abc123"   ← FK a la organización
       ├── role: "admin" | "manager" | "broker"
       └── Resources (leads, deals, campaigns...)
            ├── org_id: "org-abc123"   ← para queries de agencia
            └── broker_id: "usr-xyz789" ← para queries de broker
```

### Paso 1.1 — Nuevo modelo `Organization` en `models.py`

```python
class OrganizationType(str, Enum):
    INDIVIDUAL = "individual"   # broker independiente
    AGENCY = "agency"           # inmobiliaria

class Organization(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    name: str
    type: OrganizationType = OrganizationType.INDIVIDUAL
    owner_id: str                    # user_id del creador/admin
    plan: str = "free"               # free, pro, enterprise
    settings: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=now_utc)
    is_active: bool = True
```

### Paso 1.2 — Actualizar el modelo `User`

```python
class User(UserBase):
    id: str = Field(default_factory=generate_uuid)
    created_at: datetime = Field(default_factory=now_utc)
    onboarding_completed: bool = False
    
    # REEMPLAZA tenant_id con estructura clara
    org_id: str = ""              # FK a Organization.id
    role: str = "broker"          # admin | manager | broker
    
    # Mantener account_type para compatibilidad hacia atrás durante migración
    account_type: str = "individual"
    
    ai_profile: Optional['AIProfile'] = None
```

### Paso 1.3 — Actualizar todos los modelos de recursos

Todos los modelos que hoy tienen `tenant_id` deben tener **ambos campos**:

```python
# Ejemplo: modelo Lead actualizado
class Lead(LeadBase):
    id: str = Field(default_factory=generate_uuid)
    
    # NUEVO: doble FK para queries eficientes
    org_id: str = ""              # siempre presente — permite query de agencia
    broker_id: str = ""           # user_id del broker asignado
    
    # DEPRECADO: mantener durante migración, luego eliminar
    tenant_id: str = ""
    
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)
    # ... resto de campos
```

Modelos afectados: `Lead`, `Deal`, `Campaign`, `Activity`, `Goal`, `EmailTemplate`, `GamificationRule`, `AIProfile`, `IntegrationSettings`, `Product`.

### Paso 1.4 — Middleware de permisos centralizado

Crear `backend/permissions.py`:

```python
from enum import Enum
from typing import Dict, Any

class AccessScope(str, Enum):
    OWN = "own"         # solo recursos del propio broker
    ORG = "org"         # todos los recursos de la organización

def build_resource_filter(user: Dict[str, Any], 
                           scope: AccessScope = None) -> Dict[str, Any]:
    """
    Construye el filtro MongoDB correcto según el rol del usuario.
    
    - broker individual o scope=OWN → filtra por broker_id (solo sus recursos)
    - admin/manager o scope=ORG    → filtra por org_id (todos en la org)
    
    Uso:
        filter = build_resource_filter(current_user)
        leads = await db.leads.find(filter).to_list(None)
    """
    org_id = user.get("org_id", "")
    user_id = user.get("user_id", "")
    role = user.get("role", "broker")
    account_type = user.get("account_type", "individual")
    
    # Admins y managers de agencias ven toda la organización
    if role in ("admin", "manager") and account_type == "agency":
        return {"org_id": org_id}
    
    # Override explícito de scope
    if scope == AccessScope.ORG:
        return {"org_id": org_id}
    
    # Caso default: broker ve solo sus propios recursos
    return {"org_id": org_id, "broker_id": user_id}


def can_access_resource(user: Dict[str, Any], resource: Dict[str, Any]) -> bool:
    """Verifica si el usuario puede acceder a un recurso específico."""
    org_id = user.get("org_id", "")
    user_id = user.get("user_id", "")
    role = user.get("role", "broker")
    
    # Mismo org es requisito mínimo siempre
    if resource.get("org_id") != org_id:
        return False
    
    # Admin/manager ven todos los recursos de su org
    if role in ("admin", "manager"):
        return True
    
    # Broker solo ve sus propios recursos
    return resource.get("broker_id") == user_id
```

### Paso 1.5 — Actualizar `server.py` — registro de usuarios

```python
# ANTES (línea 179)
tenant_id = f"tenant-{user_id[:8]}"

# DESPUÉS
# Crear o recuperar Organization
org = await db.organizations.find_one({"owner_id": user_id})
if not org:
    org_id = f"org-{str(uuid.uuid4())[:12]}"
    org_doc = {
        "id": org_id,
        "name": user_data.get("name", "Mi Organización"),
        "type": user_data.get("account_type", "individual"),
        "owner_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True,
    }
    await db.organizations.insert_one(org_doc)
else:
    org_id = org["id"]

# Usuario siempre tiene org_id + broker_id propio
user_doc = {
    ...
    "org_id": org_id,
    "broker_id": user_id,    # cada broker es su propio broker_id
    "tenant_id": org_id,     # backward compat durante transición
}
```

### Paso 1.6 — Script de migración de datos existentes

Crear `backend/migrations/001_add_org_id.py`:

```python
"""
Migración: Agrega org_id y broker_id a todos los documentos existentes.
Crea una Organization por cada usuario existente (modo individual).
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime, timezone

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "rovi_crm"

RESOURCE_COLLECTIONS = [
    "leads", "activities", "campaigns", "goals",
    "email_templates", "gamification_rules", "ai_profiles",
    "integration_settings", "products"
]

async def migrate():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # 1. Para cada usuario existente, crear Organization
    users = await db.users.find({}).to_list(None)
    print(f"Migrando {len(users)} usuarios...")
    
    user_to_org = {}
    
    for user in users:
        user_id = user["id"]
        old_tenant_id = user.get("tenant_id", "")
        
        # Crear org para este usuario
        org_id = f"org-{str(uuid.uuid4())[:12]}"
        org_doc = {
            "id": org_id,
            "name": user.get("name", "Organización"),
            "type": user.get("account_type", "individual"),
            "owner_id": user_id,
            "legacy_tenant_id": old_tenant_id,  # guardar para referencia
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True,
        }
        await db.organizations.update_one(
            {"owner_id": user_id},
            {"$setOnInsert": org_doc},
            upsert=True
        )
        
        user_to_org[user_id] = org_id
        user_to_org[old_tenant_id] = org_id  # mapeo por tenant_id también
        
        # Actualizar usuario
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"org_id": org_id, "broker_id": user_id}}
        )
    
    # 2. Actualizar todos los recursos
    for collection_name in RESOURCE_COLLECTIONS:
        collection = db[collection_name]
        docs = await collection.find({}).to_list(None)
        
        updated = 0
        for doc in docs:
            tenant_id = doc.get("tenant_id", "")
            user_id = doc.get("user_id", doc.get("broker_id", ""))
            
            org_id = user_to_org.get(tenant_id) or user_to_org.get(user_id, "")
            broker_id = user_id
            
            if org_id:
                await collection.update_one(
                    {"_id": doc["_id"]},
                    {"$set": {"org_id": org_id, "broker_id": broker_id}}
                )
                updated += 1
        
        print(f"  {collection_name}: {updated}/{len(docs)} documentos actualizados")
    
    print("Migración completada.")
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate())
```

### Paso 1.7 — Nuevos índices compuestos en MongoDB

Crear `backend/migrations/002_create_indexes.py`:

```python
async def create_indexes(db):
    """Índices compuestos para queries eficientes por org/broker."""
    
    # Leads: los dos patrones de query más frecuentes
    await db.leads.create_index([("org_id", 1), ("status", 1)])
    await db.leads.create_index([("org_id", 1), ("broker_id", 1), ("status", 1)])
    await db.leads.create_index([("org_id", 1), ("created_at", -1)])
    
    # Activities: timeline por broker
    await db.activities.create_index([("org_id", 1), ("broker_id", 1), ("created_at", -1)])
    
    # Campaigns: por tipo y estado
    await db.campaigns.create_index([("org_id", 1), ("type", 1), ("status", 1)])
    
    # Users: lookup por org
    await db.users.create_index([("org_id", 1), ("role", 1), ("is_active", 1)])
    await db.organizations.create_index([("owner_id", 1)], unique=True)
    
    print("Índices creados correctamente.")
```

---

## FASE 2 — Capa Redis

### Objetivo

Redis no reemplaza MongoDB. Resuelve tres problemas específicos que MongoDB no maneja bien: estado efímero del agente, caché de queries costosas, y colas de campañas masivas.

### Paso 2.1 — Agregar Redis a Docker Compose

```yaml
# Agregar a docker-compose.yml y docker-compose.hostinger.yml
redis:
  image: redis:7-alpine
  restart: unless-stopped
  ports:
    - "6379:6379"
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
  volumes:
    - redis_data:/data
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 3s
    retries: 5

volumes:
  mongodb_data:
  backend_uploads:
  redis_data:   # nuevo
```

### Paso 2.2 — Agregar dependencia Python

```bash
# requirements.txt
redis[hiredis]>=5.0.0
```

### Paso 2.3 — Crear `backend/cache.py`

```python
"""
Módulo de caché y estado usando Redis.
Tres namespaces principales:
  - agent:session:{org_id}:{user_id}  → historial conversacional del agente
  - cache:{org_id}:{resource}:{hash}  → caché de queries MongoDB costosas
  - ratelimit:{org_id}:{user_id}      → rate limiting por usuario
"""
import json
import hashlib
from typing import Any, Optional, List, Dict
import redis.asyncio as aioredis
from datetime import timedelta

redis_client: Optional[aioredis.Redis] = None

async def init_redis(redis_url: str = "redis://localhost:6379"):
    global redis_client
    redis_client = aioredis.from_url(redis_url, decode_responses=True)

async def close_redis():
    if redis_client:
        await redis_client.close()

# ─── Sesiones del Agente ────────────────────────────────────────────────────

AGENT_SESSION_TTL = 60 * 60 * 24  # 24 horas

async def get_agent_session(org_id: str, user_id: str) -> List[Dict]:
    """Recupera el historial de conversación del agente para este usuario."""
    key = f"agent:session:{org_id}:{user_id}"
    data = await redis_client.get(key)
    return json.loads(data) if data else []

async def save_agent_session(org_id: str, user_id: str, 
                              messages: List[Dict], ttl: int = AGENT_SESSION_TTL):
    """Guarda el historial. Mantiene solo los últimos 20 mensajes."""
    key = f"agent:session:{org_id}:{user_id}"
    trimmed = messages[-20:]  # ventana deslizante de 20 mensajes
    await redis_client.setex(key, ttl, json.dumps(trimmed))

async def clear_agent_session(org_id: str, user_id: str):
    """Limpia la sesión del agente (útil para 'nueva conversación')."""
    key = f"agent:session:{org_id}:{user_id}"
    await redis_client.delete(key)

# ─── Caché de Queries ────────────────────────────────────────────────────────

async def get_cached(org_id: str, resource: str, params: Dict) -> Optional[Any]:
    """
    Recupera resultado cacheado de una query.
    params se serializa a hash para generar una key única.
    """
    params_hash = hashlib.md5(json.dumps(params, sort_keys=True).encode()).hexdigest()[:8]
    key = f"cache:{org_id}:{resource}:{params_hash}"
    data = await redis_client.get(key)
    return json.loads(data) if data else None

async def set_cached(org_id: str, resource: str, params: Dict, 
                      value: Any, ttl_seconds: int = 300):
    """Cachea el resultado de una query por TTL segundos (default 5 min)."""
    params_hash = hashlib.md5(json.dumps(params, sort_keys=True).encode()).hexdigest()[:8]
    key = f"cache:{org_id}:{resource}:{params_hash}"
    await redis_client.setex(key, ttl_seconds, json.dumps(value, default=str))

async def invalidate_cache(org_id: str, resource: str):
    """Invalida todo el caché de un recurso cuando hay escrituras."""
    pattern = f"cache:{org_id}:{resource}:*"
    keys = await redis_client.keys(pattern)
    if keys:
        await redis_client.delete(*keys)

# ─── Rate Limiting ───────────────────────────────────────────────────────────

async def check_rate_limit(org_id: str, user_id: str, 
                            action: str, max_calls: int, window_seconds: int) -> bool:
    """
    Retorna True si la acción está permitida, False si supera el límite.
    Usa sliding window con Redis INCR + EXPIRE.
    """
    key = f"ratelimit:{org_id}:{user_id}:{action}"
    current = await redis_client.incr(key)
    if current == 1:
        await redis_client.expire(key, window_seconds)
    return current <= max_calls
```

### Paso 2.4 — Integrar Redis en el agente de IA (`ai_service.py`)

```python
# Antes (en cada mensaje, el agente no recuerda nada)
async def chat_with_agent(user_message: str, user: dict) -> str:
    response = await openai_client.chat(messages=[
        {"role": "user", "content": user_message}
    ])
    return response

# Después (con memoria de sesión en Redis)
async def chat_with_agent(user_message: str, user: dict) -> str:
    org_id = user["org_id"]
    user_id = user["user_id"]
    
    # 1. Recuperar historial previo
    history = await get_agent_session(org_id, user_id)
    
    # 2. Añadir mensaje nuevo
    history.append({"role": "user", "content": user_message})
    
    # 3. Llamar al modelo con contexto completo
    response = await openai_client.chat(messages=[
        {"role": "system", "content": build_system_prompt(user)},
        *history
    ])
    
    answer = response.choices[0].message.content
    
    # 4. Guardar historial actualizado
    history.append({"role": "assistant", "content": answer})
    await save_agent_session(org_id, user_id, history)
    
    return answer
```

### Paso 2.5 — Caché en endpoints de alto tráfico

```python
# Ejemplo: dashboard stats (se recalculan cada 5 min, no en cada request)
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    org_id = current_user["org_id"]
    filter_key = build_resource_filter(current_user)
    
    # Intentar desde caché
    cached = await get_cached(org_id, "dashboard_stats", filter_key)
    if cached:
        return cached
    
    # Query real a MongoDB
    stats = await compute_dashboard_stats(filter_key)
    
    # Guardar en caché por 5 minutos
    await set_cached(org_id, "dashboard_stats", filter_key, stats, ttl_seconds=300)
    
    return stats

# Invalidar caché cuando hay nuevos leads
@api_router.post("/leads")
async def create_lead(lead: LeadCreate, current_user: dict = Depends(get_current_user)):
    # ... crear lead ...
    await invalidate_cache(current_user["org_id"], "dashboard_stats")
    await invalidate_cache(current_user["org_id"], "pipeline_stats")
    return new_lead
```

---

## FASE 3 — Supabase pgvector (Base de Conocimiento para el Agente)

### Por qué Supabase y no Atlas Vector Search

MongoDB Atlas Vector Search requiere cluster M10+ (~$57/mes mínimo). Supabase tiene vector search en el plan gratuito hasta 500MB. Para un CRM de Tulum en crecimiento, Supabase es la opción correcta en costo/beneficio.

### Paso 3.1 — Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New Project
2. Guardar `SUPABASE_URL` y `SUPABASE_SERVICE_KEY` en el `.env` del backend
3. Activar la extensión `pgvector` en SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Paso 3.2 — Schema del vector store en Supabase

```sql
-- Tabla principal de documentos embebidos
CREATE TABLE knowledge_documents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenancy: CRÍTICO para filtrar por org/broker
    org_id      TEXT NOT NULL,
    broker_id   TEXT,           -- NULL si aplica a toda la org
    
    -- Clasificación del documento
    doc_type    TEXT NOT NULL,  -- 'lead_note', 'call_transcript', 'script', 
                                --  'product', 'email_template', 'lead_summary'
    source_id   TEXT,           -- ID del recurso original en MongoDB
    
    -- Contenido
    title       TEXT,
    content     TEXT NOT NULL,  -- texto plano para display
    metadata    JSONB DEFAULT '{}',  -- datos extra (lead_status, score, etc.)
    
    -- Vector
    embedding   VECTOR(1536),   -- OpenAI text-embedding-3-small
    
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índice vectorial (IVFFlat es más rápido para datasets < 1M docs)
CREATE INDEX idx_knowledge_embedding 
ON knowledge_documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Índices para filtrado por tenant
CREATE INDEX idx_knowledge_org    ON knowledge_documents (org_id);
CREATE INDEX idx_knowledge_broker ON knowledge_documents (org_id, broker_id);
CREATE INDEX idx_knowledge_type   ON knowledge_documents (org_id, doc_type);

-- Row Level Security: ningún query puede cruzar org_ids
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: solo documentos de tu propia org
CREATE POLICY "org_isolation" ON knowledge_documents
FOR ALL USING (org_id = current_setting('app.current_org_id', true));
```

### Paso 3.3 — Crear `backend/knowledge_base.py`

```python
"""
Base de conocimiento vectorial usando Supabase pgvector.
Permite al agente de IA hacer búsqueda semántica sobre:
- Notas y actividades de leads
- Transcripciones de llamadas VAPI
- Scripts de ventas
- Catálogo de propiedades/productos
- Plantillas de email
"""
import os
from typing import List, Dict, Optional, Any
from openai import AsyncOpenAI
from supabase import create_client, Client

supabase: Client = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"]
)
openai_client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536

# ─── Embeddings ──────────────────────────────────────────────────────────────

async def get_embedding(text: str) -> List[float]:
    """Genera embedding para un texto usando OpenAI."""
    response = await openai_client.embeddings.create(
        input=text,
        model=EMBEDDING_MODEL,
        dimensions=EMBEDDING_DIMENSIONS
    )
    return response.data[0].embedding

# ─── Indexar documentos ──────────────────────────────────────────────────────

async def index_document(
    org_id: str,
    doc_type: str,
    content: str,
    broker_id: Optional[str] = None,
    source_id: Optional[str] = None,
    title: Optional[str] = None,
    metadata: Optional[Dict] = None
) -> str:
    """
    Genera embedding e indexa un documento en la base de conocimiento.
    Retorna el ID del documento creado.
    """
    embedding = await get_embedding(content)
    
    doc = {
        "org_id": org_id,
        "broker_id": broker_id,
        "doc_type": doc_type,
        "source_id": source_id,
        "title": title or content[:80],
        "content": content,
        "metadata": metadata or {},
        "embedding": embedding,
    }
    
    result = supabase.table("knowledge_documents").insert(doc).execute()
    return result.data[0]["id"]

async def update_document_index(source_id: str, org_id: str, 
                                  new_content: str, metadata: Dict = None):
    """Actualiza el embedding cuando el documento fuente cambia."""
    embedding = await get_embedding(new_content)
    
    supabase.table("knowledge_documents").update({
        "content": new_content,
        "embedding": embedding,
        "metadata": metadata or {},
        "updated_at": "NOW()"
    }).eq("source_id", source_id).eq("org_id", org_id).execute()

# ─── Búsqueda semántica ──────────────────────────────────────────────────────

async def semantic_search(
    query: str,
    org_id: str,
    broker_id: Optional[str] = None,   # None = busca en toda la org
    doc_types: Optional[List[str]] = None,
    limit: int = 5,
    similarity_threshold: float = 0.7
) -> List[Dict]:
    """
    Búsqueda semántica en la base de conocimiento.
    Respeta automáticamente el aislamiento por org_id.
    
    Si broker_id se provee → busca solo documentos de ese broker
    Si broker_id es None   → busca en toda la organización (modo agencia)
    """
    query_embedding = await get_embedding(query)
    
    # RPC call a la función SQL de búsqueda vectorial
    params = {
        "query_embedding": query_embedding,
        "p_org_id": org_id,
        "p_broker_id": broker_id,
        "p_doc_types": doc_types,
        "match_threshold": similarity_threshold,
        "match_count": limit,
    }
    
    result = supabase.rpc("search_knowledge", params).execute()
    return result.data

# ─── Función SQL de búsqueda (crear en Supabase) ────────────────────────────
"""
CREATE OR REPLACE FUNCTION search_knowledge(
    query_embedding  VECTOR(1536),
    p_org_id         TEXT,
    p_broker_id      TEXT DEFAULT NULL,
    p_doc_types      TEXT[] DEFAULT NULL,
    match_threshold  FLOAT DEFAULT 0.7,
    match_count      INT DEFAULT 5
)
RETURNS TABLE (
    id          UUID,
    doc_type    TEXT,
    title       TEXT,
    content     TEXT,
    metadata    JSONB,
    broker_id   TEXT,
    similarity  FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        kd.id,
        kd.doc_type,
        kd.title,
        kd.content,
        kd.metadata,
        kd.broker_id,
        1 - (kd.embedding <=> query_embedding) AS similarity
    FROM knowledge_documents kd
    WHERE
        kd.org_id = p_org_id
        AND (p_broker_id IS NULL OR kd.broker_id = p_broker_id 
             OR kd.broker_id IS NULL)
        AND (p_doc_types IS NULL OR kd.doc_type = ANY(p_doc_types))
        AND 1 - (kd.embedding <=> query_embedding) > match_threshold
    ORDER BY kd.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
"""
```

### Paso 3.4 — Pipeline de indexación automática

Crear `backend/indexing_pipeline.py`:

```python
"""
Pipeline para mantener la base de conocimiento sincronizada con MongoDB.
Se ejecuta en background cuando hay cambios relevantes.
"""
from knowledge_base import index_document, update_document_index

async def index_lead_activity(activity: dict, org_id: str):
    """Indexa una nota o actividad de lead para búsqueda semántica."""
    if activity.get("type") not in ("nota", "llamada", "whatsapp", "email"):
        return
    
    content = f"""
    Actividad de lead: {activity.get('lead_name', '')}
    Tipo: {activity['type']}
    Fecha: {activity['created_at']}
    Contenido: {activity.get('notes', activity.get('content', ''))}
    Resultado: {activity.get('result', '')}
    """.strip()
    
    await index_document(
        org_id=org_id,
        broker_id=activity.get("broker_id"),
        doc_type="lead_note",
        source_id=activity["id"],
        content=content,
        metadata={
            "lead_id": activity.get("lead_id"),
            "activity_type": activity["type"],
            "lead_status": activity.get("lead_status"),
        }
    )

async def index_vapi_transcript(call_record: dict, org_id: str):
    """Indexa transcripción de llamada VAPI."""
    transcript = call_record.get("transcript", "")
    if not transcript:
        return
    
    content = f"""
    Transcripción de llamada — {call_record.get('lead_name', '')}
    Duración: {call_record.get('duration_minutes', 0)} min
    Fecha: {call_record.get('created_at')}
    {transcript}
    """.strip()
    
    await index_document(
        org_id=org_id,
        broker_id=call_record.get("broker_id"),
        doc_type="call_transcript",
        source_id=call_record["id"],
        content=content,
        metadata={
            "lead_id": call_record.get("lead_id"),
            "call_outcome": call_record.get("outcome"),
            "sentiment": call_record.get("sentiment_score"),
        }
    )

async def index_product(product: dict, org_id: str):
    """Indexa propiedad/producto del catálogo."""
    content = f"""
    Propiedad: {product.get('name', '')}
    Tipo: {product.get('type', '')}
    Zona: {product.get('zone', '')}
    Precio: {product.get('price', '')}
    Descripción: {product.get('description', '')}
    Características: {', '.join(product.get('features', []))}
    Estado: {product.get('status', '')}
    """.strip()
    
    await index_document(
        org_id=org_id,
        broker_id=None,  # propiedades son de la org, no de un broker
        doc_type="product",
        source_id=product["id"],
        content=content,
        metadata={
            "price": product.get("price"),
            "type": product.get("type"),
            "zone": product.get("zone"),
            "status": product.get("status"),
        }
    )
```

### Paso 3.5 — Agente con RAG completo

```python
# Actualización final de ai_service.py integrando las 3 capas

async def chat_with_agent(user_message: str, user: dict) -> str:
    org_id = user["org_id"]
    user_id = user["user_id"]
    role = user.get("role", "broker")
    
    # ── Capa 2: Redis — recuperar historial ──────────────────────────
    history = await get_agent_session(org_id, user_id)
    
    # ── Capa 3: Supabase — búsqueda semántica en knowledge base ──────
    # Brokers ven solo su contexto; admins/managers ven toda la org
    search_broker_id = user_id if role == "broker" else None
    
    relevant_docs = await semantic_search(
        query=user_message,
        org_id=org_id,
        broker_id=search_broker_id,
        limit=5
    )
    
    # Construir contexto RAG
    rag_context = ""
    if relevant_docs:
        rag_context = "\n\n### Contexto relevante de tu base de conocimiento:\n"
        for doc in relevant_docs:
            rag_context += f"\n[{doc['doc_type']}] {doc['title']}\n{doc['content'][:500]}\n---"
    
    # ── Capa 1: MongoDB — datos operacionales en tiempo real ──────────
    # Solo para queries explícitas de datos actuales
    live_data = await fetch_live_context(user_message, user)
    
    # ── Construir prompt final ────────────────────────────────────────
    system_prompt = f"""
    Eres el asistente de ventas de {user.get('name')} en Rovi CRM.
    Especializado en propiedades de alto valor en Tulum, México.
    
    Perfil del broker: {user.get('ai_profile', {})}
    Rol: {role} | Organización: {org_id}
    
    {rag_context}
    {live_data}
    
    Responde en español, de forma concisa y accionable.
    """.strip()
    
    history.append({"role": "user", "content": user_message})
    
    response = await openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            *history
        ],
        max_tokens=800
    )
    
    answer = response.choices[0].message.content
    history.append({"role": "assistant", "content": answer})
    
    # ── Guardar historial actualizado ─────────────────────────────────
    await save_agent_session(org_id, user_id, history)
    
    return answer
```

---

## Variables de entorno a agregar

```bash
# backend/.env

# Redis
REDIS_URL=redis://redis:6379

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# OpenAI (ya existente, verificar)
OPENAI_API_KEY=sk-...
```

## Dependencias Python a agregar

```
# requirements.txt
redis[hiredis]>=5.0.0
supabase>=2.0.0
openai>=1.0.0
```

---

## Criterios de éxito por fase

### Fase 1 — Multi-tenancy
- [ ] Todos los documentos en MongoDB tienen `org_id` y `broker_id`
- [ ] `build_resource_filter()` es el único punto de entrada para queries
- [ ] Un broker no puede ver leads de otro broker de otra organización
- [ ] Un admin de agencia ve leads de todos sus brokers con un solo query
- [ ] Los tests de integración existentes siguen pasando

### Fase 2 — Redis
- [ ] El agente recuerda el contexto de la conversación entre mensajes
- [ ] El dashboard no hace queries a MongoDB en cada refresh (caché 5 min)
- [ ] Los campañas masivas de email/SMS se encolan en Redis, no bloquean el API
- [ ] Rate limiting activo para endpoints de IA

### Fase 3 — Supabase pgvector
- [ ] Las notas de leads se indexan automáticamente al crearse
- [ ] Las transcripciones de VAPI se indexan al finalizar la llamada
- [ ] El agente cita documentos relevantes en sus respuestas
- [ ] Un broker solo ve documentos de su propia actividad en el RAG
- [ ] Un admin de agencia puede hacer preguntas sobre cualquier broker

---

## Orden de implementación recomendado

```
Semana 1:  Fase 1 — models.py + permissions.py + migration script
Semana 2:  Fase 1 — actualizar server.py + tests + verificar aislamiento
Semana 3:  Fase 2 — Redis en Docker + cache.py + sesiones del agente
Semana 4:  Fase 2 — caché de endpoints + invalidación + rate limiting
Semana 5:  Fase 3 — Supabase setup + schema SQL + knowledge_base.py
Semana 6:  Fase 3 — indexing_pipeline.py + hooks en server.py
Semana 7:  Fase 3 — agente RAG completo + pruebas end-to-end
```

---

*Documento generado: 2026-04-30 | Rovi CRM Architecture Plan v1.0*
