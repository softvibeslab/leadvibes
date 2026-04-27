#!/bin/bash

# Script para probar el sistema de webhooks del entorno staging

echo "🧪 Testing Webhook System"
echo "=========================="

# Configuración
WEBHOOK_URL="http://localhost:2906/webhooks/lead"
BACKEND_URL="http://localhost:1607"
EXAMPLE_FILE="webhook_lead_example.json"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar que staging esté corriendo
echo ""
echo "1️⃣ Verificando entorno de staging..."
if curl -sf http://localhost:2403 >/dev/null; then
    echo -e "${GREEN}✅ Frontend staging correando (puerto 2403)${NC}"
else
    echo -e "${RED}❌ Frontend staging no correando${NC}"
    echo "   Ejecuta: ./scripts/staging-deploy.sh up"
    exit 1
fi

if curl -sf "$BACKEND_URL/api/health" >/dev/null; then
    echo -e "${GREEN}✅ Backend staging correando (puerto 1607)${NC}"
else
    echo -e "${RED}❌ Backend staging no correando${NC}"
    exit 1
fi

if curl -sf http://localhost:2906/webhooks/health >/dev/null; then
    echo -e "${GREEN}✅ Webhook server correando (puerto 2906)${NC}"
else
    echo -e "${YELLOW}⚠️  Webhook server no correando${NC}"
fi

# Verificar archivo de ejemplo
echo ""
echo "2️⃣ Verificando archivo de ejemplo..."
if [[ -f "$EXAMPLE_FILE" ]]; then
    echo -e "${GREEN}✅ Archivo encontrado: $EXAMPLE_FILE${NC}"
else
    echo -e "${RED}❌ Archivo no encontrado: $EXAMPLE_FILE${NC}"
    exit 1
fi

# Enviar webhook de prueba
echo ""
echo "3️⃣ Enviando webhook de prueba..."
echo "   URL: $WEBHOOK_URL"
echo "   Archivo: $EXAMPLE_FILE"

RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d @"$EXAMPLE_FILE")

echo ""
echo "📋 Respuesta:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Verificar si el lead fue creado
if echo "$RESPONSE" | grep -q "success"; then
    echo ""
    echo -e "${GREEN}✅ Webhook procesado exitosamente${NC}"

    LEAD_ID=$(echo "$RESPONSE" | jq -r '.lead_id // empty')
    LEAD_NAME=$(echo "$RESPONSE" | jq -r '.lead_name // empty')
    LEAD_SCORE=$(echo "$RESPONSE" | jq -r '.lead_score // empty')

    echo "   Lead ID: $LEAD_ID"
    echo "   Nombre: $LEAD_NAME"
    echo "   Score: $LEAD_SCORE"

    # Verificar que el lead esté en la base de datos
    echo ""
    echo "4️⃣ Verificando lead en base de datos..."

    # Login para obtener token
    TOKEN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@rovi.crm","password":"admin123"}')

    if echo "$TOKEN_RESPONSE" | grep -q "access_token"; then
        TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')

        # Buscar el lead creado
        LEADS_RESPONSE=$(curl -s -X GET "$BACKEND_URL/api/leads" \
            -H "Authorization: Bearer $TOKEN")

        # Buscar lead por nombre
        CREATED_LEAD=$(echo "$LEADS_RESPONSE" | jq ".[] | select(.name == \"$LEAD_NAME\")")

        if [[ -n "$CREATED_LEAD" ]]; then
            echo -e "${GREEN}✅ Lead encontrado en base de datos${NC}"
            echo "$CREATED_LEAD" | jq '.'
        else
            echo -e "${YELLOW}⚠️  Lead no encontrado en búsqueda (puede ser por filtrado)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  No se pudo verificar en base de datos (login falló)${NC}"
        echo "   Intenta login manual para verificar:"
        echo "   Usuario: admin@rovi.crm / admin123"
    fi

else
    echo ""
    echo -e "${RED}❌ Error al procesar webhook${NC}"
    echo "   Revisa los logs: ./scripts/staging-deploy.sh logs"
fi

# Información adicional
echo ""
echo "5️⃣ Información del sistema:"
echo "   🌐 Frontend staging:  http://localhost:2403"
echo "   🔧 Backend staging:   http://localhost:1607"
echo "   🪝 Webhook server:    http://localhost:2906"
echo "   🐳 MongoDB staging:   localhost:2504"

echo ""
echo "📋 Comandos útiles:"
echo "   ./scripts/staging-deploy.sh logs webhook-server  # Ver logs del webhook"
echo "   ./scripts/staging-deploy.sh mongo                 # Acceder a MongoDB staging"
echo "   ./scripts/staging-deploy.sh status                # Ver status general"
echo "   ./scripts/staging-deploy.sh reset                 # Resetear todo el entorno"

echo ""
echo "✨ Testing completado!"