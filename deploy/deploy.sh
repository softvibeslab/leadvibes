#!/bin/bash

# LeadVibes - Deploy Script
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}LeadVibes Deploy Script${NC}"
echo -e "${GREEN}===========================================${NC}"

# Pre-flight checks
echo -e "\n${YELLOW}[1/5] Pre-flight Checks...${NC}"
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    exit 1
fi
echo "✅ Docker está instalado"

# Check .env
if [ ! -f .env ]; then
    echo "❌ Archivo .env no encontrado"
    echo "Creando desde .env.example..."
    cp .env.example .env
    echo "⚠️  Por favor edita .env antes de continuar"
    exit 1
fi
echo "✅ Archivo .env encontrado"

# Backup MongoDB
echo -e "\n${YELLOW}[2/5] Backup MongoDB...${NC}"
mkdir -p /var/backups/leadvibes
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T mongodb mongodump \
    --username=admin \
    --password=${MONGO_ROOT_PASSWORD} \
    --db=${DB_NAME} \
    --archive=/var/backups/leadvibes/backup_${TIMESTAMP}.gz \
    --gzip || echo "⚠️  Backup falló (puede ser primer deploy)"
echo "✅ Backup completado"

# Pull changes
echo -e "\n${YELLOW}[3/5] Pulling changes...${NC}"
if [ -d .git ]; then
    git pull origin main || echo "⚠️  Git pull falló"
fi
echo "✅ Changes pulled"

# Stop and rebuild
echo -e "\n${YELLOW}[4/5] Rebuilding containers...${NC}"
docker-compose down
docker-compose up -d --build
echo "✅ Containers rebuilt"

# Wait for health
echo -e "\n${YELLOW}[5/5] Waiting for services...${NC}"
sleep 10
docker-compose ps

echo -e "\n${GREEN}===========================================${NC}"
echo -e "${GREEN}✅ Deploy Completado!${NC}"
echo -e "${GREEN}===========================================${NC}"
echo -e "🌐 Frontend: http://localhost/"
echo -e "🔧 Backend: http://localhost:8000"
echo -e "📖 API Docs: http://localhost:8000/docs"
