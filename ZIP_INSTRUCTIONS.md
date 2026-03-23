# 📦 LeadVibes - Archivo de Deploy Comprimido

## Archivo Creado

```
leadvibes-deploy.tar.gz (11 KB)
```

## Contenido del ZIP

```
leadvibes-deploy/
├── deploy/
│   ├── docker-compose.yml          # Archivo principal
│   ├── .env.example                # Variables de entorno
│   ├── deploy.sh                   # Script de deploy
│   ├── backup.sh                   # Script de backup
│   ├── README.md                   # Guía completa
│   ├── HOSTINGER_DEPLOY.md         # Guía Hostinger
│   ├── DOCKERHUB_URL.txt           # URLs Docker
│   └── *.conf                      # Nginx configs
├── backend/
│   └── Dockerfile                  # Backend container
└── frontend/
    ├── Dockerfile                  # Frontend container
    └── nginx.conf                  # Nginx config
```

## Cómo Usar el ZIP

### Opción A: Subir al VPS y descomprimir

```bash
# Subir archivo
scp leadvibes-deploy.tar.gz root@srv1318804.hstgr.cloud:/root/

# En el VPS
ssh root@srv1318804.hstgr.cloud
cd /root
tar -xzf leadvibes-deploy.tar.gz
cd leadvibes-deploy
./deploy.sh
```

### Opción B: Usar directamente desde GitHub (RECOMENDADO) ⭐

**NO necesitas el ZIP** si usas la Opción 1.

Simplemente usa esta URL en el panel Docker:

```
https://github.com/softvibeslab/leadvibes.git
Rama: feature/tdd-implementation-49percent
```

## Pasos para Opción 1 (GitHub URL)

Ver instrucciones completas en: **PASO_A_PASO_OPCION1.md**

Resumen rápido:
1. Panel Hostinger → Docker Manager
2. Nuevo Proyecto → Nombre: leadvibes-preview
3. URL: https://github.com/softvibeslab/leadvibes.git
4. Rama: feature/tdd-implementation-49percent
5. Click: Implementar
6. ✅ Esperar 5-10 min
7. 🎉 Listo!

## Variables Críticas

Antes de deploy, asegúrate de configurar:

```bash
MONGO_ROOT_PASSWORD=tu_password_segura
JWT_SECRET=tu_jwt_secret_generado
CORS_ORIGINS=https://tu-dominio.com
REACT_APP_BACKEND_URL=https://api.tu-dominio.com
```

## Soporte

- **Guía Paso a Paso**: PASO_A_PASO_OPCION1.md
- **Guía Completa**: deploy/README.md
- **Hostinger**: https://panel.hostinger.com

---
