#!/usr/bin/env python3
"""
Script para importar leads reales desde archivos CSV y eliminar leads demo.
"""
import csv
import json
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from pathlib import Path

# Configuración de MongoDB
MONGO_URL = os.getenv("MONGO_URL", "mongodb://admin:rovi_local_dev_change_me@localhost:27027")
DB_NAME = os.getenv("DB_NAME", "rovi_crm")

async def main():
    # Conectar a MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    print("🔗 Conectado a MongoDB")

    # Verificar si hay usuarios
    users_count = await db.users.count_documents({})
    print(f"📊 Usuarios existentes: {users_count}")

    if users_count == 0:
        print("❌ No hay usuarios en la base de datos. Creando usuario admin...")
        # Crear usuario admin por defecto
        from auth import get_password_hash
        admin_user = {
            "email": "admin@rovi.crm",
            "name": "Admin Rovi",
            "password_hash": get_password_hash("admin123"),
            "role": "admin",
            "account_type": "agency",
            "tenant_id": "tenant-admin",
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(admin_user)
        print("✅ Usuario admin creado: admin@rovi.crm / admin123")
        tenant_id = "tenant-admin"
    else:
        # Obtener el primer usuario para su tenant_id
        user = await db.users.find_one({})
        tenant_id = user.get("tenant_id", "tenant-default")
        print(f"✅ Usando tenant_id: {tenant_id}")

    # Eliminar todos los leads existentes
    leads_delete_result = await db.leads.delete_many({"tenant_id": tenant_id})
    print(f"🗑️  Leads eliminados: {leads_delete_result.deleted_count}")

    # Eliminar actividades asociadas
    activities_delete_result = await db.activities.delete_many({"tenant_id": tenant_id})
    print(f"🗑️  Actividades eliminadas: {activities_delete_result.deleted_count}")

    # Procesar archivos CSV
    leads_dir = Path("/app/leads_data")
    csv_files = list(leads_dir.glob("*.csv"))

    total_imported = 0
    total_errors = 0

    for csv_file in csv_files:
        print(f"\n📄 Procesando: {csv_file.name}")

        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)

            for row_num, row in enumerate(reader, 1):
                try:
                    # Mapear campos del CSV al modelo Lead
                    name = row.get('prospect_full_name', '').strip()
                    if not name:
                        # Si no hay nombre completo, intentar construirlo
                        first_name = row.get('prospect_first_name', '').strip()
                        last_name = row.get('prospect_last_name', '').strip()
                        name = f"{first_name} {last_name}".strip()

                    if not name:
                        print(f"⚠️  Fila {row_num}: Sin nombre, saltando")
                        total_errors += 1
                        continue

                    # Email
                    email = row.get('contact_professions_email', '').strip()
                    if not email:
                        # Intentar obtener emails del campo contact_emails (JSON)
                        contact_emails = row.get('contact_emails', '')
                        if contact_emails:
                            try:
                                emails_list = json.loads(contact_emails.replace('""', '"'))
                                if emails_list:
                                    # Buscar email profesional actual
                                    for email_obj in emails_list:
                                        if email_obj.get('type') == 'current_professional':
                                            email = email_obj.get('address', '')
                                            break
                                    if not email:
                                        email = emails_list[0].get('address', '')
                            except:
                                pass

                    # Teléfono
                    phone = row.get('contact_mobile_phone', '').strip()
                    if not phone:
                        # Intentar obtener del campo contact_phone_numbers (JSON)
                        phone_numbers = row.get('contact_phone_numbers', '')
                        if phone_numbers:
                            try:
                                phones_list = json.loads(phone_numbers.replace('""', '"'))
                                if phones_list:
                                    phone = phones_list[0].get('number', '') if isinstance(phones_list[0], dict) else str(phones_list[0])
                            except:
                                pass

                    # Si no hay teléfono, usar un placeholder
                    if not phone:
                        phone = "+52 000 000 0000"

                    # Compañía y posición
                    company = row.get('prospect_company_name', '').strip()
                    position = row.get('prospect_job_title', '').strip()

                    # Ubicación (ciudad, región, país)
                    location_parts = []
                    city = row.get('prospect_city', '').strip()
                    region = row.get('prospect_region_name', '').strip()
                    country = row.get('prospect_country_name', '').strip()

                    if city:
                        location_parts.append(city.title())
                    if region and region.lower() != city.lower():
                        location_parts.append(region.title())
                    if country and country.lower() not in [region.lower(), city.lower()]:
                        location_parts.append(country.title())

                    location_preference = ", ".join(location_parts) if location_parts else None

                    # Crear notas con información adicional
                    notes_parts = []

                    # LinkedIn
                    linkedin = row.get('prospect_linkedin', '').strip()
                    if linkedin:
                        notes_parts.append(f"LinkedIn: {linkedin}")

                    # Sitio web compañía
                    company_website = row.get('prospect_company_website', '').strip()
                    if company_website:
                        notes_parts.append(f"Web: {company_website}")

                    # Seniority level
                    seniority = row.get('prospect_job_seniority_level', '').strip()
                    if seniority:
                        try:
                            seniority_list = json.loads(seniority.replace('""', '"'))
                            if seniority_list:
                                notes_parts.append(f"Nivel: {', '.join(seniority_list)}")
                        except:
                            pass

                    # Departamento
                    department = row.get('prospect_job_department', '').strip()
                    if department:
                        notes_parts.append(f"Departamento: {department}")

                    notes = "\n".join(notes_parts) if notes_parts else None

                    # Crear documento Lead
                    lead = {
                        "name": name,
                        "email": email if email else None,
                        "phone": phone,
                        "status": "nuevo",
                        "priority": "media",
                        "source": "importacion_csv",
                        "budget_mxn": 0.0,
                        "property_interest": None,
                        "location_preference": location_preference,
                        "notes": notes,
                        "company": company if company else None,
                        "position": position if position else None,
                        "assigned_broker_id": None,
                        "created_by": None,
                        "tenant_id": tenant_id,
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow(),
                        "ai_analysis": None,
                        "intent_score": 50,
                        "next_action": None,
                        "last_contact": None
                    }

                    # Insertar en la base de datos
                    result = await db.leads.insert_one(lead)
                    total_imported += 1

                    if total_imported % 10 == 0:
                        print(f"   ✅ Importados: {total_imported}")

                except Exception as e:
                    print(f"❌ Error fila {row_num}: {str(e)}")
                    total_errors += 1
                    continue

    print(f"\n📊 RESUMEN:")
    print(f"   ✅ Leads importados: {total_imported}")
    print(f"   ❌ Errores: {total_errors}")
    print(f"   📋 Total leads en BD: {await db.leads.count_documents({'tenant_id': tenant_id})}")

    # Cerrar conexión
    client.close()
    print("\n👋 Proceso completado")

if __name__ == "__main__":
    asyncio.run(main())