"""Tests unitarios de auth (hash JWT) sin base de datos."""

from auth import (
    create_access_token,
    decode_token,
    get_password_hash,
    verify_password,
)


def test_password_hash_roundtrip():
    raw = "demo_Segura_123"
    hashed = get_password_hash(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("otra", hashed) is False


def test_jwt_create_and_decode():
    token = create_access_token(
        {"sub": "user-test-id", "email": "a@b.com", "tenant_id": "tenant-abc", "role": "broker"}
    )
    assert isinstance(token, str) and len(token) > 20
    payload = decode_token(token)
    assert payload["sub"] == "user-test-id"
    assert payload["email"] == "a@b.com"
