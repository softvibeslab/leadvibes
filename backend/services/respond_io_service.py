"""
Servicio de integración con Respond.io para mensajería omnicanal

Documentación de la API: https://developer.respond.io/
"""

import os
import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

# Configuración desde variables de entorno
RESPOND_IO_API_TOKEN = os.getenv("RESPOND_IO_API_TOKEN", "")
RESPOND_IO_BASE_URL = os.getenv("RESPOND_IO_BASE_URL", "https://api.respond.io/v1")
RESPOND_IO_WEBHOOK_SECRET = os.getenv("RESPOND_IO_WEBHOOK_SECRET", "")


class RespondIOService:
    """Cliente para interactuar con la API de Respond.io"""

    def __init__(self):
        self.api_token = RESPOND_IO_API_TOKEN
        self.base_url = RESPOND_IO_BASE_URL
        self.webhook_secret = RESPOND_IO_WEBHOOK_SECRET

        if not self.api_token:
            logger.warning("RESPOND_IO_API_TOKEN no configurado - El servicio no funcionará")

    def _get_headers(self) -> Dict[str, str]:
        """Retornar headers para autenticación con la API"""
        return {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    async def send_message(
        self,
        channel_id: str,
        contact_id: str,
        message: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Enviar un mensaje a través de Respond.io

        Args:
            channel_id: ID del canal (whatsapp, instagram, etc.)
            contact_id: ID del contacto en Respond.io
            message: Diccionario con el mensaje a enviar
                Ejemplo: {"text": "Hola", "attachments": [...]}

        Returns:
            Dict con la respuesta de la API
        """
        url = f"{self.base_url}/send/message"

        payload = {
            "channel_id": channel_id,
            "contact_id": contact_id,
            "message": message
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers=self._get_headers()
                )
                response.raise_for_status()
                result = response.json()
                logger.info(f"Mensaje enviado a contact_id={contact_id}: {result}")
                return result

        except httpx.HTTPStatusError as e:
            logger.error(f"Error HTTP al enviar mensaje: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Error al enviar mensaje: {str(e)}")
            raise

    async def send_text_message(
        self,
        channel_id: str,
        contact_id: str,
        text: str
    ) -> Dict[str, Any]:
        """
        Enviar un mensaje de texto simple

        Args:
            channel_id: ID del canal
            contact_id: ID del contacto
            text: Contenido del mensaje

        Returns:
            Dict con la respuesta de la API
        """
        return await self.send_message(channel_id, contact_id, {"text": text})

    async def get_contact(self, contact_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtener información de un contacto

        Args:
            contact_id: ID del contacto en Respond.io

        Returns:
            Dict con la información del contacto o None si no existe
        """
        url = f"{self.base_url}/contacts/{contact_id}"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    url,
                    headers=self._get_headers()
                )
                response.raise_for_status()
                return response.json()

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.warning(f"Contacto no encontrado: {contact_id}")
                return None
            logger.error(f"Error HTTP al obtener contacto: {e.response.status_code}")
            raise
        except Exception as e:
            logger.error(f"Error al obtener contacto: {str(e)}")
            raise

    async def get_contacts(
        self,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Obtener lista de contactos

        Args:
            limit: Número máximo de contactos a retornar
            offset: Offset para paginación

        Returns:
            Lista de contactos
        """
        url = f"{self.base_url}/contacts"

        params = {
            "limit": limit,
            "offset": offset
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    url,
                    params=params,
                    headers=self._get_headers()
                )
                response.raise_for_status()
                data = response.json()
                return data.get("data", [])

        except Exception as e:
            logger.error(f"Error al obtener contactos: {str(e)}")
            raise

    async def get_channels(self) -> List[Dict[str, Any]]:
        """
        Obtener lista de canales configurados en Respond.io

        Returns:
            Lista de canales disponibles
        """
        url = f"{self.base_url}/channels"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    url,
                    headers=self._get_headers()
                )
                response.raise_for_status()
                data = response.json()
                return data.get("data", [])

        except Exception as e:
            logger.error(f"Error al obtener canales: {str(e)}")
            raise

    async def get_channel_by_type(self, channel_type: str) -> Optional[Dict[str, Any]]:
        """
        Obtener un canal por su tipo (whatsapp, instagram, telegram, etc.)

        Args:
            channel_type: Tipo de canal a buscar

        Returns:
            Dict con la información del canal o None si no existe
        """
        channels = await self.get_channels()

        for channel in channels:
            if channel.get("type", "").lower() == channel_type.lower():
                return channel

        return None

    async def get_conversations(
        self,
        channel_id: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Obtener lista de conversaciones

        Args:
            channel_id: Filtrar por canal (opcional)
            limit: Número máximo de conversaciones

        Returns:
            Lista de conversaciones
        """
        url = f"{self.base_url}/conversations"

        params = {"limit": limit}

        if channel_id:
            params["channel_id"] = channel_id

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    url,
                    params=params,
                    headers=self._get_headers()
                )
                response.raise_for_status()
                data = response.json()
                return data.get("data", [])

        except Exception as e:
            logger.error(f"Error al obtener conversaciones: {str(e)}")
            raise

    async def get_conversation_messages(
        self,
        conversation_id: str,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Obtener mensajes de una conversación

        Args:
            conversation_id: ID de la conversación
            limit: Número máximo de mensajes

        Returns:
            Lista de mensajes
        """
        url = f"{self.base_url}/conversations/{conversation_id}/messages"

        params = {"limit": limit}

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    url,
                    params=params,
                    headers=self._get_headers()
                )
                response.raise_for_status()
                data = response.json()
                return data.get("data", [])

        except Exception as e:
            logger.error(f"Error al obtener mensajes de conversación: {str(e)}")
            raise

    def verify_webhook_signature(
        self,
        payload: bytes,
        signature: str,
        timestamp: str
    ) -> bool:
        """
        Verificar firma del webhook de Respond.io

        Args:
            payload: Payload raw del webhook (bytes)
            signature: Firma del header X-Respond-Signature
            timestamp: Timestamp del header X-Respond-Timestamp

        Returns:
            True si la firma es válida, False en caso contrario
        """
        import hmac
        import hashlib

        if not self.webhook_secret:
            logger.warning("Webhook secret no configurado - No se puede verificar firma")
            return False

        # Construir el mensaje a firmar
        message_to_sign = f"{timestamp}.{payload.decode('utf-8')}"

        # Calcular firma esperada
        expected_signature = hmac.new(
            self.webhook_secret.encode('utf-8'),
            message_to_sign.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        # Comparar firmas (timing-safe comparison)
        return hmac.compare_digest(expected_signature, signature)

    def normalize_webhook_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalizar payload de webhook de Respond.io a formato interno

        Args:
            payload: Payload del webhook

        Returns:
            Dict con datos normalizados
        """
        event_type = payload.get("event", "unknown")

        normalized = {
            "source": "respond_io",
            "event_type": event_type,
            "raw_payload": payload,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        # Extraer datos según el tipo de evento
        if event_type == "message.received":
            message_data = payload.get("data", {})
            normalized.update({
                "message_id": message_data.get("id"),
                "conversation_id": message_data.get("conversationId"),
                "contact_id": message_data.get("contactId"),
                "channel_id": message_data.get("channelId"),
                "channel_type": message_data.get("channelType"),
                "direction": "inbound",
                "content": self._extract_message_content(message_data),
                "metadata": {
                    "attachments": message_data.get("attachments", []),
                    "location": message_data.get("location"),
                    "source": "respond_io"
                }
            })

        elif event_type == "message.updated":
            message_data = payload.get("data", {})
            normalized.update({
                "message_id": message_data.get("id"),
                "status": message_data.get("status"),
                "updated_fields": message_data.get("updatedFields", [])
            })

        return normalized

    def _extract_message_content(self, message_data: Dict[str, Any]) -> str:
        """
        Extraer contenido de texto de un mensaje

        Args:
            message_data: Datos del mensaje

        Returns:
            Contenido de texto del mensaje
        """
        # Intentar obtener el texto directamente
        if "text" in message_data:
            return message_data["text"]

        # Si hay attachment, retornar descripción
        attachments = message_data.get("attachments", [])
        if attachments:
            attachment_type = attachments[0].get("type", "unknown")
            return f"[{attachment_type}]"

        return ""


# Instancia global del servicio
respond_io_service = RespondIOService()