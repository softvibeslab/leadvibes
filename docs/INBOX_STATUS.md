# 🎯 GUÍA DE CONFIGURACIÓN - Inbox Rovi CRM + Respond.io

## ✅ ESTADO ACTUAL DEL SISTEMA

### Componentes Implementados y Funcionales

| Componente | Estado | Notas |
|------------|--------|-------|
| **Backend** | ✅ Funcionando | Todos los endpoints activos |
| **Frontend** | ✅ Funcionando | WebSocket listo para conectar |
| **MongoDB** | ✅ Funcionando | Base de datos lista |
| **Código** | ✅ Implementado | Todos los servicios creados |
| **Docker** | ✅ Corriendo | Containers activos |

### Lo Que Falta Configurar

Solo necesitas configurar las credenciales de Respond.io:

1. **Cuenta en Respond.io** - Crear cuenta y obtener API Token
2. **Canales** - Conectar WhatsApp, Instagram, Telegram
3. **Webhook** - Configurar URL en Respond.io
4. **Variables de entorno** - Agregar credenciales al servidor

---

## 📋 PASO A PASO - CONFIGURACIÓN EN 30 MINUTOS

### PASO 1: Crear Cuenta en Respond.io (5 min)

1. Ve a: **https://respond.io**
2. Haz clic en **"Start Free Trial"**
3. Regístrate con tu email business
4. Selecciona el plan **Growth** ($159/mes)
5. Completa el pago

### PASO 2: Configurar Canales (15 min)

#### WhatsApp
- Settings → Channels → Add Channel → WhatsApp
- Conecta tu WhatsApp Business
- **NOTA**: Puede tomar 1-5 días en ser aprobado por Facebook

#### Instagram
- Convierte tu cuenta de Instagram a Business
- Settings → Channels → Add Channel → Instagram
- Conecta con Facebook

#### Telegram
- Chat con **@BotFather** en Telegram
- Envía: **/newbot**
- Sigue las instrucciones
- Copia el token que te da
- Settings → Channels → Add Channel → Telegram
- Pega el token

### PASO 3: Obtener Credenciales (5 min)

#### API Token
```
Settings → API → Generate Token
→ Token Name: Rovi CRM Integration
→ Permissions: ✅ Read ✅ Write ✅ Send
→ COPIA EL TOKEN (se muestra una sola vez)
```

#### Webhook Secret
```
Settings → Webhooks → Add Webhook
→ Webhook Name: Rovi CRM Webhook
→ URL: https://srv1318804.hstgr.cloud/api/inbox/webhooks/respond
→ Secret: rovi_webhook_secret_2024_prod
→ Events: ✅ message.received ✅ message.updated
→ COPIA EL SECRET
```

### PASO 4: Configurar en el Servidor (5 min)

Conéctate al servidor:
```bash
ssh root@srv1318804.hstgr.cloud
```

Navega al proyecto:
```bash
cd /root/rovi/leadvibes
```

Edita el archivo .env:
```bash
nano .env
```

Agrega al final del archivo:
```bash
# Respond.io Configuration
RESPOND_IO_API_TOKEN=tu_token_aqui
RESPOND_IO_WEBHOOK_SECRET=tu_secreto_aqui
RESPOND_IO_BASE_URL=https://api.respond.io/v1

# OpenAI (opcional - para IA)
OPENAI_API_KEY=sk-tu-clave-aqui
```

Guarda (Ctrl+O, Enter, Ctrl+X)

Reinicia el backend:
```bash
docker compose -f docker-compose.hostinger.yml restart backend
```

### PASO 5: Probar (2 min)

1. Abre tu navegador: **http://76.13.231.12:3000/inbox**
2. Inicia sesión
3. Deberías ver **"Conectado"** en verde
4. Envía un WhatsApp al número configurado
5. El mensaje debería aparecer en el Inbox

---

## 🔗 URLS QUE NECESITARÁS

### Para Configurar Respond.io

**Webhook URL**:
```
https://srv1318804.hstgr.cloud/api/inbox/webhooks/respond
```

### Para Acceder a Rovi CRM

**Frontend**:
```
http://76.13.231.12:3000
```

**Inbox**:
```
http://76.13.231.12:3000/inbox
```

**Backend Health**:
```
http://76.13.231.12:8000/api/health
```

---

## 💰 COSTOS MENSUALES

| Servicio | Costo |
|----------|-------|
| Respond.io Growth | $159 USD |
| WhatsApp (~500 convs) | ~$30 USD |
| OpenAI (opcional) | ~$20-50 USD |
| **TOTAL** | **~$180-240 USD** |

✅ **Dentro de tu presupuesto de $100-500 USD**

---

## 📚 DOCUMENTACIÓN COMPLETA

### Guías Disponibles

1. **INBOX_QUICK_START.md** - Resumen rápido (esta guía)
2. **RESPOND_IO_SETUP_GUIDE.md** - Guía paso a paso detallada
3. **INBOX_SETUP.md** - Documentación técnica completa

### Ejecutar Script de Verificación

```bash
/root/rovi/leadvibes/scripts/verify_inbox_setup.sh
```

Este script verificará que todo esté funcionando correctamente.

---

## ❓ PREGUNTAS FRECUENTES

### ¿Cuánto tiempo toma la configuración?
**Sin aprobación de WhatsApp**: ~30 minutos
**Con aprobación de WhatsApp**: 1-5 días (espera de Facebook)

### ¿Puedo usar solo algunos canales?
Sí, puedes comenzar con Telegram (que es gratis y se aprueba instantáneamente) y agregar WhatsApp/Instagram después.

### ¿Qué pasa si no configuro OpenAI?
El sistema funcionará con sugerencias genéricas de respuesta. OpenAI es opcional para respuestas más inteligentes.

### ¿Puedo cambiar el plan de Respond.io después?
Sí, puedes hacer upgrade o downgrade en cualquier momento.

### ¿Los mensajes se guardan aunque no configure Respond.io?
Sí, los mensajes se guardan en MongoDB, pero no se envían realmente a los clientes hasta que configures Respond.io.

---

## 🆘 SI NECESITAS AYUDA

### Soporte Técnico

- **Issues**: https://github.com/softvibeslab/leadvibes/issues
- **Email**: soporte@rovi.crm

### Verificación de Errores

Si algo no funciona, ejecuta:
```bash
docker logs rovi-backend -f
```

Y busca errores relacionados con:
- `webhook`
- `respond_io`
- `websocket`

---

## ✅ CHECKLIST FINAL

Antes de empezar, asegúrate de tener:

- [ ] Acceso al servidor (SSH)
- [ ] Tarjeta de crédito para Respond.io
- [ ] Número de WhatsApp Business
- [ ] Cuenta de Instagram Business
- [ ] Teléfono con Telegram instalado
- [ ] 30 minutos de tiempo

---

## 🎯 LISTO PARA EMPEZAR

Sigue los pasos 1-5 de esta guía y tendrás tu Inbox centralizado funcionando.

Para instrucciones más detalladas, consulta: **[RESPOND_IO_SETUP_GUIDE.md](docs/RESPOND_IO_SETUP_GUIDE.md)**

¡Buena suerte! 🚀