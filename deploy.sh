#!/bin/bash

# ============================================
# LEADVIBES CRM - Script de Despliegue
# ============================================
# Este script automatiza el despliegue del proyecto
# en un VPS con Ubuntu 24.04

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
VPS_USER="${VPS_USER:-root}"
VPS_HOST="${VPS_HOST:-}"
VPS_PORT="${VPS_PORT:-22}"
REMOTE_DIR="${REMOTE_DIR:-/root/leadvibes}"
COMPOSE_PROJECT="leadvibes"

echo -e "${GREEN}=== LeadVibes CRM - Script de Despliegue ===${NC}\n"

# ============================================
# VALIDACIÓN DE PARÁMETROS
# ============================================

if [ -z "$VPS_HOST" ]; then
    echo -e "${RED}Error: VPS_HOST no está configurado${NC}"
    echo "Usar: VPS_HOST=tu-ip-o-dominio ./deploy.sh"
    echo "O exportar la variable: export VPS_HOST=tu-ip-o-dominio"
    exit 1
fi

echo -e "${YELLOW}Configuración:${NC}"
echo "  VPS_HOST: $VPS_HOST"
echo "  VPS_USER: $VPS_USER"
echo "  REMOTE_DIR: $REMOTE_DIR"
echo ""

# ============================================
# FUNCIÓN DE AYUDA
# ============================================

show_help() {
    cat << EOF
Uso: ./deploy.sh [opción]

Variables de entorno:
  VPS_HOST      IP o dominio del VPS (requerido)
  VPS_USER      Usuario SSH (default: root)
  VPS_PORT      Puerto SSH (default: 22)
  REMOTE_DIR     Directorio remoto (default: /root/leadvibes)

Opciones:
  setup          Instalar Docker y Docker Compose en el VPS
  deploy          Desplegar la aplicación
  logs            Ver logs de los contenedores
  restart          Reiniciar los contenedores
  stop            Detener los contenedores
  status           Ver estado de los contenedores
  backup          Hacer backup de MongoDB
  help            Mostrar esta ayuda

Ejemplos:
  # Primera vez - instalar Docker
  VPS_HOST=123.45.67.89 ./deploy.sh setup

  # Desplegar aplicación
  VPS_HOST=123.45.67.89 ./deploy.sh deploy

  # Ver logs
  VPS_HOST=123.45.67.89 ./deploy.sh logs
EOF
}

# ============================================
# FUNCIÓN DE INSTALACIÓN DE DOCKER
# ============================================

install_docker() {
    echo -e "${GREEN}=== Instalando Docker en el VPS ===${NC}\n"

    ssh -p $VPS_PORT ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
set -e

echo "Actualizando sistema..."
apt update && apt upgrade -y

echo "Instalando dependencias..."
apt install -y curl git ufw wget

echo "Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $USER
    echo "Docker instalado exitosamente"
else
    echo "Docker ya está instalado"
fi

echo "Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -SL https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose instalado exitosamente"
else
    echo "Docker Compose ya está instalado"
fi

echo "Configurando firewall..."
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

echo "Creando directorio de trabajo..."
mkdir -p /root/leadvibes

echo "Instalación completada!"
ENDSSH

    echo -e "${GREEN}✓ Instalación completada${NC}\n"
}

# ============================================
# FUNCIÓN DE DESPLIEGUE
# ============================================

deploy_app() {
    echo -e "${GREEN}=== Desplegando LeadVibes CRM ===${NC}\n"

    echo "Verificando conexión SSH..."
    ssh -p $VPS_PORT -o ConnectTimeout=10 ${VPS_USER}@${VPS_HOST} "echo 'Conexión exitosa'"

    echo ""
    echo "Subiendo archivos al VPS..."
    rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude '__pycache__' \
        --exclude '*.pyc' \
        --exclude '.git' \
        --exclude '.env.production' \
        --exclude 'build' \
        --exclude 'coverage' \
        --exclude '.pytest_cache' \
        -e "ssh -p $VPS_PORT" \
        ./ ${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/

    echo ""
    echo "Verificando archivos de configuración..."
    ssh -p $VPS_PORT ${VPS_USER}@${VPS_HOST} << ENDSSH
cd ${REMOTE_DIR}

# Verificar que existe .env.production
if [ ! -f .env.production ]; then
    echo "ADVERTENCIA: .env.production no existe"
    echo "Creando desde .env.example..."
    cp .env.example .env.production
    echo "DEBES EDITAR .env.production CON LOS VALORES REALES"
fi

# Verificar archivos Docker
if [ ! -f docker-compose.yml ]; then
    echo "ERROR: docker-compose.yml no encontrado"
    exit 1
fi
ENDSSH

    echo ""
    echo "Construyendo e iniciando contenedores..."
    ssh -p $VPS_PORT ${VPS_USER}@${VPS_HOST} << ENDSSH
cd ${REMOTE_DIR}
docker-compose down 2>/dev/null || true
docker-compose build
docker-compose up -d

echo ""
echo "Verificando estado de servicios..."
sleep 5
docker-compose ps
ENDSSH

    echo ""
    echo -e "${GREEN}✓ Despliegue completado${NC}"
    echo -e "${YELLOW}Aplicación disponible en: http://${VPS_HOST}${NC}"
    echo ""
    echo "Para ver logs:"
    echo "  ./deploy.sh logs"
}

# ============================================
# FUNCIÓN DE LOGS
# ============================================

show_logs() {
    echo -e "${GREEN}=== Logs de Contenedores ===${NC}\n"
    echo "Presiona Ctrl+C para salir..."
    echo ""
    ssh -p $VPS_PORT ${VPS_USER}@${VPS_HOST} << ENDSSH
cd ${REMOTE_DIR}
docker-compose logs -f --tail=100
ENDSSH
}

# ============================================
# FUNCIÓN DE REINICIAR
# ============================================

restart_containers() {
    echo -e "${GREEN}=== Reiniciando Contenedores ===${NC}\n"
    ssh -p $VPS_PORT ${VPS_USER}@${VPS_HOST} << ENDSSH
cd ${REMOTE_DIR}
docker-compose restart
ENDSSH
    echo -e "${GREEN}✓ Contenedores reiniciados${NC}"
}

# ============================================
# FUNCIÓN DE DETENER
# ============================================

stop_containers() {
    echo -e "${GREEN}=== Deteniendo Contenedores ===${NC}\n"
    ssh -p $VPS_PORT ${VPS_USER}@${VPS_HOST} << ENDSSH
cd ${REMOTE_DIR}
docker-compose down
ENDSSH
    echo -e "${GREEN}✓ Contenedores detenidos${NC}"
}

# ============================================
# FUNCIÓN DE ESTADO
# ============================================

show_status() {
    echo -e "${GREEN}=== Estado de Contenedores ===${NC}\n"
    ssh -p $VPS_PORT ${VPS_USER}@${VPS_HOST} << ENDSSH
cd ${REMOTE_DIR}
docker-compose ps
echo ""
echo "Recursos del sistema:"
docker stats --no-stream
ENDSSH
}

# ============================================
# FUNCIÓN DE BACKUP
# ============================================

backup_mongodb() {
    echo -e "${GREEN}=== Backup de MongoDB ===${NC}\n"

    BACKUP_DIR="/root/backups/mongodb"
    BACKUP_NAME="leadvibes-backup-$(date +%Y%m%d-%H%M%S)"
    BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

    ssh -p $VPS_PORT ${VPS_USER}@${VPS_HOST} << ENDSSH
mkdir -p ${BACKUP_DIR}
cd ${REMOTE_DIR}

echo "Creando backup..."
docker-compose exec -T mongo mongodump \
    --db=leadvibes \
    --archive=/data/dump/${BACKUP_NAME}.gz \
    --gzip

echo "Copiando backup a host..."
docker cp leadvibes-mongo:/data/dump/${BACKUP_NAME}.gz ${BACKUP_PATH}.gz

echo "Backup creado: ${BACKUP_PATH}.gz"
echo "Tamaño:"
ls -lh ${BACKUP_PATH}.gz
ENDSSH

    echo -e "${GREEN}✓ Backup completado${NC}"
}

# ============================================
# SWITCH PRINCIPAL
# ============================================

case "${1:-deploy}" in
    setup)
        install_docker
        ;;
    deploy)
        deploy_app
        ;;
    logs)
        show_logs
        ;;
    restart)
        restart_containers
        ;;
    stop)
        stop_containers
        ;;
    status)
        show_status
        ;;
    backup)
        backup_mongodb
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Opción desconocida: $1${NC}\n"
        show_help
        exit 1
        ;;
esac

echo ""
