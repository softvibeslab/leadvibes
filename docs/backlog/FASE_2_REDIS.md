# Fase 2 — Redis: Estado del agente + caché + colas

**Semanas:** 3-4  
**Prioridad:** 🟡 Alta  
**Depende de:** Fase 1 completada (`org_id` disponible en `current_user`)  
**Archivos afectados:** `docker-compose.yml`, `requirements.txt`, `cache.py` (nuevo), `server.py`, `ai_service.py`

---

## Qué resuelve Redis en Rovi

| Problema actual | Solución |
|----------------|----------|
| El agente olvida todo entre mensajes | Sesiones conversacionales con TTL 24h |
| El dashboard recalcula stats en cada request | Caché de queries costosas, 5 min TTL |
| Las campañas masivas bloquean el API | Cola de tareas en Redis |
| No hay límite de uso de la IA por broker | Rate limiting por org/broker |

**Redis NO reemplaza MongoDB.** Es una capa de acceso rápido para datos efímeros y estado temporal.

---

## Paso 2.1 — Agregar Redis a Docker Compose

### `docker-compose.yml` y `docker-compose.hostinger.yml`

Agregar el servicio Redis en la sección `services:` y el volumen al final:

```yaml
services:
  # ... servicios existentes (mongodb, backend, frontend) ...

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: >
      redis-server
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
      --save 60 1
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
  redis_data:    # NUEVO
```

### `docker-compose.dev.yml` y `docker-compose.preview.yml`

Mismo bloque Redis, sin persistencia de datos (entorno de desarrollo):

```yaml
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru
    # sin volumen en dev — datos efímeros está bien
```

---

## Paso 2.2 — Dependencias Python

### `requirements.txt` — agregar:

```
redis[hiredis]>=5.0.0
```

`hiredis` es el parser en C de Redis. Mismo paquete, mucho más rápido para respuestas largas (como el historial del agente en JSON).

---

## Paso 2.3 — Crear `backend/cache.py`

Archivo nuevo. Tres namespaces con convención de keys clara:

```
agent:session:{org_id}:{user_id}     → historial del agente (JSON array)
cache:{org_id}:{resource}:{hash}     → resultados de queries MongoDB
ratelimit:{org_id}:{user_id}:{action} → contador de uso
```

```python
"""
cache.py — Capa Redis para Rovi CRM.

Namespaces:
  agent:session  → historial conversacional del agente IA (TTL 24h)
  cache          → resultados de queries MongoDB costosas (TTL configurable)
  ratelimit      → contadores de rate limiting por usuario
"""
import json
import hashlib
import os
from typing import Any, Optional, List, Dict
import redis.asyncio as aioredis

# Cliente global — se inicializa en startup de FastAPI
redis_client: Optional[aioredis.Redis] = None


async def init_redis():
    """Llamar en el startup de FastAPI."""
    global redis_client
    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")
    redis_client = aioredis.from_url(
        redis_url,
        decode_responses=True,
        socket_connect_timeout=5,
        socket_keepalive=True,
    )
    # Verificar conexión
    await redis_client.ping()


async def close_redis():
    """Llamar en el shutdown de FastAPI."""
    if redis_client:
        await redis_client.aclose()


# ─── Sesiones del Agente ──────────────────────────────────────────────────────

AGENT_SESSION_TTL = 60 * 60 * 24  # 24 horas en segundos
AGENT_MAX_MESSAGES = 20            # ventana deslizante — solo últimos N mensajes


async def get_agent_session(org_id: str, user_id: str) -> List[Dict]:
    """
    Recupera el historial de conversación del agente.
    Retorna lista vacía si no hay sesión activa.
    """
    key = f"agent:session:{org_id}:{user_id}"
    data = await redis_client.get(key)
    return json.loads(data) if data else []


async def save_agent_session(
    org_id: str,
    user_id: str,
    messages: List[Dict],
    ttl: int = AGENT_SESSION_TTL
):
    """
    Guarda el historial. Mantiene solo los últimos AGENT_MAX_MESSAGES
    para controlar el tamaño del contexto enviado a OpenAI.
    Renueva el TTL en cada interacción.
    """
    key = f"agent:session:{org_id}:{user_id}"
    trimmed = messages[-AGENT_MAX_MESSAGES:]
    await redis_client.setex(key, ttl, json.dumps(trimmed, default=str))


async def clear_agent_session(org_id: str, user_id: str):
    """
    Limpia la sesión del agente.
    Llamar cuando el usuario inicia una 'nueva conversación'.
    """
    key = f"agent:session:{org_id}:{user_id}"
    await redis_client.delete(key)


async def get_agent_session_metadata(org_id: str, user_id: str) -> Dict:
    """Retorna metadata de la sesión: cantidad de mensajes y TTL restante."""
    key = f"agent:session:{org_id}:{user_id}"
    messages = await get_agent_session(org_id, user_id)
    ttl = await redis_client.ttl(key)
    return {
        "message_count": len(messages),
        "ttl_seconds": ttl,
        "has_session": len(messages) > 0,
    }


# ─── Caché de Queries ─────────────────────────────────────────────────────────

async def get_cached(
    org_id: str,
    resource: str,
    params: Dict,
) -> Optional[Any]:
    """
    Recupera resultado cacheado.
    params se hashea para generar una key única por combinación de filtros.

    Ejemplo:
        cached = await get_cached(org_id, "dashboard_stats", {"broker_id": "x"})
        if cached:
            return cached
    """
    params_hash = hashlib.md5(
        json.dumps(params, sort_keys=True, default=str).encode()
    ).hexdigest()[:10]
    key = f"cache:{org_id}:{resource}:{params_hash}"
    data = await redis_client.get(key)
    return json.loads(data) if data else None


async def set_cached(
    org_id: str,
    resource: str,
    params: Dict,
    value: Any,
    ttl_seconds: int = 300,   # default 5 minutos
):
    """
    Cachea el resultado de una query por TTL segundos.

    Recursos recomendados y sus TTLs:
        dashboard_stats   → 300s  (5 min)
        pipeline_stats    → 300s  (5 min)
        leaderboard       → 600s  (10 min)
        brokers_list      → 1800s (30 min)
        gamification_rules → 3600s (1 hora)
    """
    params_hash = hashlib.md5(
        json.dumps(params, sort_keys=True, default=str).encode()
    ).hexdigest()[:10]
    key = f"cache:{org_id}:{resource}:{params_hash}"
    await redis_client.setex(key, ttl_seconds, json.dumps(value, default=str))


async def invalidate_cache(org_id: str, resource: str):
    """
    Invalida TODAS las entradas de caché para un recurso de una org.
    Llamar después de cualquier escritura que afecte ese recurso.

    Ejemplo:
        # Después de crear un lead
        await invalidate_cache(org_id, "dashboard_stats")
        await invalidate_cache(org_id, "pipeline_stats")
    """
    pattern = f"cache:{org_id}:{resource}:*"
    keys = await redis_client.keys(pattern)
    if keys:
        await redis_client.delete(*keys)


# ─── Rate Limiting ────────────────────────────────────────────────────────────

async def check_rate_limit(
    org_id: str,
    user_id: str,
    action: str,
    max_calls: int,
    window_seconds: int,
) -> bool:
    """
    Implementa rate limiting con sliding window usando INCR + EXPIRE.
    Retorna True si la acción está permitida, False si supera el límite.

    Límites recomendados:
        ai_chat       → max_calls=20,  window=60   (20 msgs/min)
        ai_analysis   → max_calls=50,  window=3600 (50/hora)
        campaign_send → max_calls=5,   window=3600 (5 campañas/hora)
        import_leads  → max_calls=10,  window=3600 (10 imports/hora)
    """
    key = f"ratelimit:{org_id}:{user_id}:{action}"
    current = await redis_client.incr(key)
    if current == 1:
        await redis_client.expire(key, window_seconds)
    return current <= max_calls


async def get_rate_limit_status(
    org_id: str,
    user_id: str,
    action: str,
) -> Dict:
    """Retorna el estado actual del rate limit para display en UI."""
    key = f"ratelimit:{org_id}:{user_id}:{action}"
    current = await redis_client.get(key)
    ttl = await redis_client.ttl(key)
    return {
        "current": int(current) if current else 0,
        "ttl_seconds": ttl,
    }
```

---

## Paso 2.4 — Inicializar Redis en `backend/server.py`

Buscar el startup/lifespan de FastAPI y agregar la inicialización:

```python
from cache import init_redis, close_redis

# Si usas @asynccontextmanager lifespan:
@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    await init_redis()
    await create_indexes()  # índices MongoDB de Fase 1
    yield
    # shutdown
    await close_redis()

app = FastAPI(lifespan=lifespan)

# Si usas @app.on_event (legacy):
@app.on_event("startup")
async def startup():
    await init_redis()

@app.on_event("shutdown")
async def shutdown():
    await close_redis()
```

---

## Paso 2.5 — Integrar caché en endpoints de alto tráfico

### Dashboard stats

```python
from cache import get_cached, set_cached, invalidate_cache
from permissions import build_resource_filter

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    org_id = current_user["org_id"]
    resource_filter = build_resource_filter(current_user)

    # 1. Intentar desde caché
    cached = await get_cached(org_id, "dashboard_stats", resource_filter)
    if cached:
        return cached

    # 2. Query real a MongoDB (código existente)
    stats = {
        "leads_nuevos": await db.leads.count_documents({**resource_filter, "status": "nuevo"}),
        "ventas": await db.leads.count_documents({**resource_filter, "status": "venta"}),
        # ... resto del cálculo existente
    }

    # 3. Cachear por 5 minutos
    await set_cached(org_id, "dashboard_stats", resource_filter, stats, ttl_seconds=300)
    return stats
```

### Invalidar caché en escrituras

```python
@api_router.post("/leads")
async def create_lead(lead: LeadCreate, current_user: dict = Depends(get_current_user)):
    org_id = current_user["org_id"]
    # ... código existente de creación ...
    
    # Invalida caché relacionado después de crear
    await invalidate_cache(org_id, "dashboard_stats")
    await invalidate_cache(org_id, "pipeline_stats")
    return new_lead

@api_router.patch("/leads/{lead_id}")
async def update_lead(lead_id: str, ...):
    # ... código existente ...
    await invalidate_cache(org_id, "dashboard_stats")
    await invalidate_cache(org_id, "pipeline_stats")
    return updated_lead
```

---

## Paso 2.6 — Integrar sesiones en `backend/ai_service.py`

```python
from cache import (
    get_agent_session, save_agent_session,
    clear_agent_session, check_rate_limit
)

async def chat_with_agent(user_message: str, user: dict) -> dict:
    org_id = user["org_id"]
    user_id = user["user_id"]

    # Rate limiting — 20 mensajes por minuto por broker
    allowed = await check_rate_limit(org_id, user_id, "ai_chat", max_calls=20, window_seconds=60)
    if not allowed:
        return {"error": "Límite de mensajes alcanzado. Espera un momento.", "rate_limited": True}

    # Recuperar historial previo
    history = await get_agent_session(org_id, user_id)

    # Agregar mensaje nuevo al historial
    history.append({"role": "user", "content": user_message})

    # Llamar al modelo (código existente, pero con historial completo)
    system_prompt = build_system_prompt(user)   # función existente
    
    response = await openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            *history,
        ],
        max_tokens=800,
        temperature=0.7,
    )

    answer = response.choices[0].message.content

    # Guardar historial actualizado
    history.append({"role": "assistant", "content": answer})
    await save_agent_session(org_id, user_id, history)

    return {"response": answer, "rate_limited": False}


# Endpoint para limpiar conversación (nuevo)
@api_router.post("/ai/reset-session")
async def reset_agent_session(current_user: dict = Depends(get_current_user)):
    await clear_agent_session(
        current_user["org_id"],
        current_user["user_id"]
    )
    return {"message": "Sesión del agente reiniciada"}
```

---

## Criterios de éxito — Fase 2

- [ ] `docker compose up` levanta Redis sin errores junto a MongoDB y backend
- [ ] `redis-cli ping` responde `PONG` desde dentro del contenedor del backend
- [ ] El agente recuerda mensajes anteriores en la misma conversación (probar manualmente)
- [ ] Después de 24h sin actividad, la sesión expira (verificar con `TTL key` en redis-cli)
- [ ] El endpoint `/dashboard/stats` tiene cache hit en el segundo request (verificar con logs)
- [ ] Crear un lead invalida el caché del dashboard (verificar que el tercer request vuelve a ser miss)
- [ ] El endpoint `/ai/chat` rechaza requests después de 20 en 1 minuto
- [ ] El endpoint `/ai/reset-session` limpia el historial correctamente
