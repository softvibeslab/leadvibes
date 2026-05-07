# SEMANA 2 PATCH - Server.py
# Nuevos endpoints para Dashboard WebSocket, Enhanced Analytics y Duplicate Detection

## IMPORTS A AGREGAR (al inicio del archivo, después de los imports existentes)

```python
# Agregar después de línea ~50
from websocket_manager import manager, emit_lead_created, emit_lead_updated, emit_metrics_updated
from dashboard_enhancements import (
    get_dashboard_trends, get_broker_performance, get_dashboard_comparison,
    get_activity_feed_extended, get_top_performing_brokers
)
from duplicate_detection import find_potential_duplicates, get_duplicate_suggestions
from import_optimization import execute_import_optimized, execute_import_with_advanced_duplicates
```

## WEBSOCKET ENDPOINT (Agregar antes de `app.include_router(api_router)`)

```python
# ==================== WEBSOCKET ENDPOINTS ====================

@api_router.websocket("/ws/dashboard")
async def websocket_dashboard(
    websocket: WebSocket,
    token: str = Query(...),
    tenant_id: Optional[str] = None
):
    """
    WebSocket endpoint para actualizaciones en tiempo real del dashboard.

    Autenticación vía JWT token en query parameter.
    """
    from jose import jwt, JWTError

    try:
        # Verificar token
        payload = jwt.decode(token, os.environ['JWT_SECRET'], algorithms=["HS256"])
        user_id = payload.get("sub")
        tenant_id = tenant_id or payload.get("tenant_id", f"tenant-{user_id[:8]}")

        if not user_id:
            await websocket.close(code=4001, reason="Invalid token")
            return

        # Conectar WebSocket
        await manager.connect(websocket, tenant_id, user_id)

        # Mantener conexión y escuchar mensajes
        try:
            while True:
                # Recibir mensajes del cliente (ping, etc.)
                data = await websocket.receive_text()

                # Eco para mantener vivo
                if data == "ping":
                    await websocket.send_json({"type": "pong"})

        except WebSocketDisconnect:
            manager.disconnect(websocket)

    except JWTError as e:
        await websocket.close(code=4001, reason=f"Invalid token: {str(e)}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close(code=4000, reason="Internal error")


@api_router.get("/ws/stats")
async def get_websocket_stats(current_user: dict = Depends(get_current_user)):
    """Get WebSocket connection statistics"""
    tenant_id = current_user["tenant_id"]

    return {
        "tenant_connections": manager.get_connections_count(tenant_id),
        "total_connections": manager.get_total_connections(),
        "active_tenants": len(manager.get_all_tenants())
    }
```

## DASHBOARD ENHANCED ENDPOINTS (Agregar después de `/dashboard/recent-activity` endpoint)

```python
# ==================== DASHBOARD ENHANCED ROUTES ====================

@api_router.get("/dashboard/trends")
async def get_dashboard_trends_endpoint(
    months: int = 6,
    current_user: dict = Depends(get_current_user)
):
    """Get trends data for charts (ventas por mes, leads por fuente, conversion funnel)"""
    tenant_id = current_user["tenant_id"]

    trends = await get_dashboard_trends(db, tenant_id, months)

    return trends


@api_router.get("/dashboard/broker-performance/{broker_id}")
async def get_broker_performance_endpoint(
    broker_id: str,
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed performance metrics for a specific broker"""
    tenant_id = current_user["tenant_id"]

    performance = await get_broker_performance(db, tenant_id, broker_id, days)

    return performance


@api_router.get("/dashboard/comparison")
async def get_dashboard_comparison_endpoint(
    current_user: dict = Depends(get_current_user)
):
    """Compare current month vs previous month metrics"""
    tenant_id = current_user["tenant_id"]

    comparison = await get_dashboard_comparison(db, tenant_id)

    return comparison


@api_router.get("/dashboard/activity-feed")
async def get_activity_feed_endpoint(
    limit: int = 20,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Get extended activity feed with pagination"""
    tenant_id = current_user["tenant_id"]

    feed = await get_activity_feed_extended(db, tenant_id, limit, offset)

    return feed


@api_router.get("/dashboard/top-brokers")
async def get_top_brokers_endpoint(
    metric: str = "ventas",
    limit: int = 5,
    current_user: dict = Depends(get_current_user)
):
    """
    Get top performing brokers by metric
    metric: ventas, apartados, leads_contactados, puntos
    """
    tenant_id = current_user["tenant_id"]

    top_brokers = await get_top_performing_brokers(db, tenant_id, metric, limit)

    return {"metric": metric, "top_brokers": top_brokers}
```

## DUPLICATE DETECTION ENDPOINTS (Agregar después de `/leads` endpoints)

```python
# ==================== DUPLICATE DETECTION ROUTES ====================

@api_router.post("/leads/check-duplicates")
async def check_lead_duplicates(
    lead_data: LeadCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Check for potential duplicates before creating lead.
    Uses fuzzy matching and phone/email normalization.
    """
    tenant_id = current_user["tenant_id"]

    duplicates = await find_potential_duplicates(
        db,
        tenant_id,
        lead_data.model_dump(),
        threshold=85,
        max_results=10
    )

    return {
        "duplicates_found": len(duplicates),
        "duplicates": [
            {
                "lead_id": d["lead"]["id"],
                "name": d["lead"].get("name"),
                "email": d["lead"].get("email"),
                "phone": d["lead"].get("phone"),
                "reason": d.get("reason"),
                "reason_display": d.get("reason_display"),
                "confidence": d["confidence"],
                "name_similarity": d.get("name_similarity"),
                "phone_similar": d.get("phone_similar", False),
                "email_similar": d.get("email_similar", False)
            }
            for d in duplicates
        ]
    }


@api_router.post("/leads/merge-suggestions")
async def get_merge_suggestions(
    lead_id_1: str,
    lead_id_2: str,
    current_user: dict = Depends(get_current_user)
):
    """Get suggestions for merging two duplicate leads"""
    tenant_id = current_user["tenant_id"]

    lead_1 = await db.leads.find_one({"id": lead_id_1, "tenant_id": tenant_id})
    lead_2 = await db.leads.find_one({"id": lead_id_2, "tenant_id": tenant_id})

    if not lead_1 or not lead_2:
        raise HTTPException(status_code=404, detail="Uno o ambos leads no encontrados")

    suggestions = get_duplicate_suggestions(lead_1, lead_2)

    return {
        "lead_1": serialize_doc(lead_1),
        "lead_2": serialize_doc(lead_2),
        "suggestions": suggestions
    }
```

## OPTIMIZED IMPORT ENDPOINTS (Reemplazar `/import/execute` existente)

```python
# REEMPLAZAR el endpoint /import/execute existente con este:

@api_router.post("/import/execute-optimized")
async def execute_import_optimized_endpoint(
    request: ImportMappingRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Execute optimized import with bulk operations.
    Meta: < 2 min for 100 leads.

    Opciones:
    - skip_duplicates: Omitir duplicados (default: true)
    - use_fuzzy_matching: Usar fuzzy matching para duplicados (default: false)
    - duplicate_threshold: Umbral de similitud 0-100 (default: 85)
    """
    tenant_id = current_user["tenant_id"]
    user_id = current_user["user_id"]

    # Get job and data
    job = await db.import_jobs.find_one(
        {"id": request.job_id, "user_id": user_id},
        {"_id": 0}
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job de importación no encontrado")

    import_data = await db.import_data.find_one({"job_id": request.job_id}, {"_id": 0})
    if not import_data:
        raise HTTPException(status_code=404, detail="Datos de importación no encontrados")

    rows = import_data.get("rows", [])
    mapping = {m.source_column: m.target_field for m in request.mapping}

    # Actualizar job a processing
    await db.import_jobs.update_one(
        {"id": request.job_id},
        {"$set": {"status": ImportStatus.PROCESSING.value, "column_mapping": mapping}}
    )

    # Ejecutar importación optimizada
    use_fuzzy = request.model_dump().get("use_fuzzy_matching", False)

    if use_fuzzy:
        # Usar fuzzy matching para duplicados
        duplicate_threshold = request.model_dump().get("duplicate_threshold", 85)
        result = await execute_import_with_advanced_duplicates(
            db, request.job_id, rows, mapping, tenant_id, user_id, duplicate_threshold
        )
    else:
        # Importación estándar optimizada
        result = await execute_import_optimized(
            db, request.job_id, rows, mapping, tenant_id, user_id, request.skip_duplicates
        )

    return result


@api_router.post("/import/execute")  # MANTENER EL ORIGINAL POR COMPATIBILIDAD
async def execute_import_endpoint(
    request: ImportMappingRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Endpoint de importación estándar (mantenido por compatibilidad).
    Redirige a la versión optimizada.
    """
    return await execute_import_optimized_endpoint(request, current_user)
```

## INTEGRACIÓN CON WEBSOCKET EN ENDPOINTS EXISTENTES

### Modificar POST /api/leads (crear lead)

```python
# En el endpoint POST /api/leads, después de crear el lead exitosamente:

# Emitir evento WebSocket
from websocket_manager import emit_lead_created, emit_metrics_updated

# ... después de insertar el lead ...

await emit_lead_created(tenant_id, lead_doc, current_user["user_id"])

# Opcional: actualizar métricas
# stats = await calculate_dashboard_stats(db, tenant_id)
# await emit_metrics_updated(tenant_id, stats)
```

### Modificar PUT /api/leads/{id} (actualizar lead)

```python
# En el endpoint PUT /api/leads, después de actualizar:

from websocket_manager import emit_lead_updated

# ... después de actualizar el lead ...

await emit_lead_updated(
    tenant_id,
    lead_id,
    update_dict,
    current_user["user_id"]
)
```

### Modificar POST /api/calendar/events (crear evento)

```python
# En el endpoint POST /api/calendar/events, después de crear:

from websocket_manager import emit_calendar_event_created

# ... después de crear el evento ...

await emit_calendar_event_created(tenant_id, event_doc, current_user["user_id"])
```

## DEPENDENCIAS A INSTALAR

```bash
cd backend
pip install fuzzywuzzy python-phonenumbers
```

## TESTING WEBSOCKET

```bash
# Instalar wscat
npm install -g wscat

# Conectarse (primero obtener token JWT)
wscat -c "ws://localhost:8000/api/ws/dashboard?token=YOUR_JWT_TOKEN"

# Debería recibir:
# {"type":"connection_established","timestamp":"...","tenant_id":"...","user_id":"..."}

# Enviar ping
# > ping
# < {"type":"pong"}
```

## TESTING DASHBOARD ENHANCED

```bash
# Trends
curl "http://localhost:8000/api/dashboard/trends?months=6" \
  -H "Authorization: Bearer TOKEN"

# Broker performance
curl "http://localhost:8000/api/dashboard/broker-performance/broker-id-123?days=30" \
  -H "Authorization: Bearer TOKEN"

# Comparison
curl "http://localhost:8000/api/dashboard/comparison" \
  -H "Authorization: Bearer TOKEN"

# Top brokers
curl "http://localhost:8000/api/dashboard/top-brokers?metric=ventas&limit=5" \
  -H "Authorization: Bearer TOKEN"
```

## TESTING DUPLICATE DETECTION

```bash
# Check duplicates before creating lead
curl -X POST "http://localhost:8000/api/leads/check-duplicates" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Perez",
    "email": "juan.perez@example.com",
    "phone": "+529987654321"
  }'

# Debería retornar duplicados con nombres similares
```

## TESTING OPTIMIZED IMPORT

```bash
# Upload file
curl -X POST "http://localhost:8000/api/import/upload" \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@leads.csv"

# Execute optimized import
curl -X POST "http://localhost:8000/api/import/execute-optimized" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "job-id-from-upload",
    "mapping": [
      {"source_column": "Name", "target_field": "name"},
      {"source_column": "Email", "target_field": "email"},
      {"source_column": "Phone", "target_field": "phone"}
    ],
    "skip_duplicates": true,
    "use_fuzzy_matching": true,
    "duplicate_threshold": 85
  }'

# Debería completarse en < 2 min para 100 leads
```

---

## ARCHIVOS CREADOS

1. `websocket_manager.py` - WebSocket connection manager
2. `dashboard_enhancements.py` - Advanced analytics endpoints
3. `duplicate_detection.py` - Fuzzy matching duplicate detection
4. `import_optimization.py` - Optimized bulk import

## SIGUIENTES PASOS

1. ✅ Crear módulos especializados
2. ⏳ Integrar en server.py (APLICAR ESTE PATCH)
3. ⏳ Instalar dependencias (pip install fuzzywuzzy python-phonenumbers)
4. ⏳ Testing completo
5. ⏳ Deploy a staging

---

**Patch creado:** 2026-04-27
**Versión:** v1.2 - Semana 2
**Status:** 🟡 Listo para aplicar
