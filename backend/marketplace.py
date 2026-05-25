from datetime import datetime, timezone, timedelta
from typing import Any, Callable, Dict, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from auth import get_current_user
from models import (
    AgentSkillInstallation,
    MarketplaceEntitlement,
    MarketplaceEntitlementStatus,
    MarketplaceEntitlementType,
    MarketplaceCommissionSplit,
    MarketplaceListingCreate,
    MarketplaceListingStatus,
    MarketplaceListingType,
    MarketplaceListingUpdate,
    MarketplacePurchaseRequest,
    MarketplaceTierCode,
    MarketplaceTierCreate,
    MarketplaceTransaction,
    MarketplaceTransactionStatus,
    MCPJsonRpcRequest,
)


SELLER_ROLES = {"admin", "manager", "copim_admin", "copim_operator", "broker"}
ADMIN_ROLES = {"admin", "manager", "copim_admin", "copim_operator"}


DEFAULT_TIER_CONFIGS = {
    MarketplaceTierCode.BASIC: {
        "name": "Basico",
        "description": "Consume productos, cursos, servicios y Agent Skills del marketplace.",
        "monthly_price_mxn": 0,
        "can_buy": True,
        "can_sell": False,
        "max_active_digital_artifacts": 0,
        "max_active_services": 0,
        "max_active_agent_skills": 0,
        "features": ["Comprar artefactos digitales", "Contratar servicios", "Instalar Skills compradas"],
    },
    MarketplaceTierCode.PRO: {
        "name": "Pro",
        "description": "Permite monetizar conocimiento y servicios dentro del ecosistema COPIM.",
        "monthly_price_mxn": 799,
        "can_buy": True,
        "can_sell": True,
        "max_active_digital_artifacts": 10,
        "max_active_services": 3,
        "max_active_agent_skills": 2,
        "inherited_tiers": [MarketplaceTierCode.BASIC],
        "features": ["Publicar productos digitales", "Vender servicios tipo Gig", "Comisiones tripartitas"],
    },
    MarketplaceTierCode.PREMIUM: {
        "name": "Premium",
        "description": "Creador avanzado para paquetes comerciales, cursos y habilidades de IA.",
        "monthly_price_mxn": 1999,
        "can_buy": True,
        "can_sell": True,
        "max_active_digital_artifacts": 50,
        "max_active_services": 15,
        "max_active_agent_skills": 10,
        "inherited_tiers": [MarketplaceTierCode.BASIC, MarketplaceTierCode.PRO],
        "platform_commission_rate": 0.12,
        "association_commission_rate": 0.10,
        "creator_commission_rate": 0.78,
        "features": ["Mayor limite de productos", "Agent Skills premium", "Menor comision de plataforma"],
    },
    MarketplaceTierCode.PARTNER: {
        "name": "Partner Certificado",
        "description": "Proveedor B2B validado para notarios, valuadores, marketing y servicios especializados.",
        "monthly_price_mxn": 4999,
        "can_buy": True,
        "can_sell": True,
        "max_active_digital_artifacts": 100,
        "max_active_services": 50,
        "max_active_agent_skills": 25,
        "inherited_tiers": [MarketplaceTierCode.BASIC, MarketplaceTierCode.PRO, MarketplaceTierCode.PREMIUM],
        "platform_commission_rate": 0.15,
        "association_commission_rate": 0.05,
        "creator_commission_rate": 0.80,
        "features": ["Directorio de partners", "Servicios certificados", "Canal B2B para asociaciones"],
    },
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def serialize_doc(doc: Optional[dict]) -> Optional[dict]:
    if doc is None:
        return None
    result = {k: v for k, v in doc.items() if k != "_id"}
    for key, value in result.items():
        if isinstance(value, datetime):
            result[key] = value.isoformat()
    return result


def money(value: float) -> float:
    return round(float(value or 0), 2)


def resolve_limit_field(listing_type: str) -> str:
    if listing_type == MarketplaceListingType.PROFESSIONAL_SERVICE.value:
        return "max_active_services"
    if listing_type == MarketplaceListingType.AGENT_SKILL.value:
        return "max_active_agent_skills"
    return "max_active_digital_artifacts"


async def get_effective_marketplace_tier(db: AsyncIOMotorDatabase, current_user: dict) -> dict:
    tenant_id = current_user["tenant_id"]
    user_id = current_user["user_id"]
    subscription = await db.marketplace_subscriptions.find_one(
        {"tenant_id": tenant_id, "user_id": user_id, "status": "active"},
        {"_id": 0},
    )
    tier_code = subscription.get("tier_code") if subscription else None

    if not tier_code:
        if current_user.get("role") in {"copim_admin", "admin"}:
            tier_code = MarketplaceTierCode.PREMIUM.value
        elif current_user.get("role") in SELLER_ROLES:
            tier_code = MarketplaceTierCode.PRO.value
        else:
            tier_code = MarketplaceTierCode.BASIC.value

    custom_tier = await db.marketplace_tiers.find_one(
        {"tenant_id": tenant_id, "code": tier_code, "is_active": True},
        {"_id": 0},
    )
    if custom_tier:
        return custom_tier

    default = DEFAULT_TIER_CONFIGS.get(MarketplaceTierCode(tier_code), DEFAULT_TIER_CONFIGS[MarketplaceTierCode.BASIC])
    return {
        "id": f"default-{tier_code}",
        "tenant_id": tenant_id,
        "code": tier_code,
        "platform_commission_rate": 0.15,
        "association_commission_rate": 0.10,
        "creator_commission_rate": 0.75,
        "is_default": True,
        **default,
    }


async def enforce_seller_limits(db: AsyncIOMotorDatabase, listing_data: MarketplaceListingCreate, current_user: dict) -> dict:
    tier = await get_effective_marketplace_tier(db, current_user)
    if not tier.get("can_sell"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu membresia actual permite comprar, pero no publicar productos en el marketplace.",
        )

    if current_user.get("role") not in SELLER_ROLES:
        raise HTTPException(status_code=403, detail="Tu rol no puede publicar en el marketplace.")

    limit_field = resolve_limit_field(listing_data.listing_type.value)
    active_count = await db.marketplace_listings.count_documents({
        "tenant_id": current_user["tenant_id"],
        "creator_user_id": current_user["user_id"],
        "listing_type": listing_data.listing_type.value,
        "status": {"$in": ["draft", "published", "paused"]},
    })
    max_allowed = int(tier.get(limit_field, 0))
    if active_count >= max_allowed:
        raise HTTPException(
            status_code=402,
            detail=f"Limite alcanzado para {listing_data.listing_type.value}. Mejora tu tier para publicar mas.",
        )
    return tier


def validate_listing_payload(listing_data: MarketplaceListingCreate) -> None:
    payload_map = {
        MarketplaceListingType.DIGITAL_ARTIFACT: listing_data.digital_artifact,
        MarketplaceListingType.PROFESSIONAL_SERVICE: listing_data.professional_service,
        MarketplaceListingType.AGENT_SKILL: listing_data.agent_skill,
    }
    expected_payload = payload_map.get(listing_data.listing_type)
    if listing_data.listing_type in payload_map and expected_payload is None:
        raise HTTPException(
            status_code=422,
            detail=f"Falta payload requerido para {listing_data.listing_type.value}.",
        )


def compute_commission_splits(listing: dict, tier: dict, gross_amount: float) -> list[MarketplaceCommissionSplit]:
    platform_rate = float(tier.get("platform_commission_rate", 0.15))
    association_rate = float(tier.get("association_commission_rate", 0.10))
    creator_rate = max(0.0, 1.0 - platform_rate - association_rate)
    association_id = listing.get("association_id")

    return [
        MarketplaceCommissionSplit(
            recipient_type="creator",
            recipient_id=listing.get("creator_user_id"),
            amount_mxn=money(gross_amount * creator_rate),
            rate=creator_rate,
        ),
        MarketplaceCommissionSplit(
            recipient_type="association",
            recipient_id=association_id,
            amount_mxn=money(gross_amount * association_rate),
            rate=association_rate,
        ),
        MarketplaceCommissionSplit(
            recipient_type="platform",
            recipient_id="rovi",
            amount_mxn=money(gross_amount * platform_rate),
            rate=platform_rate,
        ),
    ]


def resolve_purchase_amount(listing: dict, package_name: Optional[str]) -> tuple[float, Optional[int]]:
    if listing.get("listing_type") != MarketplaceListingType.PROFESSIONAL_SERVICE.value:
        return money(listing.get("price_mxn", 0)), None

    packages = (listing.get("professional_service") or {}).get("packages") or []
    if not packages:
        return money(listing.get("price_mxn", 0)), None

    selected = None
    if package_name:
        selected = next((item for item in packages if item.get("name") == package_name), None)
        if not selected:
            raise HTTPException(status_code=404, detail="Paquete de servicio no encontrado.")
    else:
        selected = packages[0]

    return money(selected.get("price_mxn", listing.get("price_mxn", 0))), int(selected.get("delivery_days", 0) or 0)


def get_file_format(url: str, listing: dict) -> str:
    metadata = listing.get("metadata") or {}
    if metadata.get("file_format"):
        return str(metadata["file_format"]).lower()
    if "." in url:
        return url.rsplit(".", 1)[-1].lower()
    return "file"


def get_download_label(file_format: str) -> str:
    if file_format == "zip":
        return "Descargar ZIP"
    if file_format == "pdf":
        return "Descargar PDF"
    return "Descargar archivo"


async def create_entitlement_for_transaction(
    db: AsyncIOMotorDatabase,
    listing: dict,
    transaction_doc: dict,
    current_user: dict,
) -> Optional[dict]:
    listing_type = listing.get("listing_type")
    entitlement_type: Optional[MarketplaceEntitlementType] = None
    download_urls: list[str] = []
    metadata: Dict[str, Any] = {}

    if listing_type == MarketplaceListingType.DIGITAL_ARTIFACT.value:
        artifact = listing.get("digital_artifact") or {}
        download_urls = artifact.get("file_urls") or []
        first_url = download_urls[0] if download_urls else ""
        file_format = get_file_format(first_url, listing) if first_url else "file"
        entitlement_type = MarketplaceEntitlementType.DOWNLOAD
        metadata = {
            "artifact_type": artifact.get("artifact_type", "template"),
            "file_format": file_format,
            "download_label": (listing.get("metadata") or {}).get("download_label") or get_download_label(file_format),
            "delivery_summary": (listing.get("metadata") or {}).get("delivery_summary"),
            "license_terms": artifact.get("license_terms", "single_tenant_use"),
            "version": artifact.get("version", "1.0.0"),
        }
    elif listing_type == MarketplaceListingType.AGENT_SKILL.value:
        skill = listing.get("agent_skill") or {}
        entitlement_type = MarketplaceEntitlementType.AGENT_SKILL
        metadata = {
            "skill_slug": skill.get("skill_slug"),
            "skill_version": skill.get("skill_version", "1.0.0"),
            "install_mode": skill.get("install_mode", "tenant_agent"),
            "compatible_agents": skill.get("compatible_agents", []),
            "required_mcp_tools": skill.get("required_mcp_tools", []),
            "agent_name": (listing.get("metadata") or {}).get("agent_name"),
            "activation_copy": (listing.get("metadata") or {}).get("activation_copy"),
        }
    elif listing_type == MarketplaceListingType.PROFESSIONAL_SERVICE.value:
        entitlement_type = MarketplaceEntitlementType.SERVICE_ORDER
        metadata = {
            "package_name": transaction_doc.get("package_name"),
            "delivery_due_at": transaction_doc.get("delivery_due_at"),
        }

    if not entitlement_type:
        return None

    entitlement = MarketplaceEntitlement(
        tenant_id=current_user["tenant_id"],
        buyer_user_id=current_user["user_id"],
        listing_id=listing["id"],
        transaction_id=transaction_doc["id"],
        entitlement_type=entitlement_type,
        download_urls=download_urls,
        metadata=metadata,
    )
    entitlement_doc = entitlement.model_dump(mode="json")
    await db.marketplace_entitlements.update_one(
        {
            "tenant_id": current_user["tenant_id"],
            "buyer_user_id": current_user["user_id"],
            "listing_id": listing["id"],
            "transaction_id": transaction_doc["id"],
        },
        {"$set": entitlement_doc},
        upsert=True,
    )
    return entitlement_doc


def create_marketplace_router(
    db: AsyncIOMotorDatabase,
    analyze_lead_fn: Optional[Callable[[dict], Any]] = None,
) -> APIRouter:
    router = APIRouter(prefix="/marketplace", tags=["marketplace"])

    @router.get("/strategy-summary")
    async def get_marketplace_strategy_summary(current_user: dict = Depends(get_current_user)):
        return {
            "positioning": "ROVI Marketplace convierte COPIM en una economia digital soberana para productos, servicios y Agent Skills.",
            "negotiation_angle": "Fital ofrece software cerrado; ROVI entrega infraestructura transaccional con propiedad de datos y comisiones para COPIM.",
            "revenue_streams": [
                "suscripciones por tiers",
                "comision tripartita por venta",
                "servicios profesionales en escrow",
                "instalacion y venta de Agent Skills",
                "integraciones/API usage premium",
            ],
            "roles": {
                "copim": ["gobernanza", "comisiones", "certificacion", "directorio de partners"],
                "association": ["curaduria local", "comision por comunidad", "servicios para miembros"],
                "broker": ["compra de plantillas", "contratacion de gigs", "skills para su agente IA"],
                "agency": ["packs comerciales", "campanas premium", "diagnostico comercial con IA"],
            },
        }

    @router.get("/tiers")
    async def list_marketplace_tiers(current_user: dict = Depends(get_current_user)):
        tenant_id = current_user["tenant_id"]
        custom_tiers = await db.marketplace_tiers.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(100)
        if custom_tiers:
            return {"tiers": [serialize_doc(item) for item in custom_tiers]}

        tiers = []
        for code, payload in DEFAULT_TIER_CONFIGS.items():
            tiers.append({"id": f"default-{code.value}", "tenant_id": tenant_id, "code": code.value, **payload})
        return {"tiers": tiers}

    @router.post("/tiers")
    async def upsert_marketplace_tier(tier_data: MarketplaceTierCreate, current_user: dict = Depends(get_current_user)):
        if current_user.get("role") not in ADMIN_ROLES:
            raise HTTPException(status_code=403, detail="Solo administradores pueden configurar tiers.")

        tier_doc = {
            "id": f"tier-{current_user['tenant_id']}-{tier_data.code.value}",
            "tenant_id": current_user["tenant_id"],
            **tier_data.model_dump(mode="json"),
            "updated_at": now_iso(),
        }
        await db.marketplace_tiers.update_one(
            {"tenant_id": current_user["tenant_id"], "code": tier_data.code.value},
            {"$set": tier_doc, "$setOnInsert": {"created_at": now_iso()}},
            upsert=True,
        )
        return {"message": "Tier configurado", "tier": tier_doc}

    @router.get("/me")
    async def get_marketplace_me(current_user: dict = Depends(get_current_user)):
        tier = await get_effective_marketplace_tier(db, current_user)
        listings_count = await db.marketplace_listings.count_documents({
            "tenant_id": current_user["tenant_id"],
            "creator_user_id": current_user["user_id"],
            "status": {"$in": ["draft", "published", "paused"]},
        })
        purchases_count = await db.marketplace_transactions.count_documents({
            "tenant_id": current_user["tenant_id"],
            "buyer_user_id": current_user["user_id"],
        })
        return {
            "tier": serialize_doc(tier),
            "seller_limits": {
                "active_listings_count": listings_count,
                "max_active_digital_artifacts": tier.get("max_active_digital_artifacts", 0),
                "max_active_services": tier.get("max_active_services", 0),
                "max_active_agent_skills": tier.get("max_active_agent_skills", 0),
            },
            "purchases_count": purchases_count,
        }

    @router.get("/listings")
    async def list_marketplace_listings(
        listing_type: Optional[MarketplaceListingType] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
        include_mine: bool = False,
        current_user: dict = Depends(get_current_user),
    ):
        query: Dict[str, Any] = {
            "tenant_id": current_user["tenant_id"],
            "status": MarketplaceListingStatus.PUBLISHED.value,
        }
        if include_mine:
            query = {
                "tenant_id": current_user["tenant_id"],
                "$or": [
                    {"status": MarketplaceListingStatus.PUBLISHED.value},
                    {"creator_user_id": current_user["user_id"]},
                ],
            }
        if listing_type:
            query["listing_type"] = listing_type.value
        if category:
            query["category"] = category
        if search:
            query["$text"] = {"$search": search}

        listings = await db.marketplace_listings.find(query, {"_id": 0}).sort("updated_at", -1).to_list(200)
        return {"listings": [serialize_doc(item) for item in listings]}

    @router.post("/listings")
    async def create_marketplace_listing(
        listing_data: MarketplaceListingCreate,
        current_user: dict = Depends(get_current_user),
    ):
        validate_listing_payload(listing_data)
        await enforce_seller_limits(db, listing_data, current_user)

        listing_id = str(uuid.uuid4())
        listing_doc = {
            "id": listing_id,
            "tenant_id": current_user["tenant_id"],
            "creator_user_id": current_user["user_id"],
            **listing_data.model_dump(mode="json"),
            "status": MarketplaceListingStatus.DRAFT.value,
            "sales_count": 0,
            "rating_average": 0,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }
        await db.marketplace_listings.insert_one(listing_doc)
        return {"message": "Listing creado", "listing": listing_doc}

    @router.put("/listings/{listing_id}")
    async def update_marketplace_listing(
        listing_id: str,
        listing_data: MarketplaceListingUpdate,
        current_user: dict = Depends(get_current_user),
    ):
        existing = await db.marketplace_listings.find_one(
            {"id": listing_id, "tenant_id": current_user["tenant_id"]},
            {"_id": 0},
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Listing no encontrado.")
        if existing.get("creator_user_id") != current_user["user_id"] and current_user.get("role") not in ADMIN_ROLES:
            raise HTTPException(status_code=403, detail="No puedes editar este listing.")

        update_doc = {k: v for k, v in listing_data.model_dump(mode="json").items() if v is not None}
        update_doc["updated_at"] = now_iso()
        await db.marketplace_listings.update_one(
            {"id": listing_id, "tenant_id": current_user["tenant_id"]},
            {"$set": update_doc},
        )
        return {"message": "Listing actualizado"}

    @router.post("/listings/{listing_id}/publish")
    async def publish_marketplace_listing(listing_id: str, current_user: dict = Depends(get_current_user)):
        listing = await db.marketplace_listings.find_one({"id": listing_id, "tenant_id": current_user["tenant_id"]}, {"_id": 0})
        if not listing:
            raise HTTPException(status_code=404, detail="Listing no encontrado.")
        if listing.get("creator_user_id") != current_user["user_id"] and current_user.get("role") not in ADMIN_ROLES:
            raise HTTPException(status_code=403, detail="No puedes publicar este listing.")

        await db.marketplace_listings.update_one(
            {"id": listing_id, "tenant_id": current_user["tenant_id"]},
            {"$set": {"status": MarketplaceListingStatus.PUBLISHED.value, "updated_at": now_iso()}},
        )
        return {"message": "Listing publicado"}

    @router.post("/purchase")
    async def purchase_marketplace_listing(
        purchase: MarketplacePurchaseRequest,
        current_user: dict = Depends(get_current_user),
    ):
        listing = await db.marketplace_listings.find_one(
            {"id": purchase.listing_id, "tenant_id": current_user["tenant_id"], "status": MarketplaceListingStatus.PUBLISHED.value},
            {"_id": 0},
        )
        if not listing:
            raise HTTPException(status_code=404, detail="Listing publicado no encontrado.")
        if listing.get("creator_user_id") == current_user["user_id"]:
            raise HTTPException(status_code=400, detail="No puedes comprar tu propio listing.")

        tier = await get_effective_marketplace_tier(db, current_user)
        gross_amount, delivery_days = resolve_purchase_amount(listing, purchase.package_name)
        creator_tier = await db.marketplace_subscriptions.find_one(
            {"tenant_id": current_user["tenant_id"], "user_id": listing["creator_user_id"], "status": "active"},
            {"_id": 0, "tier_code": 1},
        )
        if creator_tier:
            custom_tier = await db.marketplace_tiers.find_one(
                {"tenant_id": current_user["tenant_id"], "code": creator_tier.get("tier_code"), "is_active": True},
                {"_id": 0},
            )
            if custom_tier:
                tier = custom_tier

        splits = compute_commission_splits(listing, tier, gross_amount)
        transaction = MarketplaceTransaction(
            tenant_id=current_user["tenant_id"],
            listing_id=listing["id"],
            listing_type=MarketplaceListingType(listing["listing_type"]),
            buyer_user_id=current_user["user_id"],
            creator_user_id=listing["creator_user_id"],
            association_id=listing.get("association_id"),
            package_name=purchase.package_name,
            gross_amount_mxn=gross_amount,
            currency=listing.get("currency", "MXN"),
            status=(
                MarketplaceTransactionStatus.IN_ESCROW
                if listing.get("listing_type") == MarketplaceListingType.PROFESSIONAL_SERVICE.value
                else MarketplaceTransactionStatus.PAID
            ),
            payment_provider=purchase.payment_provider,
            payment_reference=purchase.payment_reference,
            commission_splits=splits,
            buyer_notes=purchase.buyer_notes,
            delivery_due_at=(datetime.now(timezone.utc) + timedelta(days=delivery_days)) if delivery_days else None,
        )
        transaction_doc = transaction.model_dump(mode="json")
        await db.marketplace_transactions.insert_one(transaction_doc)
        entitlement_doc = await create_entitlement_for_transaction(db, listing, transaction_doc, current_user)
        await db.marketplace_listings.update_one(
            {"id": listing["id"], "tenant_id": current_user["tenant_id"]},
            {"$inc": {"sales_count": 1}, "$set": {"updated_at": now_iso()}},
        )
        return {"message": "Compra registrada", "transaction": transaction_doc, "entitlement": entitlement_doc}

    @router.get("/transactions")
    async def list_marketplace_transactions(current_user: dict = Depends(get_current_user)):
        query = {"tenant_id": current_user["tenant_id"], "$or": [{"buyer_user_id": current_user["user_id"]}, {"creator_user_id": current_user["user_id"]}]}
        if current_user.get("role") in ADMIN_ROLES:
            query = {"tenant_id": current_user["tenant_id"]}
        transactions = await db.marketplace_transactions.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
        return {"transactions": [serialize_doc(item) for item in transactions]}

    @router.get("/purchases")
    async def list_marketplace_purchases(current_user: dict = Depends(get_current_user)):
        transactions = await db.marketplace_transactions.find(
            {"tenant_id": current_user["tenant_id"], "buyer_user_id": current_user["user_id"]},
            {"_id": 0},
        ).sort("created_at", -1).to_list(200)
        entitlements = await db.marketplace_entitlements.find(
            {"tenant_id": current_user["tenant_id"], "buyer_user_id": current_user["user_id"]},
            {"_id": 0},
        ).sort("created_at", -1).to_list(200)
        listing_ids = sorted({item.get("listing_id") for item in transactions + entitlements if item.get("listing_id")})
        listings = []
        if listing_ids:
            listings = await db.marketplace_listings.find(
                {"tenant_id": current_user["tenant_id"], "id": {"$in": listing_ids}},
                {"_id": 0},
            ).to_list(len(listing_ids))
        listing_map = {item["id"]: serialize_doc(item) for item in listings}

        return {
            "transactions": [serialize_doc(item) for item in transactions],
            "entitlements": [serialize_doc(item) for item in entitlements],
            "listings": listing_map,
        }

    @router.get("/entitlements/{entitlement_id}/download")
    async def resolve_marketplace_download(entitlement_id: str, file_index: int = 0, current_user: dict = Depends(get_current_user)):
        entitlement = await db.marketplace_entitlements.find_one(
            {"id": entitlement_id, "tenant_id": current_user["tenant_id"]},
            {"_id": 0},
        )
        if not entitlement:
            raise HTTPException(status_code=404, detail="Derecho de descarga no encontrado.")
        if entitlement.get("buyer_user_id") != current_user["user_id"] and current_user.get("role") not in ADMIN_ROLES:
            raise HTTPException(status_code=403, detail="No puedes descargar este producto.")
        if entitlement.get("status") != MarketplaceEntitlementStatus.ACTIVE.value:
            raise HTTPException(status_code=403, detail="Este derecho de descarga no esta activo.")
        if entitlement.get("entitlement_type") != MarketplaceEntitlementType.DOWNLOAD.value:
            raise HTTPException(status_code=400, detail="Este entitlement no contiene descargas.")
        if int(entitlement.get("download_count", 0)) >= int(entitlement.get("max_downloads", 10)):
            raise HTTPException(status_code=403, detail="Limite de descargas alcanzado.")

        download_urls = entitlement.get("download_urls") or []
        if not download_urls:
            raise HTTPException(status_code=404, detail="El producto no tiene archivos configurados.")
        if file_index < 0 or file_index >= len(download_urls):
            raise HTTPException(status_code=404, detail="Archivo no encontrado.")

        download_url = download_urls[file_index]
        metadata = entitlement.get("metadata") or {}
        await db.marketplace_entitlements.update_one(
            {"id": entitlement_id, "tenant_id": current_user["tenant_id"]},
            {"$inc": {"download_count": 1}, "$set": {"updated_at": now_iso()}},
        )
        return {
            "download_url": download_url,
            "file_format": metadata.get("file_format") or get_file_format(download_url, {"metadata": metadata}),
            "download_label": metadata.get("download_label") or get_download_label(get_file_format(download_url, {"metadata": metadata})),
            "remaining_downloads": max(0, int(entitlement.get("max_downloads", 10)) - int(entitlement.get("download_count", 0)) - 1),
        }

    @router.post("/agent-skills/{listing_id}/install")
    async def install_agent_skill(listing_id: str, current_user: dict = Depends(get_current_user)):
        listing = await db.marketplace_listings.find_one(
            {"id": listing_id, "tenant_id": current_user["tenant_id"], "listing_type": MarketplaceListingType.AGENT_SKILL.value},
            {"_id": 0},
        )
        if not listing:
            raise HTTPException(status_code=404, detail="Agent Skill no encontrada.")

        has_purchase = await db.marketplace_transactions.find_one({
            "tenant_id": current_user["tenant_id"],
            "listing_id": listing_id,
            "buyer_user_id": current_user["user_id"],
            "status": {"$in": ["paid", "completed"]},
        })
        has_entitlement = await db.marketplace_entitlements.find_one({
            "tenant_id": current_user["tenant_id"],
            "listing_id": listing_id,
            "buyer_user_id": current_user["user_id"],
            "entitlement_type": MarketplaceEntitlementType.AGENT_SKILL.value,
            "status": MarketplaceEntitlementStatus.ACTIVE.value,
        })
        if listing.get("price_mxn", 0) > 0 and not has_purchase and not has_entitlement and listing.get("creator_user_id") != current_user["user_id"]:
            raise HTTPException(status_code=402, detail="Debes comprar la Skill antes de instalarla.")

        skill_payload = listing.get("agent_skill") or {}
        installation = AgentSkillInstallation(
            tenant_id=current_user["tenant_id"],
            user_id=current_user["user_id"],
            listing_id=listing_id,
            skill_slug=skill_payload.get("skill_slug") or listing.get("title", "").lower().replace(" ", "-"),
            skill_version=skill_payload.get("skill_version", "1.0.0"),
            metadata={
                "install_mode": skill_payload.get("install_mode", "tenant_agent"),
                "required_mcp_tools": skill_payload.get("required_mcp_tools", []),
            },
        )
        install_doc = installation.model_dump(mode="json")
        await db.agent_skill_installations.update_one(
            {"tenant_id": current_user["tenant_id"], "user_id": current_user["user_id"], "listing_id": listing_id},
            {"$set": install_doc},
            upsert=True,
        )
        return {"message": "Agent Skill instalada", "installation": install_doc}

    @router.get("/agent-skills/installed")
    async def list_installed_agent_skills(current_user: dict = Depends(get_current_user)):
        installations = await db.agent_skill_installations.find(
            {"tenant_id": current_user["tenant_id"], "user_id": current_user["user_id"], "status": "active"},
            {"_id": 0},
        ).sort("installed_at", -1).to_list(100)
        listing_ids = [item.get("listing_id") for item in installations if item.get("listing_id")]
        listings = []
        if listing_ids:
            listings = await db.marketplace_listings.find(
                {"tenant_id": current_user["tenant_id"], "id": {"$in": listing_ids}},
                {"_id": 0},
            ).to_list(len(listing_ids))
        listing_map = {item["id"]: serialize_doc(item) for item in listings}
        return {
            "installations": [serialize_doc(item) for item in installations],
            "listings": listing_map,
        }

    async def mcp_list_tools() -> dict:
        return {
            "tools": [
                {
                    "name": "rovi.list_leads",
                    "description": "Lista leads del tenant activo con filtros seguros para diagnostico comercial.",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "status": {"type": "string"},
                            "limit": {"type": "integer", "minimum": 1, "maximum": 100},
                        },
                    },
                },
                {
                    "name": "rovi.retrieve_lead_summary",
                    "description": "Recupera resumen operativo de un lead, incluyendo actividades recientes.",
                    "inputSchema": {"type": "object", "properties": {"lead_id": {"type": "string"}}, "required": ["lead_id"]},
                },
                {
                    "name": "rovi.qualify_lead",
                    "description": "Califica un lead con IA y guarda intent_score, next_action y analisis.",
                    "inputSchema": {"type": "object", "properties": {"lead_id": {"type": "string"}}, "required": ["lead_id"]},
                },
            ]
        }

    async def mcp_call_tool(name: str, arguments: dict, current_user: dict) -> dict:
        tenant_id = current_user["tenant_id"]
        if name == "rovi.list_leads":
            limit = max(1, min(int(arguments.get("limit", 25)), 100))
            query: Dict[str, Any] = {"tenant_id": tenant_id, "deleted": {"$ne": True}}
            if arguments.get("status"):
                query["status"] = arguments["status"]
            leads = await db.leads.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
            return {"content": [{"type": "json", "json": {"leads": [serialize_doc(item) for item in leads]}}]}

        if name == "rovi.retrieve_lead_summary":
            lead_id = arguments.get("lead_id")
            lead = await db.leads.find_one({"id": lead_id, "tenant_id": tenant_id}, {"_id": 0})
            if not lead:
                raise HTTPException(status_code=404, detail="Lead no encontrado.")
            activities = await db.activities.find({"lead_id": lead_id, "tenant_id": tenant_id}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
            return {"content": [{"type": "json", "json": {"lead": serialize_doc(lead), "recent_activities": [serialize_doc(a) for a in activities]}}]}

        if name == "rovi.qualify_lead":
            if analyze_lead_fn is None:
                raise HTTPException(status_code=503, detail="Analizador IA no configurado.")
            lead_id = arguments.get("lead_id")
            lead = await db.leads.find_one({"id": lead_id, "tenant_id": tenant_id}, {"_id": 0})
            if not lead:
                raise HTTPException(status_code=404, detail="Lead no encontrado.")
            analysis = await analyze_lead_fn(lead)
            await db.leads.update_one(
                {"id": lead_id, "tenant_id": tenant_id},
                {"$set": {
                    "ai_analysis": analysis,
                    "intent_score": analysis.get("intent_score", 50),
                    "next_action": analysis.get("next_action"),
                    "updated_at": now_iso(),
                }},
            )
            return {"content": [{"type": "json", "json": analysis}]}

        raise HTTPException(status_code=404, detail=f"Tool MCP no registrada: {name}")

    @router.post("/mcp")
    async def marketplace_mcp_endpoint(request: MCPJsonRpcRequest, current_user: dict = Depends(get_current_user)):
        try:
            if request.method == "initialize":
                result = {
                    "protocolVersion": "2024-11-05",
                    "serverInfo": {"name": "rovi-marketplace-mcp", "version": "0.1.0"},
                    "capabilities": {"tools": {}},
                }
            elif request.method == "tools/list":
                result = await mcp_list_tools()
            elif request.method == "tools/call":
                tool_name = request.params.get("name")
                arguments = request.params.get("arguments") or {}
                result = await mcp_call_tool(tool_name, arguments, current_user)
            else:
                return {"jsonrpc": "2.0", "id": request.id, "error": {"code": -32601, "message": "Metodo no encontrado"}}
            return {"jsonrpc": "2.0", "id": request.id, "result": result}
        except HTTPException as exc:
            return {"jsonrpc": "2.0", "id": request.id, "error": {"code": exc.status_code, "message": exc.detail}}
        except Exception as exc:
            return {"jsonrpc": "2.0", "id": request.id, "error": {"code": -32000, "message": str(exc)}}

    return router
