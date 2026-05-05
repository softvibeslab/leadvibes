import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import logging
import httpx
import json

# Optional AI integration - falls back to mock if unavailable
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    AI_AVAILABLE = True
except ImportError:
    AI_AVAILABLE = False
    logging.warning("emergentintegrations package not available - AI features will be limited")

load_dotenv()

logger = logging.getLogger(__name__)

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
AIFORDB_API_KEY = os.environ.get("AIFORDB_API_KEY", "")
AIFORDB_API_URL = "https://app.aifordatabase.com/api/v1/chat"

# Optional import for emergentintegrations
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    EMERGENT_AVAILABLE = True
except ImportError:
    EMERGENT_AVAILABLE = False
    logger.warning("emergentintegrations package not available. AI features will be disabled.")

SYSTEM_PROMPT = """Eres el Asistente IA de Rovi CRM, una plataforma de gestión de ventas inmobiliarias de alto valor en Tulum, México.

Tu personalidad:
- Eres profesional, motivador y estratégico
- Usas un tono amigable pero enfocado en resultados
- Conoces profundamente el mercado inmobiliario de Tulum y la Riviera Maya
- Entiendes la gamificación y motivas a los brokers a alcanzar sus metas

Tus capacidades:
1. ANÁLISIS DE LEADS: Analizar información de prospectos y calcular intención de compra
2. SCRIPTS DE VENTAS: Generar scripts personalizados según el perfil del lead
3. MÉTRICAS: Interpretar KPIs y dar recomendaciones de mejora
4. ESTRATEGIA: Sugerir acciones para cerrar más ventas
5. GAMIFICACIÓN: Explicar cómo ganar más puntos y subir en el ranking
6. COACHING: Dar tips de ventas inmobiliarias de alto ticket

Contexto del negocio que debes conocer:
- Vendemos lotes residenciales premium en desarrollos de Tulum
- Precio promedio: $1-5 millones MXN por lote
- Clientes típicos: inversionistas, compradores de segunda vivienda, extranjeros
- Ciclo de venta: 2-8 semanas desde primer contacto hasta cierre

Siempre responde en español mexicano de forma concisa y accionable."""

def build_system_prompt(ai_profile: Optional[Dict[str, Any]] = None, user_name: str = "Broker") -> str:
    """Build a personalized system prompt based on the user's AI profile"""

    if not ai_profile:
        # Return default prompt if no profile
        return SYSTEM_PROMPT

    # Extract profile data
    experience = ai_profile.get("experience", "broker inmobiliario")
    style = ai_profile.get("style", "profesional y amigable")
    property_types = ai_profile.get("property_types", ["propiedades"])
    focus_zones = ai_profile.get("focus_zones", ["Tulum"])
    goals = ai_profile.get("goals", "cerrar más ventas")

    # Build personalized prompt
    property_types_str = ", ".join(property_types) if property_types else "propiedades"
    focus_zones_str = ", ".join(focus_zones) if focus_zones else "Tulum"

    personalized_prompt = f"""Eres el Asistente IA personal de {user_name}, un broker inmobiliario especializado.

PERFIL DEL BROKER:
- Experiencia: {experience}
- Estilo de comunicación: {style}
- Tipo de propiedades: {property_types_str}
- Zonas de enfoque: {focus_zones_str}
- Metas: {goals}

Tu personalidad:
- Te adaptas al estilo del broker: {style}
- Conoces profundamente el mercado de {focus_zones_str}
- Entiendes las metas del broker y lo ayudas a alcanzarlas
- Das consejos personalizados según su experiencia

Tus capacidades:
1. ANÁLISIS DE LEADS: Analizar {property_types_str} y calcular intención de compra
2. SCRIPTS DE VENTAS: Generar scripts personalizados según el estilo {style}
3. MÉTRICAS: Interpretar KPIs y dar recomendaciones para alcanzar: {goals}
4. ESTRATEGIA: Sugerir acciones para vender más {property_types_str} en {focus_zones_str}
5. COACHING: Dar tips de ventas inmobiliarias según su experiencia: {experience}
6. PATRONES: Identificar qué funciona mejor para este broker

Contexto del negocio:
- Broker vende: {property_types_str}
- Zonas principales: {focus_zones_str}
- Enfoque en sus metas: {goals}

IMPORTANTE:
- Responde siempre en español mexicano
- Sé conciso y accionable
- Adapta tu estilo al del broker: {style}
- Haz referencias a su experiencia y zonas de trabajo
"""

    return personalized_prompt

async def get_ai_response(
    user_message: str,
    session_id: str,
    context: Optional[Dict[str, Any]] = None,
    ai_profile: Optional[Dict[str, Any]] = None,
    user_name: str = "Broker"
) -> str:
    """Get AI response for chat"""
    if not AI_AVAILABLE:
        return "Lo siento, la funcionalidad de IA no está disponible en este entorno. Por favor contacta al administrador."
    try:
        # Build personalized system prompt
        system_prompt = build_system_prompt(ai_profile, user_name)

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_prompt
        ).with_model("openai", "gpt-5.2")
        
        # Build context-aware message
        full_message = user_message
        if context:
            context_str = "\n\nContexto actual:\n"
            if context.get("user_goals"):
                goals = context["user_goals"]
                context_str += f"- Meta de ventas: {goals.get('ventas_mes', 5)} ventas/mes\n"
                context_str += f"- Meta de ingresos: ${goals.get('ingresos_objetivo', 500000):,.0f} MXN\n"
            if context.get("stats"):
                stats = context["stats"]
                context_str += f"- Puntos actuales: {stats.get('total_points', 0)}\n"
                context_str += f"- Ventas cerradas: {stats.get('ventas', 0)}\n"
            if context.get("lead_info"):
                lead = context["lead_info"]
                context_str += f"\nLead actual: {lead.get('name', 'N/A')}\n"
                context_str += f"- Presupuesto: ${lead.get('budget_mxn', 0):,.0f} MXN\n"
                context_str += f"- Estado: {lead.get('status', 'nuevo')}\n"
                context_str += f"- Interés: {lead.get('property_interest', 'N/A')}\n"
            full_message = context_str + "\n\nPregunta del usuario: " + user_message
        
        message = UserMessage(text=full_message)
        response = await chat.send_message(message)
        return response
        
    except Exception as e:
        logger.error(f"AI service error: {e}")
        return "Lo siento, hubo un problema al procesar tu solicitud. Por favor intenta de nuevo."

async def analyze_lead(lead_data: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze a lead and provide AI insights"""
    if not AI_AVAILABLE:
        return {
            "intent_score": 50,
            "sentiment": "neutral",
            "key_points": ["IA no disponible"],
            "next_action": "Revisar manualmente",
            "opening_script": f"Hola {lead_data.get('name', '')}, soy de Rovi Real Estate..."
        }
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"lead-analysis-{lead_data.get('id', 'unknown')}",
            system_message="""Eres un experto en análisis de leads inmobiliarios. 
Analiza la información del prospecto y proporciona:
1. Puntuación de intención de compra (0-100)
2. Sentimiento general (positivo/neutral/negativo)
3. Puntos clave del prospecto
4. Recomendación de próxima acción
5. Script de apertura personalizado

Responde SIEMPRE en formato JSON válido con estas claves exactas:
{
  "intent_score": número,
  "sentiment": "positivo|neutral|negativo",
  "key_points": ["punto1", "punto2"],
  "next_action": "descripción de la acción",
  "opening_script": "script personalizado"
}"""
        ).with_model("openai", "gpt-5.2")
        
        lead_info = f"""
Nombre: {lead_data.get('name', 'N/A')}
Teléfono: {lead_data.get('phone', 'N/A')}
Email: {lead_data.get('email', 'N/A')}
Presupuesto: ${lead_data.get('budget_mxn', 0):,.0f} MXN
Fuente: {lead_data.get('source', 'N/A')}
Interés en propiedad: {lead_data.get('property_interest', 'N/A')}
Estado actual: {lead_data.get('status', 'nuevo')}
Notas: {lead_data.get('notes', 'Sin notas')}
"""
        
        message = UserMessage(text=f"Analiza este lead inmobiliario:\n{lead_info}")
        response = await chat.send_message(message)
        
        # Parse JSON response
        import json
        try:
            # Try to extract JSON from response
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = response[start_idx:end_idx]
                analysis = json.loads(json_str)
                return analysis
        except json.JSONDecodeError:
            pass
        
        # Fallback response
        return {
            "intent_score": 50,
            "sentiment": "neutral",
            "key_points": ["Requiere más información"],
            "next_action": "Contactar para calificar interés",
            "opening_script": f"Hola {lead_data.get('name', '')}, soy de Rovi Real Estate..."
        }
        
    except Exception as e:
        logger.error(f"Lead analysis error: {e}")
        return {
            "intent_score": 50,
            "sentiment": "neutral",
            "key_points": ["Error al analizar"],
            "next_action": "Contactar manualmente",
            "opening_script": "Error al generar script"
        }

async def generate_sales_script(
    lead_data: Dict[str, Any],
    script_type: str = "apertura"
) -> str:
    """Generate a personalized sales script for a lead"""
    if not AI_AVAILABLE:
        return f"Lo siento, la generación de scripts con IA no está disponible. Por favor crea un script manual para {lead_data.get('name', 'el cliente')}."
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"script-gen-{lead_data.get('id', 'unknown')}",
            system_message="""Eres un experto en ventas inmobiliarias de alto valor.
Genera scripts de ventas persuasivos y personalizados para el mercado de Tulum.
Los scripts deben ser:
- Naturales y conversacionales
- Enfocados en descubrir necesidades
- Con preguntas de descubrimiento
- Con propuesta de valor clara
- Adaptados al perfil del cliente"""
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"""Genera un script de {script_type} para este lead:
Nombre: {lead_data.get('name', 'N/A')}
Presupuesto: ${lead_data.get('budget_mxn', 0):,.0f} MXN
Interés: {lead_data.get('property_interest', 'lotes residenciales')}
Estado: {lead_data.get('status', 'nuevo')}
Fuente: {lead_data.get('source', 'web')}

El script debe incluir:
1. Saludo personalizado
2. Razón de la llamada
3. 2-3 preguntas de descubrimiento
4. Propuesta de valor breve
5. Llamada a la acción (agendar visita/zoom)
"""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        return response
        
    except Exception as e:
        logger.error(f"Script generation error: {e}")
        return "Error al generar el script. Por favor intenta de nuevo."


def _clamp_score(value: Any) -> int:
    try:
        return max(0, min(100, int(round(float(value)))))
    except (TypeError, ValueError):
        return 0


def _extract_json_object(response_text: str) -> Optional[Dict[str, Any]]:
    if not response_text:
        return None

    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        pass

    start_idx = response_text.find("{")
    end_idx = response_text.rfind("}") + 1
    if start_idx != -1 and end_idx > start_idx:
        try:
            return json.loads(response_text[start_idx:end_idx])
        except json.JSONDecodeError:
            return None
    return None


def _normalize_string_list(items: Any, fallback: List[str]) -> List[str]:
    if not isinstance(items, list):
        return fallback
    normalized = [str(item).strip() for item in items if str(item).strip()]
    return normalized[:6] or fallback


def _normalize_detail_sections(sections: Any, fallback: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not isinstance(sections, list):
        return fallback

    normalized_sections: List[Dict[str, Any]] = []
    for section in sections:
        if not isinstance(section, dict):
            continue
        title = str(section.get("title", "")).strip()
        items = _normalize_string_list(section.get("items"), [])
        if title and items:
            normalized_sections.append({"title": title, "items": items[:5]})

    return normalized_sections[:4] or fallback


def _normalize_copim_analysis(
    payload: Optional[Dict[str, Any]],
    *,
    entity_type: str,
    analysis_type: str,
    score_label: str,
    status_label: str,
    fallback: Dict[str, Any]
) -> Dict[str, Any]:
    source = payload if isinstance(payload, dict) else {}
    normalized = {
        "entity_type": entity_type,
        "analysis_type": analysis_type,
        "score_label": score_label,
        "score": _clamp_score(source.get("score", fallback.get("score", 0))),
        "status_label": status_label,
        "status_value": str(source.get("status_value", fallback.get("status_value", "medio"))).strip().lower() or fallback.get("status_value", "medio"),
        "executive_summary": str(source.get("executive_summary", fallback.get("executive_summary", ""))).strip() or fallback.get("executive_summary", ""),
        "key_points": _normalize_string_list(source.get("key_points"), fallback.get("key_points", [])),
        "recommended_actions": _normalize_string_list(source.get("recommended_actions"), fallback.get("recommended_actions", [])),
        "suggested_message": str(source.get("suggested_message", fallback.get("suggested_message", ""))).strip() or fallback.get("suggested_message", ""),
        "detail_sections": _normalize_detail_sections(source.get("detail_sections"), fallback.get("detail_sections", [])),
    }
    return normalized


def _build_association_fallback(data: Dict[str, Any]) -> Dict[str, Any]:
    active_members = int(data.get("active_members", 0) or 0)
    pending_members = int(data.get("pending_members", 0) or 0)
    renewals_due = int(data.get("renewals_due", 0) or 0)
    upcoming_events = int(data.get("upcoming_events", 0) or 0)
    goal = int(data.get("member_goal", 0) or 0)
    revenue_due = float(data.get("revenue_due", 0) or 0)
    goal_progress = min(active_members / goal, 1) if goal else 0.5
    score = 48 + (goal_progress * 32) - (pending_members * 4) - (renewals_due * 5)
    if upcoming_events > 0:
        score += 6
    if revenue_due > 0:
        score -= min(12, revenue_due / 1500)
    score = _clamp_score(score)

    if score >= 75:
        status_value = "bajo"
    elif score >= 55:
        status_value = "medio"
    else:
        status_value = "alto"

    return {
        "score": score,
        "status_value": status_value,
        "executive_summary": (
            f"El capítulo tiene {active_members} socios activos, {pending_members} pendientes "
            f"y {renewals_due} renovaciones por atender."
        ),
        "key_points": [
            f"Meta institucional actual: {active_members} de {goal or 'sin meta definida'} socios activos.",
            f"Cobranza visible acumulada: ${int(revenue_due):,} MXN.".replace(",", ","),
            f"Eventos próximos programados: {upcoming_events}.",
        ],
        "recommended_actions": [
            "Cerrar primero pendientes de validación para convertir la base visible en socios activos.",
            "Atender renovaciones vencidas o por vencer antes de ampliar nuevos frentes operativos.",
            "Usar el siguiente evento como palanca para reactivar miembros con baja participación.",
        ],
        "suggested_message": "Comparto un corte operativo del capítulo con foco en activación, renovaciones y próximos pasos institucionales.",
        "detail_sections": [
            {"title": "Fortalezas", "items": [
                f"{active_members} socios activos con operación visible.",
                f"{upcoming_events} eventos próximos que pueden empujar activación." if upcoming_events else "Existe base operativa para crecer sobre el padrón actual.",
            ]},
            {"title": "Riesgos", "items": [
                f"{pending_members} perfiles aún no convertidos." if pending_members else "No hay presión crítica en aprobaciones pendientes.",
                f"{renewals_due} renovaciones requieren seguimiento." if renewals_due else "La cartera inmediata de renovaciones está controlada.",
            ]},
        ],
    }


def _build_member_fallback(data: Dict[str, Any]) -> Dict[str, Any]:
    profile_completion = int(data.get("profile_completion", 0) or 0)
    amount_due = float(data.get("amount_due", 0) or 0)
    member_status = str(data.get("member_status", "pending"))
    credential_status = str(data.get("credential_status", "pending"))
    directory_visible = bool(data.get("directory_visible"))
    score = (profile_completion * 0.55)
    if member_status == "active":
        score += 22
    elif member_status == "pending":
        score += 8
    if credential_status == "issued":
        score += 12
    if directory_visible:
        score += 8
    if amount_due > 0:
        score -= min(18, amount_due / 200)
    score = _clamp_score(score)

    if score >= 75:
        status_value = "bajo"
    elif score >= 50:
        status_value = "medio"
    else:
        status_value = "alto"

    return {
        "score": score,
        "status_value": status_value,
        "executive_summary": (
            f"El socio muestra {profile_completion}% de completitud, estatus {member_status} "
            f"y saldo pendiente de ${int(amount_due):,} MXN.".replace(",", ",")
        ),
        "key_points": [
            "La activación mejora si el perfil está completo y la credencial ya fue emitida.",
            "El directorio visible funciona como señal de valor recibido por el socio." if directory_visible else "El perfil aún no capitaliza visibilidad en directorio.",
            f"Credencial actual: {credential_status}.",
        ],
        "recommended_actions": [
            "Completar primero los campos faltantes del perfil profesional.",
            "Emitir o reactivar la credencial si sigue pendiente o bloqueada.",
            "Cerrar el saldo pendiente antes de impulsar beneficios avanzados.",
        ],
        "suggested_message": "Te compartimos tu estatus actual dentro de la plataforma y los siguientes pasos para activar por completo tu perfil y beneficios.",
        "detail_sections": [
            {"title": "Activación", "items": [
                f"Completitud actual del perfil: {profile_completion}%.",
                f"Estatus del socio: {member_status}.",
            ]},
            {"title": "Oportunidades", "items": [
                "Mayor visibilidad en directorio y credencialización refuerzan el valor percibido.",
                "El seguimiento administrativo debe priorizar regularización y adopción.",
            ]},
        ],
    }


def _build_membership_fallback(data: Dict[str, Any]) -> Dict[str, Any]:
    payment_status = str(data.get("payment_status", "due"))
    balance_due = float(data.get("balance_due", 0) or 0)
    days_to_renewal = int(data.get("days_to_renewal", 0) or 0)
    auto_renew = bool(data.get("auto_renew"))
    reminder_enabled = bool(data.get("reminder_enabled", True))

    score = 78
    if payment_status == "active":
        score += 10
    elif payment_status == "due":
        score -= 18
    elif payment_status == "overdue":
        score -= 34
    elif payment_status == "cancelled":
        score -= 46
    if balance_due > 0:
        score -= min(20, balance_due / 250)
    if days_to_renewal < 0:
        score -= 12
    elif days_to_renewal <= 10:
        score -= 8
    if auto_renew:
        score += 8
    if not reminder_enabled:
        score -= 6
    score = _clamp_score(score)

    if score >= 75:
        status_value = "baja"
    elif score >= 55:
        status_value = "media"
    elif score >= 35:
        status_value = "alta"
    else:
        status_value = "critica"

    return {
        "score": score,
        "status_value": status_value,
        "executive_summary": (
            f"La membresía está en estatus {payment_status} con saldo de ${int(balance_due):,} MXN "
            f"y renovación en {days_to_renewal} días."
        ).replace(",", ","),
        "key_points": [
            f"Periodo de facturación: {data.get('billing_period', 'annual')}.",
            "La auto-renovación reduce fricción administrativa." if auto_renew else "Sin auto-renovación activa; depende de seguimiento manual.",
            "Los recordatorios están habilitados." if reminder_enabled else "Los recordatorios están desactivados.",
        ],
        "recommended_actions": [
            "Priorizar contacto de cobranza si el estatus está por vencer o vencido.",
            "Regularizar saldo antes de ofrecer un plan superior.",
            "Mantener visible la fecha de renovación y el método de pago del socio.",
        ],
        "suggested_message": "Te compartimos el estado actual de tu membresía y el paso recomendado para mantenerla vigente sin fricciones.",
        "detail_sections": [
            {"title": "Cobranza", "items": [
                f"Saldo pendiente actual: ${int(balance_due):,} MXN.".replace(",", ","),
                f"Estatus de pago: {payment_status}.",
            ]},
            {"title": "Renovación", "items": [
                f"Días a renovación: {days_to_renewal}.",
                "La membresía tiene condiciones favorables de permanencia." if score >= 70 else "Hay señales de fricción que pueden afectar la renovación.",
            ]},
        ],
    }


def _build_event_fallback(data: Dict[str, Any]) -> Dict[str, Any]:
    occupancy_rate = int(data.get("occupancy_rate", 0) or 0)
    attendance_rate = int(data.get("attendance_rate", 0) or 0)
    status = str(data.get("status", "published"))
    registration_open = bool(data.get("registration_open", True))
    available_slots = data.get("available_slots")

    score = (occupancy_rate * 0.55) + (attendance_rate * 0.25)
    if status == "published":
        score += 18
    elif status == "completed":
        score += 10
    elif status == "draft":
        score += 4
    if registration_open:
        score += 6
    score = _clamp_score(score)

    if score >= 75:
        status_value = "bajo"
    elif score >= 50:
        status_value = "medio"
    else:
        status_value = "alto"

    return {
        "score": score,
        "status_value": status_value,
        "executive_summary": (
            f"El evento tiene ocupación de {occupancy_rate}% y asistencia de {attendance_rate}% "
            f"con estatus {status}."
        ),
        "key_points": [
            f"Registros actuales: {data.get('registered_count', 0)}.",
            f"Check-ins actuales: {data.get('checked_in_count', 0)}.",
            f"Espacios disponibles: {available_slots if available_slots is not None else 'sin límite'}.",
        ],
        "recommended_actions": [
            "Empujar convocatoria si la ocupación sigue baja y el registro continúa abierto.",
            "Asegurar recordatorio previo cuando el evento está publicado pero la asistencia proyectada es débil.",
            "Cerrar con mensaje post evento y seguimiento de participación al terminar.",
        ],
        "suggested_message": "Ya está disponible el siguiente corte del evento con foco en ocupación, asistencia y acciones sugeridas.",
        "detail_sections": [
            {"title": "Momentum", "items": [
                f"Ocupación actual: {occupancy_rate}%.",
                f"Asistencia efectiva: {attendance_rate}%.",
            ]},
            {"title": "Acciones sugeridas", "items": [
                "Incrementar registros si la convocatoria aún puede empujar asistentes.",
                "Usar seguimiento post evento para convertir participación en valor recurrente.",
            ]},
        ],
    }


def _build_invoice_fallback(data: Dict[str, Any]) -> Dict[str, Any]:
    balance_due = float(data.get("balance_due", 0) or 0)
    total_amount = float(data.get("total_amount", 0) or 0)
    payment_status = str(data.get("payment_status", "pending"))
    invoice_status = str(data.get("invoice_status", "draft"))
    due_date = data.get("due_date")
    days_to_due = int(data.get("days_to_due", 0) or 0)

    score = 100
    if payment_status == "paid":
        score -= 8
    elif payment_status == "pending":
        score -= 32
    elif payment_status == "overdue":
        score -= 58
    elif payment_status == "cancelled":
        score -= 45

    if invoice_status == "draft":
        score -= 18
    elif invoice_status == "issued":
        score -= 6
    elif invoice_status == "sent":
        score -= 10

    if days_to_due < 0:
        score -= 18
    elif days_to_due <= 5:
        score -= 8

    score = _clamp_score(score)

    if score >= 80:
        status_value = "baja"
    elif score >= 60:
        status_value = "media"
    elif score >= 40:
        status_value = "alta"
    else:
        status_value = "critica"

    return {
        "score": score,
        "status_value": status_value,
        "executive_summary": (
            f"La factura está en estatus {invoice_status} con pago {payment_status}, "
            f"saldo pendiente de ${int(balance_due):,} MXN y vencimiento {due_date or 'sin fecha'}.".replace(",", ",")
        ),
        "key_points": [
            f"Importe total: ${int(total_amount):,} MXN.".replace(",", ","),
            f"Saldo pendiente actual: ${int(balance_due):,} MXN.".replace(",", ","),
            f"Días al vencimiento: {days_to_due}.",
        ],
        "recommended_actions": [
            "Emitir o enviar la factura si aún no salió al socio.",
            "Dar seguimiento de cobro cuando el vencimiento está cerca o ya venció.",
            "Cerrar conciliación con confirmación de pago y referencia administrativa.",
        ],
        "suggested_message": "Te compartimos el estado de la factura y el siguiente paso sugerido para mantener la cobranza al día.",
        "detail_sections": [
            {"title": "Cobranza", "items": [
                f"Estatus de pago: {payment_status}.",
                f"Saldo pendiente: ${int(balance_due):,} MXN.".replace(",", ","),
            ]},
            {"title": "Administración", "items": [
                f"Estatus documental: {invoice_status}.",
                "Conviene priorizar seguimiento inmediato." if days_to_due <= 5 or payment_status == "overdue" else "El expediente mantiene una ventana administrable.",
            ]},
        ],
    }


async def _run_copim_analysis(
    *,
    session_id: str,
    prompt: str,
    entity_type: str,
    analysis_type: str,
    score_label: str,
    status_label: str,
    fallback: Dict[str, Any]
) -> Dict[str, Any]:
    if not AI_AVAILABLE:
        return _normalize_copim_analysis(
            None,
            entity_type=entity_type,
            analysis_type=analysis_type,
            score_label=score_label,
            status_label=status_label,
            fallback=fallback,
        )

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message="""Eres un analista de operaciones institucionales para COPIM x ROVI.
Evalúas asociaciones, socios, membresías, facturas y eventos desde una perspectiva ejecutiva y operativa.
Responde siempre en español mexicano.
No uses markdown.
Devuelve únicamente JSON válido con la estructura solicitada.
Sé conciso, accionable y orientado a decisiones.""",
        ).with_model("openai", "gpt-5.2")

        response = await chat.send_message(UserMessage(text=prompt))
        parsed = _extract_json_object(response)
        return _normalize_copim_analysis(
            parsed,
            entity_type=entity_type,
            analysis_type=analysis_type,
            score_label=score_label,
            status_label=status_label,
            fallback=fallback,
        )
    except Exception as error:
        logger.error(f"COPIM analysis error for {entity_type}: {error}")
        return _normalize_copim_analysis(
            None,
            entity_type=entity_type,
            analysis_type=analysis_type,
            score_label=score_label,
            status_label=status_label,
            fallback=fallback,
        )


async def analyze_copim_association(association_data: Dict[str, Any]) -> Dict[str, Any]:
    fallback = _build_association_fallback(association_data)
    prompt = f"""Analiza esta asociación institucional y responde con JSON válido.

Usa exactamente esta estructura:
{{
  "score": 0,
  "status_value": "bajo|medio|alto",
  "executive_summary": "texto breve",
  "key_points": ["...", "..."],
  "recommended_actions": ["...", "..."],
  "suggested_message": "mensaje corto listo para compartir",
  "detail_sections": [
    {{"title": "Fortalezas", "items": ["...", "..."]}},
    {{"title": "Riesgos", "items": ["...", "..."]}}
  ]
}}

Contexto de la asociación:
{json.dumps(association_data, ensure_ascii=False, indent=2)}
"""

    return await _run_copim_analysis(
        session_id=f"copim-association-analysis-{association_data.get('id', 'unknown')}",
        prompt=prompt,
        entity_type="association",
        analysis_type="institutional_health",
        score_label="Salud institucional",
        status_label="Riesgo",
        fallback=fallback,
    )


async def analyze_copim_member(member_data: Dict[str, Any]) -> Dict[str, Any]:
    fallback = _build_member_fallback(member_data)
    prompt = f"""Analiza este socio institucional y responde con JSON válido.

Usa exactamente esta estructura:
{{
  "score": 0,
  "status_value": "bajo|medio|alto",
  "executive_summary": "texto breve",
  "key_points": ["...", "..."],
  "recommended_actions": ["...", "..."],
  "suggested_message": "mensaje corto listo para compartir",
  "detail_sections": [
    {{"title": "Activación", "items": ["...", "..."]}},
    {{"title": "Oportunidades", "items": ["...", "..."]}}
  ]
}}

Contexto del socio:
{json.dumps(member_data, ensure_ascii=False, indent=2)}
"""

    return await _run_copim_analysis(
        session_id=f"copim-member-analysis-{member_data.get('id', 'unknown')}",
        prompt=prompt,
        entity_type="member",
        analysis_type="member_activation",
        score_label="Activación",
        status_label="Riesgo de fuga",
        fallback=fallback,
    )


async def analyze_copim_membership(membership_data: Dict[str, Any]) -> Dict[str, Any]:
    fallback = _build_membership_fallback(membership_data)
    prompt = f"""Analiza esta membresía y responde con JSON válido.

Usa exactamente esta estructura:
{{
  "score": 0,
  "status_value": "baja|media|alta|critica",
  "executive_summary": "texto breve",
  "key_points": ["...", "..."],
  "recommended_actions": ["...", "..."],
  "suggested_message": "mensaje corto listo para compartir",
  "detail_sections": [
    {{"title": "Cobranza", "items": ["...", "..."]}},
    {{"title": "Renovación", "items": ["...", "..."]}}
  ]
}}

Contexto de la membresía:
{json.dumps(membership_data, ensure_ascii=False, indent=2)}
"""

    return await _run_copim_analysis(
        session_id=f"copim-membership-analysis-{membership_data.get('id', 'unknown')}",
        prompt=prompt,
        entity_type="membership",
        analysis_type="renewal_health",
        score_label="Salud de renovación",
        status_label="Prioridad de cobro",
        fallback=fallback,
    )


async def analyze_copim_event(event_data: Dict[str, Any]) -> Dict[str, Any]:
    fallback = _build_event_fallback(event_data)
    prompt = f"""Analiza este evento y responde con JSON válido.

Usa exactamente esta estructura:
{{
  "score": 0,
  "status_value": "bajo|medio|alto",
  "executive_summary": "texto breve",
  "key_points": ["...", "..."],
  "recommended_actions": ["...", "..."],
  "suggested_message": "mensaje corto listo para compartir",
  "detail_sections": [
    {{"title": "Momentum", "items": ["...", "..."]}},
    {{"title": "Acciones sugeridas", "items": ["...", "..."]}}
  ]
}}

Contexto del evento:
{json.dumps(event_data, ensure_ascii=False, indent=2)}
"""

    return await _run_copim_analysis(
        session_id=f"copim-event-analysis-{event_data.get('id', 'unknown')}",
        prompt=prompt,
        entity_type="event",
        analysis_type="event_momentum",
        score_label="Momentum",
        status_label="Riesgo de asistencia",
        fallback=fallback,
    )


async def analyze_copim_invoice(invoice_data: Dict[str, Any]) -> Dict[str, Any]:
    fallback = _build_invoice_fallback(invoice_data)
    prompt = f"""Analiza esta factura institucional y responde con JSON válido.

Usa exactamente esta estructura:
{{
  "score": 0,
  "status_value": "baja|media|alta|critica",
  "executive_summary": "texto breve",
  "key_points": ["...", "..."],
  "recommended_actions": ["...", "..."],
  "suggested_message": "mensaje corto listo para compartir",
  "detail_sections": [
    {{"title": "Cobranza", "items": ["...", "..."]}},
    {{"title": "Administración", "items": ["...", "..."]}}
  ]
}}

Contexto de la factura:
{json.dumps(invoice_data, ensure_ascii=False, indent=2)}
"""

    return await _run_copim_analysis(
        session_id=f"copim-invoice-analysis-{invoice_data.get('id', 'unknown')}",
        prompt=prompt,
        entity_type="invoice",
        analysis_type="billing_health",
        score_label="Salud de cobranza",
        status_label="Prioridad de seguimiento",
        fallback=fallback,
    )

def parse_natural_language_query(query: str) -> Dict[str, Any]:
    """
    Parse natural language query into MongoDB query components.

    Supports common patterns like:
    - "How many leads?" → count leads
    - "Top 10 leads by budget" → sort by budget, limit 10
    - "Leads by status" → group by status
    - "Show me all leads" → find all
    """
    query_lower = query.lower()

    result = {
        "collection": None,
        "operation": None,
        "filters": {},
        "sort": None,
        "limit": None,
        "group_by": None,
        "aggregate_field": None
    }

    # Detect collection
    if "lead" in query_lower or "prospect" in query_lower:
        result["collection"] = "leads"
    elif "user" in query_lower or "broker" in query_lower or "agente" in query_lower:
        result["collection"] = "users"
    elif "venta" in query_lower or "sale" in query_lower:
        result["collection"] = "activities"  # Sales are activities
    elif "campaign" in query_lower or "campaña" in query_lower:
        result["collection"] = "campaigns"
    else:
        result["collection"] = "leads"  # Default

    # Detect operation
    if any(word in query_lower for word in ["how many", "cuántos", "cuantas", "count", "conteo", "total"]):
        result["operation"] = "count"
    elif any(word in query_lower for word in ["top", "mejores", "mayores", "highest"]):
        result["operation"] = "find"
        # Detect sort field and limit
        if "budget" in query_lower or "presupuesto" in query_lower:
            result["sort"] = [("budget_mxn", -1)]
            result["aggregate_field"] = "budget_mxn"
        elif "revenue" in query_lower or "revenue" in query_lower or "valor" in query_lower:
            result["sort"] = [("budget_mxn", -1)]
            result["aggregate_field"] = "budget_mxn"
        elif "points" in query_lower or "puntos" in query_lower:
            result["sort"] = [("points", -1)]
            result["aggregate_field"] = "points"

        # Extract limit number
        import re
        numbers = re.findall(r'\b\d+\b', query)
        if numbers:
            result["limit"] = int(numbers[0])
        else:
            result["limit"] = 10  # Default
    elif any(word in query_lower for word in ["group by", "por estado", "por status", "by status", "by source"]):
        result["operation"] = "aggregate"
        if "status" in query_lower or "estado" in query_lower:
            result["group_by"] = "$status"
        elif "source" in query_lower or "fuente" in query_lower:
            result["group_by"] = "$source"
        elif "priority" in query_lower or "prioridad" in query_lower:
            result["group_by"] = "$priority"
    else:
        result["operation"] = "find"

    # Detect status filters
    if "nuevo" in query_lower or "new" in query_lower:
        result["filters"]["status"] = "nuevo"
    elif "contactado" in query_lower or "contacted" in query_lower:
        result["filters"]["status"] = "contactado"
    elif "calificacion" in query_lower or "qualification" in query_lower:
        result["filters"]["status"] = "calificacion"
    elif "apartado" in query_lower or "reserved" in query_lower:
        result["filters"]["status"] = "apartado"
    elif "venta" in query_lower and "perdido" not in query_lower or "sold" in query_lower:
        result["filters"]["status"] = "venta"
    elif "perdido" in query_lower or "lost" in query_lower:
        result["filters"]["status"] = "perdido"

    # Priority filters
    if "alta" in query_lower or "high" in query_lower:
        result["filters"]["priority"] = "alta"
    elif "media" in query_lower or "medium" in query_lower:
        result["filters"]["priority"] = "media"
    elif "baja" in query_lower or "low" in query_lower:
        result["filters"]["priority"] = "baja"

    # Source filters
    if "instagram" in query_lower:
        result["filters"]["source"] = "Instagram"
    elif "facebook" in query_lower or "meta" in query_lower:
        result["filters"]["source"] = "Facebook"
    elif "website" in query_lower or "web" in query_lower:
        result["filters"]["source"] = "Website"
    elif "referral" in query_lower or "referido" in query_lower:
        result["filters"]["source"] = "Referral"
    elif "whatsapp" in query_lower or "whats" in query_lower:
        result["filters"]["source"] = "WhatsApp"
    elif "tiktok" in query_lower:
        result["filters"]["source"] = "TikTok"

    return result


async def execute_mongodb_query(
    db,
    parsed_query: Dict[str, Any],
    tenant_id: str
) -> Dict[str, Any]:
    """
    Execute parsed query on MongoDB.
    """
    collection_name = parsed_query["collection"]
    operation = parsed_query["operation"]

    # Always filter by tenant_id
    filters = parsed_query["filters"].copy()
    filters["tenant_id"] = tenant_id

    try:
        collection = db[collection_name]

        if operation == "count":
            count = await collection.count_documents(filters)
            return {
                "success": True,
                "results": {
                    "count": count,
                    "collection": collection_name,
                    "description": f"Total de {collection_name}"
                },
                "query_type": "fallback_count"
            }

        elif operation == "find":
            cursor = collection.find(filters)

            if parsed_query.get("sort"):
                cursor = cursor.sort(parsed_query["sort"])

            if parsed_query.get("limit"):
                cursor = cursor.limit(parsed_query["limit"])

            results = await cursor.to_list(parsed_query.get("limit", 100))

            # Remove _id from results
            for doc in results:
                doc.pop("_id", None)

            return {
                "success": True,
                "results": results,
                "query_type": "fallback_find",
                "count": len(results)
            }

        elif operation == "aggregate":
            pipeline = [
                {"$match": filters},
                {"$group": {
                    "_id": parsed_query["group_by"],
                    "count": {"$sum": 1}
                }},
                {"$sort": {"count": -1}}
            ]

            results = await collection.aggregate(pipeline).to_list(100)

            # Format results
            formatted_results = [
                {
                    "group": result["_id"] if result["_id"] else "N/A",
                    "count": result["count"]
                }
                for result in results
            ]

            return {
                "success": True,
                "results": formatted_results,
                "query_type": "fallback_aggregate",
                "description": f"{collection_name} agrupados por campo"
            }

        else:
            # Default: find all
            cursor = collection.find(filters).limit(50)
            results = await cursor.to_list(50)
            for doc in results:
                doc.pop("_id", None)

            return {
                "success": True,
                "results": results,
                "query_type": "fallback_find_all",
                "count": len(results)
            }

    except Exception as e:
        logger.error(f"MongoDB query error: {e}")
        return {
            "success": False,
            "error": f"Error executing query: {str(e)}",
            "results": None
        }


async def query_database_with_ai(
    query: str,
    user_context: Optional[Dict[str, Any]] = None,
    db=None
) -> Dict[str, Any]:
    """
    Query the database using AI for Database service with MongoDB fallback.

    This service first tries to use AI for Database. If that fails (402, timeout, etc),
    it falls back to parsing the natural language query and executing it directly on MongoDB.

    Args:
        query: Natural language query (e.g., "Show me top 10 leads by budget")
        user_context: Optional context about the user (tenant_id, filters, etc.)
        db: MongoDB database instance (required for fallback)

    Returns:
        Dict with query results or error message
    """
    tenant_id = user_context.get("tenant_id") if user_context else None

    # Try AI for Database first
    if AIFORDB_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                payload = {"message": query}

                if user_context and tenant_id:
                    payload["context"] = {"tenant_id": tenant_id}

                response = await client.post(
                    AIFORDB_API_URL,
                    headers={
                        "Authorization": f"Bearer {AIFORDB_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )

                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "results": data.get("results", data),
                        "query": query,
                        "source": "aifordatabase"
                    }
                else:
                    logger.warning(f"AI for Database returned {response.status_code}, using fallback")

        except httpx.TimeoutException:
            logger.warning("AI for Database timed out, using fallback")
        except Exception as e:
            logger.warning(f"AI for Database error: {e}, using fallback")

    # Fallback to direct MongoDB queries
    if db is not None and tenant_id:
        logger.info(f"Using fallback MongoDB query for: {query}")

        parsed = parse_natural_language_query(query)
        result = await execute_mongodb_query(db, parsed, tenant_id)

        if result.get("success"):
            result["source"] = "mongodb_fallback"
            result["query"] = query
            return result
        else:
            return {
                "success": False,
                "error": result.get("error", "Query failed"),
                "query": query,
                "message": "No se pudo ejecutar la consulta. Intenta ser más específico.",
                "suggestions": [
                    "How many leads?",
                    "Top 10 leads by budget",
                    "Leads by status",
                    "Show me all leads"
                ]
            }
    else:
        return {
            "success": False,
            "error": "Database not available for fallback",
            "query": query
        }
