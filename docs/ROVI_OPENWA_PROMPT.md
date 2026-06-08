# Prompt: Implementación OpenWA para Rovi CRM

> **Copiar y pegar este prompt cuando estés listo para comenzar la implementación**

---

## Contexto

Eres un arquitecto de software senior especializado en integraciones WhatsApp y microservicios. Trabajas para Rovi, un CRM inmobiliario mexicano.

**Tech Stack de Rovi**:
- Backend: FastAPI + MongoDB (Motor async)
- Frontend: React 19 + Tailwind CSS + shadcn/ui
- Deployment: Docker Compose + Nginx
- Auth: JWT con tenant isolation por `tenant_id`

**Objetivo**: Integrar @open-wa/wa-automate para que cada broker tenga su WhatsApp personal conectado directamente en el CRM.

---

## Tu Misión

Implementar el módulo WhatsApp para Rovi siguiendo este plan:

### FASE 1: WhatsApp Gateway (Node.js)

1. **Crear directorio** `whatsapp-gateway/` con:
   - `package.json` con dependencias: @open-wa/wa-automate, express, winston, redis
   - `src/index.ts` como entry point
   - `src/services/SessionManager.ts` - Manejo de sesiones multi-tenant
   - `src/controllers/SessionController.ts` - Endpoints REST
   - `src/types/index.ts` - TypeScript types

2. **SessionManager debe**:
   - Crear sesiones WhatsApp usando Client de @open-wa/wa-automate
   - Emitir eventos: qr, ready, message, disconnected
   - Manejar reconexiones automáticas
   - Rate limiting por sesión (max 30 msgs/min)

3. **Endpoints a implementar**:
   ```
   POST   /sessions/create
   GET    /sessions/:id/qr
   GET    /sessions/:id/status
   POST   /sessions/:id/send
   DELETE /sessions/:id
   ```

### FASE 2: Backend Service (Python)

1. **Crear archivos** en `backend/`:
   - `whatsapp_service.py` - Cliente HTTP para Gateway
   - `whatsapp_models.py` - Pydantic models (Session, Message, Template)
   - `whatsapp_websocket.py` - WebSocket para real-time (opcional)

2. **Endpoints FastAPI** (`/api/whatsapp/*`):
   - `POST /sessions/create` - Crear sesión para broker actual
   - `GET /sessions/{id}/qr` - Obtener QR para escanear
   - `POST /sessions/{id}/send` - Enviar mensaje
   - `POST /webhook` - Recibir mensajes desde Gateway
   - `GET /sessions/{id}/chats` - Listar conversaciones

3. **Integración CRM**:
   - Auto-crear leads desde nuevos números WhatsApp
   - Logging de conversaciones en colección `whatsapp_messages`
   - Crear activities cuando se envía/recibe mensaje
   - Vincular mensajes con leads existentes por teléfono

### FASE 3: Frontend Module (React)

1. **Crear página** `frontend/src/pages/RoviWhatsAppPage.js`:
   - Sidebar con lista de conversaciones
   - Chat interface en tiempo real
   - Modal para QR scanning
   - Botón "Vincular WhatsApp"

2. **Componentes** en `frontend/src/components/whatsapp/`:
   - `ChatInterface.js` - Vista de chat con bubbles
   - `ConversationList.js` - Lista de chats
   - `QRModal.js` - Modal con QR code
   - `MessageBubble.js` - Componente de mensaje

3. **Hook personalizado** `frontend/src/hooks/useWhatsApp.js`:
   - `useWhatsApp()` - Maneja conexión con API
   - `useConversations()` - Obtiene lista de chats
   - `useMessages()` - Obtiene mensajes de un chat

### FASE 4: Docker Integration

1. **Actualizar `docker-compose.yml`**:
   ```yaml
   services:
     whatsapp-gateway:
       build: ./whatsapp-gateway
       ports: ["3000:3000"]
       environment:
         - ROVI_BACKEND_URL=http://backend:8000
       depends_on:
         - backend

     redis:
       image: redis:7-alpine
   ```

2. **Environment variables** en `.env`:
   ```
   WHATSAPP_GATEWAY_URL=http://whatsapp-gateway:3000
   WHATSAPP_RATE_LIMIT_PER_MINUTE=30
   ```

---

## Requerimientos Técnicos

### Multi-Tenancy

Cada broker (`user_id`) puede tener **una sola sesión WhatsApp activa**. La sesión debe:
- Estar asociada a `user_id` y `tenant_id`
- No compartirse entre usuarios
- Persistir en MongoDB con estatus (initializing, qr_ready, connected, disconnected)

### Compliance WhatsApp

- Respetar rate limits nativos (no >30 msgs/min)
- No permitir bulk messaging sin consentimiento
- Alertar si sesión es desconectada por WhatsApp
- Permitir desvinculación inmediata

### Seguridad

- Validar que `user_id` del token sea dueño de la sesión
- Sanitizar todos los inputs de mensajes
- No almacenar datos sensibles de WhatsApp en texto plano
- Rate limiting en endpoints del backend

---

## Archivos a Crear/Modificar

```
whatsapp-gateway/                          # NUEVO
├── package.json
├── tsconfig.json
├── Dockerfile
├── src/
│   ├── index.ts
│   ├── config/index.ts
│   ├── services/SessionManager.ts
│   ├── controllers/SessionController.ts
│   ├── types/index.ts
│   └── utils/logger.ts
└── tests/

backend/
├── whatsapp_service.py                    # NUEVO
├── whatsapp_models.py                     # NUEVO
└── server.py                              # MODIFICAR (agregar router)

frontend/src/
├── pages/
│   └── RoviWhatsAppPage.js                # NUEVO
├── components/whatsapp/                    # NUEVO
│   ├── ChatInterface.js
│   ├── ConversationList.js
│   ├── QRModal.js
│   └── MessageBubble.js
├── hooks/
│   └── useWhatsApp.js                     # NUEVO
└── App.js                                 # MODIFICAR (agregar ruta)

docker-compose.yml                          # MODIFICAR
```

---

## Testing

Crear tests para:
1. **Gateway**: Crear sesión, enviar mensaje, recibir webhook
2. **Backend**: Endpoints API, integración con leads
3. **E2E**: Flujo completo: login → crear sesión → escanear QR → enviar mensaje

---

## Outputs Esperados

Al completar esta tarea, deberías tener:

1. ✅ Servicio `whatsapp-gateway` corriendo en puerto 3000
2. ✅ Endpoint `/api/whatsapp/sessions/create` funcional
3. ✅ QR code generado y scaneable
4. ✅ Mensajes enviados desde Rovi aparecen en WhatsApp
5. ✅ Mensajes recibidos en WhatsApp crean leads automáticamente
6. ✅ Conversaciones visibles en UI de Rovi
7. ✅ Todo en Docker compose

---

## Preguntas para Aclarar

Antes de comenzar, aclara:

1. ¿Quieres implementar **todas las fases** o empezar con un MVP?
2. ¿El **WhatsApp Gateway** debe ser un servicio separado o puede integrarse en backend?
3. ¿Necesitas **WebSocket** para real-time o basta con polling?
4. ¿El **rate limiting** debe ser configurable por tenant?

---

**Comienza cuando estés listo. Prioriza el MVP: sesión WhatsApp funcional + backend endpoints + UI básica.**
