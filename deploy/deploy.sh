#!/bin/bash

###############################################################################
# Rovi CRM - Deployment Script
# Deploys specific environment to the server
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="srv1318804.hstgr.cloud"
PROJECT_DIR="${HOME}/rovi-crm"

# Function to print usage
usage() {
    echo "Usage: $0 [ENVIRONMENT]"
    echo ""
    echo "Environments:"
    echo "  production    Deploy to srv1318804.hstgr.cloud"
    echo "  development   Deploy to dev.srv1318804.hstgr.cloud"
    echo "  preview       Deploy to preview.srv1318804.hstgr.cloud"
    echo ""
    echo "Examples:"
    echo "  $0 production"
    echo "  $0 development"
    echo "  $0 preview"
    exit 1
}

# Check if environment is provided
if [ -z "$1" ]; then
    usage
fi

ENVIRONMENT=$1

# Map environment to compose file and URL
case $ENVIRONMENT in
    production)
        COMPOSE_FILE="docker-compose.hostinger.yml"
        URL="http://${DOMAIN}"
        DIR="${PROJECT_DIR}/production"
        ;;
    development|dev)
        COMPOSE_FILE="docker-compose.dev.yml"
        URL="http://dev.${DOMAIN}"
        DIR="${PROJECT_DIR}/development"
        ;;
    preview)
        COMPOSE_FILE="docker-compose.preview.yml"
        URL="http://preview.${DOMAIN}"
        DIR="${PROJECT_DIR}/preview"
        ;;
    *)
        echo -e "${RED}Error: Unknown environment '$ENVIRONMENT'${NC}"
        usage
        ;;
esac

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Rovi CRM - Deploy to ${ENVIRONMENT}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Environment: ${ENVIRONMENT}"
echo "URL: ${URL}"
echo "Directory: ${DIR}"
echo "Compose file: ${COMPOSE_FILE}"
echo ""

# Check if directory exists
if [ ! -d "$DIR" ]; then
    echo -e "${YELLOW}Creating directory: ${DIR}${NC}"
    mkdir -p "$DIR"
fi

# Navigate to directory
cd "$DIR"

# Check if .env exists, if not create from template
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env << EOF
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=\${MONGO_ROOT_PASSWORD}
DB_NAME=rovi_crm_${ENVIRONMENT}
JWT_SECRET=\${JWT_SECRET}
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
EMERGENT_LLM_KEY=\${EMERGENT_LLM_KEY}
CORS_ORIGINS=${URL}
ENVIRONMENT=${ENVIRONMENT}
DEBUG=false
EOF
    echo -e "${RED}⚠️  Please edit .env file with your credentials!${NC}"
    echo -e "${RED}   Set MONGO_ROOT_PASSWORD, JWT_SECRET, and EMERGENT_LLM_KEY${NC}"
    exit 1
fi

# Pull latest images
echo -e "${YELLOW}[1/4] Pulling latest Docker images...${NC}"
docker compose -f "$COMPOSE_FILE" pull

# Stop existing containers
echo -e "${YELLOW}[2/4] Stopping existing containers...${NC}"
docker compose -f "$COMPOSE_FILE" down

# Start new containers
echo -e "${YELLOW}[3/4] Starting new containers...${NC}"
docker compose -f "$COMPOSE_FILE" up -d --force-recreate

# Wait for services to be ready
echo -e "${YELLOW}[4/4] Waiting for services to be ready...${NC}"
sleep 10

# Health check
echo -e "${YELLOW}Running health checks...${NC}"

# Check backend
BACKEND_URL="${URL}/api/health"
if curl -f -s "$BACKEND_URL" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
    echo -e "${YELLOW}  Check logs: docker compose -f $COMPOSE_FILE logs backend${NC}"
fi

# Check frontend
if curl -f -s "$URL" > /dev/null; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
else
    echo -e "${RED}✗ Frontend health check failed${NC}"
    echo -e "${YELLOW}  Check logs: docker compose -f $COMPOSE_FILE logs frontend${NC}"
fi

# Show running containers
echo ""
echo -e "${BLUE}Running containers:${NC}"
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Access your application at: ${URL}"
echo ""
echo "Useful commands:"
echo "  View logs:    docker compose -f $COMPOSE_FILE logs -f"
echo "  Stop:         docker compose -f $COMPOSE_FILE down"
echo "  Restart:      docker compose -f $COMPOSE_FILE restart"
echo "  Shell access: docker exec -it rovi-backend-${ENVIRONMENT} bash"
echo ""
