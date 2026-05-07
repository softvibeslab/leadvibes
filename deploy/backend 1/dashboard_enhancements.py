"""
Dashboard Enhancements - ROVI CRM
Métricas avanzadas, tendencias y analytics del dashboard
"""

from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional, Any
import logging

logger = logging.getLogger(__name__)


async def get_dashboard_trends(
    db,
    tenant_id: str,
    months: int = 6
) -> dict:
    """
    Obtiene tendencias de ventas, leads y conversión por mes.
    Útil para gráficos de tendencias.
    """
    # Calcular fechas
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=30 * months)

    # Pipeline de agregación para ventas por mes
    ventas_pipeline = [
        {
            "$match": {
                "tenant_id": tenant_id,
                "status": "venta",
                "updated_at": {"$gte": start_date.isoformat()}
            }
        },
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$updated_at"},
                    "month": {"$month": "$updated_at"}
                },
                "ventas": {"$sum": 1},
                "monto_total": {"$sum": "$budget_mxn"}
            }
        },
        {
            "$sort": {"_id.year": 1, "_id.month": 1}
        }
    ]

    ventas_result = await db.leads.aggregate(ventas_pipeline).to_list(20)

    # Formatear resultados
    month_names = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ]

    ventas_por_mes = []
    for v in ventas_result:
        month_num = v["_id"]["month"]
        ventas_por_mes.append({
            "mes": month_names[month_num - 1],
            "ventas": v["ventas"],
            "monto": v.get("monto_total", 0)
        })

    # Leads por fuente
    leads_por_fuente_pipeline = [
        {
            "$match": {
                "tenant_id": tenant_id,
                "created_at": {"$gte": start_date.isoformat()}
            }
        },
        {
            "$group": {
                "_id": "$source",
                "count": {"$sum": 1}
            }
        },
        {
            "$sort": {"count": -1}
        },
        {
            "$limit": 10
        }
    ]

    leads_fuente_result = await db.leads.aggregate(leads_por_fuente_pipeline).to_list(20)

    leads_por_fuente = [
        {"fuente": l["_id"] or "directo", "count": l["count"]}
        for l in leads_fuente_result
    ]

    # Conversion funnel
    status_counts = await db.leads.aggregate([
        {
            "$match": {"tenant_id": tenant_id}
        },
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1}
            }
        }
    ]).to_list(20)

    status_map = {s["_id"]: s["count"] for s in status_counts}

    conversion_funnel = {
        "nuevo": status_map.get("nuevo", 0),
        "contactado": status_map.get("contactado", 0),
        "calificacion": status_map.get("calificacion", 0),
        "presentacion": status_map.get("presentacion", 0),
        "apartado": status_map.get("apartado", 0),
        "venta": status_map.get("venta", 0)
    }

    return {
        "period": f"last_{months}_months",
        "ventas_por_mes": ventas_por_mes,
        "leads_por_fuente": leads_por_fuente,
        "conversion_funnel": conversion_funnel
    }


async def get_broker_performance(
    db,
    tenant_id: str,
    broker_id: str,
    days: int = 30
) -> dict:
    """
    Obtiene métricas detalladas de performance de un broker.
    Incluye comparación vs período anterior.
    """
    now = datetime.now(timezone.utc)
    current_start = now - timedelta(days=days)
    previous_start = current_start - timedelta(days=days)

    # Leads contactados (período actual)
    leads_contactados = await db.leads.count_documents({
        "tenant_id": tenant_id,
        "assigned_broker_id": broker_id,
        "created_at": {"$gte": current_start.isoformat()}
    })

    # Actividades del broker
    activities_pipeline = [
        {
            "$match": {
                "tenant_id": tenant_id,
                "broker_id": broker_id,
                "created_at": {"$gte": current_start.isoformat()}
            }
        },
        {
            "$group": {
                "_id": "$activity_type",
                "count": {"$sum": 1}
            }
        }
    ]

    activities_result = await db.activities.aggregate(activities_pipeline).to_list(20)
    activities_map = {a["_id"]: a["count"] for a in activities_result}

    # Ventas y apartados
    ventas_pipeline = [
        {
            "$match": {
                "tenant_id": tenant_id,
                "assigned_broker_id": broker_id,
                "created_at": {"$gte": current_start.isoformat()},
                "status": {"$in": ["venta", "apartado"]}
            }
        },
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1}
            }
        }
    ]

    ventas_result = await db.leads.aggregate(ventas_pipeline).to_list(10)
    ventas_map = {v["_id"]: v["count"] for v in ventas_result}

    # Obtener nombre del broker
    broker = await db.users.find_one(
        {"id": broker_id},
        {"_id": 0, "name": 1, "avatar_url": 1}
    )

    # Métricas del período anterior (para comparación)
    previous_leads = await db.leads.count_documents({
        "tenant_id": tenant_id,
        "assigned_broker_id": broker_id,
        "created_at": {
            "$gte": previous_start.isoformat(),
            "$lt": current_start.isoformat()
        }
    })

    # Calcular cambio porcentual
    leads_change = 0
    if previous_leads > 0:
        leads_change = round(
            ((leads_contactados - previous_leads) / previous_leads) * 100,
            1
        )

    # Calcular conversion rate
    conversion_rate = 0
    total_leads = leads_contactados or 1
    ventas_count = ventas_map.get("venta", 0)
    conversion_rate = round((ventas_count / total_leads) * 100, 1)

    return {
        "broker_id": broker_id,
        "broker_name": broker.get("name", "Broker") if broker else "Broker",
        "period": f"last_{days}_days",
        "metrics": {
            "leads_contactados": leads_contactados,
            "llamadas_realizadas": activities_map.get("llamada", 0),
            "whatsapp_mensajes": activities_map.get("whatsapp", 0),
            "emails_enviados": activities_map.get("email", 0),
            "presentaciones": activities_map.get("visita", 0) + activities_map.get("zoom", 0),
            "apartados": ventas_map.get("apartado", 0),
            "ventas": ventas_map.get("venta", 0),
            "conversion_rate": conversion_rate
        },
        "tendencias": {
            "vs_periodo_anterior": f"{leads_change:+}%" if leads_change != 0 else "0%",
            "leads_anterior": previous_leads
        }
    }


async def get_dashboard_comparison(
    db,
    tenant_id: str
) -> dict:
    """
    Compara métricas del mes actual vs mes anterior.
    Útil para ver progreso.
    """
    now = datetime.now(timezone.utc)

    # Mes actual
    current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Mes anterior
    if now.month == 1:
        previous_month_start = now.replace(year=now.year - 1, month=12, day=1)
    else:
        previous_month_start = now.replace(month=now.month - 1, day=1)

    previous_month_end = current_month_start - timedelta(seconds=1)

    # Métricas mes actual
    current_metrics = await get_period_metrics(
        db, tenant_id, current_month_start, now
    )

    # Métricas mes anterior
    previous_metrics = await get_period_metrics(
        db, tenant_id, previous_month_start, previous_month_end
    )

    # Calcular cambios porcentuales
    cambios = {}
    for key in ["ventas", "apartados", "leads_nuevos"]:
        current_val = current_metrics.get(key, 0)
        prev_val = previous_metrics.get(key, 0)

        if prev_val > 0:
            cambio = round(((current_val - prev_val) / prev_val) * 100, 1)
            cambios[key] = f"{cambio:+}%"
        else:
            cambios[key] = "+100%" if current_val > 0 else "0%"

    return {
        "mes_actual": current_metrics,
        "mes_anterior": previous_metrics,
        "cambio_porcentual": cambios
    }


async def get_period_metrics(
    db,
    tenant_id: str,
    start_date: datetime,
    end_date: datetime
) -> dict:
    """Helper para obtener métricas de un período"""
    ventas = await db.leads.count_documents({
        "tenant_id": tenant_id,
        "status": "venta",
        "updated_at": {
            "$gte": start_date.isoformat(),
            "$lte": end_date.isoformat()
        }
    })

    apartados = await db.leads.count_documents({
        "tenant_id": tenant_id,
        "status": "apartado",
        "updated_at": {
            "$gte": start_date.isoformat(),
            "$lte": end_date.isoformat()
        }
    })

    leads_nuevos = await db.leads.count_documents({
        "tenant_id": tenant_id,
        "created_at": {
            "$gte": start_date.isoformat(),
            "$lte": end_date.isoformat()
        }
    })

    return {
        "ventas": ventas,
        "apartados": apartados,
        "leads_nuevos": leads_nuevos
    }


async def get_activity_feed_extended(
    db,
    tenant_id: str,
    limit: int = 20,
    offset: int = 0
) -> dict:
    """
    Activity feed extendido con paginación y filtros.
    Incluye activities, leads creados, eventos de calendario.
    """
    # Obtener actividades recientes
    activities = await db.activities.find({
        "tenant_id": tenant_id
    }, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)

    # Enrich con nombres (batch)
    broker_ids = list(set(a.get("broker_id") for a in activities if a.get("broker_id")))
    lead_ids = list(set(a.get("lead_id") for a in activities if a.get("lead_id")))

    brokers_map = {}
    leads_map = {}

    if broker_ids:
        brokers = await db.users.find(
            {"id": {"$in": broker_ids}},
            {"_id": 0, "id": 1, "name": 1, "avatar_url": 1}
        ).to_list(None)
        brokers_map = {b["id"]: b for b in brokers}

    if lead_ids:
        leads = await db.leads.find(
            {"id": {"$in": lead_ids}},
            {"_id": 0, "id": 1, "name": 1, "status": 1}
        ).to_list(None)
        leads_map = {l["id"]: l for l in leads}

    # Enrich activities
    enriched_activities = []
    for activity in activities:
        broker_info = brokers_map.get(activity.get("broker_id"), {})
        lead_info = leads_map.get(activity.get("lead_id"), {})

        enriched_activities.append({
            **activity,
            "broker_name": broker_info.get("name", "Desconocido"),
            "broker_avatar": broker_info.get("avatar_url"),
            "lead_name": lead_info.get("name", "Lead"),
            "lead_status": lead_info.get("status")
        })

    # Total count para paginación
    total_activities = await db.activities.count_documents({"tenant_id": tenant_id})

    return {
        "activities": enriched_activities,
        "pagination": {
            "total": total_activities,
            "limit": limit,
            "offset": offset,
            "has_more": (offset + limit) < total_activities
        }
    }


async def get_top_performing_brokers(
    db,
    tenant_id: str,
    metric: str = "ventas",
    limit: int = 5
) -> List[dict]:
    """
    Obtiene top brokers por métrica específica.
    metric puede ser: ventas, apartados, leads_contactados, puntos
    """
    # Get all brokers
    brokers = await db.users.find({
        "tenant_id": tenant_id,
        "role": {"$in": ["broker", "manager"]},
        "is_active": True
    }, {"_id": 0}).to_list(100)

    broker_ids = [b["id"] for b in brokers]

    # Get stats based on metric
    if metric == "puntos":
        pipeline = [
            {"$match": {"tenant_id": tenant_id, "broker_id": {"$in": broker_ids}}},
            {"$group": {"_id": "$broker_id", "total": {"$sum": "$points"}}},
            {"$sort": {"total": -1}},
            {"$limit": limit}
        ]
        result = await db.point_ledger.aggregate(pipeline).to_list(limit)
        stats_map = {r["_id"]: r["total"] for r in result}

    elif metric in ["ventas", "apartados"]:
        pipeline = [
            {
                "$match": {
                    "tenant_id": tenant_id,
                    "assigned_broker_id": {"$in": broker_ids},
                    "status": metric
                }
            },
            {"$group": {"_id": "$assigned_broker_id", "total": {"$sum": 1}}},
            {"$sort": {"total": -1}},
            {"$limit": limit}
        ]
        result = await db.leads.aggregate(pipeline).to_list(limit)
        stats_map = {r["_id"]: r["total"] for r in result}

    else:  # leads_contactados
        pipeline = [
            {
                "$match": {
                    "tenant_id": tenant_id,
                    "assigned_broker_id": {"$in": broker_ids}
                }
            },
            {"$group": {"_id": "$assigned_broker_id", "total": {"$sum": 1}}},
            {"$sort": {"total": -1}},
            {"$limit": limit}
        ]
        result = await db.leads.aggregate(pipeline).to_list(limit)
        stats_map = {r["_id"]: r["total"] for r in result}

    # Build result with broker info
    top_brokers = []
    for broker in brokers:
        bid = broker["id"]
        if bid in stats_map:
            top_brokers.append({
                "broker_id": bid,
                "broker_name": broker.get("name", "Broker"),
                "avatar_url": broker.get("avatar_url"),
                "metric_value": stats_map[bid]
            })

    # Sort by metric value
    top_brokers.sort(key=lambda x: x["metric_value"], reverse=True)

    return top_brokers[:limit]
