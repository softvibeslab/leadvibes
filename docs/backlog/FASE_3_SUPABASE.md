# Fase 3 — Supabase pgvector: Base de conocimiento RAG

**Semanas:** 5-7  
**Prioridad:** 🟢 Media  
**Depende de:** Fase 1 (org_id) + Fase 2 (sesiones del agente en Redis)  
**Archivos afectados:** `requirements.txt`, `knowledge_base.py` (nuevo), `indexing_pipeline.py` (nuevo), `ai_service.py`, `server.py`

---

## Qué es RAG y por qué lo necesita Rovi

RAG (Retrieval-Augmented Generation) permite al agente de IA responder preguntas usando el historial real del CRM en lugar de inventar respuestas. Sin RAG, el agente solo conoce lo que está en el prompt del sistema. Con RAG, puede responder:

- _"¿Cuál fue el resultado de mi llamada con Carlos Mendoza la semana pasada?"_
- _"¿Qué propiedades de menos de $500k tenemos disponibles en La Veleta?"_
- _"¿Qué script usé para convertir leads de Instagram el mes pasado?"_

**Flujo:**
```
Pregunta del broker
       ↓
Generar embedding de la pregunta (OpenAI)
       ↓
Buscar documentos similares en Supabase pgvector
  (filtrados por org_id/broker_id — sin cruzar datos entre orgs)
       ↓
Inyectar documentos relevantes como contexto al prompt
       ↓
OpenAI genera respuesta fundamentada en datos reales
```

---

## Paso 3.1 — Configurar Supabase

### Crear proyecto
1. Ir a [supabase.com](https://supabase.com) → New Project
2. Región: us-east-1 (más cercana a México)
3. Guardar `Project URL` y `service_role key` (NO la anon key — necesitas la service key para el backend)
4. Agregar al `.env`: ver `ENV_VARIABLES.md`

### Activar extensión pgvector
En el SQL Editor de Supabase, ejecutar:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## Paso 3.2 — Schema SQL en Supabase

Ejecutar completo en el SQL Editor de Supabase:

```sql
-- ═══════════════════════════════════════════════════
-- Tabla principal: documentos indexados para RAG
-- ═══════════════════════════════════════════════════
CREATE TABLE knowledge_documents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Multi-tenancy: CRÍTICO — nunca mezclar datos entre orgs
    org_id      TEXT NOT NULL,
    broker_id   TEXT,           -- NULL = documento pertenece a toda la org
                                -- ej: catálogo de propiedades, scripts compartidos

    -- Clasificación
    doc_type    TEXT NOT NULL,
    -- Valores válidos:
    -- 'lead_note'        → nota o actividad de seguimiento de lead
    -- 'call_transcript'  → transcripción de llamada VAPI
    -- 'email_sent'       → email enviado a un lead
    -- 'product'          → propiedad del catálogo
    -- 'script'           → script de ventas o plantilla
    -- 'email_template'   → plantilla de email
    -- 'lead_summary'     → resumen IA de un lead completo

    source_id   TEXT,           -- ID del recurso original en MongoDB
    source_type TEXT,           -- colección MongoDB ('leads','activities',etc.)

    -- Contenido
    title       TEXT,
    content     TEXT NOT NULL,  -- texto plano para display y embedding
    metadata    JSONB DEFAULT '{}',

    -- Vector (OpenAI text-embedding-3-small = 1536 dimensiones)
    embedding   VECTOR(1536),

    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- Índices
-- ═══════════════════════════════════════════════════

-- Índice vectorial IVFFlat — rápido para < 1M documentos
-- lists=100 es un buen default; aumentar a 200 si superas 500k docs
CREATE INDEX idx_knowledge_embedding
ON knowledge_documents
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Índices para filtrado por tenant (siempre se aplican ANTES del vector search)
CREATE INDEX idx_knowledge_org      ON knowledge_documents (org_id);
CREATE INDEX idx_knowledge_broker   ON knowledge_documents (org_id, broker_id);
CREATE INDEX idx_knowledge_type     ON knowledge_documents (org_id, doc_type);
CREATE INDEX idx_knowledge_source   ON knowledge_documents (source_id);
CREATE INDEX idx_knowledge_updated  ON knowledge_documents (org_id, updated_at DESC);

-- ═══════════════════════════════════════════════════
-- Row Level Security — aislamiento por org_id
-- ═══════════════════════════════════════════════════

ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

-- La service_role key del backend bypasea RLS (correcto para el backend)
-- RLS aplica a queries desde el cliente directamente — segunda línea de defensa

CREATE POLICY "org_isolation"
ON knowledge_documents
FOR ALL
USING (org_id = current_setting('app.current_org_id', true));

-- ═══════════════════════════════════════════════════
-- Función de búsqueda semántica
-- ═══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION search_knowledge(
    query_embedding  VECTOR(1536),
    p_org_id         TEXT,
    p_broker_id      TEXT DEFAULT NULL,
    p_doc_types      TEXT[] DEFAULT NULL,
    match_threshold  FLOAT DEFAULT 0.70,
    match_count      INT DEFAULT 5
)
RETURNS TABLE (
    id          UUID,
    doc_type    TEXT,
    title       TEXT,
    content     TEXT,
    metadata    JSONB,
    broker_id   TEXT,
    source_id   TEXT,
    similarity  FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER   -- corre con permisos del owner, no del caller
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kd.id,
        kd.doc_type,
        kd.title,
        kd.content,
        kd.metadata,
        kd.broker_id,
        kd.source_id,
        (1 - (kd.embedding <=> query_embedding))::FLOAT AS similarity
    FROM knowledge_documents kd
    WHERE
        -- Filtro de org SIEMPRE primero (usa índice)
        kd.org_id = p_org_id

        -- Filtro de broker:
        --   broker_id = p_broker_id → documentos del broker específico
        --   broker_id IS NULL       → documentos compartidos de la org (catálogo, scripts)
        --   p_broker_id IS NULL     → admin/manager busca en toda la org
        AND (
            p_broker_id IS NULL
            OR kd.broker_id = p_broker_id
            OR kd.broker_id IS NULL
        )

        -- Filtro por tipo de documento (opcional)
        AND (p_doc_types IS NULL OR kd.doc_type = ANY(p_doc_types))

        -- Umbral de similaridad coseno
        AND (1 - (kd.embedding <=> query_embedding)) > match_threshold

    ORDER BY kd.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

---

## Paso 3.3 — Dependencias Python

### `requirements.txt` — agregar:

```
supabase>=2.0.0
openai>=1.0.0
```

---

## Paso 3.4 — Crear `backend/knowledge_base.py`

```python
"""
knowledge_base.py — Base de conocimiento vectorial para el agente de Rovi.

Funciones principales:
  index_document()   → indexa un documento nuevo
  update_document()  → actualiza embedding cuando cambia el contenido
  delete_document()  → elimina un documento por source_id
  semantic_search()  → búsqueda semántica con filtrado por org/broker
"""
import os
from typing import List, Dict, Optional, Any
from openai import AsyncOpenAI
from supabase import create_client, Client

# Clientes
_supabase: Optional[Client] = None
_openai: Optional[AsyncOpenAI] = None

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536
TABLE_NAME = "knowledge_documents"


def get_supabase() -> Client:
    global _supabase
    if not _supabase:
        _supabase = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"],
        )
    return _supabase


def get_openai() -> AsyncOpenAI:
    global _openai
    if not _openai:
        _openai = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _openai


# ─── Embeddings ───────────────────────────────────────────────────────────────

async def get_embedding(text: str) -> List[float]:
    """Genera embedding para texto usando OpenAI."""
    # Truncar a ~8000 tokens para evitar errores (límite del modelo)
    text = text[:30000]
    response = await get_openai().embeddings.create(
        input=text,
        model=EMBEDDING_MODEL,
        dimensions=EMBEDDING_DIMENSIONS,
    )
    return response.data[0].embedding


# ─── Indexación ───────────────────────────────────────────────────────────────

async def index_document(
    org_id: str,
    doc_type: str,
    content: str,
    broker_id: Optional[str] = None,
    source_id: Optional[str] = None,
    source_type: Optional[str] = None,
    title: Optional[str] = None,
    metadata: Optional[Dict] = None,
) -> str:
    """
    Genera embedding e indexa un documento en Supabase.
    Retorna el UUID del documento creado.

    broker_id=None → documento compartido de la org (catálogo, scripts)
    broker_id=X    → documento privado del broker X
    """
    if not content.strip():
        raise ValueError("content no puede estar vacío")

    embedding = await get_embedding(content)

    doc = {
        "org_id": org_id,
        "broker_id": broker_id,
        "doc_type": doc_type,
        "source_id": source_id,
        "source_type": source_type,
        "title": title or content[:80].replace("\n", " "),
        "content": content,
        "metadata": metadata or {},
        "embedding": embedding,
    }

    result = get_supabase().table(TABLE_NAME).insert(doc).execute()
    return result.data[0]["id"]


async def upsert_document(
    org_id: str,
    doc_type: str,
    content: str,
    source_id: str,
    broker_id: Optional[str] = None,
    source_type: Optional[str] = None,
    title: Optional[str] = None,
    metadata: Optional[Dict] = None,
) -> str:
    """
    Crea o actualiza un documento basado en source_id.
    Usar cuando el documento fuente puede haber sido actualizado.
    """
    existing = get_supabase().table(TABLE_NAME)\
        .select("id")\
        .eq("source_id", source_id)\
        .eq("org_id", org_id)\
        .execute()

    if existing.data:
        # Actualizar
        embedding = await get_embedding(content)
        get_supabase().table(TABLE_NAME).update({
            "content": content,
            "embedding": embedding,
            "title": title or content[:80].replace("\n", " "),
            "metadata": metadata or {},
            "updated_at": "NOW()",
        }).eq("source_id", source_id).eq("org_id", org_id).execute()
        return existing.data[0]["id"]
    else:
        # Crear
        return await index_document(
            org_id=org_id, doc_type=doc_type, content=content,
            broker_id=broker_id, source_id=source_id, source_type=source_type,
            title=title, metadata=metadata,
        )


async def delete_document(source_id: str, org_id: str):
    """Elimina un documento por su source_id (cuando se borra en MongoDB)."""
    get_supabase().table(TABLE_NAME)\
        .delete()\
        .eq("source_id", source_id)\
        .eq("org_id", org_id)\
        .execute()


# ─── Búsqueda semántica ───────────────────────────────────────────────────────

async def semantic_search(
    query: str,
    org_id: str,
    broker_id: Optional[str] = None,
    doc_types: Optional[List[str]] = None,
    limit: int = 5,
    similarity_threshold: float = 0.70,
) -> List[Dict]:
    """
    Búsqueda semántica sobre la base de conocimiento.

    Filtrado automático por rol:
      broker_id=X    → ve sus documentos + documentos compartidos de la org
      broker_id=None → admin/manager, ve todos los documentos de la org

    Retorna lista de documentos ordenados por relevancia (mayor similaridad primero).
    """
    if not query.strip():
        return []

    query_embedding = await get_embedding(query)

    result = get_supabase().rpc("search_knowledge", {
        "query_embedding": query_embedding,
        "p_org_id": org_id,
        "p_broker_id": broker_id,
        "p_doc_types": doc_types,
        "match_threshold": similarity_threshold,
        "match_count": limit,
    }).execute()

    return result.data or []


def format_rag_context(docs: List[Dict]) -> str:
    """
    Formatea los documentos recuperados como contexto para el prompt del agente.
    Listo para inyectar en el system prompt.
    """
    if not docs:
        return ""

    context = "\n\n### Información relevante de tu historial en Rovi:\n"
    for i, doc in enumerate(docs, 1):
        doc_type_labels = {
            "lead_note": "Nota de lead",
            "call_transcript": "Transcripción de llamada",
            "email_sent": "Email enviado",
            "product": "Propiedad/producto",
            "script": "Script de ventas",
            "email_template": "Plantilla de email",
            "lead_summary": "Resumen de lead",
        }
        label = doc_type_labels.get(doc.get("doc_type", ""), "Documento")
        similarity_pct = round(doc.get("similarity", 0) * 100)

        context += f"\n[{i}] {label} — {doc.get('title', '')} (relevancia: {similarity_pct}%)\n"
        # Truncar contenido largo para no explotar el contexto
        content = doc.get("content", "")[:600]
        context += f"{content}\n---"

    return context
```

---

## Paso 3.5 — Crear `backend/indexing_pipeline.py`

```python
"""
indexing_pipeline.py — Sincroniza recursos de MongoDB con el vector store.

Llamar estas funciones desde los endpoints de server.py después de
crear o actualizar recursos relevantes.
"""
from knowledge_base import upsert_document, delete_document
from typing import Dict, Optional


async def index_activity(activity: Dict, org_id: str):
    """
    Indexa una actividad (nota, llamada, email) de un lead.
    Solo indexa tipos relevantes — ignora actividades administrativas.
    """
    indexable_types = {"nota", "llamada", "whatsapp", "email", "zoom", "visita"}
    if activity.get("type") not in indexable_types:
        return

    lead_name = activity.get("lead_name", activity.get("lead_id", ""))
    content = f"""Actividad con {lead_name}
Tipo: {activity['type']}
Fecha: {activity.get('created_at', '')}
{activity.get('notes', activity.get('content', activity.get('description', '')))}
Resultado: {activity.get('result', '')}
Estado del lead: {activity.get('lead_status', '')}""".strip()

    await upsert_document(
        org_id=org_id,
        doc_type="lead_note",
        content=content,
        source_id=activity["id"],
        source_type="activities",
        broker_id=activity.get("broker_id"),
        title=f"Nota {activity['type']} — {lead_name}",
        metadata={
            "lead_id": activity.get("lead_id"),
            "lead_name": lead_name,
            "activity_type": activity["type"],
            "lead_status": activity.get("lead_status"),
        },
    )


async def index_vapi_transcript(call_record: Dict, org_id: str):
    """
    Indexa transcripción de llamada VAPI después de que termina.
    """
    transcript = call_record.get("transcript", "")
    summary = call_record.get("summary", "")
    if not transcript and not summary:
        return

    lead_name = call_record.get("lead_name", "")
    content = f"""Llamada con {lead_name}
Duración: {call_record.get('duration_minutes', 0)} minutos
Fecha: {call_record.get('created_at', '')}
Resultado: {call_record.get('outcome', '')}

{'Resumen: ' + summary if summary else ''}

{'Transcripción: ' + transcript[:2000] if transcript else ''}""".strip()

    await upsert_document(
        org_id=org_id,
        doc_type="call_transcript",
        content=content,
        source_id=call_record["id"],
        source_type="vapi_calls",
        broker_id=call_record.get("broker_id"),
        title=f"Llamada VAPI — {lead_name}",
        metadata={
            "lead_id": call_record.get("lead_id"),
            "lead_name": lead_name,
            "outcome": call_record.get("outcome"),
            "duration_minutes": call_record.get("duration_minutes"),
            "sentiment": call_record.get("sentiment_score"),
        },
    )


async def index_product(product: Dict, org_id: str):
    """
    Indexa una propiedad del catálogo.
    broker_id=None porque las propiedades son de toda la org.
    """
    features = product.get("features", [])
    features_str = ", ".join(features) if features else ""

    content = f"""Propiedad: {product.get('name', '')}
Tipo: {product.get('type', '')}
Zona: {product.get('zone', product.get('location', ''))}
Precio: {product.get('price', '')} {product.get('currency', 'USD')}
Estado: {product.get('status', 'disponible')}
Descripción: {product.get('description', '')}
Características: {features_str}
Amenidades: {product.get('amenities', '')}
Metros cuadrados: {product.get('sqm', '')}""".strip()

    await upsert_document(
        org_id=org_id,
        doc_type="product",
        content=content,
        source_id=product["id"],
        source_type="products",
        broker_id=None,   # compartido con toda la org
        title=f"{product.get('name', 'Propiedad')} — {product.get('zone', '')}",
        metadata={
            "price": product.get("price"),
            "type": product.get("type"),
            "zone": product.get("zone"),
            "status": product.get("status"),
            "sqm": product.get("sqm"),
        },
    )


async def index_script(script: Dict, org_id: str):
    """
    Indexa un script de ventas o plantilla de follow-up.
    """
    content = f"""Script: {script.get('name', '')}
Tipo: {script.get('type', '')}
Objetivo: {script.get('objective', '')}

{script.get('content', script.get('body', ''))}""".strip()

    await upsert_document(
        org_id=org_id,
        doc_type="script",
        content=content,
        source_id=script["id"],
        source_type="gamification_scripts",
        broker_id=None,   # scripts son compartidos
        title=script.get("name", "Script"),
        metadata={
            "type": script.get("type"),
            "objective": script.get("objective"),
        },
    )


async def remove_from_index(source_id: str, org_id: str):
    """
    Elimina un documento del vector store cuando se borra en MongoDB.
    Llamar desde los endpoints DELETE de server.py.
    """
    await delete_document(source_id=source_id, org_id=org_id)
```

---

## Paso 3.6 — Conectar pipeline a `backend/server.py`

Agregar hooks de indexación en los endpoints de escritura relevantes:

```python
from indexing_pipeline import (
    index_activity, index_product, index_script, remove_from_index
)

# Después de crear una actividad
@api_router.post("/leads/{lead_id}/activities")
async def create_activity(lead_id: str, activity: ActivityCreate, current_user=Depends(get_current_user)):
    # ... código existente de creación ...
    new_activity = { ...datos guardados... }

    # Indexar en background (no bloquea la respuesta)
    import asyncio
    asyncio.create_task(
        index_activity(new_activity, current_user["org_id"])
    )
    return new_activity


# Después de crear/actualizar un producto
@api_router.post("/products")
async def create_product(product: ProductCreate, current_user=Depends(get_current_user)):
    # ... código existente ...
    asyncio.create_task(
        index_product(new_product, current_user["org_id"])
    )
    return new_product


# Después de eliminar un recurso indexado
@api_router.delete("/leads/{lead_id}/activities/{activity_id}")
async def delete_activity(activity_id: str, current_user=Depends(get_current_user)):
    # ... código existente ...
    asyncio.create_task(
        remove_from_index(activity_id, current_user["org_id"])
    )
    return {"deleted": True}
```

---

## Paso 3.7 — Agente RAG completo en `backend/ai_service.py`

```python
from knowledge_base import semantic_search, format_rag_context
from cache import get_agent_session, save_agent_session, check_rate_limit

async def chat_with_agent(user_message: str, user: dict) -> dict:
    org_id = user["org_id"]
    user_id = user["user_id"]
    role = user.get("role", "broker")

    # 1. Rate limiting
    allowed = await check_rate_limit(org_id, user_id, "ai_chat", 20, 60)
    if not allowed:
        return {"error": "Límite de mensajes alcanzado.", "rate_limited": True}

    # 2. Historial de conversación (Redis)
    history = await get_agent_session(org_id, user_id)

    # 3. Búsqueda semántica (Supabase pgvector)
    # broker ve solo su contexto; admin/manager ve toda la org
    search_broker_id = user_id if role == "broker" else None

    relevant_docs = await semantic_search(
        query=user_message,
        org_id=org_id,
        broker_id=search_broker_id,
        limit=5,
        similarity_threshold=0.70,
    )
    rag_context = format_rag_context(relevant_docs)

    # 4. Construir system prompt
    ai_profile = user.get("ai_profile", {}) or {}
    system_prompt = f"""Eres el asistente de ventas inteligente de {user.get('name', 'el broker')} en Rovi CRM.
Especializado en propiedades de alto valor en Tulum, México.

Perfil del broker:
- Experiencia: {ai_profile.get('experience', 'No especificada')}
- Estilo: {ai_profile.get('style', 'Profesional')}
- Tipos de propiedad: {', '.join(ai_profile.get('property_types', []))}
- Zonas: {', '.join(ai_profile.get('focus_zones', []))}
- Objetivo: {ai_profile.get('goals', 'No especificado')}

{rag_context}

Instrucciones:
- Responde en español, de forma concisa y accionable
- Si citas información del historial, menciona de dónde viene
- Si no tienes información suficiente, dilo claramente
- Prioriza acciones que cierren ventas o avancen leads en el pipeline"""

    # 5. Llamar al modelo con historial completo
    history.append({"role": "user", "content": user_message})

    response = await get_openai().chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            *history,
        ],
        max_tokens=800,
        temperature=0.7,
    )

    answer = response.choices[0].message.content

    # 6. Guardar historial actualizado en Redis
    history.append({"role": "assistant", "content": answer})
    await save_agent_session(org_id, user_id, history)

    return {
        "response": answer,
        "sources_used": len(relevant_docs),
        "rate_limited": False,
    }
```

---

## Criterios de éxito — Fase 3

- [ ] La extensión `vector` está activa en Supabase (sin errores al correr el schema)
- [ ] `search_knowledge()` retorna resultados con similaridad > 0 en una búsqueda de prueba
- [ ] Crear una actividad en un lead la indexa automáticamente en Supabase (verificar en Table Editor)
- [ ] La búsqueda semántica respeta el filtro por org_id (un broker no ve documentos de otra org)
- [ ] Un broker buscando "leads calientes" NO ve notas de brokers de otra inmobiliaria
- [ ] Un admin buscando "leads calientes" SÍ ve notas de todos sus brokers
- [ ] El agente incluye referencias a documentos del historial en sus respuestas cuando es relevante
- [ ] Eliminar una actividad en MongoDB también la elimina del vector store
