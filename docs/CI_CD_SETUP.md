# CI/CD Setup Guide - Rovi CRM

This document describes how to set up and configure the CI/CD pipeline for Rovi CRM.

## Overview

The CI/CD pipeline uses GitHub Actions to deploy to three environments:

| Environment | Branch | Purpose | URL Pattern |
|-------------|--------|---------|-------------|
| **Production** | `main` | Live production environment | `https://rovi.crm` |
| **Development** | `dev` | Development and staging | `https://dev.rovi.crm` |
| **Preview** | `rovi_deploy` | Preview for testing before production | `https://preview.rovi.crm` |

## Workflows

### 1. Deploy to Production (`.github/workflows/deploy-production.yml`)
- Triggered on push to `main` branch
- Runs tests, builds Docker images, pushes to GHCR
- Deploys to Hostinger via SSH
- Runs health checks

### 2. Deploy to Development (`.github/workflows/deploy-development.yml`)
- Triggered on push to `dev` branch
- Runs tests and linting (black, flake8, isort, ESLint)
- Builds and pushes Docker images
- Deploys to development server

### 3. Deploy to Preview (`.github/workflows/deploy-preview.yml`)
- Triggered on push to `rovi_deploy` branch
- Runs tests, builds and pushes images
- Deploys to preview environment
- Includes automatic cleanup of old images

## Required GitHub Secrets

Navigate to: **Repository Settings → Secrets and variables → Actions**

### Database Secrets (used by all environments)
```
MONGO_ROOT_USERNAME          # MongoDB root username
MONGO_ROOT_PASSWORD          # MongoDB root password
DB_NAME                      # Database name (e.g., rovi_crm)
```

### Application Secrets (used by all environments)
```
JWT_SECRET                   # JWT secret key
EMERGENT_LLM_KEY            # OpenAI/Emergent API key
```

### Production Secrets (`deploy-production.yml`)
```
HOSTINGER_HOST              # Hostinger server hostname or IP
HOSTINGER_USER              # SSH username for Hostinger
HOSTINGER_SSH_KEY           # Private SSH key for Hostinger
HOSTINGER_PORT              # SSH port (default: 22)
HOSTINGER_PATH              # Path to project on Hostinger
PRODUCTION_CORS_ORIGINS     # Comma-separated allowed origins
PRODUCTION_BACKEND_URL      # Backend URL for health checks
PRODUCTION_FRONTEND_URL     # Frontend URL for health checks
```

### Development Secrets (`deploy-development.yml`)
```
DEV_HOST                    # Development server hostname or IP
DEV_USER                    # SSH username for dev server
DEV_SSH_KEY                 # Private SSH key for dev server
DEV_PORT                    # SSH port (default: 22)
DEV_PATH                    # Path to project on dev server
DEV_CORS_ORIGINS            # Comma-separated allowed origins
DEV_BACKEND_URL             # Backend URL for health checks
DEV_FRONTEND_URL            # Frontend URL for health checks
```

### Preview Secrets (`deploy-preview.yml`)
```
PREVIEW_HOST                # Preview server hostname or IP
PREVIEW_USER                # SSH username for preview server
PREVIEW_SSH_KEY             # Private SSH key for preview server
PREVIEW_PORT                # SSH port (default: 22)
PREVIEW_PATH                # Path to project on preview server
PREVIEW_CORS_ORIGINS        # Comma-separated allowed origins
PREVIEW_BACKEND_URL         # Backend URL for health checks
PREVIEW_FRONTEND_URL        # Frontend URL for health checks
```

### Optional Secrets
```
MONGO_EXPRESS_PASSWORD      # Password for Mongo Express (dev only)
JWT_ALGORITHM               # JWT algorithm (default: HS256)
JWT_EXPIRATION_HOURS        # Token expiration in hours (default: 24)
```

## Server Setup

Each server (production, development, preview) needs:

### 1. Install Docker and Docker Compose
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2. Configure SSH Access
Generate SSH key pair on GitHub Actions runner (or use existing):
```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
```

Add the public key to the server's `~/.ssh/authorized_keys`
Add the private key as a GitHub Secret (`*_SSH_KEY`)

### 3. Create Project Directory
```bash
mkdir -p /path/to/rovi-crm
cd /path/to/rovi-crm
git clone git@github.com:softvibeslab/leadvibes.git .
```

### 4. Test SSH Connection
```bash
ssh -i ~/.ssh/github_actions user@server "docker ps"
```

## Docker Compose Files

| File | Environment | Purpose |
|------|-------------|---------|
| `docker-compose.yml` | Local development | Full stack with health checks |
| `docker-compose.hostinger.yml` | Production | Optimized for Hostinger panel |
| `docker-compose.dev.yml` | Development | With debug tools and Mongo Express |
| `docker-compose.preview.yml` | Preview | Lightweight for testing |

## Deployment Workflow

### Normal Development Flow
```
1. Create feature branch from `dev`
2. Make changes and commit
3. Push to feature branch
4. Create PR to `dev`
5. Merge to `dev` → triggers development deployment
```

### Production Deployment Flow
```
1. Create PR from `dev` to `main`
2. Review and test on development environment
3. Merge to `main` → triggers production deployment
```

### Preview Deployment Flow
```
1. Branch from `dev` or `main`
2. Make changes for preview
3. Push to `rovi_deploy` → triggers preview deployment
4. Test on preview environment
5. Merge back to appropriate branch
```

## Environment Variables Reference

### Production
```env
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO
CORS_ORIGINS=https://rovi.crm,https://www.rovi.crm
```

### Development
```env
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=DEBUG
CORS_ORIGINS=http://localhost:3000,http://localhost:8000,https://dev.rovi.crm
```

### Preview
```env
ENVIRONMENT=preview
DEBUG=true
LOG_LEVEL=DEBUG
CORS_ORIGINS=https://preview.rovi.crm
```

## Monitoring and Logs

### View Logs
```bash
# Production
docker compose -f docker-compose.hostinger.yml logs -f

# Development
docker compose -f docker-compose.dev.yml logs -f backend

# Preview
docker compose -f docker-compose.preview.yml logs -f frontend
```

### Health Checks
```bash
# Backend
curl https://backend.rovi.crm/api/health

# Frontend
curl https://rovi.crm/
```

## Troubleshooting

### Deployment Fails
1. Check GitHub Actions logs
2. Verify SSH access to server
3. Check Docker is running on server
4. Verify all secrets are configured correctly

### Health Check Fails
1. Check if containers are running: `docker ps`
2. Check container logs: `docker logs <container-name>`
3. Verify environment variables are set correctly
4. Check database connectivity

### Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER /path/to/project
```

## Security Best Practices

1. **Never commit secrets to the repository**
2. **Use different JWT secrets for each environment**
3. **Rotate SSH keys regularly**
4. **Use SSH key-based authentication, not passwords**
5. **Keep Docker images updated**
6. **Review GitHub Actions logs regularly**
7. **Enable branch protection rules**

## Branch Protection Rules

Configure in: **Repository Settings → Branches**

### `main` branch
- Require pull request reviews (1 approval)
- Require status checks to pass
- Require branches to be up to date
- Do not allow bypassing the above settings

### `dev` branch
- Require pull request reviews
- Require status checks to pass

## Rollback Procedure

If a deployment fails:

```bash
# SSH into the server
ssh user@server

# Navigate to project
cd /path/to/project

# Revert to previous image
docker compose -f docker-compose.{environment}.yml up -d --force-recreate

# Or restart specific service
docker restart rovi-backend-{environment}
```

## Additional Resources

- GitHub Actions Documentation: https://docs.github.com/en/actions
- Docker Compose Documentation: https://docs.docker.com/compose/
- Docker Build Push Action: https://github.com/docker/build-push-action
