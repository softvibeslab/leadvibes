"""
Validation utilities for Rovi CRM
Phone validation, email uniqueness, sanitization
"""
import re
from typing import Optional, Tuple
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorClient


# Mexico phone number patterns
MEXICO_PHONE_PATTERNS = [
    r'^\+52\s?\d{3}\s?\d{3}\s?\d{4}$',  # +52 555 555 5555
    r'^\+52\s?\d{10}$',                    # +52 5555555555
    r'^\d{10}$',                            # 5555555555
    r'^\d{3}\s?\d{3}\s?\d{4}$',            # 555 555 5555
    r'^\d{3}[-\s]?\d{3}[-\s]?\d{4}$',       # 555-555-5555
]

MEXICO_PHONE_REGEX = re.compile(
    r'^(\+52\s?)?(\d{3})[-\s]?(\d{3})[-\s]?(\d{4})$'
)


def validate_and_format_phone(phone: str) -> Tuple[str, str]:
    """
    Validate and format Mexico phone number.
    Returns (formatted_phone, original_input_or_error_message)

    Formats to: +52 XXX XXX XXXX
    """
    if not phone:
        raise ValueError("El teléfono es requerido")

    # Remove all non-numeric characters except +
    cleaned = re.sub(r'[^\d+]', '', phone)

    # Validate format
    match = MEXICO_PHONE_REGEX.match(phone)
    if not match:
        # Try with cleaned version
        match = MEXICO_PHONE_REGEX.match(cleaned)

    if not match:
        raise ValueError(
            "Formato de teléfono inválido. "
            "Use: +52 555 555 5555, 555 555 5555, o 555-555-5555"
        )

    # Extract parts
    country_code = match.group(1) or '+52 '
    area_code = match.group(2)
    central = match.group(3)
    last = match.group(4)

    # Format to +52 XXX XXX XXXX
    formatted = f"+52 {area_code} {central} {last}"

    return formatted, formatted


def sanitize_input(text: Optional[str], max_length: int = 500) -> Optional[str]:
    """
    Sanitize user input to prevent XSS and other attacks.
    Removes HTML tags, excessive whitespace, limits length.
    """
    if not text:
        return None

    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)

    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)

    # Trim
    text = text.strip()

    # Limit length
    if len(text) > max_length:
        text = text[:max_length] + '...'

    return text


def validate_email(email: Optional[str]) -> Tuple[bool, Optional[str]]:
    """
    Basic email validation.
    Returns (is_valid, error_message)
    """
    if not email:
        return True, None  # Email is optional

    email_regex = re.compile(
        r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    )

    if not email_regex.match(email):
        return False, "Formato de email inválido"

    if len(email) > 255:
        return False, "Email demasiado largo (máximo 255 caracteres)"

    return True, None


def sanitize_lead_data(data: dict) -> dict:
    """
    Sanitize all lead fields before saving to database.
    """
    sanitized = {}

    # Required fields
    sanitized['name'] = sanitize_input(data.get('name', ''), 100)
    if not sanitized['name']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre es requerido"
        )

    # Phone - validate and format
    phone_raw = data.get('phone', '')
    try:
        formatted_phone, _ = validate_and_format_phone(phone_raw)
        sanitized['phone'] = formatted_phone
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # Email - validate if provided
    email = data.get('email')
    if email:
        is_valid, error_msg = validate_email(email)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
        sanitized['email'] = email.lower().strip()

    # Optional fields - sanitize
    sanitized['property_interest'] = sanitize_input(
        data.get('property_interest'), 200
    )
    sanitized['location_preference'] = sanitize_input(
        data.get('location_preference'), 200
    )
    sanitized['notes'] = sanitize_input(
        data.get('notes'), 2000
    )
    sanitized['company'] = sanitize_input(
        data.get('company'), 100
    )
    sanitized['position'] = sanitize_input(
        data.get('position'), 100
    )

    # Enum fields - validate if provided
    if data.get('status'):
        from models import LeadStatus
        try:
            sanitized['status'] = LeadStatus(data['status'])
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Status inválido. Debe ser uno de: {[s.value for s in LeadStatus]}"
            )

    if data.get('priority'):
        from models import LeadPriority
        try:
            sanitized['priority'] = LeadPriority(data['priority'])
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Priority inválido. Debe ser uno de: {[p.value for p in LeadPriority]}"
            )

    # Numeric fields
    try:
        sanitized['budget_mxn'] = float(data.get('budget_mxn', 0))
        if sanitized['budget_mxn'] < 0:
            raise ValueError()
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El presupuesto debe ser un número positivo"
        )

    # Copy other safe fields
    safe_fields = [
        'source', 'assigned_broker_id', 'created_by', 'tenant_id',
        'operation_type', 'pipeline_type', 'rental_intent',
        'monthly_budget_mxn', 'nightly_budget_mxn', 'desired_check_in',
        'desired_check_out', 'guests_count', 'preferred_zone',
    ]
    for field in safe_fields:
        if field in data and data[field]:
            sanitized[field] = data[field]

    return sanitized


async def check_email_phone_uniqueness(
    db: AsyncIOMotorClient,
    email: Optional[str],
    phone: str,
    tenant_id: str,
    exclude_lead_id: Optional[str] = None
) -> None:
    """
    Check if email or phone already exists in tenant.
    Raises HTTPException if duplicate found.
    """
    # Build query
    or_conditions = []

    # Phone must be unique within tenant
    phone_condition = {"phone": phone, "tenant_id": tenant_id}
    if exclude_lead_id:
        phone_condition["id"] = {"$ne": exclude_lead_id}
    or_conditions.append(phone_condition)

    # Email must be unique within tenant (if provided)
    if email:
        email_condition = {"email": email.lower(), "tenant_id": tenant_id}
        if exclude_lead_id:
            email_condition["id"] = {"$ne": exclude_lead_id}
        or_conditions.append(email_condition)

    # Check for duplicates
    if or_conditions:
        duplicate = await db.leads.find_one({
            "$or": or_conditions
        })

        if duplicate:
            # Determine which field caused the duplicate
            if duplicate.get('phone') == phone:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Ya existe un lead con este teléfono en tu cuenta"
                )
            elif duplicate.get('email') and duplicate.get('email').lower() == email.lower():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Ya existe un lead con este email en tu cuenta"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Ya existe un lead con estos datos de contacto"
                )


def format_validation_errors(errors: list) -> dict:
    """
    Format validation errors into a user-friendly response.
    """
    return {
        "detail": "Errores de validación",
        "errors": errors
    }


# Example usage in endpoints:
"""
# Create lead
try:
    sanitized_data = sanitize_lead_data(lead_data.dict())
    await check_email_phone_uniqueness(
        db,
        sanitized_data.get('email'),
        sanitized_data['phone'],
        tenant_id
    )
    # ... save to database
except HTTPException:
    raise
except Exception as e:
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Error al crear lead: {str(e)}"
    )
"""
