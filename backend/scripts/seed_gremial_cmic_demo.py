#!/usr/bin/env python3
from __future__ import annotations

import asyncio
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path
import sys

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT_DIR))

from auth import get_password_hash  # noqa: E402

load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "rovi_crm")
DEMO_PASSWORD = os.environ.get("GREMIAL_DEMO_PASSWORD", "demo123")
TENANT_ID = "tenant-demo-cmic-national"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def days_from_now(days: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=days)


DELEGATIONS = [
    {"id": "gdel-cmic-qroo", "name": "CMIC Quintana Roo", "state": "Quintana Roo", "city": "Cancún", "president_name": "Laura Méndez", "phone": "+52 998 000 1001"},
    {"id": "gdel-cmic-cdmx", "name": "CMIC Ciudad de México", "state": "Ciudad de México", "city": "CDMX", "president_name": "Jorge Rivera", "phone": "+52 55 0000 1002"},
    {"id": "gdel-cmic-jalisco", "name": "CMIC Jalisco", "state": "Jalisco", "city": "Guadalajara", "president_name": "Mónica Álvarez", "phone": "+52 33 0000 1003"},
    {"id": "gdel-cmic-nl", "name": "CMIC Nuevo León", "state": "Nuevo León", "city": "Monterrey", "president_name": "Ricardo Salinas", "phone": "+52 81 0000 1004"},
    {"id": "gdel-cmic-yucatan", "name": "CMIC Yucatán", "state": "Yucatán", "city": "Mérida", "president_name": "Ana Pech", "phone": "+52 999 000 1005"},
]

USERS = [
    {"id": "user-demo-cmic-national", "email": "demo.cmic.nacional@rovicrm.com", "name": "CMIC Nacional Demo", "role": "gremial_national_admin", "account_type": "gremial", "tenant_id": TENANT_ID},
    {"id": "user-demo-cmic-qroo", "email": "demo.cmic.qroo@rovicrm.com", "name": "CMIC Quintana Roo Demo", "role": "gremial_delegation_admin", "account_type": "gremial", "tenant_id": TENANT_ID, "linked_gremial_delegation_id": "gdel-cmic-qroo"},
    {"id": "user-demo-cmic-member", "email": "demo.cmic.afiliado@rovicrm.com", "name": "Constructora Caribe Demo", "role": "gremial_member_admin", "account_type": "member_company", "tenant_id": "tenant-demo-cmic-member", "linked_gremial_tenant_id": TENANT_ID, "linked_gremial_member_id": "gmem-cmic-001"},
    {"id": "user-demo-cmic-risk", "email": "demo.cmic.riesgo@rovicrm.com", "name": "Constructora en Riesgo Demo", "role": "gremial_member_admin", "account_type": "member_company", "tenant_id": "tenant-demo-cmic-risk", "linked_gremial_tenant_id": TENANT_ID, "linked_gremial_member_id": "gmem-cmic-002"},
]

SPECIALTIES = ["obra civil", "edificación", "mantenimiento", "urbanización", "instalaciones", "proyectos ejecutivos"]


def build_members():
    members = []
    delegation_cycle = [d["id"] for d in DELEGATIONS]
    states = {d["id"]: d["state"] for d in DELEGATIONS}
    cities = {d["id"]: d["city"] for d in DELEGATIONS}
    for idx in range(1, 26):
        delegation_id = delegation_cycle[(idx - 1) % len(delegation_cycle)]
        status = "active" if idx not in {2, 7, 13} else "pending"
        members.append({
            "id": f"gmem-cmic-{idx:03d}",
            "tenant_id": TENANT_ID,
            "company_name": "Constructora Caribe Demo" if idx == 1 else ("Constructora en Riesgo Demo" if idx == 2 else f"Empresa Constructora Demo {idx:02d}"),
            "legal_name": f"Empresa Constructora Demo {idx:02d} S.A. de C.V.",
            "rfc": f"ECD{idx:09d}",
            "email": "demo.cmic.afiliado@rovicrm.com" if idx == 1 else ("demo.cmic.riesgo@rovicrm.com" if idx == 2 else f"contacto{idx:02d}@constructorademo.mx"),
            "phone": f"+52 55 1000 {idx:04d}",
            "state": states[delegation_id],
            "city": cities[delegation_id],
            "delegation_id": delegation_id,
            "sector": "Construcción",
            "specialties": SPECIALTIES[: 1 + (idx % len(SPECIALTIES))],
            "company_size": ["micro", "pequeña", "mediana", "grande"][idx % 4],
            "employees_count": 8 + idx * 6,
            "representative_name": f"Representante Demo {idx:02d}",
            "representative_email": f"representante{idx:02d}@constructorademo.mx",
            "member_status": status,
            "membership_tier": ["base", "pro", "premium"][idx % 3],
            "profile_completion": 100 if idx == 1 else (58 if idx == 2 else 70 + (idx % 4) * 7),
            "engagement_score": 82 if idx == 1 else (22 if idx == 2 else 40 + idx % 50),
            "created_at": now_iso(),
            "updated_at": now_iso(),
        })
    return members


def build_memberships(members):
    memberships = []
    for idx, member in enumerate(members, start=1):
        if idx in {2, 6, 11, 16}:
            payment_status, balance_due, days = "overdue", 12500.0, -15
        elif idx in {3, 8, 12, 18, 21, 24}:
            payment_status, balance_due, days = "due", 9500.0, 18
        else:
            payment_status, balance_due, days = "active", 0.0, 220
        memberships.append({
            "id": f"gmship-cmic-{idx:03d}",
            "tenant_id": TENANT_ID,
            "member_id": member["id"],
            "delegation_id": member["delegation_id"],
            "plan_name": "Afiliación empresarial anual",
            "plan_price": 15000.0,
            "billing_period": "annual",
            "renewal_date": days_from_now(days),
            "payment_status": payment_status,
            "balance_due": balance_due,
            "benefits_summary": "Acceso a licitaciones, cursos, eventos, convenios y observatorio sectorial.",
            "created_at": now_iso(),
            "updated_at": now_iso(),
        })
    return memberships


async def upsert_many(db, collection_name: str, docs: list[dict], key: str = "id"):
    collection = getattr(db, collection_name)
    for doc in docs:
        await collection.update_one({key: doc[key]}, {"$set": doc}, upsert=True)


async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    now = now_iso()

    await db.tenants.update_one({"id": TENANT_ID}, {"$set": {"id": TENANT_ID, "name": "CMIC Nacional Demo", "slug": "cmic-nacional-demo", "tenant_type": "gremial", "owner_user_id": "user-demo-cmic-national", "is_active": True, "branding": {"primary_color": "#e30613", "logo_text": "CMIC"}, "settings": {"vertical": "construction_chamber"}, "updated_at": now}, "$setOnInsert": {"created_at": now}}, upsert=True)
    await db.gremial_configs.update_one({"tenant_id": TENANT_ID}, {"$set": {"tenant_id": TENANT_ID, "name": "CMIC Nacional Demo", "vertical": "construction_chamber", "labels": {"delegation": "Delegación", "member": "Empresa afiliada", "membership": "Afiliación"}, "updated_at": now}}, upsert=True)

    for user in USERS:
        user_doc = {**user, "password_hash": get_password_hash(DEMO_PASSWORD), "is_active": True, "onboarding_completed": True, "personal_tenant_id": user.get("tenant_id"), "created_at": now, "updated_at": now}
        await db.users.update_one({"email": user["email"]}, {"$set": user_doc}, upsert=True)
        await db.tenant_memberships.update_one({"tenant_id": user.get("linked_gremial_tenant_id") or TENANT_ID, "user_id": user["id"]}, {"$set": {"id": f"tm-{TENANT_ID}-{user['id']}", "tenant_id": user.get("linked_gremial_tenant_id") or TENANT_ID, "user_id": user["id"], "role": user["role"], "status": "active", "linked_via": "manual", "is_default": True, "accepted_at": now, "created_by_user_id": "user-demo-cmic-national", "updated_at": now}, "$setOnInsert": {"joined_at": now, "created_at": now}}, upsert=True)

    await upsert_many(db, "gremial_delegations", [{"tenant_id": TENANT_ID, "status": "active", "created_at": now, "updated_at": now, **d} for d in DELEGATIONS])
    members = build_members()
    await upsert_many(db, "gremial_members", members)
    await upsert_many(db, "gremial_memberships", build_memberships(members))

    leads = [{"id": f"glead-cmic-{idx:03d}", "tenant_id": TENANT_ID, "delegation_id": DELEGATIONS[idx % len(DELEGATIONS)]["id"], "company_name": f"Prospecto Constructor Demo {idx:02d}", "contact_name": f"Contacto Prospecto {idx:02d}", "email": f"prospecto{idx:02d}@demo.mx", "phone": f"+52 55 2000 {idx:04d}", "state": DELEGATIONS[idx % len(DELEGATIONS)]["state"], "city": DELEGATIONS[idx % len(DELEGATIONS)]["city"], "interest": ["afiliacion", "licitaciones", "capacitacion", "obra_privada"][idx % 4], "source": "web", "stage": ["nuevo", "contactado", "requisitos_enviados", "documentos_recibidos"][idx % 4], "created_at": now, "updated_at": now} for idx in range(1, 9)]
    await upsert_many(db, "gremial_affiliation_leads", leads)

    services = [
        {"id": "gsvc-cmic-licitaciones", "title": "Alertas de licitaciones", "category": "inteligencia", "description": "Licitaciones filtradas por estado y especialidad.", "scope": "national", "status": "active"},
        {"id": "gsvc-cmic-capacitacion", "title": "Capacitación ICIC Demo", "category": "capacitacion", "description": "Cursos, diplomados y certificaciones para empresas afiliadas.", "scope": "national", "status": "active"},
        {"id": "gsvc-cmic-costos", "title": "Catálogos CEICO Demo", "category": "informacion", "description": "Costos, precios unitarios y referencias técnicas.", "scope": "national", "status": "active"},
    ]
    await upsert_many(db, "gremial_services", [{"tenant_id": TENANT_ID, "created_at": now, "updated_at": now, "included_tiers": ["base", "pro", "premium"], **s} for s in services])

    opportunities = [{"id": f"gopp-cmic-{idx:03d}", "tenant_id": TENANT_ID, "delegation_id": DELEGATIONS[idx % len(DELEGATIONS)]["id"], "title": f"Oportunidad privada demo {idx}", "opportunity_type": "private", "description": "Proyecto privado para empresas afiliadas con expediente completo.", "state": DELEGATIONS[idx % len(DELEGATIONS)]["state"], "sector": "Construcción", "specialties": [SPECIALTIES[idx % len(SPECIALTIES)]], "budget": 500000 * idx, "status": "published", "closes_at": days_from_now(20 + idx), "created_at": now, "updated_at": now} for idx in range(1, 7)]
    await upsert_many(db, "gremial_opportunities", opportunities)

    tenders = [{"id": f"gtender-cmic-{idx:03d}", "tenant_id": TENANT_ID, "delegation_id": DELEGATIONS[idx % len(DELEGATIONS)]["id"], "title": f"Licitación pública demo {idx}", "opportunity_type": "public_tender", "dependency": ["SCT", "SEDATU", "Gobierno Estatal", "Municipio"][idx % 4], "tender_number": f"CMIC-DEMO-{idx:04d}", "description": "Licitación pública para seguimiento gremial.", "state": DELEGATIONS[idx % len(DELEGATIONS)]["state"], "sector": "Infraestructura", "specialties": [SPECIALTIES[idx % len(SPECIALTIES)]], "budget": 1000000 * idx, "status": "published", "published_at": days_from_now(-idx), "closes_at": days_from_now(15 + idx), "created_at": now, "updated_at": now} for idx in range(1, 9)]
    await upsert_many(db, "gremial_tenders", tenders)

    courses = [
        {"id": "gcourse-cmic-licitaciones", "tenant_id": TENANT_ID, "delegation_id": "gdel-cmic-qroo", "title": "Cómo ganar licitaciones públicas sin improvisar", "category": "licitaciones", "description": "Ruta práctica para detectar convocatorias, preparar expediente, calcular propuesta y dar seguimiento desde Rovi Gremial OS.", "modality": "hibrido", "instructor": "ICIC / Comité de Infraestructura", "state": "Quintana Roo", "starts_at": days_from_now(9), "ends_at": days_from_now(10), "capacity": 60, "price": 0.0, "status": "published", "created_at": now, "updated_at": now},
        {"id": "gcourse-cmic-nom031", "tenant_id": TENANT_ID, "delegation_id": "gdel-cmic-cdmx", "title": "NOM-031 y seguridad en obra para contratistas", "category": "seguridad", "description": "Capacitación ejecutiva para reducir riesgos operativos, multas y accidentes en obra.", "modality": "presencial", "instructor": "Especialista STPS Demo", "state": "Ciudad de México", "starts_at": days_from_now(16), "ends_at": days_from_now(16), "capacity": 45, "price": 1800.0, "status": "published", "created_at": now, "updated_at": now},
        {"id": "gcourse-cmic-costos", "tenant_id": TENANT_ID, "delegation_id": "gdel-cmic-nl", "title": "Costos, precios unitarios y margen por proyecto", "category": "finanzas", "description": "Modelo para que afiliados calculen margen real y eviten obras no rentables.", "modality": "online", "instructor": "CEICO Demo", "state": "Nuevo León", "starts_at": days_from_now(24), "ends_at": days_from_now(25), "capacity": 120, "price": 950.0, "status": "open", "created_at": now, "updated_at": now},
    ]
    await upsert_many(db, "gremial_courses", courses)

    events = [
        {"id": "gevent-cmic-business-roundtable", "tenant_id": TENANT_ID, "delegation_id": "gdel-cmic-qroo", "title": "Rueda de negocio: infraestructura turística y vivienda", "event_type": "networking", "description": "Encuentro de afiliados, desarrolladores y compradores institucionales para generar oportunidades privadas.", "venue": "Cancún Center Demo", "state": "Quintana Roo", "starts_at": days_from_now(12), "ends_at": days_from_now(12), "capacity": 150, "price": 0.0, "status": "published", "created_at": now, "updated_at": now},
        {"id": "gevent-cmic-national-forum", "tenant_id": TENANT_ID, "delegation_id": None, "title": "Foro nacional: nearshoring e infraestructura 2026", "event_type": "foro", "description": "Agenda nacional para mostrar cómo la cámara conecta demanda, afiliados, licitaciones y datos de mercado.", "venue": "Sede Nacional CMIC Demo", "state": "Nacional", "starts_at": days_from_now(30), "ends_at": days_from_now(31), "capacity": 500, "price": 0.0, "status": "published", "created_at": now, "updated_at": now},
        {"id": "gevent-cmic-qroo-assembly", "tenant_id": TENANT_ID, "delegation_id": "gdel-cmic-qroo", "title": "Asamblea local CMIC Quintana Roo", "event_type": "asamblea", "description": "Sesión local con seguimiento de renovaciones, expediente, cartera y oportunidades del estado.", "venue": "Delegación Quintana Roo Demo", "state": "Quintana Roo", "starts_at": days_from_now(18), "ends_at": days_from_now(18), "capacity": 90, "price": 0.0, "status": "open", "created_at": now, "updated_at": now},
    ]
    await upsert_many(db, "gremial_events", events)

    course_registrations = [
        {"id": "gcreg-cmic-001", "tenant_id": TENANT_ID, "course_id": "gcourse-cmic-licitaciones", "member_id": "gmem-cmic-001", "delegation_id": "gdel-cmic-qroo", "status": "registered", "notes": "Registro demo de afiliado activo.", "registered_at": now, "updated_at": now},
        {"id": "gcreg-cmic-002", "tenant_id": TENANT_ID, "course_id": "gcourse-cmic-nom031", "member_id": "gmem-cmic-002", "delegation_id": "gdel-cmic-qroo", "status": "reviewing", "notes": "Registro demo de afiliado en riesgo para seguimiento.", "registered_at": now, "updated_at": now},
    ]
    await upsert_many(db, "gremial_course_registrations", course_registrations)

    event_registrations = [
        {"id": "gereg-cmic-001", "tenant_id": TENANT_ID, "event_id": "gevent-cmic-business-roundtable", "member_id": "gmem-cmic-001", "delegation_id": "gdel-cmic-qroo", "status": "registered", "notes": "Registro demo para rueda de negocio.", "registered_at": now, "updated_at": now},
        {"id": "gereg-cmic-002", "tenant_id": TENANT_ID, "event_id": "gevent-cmic-qroo-assembly", "member_id": "gmem-cmic-002", "delegation_id": "gdel-cmic-qroo", "status": "registered", "notes": "Invitación a afiliado en riesgo para reactivación.", "registered_at": now, "updated_at": now},
    ]
    await upsert_many(db, "gremial_event_registrations", event_registrations)

    documents = []
    for member in members[:12]:
        documents.append({"id": f"gdoc-{member['id']}-rfc", "tenant_id": TENANT_ID, "member_id": member["id"], "document_type": "constancia_fiscal", "file_url": "https://example.com/demo.pdf", "status": "approved" if member["id"] != "gmem-cmic-002" else "submitted", "created_at": now, "updated_at": now})
    await upsert_many(db, "gremial_documents", documents)

    # Seed deterministic AI recommendations.
    recs = [
        {"id": "grec-cmic-risk-001", "tenant_id": TENANT_ID, "delegation_id": "gdel-cmic-qroo", "member_id": "gmem-cmic-002", "category": "riesgo_baja", "priority": "high", "title": "Afiliado en riesgo de baja", "explanation": "Bajo engagement, expediente incompleto y pago vencido.", "suggested_action": "Contactar por WhatsApp, ofrecer plan de renovación y solicitar documentos faltantes.", "status": "open", "created_at": now},
        {"id": "grec-cmic-qroo-renewals", "tenant_id": TENANT_ID, "delegation_id": "gdel-cmic-qroo", "category": "renovacion", "priority": "medium", "title": "Renovaciones próximas en Quintana Roo", "explanation": "Hay afiliados con vencimiento en menos de 30 días.", "suggested_action": "Lanzar campaña local de renovación con beneficios de obra privada y cursos.", "status": "open", "created_at": now},
    ]
    await upsert_many(db, "gremial_ai_recommendations", recs)

    print("Seed Gremial CMIC Demo completado")
    print("Usuarios demo:")
    for user in USERS:
        print(f"- {user['email']} ({user['role']})")
    print("Password demo:", DEMO_PASSWORD)


if __name__ == "__main__":
    asyncio.run(main())
