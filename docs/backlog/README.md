# Backlog — Arquitectura de 3 Capas · Rovi CRM

> Documentación técnica lista para ejecutar en Cursor.  
> Cada archivo es autocontenido: tiene contexto, código de referencia, archivos a modificar y criterios de éxito.

---

## Estructura del backlog

```
docs/backlog/
├── README.md                   ← estás aquí — índice y orden de ejecución
├── FASE_1_MONGODB.md           ← multi-tenancy org_id + broker_id
├── FASE_2_REDIS.md             ← sesiones del agente + caché + colas
├── FASE_3_SUPABASE.md          ← base de conocimiento vectorial RAG
├── MIGRACION.md                ← scripts de migración de datos existentes
├── ENV_VARIABLES.md            ← todas las variables de entorno nuevas
└── CHECKLIST.md                ← checklist unificado de implementación
```

---

## Resumen ejecutivo

| Fase | Tecnología | Semanas | Prioridad | Depende de |
|------|-----------|---------|-----------|-----------|
| 1 | MongoDB refactor | 1-2 | 🔴 Crítica | — |
| 2 | Redis | 3-4 | 🟡 Alta | Fase 1 |
| 3 | Supabase pgvector | 5-7 | 🟢 Media | Fase 1 + 2 |

**Regla de oro:** No empieces la Fase 2 sin tener `org_id` y `broker_id` en todos los documentos. El resto del sistema depende de ese modelo.

---

## Orden de ejecución recomendado en Cursor

```
1. Leer FASE_1_MONGODB.md    → implementar + correr migración + tests
2. Leer MIGRACION.md         → ejecutar scripts sobre datos existentes
3. Leer FASE_2_REDIS.md      → implementar Redis layer
4. Leer FASE_3_SUPABASE.md   → implementar vector store
5. Revisar CHECKLIST.md      → marcar criterios de éxito por fase
```

---

## Archivos del proyecto afectados

### Fase 1 — MongoDB
- `backend/models.py` — agregar `Organization`, actualizar `User` y todos los recursos
- `backend/auth.py` — incluir `org_id` en el JWT payload
- `backend/server.py` — registro de usuarios, lógica de queries
- `backend/permissions.py` — **archivo nuevo**
- `backend/migrations/001_add_org_id.py` — **archivo nuevo**
- `backend/migrations/002_create_indexes.py` — **archivo nuevo**

### Fase 2 — Redis
- `docker-compose.yml` — agregar servicio Redis
- `docker-compose.hostinger.yml` — mismo cambio para producción
- `requirements.txt` — agregar `redis[hiredis]>=5.0.0`
- `backend/cache.py` — **archivo nuevo**
- `backend/server.py` — init Redis en startup
- `backend/ai_service.py` — integrar sesiones con Redis

### Fase 3 — Supabase
- `requirements.txt` — agregar `supabase>=2.0.0`
- `backend/knowledge_base.py` — **archivo nuevo**
- `backend/indexing_pipeline.py` — **archivo nuevo**
- `backend/ai_service.py` — integrar RAG completo
- `backend/server.py` — hooks de indexación en endpoints de escritura
- Supabase SQL Editor — schema + función `search_knowledge()`

---

## Estado actual del código (contexto para Cursor)

```python
# backend/server.py línea ~179 — lo que hay HOY
tenant_id = f"tenant-{user_id[:8]}"

# backend/models.py — User hoy
class User(UserBase):
    id: str
    tenant_id: str = ""          # plano, sin jerarquía
    account_type: str = "individual"  # individual | agency
    # NO existe org_id, NO existe un modelo Organization
```

El sistema de permisos actual hace queries directas con `tenant_id` en cada endpoint sin una capa de abstracción. El agente de IA no tiene memoria entre mensajes.
