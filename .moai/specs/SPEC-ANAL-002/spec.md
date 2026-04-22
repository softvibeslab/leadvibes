---
id: ANAL-002
version: 0.0.1
status: draft
created: 2026-03-20
updated: 2026-03-20
author: @RogerVibes
priority: high
category: feature
labels:
  - analytics
  - roi
  - cohorts
  - funnels
depends_on:
  - ANAL-001
  - CAMP-001
blocks: []
related_specs:
  - PERF-001
scope:
  packages:
    - backend/services/analytics_advanced.py
    - backend/api/analytics.py
  files:
    - roi_calculator.py
    - cohort_analyzer.py
    - funnel_analyzer.py
    - attribution_model.py
---

# @SPEC:ANAL-002: Advanced Analytics - ROI, Cohorts, Funnels

## HISTORY

### v0.0.1 (2026-03-20)
- **INITIAL**: Advanced Analytics - Creación inicial
- **AUTHOR**: @RogerVibes
- **SCOPE**: Métricas avanzadas de ROI por campaña, análisis de cohortes, funnel analysis, attribution modeling
- **CONTEXT**: Analytics básico existe (dashboard de stats), pero falta análisis profundo de ROI y cohortes
- **REASON**: Optimizar gasto de marketing identificando campañas con mayor ROI y patrones de conversión

---

## Environment

### Contexto de Negocio

- **Problema**: No se sabe qué campañas de marketing son realmente rentables
- **Objetivo**: Visibilidad completa de ROI, cohortes y funnels para optimizar inversión
- **Impacto**: Reducir CPA (Cost Per Acquisition) en 20% mediante optimización de campañas

### Infraestructura de Analytics

- **Backend**: FastAPI con MongoDB (aggregation pipelines complejos)
- **Cache**: Redis para métricas precalculadas (TTL: 24 horas para analytics avanzados)
- **Data Warehouse**: (Opcional) Exportar datos a Snowflake/BigQuery para análisis masivo
- **Frontend**: React con Recharts (gráficos avanzados)

---

## Assumptions

1. **Datos Históricos**: Mínimo 6 meses de datos para análisis de cohortes
2. **Cost Tracking**: Costos de campañas están registrados (spend de Facebook Ads, etc.)
3. **Revenue Tracking**: Cada venta tiene attributed campaign ID
4. **Privacy**: Datos agregados solo, sin información personal identificable
5. **Granularidad**: Métricas disponibles por día, semana, mes, trimestre

---

## Requirements

### Ubiquitous Requirements (Básicas)

- El sistema debe calcular ROI de cada campaña (revenue / cost)
- El sistema debe analizar cohortes de leads por fecha de adquisición
- El sistema debe generar funnel analysis por etapa de pipeline
- El sistema debe attribuir ventas a campañas (multi-touch attribution)
- El sistema debe proveer comparativas period-over-period (MoM, QoQ, YoY)

### Event-driven Requirements (WHEN-THEN)

- **WHEN** se completa una venta, el sistema debe attribuirla a campaña(s) que tocaron el lead
- **WHEN** se consulta ROI de campaña, el sistema debe calcular (revenue - cost) / cost
- **WHEN** se analiza cohorte, el sistema debe agrupar leads por fecha de adquisición y trackear conversión en el tiempo
- **WHEN** se genera funnel, el sistema debe mostrar drop-off rate por etapa
- **WHEN** se compara períodos, el sistema debe mostrar variación porcentual y absoluta

### State-driven Requirements (WHILE-THEN)

- **WHILE** se calcula ROI, el sistema debe incluir costos directos (ad spend) e indirectos (tiempo del broker)
- **WHILE** se analiza cohorte, el sistema debe mostrar retention rate (leads que siguen activos)
- **WHILE** se visualiza funnel, el sistema debe highlightar etapas con mayor drop-off

### Optional Requirements (WHERE-THEN)

- **WHERE** una campaña tiene ROI negativo, el sistema debe alertar para pausarla
- **WHERE** una cohorte tiene baja retención, el sistema debe sugerir acciones de re-engagement
- **WHERE** un funnel tiene drop-off >50% en una etapa, el sistema debe analizar causas

### Constraints (IF-THEN)

- **IF** una campaña tiene <30 días de datos, el sistema debe mostrar "Datos insuficientes para ROI"
- **IF** una cohorte tiene <50 leads, el sistema debe mostrar muestra no representativa
- **IF** el costo de campaña no está registrado, el sistema debe asumir $0 y advertir dato faltante
- **IF** una venta no puede atribuirse a ninguna campaña, el sistema debe marcar como "orgánica"
- **IF** el sistema de cache falla, el sistema debe calcular métricas on-demand (más lento pero funcional)

---

## Specifications

### @CODE:ANAL-002:ROI ROI Calculator

**Ubicación**: `backend/services/roi_calculator.py`

#### Fórmula de ROI

```python
def calculate_campaign_roi(campaign_id: str) -> dict:
    """
    ROI = (Revenue - Cost) / Cost

    Revenue = Sum of all sales attributed to campaign
    Cost = Ad spend + broker time (estimated)
    """

    # Obtener ventas atribuidas a campaña
    pipeline = [
        {"$match": {"attributed_campaign_id": campaign_id, "status": "venta"}},
        {"$group": {
            "_id": None,
            "total_revenue": {"$sum": "$property_price"},
            "total_sales": {"$sum": 1}
        }}
    ]

    result = await db.leads.aggregate(pipeline).to_list(None)
    revenue = result[0]["total_revenue"] if result else 0
    sales_count = result[0]["total_sales"] if result else 0

    # Obtener costo de campaña
    campaign = await db.campaigns.find_one({"_id": campaign_id})
    cost = campaign.get("cost", 0)

    # Calcular ROI
    if cost > 0:
        roi = ((revenue - cost) / cost) * 100  # Porcentaje
    else:
        roi = 0

    # Calcular métricas adicionales
    cpa = cost / sales_count if sales_count > 0 else 0  # Cost Per Acquisition
    roas = revenue / cost if cost > 0 else 0  # Return on Ad Spend

    return {
        "campaign_id": campaign_id,
        "revenue": revenue,
        "cost": cost,
        "profit": revenue - cost,
        "roi_percent": roi,
        "roas": roas,
        "cpa": cpa,
        "sales_count": sales_count
    }
```

#### Atribución de Ventas a Campañas

- **Last-Touch Attribution**: Venta se atribuye a la última campaña que tocó el lead
- **Multi-Touch Attribution** (Opcional): Venta se distribuye entre todas las campañas que tocaron el lead

---

### @CODE:ANAL-002:COHORT Cohort Analysis

**Ubicación**: `backend/services/cohort_analyzer.py`

#### Definición de Cohorte

- **Cohorte**: Grupo de leads adquiridos en el mismo período (semana o mes)
- **Análisis**: Trackear conversión de cohorte en el tiempo (retention curve)

#### Ejemplo: Cohortes por Semana

```python
async def analyze_cohorts_by_week(start_date: date, end_date: date):
    """
    Genera matriz de cohortes:
    - Filas: Semana de adquisición (Week 1, Week 2, ...)
    - Columnas: Semanas después de adquisición (Week 0, Week 1, Week 2, ...)
    - Valores: % de leads que se convirtieron esa semana
    """

    cohorts = []

    # Para cada semana de adquisición
    week = start_date
    while week <= end_date:
        # Leads adquiridos esa semana
        leads_acquired = await db.leads.count_documents({
            "created_at": {"$gte": week, "$lt": week + timedelta(days=7)}
        })

        if leads_acquired == 0:
            continue

        # Para cada semana después de adquisición
        cohort_data = {"cohort_week": week, "leads_acquired": leads_acquired}

        for week_offset in range(0, 12):  # 12 semanas de seguimiento
            period_start = week + timedelta(days=7 * week_offset)
            period_end = period_start + timedelta(days=7)

            # Leads que se convirtieron en esa semana
            converted = await db.leads.count_documents({
                "created_at": {"$gte": week, "$lt": week + timedelta(days=7)},
                "status": "venta",
                "converted_at": {"$gte": period_start, "$lt": period_end}
            })

            conversion_rate = (converted / leads_acquired) * 100
            cohort_data[f"week_{week_offset}"] = round(conversion_rate, 1)

        cohorts.append(cohort_data)
        week += timedelta(days=7)

    return cohorts
```

#### Visualización de Cohortes

```
Cohort Analysis - Conversion Rate by Week

Week Acquired | Leads | Wk0 | Wk1 | Wk2 | Wk3 | Wk4 | Wk5 | ...
--------------|-------|-----|-----|-----|-----|-----|-----|-----
2026-03-01    | 100   | 5%  | 12% | 18% | 22% | 25% | 27% | ...
2026-03-08    | 120   | 4%  | 10% | 16% | 20% | 23% | 25% | ...
2026-03-15    | 90    | 6%  | 14% | 20% | 24% | 27% | 29% | ...
```

---

### @CODE:ANAL-002:FUNNEL Funnel Analysis

**Ubicación**: `backend/services/funnel_analyzer.py`

#### Pipeline Funnel

```python
async def analyze_funnel(date_range: tuple) -> dict:
    """
    Genera funnel de conversión por etapa de pipeline
    """

    pipeline = [
        {"$match": {
            "created_at": {"$gte": date_range[0], "$lte": date_range[1]}
        }},
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]

    stages = await db.leads.aggregate(pipeline).to_list(None)

    # Mapear etapas a orden
    stage_order = {
        "nuevo": 0,
        "contactado": 1,
        "calificacion": 2,
        "presentacion": 3,
        "apartado": 4,
        "venta": 5
    }

    # Ordenar etapas y calcular conversion rates
    funnel = []
    previous_count = None

    for stage in sorted(stages, key=lambda x: stage_order.get(x["_id"], 999)):
        count = stage["count"]
        stage_name = stage["_id"]

        # Calcular drop-off rate
        if previous_count:
            drop_off = previous_count - count
            drop_off_rate = (drop_off / previous_count) * 100
        else:
            drop_off = None
            drop_off_rate = None

        funnel.append({
            "stage": stage_name,
            "count": count,
            "drop_off": drop_off,
            "drop_off_rate": drop_off_rate
        })

        previous_count = count

    return funnel
```

#### Visualización de Funnel

```
Pipeline Funnel - Last 30 Days

┌─────────────────────────────────────┐
│ Nuevo          1,000 leads (100%)   │
│                  ▼ 80% drop-off     │
│ Contactado       200 leads (20%)    │
│                  ▼ 40% drop-off     │
│ Calificación     120 leads (12%)    │
│                  ▼ 50% drop-off     │
│ Presentación      60 leads (6%)     │
│                  ▼ 33% drop-off     │
│ Apartado          40 leads (4%)     │
│                  ▼ 50% drop-off     │
│ Venta             20 leads (2%)     │
└─────────────────────────────────────┘

Overall Conversion Rate: 2% (20/1000)
Highest Drop-off Stage: Nuevo → Contactado (80%)
```

---

### @CODE:ANAL-002:ATTR Attribution Modeling

**Ubicación**: `backend/services/attribution_model.py`

#### Modelos de Atribución

1. **First-Touch Attribution**
   - Venta se atribuye 100% a la primera campaña que tocó el lead
   - **Use Case**: Identificar campañas que generan conciencia (top of funnel)

2. **Last-Touch Attribution**
   - Venta se atribuye 100% a la última campaña que tocó el lead
   - **Use Case**: Identificar campañas que cierran ventas (bottom of funnel)

3. **Multi-Touch Attribution** (Lineal)
   - Venta se distribuye equitativamente entre todas las campañas que tocaron el lead
   - **Ejemplo**: Lead tocado por 3 campañas → cada una recibe 33.3% del crédito

4. **Time-Decay Attribution**
   - Campañas más recientes reciben más crédito
   - **Ejemplo**: Última campaña 50%, penúltima 30%, primera 20%

```python
def attribute_sale_to_campaigns(lead_id: str, model: str = "last_touch") -> dict:
    """
    Atribuye venta a campaña(s) según modelo
    """

    lead = await db.leads.find_one({"_id": lead_id})

    # Obtener todas las campañas que tocaron el lead
    touched_campaigns = await db.activities.find({
        "lead_id": lead_id,
        "campaign_id": {"$exists": True}
    }).to_list(None)

    if model == "first_touch":
        # Primera campaña
        campaign_id = touched_campaigns[0]["campaign_id"]
        return {campaign_id: 1.0}  # 100% attribution

    elif model == "last_touch":
        # Última campaña
        campaign_id = touched_campaigns[-1]["campaign_id"]
        return {campaign_id: 1.0}

    elif model == "linear":
        # Distribución equitativa
        attribution = 1.0 / len(touched_campaigns)
        return {c["campaign_id"]: attribution for c in touched_campaigns}

    elif model == "time_decay":
        # Campañas más recientes tienen más peso
        weights = []
        for i, campaign in enumerate(touched_campaigns):
            weight = (i + 1) / sum(range(1, len(touched_campaigns) + 1))
            weights.append(weight)

        return {
            touched_campaigns[i]["campaign_id"]: weights[i]
            for i in range(len(touched_campaigns))
        }
```

---

### @CODE:ANAL-002:API Advanced Analytics Endpoints

**Ubicación**: `backend/api/analytics.py` (extender módulo existente)

#### Endpoints

1. **GET `/analytics/roi/campaigns`**
   - **Descripción**: ROI de todas las campañas
   - **Query Params**: `?start=2026-03-01&end=2026-03-31`
   - **Response**:
     ```json
     {
       "campaigns": [
         {
           "campaign_id": "camp_001",
           "name": "Facebook Ads - La Veleta",
           "revenue": 5000000,
           "cost": 500000,
           "roi_percent": 900,
           "roas": 10.0,
           "cpa": 50000
         },
         ...
       ],
       "total_roi": 750,
       "best_performer": "Facebook Ads - La Veleta"
     }
     ```

2. **GET `/analytics/cohorts`**
   - **Descripción**: Análisis de cohortes
   - **Query Params**: `?period=week&start=2026-03-01&end=2026-03-31`
   - **Response**: (Ver formato arriba en Cohort Analysis)

3. **GET `/analytics/funnel`**
   - **Descripción**: Funnel analysis
   - **Query Params**: `?start=2026-03-01&end=2026-03-31`
   - **Response**: (Ver formato arriba en Funnel Analysis)

4. **GET `/analytics/attribution/{sale_id}`**
   - **Descripción**: Atribución de venta a campañas
   - **Query Params**: `?model=time_decay`
   - **Response**:
     ```json
     {
       "sale_id": "sale_uuid",
       "revenue": 2000000,
       "attributed_campaigns": [
         {"campaign_id": "camp_001", "attribution": 0.6, "revenue": 1200000},
         {"campaign_id": "camp_002", "attribution": 0.4, "revenue": 800000}
       ]
     }
     ```

5. **GET `/analytics/comparison/period-over-period`**
   - **Descripción**: Comparación de períodos (MoM, QoQ, YoY)
   - **Query Params**: `?period=month&current=2026-03&previous=2026-02`
   - **Response**:
     ```json
     {
       "metric": "revenue",
       "current_period": {"revenue": 5000000, "sales": 25},
       "previous_period": {"revenue": 4000000, "sales": 20},
       "variation": {
         "absolute": 1000000,
         "percent": 25.0
       }
     }
     ```

---

## Traceability (@TAG)

- **SPEC**: @SPEC:ANAL-002
- **TEST**:
  - `backend/tests/test_analytics_advanced.py` → @TEST:ANAL-002
  - `backend/tests/test_roi_calculator.py` → @TEST:ANAL-002:ROI
  - `backend/tests/test_cohort_analysis.py` → @TEST:ANAL-002:COHORT
- **CODE**:
  - `backend/services/analytics_advanced.py` → @CODE:ANAL-002:SERVICE
  - `backend/api/analytics.py` → @CODE:ANAL-002:API
  - `frontend/src/pages/AdvancedAnalyticsPage.js` → @CODE:ANAL-002:UI
- **DOC**: `docs/advanced-analytics-guide.md` → @DOC:ANAL-002

---

## Acceptance Criteria

### Criterios de Aceptación

1. **ROI Calculator Funcionando**: ROI calculado correctamente por campaña
2. **Cohort Analysis**: Matriz de cohortes con conversión en el tiempo
3. **Funnel Analysis**: Funnel visual con drop-off rates por etapa
4. **Attribution Modeling**: 4 modelos de atribución disponibles
5. **Comparativas Period-over-Period**: MoM, QoQ, YoY funcionando

### Definición de Done

- [ ] ROI calculator implementado con 3+ métricas (ROI, ROAS, CPA)
- [ ] Cohort analysis funcionando con visualización matricial
- [ ] Funnel analysis con drop-off highlighting
- [ ] 4 modelos de atribución implementados (first, last, linear, time-decay)
- [ ] Endpoints `/analytics/advanced/*` funcionando y testeados
- [ ] Frontend dashboard con gráficos de cohortes y funnels
- [ ] Sistema de cache para métricas pesadas (TTL 24h)
- [ ] Documentación de modelos de atribución y casos de uso creada
