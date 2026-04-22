#!/usr/bin/env python3
"""Script para probar el parsing del CSV"""
import csv
import json

CSV_FILE = "/rogervibes/leadvibes/docs/leads/agencias_inmobiliarias_riviera_maya_keywords_20260418085456_full.csv"

with open(CSV_FILE, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        if i >= 2:  # Solo primeras 2 filas
            break

        print(f"\n=== Fila {i+1} ===")
        print(f"Nombre: {row.get('prospect_first_name')} {row.get('prospect_last_name')}")
        print(f"Emails (raw): {row.get('contact_emails')[:200]}...")

        # Intentar parsear
        try:
            emails_json = row.get('contact_emails', '')
            print(f"Type: {type(emails_json)}")

            if emails_json:
                # Limpiar y parsear
                cleaned = emails_json.strip()
                if cleaned.startswith('[') or cleaned.startswith('{'):
                    emails = json.loads(cleaned)
                    print(f"Parsed type: {type(emails)}")
                    print(f"Emails: {emails}")
        except Exception as e:
            print(f"Error: {e}")
