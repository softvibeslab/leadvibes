#!/bin/bash

# ============================================
# LeadVibes - MongoDB Backup Script
# ============================================
# Uso: ./backup.sh
# ============================================

set -e

# Configuración
BACKUP_DIR="/var/backups/leadvibes"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7  # Mantener backups por 7 días

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Creating MongoDB backup...${NC}"

# Crear directorio de backup
mkdir -p ${BACKUP_DIR}

# Obtener credenciales del .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found"
    exit 1
fi

# Crear backup
docker-compose exec -T mongodb mongodump \
    --username=${MONGO_ROOT_USERNAME} \
    --password=${MONGO_ROOT_PASSWORD} \
    --db=${DB_NAME} \
    --archive=${BACKUP_DIR}/leadvibes_backup_${TIMESTAMP}.gz \
    --gzip

echo -e "${GREEN}✅ Backup created: ${BACKUP_DIR}/leadvibes_backup_${TIMESTAMP}.gz${NC}"

# Limpiar backups antiguos
echo -e "${YELLOW}Cleaning old backups (older than ${RETENTION_DAYS} days)...${NC}"
find ${BACKUP_DIR} -name "leadvibes_backup_*.gz" -mtime +${RETENTION_DAYS} -delete

echo -e "${GREEN}✅ Backup cleanup complete${NC}"

# Listar backups actuales
echo -e "\n${YELLOW}Current backups:${NC}"
ls -lh ${BACKUP_DIR}/ | grep leadvibes_backup
