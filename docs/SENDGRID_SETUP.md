# ⚙️ Guía de Configuración de SendGrid

## 📋 Requisitos Previos

- Cuenta de SendGrid (https://sendgrid.com/)
- Dominio o email remitente verificado
- Backend de Rovi CRM corriendo

## 🚀 Configuración Paso a Paso

### **1. Crear Cuenta de SendGrid**

1. Ir a https://signup.sendgrid.com/
2. Registrarse con email corporativo
3. Verificar email
4. Completar perfil del usuario

### **2. Verificar Remitente**

#### **Opción A: Verificar Dominio (Recomendado)**

1. En SendGrid, ir a **Settings** → **Sender Authentication**
2. Click en **"Get Started"** → **"Verify Your Domain"**
3. Ingresar dominio (ej: `rovirealestate.com`)
4. Seleccionar **"DNS"** como método de verificación
5. SendGrid generará registros DNS:

```
Tipo: TXT
Nombre: @._domainkey.rovirealestate.com
Valor: "k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA..."

Tipo: TXT
Nombre: @
Valor: "v=DMARC1; p=none; rua=mailto:dmarc@rovirealestate.com"
```

6. Agregar estos registros en el proveedor de DNS
7. Click en **"Verify"** en SendGrid

#### **Opción B: Verificar Email Individual**

1. En SendGrid, ir a **Settings** → **Sender Authentication**
2. Click en **"Get Started"** → **"Verify a Single Sender"**
3. Completar formulario:
   - **From Name**: "Rovi Real Estate"
   - **From Email**: `noreply@rovirealestate.com`
   - **Reply To**: `contacto@rovirealestate.com`
4. SendGrid enviará email de verificación
5. Click en enlace de verificación

### **3. Crear API Key**

1. En SendGrid, ir a **Settings** → **API Keys**
2. Click en **"Create API Key"**
3. Nombre: `Rovi CRM Production`
4. Permisos necesarios:
   - ✅ **Mail Send** → Full Access
   - ✅ **Email Activity** → Read Access
5. Click en **"Create & View"**
6. **COPIAR LA API KEY** (solo se muestra una vez)

Ejemplo de API Key:
```
SG.xxxxx.xxxxx.xxxxx.xxxxx.xxxxx.xxxxx.xxxxx.xxxxx.xxxxx.xxxxx
```

### **4. Configurar Webhook (Opcional pero Recomendado)**

1. En SendGrid, ir to **Settings** → **Mail Settings**
2. Buscar **"Event Webhooks"**
3. Click en **"Edit"** → **"Add New Webhook"**
4. Configurar webhook:

```
URL: https://tu-dominio.com/api/webhooks/sendgrid
Method: POST
Authentication: None (o agregar header de autorización)

Eventos a seleccionar:
✅ Open
✅ Click
✅ Bounce
✅ Dropped
✅ Delivered
✅ Spam Report

URL Selection: All (para todos los eventos)
```

5. Click en **"Save"**

**Nota para desarrollo**: Usar ngrok para exponer localhost:
```bash
ngrok http 13000
# Copiar la URL generada y usarla en el webhook
```

### **5. Actualizar Variables de Entorno**

#### **En Desarrollo (.env)**
```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxx.xxxxx.xxxxx.xxxxx.xxxxx.xxxxx.xxxxx.xxxxx.xxxxx.xxxxx
SENDGRID_SENDER_EMAIL=noreply@rovirealestate.com
SENDGRID_SENDER_NAME="Rovi Real Estate"
```

#### **En Producción (Docker)**
Agregar al archivo `.env` o en la configuración del servidor:

```env
SENDGRID_API_KEY=SG.xxxxx.xxxxx.xxxxx.xxxxx.xxxxx.xxxxx.xxxxx.xxxxx.xxxxx.xxxxx
SENDGRID_SENDER_EMAIL=noreply@rovirealestate.com
SENDGRID_SENDER_NAME="Rovi Real Estate"
```

#### **En Hostinger/Producción**
1. Acceder al servidor via SSH
2. Editar variables de entorno:
   ```bash
   nano /root/rovi-crm/.env
   ```
3. Agregar variables de SendGrid
4. Reiniciar contenedores:
   ```bash
   docker compose down && docker compose up -d
   ```

### **6. Probar Integración**

#### **Test desde Backend**
```bash
curl -X POST "http://localhost:18080/api/email-templates/send-test" \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "ID_DE_PLANTILLA",
    "recipient_email": "tu@email.com",
    "preview_data": {
      "nombre": "Juan Pérez",
      "propiedad": "Residencial Santa Fe"
    }
  }'
```

#### **Test desde Frontend**
1. Ir a http://localhost:13000
2. Navegar a **Campaigns** → **Templates**
3. Click en cualquier plantilla
4. Click en **Preview**
5. Ingresar email de prueba
6. Click en **Enviar Prueba**
7. Revisar bandeja de entrada

## 📊 Monitoreo y Analíticas

### **Ver Estadísticas en SendGrid**

1. Ir a https://app.sendgrid.com/statistics
2. Métricas disponibles:
   - **Total Emails**: Enviados
   - **Delivered**: Entregados
   - **Open Rate**: Tasa de apertura
   - **Click Rate**: Tasa de clicks
   - **Bounce Rate**: Tasa de rebotes
   - **Spam Reports**: Reportes de spam

### **Ver Activity Feed**

1. Ir a **Activity** en SendGrid
2. Filtrar por:
   - Fecha
   - Event type (Open, Click, Bounce, etc.)
   - Email address
   - Campaign ID

### **Ver en Rovi CRM**

1. Navegar a **Campaigns** → **Emails**
2. Ver historial de emails enviados
3. Estatos actualizados en tiempo real via webhook:
   - ✅ Sent
   - ✅ Delivered
   - ✅ Opened
   - ✅ Clicked
   - ❌ Bounced
   - ❌ Failed

## 🔧 Solución de Problemas

### **Problema: Email no llega**

**Causas posibles:**
1. API Key inválida o expirada
2. Remitente no verificado
3. Email del receptor inválido
4. Contenido marcado como spam

**Soluciones:**
```bash
# Verificar variables de entorno
docker compose exec backend env | grep SENDGRID

# Verificar logs del backend
docker compose logs backend | grep -i sendgrid

# Probar API Key
curl -X "POST" "https://api.sendgrid.com/v3/mail/send" \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [{"to": [{"email": "tu@email.com"}]}],
    "from": {"email": "noreply@rovirealestate.com"},
    "subject": "Test",
    "content": [{"type": "text/html", "value": "<h1>Test</h1>"}]
  }'
```

### **Problema: Open Rate bajo**

**Causas posibles:**
1. Asunto no atractivo
2. Email marcado como spam
3. Lista de contacts con emails inválidos

**Soluciones:**
1. Personalizar asunto con `{{nombre}}`
2. Evitar palabras de spam en asunto
3. Limpiar lista de leads regularmente
4. Usar doble opt-in para nuevos leads

### **Problema: Webhook no actualiza estatus**

**Causas posibles:**
1. URL del webhook incorrecta
2. Webhook no accesible públicamente
3. Error en procesamiento del evento

**Soluciones:**
```bash
# Verificar logs del backend
docker compose logs backend | grep webhook

# Probar webhook localmente
curl -X POST "http://localhost:18080/api/webhooks/sendgrid" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "event": "open",
      "custom_args": {"rovi_email_id": "lead-123-camp-456"},
      "timestamp": 1234567890
    }
  ]'

# Usar ngrok para desarrollo
ngrok http 18080
# Copiar URL y configurar en SendGrid
```

## 🔒 Seguridad

### **Proteger API Key**

1. Nunca commits en Git
2. Usar variables de entorno
3. Rotar regularmente (cada 90 días)
4. Usar keys separadas para dev/prod

### **Autenticación de Webhook**

Opcional: Agregar seguridad al webhook:

```python
@api_router.post("/webhooks/sendgrid")
async def sendgrid_webhook(request: Request):
    # Verificar firma de SendGrid
    signature = request.headers.get("X-Twilio-Email-Event-Webhook-Signature")
    timestamp = request.headers.get("X-Twilio-Email-Event-Webhook-Timestamp")

    # Verificar que el evento no sea viejo (más de 5 minutos)
    if time.time() - int(timestamp) > 300:
        raise HTTPException(status_code=403, detail="Event too old")

    # Procesar eventos...
```

## 📈 Mejores Prácticas

### **1. Segmentación**
- Dividir lista por segmentos (ubicación, presupuesto, intereses)
- Enviar campañas específicas por segmento
- Personalizar contenido por segmento

### **2. Timing**
- Mejores días: Martes y Jueves
- Mejores horarios: 9-11 AM, 2-4 PM
- Evitar fines de semana y festivos

### **3. Contenido**
- Asunto corto (< 50 caracteres)
- Personalizar con nombre
- Call to action claro
- Móvil-first responsive design

### **4. Compliance**
- Incluir link para desuscribirse
- Dirección física del remitente
- Cumplir con CAN-SPAM Act
- Respetar preferencias de contacto

### **5. Testing**
- A/B test de asuntos
- Probar antes de enviar a lista completa
- Verificar en Gmail, Outlook, Apple Mail
- Probar en móviles y tablets

## 💰 Costos

### **SendGrid Free Plan**
- 100 emails/día
- 3,000 emails/mes
- Sin webhooks
- Sin soporte prioritario

### **SendGrid Basic Plan** ($19.95/mes)
- Sin límite diario
- 50,000 emails/mes
- Webhooks incluidos
- Soporte por email

### **SendGrid Pro Plan** ($99.95/mes)
- Todo lo de Basic
- 100,000 emails/mes
- Test A/B incluidos
- Soporte prioritario

## 📚 Recursos Adicionales

- **Documentación de SendGrid**: https://docs.sendgrid.com/
- **API Reference**: https://docs.sendgrid.com/api-reference/
- **Best Practices**: https://docs.sendgrid.com/for-developers/sending-email/best-practices/
- **Spam Filter Check**: https://www.mail-tester.com/

---

**Status**: ✅ **GUÍA COMPLETA**

**Documentación Relacionada**:
- [Email Campaign Implementation](./EMAIL_CAMPAIGN_IMPLEMENTATION.md)
- [Email Templates Guide](./EMAIL_TEMPLATES.md)
- [Webhook Configuration](./WEBHOOK_SETUP.md)