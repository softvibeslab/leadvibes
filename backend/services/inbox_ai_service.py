"""
Servicio de IA para generar sugerencias de respuesta en el Inbox

Utiliza OpenAI API (a través de emergentintegrations o directamente)
para generar respuestas contextuales basadas en:
- Información del lead
- Historial de conversaciones
- Metas del broker
- Estilo de comunicación personalizado
"""

import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Intentar importar emergentintegrations si está disponible
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    EMERGENT_AVAILABLE = True
except ImportError:
    logger.warning("emergentintegrations no disponible - Usando fallback")
    EMERGENT_AVAILABLE = False


class InboxAIService:
    """Servicio de IA para el módulo de Inbox"""

    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")
        self.emergent_available = EMERGENT_AVAILABLE

        if not self.openai_api_key and not self.emergent_available:
            logger.warning("OpenAI API key no configurada y emergentintegrations no disponible")

    async def generate_response_suggestions(
        self,
        lead_id: str,
        last_message: str,
        conversation_history: List[Dict[str, Any]],
        lead_info: Dict[str, Any],
        broker_profile: Optional[Dict[str, Any]] = None
    ) -> List[str]:
        """
        Generar 3 sugerencias de respuesta basadas en el contexto

        Args:
            lead_id: ID del lead
            last_message: Último mensaje recibido
            conversation_history: Historial de conversación
            lead_info: Información del lead (nombre, interés, presupuesto, etc.)
            broker_profile: Perfil del broker (estilo, experiencia, etc.)

        Returns:
            Lista de 3 sugerencias de respuesta
        """
        try:
            # Construir contexto para la IA
            context = self._build_context(
                lead_info,
                conversation_history,
                broker_profile
            )

            # Generar prompt
            prompt = self._build_response_suggestion_prompt(
                last_message,
                context
            )

            # Llamar a la API de IA
            if self.emergent_available:
                suggestions = await self._generate_with_emergent(prompt)
            elif self.openai_api_key:
                suggestions = await self._generate_with_openai(prompt)
            else:
                # Fallback: sugerencias genéricas
                suggestions = self._generate_fallback_suggestions(
                    last_message,
                    lead_info
                )

            logger.info(f"Sugerencias generadas para lead_id={lead_id}")
            return suggestions

        except Exception as e:
            logger.error(f"Error al generar sugerencias: {str(e)}")
            # Retornar sugerencias genéricas en caso de error
            return self._generate_fallback_suggestions(last_message, lead_info)

    async def prioritize_messages(
        self,
        messages: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Priorizar mensajes basándose en contenido y contexto del lead

        Args:
            messages: Lista de mensajes a priorizar

        Returns:
            Lista de mensajes con prioridad asignada
        """
        try:
            # Palabras clave de urgencia
            urgency_keywords = {
                "alta": ["urgente", "ya", "ahora", "hoy", "inmediato", "emergency"],
                "media": ["mañana", "esta semana", "interesado", "consulta"],
                "baja": ["información", "gracias", "hola"]
            }

            for message in messages:
                content_lower = message.get("content", "").lower()

                # Calcular score de urgencia basado en palabras clave
                urgency_score = 0

                for keyword in urgency_keywords["alta"]:
                    if keyword in content_lower:
                        urgency_score += 3

                for keyword in urgency_keywords["media"]:
                    if keyword in content_lower:
                        urgency_score += 2

                for keyword in urgency_keywords["baja"]:
                    if keyword in content_lower:
                        urgency_score += 1

                # Determinar prioridad
                if urgency_score >= 3:
                    priority = "urgent"
                elif urgency_score >= 2:
                    priority = "high"
                else:
                    priority = "normal"

                message["priority"] = priority
                message["urgency_score"] = urgency_score

            # Ordenar por urgencia
            prioritized = sorted(
                messages,
                key=lambda m: m.get("urgency_score", 0),
                reverse=True
            )

            return prioritized

        except Exception as e:
            logger.error(f"Error al priorizar mensajes: {str(e)}")
            return messages

    async def detect_intent(
        self,
        message: str,
        lead_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Detectar intención del mensaje (compra, venta, información, etc.)

        Args:
            message: Contenido del mensaje
            lead_info: Información del lead

        Returns:
            Dict con intención detectada y confianza
        """
        message_lower = message.lower()

        # Patrones de intención
        intent_patterns = {
            "compra": ["comprar", "interés en", "precio de", "costo", "quisiera", "me interesa"],
            "venta": ["vender", "venta", "vendo"],
            "información": ["información", "info", "datos", "características"],
            "cita": ["cita", "visita", "conocer", "ver"],
            "disponibilidad": ["disponible", "disponibilidad", "hay", "existe"],
            "negociación": ["descuento", "oferta", "precio final", "mejor precio"]
        }

        detected_intents = []

        for intent, keywords in intent_patterns.items():
            for keyword in keywords:
                if keyword in message_lower:
                    detected_intents.append(intent)
                    break

        # Determinar intención principal con confianza
        if detected_intents:
            primary_intent = detected_intents[0]
            confidence = min(len(detected_intents) * 0.2, 1.0)
        else:
            primary_intent = "general"
            confidence = 0.3

        return {
            "intent": primary_intent,
            "confidence": confidence,
            "all_intents": detected_intents
        }

    def _build_context(
        self,
        lead_info: Dict[str, Any],
        conversation_history: List[Dict[str, Any]],
        broker_profile: Optional[Dict[str, Any]]
    ) -> str:
        """Construir contexto para la IA"""
        context_parts = []

        # Información del lead
        lead_context = f"""
LEAD:
- Nombre: {lead_info.get('name', 'Desconocido')}
- Interés: {lead_info.get('property_interest', 'No especificado')}
- Presupuesto: {lead_info.get('budget_mxn', 'No especificado')}
- Estado: {lead_info.get('status', 'nuevo')}
"""
        context_parts.append(lead_context)

        # Historial reciente (últimos 3 mensajes)
        if conversation_history:
            recent_messages = conversation_history[-3:]
            history_context = "HISTORIAL RECIENTE:\n"

            for msg in recent_messages:
                direction = "👤 Cliente" if msg.get("direction") == "inbound" else "🏢 Tú"
                history_context += f"{direction}: {msg.get('content', '')}\n"

            context_parts.append(history_context)

        # Perfil del broker
        if broker_profile:
            broker_context = f"""
PERFIL DEL BROKER:
- Experiencia: {broker_profile.get('experience', 'No especificada')}
- Estilo: {broker_profile.get('style', 'Profesional')}
- Propiedades: {broker_profile.get('property_types', 'Lotes, Casas')}
- Zonas: {broker_profile.get('focus_zones', 'Tulum')}
"""
            context_parts.append(broker_context)

        return "\n".join(context_parts)

    def _build_response_suggestion_prompt(
        self,
        last_message: str,
        context: str
    ) -> str:
        """Construir prompt para generar sugerencias"""
        prompt = f"""
Eres un asistente experto en bienes raíces en Tulum, México. Tu tarea es generar 3 sugerencias de respuesta para un broker inmobiliario.

{context}

ÚLTIMO MENSAJE DEL CLIENTE:
"{last_message}"

Genera 3 respuestas diferentes:
1. RESPUESTA DIRECTA: Concisa y directa, enfocada en resolver la consulta
2. RESPUESTA DETALLADA: Más informativa, con contexto adicional
4. RESPUESTA CERRADA: Intenta agendar una cita o llamada

FORMATO DE RESPUESTA (una por línea):
RESPUESTA 1: [tu respuesta aquí]
RESPUESTA 2: [tu respuesta aquí]
RESPUESTA 3: [tu respuesta aquí]

Reglas:
- Ser profesional pero amigable
- Usar el estilo del broker si está disponible
- Personalizar con la información del lead
- Mencionar propiedades/zonas relevantes
- No inventar información que no sepas
- Mantener respuestas cortas (1-2 oraciones máximo)
"""
        return prompt

    async def _generate_with_emergent(self, prompt: str) -> List[str]:
        """Generar respuestas usando emergentintegrations"""
        try:
            chat = LlmChat(
                system_prompt="Eres un experto asistente inmobiliario en Tulum, México.",
                model="gpt-4o-mini"
            )

            user_message = UserMessage(content=prompt)
            response = await chat.chat([user_message])

            # Parsear respuesta
            suggestions = self._parse_ai_response(response.content)
            return suggestions

        except Exception as e:
            logger.error(f"Error con emergentintegrations: {str(e)}")
            raise

    async def _generate_with_openai(self, prompt: str) -> List[str]:
        """Generar respuestas usando OpenAI API directamente"""
        try:
            import httpx

            headers = {
                "Authorization": f"Bearer {self.openai_api_key}",
                "Content-Type": "application/json"
            }

            data = {
                "model": "gpt-4o-mini",
                "messages": [
                    {
                        "role": "system",
                        "content": "Eres un experto asistente inmobiliario en Tulum, México."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": 500,
                "temperature": 0.7
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json=data
                )
                response.raise_for_status()
                result = response.json()

                content = result["choices"][0]["message"]["content"]
                suggestions = self._parse_ai_response(content)
                return suggestions

        except Exception as e:
            logger.error(f"Error con OpenAI API: {str(e)}")
            raise

    def _parse_ai_response(self, response: str) -> List[str]:
        """Parsear respuesta de la IA para extraer sugerencias"""
        suggestions = []

        for line in response.split("\n"):
            line = line.strip()

            if line.startswith("RESPUESTA"):
                # Extraer texto después de "RESPUESTA X:"
                parts = line.split(":", 1)
                if len(parts) > 1:
                    suggestion = parts[1].strip()
                    if suggestion:
                        suggestions.append(suggestion)

        # Si no se pudieron parsear, retornar la respuesta completa dividida
        if not suggestions:
            # Dividir por oraciones
            sentences = [s.strip() for s in response.split(".") if s.strip()]
            suggestions = [f"{s}." for s in sentences[:3]]

        # Retornar exactamente 3 sugerencias
        while len(suggestions) < 3:
            suggestions.append("Gracias por tu mensaje. Te contacto en breve.")

        return suggestions[:3]

    def _generate_fallback_suggestions(
        self,
        last_message: str,
        lead_info: Dict[str, Any]
    ) -> List[str]:
        """Generar sugerencias genéricas cuando la IA no está disponible"""
        name = lead_info.get("name", "")

        suggestions = [
            f"Gracias por tu mensaje {name if name else ''}. Te contacto en breve.",
            "Hola, gracias por escribirnos. ¿Te gustaría agendar una visita?",
            "Perfecto, te comparto más información por aquí mismo."
        ]

        return suggestions


# Instancia global del servicio
inbox_ai_service = InboxAIService()