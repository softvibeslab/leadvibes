# @CODE:TEST-001:FIXTURES | SPEC: SPEC-TEST-001 | TEST: All test files
"""
Pytest configuration and shared fixtures for SPEC-TEST-001
Test Suite Core - Cobertura 85%
"""

import pytest
import asyncio
import sys
import os
from pathlib import Path
from typing import AsyncGenerator, Generator
from fastapi.testclient import TestClient
from mongomock import MongoClient
from unittest.mock import AsyncMock, MagicMock, patch

# Set test environment variables BEFORE importing server
os.environ.setdefault('MONGO_URL', 'mongodb://localhost:27017')
os.environ.setdefault('DB_NAME', 'test_leadvibes')
os.environ.setdefault('JWT_SECRET', 'test_secret_key_for_testing_only')
os.environ.setdefault('JWT_ALGORITHM', 'HS256')
os.environ.setdefault('JWT_EXPIRATION_HOURS', '24')

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from server import app
from auth import create_access_token


# @TEST:TEST-001:FIXTURE-001 - MongoDB Mock Database
@pytest.fixture
def mock_db():
    """
    GIVEN: Test suite requires isolated MongoDB instance
    WHEN: Fixture is called
    THEN: Returns mock database with async methods
    """
    # Create mongomock client
    mongo_client = MongoClient()
    db = mongo_client["test_leadvibes"]

    # Create mock cursor class for find().sort().to_list() pattern
    class MockCursor:
        """Mock Motor cursor with sort(), limit(), and to_list() methods"""
        def __init__(self, data):
            self.data = data
            self._limit_val = None

        def sort(self, field, direction=1):
            """Sort data by field"""
            reverse = direction == -1
            self.data.sort(key=lambda x: x.get(field, ''), reverse=reverse)
            return self

        def limit(self, limit_val):
            """Limit results"""
            self._limit_val = limit_val
            return self

        async def to_list(self, length=None):
            """Convert to list (async)"""
            if length is None:
                length = self._limit_val or len(self.data)
            return self.data[:length]

    def create_mock_find(collection_name):
        """Create a mock find function that returns a MockCursor"""
        def mock_find(query=None, projection=None):
            results = list(db[collection_name].find(query or {}, projection or {}))
            return MockCursor(results)
        return mock_find

    # Create mock db with async methods
    mock_database = MagicMock()
    mock_database._sync_db = db
    mock_database._mongo_client = mongo_client

    # Users collection
    mock_database.users = MagicMock()
    mock_database.users.find_one = AsyncMock(side_effect=lambda q, p=None: db.users.find_one(q, p))
    mock_database.users.insert_one = AsyncMock(side_effect=lambda d: db.users.insert_one(d))
    mock_database.users.update_one = AsyncMock(side_effect=lambda q, u, upsert=False: db.users.update_one(q, u, upsert=upsert))
    mock_database.users.delete_one = AsyncMock(side_effect=lambda q: db.users.delete_one(q))
    mock_database.users.count_documents = AsyncMock(side_effect=lambda q: db.users.count_documents(q))

    # Leads collection
    mock_database.leads = MagicMock()
    mock_database.leads.find_one = AsyncMock(side_effect=lambda q, p=None: db.leads.find_one(q, p))
    mock_database.leads.find = create_mock_find('leads')
    mock_database.leads.insert_one = AsyncMock(side_effect=lambda d: db.leads.insert_one(d))
    mock_database.leads.update_one = AsyncMock(side_effect=lambda q, u, upsert=False: db.leads.update_one(q, u, upsert=upsert))
    mock_database.leads.delete_one = AsyncMock(side_effect=lambda q: db.leads.delete_one(q))
    mock_database.leads.count_documents = AsyncMock(side_effect=lambda q: db.leads.count_documents(q))

    # Campaigns collection
    mock_database.campaigns = MagicMock()

    class DeleteResult:
        def __init__(self, deleted_count):
            self.deleted_count = deleted_count

    async def mock_campaigns_delete_one(query):
        result = db.campaigns.delete_one(query)
        return DeleteResult(result.deleted_count)

    mock_database.campaigns.find_one = AsyncMock(side_effect=lambda q, p=None: db.campaigns.find_one(q, p))
    mock_database.campaigns.find = create_mock_find('campaigns')
    mock_database.campaigns.insert_one = AsyncMock(side_effect=lambda d: db.campaigns.insert_one(d))
    mock_database.campaigns.update_one = AsyncMock(side_effect=lambda q, u, upsert=False: db.campaigns.update_one(q, u, upsert=upsert))
    mock_database.campaigns.delete_one = mock_campaigns_delete_one

    # Activities collection
    mock_database.activities = MagicMock()
    mock_database.activities.find_one = AsyncMock(side_effect=lambda q, p=None: db.activities.find_one(q, p))
    mock_database.activities.find = create_mock_find('activities')
    mock_database.activities.insert_one = AsyncMock(side_effect=lambda d: db.activities.insert_one(d))

    # Gamification rules collection
    mock_database.gamification_rules = MagicMock()
    mock_database.gamification_rules.find_one = AsyncMock(side_effect=lambda q, p=None: db.gamification_rules.find_one(q, p))
    mock_database.gamification_rules.find = create_mock_find('gamification_rules')
    mock_database.gamification_rules.update_one = AsyncMock(side_effect=lambda q, u, upsert=False: db.gamification_rules.update_one(q, u, upsert=upsert))

    # Points ledger collection
    mock_database.points_ledger = MagicMock()

    class MockAggregateCursor:
        """Mock aggregate cursor"""
        def __init__(self, data):
            self.data = data

        async def to_list(self, length=None):
            return self.data

    def mock_aggregate(pipeline):
        """Simple mock aggregation - returns empty list for now"""
        return MockAggregateCursor([])

    mock_database.points_ledger.find = create_mock_find('points_ledger')
    mock_database.points_ledger.insert_one = AsyncMock(side_effect=lambda d: db.points_ledger.insert_one(d))
    mock_database.points_ledger.aggregate = mock_aggregate

    # Scripts collection
    mock_database.scripts = MagicMock()
    mock_database.scripts.update_one = AsyncMock(side_effect=lambda q, u, upsert=False: db.scripts.update_one(q, u, upsert=upsert))
    mock_database.scripts.find = create_mock_find('scripts')

    # AI profiles collection
    mock_database.ai_profiles = MagicMock()
    mock_database.ai_profiles.find_one = AsyncMock(side_effect=lambda q, p=None: db.ai_profiles.find_one(q, p))

    # Calendar events collection
    mock_database.calendar_events = MagicMock()
    mock_database.calendar_events.find_one = AsyncMock(side_effect=lambda q, p=None: db.calendar_events.find_one(q, p))
    mock_database.calendar_events.find = create_mock_find('calendar_events')
    mock_database.calendar_events.insert_one = AsyncMock(side_effect=lambda d: db.calendar_events.insert_one(d))
    mock_database.calendar_events.update_one = AsyncMock(side_effect=lambda q, u, upsert=False: db.calendar_events.update_one(q, u, upsert=upsert))
    mock_database.calendar_events.delete_one = AsyncMock(side_effect=lambda q: db.calendar_events.delete_one(q))

    # Landing leads collection
    mock_database.landing_leads = MagicMock()
    mock_database.landing_leads.find = create_mock_find('landing_leads')

    # Campaign metrics collection
    mock_database.campaign_metrics = MagicMock()
    mock_database.campaign_metrics.find = create_mock_find('campaign_metrics')

    # Integration settings collection
    mock_database.integration_settings = MagicMock()
    mock_database.integration_settings.find_one = AsyncMock(side_effect=lambda q, p=None: db.integration_settings.find_one(q, p))

    # Email templates collection
    mock_database.email_templates = MagicMock()
    mock_database.email_templates.find_one = AsyncMock(side_effect=lambda q, p=None: db.email_templates.find_one(q, p))
    mock_database.email_templates.find = create_mock_find('email_templates')
    mock_database.email_templates.insert_one = AsyncMock(side_effect=lambda d: db.email_templates.insert_one(d))
    mock_database.email_templates.update_one = AsyncMock(side_effect=lambda q, u, upsert=False: db.email_templates.update_one(q, u, upsert=upsert))
    mock_database.email_templates.delete_one = AsyncMock(side_effect=lambda q: db.email_templates.delete_one(q))
    mock_database.email_templates.count_documents = AsyncMock(side_effect=lambda q: db.email_templates.count_documents(q))

    yield mock_database

    # Cleanup
    mongo_client.drop_database("test_leadvibes")
    mongo_client.close()


# @TEST:TEST-001:FIXTURE-002 - Test Client Fixture
@pytest.fixture
def client(mock_db):
    """
    GIVEN: FastAPI application with mocked database and Google Calendar sync
    WHEN: Fixture is called
    THEN: Returns TestClient for API testing
    """
    from unittest.mock import patch, AsyncMock
    import server

    # Mock Google Calendar sync function
    async def mock_sync_event_to_google(user_id: str, event_doc: dict) -> str | None:
        """Mock Google Calendar sync - returns None (sync disabled)"""
        return None

    # Mock Google Calendar check
    async def mock_is_google_calendar_enabled(user_id: str) -> bool:
        """Mock Google Calendar enabled check - returns False"""
        return False

    # Patch server.db and Google Calendar functions
    with patch.object(server, 'db', mock_db), \
         patch.object(server, 'sync_event_to_google', side_effect=mock_sync_event_to_google), \
         patch.object(server, 'is_google_calendar_enabled', side_effect=mock_is_google_calendar_enabled):
        test_client = TestClient(app)
        yield test_client


# @TEST:TEST-001:FIXTURE-003 - Valid JWT Token Fixture
@pytest.fixture
def test_token() -> str:
    """
    GIVEN: Valid user credentials
    WHEN: Fixture is called
    THEN: Returns valid JWT token for testing
    """
    token_data = {
        "sub": "test-user-123",  # Standard JWT claim: subject (user ID)
        "user_id": "test-user-123",  # Additional field for compatibility
        "email": "test@example.com",
        "role": "broker",
        "name": "Test Broker",
        "tenant_id": "tenant-test-123"
    }
    return create_access_token(token_data)


# @TEST:TEST-001:FIXTURE-004 - Test User Fixture
@pytest.fixture
def test_user(mock_db) -> dict:
    """
    GIVEN: Test user data
    WHEN: Fixture is called
    THEN: Creates user in database and returns user dictionary
    """
    from auth import get_password_hash

    user_data = {
        "id": "test-user-123",
        "email": "test@example.com",
        "password_hash": get_password_hash("password123"),
        "role": "broker",
        "name": "Test Broker",
        "tenant_id": "tenant-test-123",
        "is_active": True,
        "created_at": "2026-03-20T00:00:00Z"
    }

    # Insert into mocked database (sync)
    mock_db._sync_db.users.insert_one(user_data)

    return user_data


# @TEST:TEST-001:FIXTURE-005 - Admin User Fixture
@pytest.fixture
def admin_token() -> str:
    """
    GIVEN: Valid admin credentials
    WHEN: Fixture is called
    THEN: Returns valid JWT token with admin role
    """
    token_data = {
        "sub": "admin-user-123",
        "email": "admin@example.com",
        "role": "admin",
        "name": "Admin User",
        "tenant_id": "tenant-admin-123"
    }
    return create_access_token(token_data)


# @TEST:TEST-001:FIXTURE-006 - Sample Lead Data Fixture
@pytest.fixture
def sample_lead() -> dict:
    """
    GIVEN: Lead data structure
    WHEN: Fixture is called
    THEN: Returns sample lead dictionary
    """
    return {
        "name": "Juan Pérez",
        "email": "juan@example.com",
        "phone": "+52 987 654 3210",
        "status": "nuevo",
        "priority": "media",
        "source": "web",
        "broker_id": "test-broker-123",
        "property_interest": "Lote en Tulum",
        "budget": "100000-200000",
        "notes": "Interesado en lotes cerca de la playa"
    }


# @TEST:TEST-001:FIXTURE-007 - Authenticated Client Headers
@pytest.fixture
def auth_headers(test_token: str) -> dict:
    """
    GIVEN: Valid JWT token
    WHEN: Fixture is called
    THEN: Returns dict with Authorization header
    """
    return {"Authorization": f"Bearer {test_token}"}


# @TEST:TEST-001:FIXTURE-008 - Sample Campaign Data
@pytest.fixture
def sample_campaign() -> dict:
    """
    GIVEN: Campaign data structure matching CampaignCreate model
    WHEN: Fixture is called
    THEN: Returns sample campaign dictionary with correct field names
    """
    from datetime import datetime, timezone

    return {
        "name": "Campaña Marzo 2026",
        "campaign_type": "email",
        "message_template": "Hola {name}, tenemos propiedades interesantes para ti",
        "lead_ids": ["lead-1", "lead-2", "lead-3"],
        "lead_filter": {"status": "nuevo"},
        "scheduled_at": (datetime(2026, 3, 25, 10, 0, 0, tzinfo=timezone.utc)).isoformat()
    }


# @TEST:TEST-001:FIXTURE-009 - Sample Event Data
@pytest.fixture
def sample_event() -> dict:
    """
    GIVEN: Calendar event data structure matching CalendarEventCreate model
    WHEN: Fixture is called
    THEN: Returns sample event dictionary with correct field names
    """
    from datetime import datetime, timezone

    return {
        "title": "Llamada con Juan Pérez",
        "description": "Seguimiento inicial",
        "event_type": "llamada",
        "start_time": (datetime(2026, 3, 25, 10, 0, 0, tzinfo=timezone.utc)).isoformat(),
        "end_time": (datetime(2026, 3, 25, 10, 30, 0, tzinfo=timezone.utc)).isoformat(),
        "lead_id": "lead-123",
        "reminder_minutes": 30,
        "color": "#3B82F6"
    }


# @TEST:TEST-001:FIXTURE-010 - Sample Activity Data
@pytest.fixture
def sample_activity() -> dict:
    """
    GIVEN: Activity data structure matching ActivityCreate model
    WHEN: Fixture is called
    THEN: Returns sample activity dictionary with correct field names
    """
    return {
        "lead_id": "lead-123",
        "activity_type": "llamada",
        "description": "Llamada de seguimiento",
        "outcome": "interesado"
    }
