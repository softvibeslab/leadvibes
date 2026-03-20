---
id: PERF-001
version: 0.0.1
status: draft
created: 2026-03-20
updated: 2026-03-20
author: @RogerVibes
priority: critical
category: feature
labels:
  - analytics
  - performance-dashboard
  - metrics
  - broker-kpis
depends_on:
  - ANAL-001
  - BROK-001
blocks: []
related_specs:
  - SCORE-001
  - GAMI-001
scope:
  packages:
    - backend/services/analytics_service.py
    - backend/api/performance.py
  files:
    - performance_calculator.py
    - metrics_aggregator.py
    - comparison_engine.py
---

# @SPEC:PERF-001: Performance Analytics Dashboard para Brokers

## HISTORY

### v0.0.1 (2026-03-20)
- **INITIAL**: Performance Analytics Dashboard - Creación inicial
- **AUTHOR**: @RogerVibes
- **SCOPE**: Dashboard de rendimiento con métricas individuales vs equipo, tendencias de conversión, análisis de actividades
- **CONTEXT**: Brokers no tienen visibilidad de su rendimiento ni pueden compararse con el equipo. Se necesita analytics detallado para mejorar
- **REASON**: Aumentar productividad de brokers 20% mediante visibilidad de métricas y benchmarks

---

## Environment

### Contexto de Negocio

- **Problema Actual**: Brokers no saben cómo están desempeñándose vs equipo
- **Objetivo**: Visibilidad completa de KPIs personales y comparativas
- **Métricas Clave**: Tasa de conversión, actividad diaria, velocidad de respuesta, ranking

### Infraestructura de Analytics

- **Backend**: FastAPI con MongoDB (aggregation pipelines)
- **Cache**: Redis para métricas precalculadas (TTL: 1 hora)
- **Frontend**: React con Recharts (gráficos interactivos)
- **Data Freshness**: Métricas actualizadas en tiempo real (<5 segundos)

---

## Assumptions

1. **Datos Históricos**: Mínimo 3 meses de datos para comparativas
2. **Privacidad de Métricas**: Brokers solo ven sus métricas + agregados del equipo (no datos individuales de otros brokers)
3. **Granularidad Temporal**: Métricas disponibles por día, semana, mes, trimestre
4. **Benchmarks**: Comparaciones vs promedio del equipo y vs top performer
5. **Goal Setting**: Brokers pueden setear metas personales y ver progreso

---

## Requirements

### Ubiquitous Requirements (Básicas)

- El sistema debe proveer dashboard de rendimiento personal para cada broker
- El sistema debe mostrar métricas de conversión, actividad, y velocidad
- El sistema debe permitir comparar rendimiento vs equipo (agregados)
- El sistema debe mostrar tendencias de conversión en el tiempo
- El sistema debe proveer leaderboards detallados por categoría

### Event-driven Requirements (WHEN-THEN)

- **WHEN** un broker accede a su dashboard, el sistema debe cargar métricas en <2 segundos
- **WHEN** un broker logra una venta, el sistema debe actualizar todas las métricas en tiempo real
- **WHEN** se cambia el rango de fechas, el sistema debe recalcular gráficos
- **WHEN** un broker setea una meta, el sistema debe mostrar progreso vs meta
- **WHEN** un broker está bajo el promedio del equipo, el sistema debe sugerir acciones de mejora

### State-driven Requirements (WHILE-THEN)

- **WHILE** un broker está en top 3 del ranking, el sistema debe mostrar badge de "Top Performer"
- **WHILE** un broker no ha tenido actividad en 48h, el sistema debe mostrar alerta de inactividad
- **WHILE** se cargan métricas, el sistema debe mostrar skeletons/loaders

### Optional Requirements (WHERE-THEN)

- **WHERE** un broker quiere exportar sus métricas, el sistema debe generar PDF/Excel
- **WHERE** un broker compara meses diferentes, el sistema debe mostrar variación porcentual
- **WHERE** se detecta patrón positivo (ej: conversión subiendo), el sistema debe felicitar al broker

### Constraints (IF-THEN)

- **IF** un broker es nuevo (<1 mes), el sistema debe compararlo vs promedio de primeros 30 días
- **IF** no hay suficientes datos (<3 meses), el sistema debe mostrar mensaje "Datos insuficientes para tendencia"
- **IF** un broker pide métricas de otro broker, el sistema debe denegar acceso (privacy)
- **IF** una métrica no puede calcularse, el sistema debe mostrar "N/A" en lugar de 0
- **IF** el sistema de cache falla, el sistema debe calcular métricas on-demand (más lento pero funcional)

---

## Specifications

### @CODE:PERF-001:METRICS Core Metrics

**Ubicación**: `backend/services/analytics_service.py`

#### 1. Métricas de Conversión

- **Tasa de Conversión Global**: (Ventas / Leads asignados) * 100
- **Tasa de Conversión por Etapa**:
  - Nuevo → Contactado: (Leads contactados / Leads nuevos) * 100
  - Contactado → Calificación: (Leads calificados / Leads contactados) * 100
  - Calificación → Presentación: (Presentaciones / Leads calificados) * 100
  - Presentación → Apartado: (Apartados / Presentaciones) * 100
  - Apartado → Venta: (Ventas / Apartados) * 100

- **Velocidad de Cierre**: Promedio de días desde lead creado → venta
- **Tasa de Abandono**: (Leads sin actividad por 30 días / Total leads) * 100

#### 2. Métricas de Actividad

- **Actividad Diaria**: Promedio de actividades (llamadas + emails + WhatsApp) por día
- **Actividad Semanal**: Total de actividades en la última semana
- **Distribución de Actividades**:
  - % de llamadas vs emails vs WhatsApp
  - Actividades por hora del día (heat map)

- **Primera Respuesta**: Tiempo promedio entre lead creado → primera actividad
- **Frecuencia de Seguimiento**: Promedio de días entre actividades consecutivas del mismo lead

#### 3. Métricas de Ingresos

- **Ventas Totales**: Suma de todas las ventas cerradas (en MXN)
- **Comisiones Ganadas**: Total de comisiones (calculado como % de ventas)
- **Ticket Promedio**: Venta total / Número de ventas
- **ROI de Tiempo**: (Comisiones / Horas trabajadas) - Valor por hora del broker

#### 4. Métricas de Ranking

- **Ranking Global**: Posición del broker en el equipo (1-10)
- **Ranking por Categoría**:
  - Top en ventas (mayor cantidad)
  - Top en conversión (mejor tasa)
  - Top en actividad (más puntos de gamificación)
  - Top en velocidad (respuesta más rápida)

- **Distancia al Top**: Diferencia vs broker #1 en cada categoría
- **Percentil**: % del equipo que está por debajo del broker

---

### @CODE:PERF-001:DASHBOARD Dashboard UI

**Ubicación**: `frontend/src/pages/PerformancePage.js`

#### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Performance Dashboard - [Broker Name]                       │
├─────────────────────────────────────────────────────────────┤
│ [KPI Cards - Top Row]                                        │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐    │
│ │ Ventas    │ │ Conversión│ │ Actividad │ │ Ranking   │    │
│ │ 5 / mes   │ │ 12%       │ │ 150 / sem ││ #3 de 10  │    │
│ │ ▲ 20%     │ │ ▼ 5%      │ │ ▲ 10%     │ │ ▲ 1 posición│  │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘    │
├─────────────────────────────────────────────────────────────┤
│ [Charts - Main Area]                                         │
│ ┌─────────────────────┐ ┌─────────────────────┐            │
│ │ Conversión (30 días)│ │ Actividad (7 días)  │            │
│ │ [Line Chart]        │ │ [Bar Chart]         │            │
│ └─────────────────────┘ └─────────────────────┘            │
│ ┌─────────────────────┐ ┌─────────────────────┐            │
│ │ Funnel de Pipeline  │ │ Comparación Equipo   │            │
│ │ [Funnel Chart]      │ │ [Radar Chart]        │            │
│ └─────────────────────┘ └─────────────────────┘            │
├─────────────────────────────────────────────────────────────┤
│ [Leaderboard - Bottom]                                       │
│ Top Brokers este mes                                         │
│ 🥇 #1 Maria González - 8 ventas, 15% conversión             │
│ 🥈 #2 Juan Pérez - 7 ventas, 13% conversión                 │
│ 🥉 #3 Tú - 5 ventas, 12% conversión                          │
│                                                              │
│ [Ver leaderboard completo →]                                 │
└─────────────────────────────────────────────────────────────┘
```

#### Componentes

1. **KPI Cards**: Métricas clave con trend indicators (▲▼)
2. **Time Range Selector**: Hoy, 7 días, 30 días, 90 días, este año
3. **Conversion Chart**: Línea de tiempo de conversiones
4. **Activity Chart**: Barras de actividad por día
5. **Pipeline Funnel**: Embudo de conversión por etapa
6. **Team Comparison**: Radar chart comparando broker vs promedio equipo
7. **Leaderboard**: Top 5 brokers con métricas destacadas

---

### @CODE:PERF-001:API Performance Endpoints

**Ubicación**: `backend/api/performance.py` (nuevo módulo)

#### Endpoints

1. **GET `/performance/summary`**
   - **Descripción**: Métricas resumidas del broker actual
   - **Query Params**: `?range=30d` (7d, 30d, 90d, this_year)
   - **Response**:
     ```json
     {
       "conversion_rate": 12.5,
       "total_sales": 5,
       "total_revenue": 12500000,
       "total_activities": 150,
       "avg_response_time_hours": 2.3,
       "ranking": 3,
       "percentile": 70
     }
     ```

2. **GET `/performance/conversion-trend`**
   - **Descripción**: Tendencia de conversión en el tiempo
   - **Response**:
     ```json
     {
       "dates": ["2026-03-01", "2026-03-02", ...],
       "conversion_rates": [10.5, 12.0, 11.8, ...],
       "team_average": [9.0, 10.5, 10.2, ...]
     }
     ```

3. **GET `/performance/pipeline-funnel`**
   - **Descripción**: Embudo de conversión por etapa
   - **Response**:
     ```json
     {
       "stages": [
         {"name": "Nuevo", "count": 100, "conversion_to_next": 80},
         {"name": "Contactado", "count": 80, "conversion_to_next": 60},
         {"name": "Calificación", "count": 48, "conversion_to_next": 40},
         ...
       ]
     }
     ```

4. **GET `/performance/team-comparison`**
   - **Descripción**: Comparación vs promedio del equipo
   - **Response**:
     ```json
     {
       "metrics": [
         {"name": "Conversión", "yours": 12, "team_avg": 10, "diff": +2},
         {"name": "Actividad", "yours": 150, "team_avg": 120, "diff": +30},
         {"name": "Velocidad", "yours": 2.3, "team_avg": 4.5, "diff": -2.2}
       ]
     }
     ```

5. **GET `/performance/leaderboard`**
   - **Descripción**: Ranking de brokers (solo muestra top 5 + posición del usuario)
   - **Query Params**: `?metric=sales` (sales, conversion, activity, speed)
   - **Response**:
     ```json
     {
       "brokers": [
         {"rank": 1, "name": "Maria González", "value": 8, "is_you": false},
         {"rank": 2, "name": "Juan Pérez", "value": 7, "is_you": false},
         {"rank": 3, "name": "Tú", "value": 5, "is_you": true},
         ...
       ]
     }
     ```

6. **POST `/performance/goals`**
   - **Descripción**: Setear meta personal
   - **Body**:
     ```json
     {
       "metric": "sales",
       "target": 10,
       "period": "month"
     }
     ```

7. **GET `/performance/export`**
   - **Descripción**: Exportar métricas a PDF/Excel
   - **Query Params**: `?format=pdf&range=30d`

---

## Traceability (@TAG)

- **SPEC**: @SPEC:PERF-001
- **TEST**:
  - `backend/tests/test_performance.py` → @TEST:PERF-001
  - `backend/tests/test_analytics_aggregation.py` → @TEST:PERF-001:AGG
- **CODE**:
  - `backend/services/analytics_service.py` → @CODE:PERF-001:SERVICE
  - `backend/api/performance.py` → @CODE:PERF-001:API
  - `frontend/src/pages/PerformancePage.js` → @CODE:PERF-001:UI
- **DOC**: `docs/performance-analytics-guide.md` → @DOC:PERF-001

---

## Acceptance Criteria

### Criterios de Aceptación

1. **Dashboard Completo**: Todos los KPIs y gráficos implementados
2. **Performance**: Métricas cargan en <2 segundos (cache hit)
3. **Comparativas Funcionando**: Broker puede compararse vs equipo
4. **Leaderboard en Tiempo Real**: Ranking se actualiza cada vez que hay una venta
5. **Exportación**: Brokers pueden descargar sus métricas en PDF

### Definición de Done

- [ ] Backend service con 20+ métricas calculadas
- [ ] Endpoints `/performance/*` funcionando y testeados
- [ ] Frontend dashboard con todos los gráficos
- [ ] Sistema de cache Redis configurado
- [ ] Leaderboard funcional y actualizado en tiempo real
- [ ] Exportación a PDF/Excel funcionando
- [ ] Documentación de métricas creada
