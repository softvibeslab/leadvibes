# Rovi - Plan de Integración OpenWA/wa-automate

## Executive Summary

Este documento detalla el plan técnico para integrar **OpenWA** o **@open-wa/wa-automate** al ecosistema Rovi CRM, permitiendo que los brókers utilicen WhatsApp directamente desde la plataforma sin depender de servicios externos como Hermes.

## Objetivos

1. **Autonomía**: Eliminar dependencia de servicios externos para WhatsApp
2. **Control Total**: Gestionar sesiones, mensajes y webhooks directamente
3. **Escalabilidad**: Soportar múltiples sesiones WhatsApp simultáneas (una por broker)
4. **Compliance**: Mantener cumplimiento con Terms of Service de WhatsApp
5. **Integración CRM**: Vincular conversaciones directamente con leads y actividades

---

## Comparación: OpenWA vs @open-wa/wa-automate

| Característica | OpenWA | @open-wa/wa-automate |
|----------------|--------|----------------------|
| **Lenguaje** | TypeScript/Node.js | TypeScript/Node.js |
| **Mantenimiento** | Menos activo | Muy activo |
| **Documentación** | Básica | Extensa |
| **Soporte Multi-session** | Limited | Native |
| **Webhooks** | Manual | Built-in |
| **QR Code** | Manual | Built-in |
| **Rate Limiting** | Manual | Built-in protection |
| **Community** | Pequeña | Grande (2.5k+ stars) |
| **Enterprise Ready** | No | Sí |
| **Recomendación** | ❌ | ✅ |

**Decisión Recomendada**: Usar **@open-wa/wa-automate** por su madurez, soporte activo y características enterprise.

---

## Arquitectura Propuesta

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Frontend React (Rovi CRM)                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                   WhatsApp Module (Nuevo)                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐│ │
│  │  │ Chat UI     │  │ QR Link      │  │ Settings                       ││ │
│  │  │ Component   │  │ Flow         │  │ Per Broker                     ││ │
│  │  └──────────────┘  └──────────────┘  └───────────────────────────────┘│ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────┬──────────────────────────────┘
                                               │ API Calls
                                               ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Backend FastAPI (Rovi)                                │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                   WhatsApp Service Layer (Nuevo)                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐│ │
│  │  │ Session      │  │ Message      │  │ Webhook                        ││ │
│  │  │ Manager     │  │ Handler      │  │ Receiver                       ││ │
│  │  └──────────────┘  └──────────────┘  └───────────────────────────────┘│ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────┬──────────────────────────────┘
                                               │ HTTP/gRPC (recommended)
                                               ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WhatsApp Gateway Service (Node.js)                        │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │              @open-wa/wa-automate Multi-Session Manager                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐│ │
│  │  │ Session      │  │ Message      │  │ Rate Limit                     ││ │
│  │  │ Pool        │  │ Queue        │  │ Manager                        ││ │
│  │  └──────────────┘  └──────────────┘  └───────────────────────────────┘│ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────┬──────────────────────────────┘
                                               │ WhatsApp Web Protocol
                                               ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WhatsApp Web Servers                                │
│                        (Multi-session per user)                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Componentes del Sistema

### 1. WhatsApp Gateway Service (Node.js)

**Propósito**: Servicio independiente que maneja todas las conexiones WhatsApp usando @open-wa/wa-automate.

**Ubicación**: `whatsapp-gateway/` (nuevo directorio)

**Responsabilidades**:
- Manejar pool de sesiones WhatsApp (una por broker)
- Procesar cola de mensajes salientes
- Recibir webhooks de mensajes entrantes
- Generar QR codes para vinculación
- Manejar reconexiones automáticas
- Rate limiting y compliance

**Endpoints Exposed**:
```
POST   /sessions/create          - Crear nueva sesión
GET    /sessions/:id/qr         - Obtener QR para escanear
GET    /sessions/:id/status     - Estatus de sesión
DELETE /sessions/:id            - Cerrar/remover sesión
POST   /sessions/:id/send       - Enviar mensaje
GET    /sessions/:id/chats      - Listar chats
POST   /webhook                 - Recibir notificaciones de wa-automate
```

### 2. WhatsApp Service Layer (Python)

**Propósito**: Capa en backend FastAPI que comunica con WhatsApp Gateway.

**Ubicación**: `backend/whatsapp_service.py` (nuevo archivo)

**Responsabilidades**:
- Comunicación con WhatsApp Gateway
- Integración con sistema de leads
- Logging de conversaciones
- Vinculación de chats con leads existentes
- Gestión de plantillas de mensajes

### 3. Frontend WhatsApp Module

**Propósito**: UI para brókers interactuar con WhatsApp desde Rovi.

**Ubicación**: `frontend/src/pages/RoviWhatsAppPage.js` (nuevo archivo)

**Features**:
- Chat interface en tiempo real
- Vinculación de WhatsApp con QR
- Lista de conversaciones
- Búsqueda en mensajes
- Plantillas de respuestas rápidas
- Integración con perfil de lead

---

## Plan de Implementación

### FASE 1: Foundation (Semanas 1-2)

#### Sprint 1.1: WhatsApp Gateway Setup
- [ ] Crear proyecto Node.js para WhatsApp Gateway
- [ ] Instalar y configurar @open-wa/wa-automate
- [ ] Implementar Session Manager básico
- [ ] Crear endpoint `/sessions/create`
- [ ] Implementar generación de QR codes
- [ ] Testing local con WhatsApp personal

**Deliverables**:
- Repositorio `whatsapp-gateway/` funcional
- Primera sesión WhatsApp conectada exitosamente
- Documentación de setup local

#### Sprint 1.2: Backend Integration
- [ ] Crear `backend/whatsapp_service.py`
- [ ] Implementar cliente HTTP para comunicar con Gateway
- [ ] Crear modelos Pydantic para mensajes y sesiones
- [ ] Implementar endpoints `/api/whatsapp/sessions/*`
- [ ] Integración con auth de Rovi (tenant isolation)
- [ ] Testing de integración

**Deliverables**:
- Service layer funcional
- Endpoints API documentados
- Tests de integración pasando

### FASE 2: Core Messaging (Semanas 3-4)

#### Sprint 2.1: Message Handling
- [ ] Implementar cola de mensajes salientes en Gateway
- [ ] Crear endpoint `/sessions/:id/send`
- [ ] Implementar tipos de mensajes (text, image, document)
- [ ] Webhook receiver para mensajes entrantes
- [ ] Rate limiting por sesión
- [ ] Manejo de errores y reconexiones

**Deliverables**:
- Sistema de mensajía bidireccional funcional
- Rate limiting configurado
- Manejo robusto de errores

#### Sprint 2.2: CRM Integration
- [ ] Vincular conversaciones con leads
- [ ] Auto-crear leads desde nuevos números
- [ ] Logging de todas las conversaciones en MongoDB
- [ ] Actividades automáticas cuando se envía/recibe mensaje
- [ ] Dashboard de métricas de uso

**Deliverables**:
- Conversaciones sincronizadas con CRM
- Leads creados automáticamente
- Métricas disponibles en dashboard

### FASE 3: Frontend UI (Semanas 5-6)

#### Sprint 3.1: Chat Interface
- [ ] Componente de chat en tiempo real (WebSocket)
- [ ] Lista de conversaciones izquierda
- [ ] Panel de chat derecho
- [ ] Input de mensaje con attachments
- [ ] Indicadores de enviado/leído/entregado
- [ ] Search en conversaciones

**Deliverables**:
- UI de chat funcional
- WebSocket para real-time
- Search implementado

#### Sprint 3.2: WhatsApp Settings
- [ ] Página de configuración WhatsApp por broker
- [ ] Flujo de vinculación con QR
- [ ] Desconexión de sesión
- [ ] Notificaciones de sesión caída
- [ ] Plantillas de respuestas rápidas
- [ ] Integración con AI Agents existente

**Deliverables**:
- Settings page completa
- Flujo de QR funcional
- Plantillas configurables

### FASE 4: Advanced Features (Semanas 7-8)

#### Sprint 4.1: Media & Templates
- [ ] Soporte para imágenes, videos, documentos
- [ ] Galería de media compartida
- [ ] Sistema de plantillas de mensajes
- [ ] Variables dinámicas en plantillas ({{nombre}}, {{propiedad}})
- [ ] Vista previa de plantillas

**Deliverables**:
- Media sharing funcional
- Template system completo
- Variables dinámicas trabajando

#### Sprint 4.2: Analytics & Compliance
- [ ] Dashboard de analytics WhatsApp
- [ ] Métricas: response time, messages sent, leads generated
- [ ] Rate limiting dashboard
- [ ] Alerts de接近 límites
- [ ] Compliance reports
- [ ] Audit logs

**Deliverables**:
- Analytics dashboard completo
- Sistema de alertas
- Audit logs funcionales

### FASE 5: Launch Preparation (Semana 9)

#### Sprint 5.1: Testing & QA
- [ ] End-to-end testing completo
- [ ] Load testing (100+ sesiones simultáneas)
- [ ] Security audit
- [ ] Compliance check (WhatsApp ToS)
- [ ] Performance optimization
- [ ] Bug bash con equipo interno

**Deliverables**:
- Todos los tests pasando
- Performance benchmark completo
- Security audit limpio

#### Sprint 5.2: Documentation & Training
- [ ] Documentación técnica completa
- [ ] User manual para brókers
- [ ] Video tutorial de vinculación
- [ ] FAQ de troubleshooting
- [ ] Training materials para soporte
- [ ] Runbook de incidentes

**Deliverables**:
- Documentación completa publicada
- Training materials listos
- Runbook documentado

---

## Especificación Técnica Detallada

### WhatsApp Gateway Service

#### Estructura de Directorios

```
whatsapp-gateway/
├── src/
│   ├── index.ts              # Entry point
│   ├── config/
│   │   └── index.ts          # Configuración (puertos, Redis, etc)
│   ├── services/
│   │   ├── SessionManager.ts # Manejo de sesiones WhatsApp
│   │   ├── MessageQueue.ts   # Cola de mensajes salientes
│   │   └── RateLimiter.ts    # Rate limiting por sesión
│   ├── controllers/
│   │   ├── SessionController.ts
│   │   └── MessageController.ts
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   └── utils/
│       ├── logger.ts         # Winston logger
│       └── errors.ts         # Custom errors
├── tests/
│   ├── session.test.ts
│   └── message.test.ts
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

#### Session Manager (TypeScript)

```typescript
// src/services/SessionManager.ts

import { Client, ClientEvents } from '@open-wa/wa-automate';
import { EventEmitter } from 'events';

export interface SessionConfig {
  id: string;
  userId: string;
  tenantId: string;
  webhookUrl: string;
}

export class SessionManager extends EventEmitter {
  private sessions: Map<string, Client> = new Map();

  async createSession(config: SessionConfig): Promise<string> {
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: config.id
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    // Event handlers
    client.on('qr', (qr) => {
      this.emit('qr', { sessionId: config.id, qr });
    });

    client.on('ready', () => {
      this.emit('ready', { sessionId: config.id });
    });

    client.on('message', async (message) => {
      await this.handleMessage(config, message);
    });

    client.on('disconnected', (reason) => {
      this.emit('disconnected', { sessionId: config.id, reason });
      this.sessions.delete(config.id);
    });

    await client.initialize();
    this.sessions.set(config.id, client);

    return config.id;
  }

  async sendMessage(sessionId: string, chatId: string, content: string): Promise<void> {
    const client = this.sessions.get(sessionId);
    if (!client) {
      throw new Error(`Session ${sessionId} not found`);
    }

    await client.sendText(chatId, content);
  }

  getSessionStatus(sessionId: string): string {
    const client = this.sessions.get(sessionId);
    if (!client) return 'not_found';
    return client.isReady ? 'ready' : 'initializing';
  }

  async closeSession(sessionId: string): Promise<void> {
    const client = this.sessions.get(sessionId);
    if (client) {
      await client.destroy();
      this.sessions.delete(sessionId);
    }
  }

  private async handleMessage(config: SessionConfig, message: any) {
    // Forward to Rovi backend via webhook
    try {
      await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: config.id,
          from: message.from,
          to: message.to,
          content: message.body,
          timestamp: message.timestamp,
          type: message.type
        })
      });
    } catch (error) {
      console.error('Error forwarding webhook:', error);
    }
  }
}
```

#### API Endpoints

```typescript
// src/controllers/SessionController.ts

import { Request, Response } from 'express';
import { SessionManager } from '../services/SessionManager';

export class SessionController {
  constructor(private sessionManager: SessionManager) {}

  async createSession(req: Request, res: Response): Promise<void> {
    const { userId, tenantId } = req.body;
    const sessionId = `session_${userId}_${tenantId}`;

    try {
      await this.sessionManager.createSession({
        id: sessionId,
        userId,
        tenantId,
        webhookUrl: `${process.env.ROVI_BACKEND_URL}/api/whatsapp/webhook`
      });

      res.json({
        success: true,
        sessionId,
        message: 'Session created. QR code will be emitted.'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getSessionQR(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    // QR is emitted via WebSocket or polling
    res.json({
      sessionId: id,
      qr: 'Wait for QR event...',
      status: this.sessionManager.getSessionStatus(id)
    });
  }

  async sendMessage(req: Request, res: Response): Promise<void> {
    const { sessionId } = req.params;
    const { chatId, content } = req.body;

    try {
      await this.sessionManager.sendMessage(sessionId, chatId, content);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async closeSession(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    await this.sessionManager.closeSession(id);
    res.json({ success: true });
  }
}
```

---

### Backend Service Layer (Python)

#### Estructura de Archivos

```
backend/
├── whatsapp_service.py          # Nuevo: WhatsApp service layer
├── whatsapp_models.py           # Nuevo: Pydantic models
├── whatsapp_websocket.py        # Nuevo: WebSocket handler
```

#### whatsapp_service.py

```python
# backend/whatsapp_service.py

import httpx
from typing import Optional, List
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

WHATSAPP_GATEWAY_URL = "http://localhost:3000"  # Configurable via env

class WhatsAppService:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)

    async def create_session(
        self,
        user_id: str,
        tenant_id: str
    ) -> dict:
        """Crear nueva sesión WhatsApp para un broker"""
        response = await self.client.post(
            f"{WHATSAPP_GATEWAY_URL}/sessions/create",
            json={
                "userId": user_id,
                "tenantId": tenant_id
            }
        )
        response.raise_for_status()
        return response.json()

    async def get_session_status(self, session_id: str) -> dict:
        """Obtener estatus de una sesión"""
        response = await self.client.get(
            f"{WHATSAPP_GATEWAY_URL}/sessions/{session_id}/status"
        )
        response.raise_for_status()
        return response.json()

    async def send_message(
        self,
        session_id: str,
        chat_id: str,
        content: str,
        message_type: str = "text"
    ) -> dict:
        """Enviar mensaje a través de una sesión"""
        response = await self.client.post(
            f"{WHATSAPP_GATEWAY_URL}/sessions/{session_id}/send",
            json={
                "chatId": chat_id,
                "content": content,
                "type": message_type
            }
        )
        response.raise_for_status()
        return response.json()

    async def close_session(self, session_id: str) -> dict:
        """Cerrar/remover una sesión"""
        response = await self.client.delete(
            f"{WHATSAPP_GATEWAY_URL}/sessions/{session_id}"
        )
        response.raise_for_status()
        return response.json()

    async def get_chats(self, session_id: str) -> List[dict]:
        """Obtener lista de chats de una sesión"""
        response = await self.client.get(
            f"{WHATSAPP_GATEWAY_URL}/sessions/{session_id}/chats"
        )
        response.raise_for_status()
        return response.json()

whatsapp_service = WhatsAppService()
```

#### whatsapp_models.py

```python
# backend/whatsapp_models.py

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class WhatsAppSession(BaseModel):
    id: str = Field(default_factory=lambda: f"wa_{uuid.uuid4().hex[:8]}")
    user_id: str
    tenant_id: str
    phone_number: Optional[str] = None  # Linked WhatsApp number
    status: str = "initializing"  # initializing, qr_ready, connected, disconnected
    gateway_session_id: str
    qr_code: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_active: Optional[datetime] = None
    is_active: bool = True

class WhatsAppMessage(BaseModel):
    id: str = Field(default_factory=lambda: f"wam_{uuid.uuid4().hex[:12]}")
    session_id: str
    direction: str  # inbound or outbound
    chat_id: str
    phone_number: str
    contact_name: Optional[str] = None
    content: str
    message_type: str = "text"  # text, image, video, document
    media_url: Optional[str] = None

    # Timestamps
    sent_at: datetime
    received_at: Optional[datetime] = None
    read_at: Optional[datetime] = None

    # CRM Integration
    lead_id: Optional[str] = None
    activity_id: Optional[str] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WhatsAppTemplate(BaseModel):
    id: str = Field(default_factory=lambda: f"wat_{uuid.uuid4().hex[:8]}")
    tenant_id: str
    user_id: Optional[str] = None  # null = global template
    name: str
    content: str
    variables: List[str] = []  # e.g., ["{{nombre}}", "{{propiedad}}"]
    category: str = "general"  # general, first_contact, followup, etc
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
```

#### Endpoints API

```python
# backend/server.py - Agregar router

whatsapp_router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])

@whatsapp_router.post("/sessions/create")
async def create_whatsapp_session(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Crear nueva sesión WhatsApp para el broker actual"""
    user_id = current_user.get("user_id")
    tenant_id = current_user.get("tenant_id")

    # Verificar que no tenga sesión activa
    existing = await db.whatsapp_sessions.find_one({
        "user_id": user_id,
        "tenant_id": tenant_id,
        "is_active": True
    })

    if existing and existing["status"] == "connected":
        raise HTTPException(
            status_code=400,
            detail="Ya tienes una sesión WhatsApp activa"
        )

    # Crear sesión en Gateway
    gateway_response = await whatsapp_service.create_session(user_id, tenant_id)
    gateway_session_id = gateway_response["sessionId"]

    # Guardar en DB
    session = WhatsAppSession(
        user_id=user_id,
        tenant_id=tenant_id,
        gateway_session_id=gateway_session_id,
        status="initializing"
    )

    await db.whatsapp_sessions.insert_one(session.dict())

    return {
        "success": True,
        "session_id": session.id,
        "gateway_session_id": gateway_session_id,
        "status": "initializing",
        "instructions": "Espera el evento QR para escanear"
    }

@whatsapp_router.get("/sessions/{session_id}/qr")
async def get_whatsapp_qr(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Obtener QR code para vinculación"""
    session = await db.whatsapp_sessions.find_one({"id": session_id})

    if not session or session["user_id"] != current_user.get("user_id"):
        raise HTTPException(status_code=404, detail="Session not found")

    # Obtener QR del Gateway
    qr_response = await whatsapp_service.get_session_status(session["gateway_session_id"])

    # Actualizar QR en DB si está disponible
    if qr_response.get("qr"):
        await db.whatsapp_sessions.update_one(
            {"id": session_id},
            {"$set": {"qr_code": qr_response["qr"], "status": "qr_ready"}}
        )

    return {
        "session_id": session_id,
        "qr_code": session.get("qr_code") or qr_response.get("qr"),
        "status": session.get("status"),
        "instructions": [
            "1. Abre WhatsApp en tu teléfono",
            "2. Ve a Menú → Dispositivos vinculados",
            "3. Escanea el QR code",
            "4. Espera confirmación de conexión"
        ]
    }

@whatsapp_router.post("/sessions/{session_id}/send")
async def send_whatsapp_message(
    session_id: str,
    request: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Enviar mensaje WhatsApp"""
    session = await db.whatsapp_sessions.find_one({"id": session_id})

    if not session or session["status"] != "connected":
        raise HTTPException(status_code=400, detail="Session not connected")

    chat_id = request.get("chat_id")  # Format: 5219988776655@c.us
    content = request.get("content")

    # Enviar al Gateway
    result = await whatsapp_service.send_message(
        session["gateway_session_id"],
        chat_id,
        content
    )

    # Guardar mensaje en DB
    message = WhatsAppMessage(
        session_id=session_id,
        direction="outbound",
        chat_id=chat_id,
        phone_number=chat_id.split("@")[0],
        content=content,
        sent_at=datetime.now(timezone.utc)
    )

    await db.whatsapp_messages.insert_one(message.dict())

    # Crear actividad en CRM
    await db.activities.insert_one({
        "id": f"act_{uuid.uuid4().hex[:8]}",
        "user_id": session["user_id"],
        "tenant_id": session["tenant_id"],
        "type": "whatsapp_message",
        "description": f"WhatsApp enviado: {content[:50]}...",
        "related_lead_id": message.get("lead_id"),
        "created_at": datetime.now(timezone.utc)
    })

    return {"success": True, "message_id": message.id}

@whatsapp_router.post("/webhook")
async def whatsapp_webhook(
    payload: dict,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Recibir mensajes entrantes desde Gateway"""
    session_id = payload.get("sessionId")
    from_number = payload.get("from")  # Format: 5219988776655@c.us
    content = payload.get("content")
    timestamp = payload.get("timestamp")

    # Buscar sesión correspondiente
    session = await db.whatsapp_sessions.find_one({
        "gateway_session_id": session_id
    })

    if not session:
        return {"success": False, "error": "Session not found"}

    phone_number = from_number.split("@")[0]

    # Buscar lead existente con este teléfono
    lead = await db.leads.find_one({
        "tenant_id": session["tenant_id"],
        "$or": [
            {"phone": phone_number},
            {"whatsapp": phone_number}
        ]
    })

    lead_id = lead.get("id") if lead else None

    # Crear mensaje
    message = WhatsAppMessage(
        session_id=session["id"],
        direction="inbound",
        chat_id=from_number,
        phone_number=phone_number,
        content=content,
        sent_at=datetime.fromtimestamp(timestamp, tz=timezone.utc),
        lead_id=lead_id
    )

    await db.whatsapp_messages.insert_one(message.dict())

    # Si no hay lead, crear uno automáticamente
    if not lead:
        new_lead = Lead(
            tenant_id=session["tenant_id"],
            user_id=session["user_id"],
            name=f"WhatsApp Contact ({phone_number[-4:]})",
            phone=phone_number,
            whatsapp=phone_number,
            status="nuevo",
            source="WhatsApp"
        )

        await db.leads.insert_one(new_lead.dict())

        # Vincular mensaje
        await db.whatsapp_messages.update_one(
            {"id": message.id},
            {"$set": {"lead_id": new_lead.id}}
        )

    # Crear actividad
    await db.activities.insert_one({
        "id": f"act_{uuid.uuid4().hex[:8]}",
        "user_id": session["user_id"],
        "tenant_id": session["tenant_id"],
        "type": "whatsapp_message",
        "description": f"WhatsApp recibido: {content[:50]}...",
        "related_lead_id": lead_id or new_lead.id,
        "created_at": datetime.now(timezone.utc)
    })

    return {"success": True}

# Agregar router a app
app.include_router(whatsapp_router)
```

---

### Frontend WhatsApp Module

#### Estructura de Archivos

```
frontend/src/
├── pages/
│   ├── RoviWhatsAppPage.js         # Nuevo: Main WhatsApp page
│   └── RoviWhatsAppSettingsPage.js # Nuevo: Settings & QR linking
├── components/
│   ├── whatsapp/
│   │   ├── ChatInterface.js        # Chat UI component
│   │   ├── ConversationList.js    # Left sidebar
│   │   ├── MessageBubble.js        # Message component
│   │   ├── QRModal.js              # QR scanning modal
│   │   └── TemplatePicker.js      # Quick replies
└── hooks/
    └── useWhatsApp.js              # Custom hook for WhatsApp API
```

#### RoviWhatsAppPage.js

```javascript
// frontend/src/pages/RoviWhatsAppPage.js

import React, { useState, useEffect } from 'react';
import { MessageSquare, Phone, Settings, Link2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChatInterface from '../components/whatsapp/ChatInterface';
import ConversationList from '../components/whatsapp/ConversationList';
import QRModal from '../components/whatsapp/QRModal';
import { useToast } from '../hooks/use-toast';

export default function RoviWhatsAppPage() {
  const { api } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    fetchSessionStatus();
  }, []);

  const fetchSessionStatus = async () => {
    try {
      const response = await api.get('/whatsapp/sessions');
      if (response.data.sessions.length > 0) {
        setSession(response.data.sessions[0]);
        if (response.data.sessions[0].status === 'connected') {
          fetchConversations(response.data.sessions[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  };

  const fetchConversations = async (sessionId) => {
    try {
      const response = await api.get(`/whatsapp/sessions/${sessionId}/chats`);
      setConversations(response.data.chats);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const createNewSession = async () => {
    try {
      const response = await api.post('/whatsapp/sessions/create');
      const newSession = response.data;

      setSession(newSession);

      if (newSession.status === 'initializing') {
        // Wait for QR
        setTimeout(() => {
          setShowQR(true);
        }, 2000);
      }

      toast({
        title: 'Sesión creada',
        description: 'Espera el código QR para vincular tu WhatsApp',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'No se pudo crear la sesión',
        variant: 'destructive',
      });
    }
  };

  const sendMessage = async (chatId, content) => {
    try {
      await api.post(`/whatsapp/sessions/${session.id}/send`, {
        chat_id: chatId,
        content: content
      });

      // Refresh conversation
      fetchConversations(session.id);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje',
        variant: 'destructive',
      });
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-semibold mb-4">Conecta tu WhatsApp</h2>
          <p className="text-gray-500 mb-6">
            Vincula tu WhatsApp personal para comunicarte con tus leads directamente desde Rovi
          </p>
          <button
            onClick={createNewSession}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <Link2 className="w-5 h-5 inline mr-2" />
            Vincular WhatsApp
          </button>
        </div>
      </div>
    );
  }

  if (session.status !== 'connected') {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Estado: {session.status}</h2>
          <button
            onClick={() => setShowQR(true)}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Mostrar QR Code
          </button>
        </div>
        {showQR && (
          <QRModal
            sessionId={session.id}
            onClose={() => setShowQR(false)}
            onConnected={() => {
              setShowQR(false);
              fetchSessionStatus();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Conversations */}
      <div className="w-1/3 border-r dark:border-gray-700">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="font-semibold">Conversaciones</h2>
          <button className="text-gray-500 hover:text-gray-700">
            <Settings className="w-5 h-5" />
          </button>
        </div>
        <ConversationList
          conversations={conversations}
          selected={selectedConversation}
          onSelect={setSelectedConversation}
        />
      </div>

      {/* Main - Chat Interface */}
      <div className="flex-1">
        {selectedConversation ? (
          <ChatInterface
            conversation={selectedConversation}
            sessionId={session.id}
            onSend={sendMessage}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Selecciona una conversación para comenzar</p>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQR && (
        <QRModal
          sessionId={session.id}
          onClose={() => setShowQR(false)}
          onConnected={() => {
            setShowQR(false);
            fetchSessionStatus();
          }}
        />
      )}
    </div>
  );
}
```

---

## Configuración de Deployment

### Docker Compose Update

```yaml
# docker-compose.yml - Agregar servicio

services:
  # ... servicios existentes ...

  whatsapp-gateway:
    build:
      context: ./whatsapp-gateway
      dockerfile: Dockerfile
    container_name: rovi-whatsapp-gateway
    environment:
      - NODE_ENV=production
      - PORT=3000
      - ROVI_BACKEND_URL=http://backend:8000
      - REDIS_URL=redis://redis:6379
      - LOG_LEVEL=info
    ports:
      - "3000:3000"
    depends_on:
      - backend
      - redis
    volumes:
      - whatsapp_sessions:/app/.wwebjs_auth
      - whatsapp_logs:/app/logs
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: rovi-redis
    restart: unless-stopped

volumes:
  whatsapp_sessions:
  whatsapp_logs:
```

### Environment Variables

```bash
# .env.production - Backend
WHATSAPP_GATEWAY_URL=http://whatsapp-gateway:3000
WHATSAPP_WEBHOOK_SECRET=your_secret_here
WHATSAPP_RATE_LIMIT_PER_MINUTE=30
WHATSAPP_MAX_SESSIONS_PER_TENANT=1

# .env.production - Gateway
NODE_ENV=production
PORT=3000
ROVI_BACKEND_URL=http://backend:8000
REDIS_URL=redis://redis:6379
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

---

## Testing Strategy

### Unit Tests (Gateway)

```typescript
// tests/session.test.ts

describe('SessionManager', () => {
  it('should create a new session', async () => {
    const manager = new SessionManager();
    const sessionId = await manager.createSession({
      id: 'test-session',
      userId: 'user-123',
      tenantId: 'tenant-123',
      webhookUrl: 'http://localhost/webhook'
    });

    expect(sessionId).toBe('test-session');
    expect(manager.getSessionStatus(sessionId)).toBe('initializing');
  });

  it('should send message through session', async () => {
    // Mock client
    const manager = new SessionManager();
    await manager.sendMessage('test-session', '5219988776655@c.us', 'Hello');
    // Assert message was sent
  });
});
```

### Integration Tests (Backend)

```python
# tests/test_whatsapp_integration.py

@pytest.mark.asyncio
@pytest.mark.integration
async def test_whatsapp_session_flow(base_url: str):
    """Test complete WhatsApp session flow"""
    async with httpx.AsyncClient() as client:
        # 1. Login
        login = await client.post(f"{base_url}/api/auth/login", json={
            "email": "test@broker.com",
            "password": "testpass"
        })
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Create session
        session = await client.post(
            f"{base_url}/api/whatsapp/sessions/create",
            headers=headers
        )
        assert session.status_code == 200
        session_id = session.json()["session_id"]

        # 3. Get QR
        qr = await client.get(
            f"{base_url}/api/whatsapp/sessions/{session_id}/qr",
            headers=headers
        )
        assert "qr_code" in qr.json()

        # 4. Mock webhook from Gateway
        webhook = await client.post(
            f"{base_url}/api/whatsapp/webhook",
            json={
                "sessionId": "gateway-session-id",
                "from": "5219988776655@c.us",
                "content": "Hola, me interesa una propiedad",
                "timestamp": 1641024000
            }
        )
        assert webhook.json()["success"] is True

        # 5. Verify lead was created
        leads = await client.get(
            f"{base_url}/api/leads",
            headers=headers
        )
        leads_data = leads.json()
        assert len(leads_data) > 0
```

---

## Consideraciones de Compliance

### WhatsApp Terms of Service

**Cumplimiento crítico:**
1. ✅ Usar protocolo WhatsApp Web (no modificación de app)
2. ✅ Respetar rate limits nativos
3. ✅ No automatizar spam
4. ✅ Mantener transparencia con usuarios
5. ✅ No almacenar datos sensibles sin permiso

**Prohibiciones:**
- ❌ No usar para bulk messaging sin consentimiento
- ❌ No evadir restricciones de WhatsApp
- ❌ No compartir sesiones entre usuarios
- ❌ No rebautizar el servicio como "WhatsApp oficial"

### Recomendaciones

1. **Limitación por sesión**: Una sesión WhatsApp por broker
2. **Rate limiting**: Máximo 30 mensajes/minuto por sesión
3. **Monitoreo**: Detectar patrones de spam automáticamente
4. **Educación**: Informar a brókers sobre compliance
5. **Opt-out**: Permitir desvinculación inmediata

---

## Costos Estimados

### Infraestructura Adicional

| Recurso | Costo Mensual | Notas |
|---------|---------------|-------|
| VPS Gateway (2CPU, 4GB RAM) | $20-30 USD | Por cada 50 sesiones activas |
| Redis (cache) | $5-10 USD | Opcional, para cola de mensajes |
| Almacenamiento de sesiones | $2-5 USD | Sesiones persistidas |
| Backup de logs/media | $5-10 USD | S3 o similar |
| **Total** | **~$32-55 USD** | Por 50 brokers activos |

### Escalación

- **50 brokers**: 1 VPS Gateway
- **100 brokers**: 2 VPS Gateway + load balancer
- **500+ brokers**: Kubernetes cluster con auto-scaling

---

## Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| WhatsApp bloquea número | Media | Alto | Rate limiting, monitoreo, límites diarios |
| Cambio en protocolo WA | Baja | Alto | Mantener wa-automate actualizado |
| Escalabilidad de sesiones | Media | Medio | Arquitectura microservicios, Redis |
| Pérdida de sesiones (logout) | Alta | Medio | Reconexión automática, alertas |
| Costos infraestructura | Baja | Bajo | Optimización de recursos |

---

## Próximos Pasos Inmediatos

### Esta Semana

1. **Decisiones**:
   - [ ] Aprobar uso de @open-wa/wa-automate
   - [ ] Definir presupuesto de infraestructura
   - [ ] Asignar equipo de desarrollo

2. **Setup**:
   - [ ] Crear repositorio `whatsapp-gateway/`
   - [ ] Configurar entorno de desarrollo
   - [ ] Instalar dependencias (@open-wa/wa-automate)

3. **Spike Técnico**:
   - [ ] Probar conexión básica con WhatsApp
   - [ ] Enviar/recibir primeros mensajes
   - [ ] Documentar learning

### Próximas 2 Semanas

1. **Foundation**:
   - [ ] Session Manager MVP
   - [ ] Backend endpoints básicos
   - [ ] Primer flujo end-to-end

2. **Integración**:
   - [ ] Webhook receiver
   - [ ] Vinculación con leads
   - [ ] Logging de conversaciones

---

## Recursos y Referencias

### Oficiales

- **@open-wa/wa-automate**: https://github.com/open-wa/wa-automate-nodejs
- **Documentación**: https://openwa.dev/
- **WhatsApp Web Protocol**: Reverse engineering (no oficial)

### Comunidad

- **Discord**: https://discord.gg/KRfSKDeW
- **Ejemplos**: https://github.com/open-wa/wa-automate-nodejs-examples

### Alternativas Consideradas

- **Baileys**: Más ligero, menos maduro
- **whatsapp-web.js**: Similar a wa-automate, menos activo
- **Twilio API**: Costoso ($0.005/msg), pero oficial y robusto

---

**Documento creado**: 2026-01-06
**Versión**: 1.0
**Autor**: Rovi Tech Team
**Estado**: Draft para revisión
