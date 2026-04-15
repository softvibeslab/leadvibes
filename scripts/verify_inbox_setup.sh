#!/bin/bash

# Script de verificación de configuración del Inbox Rovi CRM
# Este script verifica que todos los componentes estén correctamente configurados

echo "================================"
echo "🔍 VERIFICANDO CONFIGURACIÓN INBOX ROVI CRM"
echo "================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
PASS=0
FAIL=0
WARN=0

# Función para verificar paso
check_step() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
        ((PASS++))
    else
        echo -e "${RED}✗ $2${NC}"
        ((FAIL++))
    fi
}

# Función para advertencia
warn_step() {
    echo -e "${YELLOW}⚠ $1${NC}"
    ((WARN++))
}

echo "📋 VERIFICANDO COMPONENTES DEL SISTEMA..."
echo ""

# 1. Verificar Docker containers
echo "1️⃣  Verificando Docker containers..."
docker ps | grep -q "rovi-backend"
check_step $? "Backend container corriendo"

docker ps | grep -q "rovi-frontend"
check_step $? "Frontend container corriendo"

docker ps | grep -q "rovi-mongodb"
check_step $? "MongoDB container corriendo"

echo ""

# 2. Verificar archivos clave
echo "2️⃣  Verificando archivos de código..."
if [ -f "/root/rovi/leadvibes/backend/services/respond_io_service.py" ]; then
    check_step 0 "Servicio Respond.io existe"
else
    check_step 1 "Servicio Respond.io NO existe"
fi

if [ -f "/root/rovi/leadvibes/backend/services/message_normalizer.py" ]; then
    check_step 0 "Message normalizer existe"
else
    check_step 1 "Message normalizer NO existe"
fi

if [ -f "/root/rovi/leadvibes/backend/services/inbox_ai_service.py" ]; then
    check_step 0 "Inbox AI service existe"
else
    check_step 1 "Inbox AI service NO existe"
fi

if [ -f "/root/rovi/leadvibes/frontend/src/components/InboxWebSocket.js" ]; then
    check_step 0 "WebSocket hook existe"
else
    check_step 1 "WebSocket hook NO existe"
fi

echo ""

# 3. Verificar endpoints del backend
echo "3️⃣  Verificando endpoints del backend..."
curl -s http://localhost:8000/api/health > /dev/null 2>&1
check_step $? "Backend health endpoint responde"

echo ""

# 4. Verificar variables de entorno
echo "4️⃣  Verificando configuración..."
if [ -f "/root/rovi/leadvibes/.env" ]; then
    echo -e "${GREEN}✓ Archivo .env existe${NC}"
    ((PASS++))

    # Verificar variables de Respond.io
    if grep -q "RESPOND_IO_API_TOKEN=" /root/rovi/leadvibes/.env; then
        if grep -q "RESPOND_IO_API_TOKEN=$" /root/rovi/leadvibes/.env || ! grep -q "RESPOND_IO_API_TOKEN=xyz" /root/rovi/leadvibes/.env; then
            check_step 0 "RESPOND_IO_API_TOKEN configurado"
        else
            warn_step "RESPOND_IO_API_TOKEN está en valor por defecto (debe configurarse)"
        fi
    else
        warn_step "RESPOND_IO_API_TOKEN NO está configurado en .env"
    fi

    if grep -q "RESPOND_IO_WEBHOOK_SECRET=" /root/rovi/leadvibes/.env; then
        if ! grep -q "RESPOND_IO_WEBHOOK_SECRET=rovi_webhook_secret" /root/rovi/leadvibes/.env; then
            check_step 0 "RESPOND_IO_WEBHOOK_SECRET configurado"
        else
            warn_step "RESPOND_IO_WEBHOOK_SECRET está en valor por defecto (debe configurarse)"
        fi
    else
        warn_step "RESPOND_IO_WEBHOOK_SECRET NO está configurado en .env"
    fi

    # Verificar OpenAI (opcional)
    if grep -q "OPENAI_API_KEY=" /root/rovi/leadvibes/.env; then
        if ! grep -q "OPENAI_API_KEY=sk-tu" /root/rovi/leadvibes/.env; then
            echo -e "${GREEN}✓ OPENAI_API_KEY configurado (opcional)${NC}"
        else
            echo -e "${YELLOW}⚠ OPENAI_API_KEY en valor por defecto (opcional - usar solo si se desea IA)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ OPENAI_API_KEY NO configurado (opcional - se usarán sugerencias genéricas)${NC}"
    fi
else
    echo -e "${RED}✗ Archivo .env NO existe${NC}"
    ((FAIL++))
fi

echo ""

# 5. Verificar acceso desde el exterior
echo "5️⃣  Verificando acceso externo..."
curl -s http://76.13.231.12:8000/api/health > /dev/null 2>&1
check_step $? "Backend accesible desde internet"

curl -s http://76.13.231.12:3000 > /dev/null 2>&1
check_step $? "Frontend accesible desde internet"

echo ""

# 6. Verificar configuración de WebSocket
echo "6️⃣  Verificando configuración WebSocket..."
if grep -q "WebSocket" /root/rovi/leadvibes/backend/server.py; then
    check_step 0 "WebSocket importado en server.py"
else
    check_step 1 "WebSocket NO importado en server.py"
fi

if grep -q "/ws/inbox" /root/rovi/leadvibes/backend/server.py; then
    check_step 0 "WebSocket endpoint configurado"
else
    check_step 1 "WebSocket endpoint NO configurado"
fi

echo ""

# 7. Verificar endpoint de webhook
echo "7️⃣  Verificando endpoint de webhook..."
if grep -q "/inbox/webhooks/respond" /root/rovi/leadvibes/backend/server.py; then
    check_step 0 "Webhook endpoint configurado"
else
    check_step 1 "Webhook endpoint NO configurado"
fi

echo ""

# 8. Verificar colecciones de MongoDB (requiere MongoDB corriendo)
echo "8️⃣  Verificando MongoDB..."
docker exec rovi-mongodb mongosh --eval "db.adminCommand('listCollections')" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ MongoDB está corriendo${NC}"
    ((PASS++))

    # Verificar si existen colecciones del inbox
    COLLECTIONS=$(docker exec rovi-mongodb mongosh rovi_crm --eval "db.getCollectionNames()" --quiet 2>/dev/null | grep -o "conversation_messages\|inbox_webhooks" | wc -l)

    if [ $COLLECTIONS -gt 0 ]; then
        echo -e "${GREEN}✓ Colecciones del inbox detectadas${NC}"
        ((PASS++))
    else
        echo -e "${YELLOW}⚠ Colecciones del inbox aún no creadas (se crearán al primer mensaje)${NC}"
        ((WARN++))
    fi
else
    echo -e "${RED}✗ MongoDB NO está corriendo${NC}"
    ((FAIL++))
fi

echo ""

# Resumen
echo "================================"
echo "📊 RESUMEN DE VERIFICACIÓN"
echo "================================"
echo -e "${GREEN}✓ Pasos exitosos: $PASS${NC}"
echo -e "${RED}✗ Errores: $FAIL${NC}"
echo -e "${YELLOW}⚠ Advertencias: $WARN${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡SISTEMA CONFIGURADO CORRECTAMENTE!${NC}"
    echo ""
    echo "✅ Próximos pasos:"
    echo "1. Configurar cuenta en Respond.io"
    echo "2. Obtener API Token y Webhook Secret"
    echo "3. Actualizar variables de entorno en .env"
    echo "4. Reiniciar backend: docker compose -f docker-compose.hostinger.yml restart backend"
    echo "5. Probar enviando un mensaje desde WhatsApp/Instagram/Telegram"
    echo ""
    echo "📖 Guía completa: docs/INBOX_QUICK_START.md"
else
    echo -e "${RED}❌ HAY ERRORES QUE DEBEN CORREGIRSE${NC}"
    echo ""
    echo "Por favor revisa los errores marcados con ✗ arriba"
    echo "Si necesitas ayuda, consulta: docs/RESPOND_IO_SETUP_GUIDE.md"
fi

echo ""
echo "================================"
echo "🔗 URLs ÚTILES"
echo "================================"
echo "Frontend: http://76.13.231.12:3000"
echo "Backend: http://76.13.231.12:8000/api/health"
echo "Inbox: http://76.13.231.12:3000/inbox"
echo "Webhook URL: https://srv1318804.hstgr.cloud/api/inbox/webhooks/respond"
echo ""

# Salir con código apropiado
if [ $FAIL -gt 0 ]; then
    exit 1
else
    exit 0
fi