"""
Module Tracker System for Rovi CRM
Tracks module completion, MVP readiness, and client onboarding progress
"""
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime, timezone


class ModuleStatus(str, Enum):
    """Estado de implementación del módulo"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    TESTING = "testing"
    COMPLETED = "completed"
    PRODUCTION_READY = "production_ready"


class MVPTier(str, Enum):
    """Niveles de MVP según tipo de cliente"""
    ESSENTIAL = "essential"  # Broker individual - mínimo viable
    STANDARD = "standard"    # Broker individual - completo
    PROFESSIONAL = "professional"  # Agencia pequeña
    ENTERPRISE = "enterprise"  # Agencia grande - todo incluido


# Definición de módulos del CRM
CRM_MODULES = {
    # ==================== MÓDULOS ESENCIALES ====================
    "auth": {
        "id": "auth",
        "name": "Autenticación y Usuarios",
        "description": "Registro, login, perfiles y gestión de usuarios",
        "category": "core",
        "mvp_tiers": ["essential", "standard", "professional", "enterprise"],
        "dependencies": [],
        "backend_endpoints": [
            "POST /api/auth/register",
            "POST /api/auth/login",
            "GET /api/auth/me"
        ],
        "frontend_pages": ["LoginPage", "OnboardingPage"],
        "estimated_hours": 8,
        "status": ModuleStatus.PRODUCTION_READY,
        "completion": 100,
        "tested": True,
        "notes": "JWT, multi-tenancy, tipos de cuenta (individual/agency)"
    },

    "dashboard": {
        "id": "dashboard",
        "name": "Dashboard Principal",
        "description": "Vista general de KPIs, leaderboard y actividad",
        "category": "core",
        "mvp_tiers": ["essential", "standard", "professional", "enterprise"],
        "dependencies": ["auth", "gamification"],
        "backend_endpoints": [
            "GET /api/dashboard/stats",
            "GET /api/dashboard/leaderboard",
            "GET /api/dashboard/recent-activity",
            "GET /api/dashboard/kpi-detail/{kpi_type}"
        ],
        "frontend_pages": ["DashboardPage"],
        "estimated_hours": 16,
        "status": ModuleStatus.PRODUCTION_READY,
        "completion": 100,
        "tested": True,
        "notes": "KPIs clickeables, modales de detalle"
    },

    "leads_pipeline": {
        "id": "leads_pipeline",
        "name": "Pipeline de Leads",
        "description": "Gestión de leads con kanban, filtros y seguimiento",
        "category": "sales",
        "mvp_tiers": ["essential", "standard", "professional", "enterprise"],
        "dependencies": ["auth"],
        "backend_endpoints": [
            "GET /api/leads",
            "POST /api/leads",
            "PUT /api/leads/{lead_id}",
            "DELETE /api/leads/{lead_id}",
            "POST /api/leads/{lead_id}/analyze"
        ],
        "frontend_pages": ["LeadsPage"],
        "estimated_hours": 24,
        "status": ModuleStatus.PRODUCTION_READY,
        "completion": 95,
        "tested": True,
        "notes": "Kanban drag&drop, tabla, filtros dinámicos"
    },

    # ==================== MÓDULOS ESTÁNDAR ====================
    "import_leads": {
        "id": "import_leads",
        "name": "Importación de Leads",
        "description": "Importar leads desde CSV/XLSX con mapeo de columnas",
        "category": "sales",
        "mvp_tiers": ["standard", "professional", "enterprise"],
        "dependencies": ["leads_pipeline"],
        "backend_endpoints": [
            "POST /api/import/upload",
            "POST /api/import/preview",
            "POST /api/import/execute",
            "GET /api/import/jobs"
        ],
        "frontend_pages": ["ImportLeadsPage"],
        "estimated_hours": 16,
        "status": ModuleStatus.PRODUCTION_READY,
        "completion": 95,
        "tested": True,
        "notes": "Compatible con GHL, HubSpot, Pipedrive"
    },

    "calendar": {
        "id": "calendar",
        "name": "Calendario",
        "description": "Gestión de eventos y citas con Google Calendar sync",
        "category": "productivity",
        "mvp_tiers": ["standard", "professional", "enterprise"],
        "dependencies": ["auth"],
        "backend_endpoints": [
            "GET /api/calendar/events",
            "POST /api/calendar/events",
            "PUT /api/calendar/events/{event_id}",
            "DELETE /api/calendar/events/{event_id}",
            "GET /api/oauth/google/callback"
        ],
        "frontend_pages": ["CalendarPage"],
        "estimated_hours": 20,
        "status": ModuleStatus.COMPLETED,
        "completion": 90,
        "tested": True,
        "notes": "OAuth Google Calendar, sync bidireccional"
    },

    "gamification": {
        "id": "gamification",
        "name": "Gamificación",
        "description": "Sistema de puntos, leaderboard y reglas personalizables",
        "category": "engagement",
        "mvp_tiers": ["standard", "professional", "enterprise"],
        "dependencies": ["auth"],
        "backend_endpoints": [
            "GET /api/gamification/rules",
            "POST /api/gamification/rules",
            "GET /api/gamification/points"
        ],
        "frontend_pages": ["GamificationPage"],
        "estimated_hours": 16,
        "status": ModuleStatus.COMPLETED,
        "completion": 90,
        "tested": True,
        "notes": "Puntos por actividad, leaderboard mensual"
    },

    "scripts": {
        "id": "scripts",
        "name": "Scripts de Venta",
        "description": "Biblioteca de scripts de venta con IA",
        "category": "sales",
        "mvp_tiers": ["standard", "professional", "enterprise"],
        "dependencies": ["auth"],
        "backend_endpoints": [
            "GET /api/scripts",
            "POST /api/scripts",
            "GET /api/scripts/{script_id}"
        ],
        "frontend_pages": ["ScriptsPage"],
        "estimated_hours": 8,
        "status": ModuleStatus.COMPLETED,
        "completion": 85,
        "tested": True,
        "notes": "Scripts predefinidos, generación con IA"
    },

    "database_chat": {
        "id": "database_chat",
        "name": "Chat con Base de Datos",
        "description": "Consultar datos en lenguaje natural",
        "category": "ai",
        "mvp_tiers": ["standard", "professional", "enterprise"],
        "dependencies": ["leads_pipeline"],
        "backend_endpoints": [
            "POST /api/database-chat"
        ],
        "frontend_pages": ["DatabaseChatPage"],
        "estimated_hours": 12,
        "status": ModuleStatus.COMPLETED,
        "completion": 90,
        "tested": True,
        "notes": "IA para consultas en español"
    },

    # ==================== MÓDULOS PROFESIONAL ====================
    "campaigns": {
        "id": "campaigns",
        "name": "Campañas",
        "description": "Campañas masivas de llamadas, SMS y email",
        "category": "marketing",
        "mvp_tiers": ["professional", "enterprise"],
        "dependencies": ["leads_pipeline", "email_templates"],
        "backend_endpoints": [
            "GET /api/campaigns",
            "POST /api/campaigns",
            "POST /api/campaigns/{campaign_id}/start",
            "GET /api/calls",
            "GET /api/sms",
            "GET /api/emails"
        ],
        "frontend_pages": ["CampaignsPage"],
        "estimated_hours": 32,
        "status": ModuleStatus.IN_PROGRESS,
        "completion": 70,
        "tested": False,
        "notes": "Integración VAPI, Twilio, SendGrid pendiente"
    },

    "email_templates": {
        "id": "email_templates",
        "name": "Editor de Email Templates",
        "description": "Editor visual de templates con drag-and-drop",
        "category": "marketing",
        "mvp_tiers": ["professional", "enterprise"],
        "dependencies": ["auth"],
        "backend_endpoints": [
            "GET /api/email-templates",
            "POST /api/email-templates",
            "PUT /api/email-templates/{template_id}",
            "POST /api/email-templates/send-test"
        ],
        "frontend_pages": ["EmailEditorPage"],
        "estimated_hours": 24,
        "status": ModuleStatus.COMPLETED,
        "completion": 90,
        "tested": True,
        "notes": "Editor visual, variables dinámicas"
    },

    "analytics": {
        "id": "analytics",
        "name": "Analytics Avanzado",
        "description": "Reportes detallados de métricas y rendimiento",
        "category": "analytics",
        "mvp_tiers": ["professional", "enterprise"],
        "dependencies": ["leads_pipeline", "campaigns"],
        "backend_endpoints": [
            "GET /api/analytics/overview",
            "GET /api/analytics/by-source/{source}",
            "GET /api/analytics/timeline",
            "POST /api/analytics/export"
        ],
        "frontend_pages": ["AnalyticsPage"],
        "estimated_hours": 20,
        "status": ModuleStatus.IN_PROGRESS,
        "completion": 80,
        "tested": False,
        "notes": "Métricas por canal, ROI, conversiones"
    },

    "encuentra_leads": {
        "id": "encuentra_leads",
        "name": "Encuentra Leads (Scraping)",
        "description": "Buscar leads en LinkedIn y Meta con Apify",
        "category": "marketing",
        "mvp_tiers": ["professional", "enterprise"],
        "dependencies": ["leads_pipeline"],
        "backend_endpoints": [
            "POST /api/scraper/run",
            "GET /api/scraper/jobs/{job_id}",
            "POST /api/scraper/leads/{scraped_lead_id}/save"
        ],
        "frontend_pages": ["EncuentraLeadsPage"],
        "estimated_hours": 16,
        "status": ModuleStatus.COMPLETED,
        "completion": 85,
        "tested": False,
        "notes": "Integración con Apify, templates de búsqueda"
    },

    "products": {
        "id": "products",
        "name": "Productos/Servicios",
        "description": "Catálogo de productos y servicios a vender",
        "category": "sales",
        "mvp_tiers": ["professional", "enterprise"],
        "dependencies": ["auth"],
        "backend_endpoints": [
            "GET /api/products",
            "POST /api/products",
            "PUT /api/products/{product_id}",
            "DELETE /api/products/{product_id}"
        ],
        "frontend_pages": ["ProductsPage"],
        "estimated_hours": 12,
        "status": ModuleStatus.COMPLETED,
        "completion": 85,
        "tested": False,
        "notes": "Templates por nicho, asignación a campañas"
    },

    # ==================== MÓDULOS ENTERPRISE ====================
    "automations": {
        "id": "automations",
        "name": "Automatizaciones (n8n)",
        "description": "Workflows personalizados con n8n",
        "category": "automation",
        "mvp_tiers": ["enterprise"],
        "dependencies": ["leads_pipeline", "campaigns"],
        "backend_endpoints": [
            "GET /api/automations/workflows",
            "POST /api/automations/workflows",
            "PUT /api/automations/workflows/{workflow_id}"
        ],
        "frontend_pages": ["AutomationsPage"],
        "estimated_hours": 24,
        "status": ModuleStatus.IN_PROGRESS,
        "completion": 75,
        "tested": False,
        "notes": "Integración con n8n webhooks pendiente"
    },

    "brokers": {
        "id": "brokers",
        "name": "Gestión de Brokers",
        "description": "Administrar equipo de brokers (solo agencias)",
        "category": "team",
        "mvp_tiers": ["professional", "enterprise"],
        "dependencies": ["auth"],
        "backend_endpoints": [
            "GET /api/brokers",
            "POST /api/brokers",
            "PUT /api/brokers/{broker_id}"
        ],
        "frontend_pages": ["BrokersPage"],
        "estimated_hours": 12,
        "status": ModuleStatus.COMPLETED,
        "completion": 85,
        "tested": True,
        "notes": "Solo visible para cuentas tipo agency"
    },

    "settings": {
        "id": "settings",
        "name": "Configuración de Integraciones",
        "description": "Configurar VAPI, Twilio, SendGrid, Google, Apify",
        "category": "core",
        "mvp_tiers": ["essential", "standard", "professional", "enterprise"],
        "dependencies": ["auth"],
        "backend_endpoints": [
            "GET /api/settings/integrations",
            "PUT /api/settings/integrations",
            "POST /api/settings/integrations/test-vapi",
            "POST /api/settings/integrations/test-twilio"
        ],
        "frontend_pages": ["SettingsPage"],
        "estimated_hours": 16,
        "status": ModuleStatus.COMPLETED,
        "completion": 90,
        "tested": True,
        "notes": "API keys, webhooks, OAuth"
    },

    "landing_page": {
        "id": "landing_page",
        "name": "Landing Page Pública",
        "description": "Página de captura de leads",
        "category": "marketing",
        "mvp_tiers": ["essential", "standard", "professional", "enterprise"],
        "dependencies": ["auth"],
        "backend_endpoints": [
            "POST /api/landing/lead",
            "GET /api/landing/leads"
        ],
        "frontend_pages": ["LandingPage"],
        "estimated_hours": 12,
        "status": ModuleStatus.PRODUCTION_READY,
        "completion": 100,
        "tested": True,
        "notes": "Secciones: Hero, Features, Testimonios, Form"
    },
}


# MVP Configuration por tier
MVP_CONFIG = {
    MVPTier.ESSENTIAL: {
        "name": "MVP Esencial",
        "description": "Para brokers individuales que necesitan lo básico",
        "modules": [
            "auth",
            "dashboard",
            "leads_pipeline",
            "settings",
            "landing_page"
        ],
        "estimated_hours": 68,
        "price_point": "$49/mes",
        "target_audience": "Broker independiente beginner"
    },

    MVPTier.STANDARD: {
        "name": "MVP Estándar",
        "description": "Para brokers individuales serios",
        "modules": [
            "auth",
            "dashboard",
            "leads_pipeline",
            "import_leads",
            "calendar",
            "gamification",
            "scripts",
            "database_chat",
            "settings",
            "landing_page"
        ],
        "estimated_hours": 132,
        "price_point": "$99/mes",
        "target_audience": "Broker independiente experimentado"
    },

    MVPTier.PROFESSIONAL: {
        "name": "MVP Profesional",
        "description": "Para pequeñas agencias inmobiliarias",
        "modules": [
            "auth",
            "dashboard",
            "leads_pipeline",
            "import_leads",
            "calendar",
            "gamification",
            "scripts",
            "database_chat",
            "campaigns",
            "email_templates",
            "analytics",
            "encuentra_leads",
            "products",
            "brokers",
            "settings",
            "landing_page"
        ],
        "estimated_hours": 268,
        "price_point": "$299/mes",
        "target_audience": "Agencia pequeña (2-5 brokers)"
    },

    MVPTier.ENTERPRISE: {
        "name": "MVP Enterprise",
        "description": "Para agencias grandes con todo incluido",
        "modules": [
            "auth",
            "dashboard",
            "leads_pipeline",
            "import_leads",
            "calendar",
            "gamification",
            "scripts",
            "database_chat",
            "campaigns",
            "email_templates",
            "analytics",
            "encuentra_leads",
            "products",
            "automations",
            "brokers",
            "settings",
            "landing_page"
        ],
        "estimated_hours": 292,
        "price_point": "$599/mes",
        "target_audience": "Agencia grande (6+ brokers)"
    }
}


# Plan de implementación a 4 semanas
WEEKLY_PLAN = {
    "week_1": {
        "name": "Semana 1: Fundamentos Críticos",
        "focus": "MVP Esencial funcional",
        "modules": ["auth", "leads_pipeline", "settings"],
        "tasks": [
            "Completar autenticación con JWT",
            "Pipeline de leads con CRUD completo",
            "Configuración de integraciones",
            "Tests end-to-end del flujo de leads"
        ],
        "deliverables": [
            "Usuario puede registrarse y login",
            "CRUD completo de leads",
            "Sistema de filtros y búsqueda",
            "Persistencia en MongoDB"
        ],
        "hours": 40,
        "acceptance_criteria": [
            "Un broker puede registrar 10 leads en 5 minutos",
            "Los leads persisten correctamente",
            "Los filtros funcionan en tiempo real"
        ]
    },

    "week_2": {
        "name": "Semana 2: Visualización y Actividad",
        "focus": "Dashboard + Calendario + Importación",
        "modules": ["dashboard", "calendar", "import_leads"],
        "tasks": [
            "Dashboard con KPIs en tiempo real",
            "Calendario con eventos",
            "Importación CSV/XLSX con mapeo",
            "Sync con Google Calendar (OAuth)"
        ],
        "deliverables": [
            "Dashboard muestra stats correctos",
            "Importar 100 leads en < 2 minutos",
            "Crear eventos y sincronizar con Google"
        ],
        "hours": 40,
        "acceptance_criteria": [
            "Dashboard actualiza sin refresh",
            "Import detecta duplicados",
            "OAuth Google funciona correctamente"
        ]
    },

    "week_3": {
        "name": "Semana 3: Marketing y Conversión",
        "focus": "Campañas + Email Templates + Analytics",
        "modules": ["campaigns", "email_templates", "analytics"],
        "tasks": [
            "Completar integración VAPI (llamadas)",
            "Completar integración Twilio (SMS)",
            "Completar integración SendGrid (email)",
            "Reportes de analytics",
            "Editor visual de emails"
        ],
        "deliverables": [
            "Lanzar campaña masiva de 100 leads",
            "Editor de emails funcional",
            "Analytics muestra métricas por campaña"
        ],
        "hours": 40,
        "acceptance_criteria": [
            "Campaña envía 100 mensajes en < 5 min",
            "Tracking de opens/clicks en emails",
            "ROI calculado por campaña"
        ]
    },

    "week_4": {
        "name": "Semana 4: Scale y Automatización",
        "focus": "Automatizaciones + Scraping + Testing Final",
        "modules": ["automations", "encuentra_leads", "products"],
        "tasks": [
            "Integración con n8n",
            "Scraping de LinkedIn/Meta funcional",
            "Catálogo de productos",
            "Suite de tests E2E completa",
            "Deploy a producción",
            "Documentación de usuario"
        ],
        "deliverables": [
            "Workflows de n8n funcionando",
            "Encontrar 50 leads en LinkedIn",
            "Tests E2E pasando",
            "Deploy en producción estable",
            "Manual de usuario completo"
        ],
        "hours": 40,
        "acceptance_criteria": [
            "n8n webhook responde en < 3s",
            "Scraping retorna datos válidos",
            "95% de tests pasando",
            "Uptime 99.9% en producción"
        ]
    }
}


# Funciones helper
def get_modules_for_tier(tier: MVPTier) -> List[str]:
    """Obtener lista de módulos para un tier específico"""
    return MVP_CONFIG[tier]["modules"]


def get_module_info(module_id: str) -> Optional[Dict[str, Any]]:
    """Obtener información de un módulo"""
    return CRM_MODULES.get(module_id)


def get_completion_percentage(modules: List[str]) -> float:
    """Calcular porcentaje de completado de una lista de módulos"""
    if not modules:
        return 0.0

    total_completion = sum(
        CRM_MODULES.get(m, {}).get("completion", 0)
        for m in modules
        if m in CRM_MODULES
    )
    return total_completion / len(modules)


def get_next_modules(tier: MVPTier, completed_modules: List[str]) -> List[str]:
    """Obtener próximos módulos a implementar basado en dependencias"""
    target_modules = set(get_modules_for_tier(tier))
    completed = set(completed_modules)

    # Módulos pendientes
    pending = target_modules - completed

    # Filtrar por dependencias cumplidas
    ready = []
    for module_id in pending:
        module = CRM_MODULES.get(module_id, {})
        dependencies = module.get("dependencies", [])

        # Si todas las dependencias están completadas
        if all(dep in completed for dep in dependencies):
            ready.append(module_id)

    return sorted(ready, key=lambda m: CRM_MODULES.get(m, {}).get("estimated_hours", 0))


def get_weekly_plan_summary() -> Dict[str, Any]:
    """Resumen del plan de 4 semanas"""
    return {
        "total_weeks": 4,
        "total_hours": sum(w["hours"] for w in WEEKLY_PLAN.values()),
        "all_modules": list(CRM_MODULES.keys()),
        "weekly_breakdown": WEEKLY_PLAN
    }


if __name__ == "__main__":
    # Tests
    print("=== MÓDULOS PARA MVP ESSENTIAL ===")
    print(get_modules_for_tier(MVPTier.ESSENTIAL))
    print(f"Completado: {get_completion_percentage(get_modules_for_tier(MVPTier.ESSENTIAL)):.1f}%")

    print("\n=== PRÓXIMOS MÓDULOS A IMPLEMENTAR (STANDARD) ===")
    print(get_next_modules(MVPTier.STANDARD, ["auth", "leads_pipeline"]))

    print("\n=== PLAN DE 4 SEMANAS ===")
    print(get_weekly_plan_summary())
