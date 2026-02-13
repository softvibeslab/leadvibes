"""Seed data for SelvaVibes CRM - Tulum Real Estate"""

from datetime import datetime, timezone, timedelta
import random

# Avatar URLs from design guidelines
AVATAR_URLS = [
    "https://images.unsplash.com/photo-1650784854790-fb6c2ed400d3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHwzfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMHBvcnRyYWl0JTIwZGl2ZXJzZXxlbnwwfHx8fDE3NzA5NDM1NTR8MA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1659353221237-6a1cfb73fd90?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHw0fHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMHBvcnRyYWl0JTIwZGl2ZXJzZXxlbnwwfHx8fDE3NzA5NDM1NTR8MA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
]

# 5 Brokers seed data
SEED_BROKERS = [
    {
        "id": "broker-001",
        "email": "carlos.mendoza@selvavibes.mx",
        "name": "Carlos Mendoza",
        "role": "broker",
        "avatar_url": AVATAR_URLS[0],
        "phone": "+52 984 123 4567",
        "is_active": True,
        "onboarding_completed": True,
        "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qQzE2Aw8kQvKGe"  # password: demo123
    },
    {
        "id": "broker-002",
        "email": "maria.santos@selvavibes.mx",
        "name": "María Santos",
        "role": "broker",
        "avatar_url": AVATAR_URLS[1],
        "phone": "+52 984 234 5678",
        "is_active": True,
        "onboarding_completed": True,
        "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qQzE2Aw8kQvKGe"
    },
    {
        "id": "broker-003",
        "email": "roberto.garcia@selvavibes.mx",
        "name": "Roberto García",
        "role": "broker",
        "avatar_url": AVATAR_URLS[2],
        "phone": "+52 984 345 6789",
        "is_active": True,
        "onboarding_completed": True,
        "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qQzE2Aw8kQvKGe"
    },
    {
        "id": "broker-004",
        "email": "ana.lopez@selvavibes.mx",
        "name": "Ana López",
        "role": "manager",
        "avatar_url": AVATAR_URLS[3],
        "phone": "+52 984 456 7890",
        "is_active": True,
        "onboarding_completed": True,
        "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qQzE2Aw8kQvKGe"
    },
    {
        "id": "broker-005",
        "email": "diego.ramirez@selvavibes.mx",
        "name": "Diego Ramírez",
        "role": "broker",
        "avatar_url": AVATAR_URLS[4],
        "phone": "+52 984 567 8901",
        "is_active": True,
        "onboarding_completed": True,
        "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qQzE2Aw8kQvKGe"
    }
]

# Property interests for Tulum
PROPERTY_INTERESTS = [
    "Lote residencial Aldea Zamá",
    "Lote en Holistika",
    "Terreno frente a cenote",
    "Lote cerca de playa",
    "Desarrollo Selva Escondida",
    "Lote con vista al mar",
    "Terreno en zona centro",
    "Lote en comunidad privada",
    "Desarrollo sustentable",
    "Lote premium zona norte"
]

LEAD_SOURCES = ["Facebook Ads", "Instagram", "Referido", "Google Ads", "Web Orgánico", "WhatsApp", "Evento", "Portal Inmobiliario"]

# 20 Leads seed data - Tulum real estate
SEED_LEADS = [
    {
        "id": "lead-001",
        "name": "Ricardo Hernández",
        "email": "ricardo.h@gmail.com",
        "phone": "+52 55 1234 5678",
        "status": "presentacion",
        "priority": "alta",
        "source": "Facebook Ads",
        "budget_mxn": 2500000,
        "property_interest": "Lote residencial Aldea Zamá",
        "notes": "Inversionista de CDMX, busca segunda propiedad. Muy interesado en Tulum.",
        "assigned_broker_id": "broker-001",
        "intent_score": 85
    },
    {
        "id": "lead-002",
        "name": "Jennifer Smith",
        "email": "jsmith@outlook.com",
        "phone": "+1 305 555 1234",
        "status": "apartado",
        "priority": "urgente",
        "source": "Referido",
        "budget_mxn": 4500000,
        "property_interest": "Lote con vista al mar",
        "notes": "Americana viviendo en Miami, quiere retirarse en Tulum. Ya visitó el desarrollo.",
        "assigned_broker_id": "broker-002",
        "intent_score": 95
    },
    {
        "id": "lead-003",
        "name": "Fernando Castillo",
        "email": "fcastillo@yahoo.com",
        "phone": "+52 33 9876 5432",
        "status": "calificacion",
        "priority": "media",
        "source": "Google Ads",
        "budget_mxn": 1800000,
        "property_interest": "Desarrollo Selva Escondida",
        "notes": "Empresario de Guadalajara, primera inversión en real estate.",
        "assigned_broker_id": "broker-003",
        "intent_score": 65
    },
    {
        "id": "lead-004",
        "name": "Laura Vega",
        "email": "lauravega@gmail.com",
        "phone": "+52 81 2345 6789",
        "status": "contactado",
        "priority": "alta",
        "source": "Instagram",
        "budget_mxn": 3200000,
        "property_interest": "Lote en Holistika",
        "notes": "Pareja joven de Monterrey, buscan terreno para construir casa de descanso.",
        "assigned_broker_id": "broker-001",
        "intent_score": 78
    },
    {
        "id": "lead-005",
        "name": "Michael Brown",
        "email": "mbrown@gmail.com",
        "phone": "+1 416 555 7890",
        "status": "nuevo",
        "priority": "media",
        "source": "Web Orgánico",
        "budget_mxn": 5000000,
        "property_interest": "Terreno frente a cenote",
        "notes": "Canadiense, vio video de Tulum en YouTube. Interesado en inversión.",
        "assigned_broker_id": "broker-004",
        "intent_score": 55
    },
    {
        "id": "lead-006",
        "name": "Patricia Moreno",
        "email": "pmoreno@hotmail.com",
        "phone": "+52 55 8765 4321",
        "status": "venta",
        "priority": "urgente",
        "source": "Evento",
        "budget_mxn": 2800000,
        "property_interest": "Lote residencial Aldea Zamá",
        "notes": "Cerrado! Compró lote de 500m2. Pagó de contado.",
        "assigned_broker_id": "broker-002",
        "intent_score": 100
    },
    {
        "id": "lead-007",
        "name": "Alejandro Ruiz",
        "email": "aruiz@empresa.mx",
        "phone": "+52 222 345 6789",
        "status": "presentacion",
        "priority": "alta",
        "source": "Referido",
        "budget_mxn": 3500000,
        "property_interest": "Lote cerca de playa",
        "notes": "Director de empresa en Puebla. Le interesa mucho el ROI proyectado.",
        "assigned_broker_id": "broker-003",
        "intent_score": 82
    },
    {
        "id": "lead-008",
        "name": "Emma García",
        "email": "emmagarcia@gmail.com",
        "phone": "+52 998 123 4567",
        "status": "contactado",
        "priority": "media",
        "source": "Portal Inmobiliario",
        "budget_mxn": 1500000,
        "property_interest": "Lote en comunidad privada",
        "notes": "Vive en Cancún, quiere invertir en Tulum por el crecimiento.",
        "assigned_broker_id": "broker-005",
        "intent_score": 70
    },
    {
        "id": "lead-009",
        "name": "David Müller",
        "email": "dmuller@web.de",
        "phone": "+49 170 1234567",
        "status": "nuevo",
        "priority": "baja",
        "source": "Instagram",
        "budget_mxn": 6000000,
        "property_interest": "Lote premium zona norte",
        "notes": "Alemán, digital nomad. Planea mudarse a México en 2025.",
        "assigned_broker_id": "broker-001",
        "intent_score": 45
    },
    {
        "id": "lead-010",
        "name": "Sofía Delgado",
        "email": "sofia.d@outlook.com",
        "phone": "+52 55 4567 8901",
        "status": "apartado",
        "priority": "urgente",
        "source": "Facebook Ads",
        "budget_mxn": 2200000,
        "property_interest": "Desarrollo sustentable",
        "notes": "Arquitecta, le encanta el concepto eco-friendly. Apartó con 10%.",
        "assigned_broker_id": "broker-004",
        "intent_score": 92
    },
    {
        "id": "lead-011",
        "name": "Jorge Medina",
        "email": "jmedina@gmail.com",
        "phone": "+52 33 1111 2222",
        "status": "calificacion",
        "priority": "media",
        "source": "Google Ads",
        "budget_mxn": 1900000,
        "property_interest": "Terreno en zona centro",
        "notes": "Abogado de GDL, busca diversificar inversiones.",
        "assigned_broker_id": "broker-002",
        "intent_score": 60
    },
    {
        "id": "lead-012",
        "name": "Isabella Torres",
        "email": "isa.torres@yahoo.com",
        "phone": "+52 81 3333 4444",
        "status": "presentacion",
        "priority": "alta",
        "source": "Referido",
        "budget_mxn": 4000000,
        "property_interest": "Lote con vista al mar",
        "notes": "Heredó dinero, primera gran inversión. Muy emocionada por Tulum.",
        "assigned_broker_id": "broker-003",
        "intent_score": 88
    },
    {
        "id": "lead-013",
        "name": "Lucas Fernández",
        "email": "lucas.f@gmail.com",
        "phone": "+54 11 5555 6666",
        "status": "nuevo",
        "priority": "media",
        "source": "WhatsApp",
        "budget_mxn": 2000000,
        "property_interest": "Lote residencial Aldea Zamá",
        "notes": "Argentino buscando salir del peso. Considera México como opción.",
        "assigned_broker_id": "broker-005",
        "intent_score": 58
    },
    {
        "id": "lead-014",
        "name": "Carmen Ortiz",
        "email": "cortiz@empresa.mx",
        "phone": "+52 55 7777 8888",
        "status": "venta",
        "priority": "urgente",
        "source": "Evento",
        "budget_mxn": 3800000,
        "property_interest": "Lote en Holistika",
        "notes": "Venta cerrada! Pareja de doctores. Financiaron a 12 meses.",
        "assigned_broker_id": "broker-001",
        "intent_score": 100
    },
    {
        "id": "lead-015",
        "name": "Andrés Salazar",
        "email": "asalazar@outlook.com",
        "phone": "+52 664 9999 0000",
        "status": "contactado",
        "priority": "alta",
        "source": "Facebook Ads",
        "budget_mxn": 2700000,
        "property_interest": "Desarrollo Selva Escondida",
        "notes": "Empresario de Tijuana. Muy interesado, agendó llamada para mañana.",
        "assigned_broker_id": "broker-002",
        "intent_score": 75
    },
    {
        "id": "lead-016",
        "name": "Valentina Rojas",
        "email": "vale.rojas@gmail.com",
        "phone": "+57 310 123 4567",
        "status": "calificacion",
        "priority": "media",
        "source": "Instagram",
        "budget_mxn": 1600000,
        "property_interest": "Terreno frente a cenote",
        "notes": "Colombiana viviendo en Bogotá. Vio reels del desarrollo.",
        "assigned_broker_id": "broker-003",
        "intent_score": 52
    },
    {
        "id": "lead-017",
        "name": "Martín Aguilar",
        "email": "maguilar@yahoo.com",
        "phone": "+52 55 2222 3333",
        "status": "apartado",
        "priority": "urgente",
        "source": "Referido",
        "budget_mxn": 5500000,
        "property_interest": "Lote premium zona norte",
        "notes": "CEO de startup. Apartó el mejor lote disponible. Cierra esta semana.",
        "assigned_broker_id": "broker-004",
        "intent_score": 98
    },
    {
        "id": "lead-018",
        "name": "Gabriela Luna",
        "email": "gaby.luna@hotmail.com",
        "phone": "+52 998 4444 5555",
        "status": "nuevo",
        "priority": "baja",
        "source": "Web Orgánico",
        "budget_mxn": 1200000,
        "property_interest": "Lote en comunidad privada",
        "notes": "Maestra de Cancún, ahorrando para comprar. Tal vez en 6 meses.",
        "assigned_broker_id": "broker-005",
        "intent_score": 35
    },
    {
        "id": "lead-019",
        "name": "Pablo Vargas",
        "email": "pvargas@gmail.com",
        "phone": "+52 33 6666 7777",
        "status": "presentacion",
        "priority": "alta",
        "source": "Google Ads",
        "budget_mxn": 3000000,
        "property_interest": "Lote cerca de playa",
        "notes": "Ingeniero de sistemas de GDL. Le presentamos vía Zoom, muy interesado.",
        "assigned_broker_id": "broker-001",
        "intent_score": 80
    },
    {
        "id": "lead-020",
        "name": "Natalia Reyes",
        "email": "natreyes@outlook.com",
        "phone": "+52 81 8888 9999",
        "status": "perdido",
        "priority": "baja",
        "source": "Portal Inmobiliario",
        "budget_mxn": 1400000,
        "property_interest": "Desarrollo sustentable",
        "notes": "Decidió comprar en otra zona. Mantener contacto para futuro.",
        "assigned_broker_id": "broker-002",
        "intent_score": 20
    }
]

# Gamification rules
SEED_GAMIFICATION_RULES = [
    {"id": "rule-001", "action": "llamada", "points": 1, "description": "Realizar llamada a lead", "icon": "phone"},
    {"id": "rule-002", "action": "whatsapp", "points": 1, "description": "Enviar mensaje de WhatsApp", "icon": "message-circle"},
    {"id": "rule-003", "action": "email", "points": 1, "description": "Enviar email de seguimiento", "icon": "mail"},
    {"id": "rule-004", "action": "zoom", "points": 3, "description": "Presentación por Zoom", "icon": "video"},
    {"id": "rule-005", "action": "visita", "points": 5, "description": "Visita presencial al desarrollo", "icon": "map-pin"},
    {"id": "rule-006", "action": "apartado", "points": 15, "description": "Lead aparta propiedad", "icon": "bookmark"},
    {"id": "rule-007", "action": "venta", "points": 30, "description": "Venta cerrada", "icon": "trophy"},
    {"id": "rule-008", "action": "referido", "points": 5, "description": "Lead referido calificado", "icon": "users"},
]

# Sample activities
def generate_seed_activities(tenant_id: str):
    """Generate sample activities for seed data"""
    activities = []
    activity_types = ["llamada", "whatsapp", "email", "zoom", "visita"]
    outcomes = [
        "Interesado, agendará visita",
        "No contestó, reintentar",
        "Muy interesado en lote específico",
        "Pidió más información por email",
        "Confirmó asistencia a presentación",
        "Tiene dudas sobre financiamiento",
        "Comparando con otras opciones",
        "Lista para apartar esta semana"
    ]
    
    for i in range(30):
        lead_idx = i % len(SEED_LEADS)
        broker_idx = i % len(SEED_BROKERS)
        
        activities.append({
            "id": f"activity-{str(i+1).zfill(3)}",
            "lead_id": SEED_LEADS[lead_idx]["id"],
            "broker_id": SEED_BROKERS[broker_idx]["id"],
            "activity_type": random.choice(activity_types),
            "description": f"Seguimiento a {SEED_LEADS[lead_idx]['name']}",
            "outcome": random.choice(outcomes),
            "tenant_id": tenant_id,
            "points_earned": random.choice([1, 1, 1, 3, 5]),
            "created_at": (datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30))).isoformat()
        })
    
    return activities

# Point ledger entries
def generate_seed_points(tenant_id: str):
    """Generate sample point ledger entries"""
    points = []
    actions = ["llamada", "whatsapp", "email", "zoom", "visita", "apartado", "venta"]
    action_points = {"llamada": 1, "whatsapp": 1, "email": 1, "zoom": 3, "visita": 5, "apartado": 15, "venta": 30}
    
    for broker in SEED_BROKERS:
        # Generate random points for each broker
        num_entries = random.randint(15, 40)
        for i in range(num_entries):
            action = random.choice(actions)
            points.append({
                "id": f"points-{broker['id'][-3:]}-{str(i+1).zfill(3)}",
                "broker_id": broker["id"],
                "points": action_points[action],
                "action": action,
                "description": f"Puntos por {action}",
                "tenant_id": tenant_id,
                "created_at": (datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30))).isoformat()
            })
    
    return points

# Scripts library
SEED_SCRIPTS = [
    {
        "id": "script-001",
        "title": "Apertura Inicial - Lead Nuevo",
        "category": "apertura",
        "content": """¡Hola [NOMBRE]! Soy [TU NOMBRE] de SelvaVibes Real Estate.

Vi que estás interesado en invertir en Tulum, ¡excelente decisión! 🌴

Te cuento rápido: tenemos lotes residenciales premium en las mejores zonas de Tulum, desde $1.5M MXN.

Me encantaría conocer un poco más sobre lo que buscas:
- ¿Es para inversión, retiro, o casa de descanso?
- ¿Tienes alguna zona específica en mente?
- ¿Cuál sería tu presupuesto aproximado?

¿Te gustaría agendar una llamada de 15 minutos para mostrarte las opciones disponibles?""",
        "tags": ["apertura", "lead-nuevo", "primera-llamada"]
    },
    {
        "id": "script-002",
        "title": "Seguimiento - No Contestó",
        "category": "seguimiento",
        "content": """Hola [NOMBRE], soy [TU NOMBRE] de SelvaVibes.

Intenté comunicarme contigo hace unos días sobre los lotes en Tulum.

Entiendo que estás ocupado/a, pero no quería que perdieras la oportunidad de conocer nuestros desarrollos antes de que suban de precio.

📈 Dato interesante: Los terrenos en Tulum han aumentado 15-20% anual en los últimos 3 años.

¿Cuándo te quedaría bien una llamada rápida de 10 minutos?

Opciones:
- Mañana a las [HORA]
- [OTRO DÍA] por la tarde

¿Cuál te funciona mejor?""",
        "tags": ["seguimiento", "no-contesto", "reenganche"]
    },
    {
        "id": "script-003",
        "title": "Presentación Zoom - Invitación",
        "category": "presentacion",
        "content": """¡Hola [NOMBRE]!

Como platicamos, te invito a una presentación virtual de nuestros desarrollos en Tulum.

📅 Fecha: [FECHA]
⏰ Hora: [HORA] (Hora México)
💻 Plataforma: Zoom

En 30 minutos verás:
✅ Ubicación exacta y accesos
✅ Amenidades del desarrollo
✅ Plusvalía proyectada
✅ Planes de financiamiento
✅ Tour virtual del terreno

Link de Zoom: [LINK]

¿Confirmas tu asistencia? 🙌""",
        "tags": ["zoom", "presentacion", "virtual"]
    },
    {
        "id": "script-004",
        "title": "Cierre - Objeciones de Precio",
        "category": "cierre",
        "content": """Entiendo tu preocupación sobre el precio, [NOMBRE].

Pero déjame preguntarte algo importante:

¿Cuánto crees que costará este mismo terreno en 3 años? 

📊 Datos reales:
- En 2020, lotes similares costaban 40% menos
- La zona se está desarrollando rápidamente
- Nuevos hoteles y amenidades en construcción

Hoy tienes la oportunidad de entrar a precio de pre-venta.

Además, ofrecemos:
💰 Financiamiento hasta 24 meses
💰 Enganche desde 20%
💰 Sin intereses los primeros 6 meses

¿Qué te parece si apartas con el mínimo y aseguras el precio actual?""",
        "tags": ["cierre", "objeciones", "precio"]
    },
    {
        "id": "script-005",
        "title": "Post-Venta - Bienvenida",
        "category": "post-venta",
        "content": """¡Felicidades [NOMBRE]! 🎉

¡Ya eres parte de la familia SelvaVibes!

Quiero confirmarte que tu lote [NÚMERO] en [DESARROLLO] ya está registrado a tu nombre.

Próximos pasos:
1. Recibirás tu contrato por email en 24-48 hrs
2. Te enviaremos acceso al portal de propietarios
3. Agendaremos tu visita presencial al terreno

¿Tienes amigos o familiares que también estén buscando invertir en Tulum? 

Por cada referido que cierre, recibes [BENEFICIO].

¡Gracias por confiar en nosotros! 🌴""",
        "tags": ["post-venta", "bienvenida", "referidos"]
    }
]
