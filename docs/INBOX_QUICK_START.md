# 🚀 CONFIGURACIÓN RÁPIDA - Inbox Rovi CRM + Respond.io

## Resumen en 5 Minutos

### ¿Qué necesitas?
1. Cuenta en [Respond.io](https://respond.io) (~$159/mes)
2. 30 minutos de tu tiempo
3. Número de WhatsApp Business
4. Cuenta de Instagram Business
5. Token de API y Webhook Secret

---

## PASOS RÁPIDOS

### 1️⃣ CREAR CUENTA RESPOND.IO (5 min)
```
1. Ve a https://respond.io
2. Regístrate con email business
3. Selecciona plan Growth ($159/mes)
4. Verifica email
```

### 2️⃣ CONFIGURAR CANALES (20 min)

**WhatsApp**:
- Settings → Channels → Add Channel → WhatsApp
- Conecta tu WhatsApp Business
- Espera aprobación (1-5 días hábiles)

**Instagram**:
- Convierte tu cuenta a Business/Creator
- Settings → Channels → Add Channel → Instagram
- Conecta con Facebook

**Telegram**:
- Chat con @BotFather → /newbot
- Copia el token
- Settings → Channels → Add Channel → Telegram
- Pega el token

### 3️⃣ OBTENER CREDENCIALES (5 min)

**API Token**:
```
Settings → API → Generate Token
→ Copia el token (GUARDAR)
```

**Webhook Secret**:
```
Settings → Webhooks → Add Webhook
→ URL: https://srv1318804.hstgr.cloud/api/inbox/webhooks/respond
→ Secret: rovi_webhook_secret_2024_prod
→ Events: ✅ message.received, ✅ message.updated
→ Copia el secret (GUARDAR)
```

### 4️⃣ CONFIGURAR ROVI CRM (5 min)

En el servidor:
```bash
# 1. Conectar al servidor
ssh root@srv1318804.hstgr.cloud

# 2. Navegar al proyecto
cd /root/rovi/leadvibes

# 3. Editar .env
nano .env

# 4. Agregar al final:
RESPOND_IO_API_TOKEN=tu_token_aqui
RESPOND_IO_WEBHOOK_SECRET=tu_secreto_aqui
RESPOND_IO_BASE_URL=https://api.respond.io/v1

# 5. Guardar (Ctrl+O, Enter, Ctrl+X)

# 6. Reiniciar backend
docker compose -f docker-compose.hostinger.yml restart backend
```

### 5️⃣ PROBAR (2 min)

```bash
# 1. Abrir en navegador
http://76.13.231.12:3000/inbox

# 2. Verificar "Conectado" en verde

# 3. Enviar WhatsApp al número configurado:
"Hola Rovi, prueba"

# 4. Deberías ver:
✅ Notificación toast
✅ Mensaje en inbox
✅ Podrás responder
```

---

## ✅ CHECKLIST DE CONFIGURACIÓN

- [ ] Cuenta creada en Respond.io
- [ ] Plan Growth activado
- [ ] WhatsApp conectado (o en proceso de aprobación)
- [ ] Instagram conectado
- [ ] Telegram conectado
- [ ] API Token generado y copiado
- [ ] Webhook configurado
- [ ] Variables de entorno actualizadas
- [ ] Backend reiniciado
- [ ] WebSocket conectado
- [ ] Mensaje de prueba enviado y recibido

---

## COSTOS TOTALES

| Servicio | Costo Mensual |
|----------|---------------|
| Respond.io Growth | $159 USD |
| WhatsApp (500 convs) | ~$30 USD |
| **TOTAL** | **~$189 USD** |

---

## ¿NECESITAS AYUDA?

### Guía Completa
📖 **[GUIA PASO A PASO DETALLADA](docs/RESPOND_IO_SETUP_GUIDE.md)**

### Soporte
- 📧 Email: soporte@rovi.crm
- 🐛 Issues: [GitHub Issues](https://github.com/softvibeslab/leadvibes/issues)
- 📚 Docs: [docs/INBOX_SETUP.md](docs/INBOX_SETUP.md)

### Problemas Comunes

**"WebSocket no conecta"**:
```bash
docker logs rovi-backend | grep -i websocket
```

**"Webhook no funciona"**:
```bash
# Verificar que backend esté escuchando
curl http://localhost:8000/api/health
```

**"Error al enviar mensaje"**:
```bash
# Verificar API token
cat /root/rovi/leadvibes/.env | grep RESPOND_IO
```

---

## TIEMPO TOTAL ESTIMADO

**Sin aprobación de WhatsApp**: ~45 minutos
**Con aprobación de WhatsApp**: ~1-5 días (espera de Facebook)

---

## 🎯 LISTO PARA EMPEZAR

Sigue la **[Guía Completa](docs/RESPOND_IO_SETUP_GUIDE.md)** para instrucciones detalladas con capturas de pantalla y solución de problemas.

¡Buena suerte! 🚀