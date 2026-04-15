# GUÍA PASO A PASO - Configuración de Respond.io para Rovi CRM

## Tabla de Contenidos
1. [Crear Cuenta en Respond.io](#paso-1-crear-cuenta-en-respondio)
2. [Configurar WhatsApp Business](#paso-2-configurar-whatsapp-business)
3. [Configurar Instagram Messaging](#paso-3-configurar-instagram-messaging)
4. [Configurar Telegram](#paso-4-configurar-telegram)
5. [Obtener API Token](#paso-5-obtener-api-token)
6. [Configurar Webhook](#paso-6-configurar-webhook)
7. [Configurar Variables de Entorno en Rovi](#paso-7-configurar-variables-de-entorno-en-rovi)
8. [Probar la Integración](#paso-8-probar-la-integración)
9. [Solución de Problemas](#solución-de-problemas)

---

## PASO 1: Crear Cuenta en Respond.io

### 1.1 Registrarse

1. Ve a: **https://respond.io**
2. Haz clic en **"Start Free Trial"** o **"Get Started"**
3. Completa el formulario:
   ```
   Email: tu-email@empresa.com
   Password: [Crear contraseña segura]
   Company Name: Rovi CRM
   Phone Number: +52 [tu número]
   ```
4. Haz clic en **"Create Account"**

### 1.2 Seleccionar Plan

1. Después del registro, te mostrarán los planes
2. Selecciona **"Growth"** ($159/mes):
   - ✅ 10 usuarios
   - ✅ 1,000 Monthly Active Contacts (MACs)
   - ✅ Canales ilimitados
   - ✅ API access incluido
3. Completa el pago (tarjeta crédito/debito)

### 1.3 Verificar Email

1. Revisa tu email
2. Haz clic en el enlace de verificación
3. Inicia sesión en Respond.io

**✅ CHECKPOINT**: Deberías ver el dashboard de Respond.io

---

## PASO 2: Configurar WhatsApp Business

### 2.1 Opción A: Usar WhatsApp Business API existente

**SI YA TIENES WhatsApp Business API configurado:**

1. En Respond.io, ve a **Settings** (icono de engranaje ⚙️)
2. Haz clic en **Channels** en el menú izquierdo
3. Haz clic en **"Add Channel"**
4. Selecciona **WhatsApp**
5. Selecciona **"Use existing WhatsApp Business API"**
6. Completa:
   ```
   WABA ID: [Tu WhatsApp Business Account ID]
   Phone Number ID: [Tu Phone Number ID]
   Access Token: [Tu Access Token permanente]
   Webhook Verify Token: [Crea uno, ej: rovi_webhook_2024]
   ```
7. Haz clic en **"Connect"**

### 2.2 Opción B: Crear nuevo WhatsApp Business API (RECOMENDADO)

**SI NO TIENES WhatsApp Business API:**

1. En Respond.io, ve a **Settings** → **Channels**
2. Haz clic en **"Add Channel"** → **WhatsApp**
3. Selecciona **"Create new WhatsApp Business API account"**
4. Completa la información:
   ```
   Business Name: Rovi Inmobiliaria
   Business Website: https://rovi.crm (o tu sitio web)
   ```
5. Haz clic en **"Continue"**

### 2.3 Verificación con Facebook

1. Serás redirigido a Facebook Business Manager
2. Si no tienes cuenta, crea una:
   - Ve a: **https://business.facebook.com**
   - Haz clic en **"Create Account"**
   - Completa: Nombre del negocio, tu nombre, email

3. En Facebook Business Manager:
   - Crea una **Business App**:
     ```
     App Name: Rovi CRM WhatsApp
     App Purpose: Business
     ```
   - Configura **WhatsApp Product**:
     - Selecciona tu Business Manager
     - Añade número de teléfono: +52 [tu número con código de país]
     - Verifica el número (recibirás SMS con código)

4. Vuelve a Respond.io y haz clic en **"Complete Setup"**

**TIEMPO ESTIMADO**: 15-30 minutos
**APROXIMACIÓN**: Facebook aprueba WhatsApp Business API en 1-5 días hábiles

**✅ CHECKPOINT**: En Respond.io → Settings → Channels, deberías ver WhatsApp como "Connected"

---

## PASO 3: Configurar Instagram Messaging

### 3.1 Requisitos Previos

Antes de empezar, asegúrate de tener:
- ✅ Cuenta de Instagram **Business** o **Creator**
- ✅ La cuenta de Instagram conectada a una **Facebook Page**
- ✅ Permisos de administrador en la Facebook Page

### 3.2 Convertir cuenta de Instagram a Business

**SI TU CUENTA ES PERSONAL:**

1. Abre Instagram en tu móvil
2. Ve a tu perfil → ☰ → **Settings** → **Account**
3. Haz clic en **"Switch to Professional Account"**
4. Selecciona **"Creator"** o **"Business"**
5. Conecta tu Facebook Page
6. Completa tu información de negocio:
   ```
   Category: Real Estate
   Contact Info: +52 [tu teléfono]
   Email: [tu email]
   Website: https://rovi.crm
   ```

### 3.3 Conectar Instagram a Respond.io

1. En Respond.io, ve a **Settings** → **Channels**
2. Haz clic en **"Add Channel"** → **Instagram**
3. Haz clic en **"Connect Instagram Account"**
4. Inicia sesión con Facebook:
   ```
   Email: [tu email de Facebook]
   Password: [tu contraseña]
   ```
5. Selecciona la **Facebook Page** conectada a tu Instagram
6. Autoriza a Respond.io:
   - **Manage messages**: ✅
   - **Read messages**: ✅
7. Haz clic en **"Connect"**

**✅ CHECKPOINT**: En Settings → Channels, deberías ver Instagram como "Connected"

---

## PASO 4: Configurar Telegram

### 4.1 Crear Bot con BotFather

1. Abre Telegram en tu móvil o desktop
2. Busca **@BotFather** (es un bot verificado)
3. Inicia una conversación y envía: **/newbot**
4. BotFather te preguntará:
   ```
   BotFather: Alright, a new bot. How are we going to call it? Please choose a name for your bot.

   Tú: Rovi CRM Bot
   ```
5. Luego, el username:
   ```
   BotFather: Good. Now let's choose a username for your bot. It must end in `bot`. Like this, for example: TetrisBot or tetris_bot.

   Tú: rovi_crm_bot
   ```
6. Si el username está disponible, BotFather te dará el token:
   ```
   Use this token to access the HTTP API:
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

   Keep your token secure and store it safely, it can be used by anyone to control your bot.
   ```

### 4.2 Copiar el Token

**IMPORTANTE**: Guarda este token, lo necesitarás:
```
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 4.3 Conectar Telegram a Respond.io

1. En Respond.io, ve a **Settings** → **Channels**
2. Haz clic en **"Add Channel"** → **Telegram**
3. Pega el token del bot:
   ```
   Bot Token: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
4. Haz clic en **"Connect"**
5. Abre Telegram y busca **@rovi_crm_bot** (o el nombre que elegiste)
6. Inicia el bot con **/start**

**✅ CHECKPOINT**: En Settings → Channels, deberías ver Telegram como "Connected"

---

## PASO 5: Obtener API Token

### 5.1 Generar API Token en Respond.io

1. En Respond.io, ve a **Settings** (icono ⚙️)
2. En el menú izquierdo, haz clic en **API**
3. Haz clic en **"Generate Token"**
4. Completa:
   ```
   Token Name: Rovi CRM Integration
   Expiration: Never expire (o selecciona una fecha)
   Permissions:
     ✅ Read Contacts
     ✅ Write Contacts
     ✅ Read Conversations
     ✅ Send Messages
   ```
5. Haz clic en **"Generate"**

### 5.2 Copiar el Token

**IMPORTANTE**: El token se mostrará **UNA SOLA VEZ**. Cópialo ahora:
```
xyz_live_abc123def456ghi789jkl012mno345pqr
```

**GUÁRDALO EN LUGAR SEGURO** - Lo necesitarás para configurar Rovi CRM

**✅ CHECKPOINT**: Tienes tu API Token copiado en el portapapeles

---

## PASO 6: Configurar Webhook

### 6.1 Crear Webhook en Respond.io

1. En Respond.io, ve a **Settings** → **Webhooks**
2. Haz clic en **"Add Webhook"**
3. Completa:

   **Webhook Name**: Rovi CRM Webhook

   **Webhook URL**: ```
   https://srv1318804.hstgr.cloud/api/inbox/webhooks/respond
   ```
   *(O usa tu dominio si tienes uno personalizado)*

   **Webhook Secret**: Crea un secreto seguro:
   ```
   rovi_webhook_secret_2024_prod
   ```

   **Active**: ✅ Enabled

4. En **Events to Send**, selecciona:
   - ✅ **Message received** (message.received)
   - ✅ **Message updated** (message.updated)
   - ✅ **Conversation started** (conversation.started)
   - ✅ **Contact created** (contact.created)

5. Haz clic en **"Create Webhook"**

### 6.2 Guardar el Webhook Secret

Copia el secreto que creaste:
```
rovi_webhook_secret_2024_prod
```

**✅ CHECKPOINT**: Webhook creado y activo en Respond.io

---

## PASO 7: Configurar Variables de Entorno en Rovi

### 7.1 Conectar al Servidor

Conéctate a tu servidor VPS:
```bash
ssh root@srv1318804.hstgr.cloud
```

### 7.2 Navegar al Proyecto

```bash
cd /root/rovi/leadvibes
```

### 7.3 Editar Archivo .env

```bash
nano .env
```

### 7.4 Agregar Variables de Respond.io

Al final del archivo, agrega:

```bash
# ==================== RESPOND.IO INTEGRATION ====================
# API Token de Respond.io (obtenido en Paso 5)
RESPOND_IO_API_TOKEN=xyz_live_abc123def456ghi789jkl012mno345pqr

# Webhook Secret (creado en Paso 6)
RESPOND_IO_WEBHOOK_SECRET=rovi_webhook_secret_2024_prod

# Base URL de la API de Respond.io
RESPOND_IO_BASE_URL=https://api.respond.io/v1

# ==================== OPENAI (OPCIONAL - PARA SUGERENCIAS IA) ====================
# Si quieres usar IA para sugerencias de respuesta, agrega tu clave de OpenAI
# Si no lo agregas, se usarán sugerencias genéricas
OPENAI_API_KEY=sk-tu-clave-openai-aqui

# ==================== WEBSOCKET CONFIGURATION ====================
WS_HEARTBEAT_INTERVAL=30000
```

**IMPORTANTE**: Reemplaza los valores con los tuyos reales:
- `xyz_live_abc123...` → Tu API Token real
- `rovi_webhook_secret_2024_prod` → Tu secreto real

### 7.5 Guardar y Salir

En nano:
- Presiona `Ctrl + O` (guardar)
- Presiona `Enter` (confirmar nombre)
- Presiona `Ctrl + X` (salir)

### 7.6 Reiniciar Backend

```bash
docker compose -f docker-compose.hostinger.yml restart backend
```

### 7.7 Verificar que Backend Reinicie

```bash
docker logs rovi-backend --tail 20
```

Deberías ver:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**✅ CHECKPOINT**: Backend reiniciado sin errores

---

## PASO 8: Probar la Integración

### 8.1 Probar Webhook Manualmente

```bash
curl -X POST https://srv1318804.hstgr.cloud/api/inbox/webhooks/respond \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message.received",
    "data": {
      "id": "test_msg_123",
      "conversationId": "conv_test_123",
      "contactId": "contact_test_123",
      "channelId": "whatsapp",
      "channelType": "whatsapp",
      "text": "Mensaje de prueba desde la consola",
      "contact": {
        "name": "Test User",
        "phones": ["+521234567890"]
      }
    }
  }'
```

**Resultado esperado**:
```json
{
  "status": "success",
  "webhook_id": "...",
  "message": "Webhook recibido exitosamente"
}
```

### 8.2 Probar WebSocket

1. Abre tu navegador: **http://76.13.231.12:3000/inbox**
2. Inicia sesión
3. Abre la consola del navegador (**F12** → Console)
4. Deberías ver:
   ```
   WebSocket conectado
   ```
5. En la UI, debería aparecer:
   - Indicador verde: **"Conectado"**

### 8.3 Enviar Mensaje de Prueba Real

**DESDE WHATSAPP**:

1. Abre WhatsApp en tu teléfono
2. Busca el número de WhatsApp Business configurado
3. Envía un mensaje: **"Hola Rovi CRM, esto es una prueba"**

**VER EN ROVI CRM**:

1. En el Inbox (http://76.13.231.12:3000/inbox)
2. Deberías ver:
   - ✅ Notificación toast: "Nuevo mensaje recibido"
   - ✅ Conversación nueva en la lista
   - ✅ Mensaje en tiempo real

**RESPONDER DESDE ROVI CRM**:

1. Haz clic en la conversación
2. Escribe un mensaje en el campo de texto
3. Presiona **Enter** o haz clic en el botón de enviar
4. Deberías recibir el mensaje en WhatsApp

### 8.4 Probar Instagram DM

1. En Instagram, envía un DM a tu cuenta business: **"Prueba desde Instagram"**
2. En Rovi CRM → Inbox, debería aparecer el mensaje
3. Responde desde Rovi CRM
4. Verifica que recibas la respuesta en Instagram

### 8.5 Probar Telegram

1. En Telegram, busca **@rovi_crm_bot** (o el nombre de tu bot)
2. Envía: **/start**
3. Envía un mensaje: **"Prueba desde Telegram"**
4. En Rovi CRM → Inbox, debería aparecer
5. Responde desde Rovi CRM
6. Verifica que recibas la respuesta en Telegram

**✅ CHECKPOINT FINAL**: Todos los canales funcionando correctamente

---

## Solución de Problemas

### Problema 1: "WebSocket no conecta"

**Síntoma**: Indicador muestra "Desconectado" en rojo

**Solución**:
1. Verificar que el backend esté corriendo:
   ```bash
   docker ps | grep backend
   ```
   Debería mostrar el container "rovi-backend" como "Up"

2. Revisar logs del backend:
   ```bash
   docker logs rovi-backend -f
   ```
   Buscar errores relacionados con WebSocket

3. Verificar que tu JWT token sea válido:
   - Abre la consola del navegador (F12)
   - Ejecuta: `localStorage.getItem('token')`
   - Si es null, cierra sesión y vuelve a entrar

4. Verificar firewall:
   ```bash
   sudo ufw status
   ```
   El puerto 8000 debe estar permitido

### Problema 2: "Webhook no se recibe"

**Síntoma**: Mensajes enviados no aparecen en Rovi CRM

**Solución**:
1. En Respond.io, ve a **Settings** → **Webhooks**
2. Haz clic en tu webhook
3. Revisa **"Recent Deliveries"**
4. Si hay errores, verifica:
   - URL correcta: `https://srv1318804.hstgr.cloud/api/inbox/webhooks/respond`
   - Puerto y dominio accesibles
   - Backend corriendo: `docker ps | grep backend`

5. Revisar logs del backend:
   ```bash
   docker logs rovi-backend | grep webhook
   ```

### Problema 3: "Error al enviar mensaje"

**Síntoma**: Al responder desde Rovi CRM, aparece error

**Solución**:
1. Verificar que `RESPOND_IO_API_TOKEN` esté correcto:
   ```bash
   cat /root/rovi/leadvibes/.env | grep RESPOND_IO_API_TOKEN
   ```

2. En Respond.io, verifica:
   - El canal esté activo (Settings → Channels)
   - El token tenga permisos de "Send Messages"

3. Verificar que el contacto tenga conversación previa:
   - Debes recibir al menos 1 mensaje antes de poder responder
   - Esto es una restricción de WhatsApp/Instagram

4. Revisar logs detallados:
   ```bash
   docker logs rovi-backend -f | grep "send_message"
   ```

### Problema 4: "WhatsApp no conecta"

**Síntoma**: WhatsApp aparece como "Disconnected" en Respond.io

**Solución**:
1. Verificar que el teléfono esté conectado a internet
2. Abrir WhatsApp Business en el teléfono
3. Verificar que el número esté verificado
4. En Respond.io, reconecta el canal:
   - Settings → Channels → WhatsApp → ⚙️ → Reconnect

5. Si el problema persiste, contacta a soporte de Respond.io

### Problema 5: "Instagram DM no funciona"

**Síntoma**: Mensajes de Instagram no llegan

**Solución**:
1. Verificar que la cuenta sea **Business** o **Creator**
2. Verificar que esté conectada a una Facebook Page
3. En Instagram, verifica:
   - Configuración → Privacidad → Mensajes
   - "Permitir recibos de lectura" puede estar activado
   - "Permitir mensajes de todos" debe estar activado

4. Reconectar el canal en Respond.io

---

## Resumen de Variables Necesarias

Después de completar todos los pasos, deberías tener:

```bash
# Credenciales de Respond.io (GUARDADAS EN LUGAR SEGURO)
RESPOND_IO_API_TOKEN=xyz_live_abc123def456ghi789jkl012mno345pqr
RESPOND_IO_WEBHOOK_SECRET=rovi_webhook_secret_2024_prod
```

**Guarda estas credenciales en tu gestor de contraseñas** (LastPass, 1Password, etc.)

---

## Tiempos Estimados

| Paso | Tiempo Estimado |
|------|----------------|
| Crear cuenta Respond.io | 10 minutos |
| Configurar WhatsApp | 30 minutos - 5 días* |
| Configurar Instagram | 20 minutos |
| Configurar Telegram | 15 minutos |
| Obtener API Token | 5 minutos |
| Configurar Webhook | 10 minutos |
| Configurar variables de entorno | 10 minutos |
| Probar integración | 20 minutos |
| **TOTAL** | **~2 horas** (sin esperar aprobación de WhatsApp) |

*WhatsApp Business API puede tomar 1-5 días hábiles en ser aprobado por Facebook

---

## Próximos Pasos Después de la Configuración

1. **Semana 1**: Monitorear uso y errores
2. **Semana 2**: Configurar plantillas de respuesta
3. **Semana 3**: Activar sugerencias de IA
4. **Semana 4**: Implementar respuestas automáticas

---

## Soporte

Si encuentras algún problema:

1. **Documentación**: https://developer.respond.io/
2. **Soporte Respond.io**: support@respond.io
3. **Issues de Rovi**: https://github.com/softvibeslab/leadvibes/issues
4. **Logs del sistema**:
   ```bash
   docker logs rovi-backend -f
   docker logs rovi-frontend -f
   ```

---

¡Felicidades! 🎉 Al completar esta guía, tendrás un sistema de Inbox centralizado completamente funcional para Rovi CRM.