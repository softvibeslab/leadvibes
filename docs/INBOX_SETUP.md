# Configuración del Módulo de Inbox Centralizado - Rovi CRM

## Implementación Completada

El módulo de Inbox centralizado ha sido implementado exitosamente con las siguientes características:

### ✅ Componentes Implementados

#### Backend

1. **Modelos de Datos** (`backend/models.py`)
   - `InboxWebhook`: Para webhooks recibidos de plataformas
   - `InboxChannelConfig`: Configuración de canales por tenant
   - `InboxMessageTemplate`: Plantillas de respuesta rápida
   - `ConversationMessage` y `ConversationThread`: Modelos existentes mejorados

2. **Servicios** (`backend/services/`)
   - `respond_io_service.py`: Integración completa con Respond.io API
   - `message_normalizer.py`: Normalización de mensajes de diferentes plataformas
   - `inbox_ai_service.py`: Servicio de IA para sugerencias de respuesta

3. **Endpoints** (`backend/server.py`)
   - `POST /api/inbox/webhooks/respond`: Recibe webhooks de Respond.io
   - `GET /api/inbox/conversations`: Lista conversaciones (existente, mejorado)
   - `POST /api/inbox/conversations/{lead_id}/messages`: Enviar mensajes (actualizado)
   - `WS /ws/inbox`: WebSocket para actualizaciones en tiempo real
   - `GET /api/inbox/ai-insights`: Insights de IA (existente)

#### Frontend

1. **Componentes** (`frontend/src/`)
   - `components/InboxWebSocket.js`: Hook personalizado para WebSocket
   - `pages/InboxPage.js`: Inbox actualizado con WebSocket

2. **Características**
   - Conexión WebSocket para actualizaciones en tiempo real
   - Indicador de estado de conexión
   - Notificaciones toast para nuevos mensajes
   - Reconexión automática
   - Heartbeat para mantener conexión viva

---

## Configuración de Respond.io

Para que el módulo funcione completamente, necesitas configurar Respond.io:

### Paso 1: Crear Cuenta en Respond.io

1. Visita [https://respond.io](https://respond.io)
2. Regístrate y selecciona el plan **Growth** ($159/mes)
   - 10 usuarios
   - 1,000 Monthly Active Contacts (MACs)
3. Verifica tu email

### Paso 2: Configurar Canales

En el dashboard de Respond.io, configura los canales:

#### WhatsApp Business API
1. Ve a **Settings** → **Channels** → **Add Channel** → **WhatsApp**
2. Selecciona **Use existing WhatsApp Business API** (si ya tienes) o **Create new**
3. Completa la verificación:
   - Número de WhatsApp business
   - Verificación de Facebook Business Manager
   - Aprobación de plantillas de mensaje (si necesitas)

#### Instagram Messaging
1. Ve a **Settings** → **Channels** → **Add Channel** → **Instagram**
2. Conecta tu cuenta de Instagram Business
3. Autoriza a Respond.io a acceder a mensajes DM

#### Telegram
1. Ve a **Settings** → **Channels** → **Add Channel** → **Telegram**
2. Crea un bot con @BotFather
3. Copia el token del bot
4. Pégalo en Respond.io

### Paso 3: Obtener API Token

1. Ve a **Settings** → **API**
2. Genera un nuevo **API Token**
3. Copia el token (se verá como `xyz...`)

### Paso 4: Configurar Webhooks

1. Ve a **Settings** → **Webhooks**
2. Agrega un nuevo webhook:
   - **URL**: `https://[tu-dominio]/api/inbox/webhooks/respond`
   - **Secret**: Genera un secreto y cópialo
   - **Eventos**: Selecciona todos los eventos de mensajes:
     - `message.received`
     - `message.updated`
     - `conversation.started`

### Paso 5: Configurar Variables de Entorno

En tu archivo `.env` del backend, agrega:

```bash
# Respond.io Configuration
RESPOND_IO_API_TOKEN=tu_token_aqui
RESPOND_IO_WEBHOOK_SECRET=tu_secreto_webhook_aqui
RESPOND_IO_BASE_URL=https://api.respond.io/v1

# OpenAI para IA de respuestas (opcional)
OPENAI_API_KEY=sk-tu_clave_aqui

# WebSocket Configuration
WS_HEARTBEAT_INTERVAL=30000
```

### Paso 6: Reiniciar Backend

```bash
docker compose -f docker-compose.hostinger.yml restart backend
```

---

## Flujo de Mensajes

### Mensajes Entrantes (Cliente → Rovi)

```
Cliente envía WhatsApp
    ↓
Respond.io recibe mensaje
    ↓
Respond.io envía Webhook a Rovi
    ↓
Endpoint /api/inbox/webhooks/respond procesa
    ↓
Message Normalizer transforma a ConversationMessage
    ↓
Guarda en MongoDB (conversation_messages)
    ↓
WebSocket broadcast a clientes conectados
    ↓
InboxPage actualiza en tiempo real + Toast notification
```

### Mensajes Salientes (Rovi → Cliente)

```
Broker escribe mensaje en InboxPage
    ↓
POST /api/inbox/conversations/{lead_id}/messages
    ↓
Respond.io Service llama a API de Respond.io
    ↓
Respond.io envía mensaje al cliente
    ↓
Guarda confirmación en MongoDB
    ↓
WebSocket broadcast actualización
```

---

## Pruebas de Funcionamiento

### 1. Verificar Webhook

```bash
curl -X POST https://[tu-dominio]/api/inbox/webhooks/respond \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message.received",
    "data": {
      "id": "test_msg_123",
      "conversationId": "conv_123",
      "contactId": "contact_123",
      "channelId": "whatsapp_channel_id",
      "channelType": "whatsapp",
      "text": "Mensaje de prueba"
    }
  }'
```

### 2. Verificar WebSocket

1. Abre el Inbox en tu navegador: `http://[tu-dominio]/inbox`
2. Abre la consola del navegador (F12)
3. Deberías ver: `WebSocket conectado`
4. El indicador en la UI debe mostrar "Conectado"

### 3. Enviar Mensaje de Prueba

Desde WhatsApp/Instagram/Telegram, envía un mensaje al número configurado. Deberías:
- Ver el mensaje en el Inbox en tiempo real
- Recibir notificación toast
- Poder responder desde el Inbox

---

## Arquitectura de Cómputo

### Costos Mensuales Estimados

| Servicio | Costo | Notas |
|----------|-------|-------|
| Respond.io Growth | $159/mes | 10 usuarios, 1,000 MACs |
| WhatsApp Conversations | $25-40/mes | ~500 conversaciones/mes |
| OpenAI API (opcional) | $20-50/mes | ~1,000 sugerencias IA |
| **Total** | **~$205-250/mes** | Dentro del presupuesto de $100-500 |

### Escalabilidad

- **Hasta 1,000 MACs**: Plan Growth de Respond.io ($159/mes)
- **1,000 - 5,000 MACs**: Plan Advanced ($279/mes) + upgrade backend
- **5,000+ MACs**: Considerar migración a Fase 2 (solución propia parcial)

---

## Próximos Pasos

### Inmediatos (Días 1-2)

1. ✅ **Cuenta en Respond.io**: Regístrese y configure
2. ✅ **API Token**: Obtener y configurar en variables de entorno
3. ✅ **Canales**: Configurar WhatsApp e Instagram
4. ✅ **Webhook**: Configurar URL en Respond.io
5. ✅ **Pruebas**: Enviar mensajes de prueba

### Corto Plazo (Semana 2)

1. **Plantillas de Respuesta**: Crear endpoint `/api/inbox/templates`
2. **Sugerencias de IA**: Implementar endpoint `/api/inbox/ai-suggestions`
3. **Priorización**: Activar algoritmo de priorización de mensajes
4. **Dashboard**: Métricas de tiempo de respuesta

### Mediano Plazo (Mes 2-3)

1. **Fase 2 - Migración Parcial**:
   - Telegram a API directa (gratis)
   - SMS/Email con Twilio directo
   - Mantener Respond.io para WhatsApp/Instagram

2. **Automatización**:
   - Respuestas automáticas fuera de horario
   - Enrutamiento inteligente
   - Cualificación de leads con IA

### Largo Plazo (Mes 6+)

1. **Fase 3 - Solución Propia**:
   - WhatsApp Business API directa
   - Instagram Messaging API directa
   - Ahorro a largo plazo

---

## Troubleshooting

### WebSocket no conecta

**Síntoma**: Indicador muestra "Desconectado"

**Soluciones**:
1. Verificar que el token JWT sea válido
2. Revisar logs del backend: `docker logs rovi-backend`
3. Verificar que el puerto 8000 esté abierto
4. Probar conexión manual: `wscat -c "ws://[dominio]:8000/ws/inbox?token=[jwt]"`

### Webhook no se recibe

**Síntoma**: Mensajes no aparecen en el Inbox

**Soluciones**:
1. Verificar que Respond.io tenga la URL correcta
2. Revisar logs del backend para errores de webhook
3. Verificar firma del webhook si está habilitada
4. Probar webhook manual con curl

### Error al enviar mensaje

**Síntoma**: "Error al enviar mensaje" en el Inbox

**Soluciones**:
1. Verificar que `RESPOND_IO_API_TOKEN` esté configurado
2. Revisar que el canal esté activo en Respond.io
3. Verificar que el contacto tenga conversación previa
4. Verificar logs: `docker logs rovi-backend -f`

### IA no genera sugerencias

**Síntoma**: No aparecen sugerencias de respuesta

**Soluciones**:
1. Verificar que `OPENAI_API_KEY` esté configurada
2. Si no está configurada, se usarán sugerencias genéricas
3. Para OpenAI, verificar saldo y límites de API
4. Revisar logs del servicio IA

---

## Recursos

### Documentación
- [Respond.io Developer Docs](https://developer.respond.io/)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/business-api)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [FastAPI WebSockets](https://fastapi.tiangolo.com/advanced/websockets/)

### Soporte
- Issues de GitHub: [softvibeslab/leadvibes](https://github.com/softvibeslab/leadvibes/issues)
- Email: soporte@rovi.crm

---

## Métricas de Éxito

### Técnicas
- ✅ Latencia de mensaje: < 3 segundos webhook → UI
- ✅ Uptime del webhook: 99.5%+
- ✅ Rate de errores de envío: < 1%

### Negocio
- 🎯 Response time: < 5 minutos promedio
- 🎯 Conversación rate: > 20% de leads contestados
- 🎯 Satisfacción: Feedback positivo de brokers

---

**Fecha de implementación**: Abril 15, 2026
**Versión**: 1.0.0 - MVP Fase 1
**Próxima revisión**: Semana 2 (Implementación de IA avanzada)