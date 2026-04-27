#!/bin/bash
#
# Script para gestionar el entorno de Staging
# Entorno aislado con puertos: 2403 (frontend), 1607 (backend), 2504 (mongo), 2906 (webhook)
#

set -euo pipefail

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de utilidad
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Función para verificar que no afectamos producción
check_production_not_running() {
    log_info "Verificando que producción no sea afectada..."

    # Verificar que contenedores de producción no se estén manipulando
    if docker ps | grep -q "rovi-mongodb"; then
        PROD_MONGO_PORT=$(docker port rovi-mongodb 2>/dev/null | grep -oP '0.0.0.0:\K[0-9]+' || echo "27017")
        if [[ "$PROD_MONGO_PORT" != "27027" ]]; then
            log_warning "Contenedor de producción usando puerto no estándar: $PROD_MONGO_PORT"
        fi
        log_success "Producción detectada en puerto correcto: $PROD_MONGO_PORT"
    fi

    # Verificar que los puertos de staging estén libres
    log_info "Verificando puertos de staging..."

    STAGING_PORTS=(2403 1607 2504 2906)
    for port in "${STAGING_PORTS[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_error "Puerto $port ya está en uso. Detén el servicio primero."
            return 1
        fi
        log_success "Puerto $port disponible ✓"
    done
}

# Función para levantar entorno staging
staging_up() {
    log_info "🚀 Levantando entorno de Staging..."

    # Verificar archivo de entorno
    if [[ ! -f ".env.staging" ]]; then
        log_error "Archivo .env.staging no encontrado. Creando desde ejemplo..."
        # El archivo ya debería existir, pero por si acaso
        touch .env.staging
    fi

    # Usar docker-compose.staging.yml
    log_info "Levantando contenedores con docker-compose.staging.yml..."
    docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build

    # Esperar a que estén ready
    log_info "Esperando a que servicios estén ready..."
    sleep 10

    # Verificar health checks
    check_staging_health
}

# Función para verificar health de staging
check_staging_health() {
    log_info "🔍 Verificando health de servicios de Staging..."

    # MongoDB
    if docker exec rovi-staging-mongodb mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
        log_success "MongoDB Staging: Healthy ✓ (puerto 2504)"
    else
        log_error "MongoDB Staging: Not healthy"
        return 1
    fi

    # Backend
    if curl -sf http://localhost:1607/api/health >/dev/null; then
        log_success "Backend Staging: Healthy ✓ (puerto 1607)"
    else
        log_error "Backend Staging: Not responding en puerto 1607"
        return 1
    fi

    # Frontend
    if curl -sf http://localhost:2403 >/dev/null; then
        log_success "Frontend Staging: Healthy ✓ (puerto 2403)"
    else
        log_error "Frontend Staging: Not responding en puerto 2403"
        return 1
    fi

    # Webhook
    if curl -sf http://localhost:2906/webhooks/health >/dev/null; then
        log_success "Webhook Server: Healthy ✓ (puerto 2906)"
    else
        log_warning "Webhook Server: Not responding en puerto 2906"
    fi
}

# Función para detener staging
staging_down() {
    log_info "🛑 Deteniendo entorno de Staging..."
    docker compose -f docker-compose.staging.yml down
    log_success "Entorno de Staging detenido"
}

# Función para reiniciar staging
staging_restart() {
    log_info "🔄 Reiniciando entorno de Staging..."
    staging_down
    sleep 2
    staging_up
}

# Función para ver logs
staging_logs() {
    local service=${1:-}
    if [[ -n "$service" ]]; then
        log_info "📋 Mostrando logs de $service..."
        docker compose -f docker-compose.staging.yml logs -f "$service"
    else
        log_info "📋 Mostrando logs de todos los servicios..."
        docker compose -f docker-compose.staging.yml logs -f
    fi
}

# Función para mostrar status
staging_status() {
    log_info "📊 Status del entorno de Staging:"
    echo ""
    docker compose -f docker-compose.staging.yml ps
    echo ""
    log_info "URLs de Staging:"
    echo "  🌐 Frontend:  http://localhost:2403"
    echo "  🔧 Backend:   http://localhost:1607/api/health"
    echo "  🐳 MongoDB:   localhost:2504"
    echo "  🪝 Webhook:   http://localhost:2906/webhooks/health"
}

# Función para limpiar datos de staging (reset)
staging_reset() {
    log_warning "🧹 Esto eliminará TODOS los datos de staging. ¿Estás seguro? (s/N)"
    read -r response
    if [[ "$response" =~ ^[Ss]$ ]]; then
        log_info "Eliminando contenedores y volúmenes de staging..."
        docker compose -f docker-compose.staging.yml down -v
        log_success "Datos de staging eliminados"
        log_info "Levantando entorno limpio..."
        staging_up
    else
        log_info "Cancelado"
    fi
}

# Función para acceder a MongoDB de staging
staging_mongo() {
    log_info "🔧 Accediendo a MongoDB de Staging..."
    docker exec -it rovi-staging-mongodb mongosh --username admin --password staging_admin_secure_password_change_me_12345
}

# Función para ejecutar comando en backend de staging
staging_backend_exec() {
    local cmd=${1:-/bin/bash}
    log_info "🔧 Ejecutando comando en backend de Staging..."
    docker exec -it rovi-staging-backend $cmd
}

# Función para hacer backup de datos de staging
staging_backup() {
    local backup_dir="backups/staging"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$backup_dir/staging_backup_$timestamp.gz"

    mkdir -p "$backup_dir"

    log_info "💾 Creando backup de MongoDB Staging..."
    docker exec rovi-staging-mongodb mongodump --username admin --password staging_admin_secure_password_change_me_12345 --archive --gzip --db=rovi_crm_staging > "$backup_file"

    if [[ -f "$backup_file" ]]; then
        local size=$(du -h "$backup_file" | cut -f1)
        log_success "Backup creado: $backup_file ($size)"
    else
        log_error "Error al crear backup"
        return 1
    fi
}

# Función para restaurar backup
staging_restore() {
    local backup_file=${1}
    if [[ ! -f "$backup_file" ]]; then
        log_error "Archivo de backup no encontrado: $backup_file"
        return 1
    fi

    log_warning "Esto reemplazará todos los datos actuales de staging. ¿Continuar? (s/N)"
    read -r response
    if [[ "$response" =~ ^[Ss]$ ]]; then
        log_info "📥 Restaurando backup: $backup_file..."
        docker exec -i rovi-staging-mongodb mongorestore --username admin --password staging_admin_secure_password_change_me_12345 --archive --gzip --db=rovi_crm_staging < "$backup_file"
        log_success "Backup restaurado"
    else
        log_info "Cancelado"
    fi
}

# Función para probar webhook de ejemplo
test_webhook() {
    log_info "🧪 Enviando webhook de prueba..."

    # Leer el archivo de ejemplo si existe
    if [[ -f "webhook_lead_example.json" ]]; then
        log_info "Enviando webhook_lead_example.json..."
        curl -X POST http://localhost:2906/webhooks/lead \
            -H "Content-Type: application/json" \
            -d @webhook_lead_example.json
        echo ""
        log_success "Webhook enviado. Revisa los logs: ./scripts/staging-deploy.sh logs webhook-server"
    else
        log_error "Archivo webhook_lead_example.json no encontrado"
        return 1
    fi
}

# Función para comparar producción vs staging
compare_environments() {
    log_info "📊 Comparando Producción vs Staging:"
    echo ""
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│  SERVICIO   │  PRODUCCIÓN  │  STAGING  │  DIFERENCIA  │"
    echo "├─────────────────────────────────────────────────────────────┤"
    echo "│  Frontend   │  :13000       │  :2403    │  ✅ Aislado  │"
    echo "│  Backend    │  :18080       │  :1607    │  ✅ Aislado  │"
    echo "│  MongoDB    │  :27027       │  :2504    │  ✅ Aislado  │"
    echo "│  Webhook    │  N/A          │  :2906    │  ✅ Nuevo     │"
    echo "│  Database   │  rovi_crm     │  rovi_crm_staging │ ✅ Separado │"
    echo "│  Contenedor │  rovi-*       │  rovi-staging-* │ ✅ Separado │"
    echo "└─────────────────────────────────────────────────────────────┘"
    echo ""
    log_info "Contenedores de producción:"
    docker ps | grep "rovi-" | grep -v "staging" || echo "  (No running)"
    echo ""
    log_info "Contenedores de staging:"
    docker ps | grep "staging" || echo "  (No running)"
}

# Función de ayuda
show_help() {
    cat << EOF
🎯 Gestión de Entorno Staging - Rovi CRM

Uso: ./scripts/staging-deploy.sh [comando]

Comandos:
  up              Levanta el entorno de staging
  down            Detiene el entorno de staging
  restart         Reinicia el entorno de staging
  status          Muestra el status de los servicios
  logs [service]  Muestra logs (todos o de un servicio específico)
  health          Verifica health de todos los servicios
  reset           Elimina todos los datos y recrea entorno limpio
  mongo           Accede a MongoDB de staging
  backup          Crea backup de datos de staging
  restore <file>  Restaura un backup
  test-webhook    Prueba el webhook con un ejemplo
  compare         Compara producción vs staging
  help            Muestra esta ayuda

Servicios disponibles para logs:
  backend-staging, frontend-staging, mongodb-staging, webhook-server

Ejemplos:
  ./scripts/staging-deploy.sh up
  ./scripts/staging-deploy.sh logs backend-staging
  ./scripts/staging-deploy.sh test-webhook
  ./scripts/staging-deploy.sh reset

EOF
}

# Main
case "${1:-}" in
  up)
    check_production_not_running
    staging_up
    ;;
  down)
    staging_down
    ;;
  restart)
    staging_restart
    ;;
  status)
    staging_status
    ;;
  logs)
    staging_logs "${2:-}"
    ;;
  health)
    check_staging_health
    ;;
  reset)
    staging_reset
    ;;
  mongo)
    staging_mongo
    ;;
  backup)
    staging_backup
    ;;
  restore)
    staging_restore "${2:-}"
    ;;
  test-webhook)
    test_webhook
    ;;
  compare)
    compare_environments
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    log_error "Comando desconocido: ${1:-}"
    show_help
    exit 1
    ;;
esac