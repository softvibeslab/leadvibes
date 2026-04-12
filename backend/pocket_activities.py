"""
Pocket Activities Module

Handles activity and lead stage management for Rovi Pocket mobile app.
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from bson import ObjectId


async def create_pocket_activity(
    db,
    user_id: str,
    lead_id: str,
    activity_type: str,
    description: str,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create an activity from Pocket app.

    Activity types:
    - llamada: Phone call
    - whatsapp: WhatsApp message
    - email: Email sent
    - nota: Note added
    - cita: Appointment scheduled
    - visita: Property visit
    - cambio_etapa: Stage changed
    """
    tenant_id = f"tenant-{user_id[:8]}"

    # Get lead for context
    lead = await db.leads.find_one({
        "tenant_id": tenant_id,
        "id": lead_id
    })

    if not lead:
        raise ValueError("Lead not found")

    # Create activity
    activity = {
        "id": str(ObjectId()),
        "tenant_id": tenant_id,
        "user_id": user_id,
        "lead_id": lead_id,
        "lead_name": lead.get("name"),
        "activity_type": activity_type,
        "description": description,
        "metadata": metadata or {},
        "created_at": datetime.utcnow(),
    }

    await db.activities.insert_one(activity)

    # Update lead's last_contact
    update_data = {
        "last_contact": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    # Update intent_score based on activity
    current_score = lead.get("intent_score", 0)
    if activity_type in ["llamada", "cita", "visita"]:
        # High-value activities increase score
        update_data["intent_score"] = min(100, current_score + 10)
    elif activity_type in ["whatsapp", "email"]:
        # Medium-value activities
        update_data["intent_score"] = min(100, current_score + 5)

    await db.leads.update_one(
        {"id": lead_id, "tenant_id": tenant_id},
        {"$set": update_data}
    )

    return {
        "id": activity["id"],
        "activity_type": activity_type,
        "description": description,
        "lead_id": lead_id,
        "lead_name": lead.get("name"),
        "created_at": activity["created_at"],
    }


async def update_pocket_lead_stage(
    db,
    user_id: str,
    lead_id: str,
    new_stage: str,
    note: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Update lead stage from Pocket app.

    Valid stages: nuevo, contactado, calificacion, presentacion, apartado, venta, perdido
    """
    tenant_id = f"tenant-{user_id[:8]}"

    # Validate stage
    valid_stages = ["nuevo", "contactado", "calificacion", "presentacion", "apartado", "venta", "perdido"]
    if new_stage not in valid_stages:
        raise ValueError(f"Invalid stage. Must be one of: {valid_stages}")

    # Get current lead
    lead = await db.leads.find_one({
        "tenant_id": tenant_id,
        "id": lead_id
    })

    if not lead:
        raise ValueError("Lead not found")

    old_stage = lead.get("status", "nuevo")

    # Update lead
    update_data = {
        "status": new_stage,
        "updated_at": datetime.utcnow()
    }

    if note:
        update_data["notes"] = note

    # Update intent_score based on stage
    stage_scores = {
        "nuevo": 20,
        "contactado": 40,
        "calificacion": 60,
        "presentacion": 75,
        "apartado": 90,
        "venta": 100,
        "perdido": 0
    }
    update_data["intent_score"] = stage_scores.get(new_stage, 50)

    # Add stage change timestamp
    update_data[f"{new_stage}_at"] = datetime.utcnow()

    result = await db.leads.update_one(
        {"id": lead_id, "tenant_id": tenant_id},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise ValueError("Lead not found")

    # Create activity for stage change
    activity_note = f"Cambio de etapa: '{old_stage}' → '{new_stage}'"
    if note:
        activity_note += f"\nNota: {note}"

    await create_pocket_activity(
        db,
        user_id,
        lead_id,
        "cambio_etapa",
        activity_note,
        {
            "old_stage": old_stage,
            "new_stage": new_stage,
            **(metadata or {})
        }
    )

    # Award points for stage progress (if gamification is enabled)
    points_to_award = 0
    if new_stage in ["calificacion", "presentacion"]:
        points_to_award = 10
    elif new_stage == "apartado":
        points_to_award = 50
    elif new_stage == "venta":
        points_to_award = 100

    if points_to_award > 0:
        await _award_points(
            db,
            user_id,
            tenant_id,
            points_to_award,
            f"Lead {lead_id} avanzó a etapa '{new_stage}'"
        )

    # Return updated lead
    updated_lead = await db.leads.find_one({"id": lead_id, "tenant_id": tenant_id})
    return {
        "id": updated_lead.get("id"),
        "status": updated_lead.get("status"),
        "intent_score": updated_lead.get("intent_score"),
        "notes": updated_lead.get("notes"),
        "updated_at": updated_lead.get("updated_at"),
        "points_awarded": points_to_award,
        "old_stage": old_stage,
        "new_stage": new_stage,
    }


async def _award_points(
    db,
    user_id: str,
    tenant_id: str,
    points: int,
    reason: str
) -> None:
    """Award gamification points to a user."""
    # Create point ledger entry
    ledger_entry = {
        "id": str(ObjectId()),
        "tenant_id": tenant_id,
        "user_id": user_id,
        "points": points,
        "reason": reason,
        "created_at": datetime.utcnow(),
    }

    await db.point_ledgers.insert_one(ledger_entry)

    # Update user's total points
    await db.users.update_one(
        {"id": user_id},
        {
            "$inc": {"total_points": points},
            "$set": {"last_activity_date": datetime.utcnow()}
        }
    )


async def get_pocket_activities(
    db,
    user_id: str,
    lead_id: Optional[str] = None,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """
    Get activities for Pocket app.

    Can filter by lead_id or get all user activities.
    """
    tenant_id = f"tenant-{user_id[:8]}"

    query = {"tenant_id": tenant_id}

    if lead_id:
        query["lead_id"] = lead_id

    activities = await db.activities.find(query).sort("created_at", -1).limit(limit).to_list(length=limit)

    return [
        {
            "id": a.get("id"),
            "activity_type": a.get("activity_type"),
            "description": a.get("description"),
            "lead_id": a.get("lead_id"),
            "lead_name": a.get("lead_name"),
            "created_at": a.get("created_at"),
            "metadata": a.get("metadata", {}),
        }
        for a in activities
    ]


async def create_pocket_note(
    db,
    user_id: str,
    lead_id: str,
    note_text: str,
    is_private: bool = False
) -> Dict[str, Any]:
    """
    Create a note on a lead from Pocket app.

    Notes are stored as activities with type 'nota'.
    """
    return await create_pocket_activity(
        db,
        user_id,
        lead_id,
        "nota",
        note_text,
        {"is_private": is_private}
    )


async def schedule_pocket_follow_up(
    db,
    user_id: str,
    lead_id: str,
    follow_up_date: datetime,
    note: Optional[str] = None
) -> Dict[str, Any]:
    """
    Schedule a follow-up from Pocket app.

    Creates both a calendar event and an activity reminder.
    """
    tenant_id = f"tenant-{user_id[:8]}"

    # Get lead
    lead = await db.leads.find_one({
        "tenant_id": tenant_id,
        "id": lead_id
    })

    if not lead:
        raise ValueError("Lead not found")

    # Create calendar event
    event = {
        "id": str(ObjectId()),
        "tenant_id": tenant_id,
        "user_id": user_id,
        "title": f"Follow-up: {lead.get('name')}",
        "description": note or "Recordatorio de seguimiento",
        "event_type": "follow-up",
        "start_time": follow_up_date,
        "end_time": follow_up_date + timedelta(minutes=30),
        "lead_id": lead_id,
        "completed": False,
        "created_at": datetime.utcnow(),
    }

    await db.calendar_events.insert_one(event)

    # Create activity
    await create_pocket_activity(
        db,
        user_id,
        lead_id,
        "follow-up",
        f"Follow-up agendado para {follow_up_date.strftime('%Y-%m-%d %H:%M')}",
        {"event_id": event["id"], "note": note}
    )

    return {
        "event_id": event["id"],
        "title": event["title"],
        "start_time": event["start_time"],
        "message": "Follow-up agendado exitosamente"
    }
