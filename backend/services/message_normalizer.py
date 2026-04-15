"""
Servicio para normalizar mensajes de diferentes plataformas
al formato unificado ConversationMessage de Rovi CRM
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from models import ConversationMessage

logger = logging.getLogger(__name__)


class MessageNormalizer:
    """Normaliza mensajes de diferentes plataformas a formato unificado"""

    # Mapeo de tipos de canales
    CHANNEL_MAPPING = {
        "whatsapp": "whatsapp",
        "wa": "whatsapp",
        "instagram": "instagram",
        "ig": "instagram",
        "instagram_dm": "instagram",
        "telegram": "telegram",
        "tg": "telegram",
        "sms": "sms",
        "twilio": "sms",
        "email": "email",
        "mail": "email",
        "messenger": "messenger",
        "facebook": "messenger"
    }

    def __init__(self):
        pass

    def normalize_from_respond_io(
        self,
        webhook_payload: Dict[str, Any],
        tenant_id: str,
        user_id: str
    ) -> Optional[ConversationMessage]:
        """
        Normalizar mensaje de webhook de Respond.io

        Args:
            webhook_payload: Payload del webhook de Respond.io
            tenant_id: ID del tenant
            user_id: ID del usuario (broker)

        Returns:
            ConversationMessage normalizado o None si no es un evento de mensaje
        """
        event_type = webhook_payload.get("event", "")

        # Solo procesar eventos de mensaje recibido
        if event_type != "message.received":
            logger.debug(f"Ignorando evento que no es de mensaje: {event_type}")
            return None

        try:
            data = webhook_payload.get("data", {})

            # Extraer información básica
            message_id = data.get("id")
            conversation_id = data.get("conversationId")
            contact_id = data.get("contactId")
            channel_id = data.get("channelId")
            channel_type = self._normalize_channel_type(data.get("channelType", ""))
            created_at = data.get("createdAt") or data.get("timestamp")

            # Extraer contenido
            content = self._extract_content(data)

            # Extraer metadata
            metadata = self._extract_metadata(data)

            # Determinar dirección
            direction = data.get("direction", "inbound")

            # Obtener información del contacto si está disponible
            contact_info = data.get("contact", {})
            lead_name = self._extract_contact_name(contact_info)
            lead_id = self._get_or_create_lead_id(contact_id, contact_info)

            # Crear modelo de mensaje
            message = ConversationMessage(
                id=message_id,
                tenant_id=tenant_id,
                user_id=user_id,
                lead_id=lead_id,
                lead_name=lead_name,
                channel=channel_type,
                direction=direction,
                content=content,
                metadata=metadata,
                read=False,
                responded=False,
                created_at=self._parse_datetime(created_at)
            )

            logger.info(f"Mensaje normalizado de Respond.io: {message_id} - {channel_type}")
            return message

        except Exception as e:
            logger.error(f"Error al normalizar mensaje de Respond.io: {str(e)}")
            raise

    def normalize_from_twilio(
        self,
        twilio_payload: Dict[str, Any],
        tenant_id: str,
        user_id: str,
        channel: str = "sms"
    ) -> ConversationMessage:
        """
        Normalizar mensaje de webhook de Twilio

        Args:
            twilio_payload: Payload del webhook de Twilio
            tenant_id: ID del tenant
            user_id: ID del usuario (broker)
            channel: Tipo de canal (sms, email, whatsapp)

        Returns:
            ConversationMessage normalizado
        """
        # Extraer información de Twilio
        message_sid = twilio_payload.get("MessageSid") or twilio_payload.get("SmsMessageSid")
        from_number = twilio_payload.get("From") or twilio_payload.get("From")
        to_number = twilio_payload.get("To") or twilio_payload.get("To")
        body = twilio_payload.get("Body", "")
        direction = "inbound" if twilio_payload.get("Direction") != "outbound-api" else "outbound"

        # Crear ID del lead basado en el número
        lead_id = from_number.replace("+", "")
        lead_name = from_number  # En SMS no tenemos nombre, usamos el número

        # Metadata específica de Twilio
        metadata = {
            "source": "twilio",
            "message_sid": message_sid,
            "from": from_number,
            "to": to_number,
            "status": twilio_payload.get("Status"),
            "num_segments": twilio_payload.get("NumSegments"),
            "num_media": twilio_payload.get("NumMedia", 0)
        }

        # Si hay media, agregar URLs
        if twilio_payload.get("NumMedia", 0) > 0:
            media_urls = []
            for i in range(int(twilio_payload.get("NumMedia", 0))):
                media_url_key = f"MediaUrl{i}"
                if media_url_key in twilio_payload:
                    media_urls.append(twilio_payload[media_url_key])
            metadata["media_urls"] = media_urls

        return ConversationMessage(
            id=message_sid,
            tenant_id=tenant_id,
            user_id=user_id,
            lead_id=lead_id,
            lead_name=lead_name,
            channel=channel,
            direction=direction,
            content=body,
            metadata=metadata,
            read=False,
            responded=False,
            created_at=datetime.now(timezone.utc)
        )

    def normalize_from_telegram(
        self,
        telegram_update: Dict[str, Any],
        tenant_id: str,
        user_id: str
    ) -> Optional[ConversationMessage]:
        """
        Normalizar mensaje de update de Telegram Bot API

        Args:
            telegram_update: Update de Telegram Bot API
            tenant_id: ID del tenant
            user_id: ID del usuario (broker)

        Returns:
            ConversationMessage normalizado o None si no es un mensaje
        """
        # Verificar si es un mensaje
        if "message" not in telegram_update:
            return None

        message = telegram_update["message"]
        message_id = str(message.get("message_id"))
        from_user = message.get("from", {})
        chat = message.get("chat", {})

        # Extraer información básica
        lead_id = str(from_user.get("id"))
        lead_name = from_user.get("username") or from_user.get("first_name", "Unknown")

        # Extraer contenido (texto, foto, documento, etc.)
        content = self._extract_telegram_content(message)

        # Metadata específica de Telegram
        metadata = {
            "source": "telegram",
            "message_id": message_id,
            "update_id": telegram_update.get("update_id"),
            "chat_type": chat.get("type"),
            "from_user": {
                "id": from_user.get("id"),
                "is_bot": from_user.get("is_bot", False),
                "first_name": from_user.get("first_name"),
                "last_name": from_user.get("last_name"),
                "username": from_user.get("username")
            }
        }

        # Si hay ubicación
        if "location" in message:
            metadata["location"] = message["location"]

        return ConversationMessage(
            id=message_id,
            tenant_id=tenant_id,
            user_id=user_id,
            lead_id=lead_id,
            lead_name=lead_name,
            channel="telegram",
            direction="inbound",
            content=content,
            metadata=metadata,
            read=False,
            responded=False,
            created_at=datetime.fromtimestamp(message.get("date", 0), tz=timezone.utc)
        )

    def _normalize_channel_type(self, channel_type: str) -> str:
        """Normalizar tipo de canal a formato estándar"""
        channel_type_lower = channel_type.lower().strip()
        return self.CHANNEL_MAPPING.get(channel_type_lower, channel_type_lower)

    def _extract_content(self, message_data: Dict[str, Any]) -> str:
        """Extraer contenido de texto de un mensaje"""
        # Texto directo
        if "text" in message_data and message_data["text"]:
            return message_data["text"]

        # Media con caption
        if "caption" in message_data and message_data["caption"]:
            return message_data["caption"]

        # Attachment
        attachments = message_data.get("attachments", [])
        if attachments:
            attachment = attachments[0]
            attachment_type = attachment.get("type", "file")
            return f"[{attachment_type}]"

        return ""

    def _extract_metadata(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extraer metadata del mensaje"""
        metadata = {
            "source": "respond_io"
        }

        # Attachments
        if "attachments" in message_data:
            metadata["attachments"] = message_data["attachments"]

        # Location
        if "location" in message_data:
            metadata["location"] = message_data["location"]

        # Status
        if "status" in message_data:
            metadata["status"] = message_data["status"]

        # Contact info
        if "contact" in message_data:
            metadata["contact"] = message_data["contact"]

        return metadata

    def _extract_contact_name(self, contact_info: Dict[str, Any]) -> str:
        """Extraer nombre del contacto"""
        # Intentar obtener nombre
        if "name" in contact_info and contact_info["name"]:
            return contact_info["name"]

        # Usar phone o email como fallback
        if "phones" in contact_info and contact_info["phones"]:
            return contact_info["phones"][0]

        if "emails" in contact_info and contact_info["emails"]:
            return contact_info["emails"][0]

        return "Desconocido"

    def _get_or_create_lead_id(self, contact_id: str, contact_info: Dict[str, Any]) -> str:
        """
        Obtener o crear ID de lead basado en el contacto

        Por ahora retornamos el contact_id directamente,
        pero en el futuro deberíamos buscar en la BD de leads
        """
        # Si tiene un ID personalizado, usarlo
        if "customFields" in contact_info:
            custom_id = contact_info["customFields"].get("lead_id")
            if custom_id:
                return custom_id

        # Retornar el contact_id de la plataforma
        return contact_id

    def _extract_telegram_content(self, message: Dict[str, Any]) -> str:
        """Extraer contenido de mensaje de Telegram"""
        # Texto
        if "text" in message:
            return message["text"]

        # Foto con caption
        if "photo" in message:
            caption = message.get("caption", "")
            return f"[Imagen] {caption}".strip()

        # Documento
        if "document" in message:
            document_name = message["document"].get("file_name", "Documento")
            return f"[Documento: {document_name}]"

        # Sticker
        if "sticker" in message:
            return "[Sticker]"

        # Video
        if "video" in message:
            return "[Video]"

        # Audio
        if "audio" in message:
            return "[Audio]"

        # Voz
        if "voice" in message:
            return "[Mensaje de voz]"

        # Ubicación
        if "location" in message:
            loc = message["location"]
            return f"[Ubicación: {loc.get('latitude')}, {loc.get('longitude')}]"

        # Contacto
        if "contact" in message:
            contact = message["contact"]
            return f"[Contacto: {contact.get('first_name')}]"

        return "[Mensaje]"

    def _parse_datetime(self, datetime_str: Optional[str]) -> datetime:
        """Parsear datetime de various formats"""
        if not datetime_str:
            return datetime.now(timezone.utc)

        try:
            # ISO format
            if "T" in datetime_str:
                return datetime.fromisoformat(datetime_str.replace("Z", "+00:00"))
            # Timestamp (segundos o milisegundos)
            else:
                timestamp = float(datetime_str)
                # Si es muy grande, asumir milisegundos
                if timestamp > 10000000000:
                    timestamp = timestamp / 1000
                return datetime.fromtimestamp(timestamp, tz=timezone.utc)
        except Exception as e:
            logger.warning(f"No se pudo parsear datetime '{datetime_str}': {e}")
            return datetime.now(timezone.utc)


# Instancia global del normalizer
message_normalizer = MessageNormalizer()