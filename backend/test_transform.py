#!/usr/bin/env python3
"""Debug del transform de CSV a Lead"""
import csv
import json

CSV_FILE = "/rogervibes/leadvibes/docs/leads/agencias_inmobiliarias_riviera_maya_keywords_20260418085456_full.csv"

def parse_json_field(field_value):
    """Parsea campos JSON del CSV de Apify"""
    if not field_value or field_value == "":
        return None
    try:
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

    if not isinstance(emails, list):
        if isinstance(emails, str) and "@" in emails:
            return emails
        return None

    for email_obj in emails:
        if isinstance(email_obj, dict) and email_obj.get("type") == "current_professional":
            return email_obj.get("address")

    for email_obj in emails:
        if not isinstance(email_obj, dict):
            continue
        address = email_obj.get("address")
        if address and "@" in address and "hotmail" not in address.lower():
            return address

    if emails and isinstance(emails[0], dict):
        return emails[0].get("address")

    return None

def transform_csv_row_to_lead(row, priority="media"):
    """Transforma una fila del CSV de Apify al modelo Lead de Rovi"""

    first_name = row.get("prospect_first_name", "")
    last_name = row.get("prospect_last_name", "")
    full_name = f"{first_name} {last_name}".strip()

    email = extract_email(row.get("contact_emails"))

    company = row.get("prospect_company_name", "")
    position = row.get("prospect_job_title", "")

    return {
        "name": full_name,
        "email": email,
        "company": company,
        "position": position
    }

# Probar con las primeras 3 filas
with open(CSV_FILE, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        if i >= 3:
            break

        try:
            lead = transform_csv_row_to_lead(row)
            print(f"\n✅ Fila {i+1}: {lead['name']}")
            print(f"   Email: {lead['email']}")
            print(f"   Company: {lead['company']}")
            print(f"   Position: {lead['position']}")
        except Exception as e:
            print(f"\n❌ Fila {i+1}: Error - {e}")
            import traceback
            traceback.print_exc()
