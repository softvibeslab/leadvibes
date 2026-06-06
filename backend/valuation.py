from __future__ import annotations

import math
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from auth import get_current_user


VALUATION_ALLOWED_ROLES = {
    "certified_valuator",
    "admin",
    "manager",
    "broker",
    "property_manager",
    "copim_admin",
    "copim_operator",
    "rovi_admin",
}


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def serialize_value(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, list):
        return [serialize_value(item) for item in value]
    if isinstance(value, dict):
        return {key: serialize_value(val) for key, val in value.items() if key != "_id"}
    return value


def serialize_doc(doc: Optional[dict]) -> Optional[dict]:
    if doc is None:
        return None
    return serialize_value({key: value for key, value in doc.items() if key != "_id"})


def serialize_docs(docs: list[dict]) -> list[dict]:
    return [serialize_doc(doc) for doc in docs]


def tenant_id_for(current_user: dict) -> str:
    return current_user.get("active_tenant_id") or current_user.get("tenant_id", "")


def require_valuation_access(current_user: dict) -> dict:
    if (
        current_user.get("role") in VALUATION_ALLOWED_ROLES
        or current_user.get("account_type") in {"valuation", "agency", "individual", "property_management", "copim", "rovi_internal"}
    ):
        return current_user
    raise HTTPException(status_code=403, detail="Tu rol no tiene acceso al modulo de valuacion.")


def clean_payload(payload: dict) -> dict:
    return {key: value for key, value in payload.items() if value is not None}


def as_float(value: Any, default: float = 0.0) -> float:
    try:
        if value in (None, ""):
            return default
        parsed = float(value)
        if math.isnan(parsed) or math.isinf(parsed):
            return default
        return parsed
    except Exception:
        return default


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


class ValuationComparableCreate(BaseModel):
    title: str
    operation_type: str = "sale"  # sale, rent
    property_type: str = "apartment"
    zone: str = "Tulum Centro"
    address: Optional[str] = None
    source_type: str = "listing"  # listing, closed_transaction, appraisal, broker_input, official, manual
    source_url: Optional[str] = None
    transaction_date: Optional[str] = None
    price_mxn: float = 0.0
    monthly_rent_mxn: float = 0.0
    land_area_m2: float = 0.0
    construction_area_m2: float = 0.0
    bedrooms: float = 0.0
    bathrooms: float = 0.0
    age_years: float = 0.0
    condition_score: float = 7.0
    quality_score: float = 7.0
    amenities: list[str] = Field(default_factory=list)
    market_trend_monthly_pct: float = 0.0
    notes: Optional[str] = None


class ValuationComparableUpdate(BaseModel):
    title: Optional[str] = None
    operation_type: Optional[str] = None
    property_type: Optional[str] = None
    zone: Optional[str] = None
    address: Optional[str] = None
    source_type: Optional[str] = None
    source_url: Optional[str] = None
    transaction_date: Optional[str] = None
    price_mxn: Optional[float] = None
    monthly_rent_mxn: Optional[float] = None
    land_area_m2: Optional[float] = None
    construction_area_m2: Optional[float] = None
    bedrooms: Optional[float] = None
    bathrooms: Optional[float] = None
    age_years: Optional[float] = None
    condition_score: Optional[float] = None
    quality_score: Optional[float] = None
    amenities: Optional[list[str]] = None
    market_trend_monthly_pct: Optional[float] = None
    notes: Optional[str] = None


class ValuationRegulationCreate(BaseModel):
    title: str
    municipality: str = "Tulum"
    zone: str = "Tulum Centro"
    program_type: str = "PDU"  # PDU, PMDU, PPDU, POEL, POETDUM, Reglamento
    program_name: str = "Programa vigente"
    publication_date: Optional[str] = None
    source_url: Optional[str] = None
    source_confidence: str = "pending"  # official, pending, user_provided
    zoning_key: Optional[str] = None
    land_use: Optional[str] = None
    cos: Optional[float] = None
    cus: Optional[float] = None
    density_units_per_ha: Optional[float] = None
    max_height_m: Optional[float] = None
    max_levels: Optional[float] = None
    uga: Optional[str] = None
    ecological_policy: Optional[str] = None
    compatible_uses: list[str] = Field(default_factory=list)
    restricted_uses: list[str] = Field(default_factory=list)
    risk_flags: list[str] = Field(default_factory=list)
    notes: Optional[str] = None
    status: str = "active"


class ValuationRegulationUpdate(BaseModel):
    title: Optional[str] = None
    municipality: Optional[str] = None
    zone: Optional[str] = None
    program_type: Optional[str] = None
    program_name: Optional[str] = None
    publication_date: Optional[str] = None
    source_url: Optional[str] = None
    source_confidence: Optional[str] = None
    zoning_key: Optional[str] = None
    land_use: Optional[str] = None
    cos: Optional[float] = None
    cus: Optional[float] = None
    density_units_per_ha: Optional[float] = None
    max_height_m: Optional[float] = None
    max_levels: Optional[float] = None
    uga: Optional[str] = None
    ecological_policy: Optional[str] = None
    compatible_uses: Optional[list[str]] = None
    restricted_uses: Optional[list[str]] = None
    risk_flags: Optional[list[str]] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class ValuationCaseCreate(BaseModel):
    title: str
    client_name: Optional[str] = None
    operation_type: str = "sale"  # sale, rent, both
    property_type: str = "apartment"
    zone: str = "Tulum Centro"
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    land_area_m2: float = 0.0
    construction_area_m2: float = 0.0
    bedrooms: float = 0.0
    bathrooms: float = 0.0
    parking_spaces: float = 0.0
    age_years: float = 0.0
    condition_score: float = 7.0
    quality_score: float = 7.0
    amenities: list[str] = Field(default_factory=list)
    legal_status: str = "clear_title"
    market_liquidity: str = "medium"  # low, medium, high
    asking_price_mxn: float = 0.0
    monthly_rent_mxn: float = 0.0
    target_cap_rate: float = 0.085
    occupancy_rate: float = 0.82
    annual_expenses_mxn: float = 0.0
    replacement_cost_per_m2: float = 16000.0
    land_value_override_per_m2: Optional[float] = None
    regulation_id: Optional[str] = None
    notes: Optional[str] = None
    status: str = "draft"


class ValuationCaseUpdate(BaseModel):
    title: Optional[str] = None
    client_name: Optional[str] = None
    operation_type: Optional[str] = None
    property_type: Optional[str] = None
    zone: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    land_area_m2: Optional[float] = None
    construction_area_m2: Optional[float] = None
    bedrooms: Optional[float] = None
    bathrooms: Optional[float] = None
    parking_spaces: Optional[float] = None
    age_years: Optional[float] = None
    condition_score: Optional[float] = None
    quality_score: Optional[float] = None
    amenities: Optional[list[str]] = None
    legal_status: Optional[str] = None
    market_liquidity: Optional[str] = None
    asking_price_mxn: Optional[float] = None
    monthly_rent_mxn: Optional[float] = None
    target_cap_rate: Optional[float] = None
    occupancy_rate: Optional[float] = None
    annual_expenses_mxn: Optional[float] = None
    replacement_cost_per_m2: Optional[float] = None
    land_value_override_per_m2: Optional[float] = None
    regulation_id: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


def area_for(case: dict, comparable: Optional[dict] = None) -> float:
    item = comparable or case
    property_type = (case.get("property_type") or item.get("property_type") or "").lower()
    if property_type in {"land", "lot", "terreno"}:
        return max(as_float(item.get("land_area_m2")), as_float(item.get("construction_area_m2")), 1.0)
    return max(as_float(item.get("construction_area_m2")), as_float(item.get("land_area_m2")), 1.0)


def source_quality(source_type: str) -> float:
    return {
        "closed_transaction": 1.0,
        "official": 0.95,
        "appraisal": 0.9,
        "listing": 0.74,
        "broker_input": 0.66,
        "manual": 0.58,
    }.get(source_type or "manual", 0.58)


def legal_multiplier(legal_status: str) -> float:
    status = (legal_status or "").lower()
    if "irregular" in status or "ejidal" in status:
        return 0.86
    if "pending" in status or "revision" in status:
        return 0.94
    if "gravamen" in status or "lien" in status:
        return 0.95
    return 1.0


def liquidity_multiplier(market_liquidity: str) -> float:
    return {"low": 0.94, "medium": 1.0, "high": 1.04}.get(market_liquidity or "medium", 1.0)


def months_since(date_value: Optional[str]) -> float:
    if not date_value:
        return 0.0
    try:
        parsed = datetime.fromisoformat(date_value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return max(0.0, (now_utc() - parsed).days / 30.0)
    except Exception:
        return 0.0


def adjusted_comparable_unit(case: dict, comparable: dict, mode: str) -> Optional[dict]:
    subject_area = area_for(case)
    comparable_area = area_for(case, comparable)
    amount = as_float(comparable.get("price_mxn")) if mode == "sale" else as_float(comparable.get("monthly_rent_mxn"))
    if amount <= 0 or comparable_area <= 0:
        return None

    unit = amount / comparable_area
    condition_delta = as_float(case.get("condition_score"), 7.0) - as_float(comparable.get("condition_score"), 7.0)
    quality_delta = as_float(case.get("quality_score"), 7.0) - as_float(comparable.get("quality_score"), 7.0)
    age_delta = as_float(comparable.get("age_years")) - as_float(case.get("age_years"))
    amenity_delta = len(case.get("amenities") or []) - len(comparable.get("amenities") or [])
    area_delta = (comparable_area - subject_area) / max(subject_area, 1.0)
    trend = as_float(comparable.get("market_trend_monthly_pct")) / 100.0 * months_since(comparable.get("transaction_date"))
    zone_adjustment = 0.0 if (case.get("zone") or "").lower() == (comparable.get("zone") or "").lower() else -0.035

    adjustment = (
        condition_delta * 0.022
        + quality_delta * 0.024
        + clamp(age_delta * 0.004, -0.08, 0.08)
        + clamp(amenity_delta * 0.006, -0.04, 0.06)
        + clamp(area_delta * 0.055, -0.09, 0.09)
        + clamp(trend, -0.12, 0.18)
        + zone_adjustment
    )
    adjusted_unit = unit * (1 + adjustment)
    weight = source_quality(comparable.get("source_type", "manual")) * (1 - min(abs(area_delta), 0.45))
    if zone_adjustment < 0:
        weight *= 0.82

    return {
        "id": comparable.get("id"),
        "title": comparable.get("title"),
        "source_type": comparable.get("source_type"),
        "zone": comparable.get("zone"),
        "unit_value": round(unit, 2),
        "adjusted_unit_value": round(max(adjusted_unit, 0), 2),
        "adjustment_pct": round(adjustment * 100, 2),
        "weight": round(max(weight, 0.05), 3),
    }


def weighted_average(items: list[dict], value_key: str = "adjusted_unit_value") -> Optional[float]:
    values = [(as_float(item.get(value_key)), as_float(item.get("weight"), 1.0)) for item in items if as_float(item.get(value_key)) > 0]
    if not values:
        return None
    numerator = sum(value * weight for value, weight in values)
    denominator = sum(weight for _, weight in values)
    return numerator / denominator if denominator else None


def regulation_score(regulation: Optional[dict]) -> dict:
    if not regulation:
        return {
            "score": 68,
            "multiplier": 0.96,
            "risk_level": "medium",
            "findings": ["Sin normativa vinculada al caso"],
        }
    risk_flags = regulation.get("risk_flags") or []
    restricted = regulation.get("restricted_uses") or []
    missing_source = not regulation.get("source_url") or regulation.get("source_confidence") != "official"
    score = 100 - len(risk_flags) * 7 - len(restricted) * 2 - (10 if missing_source else 0)
    score = int(clamp(score, 35, 100))
    multiplier = 1 - min(0.18, len(risk_flags) * 0.025 + (0.035 if missing_source else 0))
    risk_level = "low" if score >= 82 else "medium" if score >= 62 else "high"
    findings = [*risk_flags]
    if restricted:
        findings.append(f"{len(restricted)} usos/restricciones documentadas")
    if missing_source:
        findings.append("Fuente oficial pendiente de verificar")
    return {
        "score": score,
        "multiplier": round(multiplier, 3),
        "risk_level": risk_level,
        "findings": findings or ["Normativa sin alertas registradas"],
    }


def calculate_case_projection(case: dict, comparables: list[dict], regulation: Optional[dict]) -> dict:
    subject_area = area_for(case)
    sale_comps = [
        result for result in (
            adjusted_comparable_unit(case, comp, "sale")
            for comp in comparables
            if comp.get("operation_type") in {"sale", "both"} and comp.get("property_type") == case.get("property_type")
        )
        if result
    ]
    rent_comps = [
        result for result in (
            adjusted_comparable_unit(case, comp, "rent")
            for comp in comparables
            if comp.get("operation_type") in {"rent", "both"} and comp.get("property_type") == case.get("property_type")
        )
        if result
    ]

    reg = regulation_score(regulation)
    sale_unit = weighted_average(sale_comps)
    rent_unit = weighted_average(rent_comps)
    market_value = sale_unit * subject_area if sale_unit else as_float(case.get("asking_price_mxn"))
    market_rent = rent_unit * subject_area if rent_unit else as_float(case.get("monthly_rent_mxn"))

    cap_rate = as_float(case.get("target_cap_rate"), 0.085)
    if cap_rate > 1:
        cap_rate = cap_rate / 100.0
    cap_rate = clamp(cap_rate, 0.035, 0.18)
    occupancy = clamp(as_float(case.get("occupancy_rate"), 0.82), 0.35, 1.0)
    annual_expenses = as_float(case.get("annual_expenses_mxn"))
    noi = max(0.0, market_rent * 12 * occupancy - annual_expenses)
    income_value = noi / cap_rate if noi > 0 else 0.0

    land_value_per_m2 = as_float(case.get("land_value_override_per_m2"))
    if land_value_per_m2 <= 0 and sale_unit:
        land_value_per_m2 = sale_unit if case.get("property_type") in {"land", "lot", "terreno"} else sale_unit * 0.36
    if land_value_per_m2 <= 0:
        land_value_per_m2 = 4500.0
    depreciation = clamp(as_float(case.get("age_years")) * 0.018, 0.0, 0.55)
    land_component = as_float(case.get("land_area_m2")) * land_value_per_m2
    building_component = as_float(case.get("construction_area_m2")) * as_float(case.get("replacement_cost_per_m2"), 16000.0) * (1 - depreciation)
    cost_value = land_component + building_component

    value_components = []
    if market_value > 0:
        value_components.append({"name": "mercado", "value": market_value, "weight": 0.52})
    if income_value > 0:
        value_components.append({"name": "ingresos", "value": income_value, "weight": 0.34 if case.get("operation_type") in {"rent", "both"} else 0.22})
    if cost_value > 0:
        value_components.append({"name": "costos", "value": cost_value, "weight": 0.26})
    if not value_components:
        value_components.append({"name": "base", "value": 0.0, "weight": 1.0})

    weight_sum = sum(component["weight"] for component in value_components) or 1.0
    base_value = sum(component["value"] * component["weight"] for component in value_components) / weight_sum
    base_value *= reg["multiplier"] * legal_multiplier(case.get("legal_status", "")) * liquidity_multiplier(case.get("market_liquidity", "medium"))

    avg_source_quality = 0.0
    source_items = [*sale_comps, *rent_comps]
    if source_items:
        avg_source_quality = sum(as_float(item.get("weight")) for item in source_items) / len(source_items)
    confidence = 34 + min(len(source_items) * 7, 35) + min(avg_source_quality * 18, 18) + (reg["score"] - 60) * 0.25
    if case.get("legal_status") == "clear_title":
        confidence += 4
    if case.get("market_liquidity") == "low":
        confidence -= 6
    confidence = int(clamp(confidence, 18, 96))
    spread = clamp((100 - confidence) / 100 * 0.42, 0.08, 0.35)

    return {
        "estimated_value_mxn": round(base_value, 2),
        "low_value_mxn": round(base_value * (1 - spread), 2),
        "high_value_mxn": round(base_value * (1 + spread), 2),
        "estimated_monthly_rent_mxn": round(market_rent, 2),
        "value_per_m2_mxn": round(base_value / max(subject_area, 1.0), 2),
        "rent_per_m2_mxn": round(market_rent / max(subject_area, 1.0), 2),
        "confidence_score": confidence,
        "regulatory_score": reg["score"],
        "regulatory_risk_level": reg["risk_level"],
        "regulatory_findings": reg["findings"],
        "noi_mxn": round(noi, 2),
        "cap_rate": round(cap_rate, 4),
        "gross_yield_pct": round((market_rent * 12 / base_value * 100) if base_value > 0 and market_rent > 0 else 0, 2),
        "approaches": [
            {"name": "Comparativo mercado", "value_mxn": round(market_value, 2), "weight_hint": "principal"},
            {"name": "Ingresos", "value_mxn": round(income_value, 2), "weight_hint": "renta/inversion"},
            {"name": "Costos", "value_mxn": round(cost_value, 2), "weight_hint": "soporte/reposicion"},
        ],
        "sale_comparables": sale_comps[:8],
        "rent_comparables": rent_comps[:8],
        "next_actions": [
            "Verificar fuente oficial PDU/POEL y tabla de uso de suelo.",
            "Agregar comparables cerrados si existen; separar listings de operaciones reales.",
            "Confirmar situacion legal, gravamenes, regimen condominal y permisos.",
            "Revisar supuestos con valuador certificado antes de emitir reporte formal.",
        ],
        "calculated_at": now_utc(),
    }


def parameter_catalog() -> list[dict[str, Any]]:
    return [
        {"domain": "Normativa", "metric": "COS", "description": "Coeficiente de ocupacion del suelo; afecta desplante y potencial de construccion."},
        {"domain": "Normativa", "metric": "CUS", "description": "Coeficiente de utilizacion del suelo; afecta metros vendibles/desarrollables."},
        {"domain": "Normativa", "metric": "Densidad", "description": "Viviendas o cuartos permitidos por hectarea; clave para residenciales y hospitality."},
        {"domain": "Normativa", "metric": "UGA/POEL", "description": "Unidad de gestion ambiental y politica ecologica; puede limitar usos y elevar riesgo."},
        {"domain": "Mercado", "metric": "Precio m2 ajustado", "description": "Comparable homologado por zona, area, condicion, calidad, fecha y fuente."},
        {"domain": "Renta", "metric": "NOI", "description": "Ingreso operativo neto despues de ocupacion y gastos."},
        {"domain": "Renta", "metric": "Cap rate", "description": "Tasa de capitalizacion usada para convertir NOI en valor."},
        {"domain": "Riesgo", "metric": "Confidence score", "description": "Calidad de evidencia, numero de comparables, fuente normativa y riesgo legal."},
    ]


async def case_with_calculation(db: AsyncIOMotorDatabase, tenant_id: str, case: dict) -> dict:
    regulation = None
    if case.get("regulation_id"):
        regulation = await db.valuation_regulations.find_one({"id": case["regulation_id"], "tenant_id": tenant_id}, {"_id": 0})
    comparables = await db.valuation_comparables.find({
        "tenant_id": tenant_id,
        "zone": case.get("zone"),
        "property_type": case.get("property_type"),
    }, {"_id": 0}).sort("updated_at", -1).limit(40).to_list(40)
    calculation = calculate_case_projection(case, comparables, regulation)
    return {**serialize_doc(case), "calculation": serialize_doc(calculation), "regulation": serialize_doc(regulation)}


def create_valuation_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/valuations", tags=["valuations"])

    @router.get("/parameters")
    async def get_parameters(current_user: dict = Depends(get_current_user)):
        require_valuation_access(current_user)
        return {"items": parameter_catalog()}

    @router.get("/dashboard")
    async def get_dashboard(current_user: dict = Depends(get_current_user)):
        require_valuation_access(current_user)
        tenant_id = tenant_id_for(current_user)
        cases = await db.valuation_cases.find({"tenant_id": tenant_id}, {"_id": 0}).sort("updated_at", -1).to_list(100)
        regs = await db.valuation_regulations.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(100)
        comps = await db.valuation_comparables.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(250)

        total_value = sum(as_float((case.get("last_calculation") or {}).get("estimated_value_mxn")) for case in cases)
        confidence_values = [as_float((case.get("last_calculation") or {}).get("confidence_score")) for case in cases if case.get("last_calculation")]
        avg_confidence = round(sum(confidence_values) / len(confidence_values), 1) if confidence_values else 0
        risk_count = sum(1 for reg in regs if (reg.get("risk_flags") or []))

        zones: dict[str, dict[str, Any]] = {}
        for comp in comps:
            zone = comp.get("zone") or "Sin zona"
            area = area_for({"property_type": comp.get("property_type")}, comp)
            item = zones.setdefault(zone, {"zone": zone, "sale_units": [], "rent_units": [], "comparables": 0})
            item["comparables"] += 1
            if comp.get("operation_type") == "sale" and as_float(comp.get("price_mxn")) > 0:
                item["sale_units"].append(as_float(comp.get("price_mxn")) / area)
            if comp.get("operation_type") == "rent" and as_float(comp.get("monthly_rent_mxn")) > 0:
                item["rent_units"].append(as_float(comp.get("monthly_rent_mxn")) / area)
        zone_metrics = []
        for item in zones.values():
            sale_avg = sum(item["sale_units"]) / len(item["sale_units"]) if item["sale_units"] else 0
            rent_avg = sum(item["rent_units"]) / len(item["rent_units"]) if item["rent_units"] else 0
            zone_metrics.append({
                "zone": item["zone"],
                "comparables": item["comparables"],
                "sale_price_m2_mxn": round(sale_avg, 2),
                "rent_m2_mxn": round(rent_avg, 2),
            })

        return {
            "summary": {
                "cases_total": len(cases),
                "active_cases": len([case for case in cases if case.get("status") != "archived"]),
                "comparables_total": len(comps),
                "regulations_total": len(regs),
                "normative_risk_flags": risk_count,
                "portfolio_value_mxn": round(total_value, 2),
                "avg_confidence_score": avg_confidence,
            },
            "latest_cases": serialize_docs(cases[:8]),
            "zone_metrics": sorted(zone_metrics, key=lambda item: item["comparables"], reverse=True)[:10],
            "parameters": parameter_catalog(),
        }

    @router.get("/cases")
    async def list_cases(
        status: Optional[str] = Query(None),
        current_user: dict = Depends(get_current_user),
    ):
        require_valuation_access(current_user)
        query = {"tenant_id": tenant_id_for(current_user)}
        if status:
            query["status"] = status
        docs = await db.valuation_cases.find(query, {"_id": 0}).sort("updated_at", -1).to_list(200)
        return serialize_docs(docs)

    @router.post("/cases")
    async def create_case(payload: ValuationCaseCreate, current_user: dict = Depends(get_current_user)):
        require_valuation_access(current_user)
        now = now_utc()
        doc = {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id_for(current_user),
            "created_by": current_user["user_id"],
            **payload.model_dump(),
            "last_calculation": None,
            "created_at": now,
            "updated_at": now,
        }
        await db.valuation_cases.insert_one(doc)
        return await case_with_calculation(db, doc["tenant_id"], doc)

    @router.get("/cases/{case_id}")
    async def get_case(case_id: str, current_user: dict = Depends(get_current_user)):
        require_valuation_access(current_user)
        tenant_id = tenant_id_for(current_user)
        doc = await db.valuation_cases.find_one({"id": case_id, "tenant_id": tenant_id}, {"_id": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="Caso de valuacion no encontrado")
        return await case_with_calculation(db, tenant_id, doc)

    @router.put("/cases/{case_id}")
    async def update_case(case_id: str, payload: ValuationCaseUpdate, current_user: dict = Depends(get_current_user)):
        require_valuation_access(current_user)
        tenant_id = tenant_id_for(current_user)
        update = clean_payload(payload.model_dump(exclude_unset=True))
        update["updated_at"] = now_utc()
        result = await db.valuation_cases.update_one({"id": case_id, "tenant_id": tenant_id}, {"$set": update})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Caso de valuacion no encontrado")
        doc = await db.valuation_cases.find_one({"id": case_id, "tenant_id": tenant_id}, {"_id": 0})
        return await case_with_calculation(db, tenant_id, doc)

    @router.delete("/cases/{case_id}")
    async def delete_case(case_id: str, current_user: dict = Depends(get_current_user)):
        require_valuation_access(current_user)
        result = await db.valuation_cases.delete_one({"id": case_id, "tenant_id": tenant_id_for(current_user)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Caso de valuacion no encontrado")
        return {"message": "Caso eliminado"}

    @router.post("/cases/{case_id}/calculate")
    async def calculate_case(case_id: str, current_user: dict = Depends(get_current_user)):
        require_valuation_access(current_user)
        tenant_id = tenant_id_for(current_user)
        doc = await db.valuation_cases.find_one({"id": case_id, "tenant_id": tenant_id}, {"_id": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="Caso de valuacion no encontrado")
        enriched = await case_with_calculation(db, tenant_id, doc)
        await db.valuation_cases.update_one(
            {"id": case_id, "tenant_id": tenant_id},
            {"$set": {"last_calculation": enriched["calculation"], "updated_at": now_utc()}},
        )
        return enriched

    @router.get("/regulations")
    async def list_regulations(current_user: dict = Depends(get_current_user)):
        require_valuation_access(current_user)
        docs = await db.valuation_regulations.find({"tenant_id": tenant_id_for(current_user)}, {"_id": 0}).sort("updated_at", -1).to_list(200)
        return serialize_docs(docs)

    @router.post("/regulations")
    async def create_regulation(payload: ValuationRegulationCreate, current_user: dict = Depends(get_current_user)):
        require_valuation_access(current_user)
        now = now_utc()
        doc = {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id_for(current_user),
            "created_by": current_user["user_id"],
            **payload.model_dump(),
            "created_at": now,
            "updated_at": now,
        }
        await db.valuation_regulations.insert_one(doc)
        return serialize_doc(doc)

    @router.put("/regulations/{regulation_id}")
    async def update_regulation(regulation_id: str, payload: ValuationRegulationUpdate, current_user: dict = Depends(get_current_user)):
        require_valuation_access(current_user)
        tenant_id = tenant_id_for(current_user)
        update = clean_payload(payload.model_dump(exclude_unset=True))
        update["updated_at"] = now_utc()
        result = await db.valuation_regulations.update_one({"id": regulation_id, "tenant_id": tenant_id}, {"$set": update})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Normativa no encontrada")
        doc = await db.valuation_regulations.find_one({"id": regulation_id, "tenant_id": tenant_id}, {"_id": 0})
        return serialize_doc(doc)

    @router.delete("/regulations/{regulation_id}")
    async def delete_regulation(regulation_id: str, current_user: dict = Depends(get_current_user)):
        require_valuation_access(current_user)
        result = await db.valuation_regulations.delete_one({"id": regulation_id, "tenant_id": tenant_id_for(current_user)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Normativa no encontrada")
        return {"message": "Normativa eliminada"}

    @router.get("/comparables")
    async def list_comparables(current_user: dict = Depends(get_current_user)):
        require_valuation_access(current_user)
        docs = await db.valuation_comparables.find({"tenant_id": tenant_id_for(current_user)}, {"_id": 0}).sort("updated_at", -1).to_list(500)
        return serialize_docs(docs)

    @router.post("/comparables")
    async def create_comparable(payload: ValuationComparableCreate, current_user: dict = Depends(get_current_user)):
        require_valuation_access(current_user)
        now = now_utc()
        doc = {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id_for(current_user),
            "created_by": current_user["user_id"],
            **payload.model_dump(),
            "created_at": now,
            "updated_at": now,
        }
        await db.valuation_comparables.insert_one(doc)
        return serialize_doc(doc)

    @router.put("/comparables/{comparable_id}")
    async def update_comparable(comparable_id: str, payload: ValuationComparableUpdate, current_user: dict = Depends(get_current_user)):
        require_valuation_access(current_user)
        tenant_id = tenant_id_for(current_user)
        update = clean_payload(payload.model_dump(exclude_unset=True))
        update["updated_at"] = now_utc()
        result = await db.valuation_comparables.update_one({"id": comparable_id, "tenant_id": tenant_id}, {"$set": update})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Comparable no encontrado")
        doc = await db.valuation_comparables.find_one({"id": comparable_id, "tenant_id": tenant_id}, {"_id": 0})
        return serialize_doc(doc)

    @router.delete("/comparables/{comparable_id}")
    async def delete_comparable(comparable_id: str, current_user: dict = Depends(get_current_user)):
        require_valuation_access(current_user)
        result = await db.valuation_comparables.delete_one({"id": comparable_id, "tenant_id": tenant_id_for(current_user)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Comparable no encontrado")
        return {"message": "Comparable eliminado"}

    @router.post("/seed-demo")
    async def seed_demo(current_user: dict = Depends(get_current_user)):
        require_valuation_access(current_user)
        tenant_id = tenant_id_for(current_user)
        existing = await db.valuation_cases.count_documents({"tenant_id": tenant_id})
        if existing:
            return {"message": "El workspace ya tiene casos de valuacion", "created": 0}

        now = now_utc()
        regulation_id = str(uuid.uuid4())
        regulation = {
            "id": regulation_id,
            "tenant_id": tenant_id,
            "created_by": current_user["user_id"],
            "title": "PDU/POEL Tulum Centro - captura inicial",
            "municipality": "Tulum",
            "zone": "Tulum Centro",
            "program_type": "PDU + POEL",
            "program_name": "Instrumentos vigentes/verificacion municipal pendiente",
            "publication_date": "2025-01-01",
            "source_url": "https://tulum.gob.mx/bitacora-ambiental/",
            "source_confidence": "official",
            "zoning_key": "H-MIX",
            "land_use": "Habitacional mixto",
            "cos": 0.55,
            "cus": 1.8,
            "density_units_per_ha": 80,
            "max_height_m": 12,
            "max_levels": 3,
            "uga": "UGA por verificar",
            "ecological_policy": "Aprovechamiento sustentable",
            "compatible_uses": ["habitacional", "comercial bajo impacto", "renta vacacional"],
            "restricted_uses": ["industria pesada"],
            "risk_flags": ["Verificar congruencia exacta PDU/POEL por predio"],
            "notes": "Seed operativo: sustituir por ficha oficial del predio.",
            "status": "active",
            "created_at": now,
            "updated_at": now,
        }
        await db.valuation_regulations.insert_one(regulation)

        comparable_docs = [
            {
                "id": str(uuid.uuid4()),
                "tenant_id": tenant_id,
                "created_by": current_user["user_id"],
                "title": "Depto comparable La Veleta",
                "operation_type": "sale",
                "property_type": "apartment",
                "zone": "La Veleta",
                "address": "La Veleta",
                "source_type": "listing",
                "source_url": None,
                "transaction_date": "2026-04-01",
                "price_mxn": 3850000,
                "monthly_rent_mxn": 0,
                "land_area_m2": 0,
                "construction_area_m2": 86,
                "bedrooms": 2,
                "bathrooms": 2,
                "age_years": 2,
                "condition_score": 8,
                "quality_score": 8,
                "amenities": ["alberca", "seguridad", "terraza"],
                "market_trend_monthly_pct": 0.4,
                "notes": "Comparable demo tipo listing.",
                "created_at": now,
                "updated_at": now,
            },
            {
                "id": str(uuid.uuid4()),
                "tenant_id": tenant_id,
                "created_by": current_user["user_id"],
                "title": "Renta comparable Aldea Zama",
                "operation_type": "rent",
                "property_type": "apartment",
                "zone": "Aldea Zama",
                "address": "Aldea Zama",
                "source_type": "broker_input",
                "source_url": None,
                "transaction_date": "2026-04-15",
                "price_mxn": 0,
                "monthly_rent_mxn": 36500,
                "land_area_m2": 0,
                "construction_area_m2": 92,
                "bedrooms": 2,
                "bathrooms": 2,
                "age_years": 3,
                "condition_score": 8,
                "quality_score": 8,
                "amenities": ["alberca", "gym", "seguridad"],
                "market_trend_monthly_pct": 0.2,
                "notes": "Renta estabilizada demo.",
                "created_at": now,
                "updated_at": now,
            },
            {
                "id": str(uuid.uuid4()),
                "tenant_id": tenant_id,
                "created_by": current_user["user_id"],
                "title": "Terreno Holistika",
                "operation_type": "sale",
                "property_type": "land",
                "zone": "Holistika",
                "address": "Holistika",
                "source_type": "listing",
                "source_url": None,
                "transaction_date": "2026-03-20",
                "price_mxn": 2550000,
                "monthly_rent_mxn": 0,
                "land_area_m2": 300,
                "construction_area_m2": 0,
                "bedrooms": 0,
                "bathrooms": 0,
                "age_years": 0,
                "condition_score": 7,
                "quality_score": 7,
                "amenities": ["selva", "acceso"],
                "market_trend_monthly_pct": 0.35,
                "notes": "Terreno demo.",
                "created_at": now,
                "updated_at": now,
            },
        ]
        await db.valuation_comparables.insert_many(comparable_docs)

        case = {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "created_by": current_user["user_id"],
            "title": "Avaluo comercial preliminar - Depto Aldea Zama",
            "client_name": "Cliente demo",
            "operation_type": "both",
            "property_type": "apartment",
            "zone": "Aldea Zama",
            "address": "Aldea Zama, Tulum",
            "latitude": None,
            "longitude": None,
            "land_area_m2": 0,
            "construction_area_m2": 90,
            "bedrooms": 2,
            "bathrooms": 2,
            "parking_spaces": 1,
            "age_years": 2,
            "condition_score": 8,
            "quality_score": 8,
            "amenities": ["alberca", "seguridad", "terraza"],
            "legal_status": "clear_title",
            "market_liquidity": "medium",
            "asking_price_mxn": 3950000,
            "monthly_rent_mxn": 34000,
            "target_cap_rate": 0.085,
            "occupancy_rate": 0.82,
            "annual_expenses_mxn": 52000,
            "replacement_cost_per_m2": 18500,
            "land_value_override_per_m2": None,
            "regulation_id": regulation_id,
            "notes": "Demo para validar calculadora y ficha de valuacion.",
            "status": "draft",
            "last_calculation": None,
            "created_at": now,
            "updated_at": now,
        }
        calculation = calculate_case_projection(case, comparable_docs, regulation)
        case["last_calculation"] = calculation
        await db.valuation_cases.insert_one(case)
        return {"message": "Datos demo de valuacion creados", "created": 1}

    return router
