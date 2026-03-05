"""
Rovi CRM API Tests
Testing features for Individual vs Agency users, Lead pipeline, Calendar
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://lead-bulk-upload.preview.emergentagent.com')

class TestAuth:
    """Authentication and user type tests"""
    
    def test_health_check(self):
        """Verify API is running"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("SUCCESS: Health check passed")

    def test_login_individual_user(self):
        """Test login with individual account type user (carlos.mendoza@leadvibes.mx)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "carlos.mendoza@leadvibes.mx",
            "password": "demo123"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify token
        assert "access_token" in data
        assert len(data["access_token"]) > 0
        
        # Verify user data
        user = data["user"]
        assert user["email"] == "carlos.mendoza@leadvibes.mx"
        assert user["name"] == "Carlos Mendoza"
        assert user["account_type"] == "individual", f"Expected account_type 'individual', got '{user.get('account_type')}'"
        print(f"SUCCESS: Individual user login - account_type={user['account_type']}")
        
        return data["access_token"]
    
    def test_register_agency_user(self):
        """Test registering a new agency type user"""
        unique_email = f"test_agency_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "name": "Test Agency Admin",
            "password": "test123",
            "role": "manager",
            "account_type": "agency"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify token
        assert "access_token" in data
        
        # Verify user data - must be agency type
        user = data["user"]
        assert user["account_type"] == "agency", f"Expected account_type 'agency', got '{user.get('account_type')}'"
        print(f"SUCCESS: Agency user registration - account_type={user['account_type']}")
        
        return data["access_token"], unique_email
    
    def test_login_invalid_credentials(self):
        """Test login with wrong credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("SUCCESS: Invalid credentials properly rejected")


class TestDashboard:
    """Dashboard stats tests for Individual vs Agency users"""
    
    @pytest.fixture
    def individual_auth_header(self):
        """Get auth header for individual user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "carlos.mendoza@leadvibes.mx",
            "password": "demo123"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def agency_auth_header(self):
        """Create and get auth header for agency user"""
        unique_email = f"test_agency_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "name": "Test Agency",
            "password": "test123",
            "role": "manager",
            "account_type": "agency"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_dashboard_stats(self, individual_auth_header):
        """Test dashboard stats endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats",
            headers=individual_auth_header
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify stat fields exist
        assert "total_points" in data
        assert "apartados" in data
        assert "ventas" in data
        assert "brokers_activos" in data
        assert "leads_nuevos" in data
        assert "conversion_rate" in data
        print(f"SUCCESS: Dashboard stats - points={data['total_points']}, ventas={data['ventas']}, brokers_activos={data['brokers_activos']}")
    
    def test_leaderboard(self, individual_auth_header):
        """Test leaderboard endpoint (used by agency accounts)"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/leaderboard",
            headers=individual_auth_header
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should return array of broker stats
        assert isinstance(data, list)
        if len(data) > 0:
            broker = data[0]
            assert "broker_id" in broker
            assert "broker_name" in broker
            assert "total_points" in broker
        print(f"SUCCESS: Leaderboard returned {len(data)} brokers")
    
    def test_recent_activity(self, individual_auth_header):
        """Test recent activity endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/recent-activity?limit=10",
            headers=individual_auth_header
        )
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"SUCCESS: Recent activity returned {len(data)} activities")


class TestLeadsPipeline:
    """Lead management and pipeline tests"""
    
    @pytest.fixture
    def auth_header(self):
        """Get auth header"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "carlos.mendoza@leadvibes.mx",
            "password": "demo123"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_leads(self, auth_header):
        """Test fetching leads list"""
        response = requests.get(
            f"{BASE_URL}/api/leads",
            headers=auth_header
        )
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"SUCCESS: Leads list returned {len(data)} leads")
    
    def test_create_lead(self, auth_header):
        """Test creating a new lead"""
        lead_data = {
            "name": f"TEST_Lead_{uuid.uuid4().hex[:6]}",
            "phone": "+52 555 123 4567",
            "email": "testlead@example.com",
            "source": "web",
            "budget_mxn": 2500000,
            "property_interest": "Lote en Aldea Zamá",
            "notes": "Test lead for pipeline testing"
        }
        response = requests.post(
            f"{BASE_URL}/api/leads",
            json=lead_data,
            headers=auth_header
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        lead_id = data["id"]
        print(f"SUCCESS: Lead created with id={lead_id}")
        
        return lead_id
    
    def test_update_lead_status(self, auth_header):
        """Test updating lead status (simulates drag-and-drop)"""
        # First create a lead
        lead_data = {
            "name": f"TEST_DragDrop_{uuid.uuid4().hex[:6]}",
            "phone": "+52 555 999 8888",
            "source": "Facebook Ads"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/leads",
            json=lead_data,
            headers=auth_header
        )
        assert create_response.status_code == 200
        lead_id = create_response.json()["id"]
        
        # Update status from 'nuevo' to 'contactado'
        update_response = requests.put(
            f"{BASE_URL}/api/leads/{lead_id}",
            json={"status": "contactado"},
            headers=auth_header
        )
        assert update_response.status_code == 200
        print(f"SUCCESS: Lead {lead_id} status updated to 'contactado'")
        
        # Update status to 'presentacion'
        update_response2 = requests.put(
            f"{BASE_URL}/api/leads/{lead_id}",
            json={"status": "presentacion"},
            headers=auth_header
        )
        assert update_response2.status_code == 200
        print(f"SUCCESS: Lead {lead_id} status updated to 'presentacion' (drag-and-drop simulation)")
        
        # Verify the update persisted
        get_response = requests.get(
            f"{BASE_URL}/api/leads/{lead_id}",
            headers=auth_header
        )
        assert get_response.status_code == 200
        assert get_response.json()["status"] == "presentacion"
        print("SUCCESS: Status change verified in GET response")
    
    def test_get_single_lead(self, auth_header):
        """Test fetching single lead details"""
        # First get list of leads
        leads_response = requests.get(
            f"{BASE_URL}/api/leads",
            headers=auth_header
        )
        leads = leads_response.json()
        
        if len(leads) > 0:
            lead_id = leads[0]["id"]
            response = requests.get(
                f"{BASE_URL}/api/leads/{lead_id}",
                headers=auth_header
            )
            assert response.status_code == 200
            data = response.json()
            
            assert "id" in data
            assert "name" in data
            assert "status" in data
            print(f"SUCCESS: Single lead fetched - {data['name']} (status: {data['status']})")


class TestCalendar:
    """Calendar event management tests"""
    
    @pytest.fixture
    def auth_header(self):
        """Get auth header"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "carlos.mendoza@leadvibes.mx",
            "password": "demo123"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_calendar_events(self, auth_header):
        """Test fetching calendar events"""
        response = requests.get(
            f"{BASE_URL}/api/calendar/events",
            headers=auth_header
        )
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"SUCCESS: Calendar events list returned {len(data)} events")
    
    def test_create_calendar_event(self, auth_header):
        """Test creating a new calendar event"""
        import datetime
        
        # Create event for tomorrow at 10am
        tomorrow = datetime.datetime.now() + datetime.timedelta(days=1)
        start_time = tomorrow.replace(hour=10, minute=0, second=0, microsecond=0)
        
        event_data = {
            "title": f"TEST_Event_{uuid.uuid4().hex[:6]}",
            "description": "Test calendar event",
            "event_type": "llamada",
            "start_time": start_time.isoformat(),
            "reminder_minutes": 30
        }
        response = requests.post(
            f"{BASE_URL}/api/calendar/events",
            json=event_data,
            headers=auth_header
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        event_id = data["id"]
        print(f"SUCCESS: Calendar event created with id={event_id}")
        
        return event_id
    
    def test_complete_calendar_event(self, auth_header):
        """Test marking event as completed"""
        import datetime
        
        # Create event first
        tomorrow = datetime.datetime.now() + datetime.timedelta(days=1)
        start_time = tomorrow.replace(hour=14, minute=0, second=0, microsecond=0)
        
        event_data = {
            "title": f"TEST_Complete_{uuid.uuid4().hex[:6]}",
            "event_type": "visita",
            "start_time": start_time.isoformat()
        }
        create_response = requests.post(
            f"{BASE_URL}/api/calendar/events",
            json=event_data,
            headers=auth_header
        )
        event_id = create_response.json()["id"]
        
        # Mark as completed
        complete_response = requests.put(
            f"{BASE_URL}/api/calendar/events/{event_id}?completed=true",
            headers=auth_header
        )
        assert complete_response.status_code == 200
        print(f"SUCCESS: Calendar event {event_id} marked as completed")
    
    def test_delete_calendar_event(self, auth_header):
        """Test deleting calendar event"""
        import datetime
        
        # Create event first
        tomorrow = datetime.datetime.now() + datetime.timedelta(days=2)
        start_time = tomorrow.replace(hour=16, minute=0, second=0, microsecond=0)
        
        event_data = {
            "title": f"TEST_Delete_{uuid.uuid4().hex[:6]}",
            "event_type": "zoom",
            "start_time": start_time.isoformat()
        }
        create_response = requests.post(
            f"{BASE_URL}/api/calendar/events",
            json=event_data,
            headers=auth_header
        )
        event_id = create_response.json()["id"]
        
        # Delete event
        delete_response = requests.delete(
            f"{BASE_URL}/api/calendar/events/{event_id}",
            headers=auth_header
        )
        assert delete_response.status_code == 200
        print(f"SUCCESS: Calendar event {event_id} deleted")
    
    def test_get_today_events(self, auth_header):
        """Test fetching today's events"""
        response = requests.get(
            f"{BASE_URL}/api/calendar/today",
            headers=auth_header
        )
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"SUCCESS: Today's events returned {len(data)} events")


class TestGamification:
    """Gamification rules tests"""
    
    @pytest.fixture
    def auth_header(self):
        """Get auth header"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "carlos.mendoza@leadvibes.mx",
            "password": "demo123"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_gamification_rules(self, auth_header):
        """Test fetching gamification rules"""
        response = requests.get(
            f"{BASE_URL}/api/gamification/rules",
            headers=auth_header
        )
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        if len(data) > 0:
            rule = data[0]
            assert "action" in rule
            assert "points" in rule
        print(f"SUCCESS: Gamification rules returned {len(data)} rules")


class TestBrokers:
    """Brokers management tests (for Agency accounts)"""
    
    @pytest.fixture
    def auth_header(self):
        """Get auth header"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "carlos.mendoza@leadvibes.mx",
            "password": "demo123"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_brokers(self, auth_header):
        """Test fetching brokers list"""
        response = requests.get(
            f"{BASE_URL}/api/brokers",
            headers=auth_header
        )
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"SUCCESS: Brokers list returned {len(data)} brokers")


class TestScripts:
    """Sales scripts tests"""
    
    @pytest.fixture
    def auth_header(self):
        """Get auth header"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "carlos.mendoza@leadvibes.mx",
            "password": "demo123"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_scripts(self, auth_header):
        """Test fetching sales scripts"""
        response = requests.get(
            f"{BASE_URL}/api/scripts",
            headers=auth_header
        )
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"SUCCESS: Scripts list returned {len(data)} scripts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
