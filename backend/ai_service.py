import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
import logging

load_dotenv()

logger = logging.getLogger(__name__)

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

SYSTEM_PROMPT = """Eres el Asistente IA de SelvaVibes CRM, una plataforma de gestión de ventas inmobiliarias de alto valor en Tulum, México.

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

async def get_ai_response(
    user_message: str,
    session_id: str,
    context: Optional[Dict[str, Any]] = None
) -> str:
    """Get AI response for chat"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=SYSTEM_PROMPT
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
            "opening_script": f"Hola {lead_data.get('name', '')}, soy de SelvaVibes Real Estate..."
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
