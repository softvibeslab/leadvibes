from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any

import httpx


ROVI_INTERNAL_ROLES = {"rovi_admin", "rovi_sales", "rovi_marketing", "rovi_customer_success", "rovi_ops"}


def normalize_phone_for_match(value: str | None) -> str:
    """Normalize phone numbers enough for CRM/Telegram comparisons without guessing too much."""
    if not value:
        return ""
    digits = re.sub(r"\D+", "", str(value))
    if digits.startswith("00"):
        digits = digits[2:]
    if len(digits) == 10:
        return f"52{digits}"
    if digits.startswith("521") and len(digits) == 13:
        return f"52{digits[3:]}"
    return digits


def phones_match(left: str | None, right: str | None) -> bool:
    left_normalized = normalize_phone_for_match(left)
    right_normalized = normalize_phone_for_match(right)
    if not left_normalized or not right_normalized:
        return False
    if left_normalized == right_normalized:
        return True
    return len(left_normalized) >= 10 and len(right_normalized) >= 10 and left_normalized[-10:] == right_normalized[-10:]


def mask_phone(value: str | None) -> str:
    normalized = normalize_phone_for_match(value)
    if not normalized:
        return ""
    return f"{'*' * max(0, len(normalized) - 4)}{normalized[-4:]}"


def mask_email(value: str | None) -> str:
    if not value or "@" not in value:
        return value or ""
    local, domain = value.split("@", 1)
    safe_local = local[:2] + "***" if len(local) > 2 else "***"
    return f"{safe_local}@{domain}"


def resolve_role_scope_for_hermes(user: dict[str, Any], active_workspace: dict[str, Any] | None = None) -> str:
    role = user.get("role") or active_workspace.get("role") if active_workspace else user.get("role")
    role = role or "broker"
    account_type = user.get("account_type") or "individual"
    tenant_type = (active_workspace or {}).get("tenant_type")

    if role in ROVI_INTERNAL_ROLES:
        return role
    if account_type == "rovi_internal" or tenant_type == "rovi_internal":
        return "rovi_admin"
    if role == "copim_member" or account_type == "copim_member":
        return "copim_member"
    if role == "copim_operator" or tenant_type == "association":
        return "copim_association"
    if role == "copim_admin" or account_type == "copim" or tenant_type == "copim":
        return "copim_council"
    if account_type == "valuation" or role == "certified_valuator":
        return "certified_valuator"
    if account_type == "agency" or role in {"admin", "manager", "owner"}:
        return "agency_admin"
    return "broker"


def safe_profile_slug(user: dict[str, Any], role_scope: str) -> str:
    base = user.get("email") or user.get("phone") or user.get("name") or user.get("id") or "user"
    slug = re.sub(r"[^a-z0-9]+", "-", str(base).lower()).strip("-")[:48] or "user"
    return f"rovi-{role_scope}-{slug}"


def build_telegram_deep_link(code: str) -> str:
    bot_username = (
        os.environ.get("ROVI_TELEGRAM_BOT_USERNAME")
        or os.environ.get("HERMES_TELEGRAM_BOT_USERNAME")
        or os.environ.get("TELEGRAM_BOT_USERNAME")
        or "RoviHermesBot"
    ).strip().lstrip("@")
    start_payload = f"rovi_{code}"
    return f"https://t.me/{bot_username}?start={start_payload}"


def build_qr_url(payload: str, size: int = 260) -> str:
    from urllib.parse import quote

    return f"https://api.qrserver.com/v1/create-qr-code/?size={size}x{size}&data={quote(payload)}"


def build_hermes_profile_spec(
    *,
    user: dict[str, Any],
    link: dict[str, Any],
    active_workspace: dict[str, Any] | None,
) -> dict[str, Any]:
    role_scope = link.get("role_scope") or resolve_role_scope_for_hermes(user, active_workspace)
    profile_name = link.get("hermes_profile_name") or safe_profile_slug(user, role_scope)
    telegram = link.get("telegram") or {}
    return {
        "profile_name": profile_name,
        "provider": "rovi_crm",
        "user_id": user.get("id"),
        "tenant_id": link.get("tenant_id") or (active_workspace or {}).get("tenant_id") or user.get("tenant_id"),
        "membership_id": (active_workspace or {}).get("membership_id"),
        "role": link.get("role") or (active_workspace or {}).get("role") or user.get("role"),
        "role_scope": role_scope,
        "account_type": user.get("account_type"),
        "email": user.get("email"),
        "phone": user.get("phone"),
        "telegram": {
            "user_id": telegram.get("user_id"),
            "chat_id": telegram.get("chat_id"),
            "username": telegram.get("username"),
            "first_name": telegram.get("first_name"),
            "last_name": telegram.get("last_name"),
        },
        "crm_api_base_url": os.environ.get("ROVI_PUBLIC_API_BASE_URL") or os.environ.get("REACT_APP_BACKEND_URL") or "",
        "link_id": link.get("id"),
        "link_code": link.get("code"),
    }


def write_hermes_profile_files(profile_spec: dict[str, Any]) -> dict[str, Any]:
    profile_name = profile_spec["profile_name"]
    profiles_root = Path(
        os.environ.get("ROVI_HERMES_PROFILES_ROOT")
        or os.environ.get("HERMES_PROFILES_ROOT")
        or "/tmp/rovi-hermes-profiles"
    ).expanduser()
    profile_dir = profiles_root / profile_name
    profile_dir.mkdir(parents=True, exist_ok=True)

    (profile_dir / "rovi_user_profile.json").write_text(
        json.dumps(profile_spec, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    env_lines = [
        f"ROVI_USER_ID={profile_spec.get('user_id') or ''}",
        f"ROVI_TENANT_ID={profile_spec.get('tenant_id') or ''}",
        f"ROVI_ROLE_SCOPE={profile_spec.get('role_scope') or ''}",
        f"ROVI_LINK_CODE={profile_spec.get('link_code') or ''}",
        f"ROVI_CRM_API_BASE_URL={profile_spec.get('crm_api_base_url') or ''}",
        f"TELEGRAM_ALLOWED_USERS={profile_spec.get('telegram', {}).get('user_id') or ''}",
        f"TELEGRAM_HOME_CHANNEL={profile_spec.get('telegram', {}).get('chat_id') or ''}",
        f"TELEGRAM_HOME_CHANNEL_NAME={profile_spec.get('email') or profile_name}",
    ]
    (profile_dir / ".env.rovi").write_text("\n".join(env_lines) + "\n", encoding="utf-8")
    (profile_dir / "SETUP_ROVI.md").write_text(
        "\n".join(
            [
                "# Vinculacion ROVI CRM",
                "",
                "Archivos generados por ROVI para enlazar este profile con el CRM.",
                "",
                f"- Profile: `{profile_name}`",
                f"- Rol IA: `{profile_spec.get('role_scope')}`",
                f"- Usuario ROVI: `{profile_spec.get('email')}`",
                "",
                "Si tu gateway Hermes requiere variables en `.env`, fusiona `.env.rovi` con el `.env` del profile y reinicia el gateway.",
            ]
        )
        + "\n",
        encoding="utf-8",
    )

    return {
        "profile_name": profile_name,
        "profile_dir": str(profile_dir),
        "status": "profile_written",
        "env_file": str(profile_dir / ".env.rovi"),
        "spec_file": str(profile_dir / "rovi_user_profile.json"),
    }


async def send_telegram_confirmation(chat_id: str | int | None, text: str) -> dict[str, Any]:
    token = (
        os.environ.get("ROVI_TELEGRAM_BOT_TOKEN")
        or os.environ.get("HERMES_TELEGRAM_BOT_TOKEN")
        or os.environ.get("TELEGRAM_BOT_TOKEN")
    )
    if not token or not chat_id:
        return {"sent": False, "reason": "telegram_token_or_chat_missing"}

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    async with httpx.AsyncClient(timeout=8) as client:
        response = await client.post(url, json={"chat_id": chat_id, "text": text})
        if response.status_code >= 400:
            return {"sent": False, "status_code": response.status_code, "body": response.text[:400]}
        return {"sent": True, "status_code": response.status_code}
