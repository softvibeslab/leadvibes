---
id: GAMI-001
version: 0.0.1
status: draft
created: 2026-03-20
updated: 2026-03-20
author: @RogerVibes
priority: medium
category: docs
labels:
  - gamification
  - documentation
  - existing-feature
  - points-system
depends_on: []
blocks: []
related_specs:
  - PERF-001
scope:
  packages:
    - backend/server.py
    - frontend/src/pages/GamificationPage.js
  files:
    - backend/models.py (GamificationRule, PointLedger, Achievement models)
    - backend/services/gamification_service.py
---

# @SPEC:GAMI-001: Gamification System - Documentación

## HISTORY

### v0.0.1 (2026-03-20)
- **INITIAL**: Documentación de Gamification System - Creación inicial
- **AUTHOR**: @RogerVibes
- **SCOPE**: Documentar feature existente de gamificación (puntos, rankings, logros, reglas)
- **CONTEXT**: Feature está 90% implementada pero falta documentación formal
- **REASON**: Estandarizar feature de gamificación para facilitar mantenimiento y ajustes de reglas

---

## Environment

### Estado Actual de la Feature

- **Completitud**: 90% implementada
- **Ubicación**: `backend/server.py` (endpoints), `frontend/src/pages/GamificationPage.js` (UI)
- **Database**: MongoDB con colecciones `gamification_rules`, `point_ledgers`, `achievements`, `broker_stats`

### Sistema de Puntos

| Actividad | Puntos | Descripción |
|-----------|--------|-------------|
| Llamada | +10 | Llamada telefónica completada |
| WhatsApp | +5 | Mensaje de WhatsApp enviado |
| Email | +5 | Email enviado |
| Zoom | +15 | Videollamada completada |
| Visita | +30 | Visita presencial a propiedad |
| Apartado | +100 | Apartado de propiedad |
| Venta | +200 | Venta cerrada |

---

## Assumptions

1. **Feature Implementada**: Código existe y está funcionando en producción
2. **Puntos Acumulativos**: Puntos se suman mes a mes (total points) pero también se resetean mensualmente (monthly points)
3. **Competitividad**: Ranking genera competencia sana entre brokers
4. **Reglas Configurables**: Cada tenant puede ajustar valores de puntos

---

## Requirements

### Ubiquitous Requirements (Básicas)

- El sistema debe otorgar puntos por cada actividad registrada
- El sistema debe mantener leaderboard (ranking) de brokers
- El sistema debe permitir desbloquear logros (achievements)
- El sistema debe permitir configurar reglas de gamificación por tenant
- El sistema debe mantener historial de puntos (PointLedger)

### Event-driven Requirements (WHEN-THEN)

- **WHEN** se crea una actividad, el sistema debe calcular puntos y sumar al broker
- **WHEN** un broker alcanza meta mensual, el sistema debe desbloquear logro
- **WHEN** se consulta leaderboard, el sistema debe ordenar brokers por puntos descendente
- **WHEN** inicia nuevo mes, el sistema debe resetear puntos mensuales (mantener totales)
- **WHEN** un broker supera a otro en ranking, el sistema debe notificar cambio de posición

### State-driven Requirements (WHILE-THEN)

- **WHILE** un broker está en top 3, el sistema debe mostrar badge de "Top Performer"
- **WHILE** un broker tiene racha de actividades (>5 días consecutivos), el sistema debe mostrar streak
- **WHILE** un broker se acerca a meta (ej: 90% de ventas mensuales), el sistema debe animarlo

### Optional Requirements (WHERE-THEN)

- **WHERE** un broker tiene puntos inusualmente altos, el sistema debe verificar que no hay trampa
- **WHERE** un broker es nuevo (<1 mes), el sistema puede mostrar ranking aparte (novatos)
- **WHERE** se detecta inactividad (>7 días sin puntos), el sistema debe enviar recordatorio

### Constraints (IF-THEN)

- **IF** una actividad se elimina, el sistema debe restar puntos otorgados
- **IF** un broker deja la empresa, el sistema debe mantenerlo en leaderboard histórico pero no en ranking actual
- **IF** las reglas de gamificación cambian, el sistema debe aplicar nuevas reglas solo a futuras actividades (no retroactivo)
- **IF** hay empate en ranking, el sistema debe desempatar por fecha de última actividad
- **IF** un broker intenta modificar sus puntos manualmente, el sistema debe rechazar y loggear intento

---

## Specifications

### @CODE:GAMI-001:MODEL Gamification Data Models

**Ubicación**: `backend/models.py`

```python
class GamificationRule(BaseModel):
    id: str
    tenant_id: str
    activity_type: str  # llamada, whatsapp, email, zoom, visita, apartado, venta
    points: int
    active: bool
    created_at: datetime
    updated_at: datetime

class PointLedger(BaseModel):
    id: str
    broker_id: str
    activity_id: str  # Referencia a actividad que generó puntos
    activity_type: str
    points: int
    month: int  # 1-12
    year: int
    created_at: datetime

class Achievement(BaseModel):
    id: str
    tenant_id: str
    name: str  # "10 Ventas", "Top Performer", "100 Actividades"
    description: str
    icon: str  # URL o emoji
    requirement: Dict[str, Any]  # {"type": "sales", "target": 10}
    reward_points: int  # Puntos extra por desbloquear logro

class BrokerStats(BaseModel):
    broker_id: str
    tenant_id: str

    # Puntos
    total_points: int = 0  # Acumulativos toda la historia
    monthly_points: int = 0  # Resetean cada mes

    # Contadores
    total_activities: int = 0
    total_sales: int = 0
    total_apartados: int = 0

    # Rankings
    current_rank: Optional[int]  # Posición actual en leaderboard
    best_rank: Optional[int]  # Mejor posición histórica

    # Logros
    unlocked_achievements: List[str] = []

    updated_at: datetime
```

### @CODE:GAMI-001:API Endpoints

**Ubicación**: `backend/server.py`

#### 1. GET `/api/gamification/leaderboard`
- **Descripción**: Obtener ranking de brokers
- **Query Params**: `?month=3&year=2026` (opcional, por defecto mes actual)
- **Response**:
  ```json
  {
    "leaderboard": [
      {
        "rank": 1,
        "broker_id": "uuid",
        "name": "María González",
        "monthly_points": 1250,
        "total_activities": 85,
        "total_sales": 8,
        "avatar": "https://..."
      },
      {
        "rank": 2,
        "broker_id": "uuid",
        "name": "Juan Pérez",
        "monthly_points": 980,
        "total_activities": 72,
        "total_sales": 6,
        "avatar": "https://..."
      },
      ...
    ],
    "current_user_rank": 3,
    "current_user_points": 750
  }
  ```

#### 2. GET `/api/gamification/stats/{broker_id}`
- **Descripción**: Obtener estadísticas de un broker
- **Response**:
  ```json
  {
    "broker_id": "uuid",
    "total_points": 15000,
    "monthly_points": 750,
    "total_activities": 350,
    "total_sales": 25,
    "total_apartados": 30,
    "current_rank": 3,
    "best_rank": 1,
    "unlocked_achievements": ["10 Ventas", "100 Actividades", "Top Performer"],
    "points_this_month": 750,
    "points_to_next_rank": 230  # Diferencia vs broker #2
  }
  ```

#### 3. GET `/api/gamification/achievements`
- **Descripción**: Listar logros disponibles del tenant
- **Response**:
  ```json
  {
    "achievements": [
      {
        "id": "ach_001",
        "name": "Primeras 10 Ventas",
        "description": "Cierra tus primeras 10 ventas",
        "icon": "🏆",
        "requirement": {"type": "sales", "target": 10},
        "reward_points": 100,
        "unlocked": true,
        "unlocked_at": "2026-03-15T10:00:00Z"
      },
      {
        "id": "ach_002",
        "name": "Top Performer",
        "description": "Alcanza el #1 en el ranking mensual",
        "icon": "🥇",
        "requirement": {"type": "rank", "target": 1},
        "reward_points": 200,
        "unlocked": false
      },
      ...
    ]
  }
  ```

#### 4. GET `/api/gamification/rules` (Admin only)
- **Descripción**: Listar reglas de gamificación del tenant
- **Response**:
  ```json
  {
    "rules": [
      {"activity_type": "llamada", "points": 10, "active": true},
      {"activity_type": "whatsapp", "points": 5, "active": true},
      {"activity_type": "venta", "points": 200, "active": true},
      ...
    ]
  }
  ```

#### 5. POST `/api/gamification/rules` (Admin only)
- **Descripción**: Crear o actualizar regla de gamificación
- **Body**:
  ```json
  {
    "activity_type": "zoom",
    "points": 20,
    "active": true
  }
  ```
- **Response**: Regla creada/actualizada

---

### @CODE:GAMI-001:LOGIC Points Calculation Logic

**Ubicación**: `backend/services/gamification_service.py`

```python
async def award_points(broker_id: str, activity: Activity):
    """Otorga puntos a broker por actividad"""

    # Obtener regla de gamificación
    rule = await db.gamification_rules.find_one({
        "tenant_id": activity.tenant_id,
        "activity_type": activity.type,
        "active": True
    })

    if not rule:
        logger.warning(f"No gamification rule for activity type {activity.type}")
        return

    points = rule["points"]

    # Obtener stats del broker
    stats = await db.broker_stats.find_one({"broker_id": broker_id})
    if not stats:
        stats = BrokerStats(broker_id=broker_id, tenant_id=activity.tenant_id)

    # Actualizar puntos
    stats.total_points += points
    stats.monthly_points += points
    stats.total_activities += 1

    # Actualizar contadores específicos
    if activity.type == "apartado":
        stats.total_apartados += 1
    elif activity.type == "venta":
        stats.total_sales += 1

    # Guardar en ledger (historial)
    await db.point_ledgers.insert_one({
        "broker_id": broker_id,
        "activity_id": activity.id,
        "activity_type": activity.type,
        "points": points,
        "month": datetime.utcnow().month,
        "year": datetime.utcnow().year,
        "created_at": datetime.utcnow()
    })

    # Actualizar stats
    await db.broker_stats.update_one(
        {"broker_id": broker_id},
        {"$set": stats.dict()}
    )

    # Verificar si desbloqueó logros
    await check_achievements(broker_id, stats)

    # Actualizar ranking
    await update_leaderboard(activity.tenant_id)

async def check_achievements(broker_id: str, stats: BrokerStats):
    """Verifica si broker desbloqueó nuevos logros"""

    achievements = await db.achievements.find({"tenant_id": stats.tenant_id}).to_list(None)

    for achievement in achievements:
        if achievement.id in stats.unlocked_achievements:
            continue  # Ya desbloqueado

        requirement = achievement.requirement

        # Verificar requisito
        unlocked = False
        if requirement["type"] == "sales" and stats.total_sales >= requirement["target"]:
            unlocked = True
        elif requirement["type"] == "rank" and stats.current_rank == requirement["target"]:
            unlocked = True
        elif requirement["type"] == "activities" and stats.total_activities >= requirement["target"]:
            unlocked = True

        if unlocked:
            stats.unlocked_achievements.append(achievement.id)
            stats.total_points += achievement.reward_points  # Bonus

            # Notificar al broker
            await send_notification(
                broker_id,
                f"🎉 Logro desbloqueado: {achievement.name}",
                f"Ganaste +{achievement.reward_points} puntos extra"
            )

    await db.broker_stats.update_one(
        {"broker_id": broker_id},
        {"$set": {"unlocked_achievements": stats.unlocked_achievements}}
    )
```

---

### @CODE:GAMI-001:UI Gamification UI

**Ubicación**: `frontend/src/pages/GamificationPage.js`

#### Componentes

1. **Leaderboard**
   - Top 10 brokers del mes
   - Columnas: Rank, Avatar, Nombre, Puntos, Ventas, Actividades
   - Badge para top 3 (🥇🥈🥉)
   - Highlight para broker actual

2. **Mi Progreso**
   - Puntos del mes actual
   - Progreso vs meta mensual (progress bar)
   - Logros desbloqueados
   - Próximos logros a desbloquear

3. **Historial de Puntos**
   - Tabla de últimas actividades que generaron puntos
   - Columnas: Fecha, Actividad, Puntos
   - Filtros por mes/año

4. **Achievements Gallery**
   - Grid de logros disponibles
   - Logros desbloqueados (color), bloqueados (gris)
   - Tooltip con requisitos

---

## Traceability (@TAG)

- **SPEC**: @SPEC:GAMI-001
- **TEST**: `backend/tests/test_gamification.py` → @TEST:GAMI-001
- **CODE**:
  - `backend/server.py` → @CODE:GAMI-001:API (Endpoints de gamificación)
  - `backend/services/gamification_service.py` → @CODE:GAMI-001:SERVICE
  - `backend/models.py` → @CODE:GAMI-001:DATA
  - `frontend/src/pages/GamificationPage.js` → @CODE:GAMI-001:UI
- **DOC**: `docs/gamification-system-guide.md` → @DOC:GAMI-001

---

## Acceptance Criteria

### Criterios de Aceptación

1. **Sistema de Puntos**: Puntos se otorgan correctamente por cada actividad
2. **Leaderboard Funcional**: Ranking se actualiza en tiempo real
3. **Logros Desbloqueables**: Brokers pueden desbloquear logros y recibir bonus
4. **Reglas Configurables**: Admin puede ajustar valores de puntos
5. **Historial Completo**: PointLedger registra todas las transacciones de puntos

### Definición de Done

- [x] Feature implementada (90% completada)
- [ ] Tests unitarios y de integración creados
- [ ] Documentación de reglas de gamificación creada
- [ ] User guide para brokers creada
- [ ] Tutorial de configuración de reglas para admins creado
