# Rovi WhatsApp Agents - Propuesta de Implementación

## Executive Summary

Rovi ya cuenta con una infraestructura robusta de agentes IA integrada con Hermes para WhatsApp/Telegram. Este documento detalla cómo adaptar las funcionalidades existentes de Rovi para crear los perfiles de agentes solicitados, conectados al WhatsApp personal de cada broker.

## Arquitectura Actual Disponible

### Componentes Existentes
1. **Agent Control Tower** (`backend/agent_control.py`)
   - Role scopes configurables
   - Specialist agents con prompts personalizados
   - Sistema de membership tiers
   - Knowledge graph integration
   - Tools configurables por agente

2. **Hermes Bridge** (`backend/hermes_bridge.py`)
   - Integración con WhatsApp y Telegram
   - Profile provisioning automatizado
   - Link codes y QR para vinculación
   - Phone matching y normalización

3. **AI Service** (`backend/ai_service.py`)
   - Lead analysis con intención de compra
   - Script generation personalizado
   - Database querying con NLP
   - Context-aware responses

4. **Campaign System**
   - Multi-canal (WhatsApp, Email, SMS)
   - Segmentation y targeting
   - Templates y automatización

### Agentes Especialistas Actuales
- `lead_triage` - Calificación de leads
- `whatsapp_followup` - Copywriter WhatsApp
- `appointment_setter` - Agendador
- `property_matcher` - Matcher inmobiliario
- `offer_architect` - Arquitecto de ofertas
- `audience_intel` - Inteligencia de audiencia
- `fulfillment_operator` - Operador fulfillment
- `ab_test_analyst` - Analista A/B
- `revenue_ops` - Revenue Ops
- `copim_membership_ops` - Operación COPIM
- `risk_guardian` - Guardian de riesgo

---

## Perfiles de Agentes WhatsApp Solicitados

### 1. AI Receptionist 🎯

**Funcionalidades:**
- ✅ Gestión de todos los mensajes (Hermes + Agent Control)
- ✅ Proporcionar información sobre propiedades (Marketplace integration)
- ✅ Agendar citas (Appointment Setter specialist)
- ✅ Actualizar CRM (Lead status updates via API)

**Implementación:**
```python
# Agregar a SPECIALIST_AGENT_CATALOG en agent_control.py
{
    "id": "ai_receptionist",
    "label": "AI Receptionist",
    "user_prompt": """Actúa como recepcionista virtual inmobiliaria.
    
    Tareas:
    - Saludar y presentar propiedades según presupuesto y zona
    - Responder FAQs sobre ubicación, amenities, precios
    - Calificar intención de compra (alto/medio/bajo)
    - Agendar visitas cuando el cliente muestra interés
    - Registrar lead en CRM con toda la información recopilada
    
    Tono: Profesional, cálido, servicial.
    Límites: No prometer disponibilidad sin verificar. No dar precios exactos sin confirmar."""
}
```

**Endpoints Requeridos:**
- `POST /api/agents/receptionist/message` - Procesar mensaje
- `GET /api/agents/receptionist/availability` - Disponibilidad de propiedades
- `POST /api/agents/receptionist/appointment` - Agendar visita

---

### 2. AI Lead Qualifier 🔍

**Funcionalidades:**
- ✅ Gestión de mensajes (Hermes)
- ✅ Proporcionar información (Lead Analysis existente)
- ✅ Agendar citas (Appointment Setter)
- ✅ Actualizar CRM con análisis (Lead scoring)

**Implementación:**
```python
{
    "id": "ai_lead_qualifier",
    "label": "AI Lead Qualifier",
    "user_prompt": """Actúa como calificador de leads inmobiliarios.
    
    Proceso de calificación:
    1. Descubrir presupuesto real (no solo el declarado)
    2. Identificar timeline de compra (urgencia)
    3. Determinar capacidad financiera (pre-aprobación)
    4. Mapear necesidades vs deseos
    5. Detectar decision makers adicionales (cónyuge, familiares)
    6. Calificar intención de compra (0-100)
    
    Output estructurado para CRM:
    - Presupuesto_verified: estimado verificado
    - Timeline_weeks: semanas para compra
    - Buyer_stage: discovery/consideration/decision
    - Next_action: siguiente acción específica
    
    Tono: Directo, estratégico, consultivo."""
}
```

**Endpoints:**
- `POST /api/agents/qualifier/analyze` - Análisis de lead
- `POST /api/agents/qualifier/discovery` - Preguntas de descubrimiento
- `PUT /api/leads/{id}/qualification` - Guardar calificación

---

### 3. AI Sales Follow Up 📈

**Funcionalidades:**
- ✅ Enviar seguimientos (Campaign system)
- ✅ Nurturing de prospects (Lead pipeline)
- ✅ Re-engagement de leads fríos (Re-activation campaigns)
- ✅ Actualizar CRM con interacciones

**Implementación:**
```python
{
    "id": "ai_sales_followup",
    "label": "AI Sales Follow Up",
    "user_prompt": """Actúa como especialista en seguimiento de ventas inmobiliarias.
    
    Estrategias de seguimiento:
    - Día 1: Thank you + materiales adicionales
    - Día 3: Pregunta de descubrimiento adicional
    - Día 7: Nueva propiedad similar al interés
    - Día 14: Invitación a webinar/evento
    - Día 30: Re-engagement con novedades del mercado
    
    Personalización:
    - Referenciar propiedades vistas previamente
    - Adaptar mensaje a etapa del pipeline
    - Incluir CTAs claros y específicos
    - Detectar señales de desinterés para pausar
    
    Tono: Persistente sin invasivo, valor-added, consultivo."""
}
```

**Endpoints:**
- `POST /api/agents/followup/sequence` - Crear secuencia
- `POST /api/agents/followup/send` - Enviar seguimiento
- `GET /api/agents/followup/schedule` - Ver calendario

---

### 4. AI Customer Support 💬

**Funcionalidades:**
- ✅ Resolver problemas (FAQ system + Knowledge base)
- ✅ Answer FAQs (Agent knowledge chunks)
- ✅ Troubleshooting (Escalation matrix)
- ✅ Conectar con humanos (Handoff protocol)

**Implementación:**
```python
{
    "id": "ai_customer_support",
    "label": "AI Customer Support",
    "user_prompt": """Actúa como soporte al cliente para Rovi CRM.
    
    Capacidades:
    - Resolver dudas sobre plataforma (cómo usar X feature)
    - Problemas técnicos (login, sincronización, errores)
    - Dudas sobre facturación y pagos
    - Solicitudes de features mejoras
    - Quejas y reclamaciones
    
    Escalamiento a humano cuando:
    - Problema requiere acceso a backend
    - Situación legal/compliancia
    - Cliente solicita explícitamente hablar con humano
    - Problema no resuelto después de 3 interacciones
    
    Tono: Empático, resolutivo, transparente."""
}
```

**Endpoints:**
- `POST /api/agents/support/ticket` - Crear ticket
- `POST /api/agents/support/resolve` - Intentar resolución
- `POST /api/agents/support/escalate` - Escalar a humano

---

### 5. AI Onboarding Specialist 🚀

**Funcionalidades:**
- ✅ Guiar onboarding (Onboarding flow existente)
- ✅ Driving product adoption (Feature discovery)
- ✅ Enviar encuestas (Survey system)
- ✅ Track progress (Gamification integration)

**Implementación:**
```python
{
    "id": "ai_onboarding_specialist",
    "label": "AI Onboarding Specialist",
    "user_prompt": """Actúa como especialista en onboarding para ROVI CRM.
    
    Fases de onboarding:
    1. Welcome + value proposition
    2. Setup inicial (perfil, preferencias)
    3. Primer lead (demo guiada)
    4. Primera campaña (hand-holding)
    5. Primer dashboard (interpretación)
    
   Engagement:
    - Check-ins proactivos (Día 1, 3, 7, 14)
    - Celebrar milestones (primer lead, primera venta)
    - Survey NPS en puntos clave
    - Suggest next actions basadas en progreso
    
    Tono: Motivador, paciente, celebratorio."""
}
```

**Endpoints:**
- `POST /api/agents/onboarding/check-in` - Check-in proactivo
- `POST /api/agents/onboarding/survey` - Encuesta progreso
- `GET /api/agents/onboarding/progress` - Ver progreso usuario

---

### 6. AI HR Candidate Screener 👥

**Funcionalidades:**
- ✅ Screening de candidatos (Lead model adaptado)
- ✅ Preguntas estructuradas (Script generation)
- ✅ Identificar talento calificado (Scoring system)
- ✅ Actualizar ATS (CRM como ATS)

**Implementación:**
```python
{
    "id": "ai_hr_screener",
    "label": "AI HR Candidate Screener",
    "user_prompt": """Actúa como reclutador para ROVI y asociaciones.
    
    Proceso de screening:
    1. Verificar fit cultural (valores ROVI)
    2. Validar experiencia técnica requerida
    3. Evaluar comunicación escrita
    4. Detectar disponibilidad y expectativas
    5. Calificar para siguiente etapa (0-100)
    
    Preguntas estructuradas por rol:
    - Brokers: Experiencia ventas, cartera actual, zonas
    - Admin: Organización, herramientas, procesos
    - Marketing: Campaigns, metrics, creativos
    - Dev: Stack, metodologías, portfolio
    
    Output para ATS:
    - Screening_score: 0-100
    - Red_flags: [warning signals detectados]
    - Recommendation: next_step/espera/rechazo
    
    Tono: Profesional, estructurado, respetuoso."""
}
```

**Endpoints:**
- `POST /api/agents/hr/screen` - Screening de candidato
- `POST /api/agents/hr/interview` - Preguntas de entrevista
- `PUT /api/agents/hr/candidate/{id}` - Actualizar ATS

---

### 7. AI Collections Specialist 💰

**Funcionalidades:**
- ✅ Llamadas para saldos (Call integration)
- ✅ Recuperar pagos (Payment tracking)
- ✅ Enviar recordatorios (SMS/WhatsApp campaigns)
- ✅ Actualizar CRM (Invoice status)

**Implementación:**
```python
{
    "id": "ai_collections_specialist",
    "label": "AI Collections Specialist",
    "user_prompt": """Actúa como especialista en cobranza para ROVI.
    
    Estrategia de cobranza:
    - Día -5: Recordatorio amable de vencimiento
    - Día 0: Notificación de pago vencido
    - Día +3: Seguimiento con opciones de pago
    - Día +7: Intento de contacto directo
    - Día +15: Notificación de suspensión
    - Día +30: Escalamiento a gestión externa
    
    Técnicas:
    - Always respectful, never aggressive
    - Ofrecer planes de pago cuando sea posible
    - Mantener registro de所有 los contactos
    - Detectar señales de dificultad financiera real
    
    Comunicación:
    - Multicanal (WhatsApp preferido, SMS backup)
    - Horarios respetuosos (9-21h, no domingos)
    - Personalización con historial de pagos
    
    Tono: Firm pero empático, solución-oriented."""
}
```

**Endpoints:**
- `POST /api/agents/collections/remind` - Enviar recordatorio
- `POST /api/agents/collections/negotiate` - Negociar plan
- `GET /api/agents/collections/aging` - Reporte aging

---

### 8. Build Your Own 🛠️

**Funcionalidades:**
- ✅ Configuración completa de agente (Agent Control Tower)
- ✅ Prompt personalizado
- ✅ Tools específicas
- ✅ Knowledge base custom

**Implementación:**
```python
# Usar el sistema existente de AgentConfigCreate
{
    "role_scope": "custom_agent",
    "name": "Mi Agente Personalizado",
    "description": "Descripción de lo que hace",
    "system_prompt": "Prompt personalizado del usuario",
    "tools": {
        "list_leads": True,
        "lead_metrics": True,
        "write_actions": True,
        # ... otras tools
    }
}
```

---

## Integración con WhatsApp Personal

### Flujo de Conexión

```
1. Broker selecciona agente activo en Rovi UI
2. Rovi genera link code único
3. Broker escanea QR en WhatsApp (Hermes gateway)
4. Hermes valida link code con Rovi API
5. Se crea perfil Hermes con:
   - Role scope del agente seleccionado
   - Tenant ID del broker
   - Configuración de tools disponibles
6. WhatsApp personal conectado al agente activo
```

### Endpoints API Requeridos

```python
# Agentes WhatsApp
POST   /api/agents/whatsapp/link              # Generar link code
GET    /api/agents/whatsapp/qr/{code}         # QR para escanear
POST   /api/agents/whatsapp/confirm           # Confirmar vinculación
GET    /api/agents/whatsapp/status            # Estatus de conexión
PUT    /api/agents/whatsapp/active            # Cambiar agente activo

# Mensajes
POST   /api/agents/whatsapp/message           # Enviar mensaje al agente
POST   /api/agents/whatsapp/webhook           # Webhook de Hermes

# Configuración
GET    /api/agents/config                      # Ver configuración actual
PUT    /api/agents/config                      # Actualizar configuración
GET    /api/agents/catalog                    # Catálogo de agentes
```

---

## Modelo de Datos Propuesto

### Agent Profile Extension

```python
class AgentWhatsAppProfile(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    tenant_id: str
    
    # Agente activo actual
    active_agent_id: str
    active_agent_type: AgentType
    
    # Perfiles configurados
    configured_profiles: List[AgentProfileConfig]
    
    # Conexión WhatsApp
    hermes_profile_name: Optional[str]
    link_code: Optional[str]
    phone_linked: Optional[str]
    connection_status: ConnectionStatus
    
    # Métricas de uso
    messages_sent: int = 0
    messages_received: int = 0
    leads_generated: int = 0
    appointments_scheduled: int = 0
    
    # Limits por membresía
    monthly_message_limit: int
    monthly_message_count: int = 0
    
    is_active: bool = True
    created_at: datetime = Field(default_factory=now_utc)

class AgentProfileConfig(BaseModel):
    agent_type: AgentType
    system_prompt: str
    tools_enabled: Dict[str, bool]
    knowledge_base: Optional[List[str]]
    custom_rules: Optional[Dict[str, Any]]
```

---

## Ejemplos de Conversación

### AI Receptionist

```
Cliente: Hola, vi una casa en Tulum Centro, ¿cuánto cuesta?

AI Receptionist: ¡Hola! 👋 Me很高兴 ayudarte con información sobre 
propiedades en Tulum Centro. Tenemos varias opciones en esa zona 
con diferentes rangos de precio.

¿Podrías decirme:
1. ¿Tu presupuesto aproximado?
2. ¿Número de habitaciones que necesitas?
3. ¿Es para vivienda o inversión?

Con esta info te puedo compartir las opciones que mejor se ajustan 
y, si te interesan, agendar una visita para que las conozcas en persona. 🏡✨
```

### AI Lead Qualifier

```
AI Qualifier: Para ayudarte mejor, necesito entender tu timeline.

¿Cuándo estás planeando concretar tu compra?
a) Este mes (urgente, ya tengo recursos)
b) Próximos 3 meses (buscando, pero aún decidiendo)
c) 6+ meses (planeando, quiero explorar opciones)

Cliente: Probablemente en 2-3 meses, aún estoy vendiendo una propiedad

AI Qualifier: Entendido. Eso me da un timeframe importante de 2-3 meses.
Considerando que tienes una propiedad en venta, ¿ya tienes comprador 
o está en proceso de venta? Esto me ayuda a entender tu liquidez inmediata.

[Score interno: timeline_confirmed=medium, liquidity_verification_needed]
```

### AI Collections Specialist

```
AI Collections: Hola [Nombre], soy el asistente de cuentas de ROVI.

Noté que tu membresía Pro venció el 15 de mayo y aún no tenemos 
registro del pago. Quería verificarte:

1. ¿Ya realizaste el pago? (Si es así, comparte el comprobante para ubicarlo)
2. ¿Tienes alguna duda sobre el cargo?
3. ¿Necesitas agendar un plan de pago?

Tu membresía incluye: [beneficios clave]. Hablemos para encontrar 
la mejor solución y mantener tus beneficios activos. 💼

Cliente: Es que ando muy apretado, puedo pagar el próximo mes

AI Collections: Entiendo perfectamente. Puedo ofrecerte dos opciones:

OPCIÓN 1 - Pago hoy: 20% de descuento por pago anticipado
OPCIÓN 2 - Plan 30 días: Pagar en 2 mensualidades sin interés

¿Cuál te funciona mejor? Hoy confirmo y genero el link de pago 
para ti. 📲
```

---

## Plan de Implementación

### Fase 1: Foundation (Semanas 1-2)
- [ ] Extender `SPECIALIST_AGENT_CATALOG` con nuevos perfiles
- [ ] Crear endpoints `/api/agents/whatsapp/*`
- [ ] Implementar `AgentWhatsAppProfile` model
- [ ] Extender Hermes bridge con nuevos agent types

### Fase 2: Core Agents (Semanas 3-4)
- [ ] Implementar AI Receptionist completo
- [ ] Implementar AI Lead Qualifier con scoring
- [ ] Implementar AI Sales Follow Up con secuencias
- [ ] Testing con brokers beta

### Fase 3: Advanced Agents (Semanas 5-6)
- [ ] Implementar AI Customer Support
- [ ] Implementar AI Collections Specialist
- [ ] Implementar AI HR Candidate Screener
- [ ] Implementar AI Onboarding Specialist

### Fase 4: Custom Agent Builder (Semana 7)
- [ ] UI para "Build Your Own"
- [ ] Prompt editor con templates
- [ ] Tools selector
- [ ] Knowledge base uploader

### Fase 5: Integration & Polish (Semanas 8-9)
- [ ] Integración con dashboard existente
- [ ] Métricas y analytics por agente
- [ ] Rate limiting por membership tier
- [ ] Documentación completa

### Fase 6: Launch (Semana 10)
- [ ] Onboarding de brokers
- [ ] Training materials
- [ ] Support escalation flows
- [ ] Monitoreo 24/7 inicial

---

## Membership Tiers y Access

| Tier | Agentes Disponibles | Mensajes/Mes | Features |
|------|---------------------|--------------|----------|
| Free | AI Receptionist | 100 | Basic CRM updates |
| Starter | + Lead Qualifier | 500 | + Appointment scheduling |
| Pro | + Sales Follow Up, Customer Support | 2,000 | + Sequences, automation |
| Business | + Collections, HR Screener | 10,000 | + All agents, white-label |
| Enterprise | + Custom agents | Unlimited | + API access, dedicated support |

---

## Métricas de Éxito

### Por Agente
- **Response Rate**: % de mensajes que generan respuesta
- **Conversion Rate**: % de conversaciones que convierten a leads/ventas
- **Resolution Rate**: % de tickets resueltos sin escalamiento (Support)
- **Collection Rate**: % de pagos recuperados (Collections)
- **Satisfaction Score**: NPS post-interacción

### Por Broker
- **Lead Generation**: Leads creados vía agente WhatsApp
- **Time Saved**: Horas ahorradas vs. manejo manual
- **ROI**: Revenue adicional vs. costo del agente
- **Engagement**: Mensajes intercambiados por semana

---

## Próximos Pasos

1. **Validación con brokers**: Entrevistar 5-10 brokers sobre necesidades
2. **UX mockups**: Diseñar UI de selección de agente activo
3. **Technical spike**: Probar Hermes con nuevo agente Receptionist
4. **Business case**: Definir pricing y go-to-market
5. **Pilot**: Lanzar con 10 brokers seleccionados

---

## Referencias

- [Agent Control Tower Code](../backend/agent_control.py)
- [Hermes Bridge](../backend/hermes_bridge.py)
- [AI Service](../backend/ai_service.py)
- [Lead Models](../backend/models.py)
- [Frontend Agent UI](../frontend/src/pages/RoviAIControlTowerPage.js)

---

**Documento creado**: 2025-01-06
**Versión**: 1.0
**Autor**: Rovi Tech Team
