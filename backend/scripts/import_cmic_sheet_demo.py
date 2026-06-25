#!/usr/bin/env python3
from __future__ import annotations

import asyncio
import os
import re
import sys
import urllib.request
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT_DIR))

load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "rovi_crm")
TENANT_ID = os.environ.get("CMIC_DEMO_TENANT_ID", "tenant-demo-cmic-national")
SHEET_ID = "1bJl0yZREOK0cyZlUibCr3ZAQGIaQR-Ijq1qByegzRyQ"
XLSX_URL = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=xlsx"

NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}

ID_OVERRIDES = {
    "quintanaroo": "gdel-cmic-qroo",
    "ciudaddemexico": "gdel-cmic-cdmx",
    "jalisco": "gdel-cmic-jalisco",
    "nuevoleon": "gdel-cmic-nl",
    "yucatan": "gdel-cmic-yucatan",
}

FIGURE_TIER = {
    "Afiliación": "base",
    "Afiliación y SIEM": "pro",
    "SIEM": "base",
    "Asociado Estudiantil": "student",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def days_from_now(days: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


def slug(value: str | None) -> str:
    value = (value or "").lower()
    replacements = str.maketrans("áéíóúüñ", "aeiouun")
    value = value.translate(replacements)
    return re.sub(r"[^a-z0-9]+", "", value)


def clean_text(value):
    if value is None:
        return None
    value = str(value).replace("Ã_x0081_", "Á").replace("Ã_x008d_", "Í")
    value = value.replace("Ã“N", "ÓN").replace("Ãš", "Ú").replace("Ã‰", "É")
    value = value.replace("Ã³", "ó").replace("Ã©", "é").replace("Ã¡", "á").replace("Ã\xad", "í")
    value = re.sub(r"\s+", " ", value).strip()
    return value or None


def parse_city_state(address: str | None, fallback_state: str):
    text = clean_text(address) or ""
    # Most rows end with "Ciudad, Estado. C.P. ...". Keep a safe best effort.
    before_cp = re.split(r"C\.P\.|CP\s*", text, flags=re.I)[0]
    parts = [p.strip(" .") for p in before_cp.split(",") if p.strip(" .")]
    city = parts[-2] if len(parts) >= 2 else fallback_state
    state = parts[-1] if parts else fallback_state
    if len(state) <= 4 or state.upper() in {"AGS", "BC", "BCS", "CDMX"}:
        state = fallback_state
    return city, state


def read_xlsx(path: Path) -> dict[str, list[dict]]:
    with zipfile.ZipFile(path) as z:
        strings = []
        if "xl/sharedStrings.xml" in z.namelist():
            root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in root.findall("a:si", NS):
                strings.append("".join((t.text or "") for t in si.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")))

        workbook = ET.fromstring(z.read("xl/workbook.xml"))
        rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
        rid_to_target = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels}

        def col_idx(ref: str) -> int:
            letters = "".join(ch for ch in ref if ch.isalpha())
            idx = 0
            for ch in letters:
                idx = idx * 26 + ord(ch.upper()) - 64
            return idx - 1

        def cell_value(cell):
            cell_type = cell.attrib.get("t")
            value = cell.find("a:v", NS)
            if cell_type == "inlineStr":
                inline = cell.find("a:is", NS)
                return "".join((x.text or "") for x in inline.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")) if inline is not None else ""
            if value is None:
                return None
            raw = value.text
            if cell_type == "s":
                return strings[int(raw)]
            return raw

        result = {}
        for sheet in workbook.find("a:sheets", NS):
            name = sheet.attrib["name"]
            rid = sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
            target = rid_to_target[rid]
            if not target.startswith("xl/"):
                target = "xl/" + target
            root = ET.fromstring(z.read(target))
            rows = []
            for row in root.findall(".//a:sheetData/a:row", NS):
                values = []
                for cell in row.findall("a:c", NS):
                    idx = col_idx(cell.attrib["r"])
                    while len(values) <= idx:
                        values.append(None)
                    values[idx] = clean_text(cell_value(cell))
                while values and values[-1] is None:
                    values.pop()
                rows.append(values)
            headers = rows[1] if len(rows) > 1 else []
            data = []
            for row in rows[2:]:
                if not any(v not in (None, "") for v in row):
                    continue
                data.append({headers[i]: (row[i] if i < len(row) else None) for i in range(len(headers)) if headers[i]})
            result[name] = data
        return result


def delegation_id_for(name: str | None) -> str:
    s = slug(name)
    return ID_OVERRIDES.get(s, f"gdel-cmic-{s[:48]}")


async def upsert_many(db, collection_name: str, docs: list[dict], key: str = "id"):
    collection = getattr(db, collection_name)
    for doc in docs:
        await collection.update_one({"tenant_id": TENANT_ID, key: doc[key]}, {"$set": doc}, upsert=True)


async def main():
    target = Path("/tmp/cmic_sheet_live.xlsx")
    urllib.request.urlretrieve(XLSX_URL, target)
    book = read_xlsx(target)
    now = now_iso()

    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    # Backup current demo collections before replacing demo scope data.
    backup = {
        "created_at": now,
        "source_sheet_id": SHEET_ID,
        "collections": {},
    }
    for collection in ["gremial_delegations", "gremial_members", "gremial_memberships", "gremial_services", "gremial_affiliation_leads"]:
        backup["collections"][collection] = await getattr(db, collection).find({"tenant_id": TENANT_ID}, {"_id": 0}).to_list(None)
    await db.gremial_import_backups.insert_one(backup)

    committees_by_delegation = defaultdict(list)
    for row in book.get("02_Comites", []):
        delegation = row.get("delegation")
        if delegation:
            committees_by_delegation[delegation].append({
                "level": row.get("level"),
                "group": row.get("group"),
                "role": row.get("role"),
                "name": row.get("name"),
                "email": row.get("email"),
                "phone": row.get("phone"),
                "source": row.get("source"),
                "confidence": row.get("confidence"),
            })

    delegations = []
    for row in book.get("01_Delegaciones", []):
        name = row.get("delegation") or row.get("office_name")
        did = delegation_id_for(name)
        leaders = committees_by_delegation.get(name, [])
        president = next((p for p in leaders if (p.get("role") or "").lower().startswith("presidente")), None)
        city, state = parse_city_state(row.get("address"), name or "")
        delegations.append({
            "id": did,
            "tenant_id": TENANT_ID,
            "name": row.get("office_name") or f"CMIC {name}",
            "state": state or name,
            "city": city or name,
            "coverage_zone": name,
            "office_type": row.get("office_type"),
            "address": row.get("address"),
            "phone": row.get("phones"),
            "email": row.get("emails"),
            "website": row.get("website"),
            "admin_name": row.get("contact_name"),
            "president_name": president.get("name") if president else None,
            "leadership_team": leaders,
            "source": row.get("source"),
            "confidence": row.get("confidence"),
            "status": "active",
            "created_at": now,
            "updated_at": now,
        })

    # Replace only the territorial catalog so dashboard reflects the real CMIC footprint (44).
    await db.gremial_delegations.delete_many({"tenant_id": TENANT_ID})
    await upsert_many(db, "gremial_delegations", delegations)

    delegation_by_name = {d["coverage_zone"]: d for d in delegations}
    delegation_names = list(delegation_by_name.keys())
    def match_delegation(name):
        if name in delegation_by_name:
            return delegation_by_name[name]
        s = slug(name)
        for real_name, doc in delegation_by_name.items():
            if slug(real_name) == s or s in slug(real_name) or slug(real_name) in s:
                return doc
        return delegations[0]

    members = []
    memberships = []
    for idx, row in enumerate(book.get("07_Registros_Publicos", []), start=1):
        delegation = match_delegation(row.get("delegation"))
        member_id = f"gmem-cmic-public-{row.get('public_record_id') or idx}"
        figure = row.get("figure") or "Registro público"
        status = "active" if "Afiliación" in figure or "SIEM" in figure else "pending"
        company_name = row.get("business_or_person_name") or f"Registro CMIC {idx}"
        members.append({
            "id": member_id,
            "tenant_id": TENANT_ID,
            "company_name": company_name,
            "legal_name": company_name,
            "rfc": None,
            "email": None,
            "phone": None,
            "state": delegation.get("state"),
            "city": delegation.get("city"),
            "delegation_id": delegation.get("id"),
            "sector": "Construcción",
            "specialties": [figure],
            "company_size": "no especificado",
            "employees_count": None,
            "representative_name": None,
            "representative_email": None,
            "member_status": status,
            "membership_tier": FIGURE_TIER.get(figure, "base"),
            "profile_completion": 55 if status == "pending" else 78,
            "engagement_score": 35 if status == "pending" else 64,
            "source": row.get("source"),
            "source_public_record_id": row.get("public_record_id"),
            "confidence": row.get("confidence"),
            "notes": row.get("notes"),
            "created_at": now,
            "updated_at": now,
        })
        memberships.append({
            "id": f"gmship-cmic-public-{row.get('public_record_id') or idx}",
            "tenant_id": TENANT_ID,
            "member_id": member_id,
            "delegation_id": delegation.get("id"),
            "plan_name": figure,
            "plan_price": 15000.0 if "Afiliación" in figure else 5000.0,
            "billing_period": "annual",
            "renewal_date": days_from_now(45 + (idx % 240)),
            "payment_status": "active" if status == "active" else "due",
            "balance_due": 0.0 if status == "active" else 5000.0,
            "benefits_summary": f"Registro público CMIC {row.get('period') or ''}: {figure}",
            "source": row.get("source"),
            "created_at": now,
            "updated_at": now,
        })

    # Keep the 2 special login-linked member records, then add real public records.
    await upsert_many(db, "gremial_members", members)
    await upsert_many(db, "gremial_memberships", memberships)

    providers = []
    provider_members = []
    for idx, row in enumerate(book.get("06_Proveedores", []), start=1):
        raw_company = row.get("company") or ""
        company = raw_company if not raw_company.isdigit() else (row.get("giro") or f"Proveedor CMIC {idx}")
        providers.append({
            "id": f"gsvc-cmic-provider-{idx:03d}",
            "tenant_id": TENANT_ID,
            "title": company[:180],
            "category": "proveedor",
            "description": row.get("description") or row.get("giro"),
            "scope": "national" if row.get("national_coverage") == "X" else "delegation",
            "status": "active",
            "included_tiers": ["base", "pro", "premium"],
            "contact_email": row.get("contact_email"),
            "contact_phone": row.get("contact_phone_1"),
            "website": row.get("website"),
            "valid_from": row.get("valid_from"),
            "valid_to": row.get("valid_to"),
            "source": row.get("source"),
            "created_at": now,
            "updated_at": now,
        })
        provider_members.append({
            "id": f"gmem-cmic-provider-{idx:03d}",
            "tenant_id": TENANT_ID,
            "company_name": company[:180],
            "legal_name": company[:180],
            "email": (row.get("contact_email") or "").split(";")[0].strip() or None,
            "phone": row.get("contact_phone_1"),
            "state": None,
            "city": row.get("city"),
            "delegation_id": None,
            "sector": "Proveedor de la construcción",
            "specialties": [row.get("giro") or "proveedor"],
            "member_status": "active",
            "membership_tier": "supplier",
            "profile_completion": 70,
            "engagement_score": 60,
            "source": row.get("source"),
            "created_at": now,
            "updated_at": now,
        })
    await upsert_many(db, "gremial_services", providers)
    await upsert_many(db, "gremial_members", provider_members)

    institutions = []
    for idx, row in enumerate(book.get("04_Instituciones", []), start=1):
        institutions.append({
            "id": f"gsvc-cmic-institution-{idx:03d}",
            "tenant_id": TENANT_ID,
            "title": row.get("name"),
            "category": "institucion",
            "description": row.get("role"),
            "scope": "national",
            "status": "active",
            "included_tiers": ["base", "pro", "premium"],
            "website": row.get("website"),
            "source": row.get("source"),
            "confidence": row.get("confidence"),
            "created_at": now,
            "updated_at": now,
        })
    await upsert_many(db, "gremial_services", institutions)

    national_reps = []
    for idx, row in enumerate(book.get("03_Rep_Nacionales", []), start=1):
        national_reps.append({"id": f"gleader-cmic-national-{idx:03d}", "tenant_id": TENANT_ID, **row, "scope": "national", "created_at": now, "updated_at": now})
    await upsert_many(db, "gremial_leadership", national_reps)

    partnerships = []
    for idx, row in enumerate(book.get("05_Convenios", []), start=1):
        title = row.get("agreement_title") or f"Convenio CMIC {idx}"
        counterparty = row.get("counterparty_inferred") or title[:120]
        partnerships.append({
            "id": f"gpart-cmic-{idx:04d}",
            "tenant_id": TENANT_ID,
            "category": row.get("category"),
            "date": row.get("date"),
            "counterparty": counterparty,
            "title": title,
            "pdf_url": row.get("pdf_url"),
            "source": row.get("source"),
            "confidence": row.get("confidence"),
            "notes": row.get("notes"),
            "created_at": now,
            "updated_at": now,
        })
    await upsert_many(db, "gremial_partnerships", partnerships)

    # Make some real agreements visible in the existing opportunities UI.
    agreement_opportunities = []
    for idx, item in enumerate(partnerships[:12], start=1):
        agreement_opportunities.append({
            "id": f"gopp-cmic-convenio-{idx:03d}",
            "tenant_id": TENANT_ID,
            "delegation_id": None,
            "title": f"Convenio / alianza: {item['counterparty'][:90]}",
            "opportunity_type": "partnership",
            "description": item["title"],
            "state": "Nacional",
            "sector": "Convenios CMIC",
            "specialties": [item.get("category") or "convenio"],
            "budget": 0,
            "status": "published",
            "closes_at": days_from_now(90 + idx),
            "source": item.get("source"),
            "created_at": now,
            "updated_at": now,
        })
    await upsert_many(db, "gremial_opportunities", agreement_opportunities)

    summary = {
        "delegations": len(delegations),
        "committee_members": sum(len(x.get("leadership_team") or []) for x in delegations),
        "public_records_as_members": len(members),
        "provider_services": len(providers),
        "provider_members": len(provider_members),
        "institutions": len(institutions),
        "national_reps": len(national_reps),
        "partnerships": len(partnerships),
        "visible_agreement_opportunities": len(agreement_opportunities),
        "backup_id": str(backup.get("_id", "")),
    }
    await db.gremial_import_logs.insert_one({"tenant_id": TENANT_ID, "source_sheet_id": SHEET_ID, "summary": summary, "created_at": now})
    print(summary)
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
