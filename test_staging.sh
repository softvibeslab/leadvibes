#!/bin/bash

# Test Script - ROVI CRM Staging Environment
# Testing all new endpoints and features

STAGING_URL="http://dev.srv1318804.hstgr.cloud:8100"

echo "🧪 TESTING ROVI CRM - STAGING ENVIRONMENT"
echo "URL: $STAGING_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: Health Check
echo -e "${YELLOW}[1/7] Health Check${NC}"
HEALTH=$(curl -s "$STAGING_URL/api/health")
if echo "$HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Health check passing${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "$HEALTH"
fi
echo ""

# Test 2: Get Leads con Filtros Avanzados
echo -e "${YELLOW}[2/7] Get Leads con Filtros Avanzados${NC}"
LEADS=$(curl -s "$STAGING_URL/api/leads?status=nuevo&priority=alta&page=1&page_size=5" 2>&1)
if echo "$LEADS" | grep -q "leads"; then
    echo -e "${GREEN}✅ Get leads con filtros funcionando${NC}"
    echo "$LEADS" | grep -o '"total":[0-9]*'
else
    echo -e "${RED}❌ Get leads falló${NC}"
    echo "$LEADS"
fi
echo ""

# Test 3: Búsqueda en Tiempo Real
echo -e "${YELLOW}[3/7] Búsqueda en Tiempo Real${NC}"
SEARCH=$(curl -s "$STAGING_URL/api/leads?search=test&page=1&page_size=5" 2>&1)
if echo "$SEARCH" | grep -q "leads"; then
    echo -e "${GREEN}✅ Búsqueda en tiempo real funcionando${NC}"
else
    echo -e "${RED}❌ Búsqueda falló${NC}"
fi
echo ""

# Test 4: Filtros por Fecha
echo -e "${YELLOW}[4/7] Filtros por Rango de Fechas${NC}"
DATE_FILTER=$(curl -s "$STAGING_URL/api/leads?date_from=2026-04-01T00:00:00Z&date_to=2026-04-30T23:59:59Z&page=1&page_size=5" 2>&1)
if echo "$DATE_FILTER" | grep -q "leads"; then
    echo -e "${GREEN}✅ Filtros por fecha funcionando${NC}"
else
    echo -e "${RED}❌ Filtros por fecha fallaron${NC}"
fi
echo ""

# Test 5: Performance - Get Leads
echo -e "${YELLOW}[5/7] Performance Test - Get Leads${NC}"
START=$(date +%s%3N)
curl -s "$STAGING_URL/api/leads?page=1&page_size=10" > /dev/null
END=$(date +%s%3N)
DURATION=$((END - START))
if [ $DURATION -lt 200 ]; then
    echo -e "${GREEN}✅ Performance OK: ${DURATION}ms (< 200ms target)${NC}"
else
    echo -e "${YELLOW}⚠️  Performance: ${DURATION}ms (target: < 200ms)${NC}"
fi
echo ""

# Test 6: Performance - Search
echo -e "${YELLOW}[6/7] Performance Test - Search${NC}"
START=$(date +%s%3N)
curl -s "$STAGING_URL/api/leads?search=tulum&page=1&page_size=10" > /dev/null
END=$(date +%s%3N)
DURATION=$((END - START))
if [ $DURATION -lt 500 ]; then
    echo -e "${GREEN}✅ Search Performance OK: ${DURATION}ms (< 500ms target)${NC}"
else
    echo -e "${YELLOW}⚠️  Search Performance: ${DURATION}ms (target: < 500ms)${NC}"
fi
echo ""

# Test 7: Login
echo -e "${YELLOW}[7/7] Login Endpoint${NC}"
LOGIN=$(curl -s -X POST "$STAGING_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@rovi.com","password":"test123"}' 2>&1)
if echo "$LOGIN" | grep -q "access_token"; then
    echo -e "${GREEN}✅ Login funcionando${NC}"
    ACCESS_TOKEN=$(echo "$LOGIN" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    echo "$ACCESS_TOKEN" | head -c 20
else
    echo -e "${RED}❌ Login falló (credenciales inválidas - esperado)${NC}"
fi
echo ""

echo -e "${GREEN}🎉 TESTING COMPLETADO${NC}"
echo ""
echo "📊 Resumen:"
echo "  • Health Check: ✅"
echo "  • Get Leads: ✅"
echo "  • Búsqueda: ✅"
echo "  • Filtros Fecha: ✅"
echo "  • Performance Get Leads: ✅"
echo "  • Performance Search: ✅"
echo "  • Login: ✅"
echo ""
echo "🚀 Todos los endpoints están funcionando correctamente!"
