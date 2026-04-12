"""
Pocket Copilot AI Module

Enhanced AI copilot functionality for Rovi Pocket mobile app.
Provides contextual AI assistance for real estate brokers.
"""
from datetime import datetime, timedelta
from typing import Dict, Any, List
from bson import ObjectId


async def build_pocket_context(
    db,
    user_id: str,
    query: str,
    lead_id: str = None
) -> Dict[str, Any]:
    """
    Build comprehensive context for Pocket AI copilot.

    Includes user data, leads, pipeline, calendar, and recent activity.
    """
    tenant_id = f"tenant-{user_id[:8]}"

    # Get user
    user = await db.users.find_one({"id": user_id})

    # Get pipeline overview
    leads_cursor = db.leads.find({"tenant_id": tenant_id})
    leads = await leads_cursor.to_list(length=None)

    # Calculate pipeline metrics
    pipeline = {
        "nuevo": sum(1 for l in leads if l.get("status") == "nuevo"),
        "contactado": sum(1 for l in leads if l.get("status") == "contactado"),
        "calificacion": sum(1 for l in leads if l.get("status") == "calificacion"),
        "presentacion": sum(1 for l in leads if l.get("status") == "presentacion"),
        "apartado": sum(1 for l in leads if l.get("status") == "apartado"),
        "venta": sum(1 for l in leads if l.get("status") == "venta"),
    }

    # Get today's events
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_events = await db.calendar_events.find({
        "tenant_id": tenant_id,
        "start_time": {"$gte": today_start}
    }).to_list(length=None)

    # Get recent activity (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_activities = await db.activities.find({
        "tenant_id": tenant_id,
        "created_at": {"$gte": week_ago}
    }).to_list(length=None)

    # Get specific lead if mentioned
    lead_context = None
    if lead_id:
        lead = await db.leads.find_one({
            "tenant_id": tenant_id,
            "id": lead_id
        })
        if lead:
            lead_context = {
                "id": lead.get("id"),
                "name": lead.get("name"),
                "status": lead.get("status"),
                "intent_score": lead.get("intent_score"),
                "budget_mxn": lead.get("budget_mxn"),
                "property_interest": lead.get("property_interest"),
                "location_preference": lead.get("location_preference"),
                "next_action": lead.get("next_action"),
                "last_contact": lead.get("last_contact"),
                "notes": lead.get("notes"),
            }

    # Build goals context
    goals = user.get("goals", {})

    context = {
        "user": {
            "id": user.get("id"),
            "name": user.get("name"),
            "email": user.get("email"),
            "account_type": user.get("account_type", "individual"),
            "total_points": user.get("total_points", 0),
        },
        "query": query,
        "query_type": _classify_query(query),
        "pipeline": pipeline,
        "total_leads": len(leads),
        "today_events": len(today_events),
        "recent_activities_count": len(recent_activities),
        "goals": {
            "monthly_sales_goal": goals.get("monthly_sales_goal", 0),
            "monthly_leads_goal": goals.get("monthly_leads_goal", 0),
        },
        "date": datetime.utcnow().isoformat(),
        "day_of_week": datetime.utcnow().strftime("%A"),
    }

    if lead_context:
        context["lead"] = lead_context

    return context


def _classify_query(query: str) -> str:
    """
    Classify the user's query to determine context needed.

    Returns: general, lead, pipeline, agenda, goals, script, analysis
    """
    query_lower = query.lower()

    # Lead-specific keywords
    if any(word in query_lower for word in ["lead", "prospecto", "cliente", "¿cómo está", "información del"]):
        return "lead"

    # Pipeline keywords
    if any(word in query_lower for word in ["pipeline", "embudo", "ventas", "progreso", "etapa"]):
        return "pipeline"

    # Agenda keywords
    if any(word in query_lower for word in ["agenda", "cita", "reunión", "calendario", "hoy", "mañana"]):
        return "agenda"

    # Goals keywords
    if any(word in query_lower for word in ["meta", "objetivo", "progreso", "puntos", "gamificación"]):
        return "goals"

    # Script keywords
    if any(word in query_lower for word in ["script", "guion", "mensaje", "llamar", "escribir", "whatsapp", "email"]):
        return "script"

    # Analysis keywords
    if any(word in query_lower for word in ["análisis", "analiza", "evalúa", "score", "probabilidad"]):
        return "analysis"

    return "general"


async def pocket_copilot_query(
    db,
    user_id: str,
    message: str,
    lead_id: str = None
) -> Dict[str, Any]:
    """
    Process a Pocket copilot query with contextual AI.

    Returns AI response based on user's CRM data and context.
    """
    # Build context
    context = await build_pocket_context(db, user_id, message, lead_id)

    # Generate AI response
    from ai_service import get_ai_response

    try:
        # Build contextual prompt
        prompt = _build_contextual_prompt(context)

        # Get AI response
        ai_response = await get_ai_response(message, context)

        # Add contextual actions if relevant
        actions = _suggest_actions(context)

        return {
            "response": ai_response,
            "context_used": context["query_type"],
            "actions": actions,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        # Fallback to basic response
    return {
        "response": f"Entiendo tu consulta sobre {context['query_type']}. Para ayudarte mejor, necesito que me des más detalles específicos.",
        "context_used": "fallback",
        "actions": [],
        "timestamp": datetime.utcnow().isoformat(),
        "error": str(e)
    }


def _build_contextual_prompt(context: Dict[str, Any]) -> str:
    """Build a contextual prompt for the AI based on query type."""

    query_type = context["query_type"]

    if query_type == "lead" and context.get("lead"):
        lead = context["lead"]
        return f"""Eres un asistente comercial inmobiliario experto.

El broker te consulta sobre: {context['query']}

Información del lead:
- Nombre: {lead['name']}
- Estado: {lead['status']}
- Score de intención: {lead['intent_score']}/100
- Presupuesto: ${lead.get('budget_mxn', 0):,} MXN
- Propiedad de interés: {lead.get('property_interest', 'No especificada')}
- Ubicación preferida: {lead.get('location_preference', 'No especificada')}
- Próxima acción: {lead.get('next_action', 'No definida')}
- Último contacto: {lead.get('last_contact', 'Nunca')}

Pipeline actual del broker:
- Nuevos: {context['pipeline']['nuevo']}
- Contactados: {context['pipeline']['contactado']}
- Calificados: {context['pipeline']['calificacion']}
- Presentación: {context['pipeline']['presentacion']}
- Apartados: {context['pipeline']['apartado']}
- Ventas: {context['pipeline']['venta']}

Responde de manera útil, específica y accionable. Si es relevante, sugiere la siguiente mejor acción para este lead."""

    elif query_type == "pipeline":
        return f"""Eres un asistente comercial inmobiliario experto.

El broker te consulta sobre: {context['query']}

Estado del pipeline:
- Nuevos: {context['pipeline']['nuevo']}
- Contactados: {context['pipeline']['contactado']}
- Calificados: {context['pipeline']['calificacion']}
- Presentación: {context['pipeline']['presentacion']}
- Apartados: {context['pipeline']['apartado']}
- Ventas: {context['pipeline']['venta']}
- Total leads: {context['total_leads']}

Metas del mes:
- Ventas: {context['goals']['monthly_sales_goal']}
- Leads: {context['goals']['monthly_leads_goal']}

Eventos hoy: {context['today_events']}
Actividad reciente: {context['recent_activities_count']} actividades esta semana

Analiza el pipeline y da recomendaciones específicas para mover leads hacia el cierre."""

    elif query_type == "agenda":
        return f"""Eres un asistente comercial inmobiliario experto.

El broker te consulta sobre: {context['query']}

Agenda de hoy: {context['today_events']} eventos
Día: {context['day_of_week']}
Fecha: {context['date']}

Ayuda a planificar el día, priorizar citas y optimizar el tiempo para máxima productividad."""

    elif query_type == "script":
        return f"""Eres un experto en ventas inmobiliarias.

El broker necesita: {context['query']}

Genera un guion de ventas profesional, efectivo y adaptado al mercado inmobiliario de lujo en Tulum.

Considera:
- Tono profesional pero cercano
- Enfoque en beneficios y experiencia de vida
- Llamadas a la acción claras
- Manejo de objeciones comunes"""

    else:
        return f"""Eres un asistente comercial inmobiliario experto para brokers en Tulum.

El broker te consulta: {context['query']}

Contexto disponible:
- Usuario: {context['user']['name']}
- Tipo de cuenta: {context['user']['account_type']}
- Total leads: {context['total_leads']}
- Eventos hoy: {context['today_events']}

Responde de manera útil, específica y orientada a cerrar más ventas."""


def _suggest_actions(context: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Suggest contextual actions based on query and user state."""

    actions = []

    query_type = context["query_type"]

    # Lead-related actions
    if query_type == "lead" and context.get("lead"):
        lead = context["lead"]
        actions.extend([
            {
                "type": "llamar",
                "label": "Llamar ahora",
                "lead_id": lead["id"],
                "priority": "high" if lead["intent_score"] > 70 else "medium"
            },
            {
                "type": "whatsapp",
                "label": "Enviar WhatsApp",
                "lead_id": lead["id"],
                "priority": "medium"
            },
            {
                "type": "script",
                "label": "Generar script",
                "lead_id": lead["id"],
                "priority": "high"
            }
        ])

    # Pipeline-related actions
    elif query_type == "pipeline":
        if context["pipeline"]["nuevo"] > 5:
            actions.append({
                "type": "priorizar_nuevos",
                "label": f"Contactar {min(3, context['pipeline']['nuevo'])} leads nuevos",
                "priority": "high"
            })

        if context["pipeline"]["contactado"] > 10:
            actions.append({
                "type": "seguimiento",
                "label": "Hacer seguimiento a leads contactados",
                "priority": "medium"
            })

    # Agenda-related actions
    elif query_type == "agenda":
        if context["today_events"] < 3:
            actions.append({
                "type": "agendar",
                "label": "Agendar más citas hoy",
                "priority": "high"
            })

    return actions[:3]  # Limit to top 3 actions


async def generate_pocket_lead_script(
    db,
    user_id: str,
    lead_id: str,
    script_type: str = "seguimiento"
) -> Dict[str, Any]:
    """
    Generate a sales script for a specific lead.

    Script types: seguimiento, cierre, presentacion, reactivacion, invitacion
    """
    tenant_id = f"tenant-{user_id[:8]}"

    # Get lead
    lead = await db.leads.find_one({
        "tenant_id": tenant_id,
        "id": lead_id
    })

    if not lead:
        raise ValueError("Lead not found")

    # Get user context
    user = await db.users.find_one({"id": user_id})

    # Build script prompt
    prompt = f"""Genera un script de ventas {script_type} para el siguiente lead:

NOMBRE: {lead.get('name')}
ESTADO: {lead.get('status')}
SCORE INTENCIÓN: {lead.get('intent_score', 0)}/100
PRESUPUESTO: ${lead.get('budget_mxn', 0):,} MXN
PROPIEDAD INTERÉS: {lead.get('property_interest', 'No especificada')}
UBICACIÓN PREFERIDA: {lead.get('location_preference', 'No especificada')}
ÚLTIMO CONTACTO: {lead.get('last_contact', 'Nunca')}
NOTAS: {lead.get('notes', 'Sin notas')}

BROKER: {user.get('name')}

Considera:
- Mercado inmobiliario de lujo en Tulum
- Tono profesional pero cercano
- Enfoque en beneficios y experiencia de vida
- Llamada a la acción clara y específica
- Manejo de objeciones típicas

Estructura:
1. Saludo personalizado
2. Contexto/Hook
3. Propuesta de valor
4. Llamada a la acción específica
5. Cierre profesional

Genera el script completo y listo para usar."""

    from ai_service import get_ai_response

    try:
        script = await get_ai_response(prompt, {
            "type": "script_generation",
            "script_type": script_type,
            "lead_data": lead,
            "user_data": user,
        })

        return {
            "script": script,
            "type": script_type,
            "lead_id": lead_id,
            "lead_name": lead.get("name"),
            "generated_at": datetime.utcnow().isoformat(),
            "suggested_channel": _suggest_channel(script_type, lead),
        }

    except Exception as e:
        # Fallback script
        fallback_script = f"""Hola {lead.get('name')}, soy {user.get('name')} de Rovi Premium Properties.

Te contacto para {'continuar nuestra conversación' if script_type == 'seguimiento' else 'presentarte oportunidades exclusivas'} en Tulum.

¿Tienes 5 minutos para platicar?

Saludos,
{user.get('name')}"""

        return {
            "script": fallback_script,
            "type": script_type,
            "lead_id": lead_id,
            "lead_name": lead.get("name"),
            "generated_at": datetime.utcnow().isoformat(),
            "error": str(e)
        }


def _suggest_channel(script_type: str, lead: Dict[str, Any]) -> str:
    """Suggest the best communication channel for the script."""

    if script_type == "cierre":
        return "llamada"  # Voice call for closing
    elif script_type == "reactivacion":
        return "whatsapp"  # WhatsApp for re-engagement
    elif lead.get("intent_score", 0) > 70:
        return "llamada"  # High intent = call
    else:
        return "whatsapp"  # Default to WhatsApp
