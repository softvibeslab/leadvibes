# 🔄 Guía de Integración de Webhook para Leads

## 📋 Overview

Esta guía explica cómo implementar el webhook para recibir información de leads y automatizar el envío de emails, llamadas telefónicas y análisis de perfiles.

## 🏗️ Arquitectura del Webhook

### Estructura Principal
```
webhook_lead_schema.json    - Esquema completo de datos
webhook_lead_example.json    - Ejemplo práctico con datos reales
```

## 🔌 Endpoints del Webhook

### 1. Recepción de Leads
```
POST /api/webhooks/leads
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
```

### 2. Eventos de SendGrid
```
POST /api/webhooks/sendgrid
Content-Type: application/json
```

### 3. Actualización de Estados
```
PUT /api/leads/{lead_id}/status
Content-Type: application/json
```

## 📊 Flujo de Procesamiento

### 1. Recepción del Lead
1. **Validación**: Verificar estructura JSON
2. **Deduplicación**: Revisar si el lead ya existe
3. **Enriquecimiento**: Analizar perfil y asignar score
4. **Segmentación**: Clasificar en hot/warm/cold
5. **Asignación**: Asignar a agente adecuado

### 2. Acciones Automáticas
1. **Email**: Enviar campaña personalizada via SendGrid
2. **Llamada**: Programar llamada telefónica
3. **Tareas**: Crear tareas en CRM
4. **Notificaciones**: Alertar a agentes

### 3. Seguimiento
1. **Webhooks**: Recibir actualizaciones de SendGrid
2. **Analytics**: Actualizar métricas de engagement
3. **Scoring**: Reajustar lead score
4. **Nurturing**: Activar secuencias de follow-up

## 🛠️ Implementación Técnica

### Configuración del Servidor

#### Python/FastAPI
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sendgrid
from sendgrid.helpers.mail import Mail

app = FastAPI()

class LeadWebhook(BaseModel):
    # Implementar modelo basado en webhook_lead_schema.json
    pass

@app.post("/api/webhooks/leads")
async def receive_lead(lead: LeadWebhook):
    # 1. Validar datos
    # 2. Procesar lead
    # 3. Disparar acciones
    # 4. Responder
    return {"status": "success", "lead_id": lead.lead_data.id}
```

#### Node.js/Express
```javascript
const express = require('express');
const sgMail = require('@sendgrid/mail');
const app = express();

app.post('/api/webhooks/leads', async (req, res) => {
    try {
        const lead = req.body;
        
        // Validar y procesar lead
        await processLead(lead);
        
        res.json({ status: 'success', lead_id: lead.lead_data.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

### Integración con SendGrid

#### Configuración
```python
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')
sg = SendGridAPIClient(SENDGRID_API_KEY)

def send_lead_email(lead_data):
    message = Mail(
        from_email='noreply@rovirealestate.com',
        to_emails=lead_data.contact_info.email.address,
        subject=lead_data.email_campaign_config.personalization.subject,
        html_content=generate_email_content(lead_data)
    )
    
    response = sg.send(message)
    return response
```

#### Template Personalizado
```html
<!-- Plantilla SendGrid -->
<h1>Hola {{nombre}} {{apellidos}}!</h1>
<p>{{contenido_personalizado.mensaje_principal}}</p>

{{#each propiedades_recomendadas}}
<div class="property-card">
    <img src="{{imagen_url}}" alt="{{titulo}}">
    <h3>{{titulo}}</h3>
    <p><strong>Precio:</strong> {{precio}}</p>
    <p><strong>Ubicación:</strong> {{ubicacion}}</p>
    <p>{{descripcion}}</p>
    <a href="{{link_propiedad}}" class="btn">Ver Detalles</a>
</div>
{{/each}}

<p>{{contenido_personalizado.llamada_accion}}</p>
<p>{{contenido_personalizado.firma}}</p>
```

### Integración Telefónica

#### Twilio Integration
```python
from twilio.rest import Client

def schedule_call(lead_data):
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    
    call = client.calls.create(
        twiml='<Response><Say>Hola {{nombre}}, soy {{agent_name}}...</Say></Response>',
        to=lead_data.contact_info.primary_phone.number,
        from_='+1234567890'
    )
    
    return call.sid
```

#### WhatsApp Business
```python
def send_whatsapp_message(lead_data):
    # Usar WhatsApp Business API
    message = {
        "messaging_product": "whatsapp",
        "to": lead_data.contact_info.whatsapp.number,
        "type": "template",
        "template": {
            "name": "lead_follow_up",
            "language": {"code": "es"},
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": lead_data.personal_info.first_name}
                    ]
                }
            ]
        }
    }
    
    # Enviar mensaje via API
    return send_whatsapp_api(message)
```

## 📈 Análisis y Scoring

### Algoritmo de Lead Scoring
```python
def calculate_lead_score(lead_data):
    scores = {
        'demographic': 0,
        'behavioral': 0,
        'engagement': 0,
        'financial': 0,
        'timing': 0
    }
    
    # Demographic (30%)
    if lead_data.location.city in target_cities:
        scores['demographic'] += 30
    if lead_data.preferences.language == 'es':
        scores['demographic'] += 10
    
    # Behavioral (25%)
    if lead_data.profile_analysis.budget_range.max > 200000:
        scores['behavioral'] += 20
    if lead_data.profile_analysis.timeline == 'immediate':
        scores['behavioral'] += 15
    
    # Engagement (20%)
    if lead_data.contact_info.email.verified:
        scores['engagement'] += 10
    if lead_data.contact_info.primary_phone.verified:
        scores['engagement'] += 10
    
    # Financial (15%)
    if lead_data.profile_analysis.financing != 'undecided':
        scores['financial'] += 15
    
    # Timing (10%)
    timeline_scores = {
        'immediate': 10,
        '1-3_months': 8,
        '3-6_months': 6,
        '6-12_months': 4,
        '12+_months': 2
    }
    scores['timing'] = timeline_scores.get(lead_data.profile_analysis.timeline, 0)
    
    return sum(scores.values())
```

### Segmentación Automática
```python
def segment_lead(score, profile):
    if score >= 80:
        return 'hot'
    elif score >= 60:
        return 'warm'
    elif score >= 40:
        return 'cold'
    else:
        return 'unqualified'
```

## 🔔 Manejo de Eventos

### Webhook de SendGrid
```python
@app.post("/api/webhooks/sendgrid")
async def sendgrid_webhook(events: list):
    for event in events:
        if event['event'] == 'open':
            await update_lead_engagement(event['email'], 'email_opened')
        elif event['event'] == 'click':
            await update_lead_engagement(event['email'], 'email_clicked')
        elif event['event'] == 'delivered':
            await update_lead_status(event['email'], 'email_delivered')
    
    return {"status": "processed"}
```

### Actualización de Estados
```python
async def update_lead_status(email, status):
    lead = await find_lead_by_email(email)
    if lead:
        lead.status = status
        lead.communication_history.append({
            'date': datetime.now().isoformat(),
            'type': 'email',
            'status': status
        })
        await save_lead(lead)
```

## 🚀 Despliegue y Monitoreo

### Variables de Entorno
```env
# SendGrid
SENDGRID_API_KEY=SG.xxxx.xxxx
SENDGRID_SENDER_EMAIL=noreply@rovirealestate.com

# Twilio
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx

# Database
DATABASE_URL=postgresql://user:pass@localhost/leads

# Redis (caching)
REDIS_URL=redis://localhost:6379

# Webhook Security
WEBHOOK_SECRET=your-secret-key
```

### Docker Configuration
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  webhook-server:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/leads
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: leads
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
  
  redis:
    image: redis:6-alpine
```

## 📊 Métricas y KPIs

### Métricas Principales
- **Lead Conversion Rate**: % de leads que se convierten
- **Email Open Rate**: % de emails abiertos
- **Call Connection Rate**: % de llamadas conectadas
- **Lead Response Time**: Tiempo promedio de respuesta
- **Pipeline Velocity**: Velocidad del pipeline

### Dashboard de Monitoreo
```python
# Endpoint para métricas
@app.get("/api/analytics/dashboard")
async def get_dashboard_metrics():
    return {
        "total_leads": await count_total_leads(),
        "conversion_rate": await calculate_conversion_rate(),
        "email_stats": await get_email_statistics(),
        "call_stats": await get_call_statistics(),
        "top_agents": await get_top_performers()
    }
```

## 🔒 Seguridad

### Validación de Webhooks
```python
import hmac
import hashlib

def verify_webhook_signature(payload, signature, secret):
    expected_signature = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_signature, signature)
```

### Rate Limiting
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/webhooks/leads")
@limiter.limit("10/minute")
async def receive_lead(request: Request, lead: LeadWebhook):
    # Procesar webhook
    pass
```

## 🧪 Testing

### Tests Unitarios
```python
import pytest
from fastapi.testclient import TestClient

def test_lead_webhook():
    client = TestClient(app)
    
    lead_data = {
        # Datos de prueba basados en webhook_lead_example.json
    }
    
    response = client.post("/api/webhooks/leads", json=lead_data)
    assert response.status_code == 200
    assert response.json()["status"] == "success"
```

### Tests de Integración
```python
def test_sendgrid_integration():
    # Probar envío real a email de prueba
    pass

def test_twilio_integration():
    # Probar llamada a número de prueba
    pass
```

## 📚 Recursos Adicionales

- **Documentación SendGrid**: https://docs.sendgrid.com/
- **Documentación Twilio**: https://www.twilio.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp/

---

**Status**: ✅ **GUÍA COMPLETA DE INTEGRACIÓN**
