#!/bin/bash

###############################################################################
# Rovi CRM - Server Setup Script
# Configures VPS for multi-environment deployment
# Domain: srv1318804.hstgr.cloud
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="srv1318804.hstgr.cloud"
DEV_SUBDOMAIN="dev.${DOMAIN}"
PREVIEW_SUBDOMAIN="preview.${DOMAIN}"

PROJECT_DIR="${HOME}/rovi-crm"
DEPLOY_DIR="${PROJECT_DIR}/deploy"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Rovi CRM - Server Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Domain: ${DOMAIN}"
echo "Development: ${DEV_SUBDOMAIN}"
echo "Preview: ${PREVIEW_SUBDOMAIN}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Step 1: Update system
echo -e "${YELLOW}[1/8] Updating system packages...${NC}"
apt-get update -qq
apt-get upgrade -y -qq

# Step 2: Install Docker
echo -e "${YELLOW}[2/8] Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    usermod -aG docker $SUDO_USER
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

# Step 3: Install Docker Compose
echo -e "${YELLOW}[3/8] Installing Docker Compose...${NC}"
if ! command -v docker compose &> /dev/null; then
    apt-get install -y docker-compose-plugin
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi

# Step 4: Install Nginx
echo -e "${YELLOW}[4/8] Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
    echo -e "${GREEN}✓ Nginx installed${NC}"
else
    echo -e "${GREEN}✓ Nginx already installed${NC}"
fi

# Step 5: Create project directory
echo -e "${YELLOW}[5/8] Creating project directory...${NC}"
mkdir -p "${PROJECT_DIR}"
mkdir -p "${DEPLOY_DIR}"
mkdir -p /var/log/nginx
echo -e "${GREEN}✓ Project directory created${NC}"

# Step 6: Setup Nginx configuration
echo -e "${YELLOW}[6/8] Configuring Nginx...${NC}"

# Copy nginx configs
if [ -f "${DEPLOY_DIR}/nginx-production.conf" ]; then
    cp "${DEPLOY_DIR}/nginx-production.conf" "/etc/nginx/sites-available/rovi-production"
    ln -sf "/etc/nginx/sites-available/rovi-production" "/etc/nginx/sites-enabled/rovi-production"
    echo -e "${GREEN}✓ Production nginx config installed${NC}"
fi

if [ -f "${DEPLOY_DIR}/nginx-development.conf" ]; then
    cp "${DEPLOY_DIR}/nginx-development.conf" "/etc/nginx/sites-available/rovi-development"
    ln -sf "/etc/nginx/sites-available/rovi-development" "/etc/nginx/sites-enabled/rovi-development"
    echo -e "${GREEN}✓ Development nginx config installed${NC}"
fi

if [ -f "${DEPLOY_DIR}/nginx-preview.conf" ]; then
    cp "${DEPLOY_DIR}/nginx-preview.conf" "/etc/nginx/sites-available/rovi-preview"
    ln -sf "/etc/nginx/sites-available/rovi-preview" "/etc/nginx/sites-enabled/rovi-preview"
    echo -e "${GREEN}✓ Preview nginx config installed${NC}"
fi

# Remove default nginx config
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t
systemctl reload nginx
echo -e "${GREEN}✓ Nginx configured and reloaded${NC}"

# Step 7: Configure firewall
echo -e "${YELLOW}[7/8] Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp comment 'SSH'
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    ufw --force enable
    echo -e "${GREEN}✓ Firewall configured${NC}"
else
    echo -e "${YELLOW}⚠ UFW not installed, skipping firewall config${NC}"
fi

# Step 8: Setup directories for environments
echo -e "${YELLOW}[8/8] Creating environment directories...${NC}"
mkdir -p "${PROJECT_DIR}/production"
mkdir -p "${PROJECT_DIR}/development"
mkdir -p "${PROJECT_DIR}/preview"
echo -e "${GREEN}✓ Environment directories created${NC}"

# Print summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Environments configured:"
echo "  • Production:  http://${DOMAIN}"
echo "  • Development: http://${DEV_SUBDOMAIN}"
echo "  • Preview:     http://${PREVIEW_SUBDOMAIN}"
echo ""
echo "Project directory: ${PROJECT_DIR}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Add SSH public key to ~/.ssh/authorized_keys"
echo "  2. Configure GitHub Actions secrets"
echo "  3. Deploy using: docker compose -f docker-compose.{env}.yml up -d"
echo ""
echo -e "${YELLOW}To configure SSL (HTTPS):${NC}"
echo "  sudo apt install certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d ${DOMAIN}"
echo "  sudo certbot --nginx -d ${DEV_SUBDOMAIN}"
echo "  sudo certbot --nginx -d ${PREVIEW_SUBDOMAIN}"
echo ""
