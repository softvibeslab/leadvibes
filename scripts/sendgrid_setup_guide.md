# 🎯 Guía Paso a Paso - Configuración Completa de Email para Rovi CRM

## ✅ Paso 1 COMPLETADO: API Key de SendGrid Configurada

Tu API key ya está configurada en el backend:
```bash
SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY_HERE
SENDGRID_SENDER_EMAIL=noreply@rovirealestate.com
SENDGRID_SENDER_NAME="Rovi Real Estate"
```

---

## 🚀 Paso 2: AUTENTICAR DOMINIO EN SENDGRID

### 2.1 Ir a SendGrid Settings

1. Acceder a https://app.sendgrid.com/
2. Ir a **Settings** → **Sender Authentication**
3. Click en **"Authenticate Your Domain"**

### 2.2 Configurar el Dominio

**Dominio a configurar:** (¿Cuál es tu dominio real?)

Opciones:
- `rovirealestate.com` (si es tu dominio)
- `leadvibes.com` (si es tu dominio)
- Tu dominio real: _____________

**Datos a ingresar:**
```
Domain: tu-dominio.com
Method: DNS (Recomendado)
```

### 2.3 Obtener Registros DNS de SendGrid

SendGrid generará 3 registros DNS que debes agregar:

#### **Registro 1: DKIM 1**
```
Tipo: TXT
Nombre: sendgrid._domainkey
Valor: "k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCx..."
```

#### **Registro 2: DKIM 2**
```
Tipo: TXT
Nombre: smtpapi._domainkey
Valor: "k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDe..."
```

#### **Registro 3: SPF**
```
Tipo: TXT
Nombre: @
Valor: "v=spf1 include:sendgrid.net ~all"
```

### 2.4 Agregar Registros DNS

**DÓNDE AGREGAR LOS REGISTROS:**

Dependiendo de dónde tengas tu dominio:

#### **Opción A: GoDaddy**
1. Acceder a https://godaddy.com/
2. My Account → Domains → Manage DNS
3. Agregar cada registro

#### **Opción B: Namecheap**
1. Acceder a https://namecheap.com/
2. Domain List → Advanced DNS
3. Agregar cada registro

#### **Opción C: Cloudflare (RECOMENDADO)**
1. Acceder a https://dash.cloudflare.com/
2. Select Domain → DNS → Records
3. Agregar cada registro
4. **IMPORTANTE**: En Cloudflare, desactivar "Proxy Status" (nube naranja) para estos registros TXT

### 2.5 Verificar en SendGrid

1. Una vez agregados los registros DNS (esperar 5-30 minutos)
2. Click en **"Verify"** en SendGrid
3. ¡Listo! Tu dominio estará autenticado

---

## 📧 Paso 3: CONFIGURAR RECEPCIÓN DE EMAILS

Tienes 3 opciones para recibir emails:

### **Opción A: Google Workspace ($6-12 USD/mes)** ✅ RECOMENDADO
- Gmail con tu dominio
- 30GB almacenamiento
- Configuración en 15 min

### **Opción B: MXRoute ($15-30 USD/año)** 💰 ECONÓMICO
- Ilimitadas cuentas email
- Almacenamiento generoso
- Configuración en 30 min

### **Opción C: Servidor Propio (Gratis en VPS)**
- Configuración compleja (4-8 horas)
- Requiere mantenimiento
- Solo si tienes experiencia técnica

---

## 🏆 OPCIÓN A RECOMENDADA: Google Workspace

### 3.1 Crear Cuenta de Google Workspace

1. Ir a https://workspace.google.com/
2. Elegir **Business Starter** ($6 USD/mes)
3. Ingresar dominio
4. Verificar dominio (registro TXT)

### 3.2 Configurar Registros MX de Google

```
Tipo: MX
Nombre: @
Prioridad: 1
Valor: aspmx.l.google.com

Tipo: MX
Nombre: @
Prioridad: 5
Valor: alt1.aspmx.l.google.com

Tipo: MX
Nombre: @
Prioridad: 5
Valor: alt2.aspmx.l.google.com

Tipo: MX
Nombre: @
Prioridad: 10
Valor: alt3.aspmx.l.google.com

Tipo: MX
Nombre: @
Prioridad: 10
Valor: alt4.aspmx.l.google.com
```

### 3.3 Crear Usuarios

Crear estas cuentas:
- `info@tudominio.com` - Contacto general
- `contacto@tudominio.com` - Formularios web
- `soporte@tudominio.com` - Soporte
- `broker@tudominio.com` - Para cada broker
- `noreply@tudominio.com` - Envío automático (solo SMTP)

### 3.4 Configurar SPF para Google + SendGrid

**Actualizar registro SPF existente:**

```
Tipo: TXT
Nombre: @
Valor: "v=spf1 mx include:sendgrid.net ~all"
```

---

## 💰 OPCIÓN B ECONÓMICA: MXRoute

### 3.1 Comprar MXRoute

1. Ir a https://mxroute.com/
2. Comprar plan anual ($15-30 USD/año)
3. Recibir credenciales por email

### 3.2 Configurar Registros MX de MXRoute

```
Tipo: MX
Nombre: @
Prioridad: 10
Valor: mx1.mxroute.com

Tipo: MX
Nombre: @
Prioridad: 20
Valor: mx2.mxroute.com
```

### 3.3 Crear Cuentas Email

1. Login al cPanel: https://tudominio.com/cpanel
2. Email Accounts → Create
3. Crear cuentas necesarias

### 3.4 Actualizar SPF

```
Tipo: TXT
Nombre: @
Valor: "v=spf1 mx include:sendgrid.net include:mxroute.net ~all"
```

---

## 🎯 Paso 4: CREAR PLANTILLA DE EMAIL EN ROVI CRM

### 4.1 Acceder al Sistema

1. Ir a http://localhost:13000
2. Login con tus credenciales
3. Navegar a **Campaigns** → **Templates**

### 4.2 Crear Primera Plantilla

1. Click en **"Cargar Plantillas Base"**
2. O crear una nueva en **"/email-templates/new"**

### 4.3 Probar Envío de Test

```bash
# Obtener token primero
TOKEN=$(curl -s -X POST "http://localhost:18080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"tu_password"}' | jq -r '.access_token')

# Listar plantillas existentes
curl -X GET "http://localhost:18080/api/email-templates" \
  -H "Authorization: Bearer $TOKEN"

# Enviar test email
TEMPLATE_ID="id_de_plantilla"
curl -X POST "http://localhost:18080/api/email-templates/send-test" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"template_id\": \"$TEMPLATE_ID\",
    \"recipient_email\": \"tu@email.com\",
    \"preview_data\": {}
  }"
```

---

## 🧪 Paso 5: PRIMERA CAMPAÑA DE EMAIL

### 5.1 Crear Campaña

1. Ir a **Campaigns** → **Nueva Campaña**
2. Tipo: **Email**
3. Seleccionar plantilla existente
4. Elegir segmento de leads

### 5.2 Configurar Segmento

**Filtros disponibles:**
- Estado: `nuevo`, `contactado`, `calificacion`, `presentacion`
- Prioridad: `baja`, `media`, `alta`, `urgente`

**Ejemplo:**
```
Segmento: Leads nuevos con alta prioridad
Estado: nuevo
Prioridad: alta, urgente
```

### 5.3 Enviar Campaña

1. Revisar previsualización
2. Click en **"Enviar Campaña"**
3. Monitorear progreso en tiempo real

---

## 📊 Paso 6: MONITOREO Y ANALÍTICAS

### 6.1 Ver Estadísticas en SendGrid

1. Ir a https://app.sendgrid.com/statistics
2. Métricas disponibles:
   - **Total Emails**: Enviados
   - **Delivered**: Entregados
   - **Open Rate**: Tasa de apertura
   - **Click Rate**: Tasa de clicks
   - **Bounce Rate**: Tasa de rebotes

### 6.2 Ver en Rovi CRM

1. Ir a **Campaigns** → **Emails**
2. Ver historial de emails enviados
3. Estatus en tiempo real:
   - ✅ Sent (Enviado)
   - ✅ Delivered (Entregado)
   - ✅ Opened (Abierto)
   - ✅ Clicked (Click en enlace)
   - ❌ Bounced (Rebotado)
   - ❌ Failed (Fallido)

---

## 🔧 Paso 7: CONFIGURAR WEBHOOK (OPCIONAL)

### 7.1 Crear Webhook en SendGrid

1. En SendGrid, ir a **Settings** → **Mail Settings**
2. Buscar **"Event Webhooks"**
3. Click en **"Edit"** → **"Add New Webhook"**

**Configuración:**
```
URL: https://tu-dominio.com/api/webhooks/sendgrid
Method: POST
Eventos:
  ✅ Open
  ✅ Click
  ✅ Bounce
  ✅ Dropped
  ✅ Delivered
```

**NOTA PARA DESARROLLO:**
Usar ngrok para exponer localhost:
```bash
ngrok http 18080
# Copiar URL generada y usarla en SendGrid
```

### 7.2 Probar Webhook

```bash
# Simular evento de SendGrid
curl -X POST "http://localhost:18080/api/webhooks/sendgrid" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "event": "open",
      "custom_args": {"rovi_email_id": "lead-123-camp-456"},
      "timestamp": 1700000000
    }
  ]'
```

---

## 🎉 RESUMEN DE CONFIGURACIÓN

### **Costos Mensuales Estimados:**

| Servicio | Costo | Descripción |
|----------|-------|-------------|
| **SendGrid** | GRATIS | Hasta 3,000 emails/mes |
| **Google Workspace** | $6-12 USD | Recepción email (opcional) |
| **MXRoute** | $1.25-2.50 USD | Recepción email (alternativa) |
| **VPS** | Ya tienes | Hosting Rovi CRM |

### **Tiempos de Configuración:**

| Tarea | Tiempo |
|------|--------|
| Autenticar dominio SendGrid | 30 min |
| Configurar recepción emails | 15-30 min |
| Crear plantillas | 1 hora |
| Primera campaña | 30 min |
| **TOTAL** | **2-3 horas** |

---

## ❓ PREGUNTAS FRECUENTES

**1. ¿Cuánto tiempo tardan los registros DNS en propagarse?**
- 5 minutos - 48 horas (usualmente 1-2 horas)

**2. ¿Puedo usar Gmail para recibir correos?**
- Sí, puedes configurar Gmail para recibir emails de tu dominio con Google Workspace

**3. ¿SendGrid es gratis?**
- Sí, el plan Free incluye 3,000 emails/mes

**4. ¿Qué pasa si supero los 3,000 emails?**
- SendGrid te cobrará $0.015 por email adicional, o puedes subir al plan Basic ($19.95/mes por 50,000 emails)

**5. ¿Puedo cambiar de MXRoute a Google Workspace después?**
- Sí, solo cambias los registros MX

---

## 🚀 ¿SIGUIENTES PASOS?

### **Que necesito de ti:**

1. **¿Cuál es tu dominio real?**
   - Ej: rovirealestate.com, leadvibes.com, etc.

2. **¿Dónde tienes registrado tu dominio?**
   - GoDaddy, Namecheap, Cloudflare, etc.

3. **¿Cuántos usuarios de correo necesitas?**
   - 1-5, 5-20, 20+?

4. **¿Qué opción prefieres para recepción?**
   - Google Workspace ($6-12 USD/mes)
   - MXRoute ($1.25-2.50 USD/mes)
   - Servidor propio (gratis pero complejo)

Con esa información te doy instrucciones **específicas paso a paso** para tu caso.

---

**Status Actual:** ✅ SendGrid configurado correctamente
**Próximo Paso:** Autenticar dominio en SendGrid

¿Necesitas ayuda con algún paso específico? 🤔