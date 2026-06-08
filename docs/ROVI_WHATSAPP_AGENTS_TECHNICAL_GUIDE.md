# Rovi WhatsApp Agents - Guía Técnica de Implementación

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                           WhatsApp Personal                          │
│                         (del broker/usuario)                          │
└─────────────────────────────────────────┬─────────────────────────────┘
                                          │ Hermes Gateway
                                          │ (Webhook + Sessions)
┌─────────────────────────────────────────┴─────────────────────────────┐
│                        Hermes Bridge Layer                           │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────────┐  │
│  │ Profile     │  │ Link Codes   │  │ Phone Matching              │  │
│  │ Manager     │  │ Validator    │  │ & Normalization             │  │
│  └─────────────┘  └──────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────┬─────────────────────────────┘
                                          │ API Calls
┌─────────────────────────────────────────┴─────────────────────────────┐
│                         Rovi Backend (FastAPI)                        │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                     Agent Control Layer                           │ │
│  │  ┌────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │ │
│  │  │ Router     │  │ Role Scope   │  │ Specialist Agents        │ │ │
│  │  │ (/agents/*)│  │ Resolver     │  │ Catalog                   │ │ │
│  │  └────────────┘  └──────────────┘  └──────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                      AI Service Layer                             │ │
│  │  ┌────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │ │
│  │  │ LLM Chat   │  │ Prompt       │  │ Context Builder           │ │ │
│  │  │ Handler    │  │ Templates    │  │ (DB + Knowledge)          │ │ │
│  │  └────────────┘  └──────────────┘  └──────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                     Data Access Layer                             │ │
│  │  ┌────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │ │
│  │  │ MongoDB     │  │ Lead CRUD    │  │ Campaign Manager         │ │ │
│  │  │ Connection │  │ Operations    │  │                          │ │ │
│  │  └────────────┘  └──────────────┘  └──────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```

## 1. Extensión del Catálogo de Agentes

### Ubicación: `backend/agent_control.py`

```python
# Agregar después de la línea 198 (SPECIALIST_AGENT_CATALOG)

WHATSAPP_AGENT_CATALOG = [
    {
        "id": "ai_receptionist",
        "label": "AI Receptionist",
        "description": "Recepcionista virtual inmobiliaria - gestiona mensajes, "
                      "proporciona información de propiedades, agenda citas y "
                      "actualiza el CRM automáticamente.",
        "user_prompt": """Actúa como recepcionista virtual inmobiliaria de ROVI.

CONTEXT:
- Eres el primer punto de contacto con clientes interesados en propiedades
- Tienes acceso al marketplace de propiedades disponibles
- Puedes agendar visitas automáticamente en el calendario del broker
- Cada interacción se registra en el CRM para seguimiento

RESPONSIBILITIES:
1. Saludar siempre de manera cálida y profesional
2. Recopilar información básica: nombre, teléfono, presupuesto, zona de interés
3. Presentar 2-3 propiedades que coincidan con el perfil
4. Detectar nivel de interés (bajo/medio/alto) durante la conversación
5. Proponer agendar visita cuando haya interés genuino
6. Crear/actualizar lead en CRM con toda la información recopilada

CONSTRAINTS:
- Nunca prometer disponibilidad sin verificar en el sistema
- No dar precios exactos sin confirmar vigencia
- Si no conoces la respuesta, ofrece conectar con un broker humano
- Horario de atención: 9am-9pm, fuera de este horario responder siguiente día hábil

TONE:
- Profesional pero cercano
- Proactivo en ofrecer alternativas
- Siempre orientado a agendar siguiente paso (visita, llamada, etc.)

ESCALATION:
- Escalar a humano cuando el cliente solicite explícitamente hablar con broker
- Escalar cuando detectes una situación urgent (compra inmediata, presupuesto alto)
""",
        "tools": {
            "list_leads": True,
            "create_lead": True,
            "update_lead": True,
            "marketplace_search": True,
            "calendar_availability": True,
            "calendar_create": True,
        },
        "tier_access": ["free", "starter", "pro", "business", "enterprise"],
    },
    {
        "id": "ai_lead_qualifier",
        "label": "AI Lead Qualifier",
        "description": "Especialista en calificación de leads - analiza intención de compra, "
                      "presupuesto, timeline y determina next action óptimo.",
        "user_prompt": """Actúa como calificador senior de leads inmobiliarios.

OBJECTIVE:
Determinar la calidad y probabilidad de conversión de cada lead mediante 
análisis estructurado de su perfil, presupuesto y timeline.

QUALIFICATION FRAMEWORK:
1. BUDGET ANALYSIS (40% weight)
   - Presupuesto declarado vs. propiedades vistas
   - Verificación de capacidad financiera (pre-aprobación)
   - Ajuste de expectativas de precio vs. mercado

2. TIMLINE ASSESSMENT (30% weight)
   - Urgencia de compra (inmediata/1-3m/3-6m/6+m)
   - Etapa del proceso (exploración/cotización/decisión)
   - Identificación de milestones faltantes

3. NEED CLARITY (20% weight)
   - Definición de requisitos vs. deseos
   - Flexibilidad en criterios de búsqueda
   - Compromiso con decisión de compra

4. ENGAGEMENT LEVEL (10% weight)
   - Responsiveness a comunicaciones
   - Acciones tomadas (visitas agendadas, documentos enviados)
   - Propuesta de next steps

OUTPUT STRUCTURE (siempre incluir en CRM):
{
    "qualification_score": 0-100,
    "buyer_stage": "discovery|consideration|decision|closed",
    "budget_verified": true|false|partial,
    "budget_estimate": MXN amount,
    "timeline_weeks": number,
    "timeline_confidence": "high|medium|low",
    "next_action": "specific actionable step",
    "next_action_deadline": "date",
    "red_flags": ["list any concerns"],
    "deal_breakers": ["list any show-stoppers"],
    "recommended_approach": "strategy for this lead"
}

QUALIFICATION QUESTIONS (ask systematically):
- ¿Qué te motivó a buscar propiedad ahora?
- ¿Ya tienes pre-aprobación o cómo financiarás?
- ¿Qué es NO negociable en tu búsqueda?
- ¿Quién más está involucrado en la decisión?
- ¿Qué propiedades has visto y qué no te gustaron?

TONE:
- Directo y estratégico
- Consultivo, no interrogatorio
- Orientado a descubrir realidad vs. declarado

ESCALATION:
- Calificación score > 85: Escalar a broker senior como "hot lead"
- Presupuesto > $5M MXN: Escalar a director comercial
- Deal breaker detectado: Marcar como "requiere revisión manual"
""",
        "tools": {
            "analyze_lead": True,
            "update_lead": True,
            "create_activity": True,
            "broker_assignment": True,
        },
        "tier_access": ["starter", "pro", "business", "enterprise"],
    },
    {
        "id": "ai_sales_followup",
        "label": "AI Sales Follow Up",
        "description": "Especialista en nurturing y seguimiento - mantiene el pipeline "
                      "activo con secuencias personalizadas y re-engagement de leads fríos.",
        "user_prompt": """Actúa como especialista en seguimiento de ventas y nurturing.

OBJECTIVE:
Maximizar conversión de leads en pipeline mediante seguimiento estratégico,
personalizado y persistente sin ser invasivo.

FOLLOW-UP PHILOSOPHY:
- Valor en cada mensaje (no solo "¿sigues interesado?")
- Personalización basada en interacciones previas
- Detección de señales de interés/desinterés
- Respeto cuando el lead indica no estar interesado

SEQUENCE TEMPLATES (adaptar por lead stage):

NEW LEAD (Days 1-14):
  D1: Thank you + value prop + CTA blando
  D3: Question de descubrimiento adicional
  D7: Nueva propiedad similar a interés
  D14: Invitación a contenido de valor (webinar, guía)

CONSIDERATION (Days 15-45):
  Semanal: Propiedad destacada del portfolio
  Bi-mensual: Case study de cliente similar
  Mensual: Update de mercado / nuevos desarrollos

DECISION PHASE (Days 46-90):
  D2: Recordatorio beneficio de decisión oportuna
  D7: Incentivo / urgencia legítima
  D14: Last check-in antes de pausar

COLD RE-ENGAGEMENT (90+ days):
  Mensaje 1: "Hey [Nombre], vi que hace X tiempo..."
  Mensaje 2: Nuevo desarrollo en zona de interés original
  Mensaje 3: Invitation exclusive preview

DETECTION PATTERNS (interpretar signals):
POSITIVE SIGNALS:
- Respuestas con preguntas específicas
- Solicita más fotos/visitas
- Comparte personal info (timeline, presupuesto actualizado)

NEGATIVE SIGNALS:
- Respuestas mono-sílaba
- "Ya encontré" / "No me interesa"
- Ghosting después de 2+ follow-ups consecutivos

NEXT ACTIONS (siempre proponer):
- Visita a propiedad específica
- Llamada con broker senior
- Envío de documento/material
- Reunión virtual (Zoom/Google Meet)

CRM UPDATES (registrar todo):
- Cada follow-up enviado como activity
- Response categorization (positive/negative/no_response)
- Lead stage updates
- Next action scheduled

TONE:
- Persistente pero respetuoso
- Consultivo, no pushy
- Valor-driven en cada mensaje

TOOLS:
- Lead history full visibility
- Property marketplace integration
- Activity logging
- Next action scheduling
""",
        "tools": {
            "list_leads": True,
            "lead_metrics": True,
            "update_lead": True,
            "create_activity": True,
            "marketplace_search": True,
            "schedule_followup": True,
        },
        "tier_access": ["pro", "business", "enterprise"],
    },
    {
        "id": "ai_customer_support",
        "label": "AI Customer Support",
        "description": "Soporte al cliente 24/7 - resuelve dudas, problemas técnicos "
                      "y escalación a humanos cuando es necesario.",
        "user_prompt": """Actúa como especialista de soporte al cliente para ROVI CRM.

OBJECTIVE:
Resolver inquietudes y problemas del usuario de manera rápida y empática,
escalando a humanos cuando sea necesario.

SUPPORT SCOPE:
1. PLATFORM TROUBLESHOOTING
   - Login issues
   - Sync problems
   - Feature not working
   - Error messages

2. HOW-TO QUESTIONS
   - "¿Cómo creo una campaña?"
   - "¿Cómo exporto mis leads?"
   - "¿Qué significa este métrica?"
   - "¿Cómo cambio mi settings?"

3. BILLING & ACCOUNT
   - "¿Cuándo renueva mi membresía?"
   - "¿Cómo actualizo mi pago?"
   - "¿Cómo cambio mi plan?"

4. FEATURE REQUESTS
   - "¿Podrían agregar X?"
   - "Sería útil si Y"

5. COMPLAINTS
   - Problemas con plataforma
   - Malas experiencias
   - Solicitudes de reembolso

RESOLUTION APPROACH:
1. EMPATHIZE FIRST
   - "Entiendo que esto es frustrante"
   - "Lamento el inconveniente"

2. CLARIFY THE ISSUE
   - Make sure you understand the problem
   - Ask for screenshots if helpful

3. CHECK KNOWLEDGE BASE
   - Has this been solved before?
   - Is there a documented workaround?

4. PROVIDE SOLUTION
   - Step-by-step clear instructions
   - Screenshots if possible
   - Timeline for fix if applicable

5. CONFIRM RESOLUTION
   - "¿Pudiste resolver el problema?"
   - "¿Necesitas más ayuda?"

ESCALATION CRITERIA (escalar a humano cuando):
- Issue requiere backend/database access
- Situation has legal/compliance implications
- Customer explicitly requests human
- Problem unresolved after 3+ attempts
- Customer is extremely upset/angry
- Issue affects multiple users (system-wide problem)

ESCALATION PROCESS:
1. Apologize for delay/complexity
2. Explain escalation is happening
3. Provide ticket number
4. Set expectation on response time
5. Create support ticket with full context

TONE:
- Empathetic and patient
- Solution-oriented
- Clear and concise
- Never defensive

CRM INTEGRATION:
- Log all support interactions
- Categorize issue types
- Track resolution rates
- Identify recurring problems
""",
        "tools": {
            "knowledge_base": True,
            "create_ticket": True,
            "update_ticket": True,
            "user_profile_read": True,
            "escalation_matrix": True,
        },
        "tier_access": ["pro", "business", "enterprise"],
    },
    {
        "id": "ai_onboarding_specialist",
        "label": "AI Onboarding Specialist",
        "description": "Guía el onboarding de nuevos usuarios, drives adoption, "
                      "envía encuestas y trackea progreso.",
        "user_prompt": """Actúa como especialista en onboarding para nuevos usuarios de ROVI.

OBJECTIVE:
Acelerar el time-to-value de nuevos usuarios mediante guía personalizada,
celebración de milestones y detección temprana de problemas.

ONBOARDING STAGES:

STAGE 1: WELCOME (Day 0-1)
Goal: Make user feel excited and supported
Actions:
- Personalized welcome message
- Quick win guidance (first easy task)
- Set expectations on value timeline
- Offer help availability

STAGE 2: BASIC SETUP (Day 1-3)
Goal: Get core profile configured
Actions:
- Complete profile setup
- Connect WhatsApp (if applicable)
- Set up basic preferences
- First lead entered (demo or real)

STAGE 3: FIRST WIN (Day 3-7)
Goal: User achieves first success
Actions:
- First campaign created
- First follow-up sent
- First dashboard viewed
- Celebrate the milestone

STAGE 4: ADOPTION (Day 7-21)
Goal: Build habits and confidence
Actions:
- Advanced features introduction
- Weekly check-ins with tips
- Proactive problem detection
- Feature discovery prompts

STAGE 5: ADVOCACY (Day 21+)
Goal: Turn user into power user
Actions:
- Advanced workflows
- Community participation invitation
- Referral request (if delighted)
- Case study possibility

PROACTIVE CHECK-INS (automated triggers):
- No activity in 5 days → "¿Todo bien? Hay algo en lo que pueda ayudar?"
- First lead created → "¡Felicitaciones! ¿Necesitas tips para seguirlo?"
- Week 2 milestone → "¿Qué tal tu primera semana? 3 tips para acelerar..."
- Month 1 milestone → "¡Un mes con ROVI! Survey rápida para mejorar"

SURVEYS (strategic points):
- Day 3: Initial experience (NPS-10)
- Day 14: Feature satisfaction
- Day 30: Overall onboarding NPS

PROGRESS TRACKING (indicators):
- Profile completion %
- Features used (count and type)
- Leads created
- Activities logged
- Campaigns sent
- Login frequency

PROBLEM DETECTION (signals):
- No login in 7+ days → risk of churn
- Incomplete profile after 3 days → needs help
- No leads created in 14 days → engagement issue
- Support tickets created → friction point

INTERVENTIONS (when problems detected):
- Reach out proactively
- Offer specific help
- Connect with human if needed
- Track intervention outcome

TONE:
- Motivational and encouraging
- Patient with learning curve
- Celebratory of wins
- Resourceful when stuck

PERSONALIZATION FACTORS:
- Account type (individual vs agency)
- Role (broker vs admin vs manager)
- Experience level (new to CRM vs experienced)
- Goals stated (if captured)
""",
        "tools": {
            "user_profile": True,
            "onboarding_checklist": True,
            "send_survey": True,
            "create_task": True,
            "gamification": True,
        },
        "tier_access": ["pro", "business", "enterprise"],
    },
    {
        "id": "ai_hr_screener",
        "label": "AI HR Candidate Screener",
        "description": "Screening de candidatos - realiza preguntas estructuradas, "
                      "evalúa fit y recomienda next steps.",
        "user_prompt": """Actúa como reclutador especialista para ROVI y asociaciones.

OBJECTIVE:
Identificar candidatos calificados eficientemente mediante screening 
estructurado y evaluación de fit cultural/technical.

SCREENING FRAMEWORK:

1. INITIAL QUALIFICATION (Gate questions)
   - ¿Disponibilidad para trabajo tiempo completo?
   - ¿Ubicación actual o disposición a reubicarse?
   - ¿Expectativa salarial (rango)?
   - ¿Tiempo de disponibilidad para iniciar?

2. ROLE-SPECIFIC ASSESSMENT

Para BROKERS:
   - Experiencia en ventas inmobiliarias (años)
   - Portafolio actual (número de clientes activos)
   - Volumen anual de ventas (last 12 months)
   - Zonas de especialización
   - Red de contactos actual

Para ADMIN/Ops:
   - Experiencia con CRMs
   - Herramientas de gestión conocidas
   - Experiencia en procesos administrativos
   - Nivel de inglés (si aplica)
   - Experiencia en equipos remotos

Para MARKETING:
   - Experiencia con campaigns digitales
   - Canales manejados (FB/IG/Google/TikTok)
   - Herramientas usadas
   - Tamaño de budgets manejados
   - Métricas que optimiza

Para DEVELOPER:
   - Stack técnico principal
   - Experiencia con el stack de ROVI (Python, React, MongoDB)
   - Metodologías conocidas (Agile, Scrum, etc.)
   - Portfolio/GitHub links
   - Experiencia en startups

3. SOFT SKILLS EVALUATION
   - Comunicación escrita (evaluar en la conversación)
   - Problem-solving (presentar caso hipotético)
   - Trabajo en equipo
   - Autonomía vs. colaboración
   - Adaptabilidad al cambio

4. CULTURAL FIT ASSESSMENT
   - Alineación con valores ROVI
   - Motivación para unirse (qué busca)
   - Expectativas de crecimiento
   - Disposición para aprender
   - Work-life balance preferences

5. RED FLAGS DETECTION
   - Respuestas evasivas o genéricas
   - Sobre-promising sin evidencia
   - Falta de research sobre ROVI
   - Expectativas irreales
   - Mala comunicación escrita

OUTPUT FORMAT (para ATS):
{
    "candidate_id": string,
    "role_applied": string,
    "screening_score": 0-100,
    "recommendation": "proceed_interview|hold|reject",
    "strengths": ["list top 3"],
    "concerns": ["list any concerns"],
    "red_flags": ["list any showstoppers"],
    "next_step": "specific action",
    "next_step_owner": "who handles this",
    "timeline_for_next": "when to follow up",
    "salary_expectation": range or amount,
    "availability_date": date,
    "location": current location + openness to relocate,
    "notes": "key insights from conversation"
}

CANDIDATE QUESTIONS (ask strategically):
- ¿Qué sabes sobre ROVI? (evaluá research y preparation)
- ¿Por qué este rol específicamente? (motivación)
- ¿Cuéntame de un éxito reciente en tu trabajo anterior? (pride & capabilities)
- ¿Qué te desafía de este rol? (self-awareness)
- ¿En qué ambiente trabajas mejor? (fit cultural)

TONE:
- Profesional y estructurado
- Respetuoso del tiempo
- Transparente sobre proceso
- Responsive a preguntas del candidato

ATS INTEGRATION:
- Create candidate record
- Update screening status
- Log all interactions
- Schedule next steps
""",
        "tools": {
            "candidate_create": True,
            "candidate_update": True,
            "interview_schedule": True,
            "ats_workflow": True,
        },
        "tier_access": ["business", "enterprise"],
    },
    {
        "id": "ai_collections_specialist",
        "label": "AI Collections Specialist",
        "description": "Especialista en cobranza - gestiona pagos vencidos, envía "
                      "recordatorios y negocia planes de pago.",
        "user_prompt": """Actúa como especialista en cobranza para ROVI y asociaciones.

OBJECTIVE:
Maximizar recuperación de pagos manteniendo relaciones positivas 
y reputación de marca.

COLLECTIONS PHILOSOPHY:
- Firm pero siempre respetuoso
- Solution-oriented (encontrar camino al pago)
- Preserve relationship whenever possible
- Compliant with regulations and ethics

TIMING & FREQUENCY:
D-5 (5 días antes de vencer):
- Reminder amigable
- Confirmar monto y fecha
- Ofrecer anticipar con descuento

D0 (día de vencimiento):
- Notification de vencimiento
- Instrucciones de pago
- Horario de soporte para dudas

D+3 (3 días después):
- First follow-up
- ¿Hubo algún problema con el pago?
- Ofrecer alternativas

D+7:
- Second follow-up
- Urgency communication
- Plan de pago proposal

D+15:
- Final attempt antes de suspensión
- Clear consequences communicated
- Last offer for resolution

D+30:
- Suspension notice
- Recovery options still presented
- External collections escalation notice

PAYMENT PLANS (when needed):
- Dividir en 2-3 mensualidades sin interés
- Fecha de primera payment inmediata
- Commitment formalizado
- Seguimiento de cumplimiento

COMMUNICATION PRINCIPLES:
1. ALWAYS RESPECTFUL
   - No threats or harassment
   - Maintain professionalism

2. CLEAR TRANSPARENCY
   - Exact amounts owed
   - Due dates clearly stated
   - Consequences communicated

3. SOLUTION-ORIENTED
   - "¿Cómo podemos resolver esto juntos?"
   - Always offer options when possible

4. CHANNEL PREFERENCES
   - WhatsApp primary (engagement higher)
   - Email backup (documentation)
   - SMS for reminders only

5. TIMING RESPECT
   - 9am-9pm messaging
   - No Sundays (unless payment due Monday)
   - No holidays

DETECTING FINANCIAL DISTRESS (legitimate hardship):
- Client communicates inability to pay
- Reasonable explanation provided
- Willingness to pay demonstrated
- Request for payment plan

When legitimate hardship detected:
- Pause collection pressure
- Offer genuine payment plan
- Document hardship in CRM
- Set check-in reminder

ESCALATION TO EXTERNAL COLLECTIONS (last resort):
- After 60+ days past due
- Multiple attempts made
- No response to communications
- Amount justifies external cost

CRM RECORDS (maintain detailed log):
- Every interaction logged
- Payment promises tracked
- Plan agreements documented
- Next actions scheduled

TONE:
- Professional, not aggressive
- Empathetic to genuine situations
- Clear on expectations
- Solution-focused

TOOLS INTEGRATION:
- Invoice records read/write
- Payment status updates
- Communication logs
- Payment plan tracking
- Alerts for team intervention
""",
        "tools": {
            "invoice_read": True,
            "invoice_update": True,
            "payment_process": True,
            "communication_log": True,
            "escalation_alert": True,
        },
        "tier_access": ["business", "enterprise"],
    },
]

# Agregar al MEMBERSHIP_AGENT_RULES (línea ~206)
MEMBERSHIP_AGENT_RULES = {
    "free": {
        "role_agents": ["broker"],
        "specialist_agents": ["ai_receptionist"],
        "whatsapp_agents": ["ai_receptionist"],
        "skills": ["ai_receptionist"],
        "monthly_message_limit": 100,
    },
    "starter": {
        "role_agents": ["broker"],
        "specialist_agents": ["ai_receptionist", "ai_lead_qualifier"],
        "whatsapp_agents": ["ai_receptionist", "ai_lead_qualifier"],
        "skills": ["ai_receptionist", "ai_lead_qualifier"],
        "monthly_message_limit": 500,
    },
    "pro": {
        "role_agents": ["broker", "agency_admin"],
        "specialist_agents": [
            "ai_receptionist",
            "ai_lead_qualifier",
            "ai_sales_followup",
            "ai_customer_support",
        ],
        "whatsapp_agents": [
            "ai_receptionist",
            "ai_lead_qualifier",
            "ai_sales_followup",
            "ai_customer_support",
        ],
        "skills": [
            "ai_receptionist",
            "ai_lead_qualifier",
            "ai_sales_followup",
            "ai_customer_support",
        ],
        "monthly_message_limit": 2000,
    },
    "business": {
        "role_agents": ["agency_admin", "broker", "rovi_sales", "rovi_ops"],
        "specialist_agents": [
            "ai_receptionist",
            "ai_lead_qualifier",
            "ai_sales_followup",
            "ai_customer_support",
            "ai_onboarding_specialist",
            "ai_hr_screener",
            "ai_collections_specialist",
        ],
        "whatsapp_agents": [
            "ai_receptionist",
            "ai_lead_qualifier",
            "ai_sales_followup",
            "ai_customer_support",
            "ai_onboarding_specialist",
            "ai_hr_screener",
            "ai_collections_specialist",
        ],
        "skills": [
            "ai_receptionist",
            "ai_lead_qualifier",
            "ai_sales_followup",
            "ai_customer_support",
            "ai_onboarding_specialist",
            "ai_hr_screener",
            "ai_collections_specialist",
        ],
        "monthly_message_limit": 10000,
    },
    "enterprise": {
        "role_agents": ROLE_SCOPES,
        "specialist_agents": [item["id"] for item in SPECIALIST_AGENT_CATALOG + WHATSAPP_AGENT_CATALOG],
        "whatsapp_agents": [item["id"] for item in WHATSAPP_AGENT_CATALOG],
        "skills": [item["id"] for item in SKILL_CATALOG + [item for item in WHATSAPP_AGENT_CATALOG]],
        "monthly_message_limit": -1,  # Unlimited
    },
    "copim": {
        "role_agents": ["copim_council", "copim_association", "copim_member"],
        "specialist_agents": ["ai_receptionist", "ai_lead_qualifier", "ai_collections_specialist"],
        "whatsapp_agents": ["ai_receptionist", "ai_lead_qualifier", "ai_collections_specialist"],
        "skills": ["ai_receptionist", "ai_lead_qualifier", "ai_collections_specialist"],
        "monthly_message_limit": 2000,
    },
}
```

## 2. Nuevos Endpoints API

### Ubicación: `backend/server.py`

```python
# ============================================
# WHATSAPP AGENTS ROUTER
# ============================================

class WhatsAppAgentLinkRequest(BaseModel):
    agent_type: str  # ai_receptionist, ai_lead_qualifier, etc.
    channel: str = "whatsapp"

class WhatsAppAgentMessageRequest(BaseModel):
    message: str
    from_phone: str
    from_name: Optional[str] = None
    conversation_id: Optional[str] = None

class WhatsAppAgentConfigUpdate(BaseModel):
    active_agent_id: str
    is_active: bool = True
    custom_settings: Dict[str, Any] = {}

@api_router.post("/agents/whatsapp/link")
async def link_whatsapp_agent(
    request: WhatsAppAgentLinkRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    """
    Genera un link code para conectar WhatsApp personal con un agente específico.
    """
    user_id = current_user.get("user_id")
    tenant_id = current_user.get("tenant_id")
    
    # Validar que el usuario tenga acceso al agente solicitado
    user_membership = await db.tenant_memberships.find_one({
        "user_id": user_id,
        "tenant_id": tenant_id,
        "status": "active"
    })
    
    if not user_membership:
        raise HTTPException(status_code=403, detail="No active membership found")
    
    membership_tier = user_membership.get("membership_tier", "free")
    allowed_agents = MEMBERSHIP_AGENT_RULES.get(membership_tier, {}).get("whatsapp_agents", [])
    
    if request.agent_type not in allowed_agents:
        raise HTTPException(
            status_code=403,
            detail=f"Agent '{request.agent_type}' not available in {membership_tier} tier"
        )
    
    # Generar link code único
    import random
    import string
    link_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    
    # Crear registro de vinculación
    link_record = {
        "id": f"whatsapp-link-{uuid.uuid4()}",
        "user_id": user_id,
        "tenant_id": tenant_id,
        "agent_type": request.agent_type,
        "link_code": link_code,
        "channel": request.channel,
        "status": "pending",
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=24),
        "created_at": datetime.now(timezone.utc),
    }
    
    await db.whatsapp_agent_links.insert_one(link_record)
    
    # Generar URL QR y deep link
    qr_payload = f"rovi_whatsapp_agent:{link_code}"
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={quote(qr_payload)}"
    
    return {
        "link_code": link_code,
        "qr_url": qr_url,
        "deep_link": f"https://wa.me/?text=Link%20code%3A%20{link_code}",
        "expires_at": link_record["expires_at"].isoformat(),
        "instructions": [
            "1. Escanea el QR con tu WhatsApp personal",
            "2. Envía el link code que aparece",
            "3. Tu agente estará activo en 1-2 minutos",
        ]
    }

@api_router.post("/agents/whatsapp/confirm")
async def confirm_whatsapp_link(
    link_code: str,
    hermes_profile: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    """
    Confirma la vinculación desde Hermes Gateway.
    """
    # Buscar link code válido
    link_record = await db.whatsapp_agent_links.find_one({
        "link_code": link_code,
        "status": "pending",
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })
    
    if not link_record:
        raise HTTPException(status_code=404, detail="Invalid or expired link code")
    
    # Actualizar estatus
    await db.whatsapp_agent_links.update_one(
        {"id": link_record["id"]},
        {
            "$set": {
                "status": "confirmed",
                "hermes_profile": hermes_profile,
                "confirmed_at": datetime.now(timezone.utc)
            }
        }
    )
    
    # Actualizar o crear perfil de agente WhatsApp
    existing_profile = await db.whatsapp_agent_profiles.find_one({
        "user_id": link_record["user_id"],
        "tenant_id": link_record["tenant_id"]
    })
    
    if existing_profile:
        await db.whatsapp_agent_profiles.update_one(
            {"id": existing_profile["id"]},
            {
                "$set": {
                    "active_agent_id": link_record["agent_type"],
                    "hermes_profile_name": hermes_profile,
                    "connection_status": "active",
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
    else:
        new_profile = {
            "id": f"whatsapp-profile-{uuid.uuid4()}",
            "user_id": link_record["user_id"],
            "tenant_id": link_record["tenant_id"],
            "active_agent_id": link_record["agent_type"],
            "configured_profiles": [link_record["agent_type"]],
            "hermes_profile_name": hermes_profile,
            "link_code": link_code,
            "connection_status": "active",
            "messages_sent": 0,
            "messages_received": 0,
            "leads_generated": 0,
            "appointments_scheduled": 0,
            "monthly_message_count": 0,
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        await db.whatsapp_agent_profiles.insert_one(new_profile)
    
    return {
        "success": True,
        "agent_type": link_record["agent_type"],
        "hermes_profile": hermes_profile,
        "message": "WhatsApp agent successfully linked"
    }

@api_router.get("/agents/whatsapp/status")
async def get_whatsapp_agent_status(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    """
    Obtiene el estatus de conexión del agente WhatsApp del usuario.
    """
    user_id = current_user.get("user_id")
    tenant_id = current_user.get("tenant_id")
    
    profile = await db.whatsapp_agent_profiles.find_one({
        "user_id": user_id,
        "tenant_id": tenant_id,
        "is_active": True
    })
    
    if not profile:
        return {
            "connected": False,
            "active_agent": None,
            "message": "No WhatsApp agent linked yet"
        }
    
    # Calcular mensajes restantes del mes
    membership = await db.tenant_memberships.find_one({
        "user_id": user_id,
        "tenant_id": tenant_id,
        "status": "active"
    })
    
    membership_tier = membership.get("membership_tier", "free") if membership else "free"
    limit = MEMBERSHIP_AGENT_RULES.get(membership_tier, {}).get("monthly_message_limit", 100)
    used = profile.get("monthly_message_count", 0)
    remaining = (limit - used) if limit > 0 else float("inf")
    
    return {
        "connected": True,
        "active_agent": profile.get("active_agent_id"),
        "connection_status": profile.get("connection_status"),
        "hermes_profile": profile.get("hermes_profile_name"),
        "metrics": {
            "messages_sent": profile.get("messages_sent", 0),
            "messages_received": profile.get("messages_received", 0),
            "leads_generated": profile.get("leads_generated", 0),
            "appointments_scheduled": profile.get("appointments_scheduled", 0),
        },
        "limits": {
            "monthly_limit": limit,
            "monthly_used": used,
            "monthly_remaining": remaining,
        }
    }

@api_router.put("/agents/whatsapp/active")
async def switch_whatsapp_agent(
    request: WhatsAppAgentConfigUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    """
    Cambia el agente activo de WhatsApp del usuario.
    """
    user_id = current_user.get("user_id")
    tenant_id = current_user.get("tenant_id")
    
    # Validar acceso
    profile = await db.whatsapp_agent_profiles.find_one({
        "user_id": user_id,
        "tenant_id": tenant_id
    })
    
    if not profile:
        raise HTTPException(status_code=404, detail="No WhatsApp profile found")
    
    # Verificar que el agente esté en configured_profiles
    if request.active_agent_id not in profile.get("configured_profiles", []):
        raise HTTPException(
            status_code=403,
            detail=f"Agent '{request.active_agent_id}' not configured for this user"
        )
    
    # Actualizar agente activo
    await db.whatsapp_agent_profiles.update_one(
        {"id": profile["id"]},
        {
            "$set": {
                "active_agent_id": request.active_agent_id,
                "is_active": request.is_active,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {
        "success": True,
        "active_agent": request.active_agent_id,
        "is_active": request.is_active
    }

@api_router.post("/agents/whatsapp/message")
async def process_whatsapp_agent_message(
    request: WhatsAppAgentMessageRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    """
    Procesa un mensaje de WhatsApp a través del agente activo.
    Llamado por Hermes Gateway webhook.
    """
    # Identificar usuario por teléfono
    phone_normalized = normalize_phone_for_match(request.from_phone)
    
    profile = await db.whatsapp_agent_profiles.find_one({
        "connection_status": "active",
        "$or": [
            {"phone_linked": phone_normalized},
            {"phone_linked": request.from_phone}
        ]
    })
    
    if not profile:
        raise HTTPException(status_code=404, detail("No active agent found for this phone"))
    
    # Verificar límites
    membership = await db.tenant_memberships.find_one({
        "user_id": profile["user_id"],
        "status": "active"
    })
    
    if membership:
        membership_tier = membership.get("membership_tier", "free")
        limit = MEMBERSHIP_AGENT_RULES.get(membership_tier, {}).get("monthly_message_limit", 100)
        
        if limit > 0:
            used = profile.get("monthly_message_count", 0)
            if used >= limit:
                raise HTTPException(
                    status_code=429,
                    detail="Monthly message limit exceeded"
                )
    
    # Obtener configuración del agente
    agent_type = profile.get("active_agent_id")
    agent_config = await db.agent_configs.find_one({
        "role_scope": agent_type,
        "is_active": True
    })
    
    if not agent_config:
        # Usar configuración del catálogo
        agent_catalog = {item["id"]: item for item in WHATSAPP_AGENT_CATALOG}
        if agent_type not in agent_catalog:
            raise HTTPException(status_code=404, detail="Agent configuration not found")
        agent_spec = agent_catalog[agent_type]
    else:
        agent_spec = {
            "id": agent_type,
            "system_prompt": agent_config.get("system_prompt"),
            "tools": agent_config.get("tools"),
        }
    
    # Construir contexto del usuario
    user_context = {
        "user_id": profile["user_id"],
        "tenant_id": profile["tenant_id"],
        "account_type": membership.get("account_type") if membership else "individual",
        "role": membership.get("role") if membership else "broker",
    }
    
    # Ejecutar agente
    from agent_control import run_agent_turn
    
    agent_request = AgentRunRequest(
        message=request.message,
        role_scope=agent_type,
        include_context=True
    )
    
    result = await run_agent_turn(
        db=db,
        request=agent_request,
        current_user=user_context,
        forced_role_scope=agent_type,
        source="whatsapp_webhook"
    )
    
    # Actualizar métricas
    await db.whatsapp_agent_profiles.update_one(
        {"id": profile["id"]},
        {
            "$inc": {
                "messages_received": 1,
                "monthly_message_count": 1
            },
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    # Extraer acciones sugeridas del response (si el agente quiere crear lead, etc.)
    # Esto requiere parsing del response para detectar intents
    
    return {
        "success": True,
        "response": result.get("response"),
        "agent_type": agent_type,
        "actions_suggested": [],  # Se puede extender
        "conversation_id": request.conversation_id,
    }
```

## 3. Modelos de Datos

### Ubicación: `backend/models.py`

```python
# Agregar nuevos modelos al final del archivo

class WhatsAppAgentProfile(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    tenant_id: str
    
    # Agente activo
    active_agent_id: str
    configured_profiles: List[str] = []
    
    # Conexión Hermes
    hermes_profile_name: Optional[str] = None
    link_code: Optional[str] = None
    phone_linked: Optional[str] = None
    connection_status: str = "pending"  # pending, active, inactive, error
    
    # Métricas
    messages_sent: int = 0
    messages_received: int = 0
    leads_generated: int = 0
    appointments_scheduled: int = 0
    monthly_message_count: int = 0
    
    # Settings
    is_active: bool = True
    custom_settings: Dict[str, Any] = {}
    
    # Timestamps
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)
    last_message_at: Optional[datetime] = None

class WhatsAppAgentLink(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    tenant_id: str
    agent_type: str
    link_code: str
    channel: str = "whatsapp"
    status: str = "pending"  # pending, confirmed, expired, cancelled
    
    # Confirmación
    hermes_profile: Optional[str] = None
    confirmed_at: Optional[datetime] = None
    
    # Expiración
    expires_at: datetime = Field(default_factory=lambda: now_utc() + timedelta(hours=24))
    
    created_at: datetime = Field(default_factory=now_utc)

class WhatsAppAgentMessage(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    profile_id: str
    
    # Mensaje
    direction: str  # inbound, outbound
    content: str
    agent_type: str
    
    # Metadata
    conversation_id: Optional[str] = None
    phone_from: Optional[str] = None
    phone_to: Optional[str] = None
    
    # Procesamiento
    processing_time_ms: Optional[int] = None
    tokens_used: Optional[int] = None
    actions_suggested: List[str] = []
    
    # Timestamps
    created_at: datetime = Field(default_factory=now_utc)
```

## 4. Frontend - WhatsApp Agent Selector

### Ubicación: `frontend/src/pages/WhatsAppAgentsPage.js`

```javascript
import React, { useState, useEffect } from 'react';
import { Bot, Link2, MessageSquare, Settings, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';

const WHATSAPP_AGENTS = [
  {
    id: 'ai_receptionist',
    name: 'AI Receptionist',
    description: 'Gestiona mensajes, proporciona información de propiedades y agenda citas',
    icon: MessageSquare,
    tier: 'free',
  },
  {
    id: 'ai_lead_qualifier',
    name: 'AI Lead Qualifier',
    description: 'Califica leads, analiza intención y determina next actions',
    icon: TrendingUp,
    tier: 'starter',
  },
  // ... más agentes
];

export default function WhatsAppAgentsPage() {
  const { api } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState(null);
  const [linkCode, setLinkCode] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await api.get('/agents/whatsapp/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const generateLinkCode = async (agentId) => {
    try {
      const response = await api.post('/agents/whatsapp/link', {
        agent_type: agentId,
        channel: 'whatsapp'
      });
      
      setLinkCode(response.data.link_code);
      setQrUrl(response.data.qr_url);
      
      toast({
        title: 'Código generado',
        description: 'Escanea el QR con tu WhatsApp personal',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'No se pudo generar el código',
        variant: 'destructive',
      });
    }
  };

  const switchAgent = async (agentId) => {
    try {
      await api.put('/agents/whatsapp/active', {
        active_agent_id: agentId,
        is_active: true,
      });
      
      await fetchStatus();
      
      toast({
        title: 'Agente cambiado',
        description: `Tu agente activo ahora es ${agentId}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'No se pudo cambiar el agente',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Agentes WhatsApp</h1>
      
      {/* Status Card */}
      {status && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Estado de Conexión</h2>
          
          {status.connected ? (
            <div className="space-y-2">
              <p className="text-green-600">✓ Conectado como {status.active_agent}</p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-500">Mensajes enviados</p>
                  <p className="text-2xl font-bold">{status.metrics.messages_sent}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Leads generados</p>
                  <p className="text-2xl font-bold">{status.metrics.leads_generated}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No conectado. Selecciona un agente y vincula tu WhatsApp.</p>
          )}
        </div>
      )}
      
      {/* Agent Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {WHATSAPP_AGENTS.map((agent) => (
          <div
            key={agent.id}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 border-2 hover:border-primary cursor-pointer"
            onClick={() => !status?.connected && generateLinkCode(agent.id)}
          >
            <agent.icon className="w-8 h-8 mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">{agent.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{agent.description}</p>
            
            {status?.connected && status.active_agent === agent.id ? (
              <span className="text-green-600 font-semibold">Agente Activo</span>
            ) : status?.connected ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  switchAgent(agent.id);
                }}
                className="text-primary hover:underline"
              >
                Activar este agente
              </button>
            ) : (
              <span className="text-xs text-gray-400">Click para vincular</span>
            )}
          </div>
        ))}
      </div>
      
      {/* QR Modal */}
      {qrUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Vincula tu WhatsApp</h2>
            <img src={qrUrl} alt="QR Code" className="mx-auto mb-4" />
            <p className="text-center mb-2">Código de vinculación:</p>
            <p className="text-center text-2xl font-mono mb-4">{linkCode}</p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Abre WhatsApp en tu teléfono</li>
              <li>Ve a Menú → Dispositivos vinculados</li>
              <li>Escanear este QR</li>
              <li>Envía el código {linkCode} al chat que aparece</li>
            </ol>
            <button
              onClick={() => setQrUrl(null)}
              className="mt-6 w-full py-2 bg-gray-200 hover:bg-gray-300 rounded"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 5. Testing Strategy

### Unit Tests

```python
# tests/test_whatsapp_agents.py

import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_link_whatsapp_agent_unauthorized(client: AsyncClient):
    """Test that linking requires authentication"""
    response = await client.post("/api/agents/whatsapp/link", json={
        "agent_type": "ai_receptionist"
    })
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_link_whatsapp_agent_free_tier(client: AsyncClient, auth_headers):
    """Test that free tier can link receptionist"""
    response = await client.post(
        "/api/agents/whatsapp/link",
        json={"agent_type": "ai_receptionist"},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "link_code" in data
    assert "qr_url" in data

@pytest.mark.asyncio
async def test_link_whatsapp_agent_free_tier_restricted(client: AsyncClient, auth_headers):
    """Test that free tier cannot link advanced agents"""
    response = await client.post(
        "/api/agents/whatsapp/link",
        json={"agent_type": "ai_hr_screener"},
        headers=auth_headers
    )
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_process_whatsapp_message(client: AsyncClient):
    """Test message processing through agent"""
    response = await client.post("/api/agents/whatsapp/message", json={
        "message": "Hola, quiero información sobre casas en Tulum",
        "from_phone": "+5219988776655",
        "from_name": "Juan Pérez"
    })
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert len(data["response"]) > 0
```

### Integration Tests

```python
@pytest.mark.asyncio
@pytest.mark.integration
async def test_whatsapp_agent_e2e(base_url: str):
    """Test full WhatsApp agent flow"""
    import httpx
    
    async with httpx.AsyncClient() as client:
        # 1. Login
        login_response = await client.post(f"{base_url}/api/auth/login", json={
            "email": "test@example.com",
            "password": "testpass"
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Generate link code
        link_response = await client.post(
            f"{base_url}/api/agents/whatsapp/link",
            json={"agent_type": "ai_receptionist"},
            headers=headers
        )
        link_code = link_response.json()["link_code"]
        
        # 3. Simulate Hermes confirmation
        confirm_response = await client.post(
            f"{base_url}/api/agents/whatsapp/confirm",
            params={
                "link_code": link_code,
                "hermes_profile": "test-profile-123"
            }
        )
        assert confirm_response.json()["success"]
        
        # 4. Check status
        status_response = await client.get(
            f"{base_url}/api/agents/whatsapp/status",
            headers=headers
        )
        status = status_response.json()
        assert status["connected"] is True
        assert status["active_agent"] == "ai_receptionist"
```

---

## 6. Deployment Considerations

### Environment Variables

```bash
# .env.production

ROVI_HERMES_PROFILES_ROOT=/var/rovi/hermes-profiles
ROVI_TELEGRAM_BOT_USERNAME=rovi_hermes_bot
ROVI_TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
REACT_APP_BACKEND_URL=${BACKEND_URL}

# WhatsApp Agent Settings
WHATSAPP_AGENT_DEFAULT_LIMIT_FREE=100
WHATSAPP_AGENT_DEFAULT_LIMIT_STARTER=500
WHATSAPP_AGENT_DEFAULT_LIMIT_PRO=2000
WHATSAPP_AGENT_DEFAULT_LIMIT_BUSINESS=10000
```

### Docker Updates

```yaml
# docker-compose.yml (update)

services:
  backend:
    environment:
      - ROVI_HERMES_PROFILES_ROOT=/app/hermes-profiles
    volumes:
      - hermes_profiles:/app/hermes-profiles
      
  hermes-gateway:  # Nuevo servicio
    image: rovi/hermes-gateway:latest
    environment:
      - ROVI_API_BASE_URL=http://backend:8000
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
    volumes:
      - hermes_profiles:/root/.hermes/profiles
    depends_on:
      - backend

volumes:
  hermes_profiles:
```

---

## 7. Monitoring & Observability

### Metrics to Track

```python
# Agent-specific metrics
AGENT_METRICS = {
    "messages_processed": "Total messages handled by agent",
    "average_response_time": "Time to generate response (ms)",
    "resolution_rate": "% of conversations resolved without escalation",
    "escalation_rate": "% of conversations escalated to human",
    "customer_satisfaction": "NPS score after interaction",
    
    # Lead-specific
    "leads_created": "Number of leads created by agent",
    "lead_qualification_score": "Average qualification score",
    "appointment_rate": "% of conversations that resulted in appointment",
    
    # Collections-specific
    "payment_recovery_rate": "% of outstanding payments recovered",
    "payment_plan_created": "Number of payment plans negotiated",
    "time_to_payment": "Average days from first contact to payment",
}
```

### Health Checks

```python
@api_router.get("/agents/whatsapp/health")
async def whatsapp_agents_health(
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    """
    Health check for WhatsApp Agents system.
    """
    checks = {
        "database": "healthy",
        "hermes_connection": "unknown",
        "active_profiles": 0,
        "messages_last_hour": 0,
    }
    
    try:
        # Check database
        await db.command("ping")
        
        # Count active profiles
        active = await db.whatsapp_agent_profiles.count_documents({
            "connection_status": "active",
            "is_active": True
        })
        checks["active_profiles"] = active
        
        # Count messages in last hour
        hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
        messages = await db.whatsapp_agent_messages.count_documents({
            "created_at": {"$gte": hour_ago}
        })
        checks["messages_last_hour"] = messages
        
    except Exception as e:
        checks["database"] = f"unhealthy: {str(e)}"
    
    return checks
```

---

**Documento creado**: 2025-01-06
**Versión**: 1.0
**Mantenedor**: Rovi Tech Team
