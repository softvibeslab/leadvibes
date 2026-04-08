"""
Configuración global de pytest.

Debe ejecutarse antes de importar `server` para que existan MONGO_URL, DB_NAME y JWT_SECRET.
Los tests marcados @pytest.mark.integration usan `requests` contra una API remota (ver tests antiguos).
"""

import os

# Valores seguros solo para tests locales/CI (sin Mongo real obligatorio para smoke)
os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("DB_NAME", "rovi_test")
os.environ.setdefault("JWT_SECRET", "test_jwt_secret_key_min_32_chars_long_xx")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("JWT_EXPIRATION_HOURS", "24")
os.environ.setdefault("EMERGENT_LLM_KEY", "test-emergent-key-not-used-in-smoke")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")

import pytest


@pytest.fixture(scope="session")
def app():
    """App FastAPI (import diferido tras variables de entorno)."""
    from server import app as fastapi_app

    return fastapi_app


@pytest.fixture
def client(app):
    from starlette.testclient import TestClient

    return TestClient(app)
