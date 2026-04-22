---
id: AI-001
version: 0.0.1
status: draft
created: 2026-03-20
updated: 2026-03-20
author: @RogerVibes
priority: medium
category: docs
labels:
  - ai-assistant
  - documentation
  - existing-feature
  - openai
depends_on: []
blocks: []
related_specs:
  - SCORE-001
scope:
  packages:
    - backend/ai_service.py
    - frontend/src/components/AIChat.js
  files:
    - backend/models.py (AIProfile model)
    - backend/services/ai_profile_service.py
---

# @SPEC:AI-001: AI Assistant & Analytics - Documentación

## HISTORY

### v0.0.1 (2026-03-20)
- **INITIAL**: Documentación de AI Assistant & Analytics - Creación inicial
- **AUTHOR**: @RogerVibes
- **SCOPE**: Documentar feature existente de asistente IA personalizado (chat, análisis de leads, scripts de ventas)
- **CONTEXT**: Feature está 75% implementada pero falta documentación formal
- **REASON**: Estandarizar feature de IA para facilitar mantenimiento y futuras mejoras (multi-modalidad, coaching)

---

## Environment

### Estado Actual de la Feature

- **Completitud**: 75% implementada
- **Ubicación**: `backend/ai_service.py` (servicio), `frontend/src/components/AIChat.js` (UI)
- **Integration**: OpenAI GPT-5.2 vía `emergentintegrations` (opcional)
- **Features**:
  - ✅ Chat assistant personalizado por broker
  - ✅ Análisis de leads (intención, sentimiento, score)
  - ✅ Generación de scripts de ventas
  - ⏳ Voice interaction (planeado para Q2 2026)
  - ⏳ Image analysis (planeado para Q3 2026)

### Arquitectura del Asistente IA

```
AI Assistant System
├── Backend (FastAPI + OpenAI)
│   ├── POST /api/ai/chat (Chat con asistente)
│   ├── POST /api/ai/analyze-lead (Análisis de lead)
│   └── POST /api/ai/generate-script (Generar script de ventas)
│
├── Frontend (React)
│   ├── AI Chat Widget (Chat UI)
│   ├── Lead Analysis Panel (Resultados de análisis)
│   └── Script Generator Panel (Generación de scripts)
│
└── AI Profile (Configuración por broker)
    ├── Experiencia (años vendiendo)
    ├── Estilo (directo, amigable, formal)
    ├── Tipos de propiedades (lotes, casas)
    ├── Zonas de enfoque (La Veleta, Tulum Centro)
    └── Metas (ventas mensuales, comisiones)
```

---

## Assumptions

1. **Feature Implementada**: Código existe y está parcialmente funcionando
2. **AI Profile Opcional**: Brokers pueden configurar su asistente o usar default
3. **OpenAI Optional**: Si `EMERGENT_LLM_KEY` no está configurado, feature retorna mensaje genérico
4. **Session Context**: Asistente mantiene memoria de conversación actual (no persistente entre sesiones)

---

## Requirements

### Ubiquitous Requirements (Básicas)

- El sistema debe proveer chat assistant personalizado por broker
- El sistema debe analizar leads (intención, sentimiento, score)
- El sistema debe generar scripts de ventas personalizados
- El sistema debe adaptar respuestas según perfil del broker (AI Profile)
- El sistema debe funcionar en español mexicano

### Event-driven Requirements (WHEN-THEN)

- **WHEN** un broker envía mensaje al asistente, el sistema debe retornar respuesta personalizada
- **WHEN** se analiza un lead, el sistema debe retornar score (1-100), intención y sentimiento
- **WHEN** se solicita script de ventas, el sistema debe generar script según propiedad y lead
- **WHEN** el asistente no conoce respuesta, el sistema debe sugerir contactar al manager
- **WHEN** OpenAI API falla, el sistema debe retornar mensaje degradado "IA no disponible"

### State-driven Requirements (WHILE-THEN)

- **WHILE** el broker chatea, el sistema debe mantener contexto de conversación (últimos 10 mensajes)
- **WHILE** el asistente genera respuesta, el sistema debe mostrar estado "escribiendo..."
- **WHILE** se analiza lead, el sistema debe mostrar loader con "Analizando con IA..."

### Optional Requirements (WHERE-THEN)

- **WHERE** un broker no ha configurado su AI Profile, el sistema debe usar perfil default genérico
- **WHERE** un broker pide consejo sobre objeción difícil, el sistema puede sugerir técnicas de cierre
- **WHERE** se detecta patrón positivo (ej: broker sigue consejos y cierra venta), el sistema puede felicitar

### Constraints (IF-THEN)

- **IF** el prompt del broker contiene información sensible (ej: datos personales), el sistema debe sanitizar antes de enviar a OpenAI
- **IF** un lead no tiene suficiente información para análisis, el sistema debe retornar "Datos insuficientes"
- **IF** el broker excede límite de tokens (contexto muy largo), el sistema debe resumir conversación
- **IF** OpenAI API key no está configurada, el sistema debe funcionar en modo "degradado" (respuestas predefinidas)
- **IF** el asistente genera contenido inapropiado, el sistema debe filtrar y advertir

---

## Specifications

### @CODE:AI-001:MODEL AI Profile Model

**Ubicación**: `backend/models.py`

```python
class AIProfile(BaseModel):
    id: str  # UUID
    broker_id: str
    tenant_id: str

    # Configuración del asistente
    name: str = "Asistente LeadVibes"  # Nombre personalizado
    experience_years: int  # Años de experiencia del broker
    style: str  # "directo", "amigable", "formal", "persuasivo"
    property_types: List[str] = []  # ["lotes", "casas", "departamentos"]
    focus_zones: List[str] = []  # ["La Veleta", "Tulum Centro", "Aldea Zama"]

    # Metas
    monthly_sales_goal: int  # Meta de ventas mensuales
    average_ticket_price: int  # Ticket promedio

    # Contexto adicional
    additional_context: Optional[str]  # Información extra libre

    created_at: datetime
    updated_at: datetime
```

### @CODE:AI-001:API Endpoints

**Ubicación**: `backend/ai_service.py`

#### 1. POST `/api/ai/chat`
- **Descripción**: Chat con asistente IA personalizado
- **Body**:
  ```json
  {
    "message": "¿Cómo manejar la objeción de precio en La Veleta?",
    "conversation_history": [
      {"role": "user", "content": "Hola, tengo un lead difícil"},
      {"role": "assistant", "content": "¿En qué puedo ayudarte?"}
    ]
  }
  ```
- **Response**:
  ```json
  {
    "response": "Para manejar la objeción de precio en La Veleta, enfócate en el valor:...",
    "sources": ["Estrategias de cierre", "Market data Tulum 2026"],
    "confidence": 0.85
  }
  ```

#### 2. POST `/api/ai/analyze-lead`
- **Descripción**: Analizar lead con IA
- **Body**:
  ```json
  {
    "lead_id": "uuid",
    "lead_data": {
      "first_name": "Juan",
      "budget": 2000000,
      "source": "facebook",
      "activities": [
        {"type": "llamada", "outcome": "interesado", "notes": "Preguntó por financiamiento"}
      ]
    }
  }
  ```
- **Response**:
  ```json
  {
    "lead_id": "uuid",
    "score": 78,
    "intention": "alta",
    "sentiment": "positivo",
    "insights": [
      "Presupuesto suficiente para propiedades premium",
      "Interés genuino (preguntó por financiamiento)",
      "Fuente confiable (Facebook)"
    ],
    "recommendation": "Priorizar - Llamar en las próximas 24h",
    "next_best_action": "Enviar presentación de propiedades en La Veleta"
  }
  ```

#### 3. POST `/api/ai/generate-script`
- **Descripción**: Generar script de ventas personalizado
- **Body**:
  ```json
  {
    "property": {
      "name": "Lote 15, La Veleta",
      "price": 2500000,
      "location": "La Veleta, Tulum",
      "features": ["200m2", "Servicios", "Cercanía a playa"]
    },
    "lead": {
      "first_name": "María",
      "budget": 3000000,
      "interests": ["ubicación", "plusvalía"]
    }
  }
  ```
- **Response**:
  ```json
  {
    "script": "Hola María, soy [Nombre] de LeadVibes. Te contacto porque...",
    "talking_points": [
      "Ubicación privilegiada en La Veleta",
      "Plusvalía proyectada 15% anual",
      "Financiamiento directo disponible"
    ],
    "objection_handlers": {
      "precio": "Enfócate en valor y plusvalía futura",
      "ubicación": "Muestra mapa y cercanía a servicios"
    }
  }
  ```

#### 4. GET `/api/ai/profile`
- **Descripción**: Obtener AI Profile del broker actual
- **Response**: AIProfile completo

#### 5. PATCH `/api/ai/profile`
- **Descripción**: Actualizar AI Profile del broker
- **Body**: Campos a actualizar
- **Response**: AIProfile actualizado

---

### @CODE:AI-001:SERVICE AI Service Implementation

**Ubicación**: `backend/ai_service.py`

```python
import os
from typing import List, Dict, Any

try:
    from emergentintegrations import OpenAIService
    EMERGENT_AVAILABLE = True
except ImportError:
    EMERGENT_AVAILABLE = False

class AIService:
    def __init__(self):
        self.api_key = os.getenv("EMERGENT_LLM_KEY")
        self.client = OpenAIService(api_key=self.api_key) if EMERGENT_AVAILABLE and self.api_key else None

    async def get_ai_response(self, message: str, conversation_history: List[Dict], ai_profile: AIProfile) -> str:
        """Obtiene respuesta del asistente IA"""

        if not self.client:
            return "Lo siento, el asistente IA no está disponible en este momento."

        # Construir system prompt personalizado
        system_prompt = self._build_system_prompt(ai_profile)

        # Agregar historial de conversación
        messages = [
            {"role": "system", "content": system_prompt},
            *conversation_history,
            {"role": "user", "content": message}
        ]

        try:
            response = await self.client.chat(
                model="gpt-5.2",
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )

            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"Error calling OpenAI: {e}")
            return "Lo siento, hubo un error al procesar tu mensaje. Por favor intenta nuevamente."

    def _build_system_prompt(self, ai_profile: AIProfile) -> str:
        """Construye prompt personalizado según perfil del broker"""

        prompt = f"""
Eres un asistente de ventas experto en bienes raíces en Tulum, México.

Tu perfil:
- Experiencia: {ai_profile.experience_years} años vendiendo propiedades
- Estilo: {ai_profile.style}
- Tipos de propiedades: {', '.join(ai_profile.property_types)}
- Zonas de enfoque: {', '.join(ai_profile.focus_zones)}
- Meta: {ai_profile.monthly_sales_goal} ventas mensuales
- Ticket promedio: ${ai_profile.average_ticket_price:,} MXN

Tu rol es ayudar al broker a:
1. Manejar objeciones de clientes
2. Generar scripts de ventas personalizados
3. Analizar leads y recomendar acciones
4. Proveer consejos de cierre

Responde siempre en español mexicano, de manera {ai_profile.style}.
Usa datos reales del mercado inmobiliario de Tulum cuando sea relevante.
"""

        if ai_profile.additional_context:
            prompt += f"\n\nContexto adicional: {ai_profile.additional_context}"

        return prompt

    async def analyze_lead(self, lead_data: Dict[str, Any], activities: List[Activity]) -> Dict[str, Any]:
        """Analiza lead con IA"""

        if not self.client:
            return {
                "score": 50,
                "intention": "desconocida",
                "sentiment": "neutral",
                "insights": ["IA no disponible para análisis"],
                "recommendation": "Requiere análisis manual"
            }

        # Construir prompt de análisis
        prompt = f"""
Analiza este lead de bienes raíces y retorna un JSON con:

Datos del lead:
- Nombre: {lead_data.get('first_name')}
- Presupuesto: ${lead_data.get('budget', 0):,} MXN
- Fuente: {lead_data.get('source')}
- Ubicación de interés: {lead_data.get('location', 'No especificada')}

Actividades recientes:
{self._format_activities(activities)}

Retorna JSON con formato:
{{
  "score": 1-100,
  "intention": "alta|media|baja",
  "sentiment": "positivo|neutral|negativo",
  "insights": ["insight1", "insight2", "insight3"],
  "recommendation": "acción recomendada",
  "next_best_action": "próxima acción específica"
}}
"""

        try:
            response = await self.client.chat(
                model="gpt-5.2",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            import json
            analysis = json.loads(response.choices[0].message.content)
            return analysis

        except Exception as e:
            logger.error(f"Error analyzing lead: {e}")
            return {
                "score": 50,
                "intention": "desconocida",
                "sentiment": "neutral",
                "insights": ["Error en análisis IA"],
                "recommendation": "Requiere análisis manual"
            }
```

---

### @CODE:AI-001:UI AI Chat UI

**Ubicación**: `frontend/src/components/AIChat.js`

#### Componentes

1. **Chat Widget**
   - Input de mensaje
   - Historial de conversación (burbujas chat)
   - Indicador "escribiendo..." mientras IA genera respuesta
   - Auto-scroll al último mensaje

2. **Lead Analysis Panel**
   - Score gauge (1-100)
   - Intention badge (alta/media/baja)
   - Sentiment indicator (positivo/neutral/negativo)
   - Insights list
   - Next best action button

3. **Script Generator Panel**
   - Property selector
   - Lead selector
   - Generate button
   - Generated script (copiable)
   - Talking points list
   - Objection handlers

4. **AI Profile Settings**
   - Formulario para configurar perfil
   - Campos: Experiencia, estilo, tipos de propiedades, zonas, metas
   - Preview de system prompt generado

---

## Traceability (@TAG)

- **SPEC**: @SPEC:AI-001
- **TEST**: `backend/tests/test_ai_service.py` → @TEST:AI-001
- **CODE**:
  - `backend/ai_service.py` → @CODE:AI-001:SERVICE
  - `backend/server.py` → @CODE:AI-001:API (Endpoints de IA)
  - `backend/models.py` → @CODE:AI-001:DATA (AIProfile model)
  - `frontend/src/components/AIChat.js` → @CODE:AI-001:UI
- **DOC**: `docs/ai-assistant-guide.md` → @DOC:AI-001

---

## Acceptance Criteria

### Criterios de Aceptación

1. **Chat Assistant**: Asistente responde preguntas de brokers en <5 segundos
2. **Lead Analysis**: Sistema analiza lead y retorna score + insights
3. **Script Generation**: Sistema genera scripts personalizados según propiedad y lead
4. **AI Profile**: Brokers pueden configurar su asistente (experiencia, estilo, metas)
5. **Fallback**: Si OpenAI no está disponible, sistema funciona en modo degradado

### Definición de Done

- [x] Feature implementada (75% completada)
- [ ] Tests unitarios y de integración creados
- [ ] Documentación de AI Profile creada
- [ ] User guide para brokers creada
- [ ] Video tutorial de uso del asistente creado
- [ ] Plan de mejoras futuras (voice, image analysis) documentado
