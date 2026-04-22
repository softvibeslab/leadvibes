"""Smoke tests locales: sin API remota ni Mongo obligatorio para /api/health."""

import pytest


def test_health_returns_healthy(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "healthy"
    assert "timestamp" in data


def test_api_root_message(client):
    response = client.get("/api/")
    assert response.status_code == 200
    body = response.json()
    assert body.get("status") == "running"
    assert "Rovi" in body.get("message", "")
