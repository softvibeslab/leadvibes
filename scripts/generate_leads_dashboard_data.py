#!/usr/bin/env python3
"""Generate cleaned JSON data for the Mexico agencies leads dashboard."""

from __future__ import annotations

import csv
import json
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "docs" / "leads" / "agencias_inmobiliarias_mexico_100_leads_20260418085515_full.csv"
OUTPUT_PATH = ROOT / "frontend" / "public" / "data" / "agencias_inmobiliarias_mexico_100_leads_20260418085515_full.json"


def parse_jsonish(value: str) -> Any:
    if not value:
        return []
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return value


def clean_text(value: str) -> str:
    return (value or "").strip()


def main() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    leads: list[dict[str, Any]] = []
    companies: set[str] = set()
    countries: set[str] = set()
    cities: set[str] = set()
    valid_professional_email_count = 0
    with CSV_PATH.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
        full_name = clean_text(row.get("prospect_full_name", ""))
        if not full_name:
            continue

        company_name = clean_text(row.get("prospect_company_name", ""))
        city = clean_text(row.get("prospect_city", ""))
        country = clean_text(row.get("prospect_country_name", ""))
        professional_email = clean_text(row.get("contact_professions_email", ""))
        email_status = clean_text(row.get("contact_professional_email_status", ""))
        contact_emails = parse_jsonish(row.get("contact_emails", ""))
        experience = parse_jsonish(row.get("prospect_experience", ""))
        skills = parse_jsonish(row.get("prospect_skills", ""))
        interests = parse_jsonish(row.get("prospect_interests", ""))
        seniority = parse_jsonish(row.get("prospect_job_seniority_level", ""))
        phone_numbers = parse_jsonish(row.get("contact_phone_numbers", ""))

        if company_name:
            companies.add(company_name)
        if city:
            cities.add(city)
        if country:
            countries.add(country)
        if professional_email and email_status.lower() == "valid":
            valid_professional_email_count += 1

        created_at = clean_text(row.get("created_at", ""))
        created_at_display = created_at
        if created_at:
            try:
                created_at_display = datetime.fromisoformat(created_at.replace("Z", "+00:00")).strftime("%Y-%m-%d %H:%M UTC")
            except ValueError:
                created_at_display = created_at

        leads.append(
            {
                "row_num": int(row["row_num"]),
                "full_name": full_name,
                "first_name": clean_text(row.get("prospect_first_name", "")),
                "last_name": clean_text(row.get("prospect_last_name", "")),
                "job_title": clean_text(row.get("prospect_job_title", "")),
                "linkedin": clean_text(row.get("prospect_linkedin", "")),
                "job_department": clean_text(row.get("prospect_job_department", "")),
                "job_seniority_level": seniority if isinstance(seniority, list) else [seniority] if seniority else [],
                "country": country,
                "region": clean_text(row.get("prospect_region_name", "")),
                "city": city,
                "experience": experience if isinstance(experience, list) else [experience] if experience else [],
                "skills": skills if isinstance(skills, list) else [skills] if skills else [],
                "interests": interests if isinstance(interests, list) else [interests] if interests else [],
                "company_name": company_name,
                "company_website": clean_text(row.get("prospect_company_website", "")),
                "company_linkedin": clean_text(row.get("prospect_company_linkedin", "")),
                "professional_email": professional_email,
                "professional_email_status": email_status,
                "contact_emails": contact_emails if isinstance(contact_emails, list) else [],
                "mobile_phone": clean_text(row.get("contact_mobile_phone", "")),
                "phone_numbers": phone_numbers if isinstance(phone_numbers, list) else [phone_numbers] if phone_numbers else [],
                "created_at": created_at,
                "created_at_display": created_at_display,
                "business_id": clean_text(row.get("business_id", "")),
                "prospect_id": clean_text(row.get("prospect_id", "")),
            }
        )

    payload = {
        "generated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source_csv": str(CSV_PATH.relative_to(ROOT)),
        "totals": {
            "lead_count": len(leads),
            "company_count": len(companies),
            "city_count": len(cities),
            "country_count": len(countries),
            "valid_professional_email_count": valid_professional_email_count,
        },
        "leads": leads,
    }

    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Generated {len(leads)} leads into {OUTPUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
