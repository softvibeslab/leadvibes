# Documentación de Rovi CRM

Bienvenido a la documentación completa de Rovi CRM, un sistema de gestión de relaciones con clientes (CRM) para el mercado inmobiliario de alto valor en México.

## 📚 Documentación Disponible

### [Backend Documentation](./BACKEND.md)
Documentación técnica completa del backend FastAPI + MongoDB.

**Contenido**:
- Visión general y arquitectura
- Configuración del entorno
- Modelos de datos (Pydantic)
- Todos los API endpoints
- Autenticación y autorización
- Integraciones (VAPI, Twilio, SendGrid, Google Calendar, OpenAI)
- Servicios de IA
- Estructura de base de datos
- Guía de pruebas

### [Frontend Documentation](./FRONTEND.md)
Documentación técnica completa del frontend React 19.

**Contenido**:
- Visión general y arquitectura
- Configuración del entorno
- Sistema de diseño (Tulum Luxury)
- Componentes UI (shadcn/ui)
- Todas las páginas del sistema
- State management (Context API)
- Sistema de routing
- Integración con API
- Build y deploy

### [Deployment Guide](./DEPLOYMENT.md)
Guía paso a paso para desplegar Rovi CRM en producción.

**Contenido**:
- Requisitos previos del servidor
- Preparación del entorno
- Deploy del backend (FastAPI + PM2)
- Deploy del frontend (React + Nginx)
- Configuración de MongoDB (Atlas o VPS)
- Configuración de SSL con Let's Encrypt
- Monitoreo y logs
- Mantenimiento y backups
- Troubleshooting

## 🚀 Inicio Rápido

### Para Desarrolladores

1. **Revisar la documentación del backend** para entender la API y modelos de datos
2. **Revisar la documentación del frontend** para entender la arquitectura de componentes
3. **Leer la guía de deployment** para entender el flujo de despliegue

### Para DevOps

1. **Leer la guía de deployment** primero
2. **Configurar el servidor** según requisitos
3. **Seguir los pasos de deploy** para backend y frontend
4. **Configurar monitoreo y backups**

## 📋 Archivos de Documentación

```
docs/
├── README.md          # Este archivo - Índice de documentación
├── BACKEND.md         # Documentación completa del backend
├── FRONTEND.md        # Documentación completa del frontend
└── DEPLOYMENT.md      # Guía paso a paso de deployment
```

## 🔗 Recursos Adicionales

- [CLAUDE.md](../CLAUDE.md) - Guía para Claude Code
- [PRD.md](../memory/PRD.md) - Product Requirements Document
- [README.md](../README.md) - Información general del proyecto

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Backend | FastAPI (Python 3.10+) |
| Base de Datos | MongoDB (Atlas o VPS) |
| Frontend | React 19 + React Router v7 |
| Estilos | Tailwind CSS + shadcn/ui |
| Build | CRACO (Create React App) |
| Despliegue | PM2 + Nginx |
| IA | OpenAI (via Emergent) |
| Comunicaciones | VAPI, Twilio, SendGrid |

## 📞 Soporte

Para preguntas sobre la implementación o despliegue de Rovi CRM, contactar al equipo de desarrollo.

---

**Rovi Real Estate** - CRM Inmobiliario Premium
