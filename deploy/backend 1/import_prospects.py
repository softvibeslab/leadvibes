#!/usr/bin/env python3
"""
Importa 121 leads de agencias inmobiliarias a Rovi CRM para prospectación
Los leads se importan en la cuenta del admin para gestionar ventas del CRM
"""
import csv
import json
import requests
import asyncio
from pathlib import Path
from datetime import datetime
import sys

# Configuración
BACKEND_URL = "http://localhost:8100"
ADMIN_EMAIL = "admin@rovi.crm"
ADMIN_PASSWORD = "RoviProspect2026!"

# Archivos CSV
CSV_RIVIERA_MAYA = "/rogervibes/leadvibes/docs/leads/agencias_inmobiliarias_riviera_maya_keywords_20260418085456_full.csv"
CSV_MEXICO = "/rogervibes/leadvibes/docs/leads/agencias_inmobiliarias_mexico_100_leads_20260418085515_full.csv"


def parse_json_field(field_value):
    """Parsea campos JSON del CSV de Apify"""
    if not field_value or field_value == "":
        return None

    try:
        # Apify exporta JSONs como strings con comillas dobles
        cleaned = field_value.strip()
        if cleaned.startswith("[") or cleaned.startswith("{"):
            return json.loads(cleaned)
    except:
        pass

    return None


def extract_email(contact_emails_json):
    """Extrae el email profesional del campo JSON"""
    if not contact_emails_json:
        return None

    emails = parse_json_field(contact_emails_json)
    if not emails:
        return None

    # Si no es una lista, intentar parsear de nuevo
    if not isinstance(emails, list):
        if isinstance(emails, str) and "@" in emails:
            return emails
        return None

    # Buscar email profesional actual
    for email_obj in emails:
        if isinstance(email_obj, dict) and email_obj.get("type") == "current_professional":
            return email_obj.get("address")

    # Si no hay profesional, retornar el primero válido
    for email_obj in emails:
        if not isinstance(email_obj, dict):
            continue
        address = email_obj.get("address")
        if address and "@" in address and "hotmail" not in address.lower():
            return address

    # Último recurso: primer email de la lista
    if emails and isinstance(emails[0], dict):
        return emails[0].get("address")

    return None


def transform_csv_row_to_lead(row, priority="media"):
    """Transforma una fila del CSV de Apify al modelo Lead de Rovi"""

    # Extraer nombre completo
    first_name = row.get("prospect_first_name", "")
    last_name = row.get("prospect_last_name", "")
    full_name = f"{first_name} {last_name}".strip()

    # Extraer email profesional
    email = extract_email(row.get("contact_emails"))

    # Extraer teléfono (usar genérico si no existe)
    phone = row.get("contact_mobile_phone") or row.get("contact_phone_numbers")
    if not phone or phone.strip() == "":
        # Usar teléfono genérico válido para México
        phone = "+52 555 555 5555"

    # Extraer información de la empresa
    company = row.get("prospect_company_name", "")
    position = row.get("prospect_job_title", "")
    city = row.get("prospect_city", "")
    region = row.get("prospect_region_name", "")

    # Crear notas con información del LinkedIn
    linkedin = row.get("prospect_linkedin", "")
    company_website = row.get("prospect_company_website", "")

    notes = f"Prospecto de agencia inmobiliaria\n"
    if company:
        notes += f"Empresa: {company}\n"
    if position:
        notes += f"Puesto: {position}\n"
    if city or region:
        notes += f"Ubicación: {city}, {region}\n"
    if linkedin:
        notes += f"LinkedIn: {linkedin}\n"
    if company_website:
        notes += f"Website: {company_website}\n"

    # Ubicación preferida (para segmentación futura)
    location_preference = city if city else region

    return {
        "name": full_name,
        "email": email,
        "phone": phone,
        "status": "nuevo",
        "priority": priority,
        "source": "prospecting",
        "budget_mxn": 0.0,
        "property_interest": None,
        "location_preference": location_preference,
        "notes": notes.strip(),
        "company": company,
        "position": position
    }


def read_csv_leads(csv_file, priority="media"):
    """Lee un CSV y retorna los leads transformados"""
    leads = []

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Solo procesar filas con email válido
            email = extract_email(row.get("contact_emails"))
            if not email:
                continue

            lead = transform_csv_row_to_lead(row, priority)
            leads.append(lead)

    return leads


def get_auth_token(email, password):
    """Obtiene token de autenticación"""
    response = requests.post(
        f"{BACKEND_URL}/api/auth/login",
        json={"email": email, "password": password}
    )

    if response.status_code != 200:
        print(f"❌ Error de autenticación: {response.text}")
        sys.exit(1)

    data = response.json()
    return data["access_token"]


def import_leads_via_api(leads, token):
    """Importa leads usando la API de Rovi"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    imported = 0
    skipped = 0
    errors = []

    print(f"\n📊 Importando {len(leads)} leads...")

    for i, lead in enumerate(leads, 1):
        try:
            # Verificar si ya existe por email
            if lead["email"]:
                existing_check = requests.get(
                    f"{BACKEND_URL}/api/leads",
                    headers=headers,
                    params={"email": lead["email"]}
                )

                if existing_check.status_code == 200:
                    existing_data = existing_check.json()
                    # La API retorna una lista directamente
                    if isinstance(existing_data, list) and len(existing_data) > 0:
                        print(f"⏭️  [{i}/{len(leads)}] {lead['name']} - Ya existe")
                        skipped += 1
                        continue
                    elif isinstance(existing_data, dict) and existing_data.get("leads") and len(existing_data["leads"]) > 0:
                        print(f"⏭️  [{i}/{len(leads)}] {lead['name']} - Ya existe")
                        skipped += 1
                        continue

            # Crear lead
            response = requests.post(
                f"{BACKEND_URL}/api/leads",
                headers=headers,
                json=lead
            )

            if response.status_code == 201 or response.status_code == 200:
                print(f"✅ [{i}/{len(leads)}] {lead['name']} - {lead['company']}")
                imported += 1
            else:
                error_msg = response.text[:100]
                print(f"❌ [{i}/{len(leads)}] Error: {error_msg}")
                errors.append({"lead": lead['name'], "error": error_msg})

        except Exception as e:
            print(f"❌ [{i}/{len(leads)}] {lead['name']} - Exception: {str(e)}")
            errors.append({"lead": lead['name'], "error": str(e)})

    return imported, skipped, errors


def main():
    """Función principal"""
    print("=" * 70)
    print("🚀 IMPORTACIÓN DE LEADS A ROVI CRM")
    print("=" * 70)

    # 1. Autenticarse
    print(f"\n🔐 Autenticando como {ADMIN_EMAIL}...")
    token = get_auth_token(ADMIN_EMAIL, ADMIN_PASSWORD)
    print("✅ Autenticación exitosa")

    # 2. Leer CSV de Riviera Maya (prioridad ALTA)
    print(f"\n📖 Leyendo CSV de Riviera Maya...")
    leads_riviera = read_csv_leads(CSV_RIVIERA_MAYA, priority="alta")
    print(f"✅ {len(leads_riviera)} leads de Riviera Maya")

    # 3. Leer CSV de México general (prioridad MEDIA)
    print(f"\n📖 Leyendo CSV de México general...")
    leads_mexico = read_csv_leads(CSV_MEXICO, priority="media")
    print(f"✅ {len(leads_mexico)} leads de México")

    # 4. Combinar todos los leads
    all_leads = leads_riviera + leads_mexico
    print(f"\n📊 Total de leads a importar: {len(all_leads)}")

    # 5. Importar leads
    imported, skipped, errors = import_leads_via_api(all_leads, token)

    # 6. Reporte final
    print("\n" + "=" * 70)
    print("📋 RESUMEN DE IMPORTACIÓN")
    print("=" * 70)
    print(f"✅ Importados: {imported}")
    print(f"⏭️  Existentes (omitidos): {skipped}")
    print(f"❌ Errores: {len(errors)}")

    if errors:
        print(f"\n📝 Errores:")
        for error in errors[:10]:  # Solo primeros 10 errores
            print(f"  - {error['lead']}: {error['error']}")

    print("\n✨ Importación completada!")
    print(f"📍 URL: {BACKEND_URL}/leads")


if __name__ == "__main__":
    main()
