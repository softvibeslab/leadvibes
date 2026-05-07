#!/usr/bin/env python3
"""
Importar leads reales desde archivos CSV a MongoDB Staging
y eliminar datos demo.
"""

import csv
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
import pymongo
from pymongo import MongoClient
import uuid

# Configuración MongoDB Staging
MONGO_URL = "mongodb://admin:staging_admin_secure_password_change_me_12345@localhost:2504/rovi_crm_staging?authSource=admin"
DB_NAME = "rovi_crm_staging"

# Tenant ID del admin user
TENANT_ID = "tenant-e021330b"

def import_leads_from_csv(csv_file_path):
    """Importar leads desde un archivo CSV"""
    leads = []

    with open(csv_file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Extraer email del array JSON
            email = None
            try:
                emails_json = row.get('contact_emails', '[]')
                if emails_json and emails_json != '[]':
                    emails_list = json.loads(emails_json.replace("'", '"'))
                    if emails_list and len(emails_list) > 0:
                        email = emails_list[0].get('address')
            except:
                # Fallback a contact_professions_email
                email = row.get('contact_professions_email')

            # Si no hay email, usar profesional
            if not email:
                email = row.get('contact_professions_email')

            # Extraer teléfono del array JSON
            phone = None
            try:
                phones_json = row.get('contact_phone_numbers', '[]')
                if phones_json and phones_json != '[]':
                    phones_list = json.loads(phones_json.replace("'", '"'))
                    if phones_list and len(phones_list) > 0:
                        phone = phones_list[0]
            except:
                pass

            # Fallback a mobile phone
            if not phone:
                phone = row.get('contact_mobile_phone')

            # Si no hay teléfono, usar uno genérico
            if not phone:
                phone = "+52 000 000 0000"

            # Parsear habilidades e intereses
            skills = []
            try:
                skills_json = row.get('prospect_skills', '[]')
                if skills_json and skills_json != '[]':
                    skills_list = json.loads(skills_json.replace("'", '"').replace('""', '"'))
                    skills = skills_list[:5] if isinstance(skills_list, list) else []
            except:
                pass

            # Crear notas con información completa
            notes_parts = []

            # Información de la empresa
            if row.get('prospect_company_name'):
                notes_parts.append(f"Empresa: {row['prospect_company_name']}")
            if row.get('prospect_job_title'):
                notes_parts.append(f"Puesto: {row['prospect_job_title']}")
            if row.get('prospect_company_website'):
                notes_parts.append(f"Website: {row['prospect_company_website']}")

            # Ubicación
            location_parts = []
            if row.get('prospect_city'):
                location_parts.append(row['prospect_city'])
            if row.get('prospect_region_name'):
                location_parts.append(row['prospect_region_name'])
            if row.get('prospect_country_name'):
                location_parts.append(row['prospect_country_name'])

            if location_parts:
                notes_parts.append(f"Ubicación: {', '.join(location_parts)}")

            # Habilidades clave
            if skills:
                notes_parts.append(f"Habilidades: {', '.join(skills[:3])}")

            # LinkedIn
            if row.get('prospect_linkedin'):
                notes_parts.append(f"LinkedIn: {row['prospect_linkedin']}")

            notes = "\n".join(notes_parts) if notes_parts else "Lead importado desde CSV"

            # Determinar prioridad basado en información disponible
            priority = "media"
            if email and phone and phone != "+52 000 000 0000":
                priority = "alta"
            elif row.get('prospect_job_seniority_level') in ['director', 'executive', 'ceo', 'founder']:
                priority = "urgente"

            lead = {
                "id": str(uuid.uuid4()),
                "name": row.get('prospect_full_name', f"{row.get('prospect_first_name', '')} {row.get('prospect_last_name', '')}".strip()),
                "email": email,
                "phone": phone,
                "status": "nuevo",
                "priority": priority,
                "source": "import_csv",
                "budget_mxn": 0,
                "property_interest": None,
                "location_preference": ", ".join(location_parts) if location_parts else None,
                "notes": notes,
                "company": row.get('prospect_company_name'),
                "position": row.get('prospect_job_title'),
                "assigned_broker_id": None,
                "created_by": None,
                "tenant_id": TENANT_ID,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "ai_analysis": {
                    "lead_score": 50,
                    "interest_level": "medium",
                    "timeline": "unknown",
                    "source": "csv_import",
                    "import_file": Path(csv_file_path).name
                },
                "intent_score": 50,
                "next_action": "contactar"
            }

            leads.append(lead)

    return leads

def main():
    print("🚀 Iniciando importación de leads reales a MongoDB Staging...")

    try:
        # Conectar a MongoDB
        print("📡 Conectando a MongoDB Staging...")
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]

        # Eliminar leads demo existentes
        print("🗑️  Eliminando leads demo existentes...")
        result = db.leads.delete_many({"tenant_id": TENANT_ID})
        print(f"✅ {result.deleted_count} leads demo eliminados")

        # Importar leads desde ambos archivos CSV
        csv_files = [
            "docs/leads/agencias_inmobiliarias_mexico_100_leads_20260418085515_full.csv",
            "docs/leads/agencias_inmobiliarias_riviera_maya_keywords_20260418085456_full.csv"
        ]

        total_leads = 0
        for csv_file in csv_files:
            print(f"📄 Procesando {csv_file}...")
            leads = import_leads_from_csv(csv_file)

            if leads:
                # Insertar leads en MongoDB
                result = db.leads.insert_many(leads)
                total_leads += len(leads)
                print(f"✅ {len(leads)} leads importados desde {Path(csv_file).name}")

        print(f"\n🎉 ¡Importación completada!")
        print(f"📊 Total de leads importados: {total_leads}")
        print(f"📍 Base de datos: {DB_NAME}")
        print(f"🏢 Tenant ID: {TENANT_ID}")

        # Mostrar algunos leads de ejemplo
        print(f"\n📋 Ejemplo de leads importados:")
        sample_leads = list(db.leads.find({"tenant_id": TENANT_ID}).limit(3))
        for i, lead in enumerate(sample_leads, 1):
            print(f"\n{i}. {lead.get('name')} - {lead.get('company')}")
            print(f"   Email: {lead.get('email')}")
            print(f"   Teléfono: {lead.get('phone')}")
            print(f"   Prioridad: {lead.get('priority')}")

        client.close()

    except Exception as e:
        print(f"❌ Error durante la importación: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()