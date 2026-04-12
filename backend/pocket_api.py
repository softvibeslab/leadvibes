"""
Pocket API Module

FastAPI router for Rovi Pocket mobile app endpoints.
Provides a mobile-optimized API on top of the existing CRM backend.
"""
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
import logging

from pocket_auth import get_current_pocket_user, require_pocket_auth, create_pocket_user_response
from pocket_handlers import (
    get_pocket_dashboard_stats,
    get_pocket_leads,
    get_pocket_lead_detail,
)
from pocket_activities import (
    create_pocket_activity,
    update_pocket_lead_stage,
    get_pocket_activities,
    create_pocket_note,
    schedule_pocket_follow_up,
)
from pocket_copilot import (
    pocket_copilot_query,
    generate_pocket_lead_script,
    build_pocket_context,
)
from ai_service import get_ai_response, analyze_lead, generate_sales_script

logger = logging.getLogger(__name__)

# Create Pocket API router
pocket_router = APIRouter(prefix="/api/pocket", tags=["pocket"])


# ============================================================================
# Request/Response Models
# ============================================================================

class PocketAuthResponse(BaseModel):
    """Response model for Pocket authentication."""
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


class PocketLoginRequest(BaseModel):
    """Login request for Pocket app."""
    email: str
    password: str


class PocketLeadUpdateRequest(BaseModel):
    """Request to update lead from Pocket."""
    status: Optional[str] = None
    notes: Optional[str] = None
    priority: Optional[str] = None


class PocketActivityCreateRequest(BaseModel):
    """Request to create activity from Pocket."""
    lead_id: str
    activity_type: str = Field(..., description="Type: llamada, whatsapp, email, nota, cita, etc.")
    description: str


class PocketCopilotQueryRequest(BaseModel):
    """Request for copilot AI query."""
    message: str
    context: Optional[Dict[str, Any]] = None


class PocketScriptGenerationRequest(BaseModel):
    """Request to generate sales script."""
    lead_id: str
    script_type: str = Field(default="seguimiento", description="seguimiento, cierre, presentación, etc.")


# ============================================================================
# Authentication Endpoints
# ============================================================================

@pocket_router.post("/auth/login", response_model=PocketAuthResponse)
async def pocket_login(
    request: PocketLoginRequest,
    db=None  # Will be injected from main app
):
    """
    Pocket login endpoint.

    Authenticates a Pocket mobile user and returns a JWT token.
    This is a wrapper around the existing auth system.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )

    # Find user by email
    user = await db.users.find_one({"email": request.email})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )

    # Verify password (this would use the existing auth system)
    # For now, we'll create a token directly
    from pocket_auth import create_pocket_access_token

    token_data = {
        "sub": user["id"],
        "email": user["email"],
        "type": "pocket"
    }

    access_token = create_pocket_access_token(token_data)

    return PocketAuthResponse(
        access_token=access_token,
        user=create_pocket_user_response(user)
    )


@pocket_router.get("/me")
async def get_pocket_me(
    current_user: dict = Depends(require_pocket_auth)
):
    """
    Get current Pocket user profile.

    Returns the authenticated user's profile optimized for mobile.
    """
    return create_pocket_user_response(current_user)


# ============================================================================
# Dashboard Endpoints
# ============================================================================

@pocket_router.get("/dashboard")
async def get_pocket_dashboard(
    current_user: dict = Depends(require_pocket_auth),
    db=None
):
    """
    Get Pocket dashboard data.

    Returns optimized dashboard stats for mobile:
    - Overview metrics
    - Pipeline summary
    - Goals progress
    - Today's agenda
    - Activity streak
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )

    user_id = current_user["id"]
    stats = await get_pocket_dashboard_stats(db, user_id)

    return stats


@pocket_router.get("/dashboard/recent-activity")
async def get_pocket_recent_activity(
    limit: int = 20,
    current_user: dict = Depends(require_pocket_auth),
    db=None
):
    """
    Get recent activity for Pocket dashboard.

    Returns the most recent activities for the authenticated user.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )

    user_id = current_user["id"]
    tenant_id = f"tenant-{user_id[:8]}"

    activities = await db.activities.find({
        "tenant_id": tenant_id
    }).sort("created_at", -1).limit(limit).to_list(length=limit)

    return [
        {
            "id": a.get("id"),
            "activity_type": a.get("activity_type"),
            "description": a.get("description"),
            "lead_name": a.get("lead_name"),
            "created_at": a.get("created_at"),
        }
        for a in activities
    ]


# ============================================================================
# Leads Endpoints
# ============================================================================

@pocket_router.get("/leads")
async def get_pocket_leads_endpoint(
    search: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: dict = Depends(require_pocket_auth),
    db=None
):
    """
    Get leads for Pocket app.

    Supports filtering and search optimized for mobile.
    Returns Pocket-optimized lead objects with priority scoring.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )

    user_id = current_user["id"]
    leads = await get_pocket_leads(db, user_id, search, status, limit, offset)

    return leads


@pocket_router.get("/leads/{lead_id}")
async def get_pocket_lead_endpoint(
    lead_id: str,
    current_user: dict = Depends(require_pocket_auth),
    db=None
):
    """
    Get detailed lead information for Pocket.

    Returns comprehensive lead data including:
    - Lead details
    - Activity history
    - Related events
    - Timeline
    - Next best action suggestion
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )

    user_id = current_user["id"]
    lead = await get_pocket_lead_detail(db, user_id, lead_id)

    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )

    return lead


@pocket_router.patch("/leads/{lead_id}")
async def update_pocket_lead_endpoint(
    lead_id: str,
    request: PocketLeadUpdateRequest,
    current_user: dict = Depends(require_pocket_auth),
    db=None
):
    """
    Update lead from Pocket app.

    Allows updating lead status, notes, and priority.
    Automatically creates activity records for changes.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )

    user_id = current_user["id"]

    # Handle stage change
    if request.status:
        return await update_pocket_lead_stage(
            db, user_id, lead_id, request.status, request.notes
        )

    # Handle other updates
    tenant_id = f"tenant-{user_id[:8]}"
    update_data = {}

    if request.notes is not None:
        update_data["notes"] = request.notes
    if request.priority is not None:
        update_data["priority"] = request.priority

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields to update"
        )

    update_data["updated_at"] = datetime.utcnow()

    result = await db.leads.update_one(
        {"id": lead_id, "tenant_id": tenant_id},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )

    # Return updated lead
    updated_lead = await db.leads.find_one({"id": lead_id, "tenant_id": tenant_id})
    return {
        "id": updated_lead.get("id"),
        "status": updated_lead.get("status"),
        "notes": updated_lead.get("notes"),
        "priority": updated_lead.get("priority"),
        "updated_at": updated_lead.get("updated_at"),
    }


# ============================================================================
# Activities Endpoints
# ============================================================================

@pocket_router.post("/activities")
async def create_pocket_activity_endpoint(
    request: PocketActivityCreateRequest,
    current_user: dict = Depends(require_pocket_auth),
    db=None
):
    """
    Create activity from Pocket app.

    Records a new activity (call, message, note, etc.) for a lead.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )

    user_id = current_user["id"]

    try:
        activity = await create_pocket_activity(
            db,
            user_id,
            request.lead_id,
            request.activity_type,
            request.description
        )
        return activity
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ============================================================================
# Calendar Endpoints
# ============================================================================

@pocket_router.get("/calendar/today")
async def get_pocket_today_events(
    current_user: dict = Depends(require_pocket_auth),
    db=None
):
    """
    Get today's calendar events for Pocket.

    Returns events scheduled for today including appointments and tasks.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )

    user_id = current_user["id"]
    tenant_id = f"tenant-{user_id[:8]}"

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start.replace(hour=23, minute=59, second=59)

    events = await db.calendar_events.find({
        "tenant_id": tenant_id,
        "start_time": {"$gte": today_start, "$lte": today_end}
    }).sort("start_time", 1).to_list(length=None)

    return [
        {
            "id": e.get("id"),
            "title": e.get("title"),
            "description": e.get("description"),
            "event_type": e.get("event_type"),
            "start_time": e.get("start_time"),
            "end_time": e.get("end_time"),
            "lead_id": e.get("lead_id"),
            "completed": e.get("completed", False),
            "lead": e.get("lead"),
        }
        for e in events
    ]


@pocket_router.post("/calendar/events")
async def create_pocket_calendar_event(
    event_data: Dict[str, Any],
    current_user: dict = Depends(require_pocket_auth),
    db=None
):
    """
    Create calendar event from Pocket app.

    Creates a new calendar event with optional lead association.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )

    user_id = current_user["id"]
    tenant_id = f"tenant-{user_id[:8]}"

    # Create event
    event = {
        "id": str(ObjectId()),
        "tenant_id": tenant_id,
        "user_id": user_id,
        "title": event_data.get("title"),
        "description": event_data.get("description"),
        "event_type": event_data.get("event_type", "cita"),
        "start_time": event_data.get("start_time"),
        "end_time": event_data.get("end_time"),
        "lead_id": event_data.get("lead_id"),
        "reminder_minutes": event_data.get("reminder_minutes"),
        "color": event_data.get("color"),
        "completed": False,
        "created_at": datetime.utcnow(),
    }

    await db.calendar_events.insert_one(event)

    return {
        "id": event["id"],
        "message": "Evento creado exitosamente",
        "synced_to_google": False  # TODO: Implement Google Calendar sync
    }


# ============================================================================
# AI/Copilot Endpoints
# ============================================================================

@pocket_router.post("/copilot/query")
async def pocket_copilot_query_endpoint(
    request: PocketCopilotQueryRequest,
    current_user: dict = Depends(require_pocket_auth),
    db=None
):
    """
    Pocket Copilot AI query endpoint.

    Allows Pocket users to chat with the AI copilot about their leads,
    pipeline, schedule, and get recommendations.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )

    user_id = current_user["id"]
    lead_id = request.context.get("lead_id") if request.context else None

    try:
        response = await pocket_copilot_query(
            db,
            user_id,
            request.message,
            lead_id
        )

        return response

    except Exception as e:
        logger.error(f"Pocket AI query error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing AI query"
        )


@pocket_router.post("/leads/{lead_id}/analyze")
async def pocket_analyze_lead(
    lead_id: str,
    current_user: dict = Depends(require_pocket_auth),
    db=None
):
    """
    Analyze lead with AI for Pocket.

    Returns AI analysis including intent score, sentiment, and recommendations.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )

    user_id = current_user["id"]
    tenant_id = f"tenant-{user_id[:8]}"

    # Get lead
    lead = await db.leads.find_one({
        "tenant_id": tenant_id,
        "id": lead_id
    })

    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )

    try:
        analysis = await analyze_lead(lead)
        return analysis
    except Exception as e:
        logger.error(f"Lead analysis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error analyzing lead"
        )


@pocket_router.post("/leads/{lead_id}/generate-script")
async def pocket_generate_script(
    lead_id: str,
    request: PocketScriptGenerationRequest,
    current_user: dict = Depends(require_pocket_auth),
    db=None
):
    """
    Generate sales script for Pocket.

    Creates a personalized sales script for a specific lead and script type.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )

    user_id = current_user["id"]

    try:
        script = await generate_pocket_lead_script(
            db,
            user_id,
            lead_id,
            request.script_type
        )

        return script

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Pocket script generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error generating script"
        )


# ============================================================================
# Import Endpoints
# ============================================================================

@pocket_router.post("/import/preview")
async def pocket_import_preview(
    file_data: Dict[str, Any],
    current_user: dict = Depends(require_pocket_auth),
    db=None
):
    """
    Preview import data for Pocket.

    Analyzes uploaded file and shows how leads will be imported.
    """
    # TODO: Implement import preview logic
    return {
        "message": "Import preview not yet implemented",
        "status": "pending"
    }


@pocket_router.post("/import/execute")
async def pocket_import_execute(
    import_config: Dict[str, Any],
    current_user: dict = Depends(require_pocket_auth),
    db=None
):
    """
    Execute leads import for Pocket.

    Imports leads from configured file with column mapping.
    """
    # TODO: Implement import execution logic
    return {
        "message": "Import execution not yet implemented",
        "status": "pending"
    }


# ============================================================================
# Enhanced Activities Endpoints
# ============================================================================

@pocket_router.get("/activities")
async def get_pocket_activities_endpoint(
    lead_id: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(require_pocket_auth),
    db=None
):
    """
    Get activities for Pocket app.

    Returns activity history, optionally filtered by lead.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )

    user_id = current_user["id"]
    activities = await get_pocket_activities(db, user_id, lead_id, limit)

    return activities


@pocket_router.post("/activities/notes")
async def create_pocket_note_endpoint(
    note_data: Dict[str, Any],
    current_user: dict = Depends(require_pocket_auth),
    db=None
):
    """
    Create a note on a lead from Pocket app.

    Creates a private or public note attached to a lead.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )

    user_id = current_user["id"]

    try:
        note = await create_pocket_note(
            db,
            user_id,
            note_data.get("lead_id"),
            note_data.get("note_text"),
            note_data.get("is_private", False)
        )
        return note
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@pocket_router.post("/activities/follow-up")
async def schedule_pocket_follow_up_endpoint(
    follow_up_data: Dict[str, Any],
    current_user: dict = Depends(require_pocket_auth),
    db=None
):
    """
    Schedule a follow-up from Pocket app.

    Creates a calendar event and activity reminder for follow-up.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )

    user_id = current_user["id"]

    try:
        # Parse datetime
        follow_up_date = datetime.fromisoformat(
            follow_up_data.get("follow_up_date").replace("Z", "+00:00")
        )

        result = await schedule_pocket_follow_up(
            db,
            user_id,
            follow_up_data.get("lead_id"),
            follow_up_date,
            follow_up_data.get("note")
        )

        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@pocket_router.patch("/leads/{lead_id}/stage")
async def update_pocket_lead_stage_endpoint(
    lead_id: str,
    stage_data: Dict[str, Any],
    current_user: dict = Depends(require_pocket_auth),
    db=None
):
    """
    Update lead stage from Pocket app.

    Changes the lead's pipeline stage and automatically creates
    an activity record. Awards gamification points for progress.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )

    user_id = current_user["id"]

    try:
        result = await update_pocket_lead_stage(
            db,
            user_id,
            lead_id,
            stage_data.get("stage"),
            stage_data.get("note"),
            stage_data.get("metadata")
        )

        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ============================================================================
# Quick Actions Endpoints
# ============================================================================

@pocket_router.post("/leads/{lead_id}/quick-actions/call")
async def pocket_log_call(
    lead_id: str,
    call_data: Dict[str, Any],
    current_user: dict = Depends(require_pocket_auth),
    db=None
):
    """
    Log a phone call from Pocket app.

    Creates a 'llamada' activity with optional notes and outcome.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )

    user_id = current_user["id"]

    description = f"Llamada {call_data.get('outcome', 'realizada')}"
    if call_data.get("notes"):
        description += f": {call_data['notes']}"

    try:
        activity = await create_pocket_activity(
            db,
            user_id,
            lead_id,
            "llamada",
            description,
            {
                "outcome": call_data.get("outcome"),
                "duration_seconds": call_data.get("duration_seconds"),
            }
        )

        return activity
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@pocket_router.post("/leads/{lead_id}/quick-actions/whatsapp")
async def pocket_log_whatsapp(
    lead_id: str,
    message_data: Dict[str, Any],
    current_user: dict = Depends(require_pocket_auth),
    db=None
):
    """
    Log a WhatsApp message from Pocket app.

    Creates a 'whatsapp' activity with the message content.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )

    user_id = current_user["id"]

    try:
        activity = await create_pocket_activity(
            db,
            user_id,
            lead_id,
            "whatsapp",
            f"Mensaje enviado: {message_data.get('message', '')[:100]}",
            {"message_length": len(message_data.get("message", ""))}
        )

        return activity
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
