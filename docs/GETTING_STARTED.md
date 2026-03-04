# LeadVibes - Quick Start Guide

> Get LeadVibes CRM up and running in minutes.

---

## Prerequisites

- Docker and Docker Compose installed
- Git (for cloning the repository)
- At least 4GB RAM available
- Ports 27018, 8001, 3001 available

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/softvibeslab/leadvibes.git
cd leadvibes
```

### 2. Start Services

```bash
docker compose up -d
```

This will start:
- **MongoDB** on port `27018`
- **Backend API** on port `8001`
- **Frontend** on port `3001`

### 3. Verify Installation

```bash
# Check services are running
docker compose ps

# Test backend health
curl http://localhost:8001/api/health

# Open frontend in browser
open http://localhost:3001
```

---

## First Time Setup

### 1. Register an Account

1. Open http://localhost:3001
2. Click "Registrarse"
3. Fill in the form:
   - **Email**: Your email
   - **Password**: Choose a secure password
   - **Name**: Your full name
   - **Role**: Select "admin" for first account
4. Submit the form

This will create:
- A new user account
- A tenant (your agency)
- Default gamification rules
- Default sales scripts

### 2. Complete Onboarding

After registration, you'll be prompted to set your goals:

| Goal | Default | Description |
|------|---------|-------------|
| Ventas por mes | 5 | Target sales per month |
| Ingresos objetivo | $500,000 | Target revenue in MXN |
| Leads contactados | 50 | Target leads to contact |
| Tasa de conversión | 10% | Target conversion rate |
| Apartados por mes | 10 | Target reservations per month |

### 3. Load Demo Data (Optional)

To populate your account with demo data:

```bash
# Via API
curl -X POST http://localhost:8001/api/seed \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

This adds:
- 5 demo brokers
- 20 demo leads
- Sample activities
- Sample points

---

## Accessing the Application

### Frontend URL

```
http://localhost:3001
```

### Backend API

```
http://localhost:8001/api
```

API Documentation (Swagger):
```
http://localhost:8001/docs
```

### MongoDB

```
mongodb://localhost:27018/leadvibes
```

---

## Common Commands

### Start Services

```bash
docker compose up -d
```

### Stop Services

```bash
docker compose down
```

### View Logs

```bash
# All services
docker compose logs -f

# Backend only
docker compose logs -f backend

# Frontend only
docker compose logs -f frontend
```

### Rebuild Services

```bash
# Rebuild backend
docker compose up -d --build backend

# Rebuild frontend
docker compose up -d --build frontend
```

### Enter Container Shell

```bash
# Backend
docker exec -it leadvibes-backend bash

# Frontend
docker exec -it leadvibes-frontend sh

# MongoDB
docker exec -it leadvibes-mong mongosh
```

---

## Troubleshooting

### Port Already in Use

If you see errors about ports being taken:

```bash
# Check what's using the port
lsof -i :3001
lsof -i :8001
lsof -i :27018

# Change ports in docker-compose.yml
ports:
  - "3002:3000"  # Use 3002 instead of 3001
```

### Backend Keeps Restarting

```bash
# Check error logs
docker compose logs backend

# Common issues:
# - MongoDB not ready: Wait 10 seconds and retry
# - Missing env vars: Check docker-compose.yml environment section
```

### Cannot Connect to Backend

1. Verify backend is running:
   ```bash
   docker compose ps backend
   ```

2. Check health endpoint:
   ```bash
   curl http://localhost:8001/api/health
   ```

3. Check CORS configuration in `server.py`

### Frontend Shows "Network Error"

1. Verify `REACT_APP_API_URL` in docker-compose.yml
2. Check backend is accessible:
   ```bash
   curl http://localhost:8001/api/health
   ```

---

## Development Workflow

### Making Backend Changes

1. Edit code in `backend/` directory
2. Rebuild container:
   ```bash
   docker compose up -d --build backend
   ```
3. Changes are hot-reloaded (FastAPI auto-reload)

### Making Frontend Changes

1. Edit code in `frontend/` directory
2. Rebuild container:
   ```bash
   docker compose up -d --build frontend
   ```
3. Or use hot-reload (mounts are configured in docker-compose.yml)

### Viewing Database

```bash
# Enter MongoDB shell
docker exec -it leadvibes-mong mongosh

# Switch to leadvibes database
use leadvibes

# List collections
show collections

# Query users
db.users.find().pretty()

# Count leads
db.leads.countDocuments({})
```

---

## Production Deployment

For production deployment, refer to [DEPLOYMENT.md](DEPLOYMENT.md).

Key considerations:
- Use strong `JWT_SECRET_KEY`
- Configure proper `CORS_ORIGINS`
- Use MongoDB Atlas or managed replica set
- Enable SSL/TLS with reverse proxy
- Set up regular backups

---

## Next Steps

- Read [ARCHITECTURE.md](ARCHITECTURE.md) for system overview
- Read [API.md](API.md) for API reference
- Read [DEVELOPMENT.md](DEVELOPMENT.md) for development guide

---

## Getting Help

- **Issues**: https://github.com/softvibeslab/leadvibes/issues
- **Documentation**: https://github.com/softvibeslab/leadvibes/wiki
- **Discussions**: https://github.com/softvibeslab/leadvibes/discussions
