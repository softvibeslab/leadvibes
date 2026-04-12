"""
Pocket API Handlers

Business logic handlers for Rovi Pocket mobile app endpoints.
These handlers encapsulate the Pocket-specific operations on top of
the existing CRM data models.
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from bson import ObjectId


async def get_pocket_dashboard_stats(db, user_id: str) -> Dict[str, Any]:
    """
    Get Pocket-specific dashboard stats for a broker.

    Focuses on individual broker metrics rather than agency-wide stats.
    """
    tenant_id = f"tenant-{user_id[:8]}"

    # Get user's goals
    user = await db.users.find_one({"id": user_id})
    goals = user.get("goals", {})

    # Get all leads for this user
    leads_cursor = db.leads.find({"tenant_id": tenant_id})
    leads = await leads_cursor.to_list(length=None)

    # Calculate pipeline metrics
    nuevo_count = sum(1 for l in leads if l.get("status") == "nuevo")
    contactado_count = sum(1 for l in leads if l.get("status") == "contactado")
    calificacion_count = sum(1 for l in leads if l.get("status") == "calificacion")
    presentacion_count = sum(1 for l in leads if l.get("status") == "presentacion")
    apartado_count = sum(1 for l in leads if l.get("status") == "apartado")
    venta_count = sum(1 for l in leads if l.get("status") == "venta")

    # Calculate value metrics
    total_pipeline_value = sum(
        l.get("budget_mxn", 0) for l in leads
        if l.get("status") in ["calificacion", "presentacion", "apartado"]
    )

    # Get recent activity (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_activities = await db.activities.find({
        "tenant_id": tenant_id,
        "created_at": {"$gte": week_ago}
    }).to_list(length=None)

    # Get today's events
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_events = await db.calendar_events.find({
        "tenant_id": tenant_id,
        "start_time": {"$gte": today_start}
    }).to_list(length=None)

    # Calculate momentum score
    momentum_score = (
        (len(recent_activities) * 10) +
        (apartado_count * 50) +
        (venta_count * 100) +
        (len(today_events) * 5)
    )

    return {
        "overview": {
            "total_leads": len(leads),
            "new_leads_week": nuevo_count,
            "pipeline_value": total_pipeline_value,
            "momentum_score": momentum_score,
        },
        "pipeline": {
            "nuevo": nuevo_count,
            "contactado": contactado_count,
            "calificacion": calificacion_count,
            "presentacion": presentacion_count,
            "apartado": apartado_count,
            "venta": venta_count,
        },
        "goals": {
            "monthly_sales_goal": goals.get("monthly_sales_goal", 0),
            "monthly_sales_current": venta_count,
            "monthly_leads_goal": goals.get("monthly_leads_goal", 0),
            "monthly_leads_current": nuevo_count,
            "progress_percentage": _calculate_goal_progress(venta_count, goals.get("monthly_sales_goal", 0)),
        },
        "today": {
            "events_count": len(today_events),
            "activities_count": len([a for a in recent_activities if a.get("created_at", datetime.utcnow()).date() == datetime.utcnow().date()]),
            "upcoming_appointments": len([e for e in today_events if e.get("event_type") == "cita"]),
        },
        "streak": {
            "days_active": user.get("streak_days", 0),
            "last_activity_date": user.get("last_activity_date"),
        },
    }


def _calculate_goal_progress(current: int, goal: int) -> float:
    """Calculate goal progress percentage."""
    if goal == 0:
        return 0.0
    return min(100.0, round((current / goal) * 100, 1))


async def get_pocket_leads(
    db,
    user_id: str,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """
    Get leads for Pocket app with mobile-optimized filtering.
    """
    tenant_id = f"tenant-{user_id[:8]}"

    # Build query
    query = {"tenant_id": tenant_id}

    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
        ]

    if status_filter:
        query["status"] = status_filter

    # Execute query
    cursor = db.leads.find(query).sort("updated_at", -1).skip(offset).limit(limit)
    leads = await cursor.to_list(length=limit)

    # Transform to Pocket format
    pocket_leads = []
    for lead in leads:
        pocket_leads.append(_transform_lead_to_pocket(lead))

    return pocket_leads


def _transform_lead_to_pocket(lead: Dict[str, Any]) -> Dict[str, Any]:
    """Transform a lead document to Pocket-optimized format."""
    return {
        "id": lead.get("id"),
        "name": lead.get("name"),
        "email": lead.get("email"),
        "phone": lead.get("phone"),
        "status": lead.get("status"),
        "priority": lead.get("priority"),
        "source": lead.get("source"),
        "budget_mxn": lead.get("budget_mxn"),
        "property_interest": lead.get("property_interest"),
        "location_preference": lead.get("location_preference"),
        "notes": lead.get("notes"),
        "intent_score": lead.get("intent_score", 0),
        "next_action": lead.get("next_action"),
        "last_contact": lead.get("last_contact"),
        "created_at": lead.get("created_at"),
        "updated_at": lead.get("updated_at"),
        "ai_analysis": lead.get("ai_analysis"),
        "pocket_priority": _calculate_pocket_priority(lead),
    }


def _calculate_pocket_priority(lead: Dict[str, Any]) -> str:
    """
    Calculate Pocket-specific priority based on multiple factors.

    Returns: 'hot', 'warm', 'cold', or 'stale'
    """
    status = lead.get("status", "")
    intent_score = lead.get("intent_score", 0)
    last_contact = lead.get("last_contact")

    if last_contact:
        # Calculate days since last contact
        days_since = (datetime.utcnow() - last_contact).days
    else:
        days_since = 999  # Never contacted

    # Hot lead: high intent, recently active, in pipeline
    if intent_score >= 80 and status in ["calificacion", "presentacion", "apartado"]:
        return "hot"

    # Warm lead: medium intent, some activity
    if intent_score >= 50 and days_since < 7:
        return "warm"

    # Cold lead: low activity or old
    if days_since > 30:
        return "stale"

    return "cold"


async def get_pocket_lead_detail(db, user_id: str, lead_id: str) -> Optional[Dict[str, Any]]:
    """Get detailed lead info for Pocket app."""
    tenant_id = f"tenant-{user_id[:8]}"

    lead = await db.leads.find_one({
        "tenant_id": tenant_id,
        "id": lead_id
    })

    if not lead:
        return None

    # Get lead activities
    activities = await db.activities.find({
        "tenant_id": tenant_id,
        "lead_id": lead_id
    }).sort("created_at", -1).to_list(length=50)

    # Get lead events
    events = await db.calendar_events.find({
        "tenant_id": tenant_id,
        "lead_id": lead_id
    }).sort("start_time", -1).to_list(length=20)

    return {
        **_transform_lead_to_pocket(lead),
        "activities": [_transform_activity_for_pocket(a) for a in activities],
        "events": [_transform_event_for_pocket(e) for e in events],
        "timeline": _build_lead_timeline(lead, activities, events),
        "next_best_action": _suggest_next_action(lead, activities),
    }


def _transform_activity_for_pocket(activity: Dict[str, Any]) -> Dict[str, Any]:
    """Transform activity to Pocket format."""
    return {
        "id": activity.get("id"),
        "type": activity.get("activity_type"),
        "description": activity.get("description"),
        "created_at": activity.get("created_at"),
        "lead_name": activity.get("lead_name"),
    }


def _transform_event_for_pocket(event: Dict[str, Any]) -> Dict[str, Any]:
    """Transform calendar event to Pocket format."""
    return {
        "id": event.get("id"),
        "title": event.get("title"),
        "start_time": event.get("start_time"),
        "end_time": event.get("end_time"),
        "event_type": event.get("event_type"),
        "completed": event.get("completed", False),
    }


def _build_lead_timeline(lead: Dict, activities: List, events: List) -> List[Dict]:
    """Build a chronological timeline for a lead."""
    timeline = []

    # Add activities
    for activity in activities:
        timeline.append({
            "type": "activity",
            "date": activity.get("created_at"),
            "description": activity.get("description"),
            "activity_type": activity.get("activity_type"),
        })

    # Add events
    for event in events:
        timeline.append({
            "type": "event",
            "date": event.get("start_time"),
            "description": event.get("title"),
            "event_type": event.get("event_type"),
        })

    # Sort by date descending
    timeline.sort(key=lambda x: x.get("date", datetime.utcnow()), reverse=True)

    return timeline[:20]  # Last 20 items


def _suggest_next_action(lead: Dict, activities: List) -> Dict[str, Any]:
    """Suggest the next best action for a lead using AI rules."""
    status = lead.get("status")
    last_contact = lead.get("last_contact")

    if last_contact:
        days_since = (datetime.utcnow() - last_contact).days
    else:
        days_since = 999

    # Rule-based suggestions
    if status == "nuevo":
        return {
            "action": "llamada",
            "priority": "alta",
            "reason": "Lead nuevo sin contacto inicial",
            "suggested_script": "Hola, te contacto de Rovi Premium Properties..."
        }

    if status == "contactado" and days_since > 2:
        return {
            "action": "whatsapp",
            "priority": "media",
            "reason": "Hace 2+ días desde el último contacto",
            "suggested_script": "Hola, quería seguir conversando sobre las propiedades..."
        }

    if status == "calificacion":
        return {
            "action": "cita",
            "priority": "alta",
            "reason": "Lead calificado, necesita visita",
            "suggested_script": "Te invito a conocer las propiedades que coinciden con tu perfil..."
        }

    if status in ["apartado", "venta"]:
        return {
            "action": "cierre",
            "priority": "alta",
            "reason": "Lead en etapa final de cierre",
            "suggested_script": "Vamos a finalizar los documentos de la operación..."
        }

    if days_since > 14:
        return {
            "action": "reactivacion",
            "priority": "baja",
            "reason": "Lead sin actividad por 14+ días",
            "suggested_script": "Hola, te contacto para saber si sigues interesado..."
        }

    return {
        "action": "seguimiento",
        "priority": "media",
        "reason": "Seguimiento regular",
        "suggested_script": "Te contacto para tener noticias tuyas..."
    }


async def create_pocket_activity(
    db,
    user_id: str,
    lead_id: str,
    activity_type: str,
    description: str
) -> Dict[str, Any]:
    """Create an activity from Pocket app."""
    tenant_id = f"tenant-{user_id[:8]}"

    # Get lead for context
    lead = await db.leads.find_one({
        "tenant_id": tenant_id,
        "id": lead_id
    })

    if not lead:
        raise ValueError("Lead not found")

    activity = {
        "id": str(ObjectId()),
        "tenant_id": tenant_id,
        "user_id": user_id,
        "lead_id": lead_id,
        "lead_name": lead.get("name"),
        "activity_type": activity_type,
        "description": description,
        "created_at": datetime.utcnow(),
    }

    await db.activities.insert_one(activity)

    # Update lead's last_contact
    await db.leads.update_one(
        {"id": lead_id, "tenant_id": tenant_id},
        {"$set": {"last_contact": datetime.utcnow(), "updated_at": datetime.utcnow()}}
    )

    return _transform_activity_for_pocket(activity)


async def update_pocket_lead_stage(
    db,
    user_id: str,
    lead_id: str,
    new_stage: str,
    note: Optional[str] = None
) -> Dict[str, Any]:
    """Update lead stage from Pocket app."""
    tenant_id = f"tenant-{user_id[:8]}"

    # Validate stage
    valid_stages = ["nuevo", "contactado", "calificacion", "presentacion", "apartado", "venta", "perdido"]
    if new_stage not in valid_stages:
        raise ValueError(f"Invalid stage. Must be one of: {valid_stages}")

    # Update lead
    update_data = {
        "status": new_stage,
        "updated_at": datetime.utcnow()
    }

    if note:
        update_data["notes"] = note

    result = await db.leads.update_one(
        {"id": lead_id, "tenant_id": tenant_id},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise ValueError("Lead not found")

    # Create activity for stage change
    await create_pocket_activity(
        db,
        user_id,
        lead_id,
        "cambio_etapa",
        f"Cambio de etapa a '{new_stage}'" + (f": {note}" if note else "")
    )

    # Return updated lead
    updated_lead = await db.leads.find_one({"id": lead_id, "tenant_id": tenant_id})
    return _transform_lead_to_pocket(updated_lead)
