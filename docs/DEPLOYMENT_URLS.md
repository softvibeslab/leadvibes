# Deployment URLs and Ports Reference

## Domain Configuration

**Main Domain**: `srv1318804.hstgr.cloud`

| Environment | Subdomain | URL | Backend Port | Frontend Port | Database |
|-------------|-----------|-----|--------------|---------------|----------|
| **Production** | - | `http://srv1318804.hstgr.cloud` | 8000 | 3000 | `rovi_crm` |
| **Development** | `dev.` | `http://dev.srv1318804.hstgr.cloud` | 8100 | 3100 | `rovi_crm_dev` |
| **Preview** | `preview.` | `http://preview.srv1318804.hstgr.cloud` | 8200 | 3200 | `rovi_crm_preview` |

## Docker Compose Files

| File | Environment | Internal Ports | External Ports |
|------|-------------|----------------|----------------|
| `docker-compose.hostinger.yml` | Production | Backend: 8000, Frontend: 80 | Backend: 8000, Frontend: 3000 |
| `docker-compose.dev.yml` | Development | Backend: 8000, Frontend: 80 | Backend: 8100, Frontend: 3100 |
| `docker-compose.preview.yml` | Preview | Backend: 8000, Frontend: 80 | Backend: 8200, Frontend: 3200 |

## Nginx Configuration

| File | Server Name | Proxy To |
|------|-------------|----------|
| `deploy/nginx-production.conf` | `srv1318804.hstgr.cloud` | Frontend: 3000, Backend: 8000 |
| `deploy/nginx-development.conf` | `dev.srv1318804.hstgr.cloud` | Frontend: 3100, Backend: 8100 |
| `deploy/nginx-preview.conf` | `preview.srv1318804.hstgr.cloud` | Frontend: 3200, Backend: 8200 |

## GitHub Secrets Configuration

### Common Secrets (All Environments)
```bash
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=<your_password>
DB_NAME=rovi_crm
JWT_SECRET=<your_jwt_secret>
EMERGENT_LLM_KEY=<your_api_key>
```

### Production Secrets
```bash
HOSTINGER_HOST=srv1318804.hstgr.cloud
HOSTINGER_USER=root
HOSTINGER_SSH_KEY=<ssh_private_key>
HOSTINGER_PORT=22
HOSTINGER_PATH=/root/rovi-crm/production
PRODUCTION_CORS_ORIGINS=http://srv1318804.hstgr.cloud,https://srv1318804.hstgr.cloud
PRODUCTION_BACKEND_URL=http://srv1318804.hstgr.cloud/api/health
PRODUCTION_FRONTEND_URL=http://srv1318804.hstgr.cloud
```

### Development Secrets
```bash
DEV_HOST=srv1318804.hstgr.cloud
DEV_USER=root
DEV_SSH_KEY=<ssh_private_key>
DEV_PORT=22
DEV_PATH=/root/rovi-crm/development
DEV_CORS_ORIGINS=http://dev.srv1318804.hstgr.cloud,https://dev.srv1318804.hstgr.cloud
DEV_BACKEND_URL=http://dev.srv1318804.hstgr.cloud/api/health
DEV_FRONTEND_URL=http://dev.srv1318804.hstgr.cloud
```

### Preview Secrets
```bash
PREVIEW_HOST=srv1318804.hstgr.cloud
PREVIEW_USER=root
PREVIEW_SSH_KEY=<ssh_private_key>
PREVIEW_PORT=22
PREVIEW_PATH=/root/rovi-crm/preview
PREVIEW_CORS_ORIGINS=http://preview.srv1318804.hstgr.cloud,https://preview.srv1318804.hstgr.cloud
PREVIEW_BACKEND_URL=http://preview.srv1318804.hstgr.cloud/api/health
PREVIEW_FRONTEND_URL=http://preview.srv1318804.hstgr.cloud
```

## Local Development

If you want to run all three environments locally for testing:

```bash
# Production (localhost)
docker-compose -f docker-compose.yml up -d
# Access at http://localhost:3000

# Development (localhost with different ports)
docker-compose -f docker-compose.dev.yml up -d
# Access at http://localhost:3100

# Preview (localhost with different ports)
docker-compose -f docker-compose.preview.yml up -d
# Access at http://localhost:3200
```

## Container Names

| Environment | Backend Container | Frontend Container | MongoDB Container |
|-------------|-------------------|-------------------|-------------------|
| Production | `rovi-backend` | `rovi-frontend` | `rovi-mongodb` |
| Development | `rovi-backend-dev` | `rovi-frontend-dev` | `rovi-mongodb-dev` |
| Preview | `rovi-backend-preview` | `rovi-frontend-preview` | `rovi-mongodb-preview` |

## SSL/HTTPS Configuration

To enable HTTPS for all domains:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificates for all domains
sudo certbot --nginx -d srv1318804.hstgr.cloud
sudo certbot --nginx -d dev.srv1318804.hstgr.cloud
sudo certbot --nginx -d preview.srv1318804.hstgr.cloud

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

After SSL is configured, update CORS_ORIGINS to use `https://` instead of `http://`.

## DNS Configuration

If you want to use custom subdomains, add the following DNS records:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `srv1318804.hstgr.cloud` |
| A | `dev` | `srv1318804.hstgr.cloud` |
| A | `preview` | `srv1318804.hstgr.cloud` |

Note: Since all environments use the same server IP, the A records should all point to the same IP address. Nginx will route based on the `Host` header.
