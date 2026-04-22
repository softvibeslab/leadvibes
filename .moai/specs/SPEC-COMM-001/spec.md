---
id: COMM-001
version: 0.0.1
status: draft
created: 2026-03-20
updated: 2026-03-20
author: @RogerVibes
priority: high
category: feature
labels:
  - email-marketing
  - ab-testing
  - drip-campaigns
  - sendgrid
depends_on:
  - CAMP-001
blocks: []
related_specs:
  - COMM-002
scope:
  packages:
    - backend/services/email_service.py
    - backend/api/email.py
  files:
    - ab_test_engine.py
    - drip_campaign_scheduler.py
    - email_template_builder.py
---

# @SPEC:COMM-001: Advanced Email Marketing - A/B Testing y Secuencias

## HISTORY

### v0.0.1 (2026-03-20)
- **INITIAL**: Advanced Email Marketing - Creación inicial
- **AUTHOR**: @RogerVibes
- **SCOPE**: Completar features de email marketing con A/B testing de subject lines, drip campaigns (secuencias), segmentación avanzada
- **CONTEXT**: Feature de email marketing existe al 60% (SendGrid integrado), pero falta A/B testing y secuencias automatizadas
- **REASON**: Aumentar engagement rate de emails del 15% al 25% mediante optimización continua

---

## Environment

### Estado Actual

- **Integración SendGrid**: Funcional (`sendgrid==6.12.5`)
- **Email Templates**: Editor visual existe pero sin templates predefinidos
- **Campaign Email**: Existe pero muy básico (sin segmentación avanzada)

### Infraestructura

- **Email Provider**: SendGrid (API key en `.env`)
- **Template Engine**: Jinja2 para plantillas dinámicas
- **Scheduler**: APScheduler para secuencias automatizadas
- **Analytics**: SendGrid webhooks (open, click, bounce, delivered)

---

## Assumptions

1. **Sender Reputation**: Dominio de email está configurado correctamente (SPF, DKIM)
2. **Compliance**: Emails incluyen unsubscribe link (CAN-SPAM compliant)
3. **Rate Limiting**: SendGrid tiene límites de envío (respetarlos)
4. **A/B Test Significance**: Mínimo 1000 recipients por variante para valid estadística
5. **Personalización**: Variables dinámicas disponibles (nombre, propiedad, precio, etc.)

---

## Requirements

### Ubiquitous Requirements (Básicas)

- El sistema debe permitir crear campañas de email con A/B testing
- El sistema debe soportar drip campaigns (secuencias de emails)
- El sistema debe proveer segmentación avanzada de leads
- El sistema debe personalizar emails con variables dinámicas
- El sistema debe rastrear métricas (open rate, click rate, unsubscribe rate)

### Event-driven Requirements (WHEN-THEN)

- **WHEN** se crea un A/B test, el sistema debe dividir audience 50/50 automáticamente
- **WHEN** una variante gana el test (significancia estadística), el sistema debe enviar al resto
- **WHEN** un lead entra en una drip campaign, el sistema debe programar próximos emails
- **WHEN** un email hace bounce, el sistema debe marcar lead como "email inválido"
- **WHEN** un lead hace unsubscribe, el sistema debe respetar preferencia y no enviar más emails

### State-driven Requirements (WHILE-THEN)

- **WHILE** un A/B test está corriendo, el sistema debe mostrar resultados en tiempo real
- **WHILE** una drip campaign está activa, el sistema debe enviar emails según cronograma
- **WHILE** un lead no abre 3 emails seguidos, el sistema debe pausar campaña para ese lead

### Optional Requirements (WHERE-THEN)

- **WHERE** se detecta patrón positivo (ej: emails los martes 10am tienen más opens), el sistema debe sugerir optimal send time
- **WHERE** un lead hace click en link, el sistema debe taggearlo para segmentación futura
- **WHERE** un A/B test no tiene ganador claro (diferencia <5%), el sistema debe alertar al admin

### Constraints (IF-THEN)

- **IF** un lead se unsubscribe, el sistema debe respetar su decisión inmediatamente
- **IF** un email hace bounce (hard bounce), el sistema debe marcar email como inválido
- **IF** un A/B test tiene <1000 recipients, el sistema debe advertir sobre falta de significancia estadística
- **IF** una drip campaign tiene >10 emails, el sistema debe alertar sobre posible fatiga del lead
- **IF** SendGrid API falla, el sistema debe reintentar hasta 3 veces con exponential backoff

---

## Specifications

### @CODE:COMM-001:AB A/B Testing Engine

**Ubicación**: `backend/services/ab_test_engine.py`

#### Flujo de A/B Testing

1. **Configuración del Test**
   ```python
   {
     "name": "A/B Test Subject Line - Lanzamiento Lotes La Veleta",
     "subject_a": "¡Lotes exclusivos en La Veleta desde $2M!",
     "subject_b": "Oportunidad única: Lotes en La Veleta con financiamiento",
     "hypothesis": "Subject B generará mayor open rate (más específico)",
     "metric": "open_rate",  # open_rate, click_rate, conversion_rate
     "sample_size": 2000,     # 1000 por variante
     "confidence_level": 95,  # 95% confidence interval
     "winner_criteria": "statistical_significance"
   }
   ```

2. **Ejecución del Test**
   - **Fase 1 - Test**: Enviar a 2000 leads (1000 A, 1000 B)
   - **Duración**: Esperar 24-48 horas para recolectar datos
   - **Evaluación**: Calcular si hay diferencia estadísticamente significativa
   - **Fase 2 - Rollout**: Si hay ganador, enviar a los leads restantes (8000)

3. **Cálculo de Significancia Estadística**
   ```python
   from scipy import stats

   def calculate_significance(rate_a, n_a, rate_b, n_b):
       """Test Z de dos proporciones"""
       prop_a = rate_a
       prop_b = rate_b
       pooled_prop = (prop_a * n_a + prop_b * n_b) / (n_a + n_b)

       z_score = (prop_a - prop_b) / sqrt(pooled_prop * (1 - pooled_prop) * (1/n_a + 1/n_b))
       p_value = stats.norm.sf(abs(z_score)) * 2  # Two-tailed test

       is_significant = p_value < 0.05  # 95% confidence
       return is_significant, p_value, z_score
   ```

4. **Determinación de Ganador**
   - **Condition 1**: Diferencia ≥5% y p-value <0.05 → Ganador claro
   - **Condition 2**: Diferencia <5% o p-value ≥0.05 → No hay ganador (ambos son similares)
   - **Action**: Si hay ganador, enviar variante ganadora al resto de leads

---

### @CODE:COMM-001:DRIP Drip Campaigns

**Ubicación**: `backend/services/drip_campaign_scheduler.py`

#### Estructura de Drip Campaign

```json
{
  "name": "Nurturing Leads Nuevos - Primeros 30 Días",
  "trigger": "lead_created",
  "emails": [
    {
      "day": 0,
      "template": "welcome_email",
      "subject": "¡Bienvenido a LeadVibes! Encuentra tu lote ideal",
      "send_time": "10:00"
    },
    {
      "day": 3,
      "template": "follow_up_1",
      "subject": "¿Ya viste nuestros lotes en La Veleta?",
      "send_time": "10:00"
    },
    {
      "day": 7,
      "template": "educational_content",
      "subject": "Guía: Cómo elegir el lote perfecto en Tulum",
      "send_time": "19:00"
    },
    {
      "day": 14,
      "template": "social_proof",
      "subject": "5 inversistas como tú ya compraron este mes",
      "send_time": "10:00"
    },
    {
      "day": 30,
      "template": "final_offer",
      "subject": "Última oportunidad: Lotes con descuento exclusivo",
      "send_time": "10:00"
    }
  ],
  "stop_conditions": [
    {"event": "lead_converted", "action": "pause_campaign"},
    {"event": "email_bounced", "action": "pause_campaign"},
    {"event": "unsubscribed", "action": "pause_campaign"}
  ]
}
```

#### Scheduler

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', hour='*', minute='0')
async def check_drip_campaigns():
    """Busca leads que deben recibir email hoy"""
    campaigns = await get_active_drip_campaigns()

    for campaign in campaigns:
        leads = await get_leads_for_drip_campaign(campaign)

        for lead in leads:
            email_to_send = campaign.get_email_for_day(lead.days_in_campaign)

            if await should_send_email(lead, email_to_send):
                await send_email(lead, email_to_send)
                await log_email_sent(lead, campaign, email_to_send)
```

---

### @CODE:COMM-001:SEG Advanced Segmentation

**Ubicación**: `backend/services/email_service.py`

#### Criterios de Segmentación

1. **Demográficos**
   - Ubicación (Tulum Centro, La Veleta, Aldea Zama)
   - Presupuesto (<$1M, $1-2M, $2-3M, >$3M)
   - Edad (rangos: 18-35, 36-50, 50+)

2. **Comportamiento**
   - Leads que abren >50% de emails
   - Leads que hicieron click en último email
   - Leads que visitaron propiedad (showed up)
   - Leads que compraron previamente (clientes)

3. **Fuentes**
   - Leads de Facebook Ads
   - Leads de Instagram
   - Leads referidos
   - Leads orgánicos (web)

4. **Engagement**
   - Leads activos (última actividad <7 días)
   - Leads en riesgo (sin actividad 7-30 días)
   - Leads inactivos (sin actividad >30 días)

#### Query de Segmentación

```python
# Ejemplo: Segmentar leads "high potential" para campaña especial
pipeline = [
    {"$match": {
        "status": {"$in": ["nuevo", "contactado"]},
        "score": {"$gte": 70},
        "source": {"$in": ["facebook", "instagram"]},
        "budget": {"$gte": 2000000}
    }},
    {"$project": {
        "email": 1,
        "first_name": 1,
        "score": 1,
        "budget": 1
    }}
]

segment = await db.leads.aggregate(pipeline).to_list(None)
```

---

### @CODE:COMM-001:API Email Marketing Endpoints

**Ubicación**: `backend/api/email.py` (nuevo módulo)

#### Endpoints

1. **POST `/emails/ab-test`**
   - **Descripción**: Crear nuevo A/B test
   - **Body**:
     ```json
     {
       "name": "A/B Test Subject Line",
       "subject_a": "...",
       "subject_b": "...",
       "list_id": "segment_id",
       "sample_size": 2000,
       "metric": "open_rate"
     }
     ```

2. **GET `/emails/ab-test/{test_id}/results`**
   - **Descripción**: Obtener resultados del A/B test
   - **Response**:
     ```json
     {
       "status": "completed",
       "winner": "B",
       "metric_a": {"open_rate": 0.22, "click_rate": 0.05, "n": 1000},
       "metric_b": {"open_rate": 0.28, "click_rate": 0.07, "n": 1000},
       "lift": "+27%",  # (0.28 - 0.22) / 0.22
       "p_value": 0.001,
       "is_significant": true
     }
     ```

3. **POST `/emails/drip-campaigns`**
   - **Descripción**: Crear nueva drip campaign
   - **Body**: (Ver estructura arriba en Drip Campaigns)

4. **GET `/emails/drip-campaigns/{campaign_id}/stats`**
   - **Descripción**: Obtener estadísticas de drip campaign
   - **Response**:
     ```json
     {
       "total_enrolled": 500,
       "active_leads": 350,
       "completed_leads": 100,
       "paused_leads": 50,
       "emails_sent": 1750,
       "open_rate": 0.35,
       "click_rate": 0.08,
       "unsubscribe_rate": 0.02
     }
     ```

5. **POST `/emails/segments`**
   - **Descripción**: Crear segmento avanzado
   - **Body**:
     ```json
     {
       "name": "High Potential Leads",
       "filters": {
         "score": {"$gte": 70},
         "status": {"$in": ["nuevo", "contactado"]},
         "budget": {"$gte": 2000000}
       }
     }
     ```

6. **GET `/emails/analytics/{campaign_id}`**
   - **Descripción**: Analytics detallados de campaña
   - **Response**:
     ```json
     {
       "sent": 5000,
       "delivered": 4850,
       "opened": 1450,
       "clicked": 290,
       "bounced": 150,
       "unsubscribed": 50,
       "open_rate": 0.29,
       "click_rate": 0.058,
       "bounce_rate": 0.03
     }
     ```

---

## Traceability (@TAG)

- **SPEC**: @SPEC:COMM-001
- **TEST**:
  - `backend/tests/test_email_ab_testing.py` → @TEST:COMM-001:AB
  - `backend/tests/test_drip_campaigns.py` → @TEST:COMM-001:DRIP
  - `backend/tests/test_email_segmentation.py` → @TEST:COMM-001:SEG
- **CODE**:
  - `backend/services/ab_test_engine.py` → @CODE:COMM-001:AB
  - `backend/services/drip_campaign_scheduler.py` → @CODE:COMM-001:DRIP
  - `backend/api/email.py` → @CODE:COMM-001:API
  - `backend/models.py` → @CODE:COMM-001:DATA (EmailCampaign, ABTest models)
- **DOC**: `docs/email-marketing-guide.md` → @DOC:COMM-001

---

## Acceptance Criteria

### Criterios de Aceptación

1. **A/B Testing Funcionando**: Tests se ejecutan con distribución 50/50 y determinan ganador estadísticamente
2. **Drip Campaigns Automatizadas**: Secuencias de emails se envían automáticamente según cronograma
3. **Segmentación Avanzada**: Filtros complejos (demográficos + comportamiento + fuente)
4. **Personalización Dinámica**: Emails incluyen variables (nombre, propiedad, precio)
5. **Analytics Completos**: Open rate, click rate, bounce rate tracking por campaña

### Definición de Done

- [ ] A/B testing engine implementado con cálculo de significancia estadística
- [ ] Drip campaigns scheduler funcionando con APScheduler
- [ ] 5+ templates de email predefinidos (bienvenida, follow-up, etc.)
- [ ] Endpoints `/emails/*` funcionando y testeados
- [ ] Segmentación avanzada con filtros complejos
- [ ] UI para crear A/B tests y drip campaigns
- [ ] Integración con SendGrid webhooks (open, click tracking)
- [ ] Documentación de mejores prácticas de email marketing creada
