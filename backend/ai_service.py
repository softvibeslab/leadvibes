import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import logging
import httpx

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
    """Get AI response for chat with personalized system prompt"""
    if not EMERGENT_AVAILABLE:
        return "Lo siento, el servicio de IA no está disponible actualmente. Por favor contacta al administrador."

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
    if not EMERGENT_AVAILABLE:
        return {
            "intent_score": 50,
            "sentiment": "neutral",
            "key_points": ["Servicio de IA no disponible"],
            "recommended_action": "Revisa la información del lead manualmente",
            "opening_script": "Hola, te contacto para informarte sobre nuestras propiedades."
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
    if not EMERGENT_AVAILABLE:
        return f"""Script de {script_type} para {lead_data.get('name', 'cliente')}:

Hola, te contacto de Rovi para informarte sobre nuestras propiedades en Tulum.

¿Tienes disponibilidad para platicar brevemente sobre tu interés en invertir en la Riviera Maya?

Quedo a tu disposición para agendar una visita o una videollamada."""

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
