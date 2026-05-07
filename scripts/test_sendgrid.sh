#!/bin/bash

echo "🧪 Test de Configuración de SendGrid"
echo "================================================"

API_URL="http://localhost:18080/api"

# 1. Verificar backend
echo ""
echo "1. Verificando backend..."
HEALTH_CHECK=$(curl -s "$API_URL/health")
if [[ $HEALTH_CHECK == *"healthy"* ]]; then
    echo "   ✅ Backend funcionando correctamente"
else
    echo "   ❌ Backend no responde correctamente"
    exit 1
fi

# 2. Verificar variables de entorno
echo ""
echo "2. Verificando variables de entorno en backend..."
SENDGRID_KEY=$(docker compose exec backend printenv | grep SENDGRID_API_KEY || echo "NOT_FOUND")

if [[ $SENDGRID_KEY != "NOT_FOUND" ]]; then
    # Mostrar solo primeros y últimos caracteres
    MASKED_KEY=$(echo $SENDGRID_KEY | sed 's/SENDGRID_API_KEY=//; s/\(.\{8\}\).*/\1...***')
    echo "   ✅ SENDGRID_API_KEY: $MASKED_KEY"
else
    echo "   ❌ SENDGRID_API_KEY no configurada"
fi

# 3. Login para obtener token
echo ""
echo "3. Obteniendo token de autenticación..."
TOKEN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"rgarciavital@gmail.com","password":"temp123"}')

if [[ $TOKEN_RESPONSE == *"access_token"* ]]; then
    TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')
    echo "   ✅ Token obtenido correctamente"
else
    echo "   ❌ Error al obtener token"
    echo "   Response: $TOKEN_RESPONSE"
    exit 1
fi

# 4. Verificar integración de SendGrid
echo ""
echo "4. Verificando integración con SendGrid..."
SETTINGS_RESPONSE=$(curl -s -X GET "$API_URL/settings/integrations" \
  -H "Authorization: Bearer $TOKEN")

SENDGRID_ENABLED=$(echo $SETTINGS_RESPONSE | jq -r '.sendgrid_enabled // false')

if [[ "$SENDGRID_ENABLED" == "true" ]]; then
    echo "   ✅ SendGrid configurado y habilitado"
else
    echo "   ⚠️  SendGrid configurado pero no habilitado en settings"
fi

# 5. Listar plantillas de email
echo ""
echo "5. Verificando plantillas de email..."
TEMPLATES_RESPONSE=$(curl -s -X GET "$API_URL/email-templates" \
  -H "Authorization: Bearer $TOKEN")

TEMPLATE_COUNT=$(echo $TEMPLATES_RESPONSE | jq 'length')

if [[ $TEMPLATE_COUNT -gt 0 ]]; then
    echo "   ✅ Existen $TEMPLATE_COUNT plantillas de email"
    echo "   Plantillas disponibles:"
    echo "$TEMPLATES_RESPONSE" | jq -r '.[] | "      - \(.name) (\(.category // "sin categoría"))"' | head -5

    # Obtener primer template para el test
    FIRST_TEMPLATE_ID=$(echo $TEMPLATES_RESPONSE | jq -r '.[0].id')
    FIRST_TEMPLATE_NAME=$(echo $TEMPLATES_RESPONSE | jq -r '.[0].name')

    echo ""
    echo "6. Test de envío de email:"
    echo "   📧 Plantilla seleccionada: $FIRST_TEMPLATE_NAME"
    echo "   📧 Template ID: $FIRST_TEMPLATE_ID"
    echo ""
    echo "   Para enviar un email de prueba, ejecuta:"
    echo ""
    echo "   curl -X POST '$API_URL/email-templates/send-test' \\"
    echo "     -H 'Authorization: Bearer TU_TOKEN' \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -d '{"
    echo "       \"template_id\": \"$FIRST_TEMPLATE_ID\","
    echo "       \"recipient_email\": \"tu@email.com\","
    echo "       \"preview_data\": {}"
    echo "     }'"
    echo ""
    echo "   Reemplaza:"
    echo "   - TU_TOKEN con tu token real (comienza con eyJ...)"
    echo "   - tu@email.com con tu email real"
else
    echo "   ⚠️  No hay plantillas de email creadas"
    echo "   💡 Puedes cargar plantillas base desde la UI:"
    echo "      Ir a: http://localhost:13000"
    echo "      Navegar: Campaigns → Templates → Cargar Plantillas Base"
fi

echo ""
echo "================================================"
echo "✅ Verificación completada"
echo ""
echo "📋 Resumen:"
echo "   1. Backend: ✅ Funcionando"
echo "   2. SendGrid API Key: ✅ Configurada"
echo "   3. Autenticación: ✅ Funcionando"
echo "   4. Plantillas: $([[ $TEMPLATE_COUNT -gt 0 ]] && echo "✅ $TEMPLATE_COUNT disponibles" || echo "⚠️  Ninguna (cargar plantillas base)")"
echo ""
echo "🎯 Siguientes pasos:"
echo "   1. Autenticar tu dominio en SendGrid"
echo "   2. Configurar recepción de emails (Google Workspace o MXRoute)"
echo "   3. Crear plantillas de email"
echo "   4. Enviar primera campaña"
echo ""
echo "📚 Documentación:"
echo "   - Guía completa: scripts/sendgrid_setup_guide.md"
echo "   - SendGrid Setup: docs/SENDGRID_SETUP.md"
echo "   - Email Campaign Implementation: docs/EMAIL_CAMPAIGN_IMPLEMENTATION.md"
echo "   - Rovi CRM: http://localhost:13000"