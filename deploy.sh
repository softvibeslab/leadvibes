#!/bin/bash

# Rovi CRM - Deployment Script para Hostinger VPS
# Uso: ./deploy.sh [comando]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funciones de ayuda
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si .env existe
check_env() {
    if [ ! -f .env ]; then
        log_error "Archivo .env no encontrado"
        log_info "Crea uno desde .env.example: cp .env.example .env"
        log_info "Luego edita .env con tus valores reales"
        exit 1
    fi
    log_info "Archivo .env encontrado ✓"
}

# Verificar Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker no está instalado"
        log_info "Instala Docker: curl -fsSL https://get.docker.com | sh"
        exit 1
    fi
    log_info "Docker instalado ✓"
}

# Verificar Docker Compose
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose no está instalado"
        exit 1
    fi
    log_info "Docker Compose instalado ✓"
}

# Construir imágenes
build() {
    log_info "Construyendo imágenes Docker..."
    docker-compose build --no-cache
    log_info "Build completado ✓"
}

# Levantar contenedores
up() {
    log_info "Levantando contenedores..."
    docker-compose up -d
    log_info "Contenedores levantados ✓"
    show_urls
}

# Detener contenedores
down() {
    log_info "Deteniendo contenedores..."
    docker-compose down
    log_info "Contenedores detenidos ✓"
}

# Ver logs
logs() {
    SERVICE=${2:-}
    if [ -z "$SERVICE" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$SERVICE"
    fi
}

# Ver estado
ps() {
    docker-compose ps
}

# Reiniciar contenedores
restart() {
    log_info "Reiniciando contenedores..."
    docker-compose restart
    log_info "Contenedores reiniciados ✓"
    show_urls
}

# Actualizar código y redeploy
update() {
    log_info "Actualizando código..."
    git pull
    log_info "Reconstruyendo y levantando..."
    docker-compose up -d --build
    log_info "Update completado ✓"
    show_urls
}

# Limpiar todo (cuidado!)
clean() {
    log_warn "Esto eliminará todos los contenedores, volúmenes e imágenes"
    read -p "¿Estás seguro? (sí/no): " confirm
    if [ "$confirm" = "sí" ]; then
        docker-compose down -v
        docker system prune -a
        log_info "Limpieza completada ✓"
    else
        log_info "Operación cancelada"
    fi
}

# Mostrar URLs de acceso
show_urls() {
    echo ""
    log_info "=========================================="
    log_info "  Rovi CRM - URLs de Acceso"
    log_info "=========================================="
    echo ""
    # Obtener IP del servidor
    IP=$(hostname -I | awk '{print $1}')
    if [ -z "$IP" ]; then
        IP="TU_IP_DEL_VPS"
    fi
    echo -e "  Frontend:    ${GREEN}http://$IP:3000${NC}"
    echo -e "  Backend API: ${GREEN}http://$IP:8000${NC}"
    echo -e "  Health Check: ${GREEN}http://$IP:8000/api/health${NC}"
    echo ""
    log_info "=========================================="
}

# Instalar Docker y Docker Compose
install_docker() {
    log_info "Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh

    log_info "Instalando Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose

    log_info "Docker y Docker Compose instalados ✓"
}

# Configurar firewall
setup_firewall() {
    log_info "Configurando firewall..."
    ufw allow 22/tcp    # SSH
    ufw allow 3000/tcp  # Frontend
    ufw allow 8000/tcp  # Backend
    ufw --force enable
    log_info "Firewall configurado ✓"
}

# Inicializar proyecto
init() {
    log_info "Inicializando proyecto..."

    # Crear .env si no existe
    if [ ! -f .env ]; then
        cp .env.example .env
        log_warn "Archivo .env creado desde .env.example"
        log_warn "EDITA .env CON TUS VALORES REALES ANTES DE CONTINUAR"
        exit 0
    fi

    # Crear directorio de init de MongoDB
    mkdir -p mongodb-init

    # Crear script de init de MongoDB
    cat > mongodb-init/init-mongo.js <<EOF
// Script de inicialización de MongoDB
db = db.getSiblingDB('rovi_crm');
db.createUser({
  user: 'rovi_user',
  pwd: 'cambiar_esta_password',
  roles: [
    { role: 'readWrite', db: 'rovi_crm' }
  ]
});
EOF

    log_info "Proyecto inicializado ✓"
}

# Menú de ayuda
show_help() {
    cat << EOF
Rovi CRM - Script de Deployment

Uso: ./deploy.sh [comando]

Comandos:
  init           Inicializa el proyecto (crea .env y directorios)
  build          Construye las imágenes Docker
  up             Levanta los contenedores
  down           Detiene los contenedores
  restart        Reinicia los contenedores
  logs [serv]    Muestra logs (opcionalmente de un servicio)
  ps             Muestra estado de contenedores
  update         Actualiza código y redeploy
  clean          Elimina todo (contenedores, volúmenes, imágenes)
  install-docker Instala Docker y Docker Compose
  setup-firewall Configura el firewall
  help           Muestra esta ayuda

Ejemplos:
  ./deploy.sh init
  ./deploy.sh build
  ./deploy.sh up
  ./deploy.sh logs backend
  ./deploy.sh restart

EOF
}

# Main
case "${1:-help}" in
  init)
    init
    ;;
  build)
    check_env
    build
    ;;
  up)
    check_env
    check_docker
    check_docker_compose
    up
    ;;
  down)
    down
    ;;
  restart)
    restart
    ;;
  logs)
    logs "$@"
    ;;
  ps)
    ps
    ;;
  update)
    update
    ;;
  clean)
    clean
    ;;
  install-docker)
    install_docker
    ;;
  setup-firewall)
    setup_firewall
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    log_error "Comando no reconocido: $1"
    show_help
    exit 1
    ;;
esac
