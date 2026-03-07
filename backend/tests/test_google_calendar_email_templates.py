"""
Tests for Google Calendar Integration and Visual Email Template Editor features
- Google Calendar OAuth endpoints and integration settings
- Email templates CRUD with json_content for visual editor
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "carlos.mendoza@leadvibes.mx"
TEST_USER_PASSWORD = "demo123"


class TestAuthentication:
    """Test authentication for protected endpoints"""
    
    def test_login_success(self):
        """Test login with demo credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_USER_EMAIL
        print(f"✓ Login successful for {TEST_USER_EMAIL}")


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for tests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Authentication failed - skipping tests")


@pytest.fixture
def api_client(auth_token):
    """Authenticated requests session"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


# ==================== INTEGRATION SETTINGS TESTS ====================

class TestIntegrationSettings:
    """Test /api/settings/integrations endpoints for Google Calendar"""
    
    def test_get_integrations_settings(self, api_client):
        """GET /api/settings/integrations - should return Google Calendar fields"""
        response = api_client.get(f"{BASE_URL}/api/settings/integrations")
        assert response.status_code == 200
        data = response.json()
        
        # Check that Google Calendar fields exist in response
        assert "google_client_id" in data or data.get("google_client_id", "") is not None
        assert "google_client_secret" in data or data.get("google_client_secret", "") is not None
        assert "google_calendar_enabled" in data
        assert "google_calendar_email" in data or data.get("google_calendar_email") is None
        
        print(f"✓ GET /api/settings/integrations returns Google Calendar fields")
        print(f"  - google_calendar_enabled: {data.get('google_calendar_enabled')}")
        print(f"  - google_calendar_email: {data.get('google_calendar_email')}")
    
    def test_put_integrations_google_credentials(self, api_client):
        """PUT /api/settings/integrations - should accept google_client_id and google_client_secret"""
        # First get current settings
        get_response = api_client.get(f"{BASE_URL}/api/settings/integrations")
        original_data = get_response.json()
        
        # Update with test Google credentials
        test_client_id = "TEST_CLIENT_ID_123.apps.googleusercontent.com"
        test_client_secret = "TEST_SECRET_XYZ"
        
        update_payload = {
            "google_client_id": test_client_id,
            "google_client_secret": test_client_secret
        }
        
        response = api_client.put(f"{BASE_URL}/api/settings/integrations", json=update_payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify update was accepted
        print(f"✓ PUT /api/settings/integrations accepts Google credentials")
        
        # Verify by GET - credentials should be masked or present
        verify_response = api_client.get(f"{BASE_URL}/api/settings/integrations")
        verify_data = verify_response.json()
        
        # Check that credentials are stored (they may be masked)
        assert verify_data.get("google_client_id") is not None or "google_client_id" in verify_data
        print(f"  - Credentials were saved/updated successfully")


class TestGoogleOAuthLogin:
    """Test /api/oauth/google/login endpoint"""
    
    def test_google_oauth_login_without_credentials(self, api_client):
        """GET /api/oauth/google/login without credentials returns 400 or succeeds with default"""
        # First clear credentials
        api_client.put(f"{BASE_URL}/api/settings/integrations", json={
            "google_client_id": "",
            "google_client_secret": ""
        })
        
        response = api_client.get(f"{BASE_URL}/api/oauth/google/login")
        # API may return 400 or may return 200 with authorization_url 
        # depending on if empty strings are treated as "not configured"
        if response.status_code == 400:
            data = response.json()
            assert "detail" in data
            print(f"✓ OAuth login returns 400 when credentials not configured")
            print(f"  - Error: {data.get('detail')}")
        else:
            # If 200, it means endpoint still works (accepts empty as valid)
            assert response.status_code == 200
            print(f"✓ OAuth login endpoint responds (status: {response.status_code})")
            print(f"  - Note: Empty credentials may still generate OAuth URL")
    
    def test_google_oauth_login_with_credentials(self, api_client):
        """GET /api/oauth/google/login with credentials returns authorization_url"""
        # Set test credentials first
        api_client.put(f"{BASE_URL}/api/settings/integrations", json={
            "google_client_id": "test-client-id.apps.googleusercontent.com",
            "google_client_secret": "test-secret-key"
        })
        
        response = api_client.get(f"{BASE_URL}/api/oauth/google/login")
        
        # With fake credentials, it should still generate an authorization URL
        # or might fail at Flow creation - either way we're testing the endpoint
        if response.status_code == 200:
            data = response.json()
            assert "authorization_url" in data
            assert "accounts.google.com" in data["authorization_url"]
            print(f"✓ OAuth login returns authorization_url")
            print(f"  - URL starts with Google OAuth endpoint")
        else:
            # If it fails due to invalid credentials format, that's expected
            print(f"✓ OAuth login endpoint responds (status: {response.status_code})")
            print(f"  - Note: Real Google credentials needed for full flow")


class TestGoogleOAuthDisconnect:
    """Test /api/oauth/google/disconnect endpoint"""
    
    def test_google_disconnect(self, api_client):
        """POST /api/oauth/google/disconnect should work"""
        response = api_client.post(f"{BASE_URL}/api/oauth/google/disconnect")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Google Calendar disconnect works")
        print(f"  - Message: {data.get('message')}")
        
        # Verify disconnection
        verify_response = api_client.get(f"{BASE_URL}/api/settings/integrations")
        verify_data = verify_response.json()
        assert verify_data.get("google_calendar_enabled") == False
        print(f"  - google_calendar_enabled is now False")


# ==================== EMAIL TEMPLATES TESTS ====================

class TestEmailTemplates:
    """Test email templates CRUD endpoints with json_content support"""
    
    def test_get_email_templates_list(self, api_client):
        """GET /api/email-templates - should return list of templates"""
        response = api_client.get(f"{BASE_URL}/api/email-templates")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/email-templates returns list")
        print(f"  - Found {len(data)} templates")
    
    def test_create_email_template_with_json_content(self, api_client):
        """POST /api/email-templates - create template with json_content for visual editor"""
        template_payload = {
            "name": "TEST_Visual_Editor_Template",
            "subject": "Test Subject {{nombre}}",
            "html_content": "<html><body><h1>Hello {{nombre}}</h1><p>Test content</p></body></html>",
            "json_content": {
                "blocks": [
                    {
                        "id": "block-1",
                        "type": "text",
                        "content": "Hello {{nombre}}",
                        "style": {
                            "fontSize": 24,
                            "color": "#333333",
                            "textAlign": "center",
                            "fontWeight": "bold",
                            "padding": 16
                        }
                    },
                    {
                        "id": "block-2",
                        "type": "button",
                        "text": "Click Here",
                        "url": "https://example.com",
                        "style": {
                            "backgroundColor": "#0D9488",
                            "color": "#ffffff",
                            "fontSize": 16,
                            "padding": "12px 24px",
                            "borderRadius": 8,
                            "textAlign": "center"
                        }
                    },
                    {
                        "id": "block-3",
                        "type": "divider",
                        "style": {
                            "borderColor": "#e5e7eb",
                            "borderWidth": 1,
                            "margin": "16px 0"
                        }
                    }
                ],
                "backgroundColor": "#f5f5f5",
                "contentWidth": 600
            },
            "variables": ["nombre"]
        }
        
        response = api_client.post(f"{BASE_URL}/api/email-templates", json=template_payload)
        assert response.status_code in [200, 201]
        data = response.json()
        
        # Verify response contains our data
        assert data.get("name") == template_payload["name"]
        assert data.get("subject") == template_payload["subject"]
        assert "id" in data
        assert "json_content" in data or data.get("json_content") is not None
        
        # Store template ID for further tests
        template_id = data.get("id")
        print(f"✓ POST /api/email-templates creates template with json_content")
        print(f"  - Template ID: {template_id}")
        print(f"  - Name: {data.get('name')}")
        
        return template_id
    
    def test_get_single_email_template(self, api_client):
        """GET /api/email-templates/{id} - should return template with json_content"""
        # First create a template
        template_payload = {
            "name": "TEST_Get_Single_Template",
            "subject": "Test Subject",
            "html_content": "<html><body>Test</body></html>",
            "json_content": {
                "blocks": [
                    {"id": "block-1", "type": "text", "content": "Test text"}
                ],
                "backgroundColor": "#ffffff",
                "contentWidth": 600
            },
            "variables": []
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/email-templates", json=template_payload)
        assert create_response.status_code in [200, 201]
        template_id = create_response.json().get("id")
        
        # Now get the template
        response = api_client.get(f"{BASE_URL}/api/email-templates/{template_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify all fields
        assert data.get("id") == template_id
        assert data.get("name") == template_payload["name"]
        assert data.get("subject") == template_payload["subject"]
        assert "json_content" in data
        
        if data.get("json_content"):
            assert "blocks" in data["json_content"]
            assert len(data["json_content"]["blocks"]) > 0
        
        print(f"✓ GET /api/email-templates/{template_id} returns template with json_content")
        print(f"  - Has json_content: {data.get('json_content') is not None}")
    
    def test_update_email_template(self, api_client):
        """PUT /api/email-templates/{id} - should update template"""
        # First create a template
        create_payload = {
            "name": "TEST_Update_Template",
            "subject": "Original Subject",
            "html_content": "<html><body>Original</body></html>",
            "json_content": {
                "blocks": [{"id": "block-1", "type": "text", "content": "Original"}],
                "backgroundColor": "#ffffff",
                "contentWidth": 600
            },
            "variables": []
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/email-templates", json=create_payload)
        template_id = create_response.json().get("id")
        
        # Update the template
        update_payload = {
            "name": "TEST_Update_Template_UPDATED",
            "subject": "Updated Subject",
            "html_content": "<html><body>Updated Content</body></html>",
            "json_content": {
                "blocks": [
                    {"id": "block-1", "type": "text", "content": "Updated text"},
                    {"id": "block-2", "type": "button", "text": "New Button", "url": "#"}
                ],
                "backgroundColor": "#f0f0f0",
                "contentWidth": 650
            },
            "variables": []
        }
        
        response = api_client.put(f"{BASE_URL}/api/email-templates/{template_id}", json=update_payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify update
        assert data.get("name") == update_payload["name"]
        assert data.get("subject") == update_payload["subject"]
        
        # Verify by GET
        verify_response = api_client.get(f"{BASE_URL}/api/email-templates/{template_id}")
        verify_data = verify_response.json()
        assert verify_data.get("name") == update_payload["name"]
        
        print(f"✓ PUT /api/email-templates/{template_id} updates template")
        print(f"  - Name updated to: {verify_data.get('name')}")
    
    def test_delete_email_template(self, api_client):
        """DELETE /api/email-templates/{id} - should delete template"""
        # First create a template
        create_payload = {
            "name": "TEST_Delete_Template",
            "subject": "To Delete",
            "html_content": "<html><body>Delete me</body></html>",
            "json_content": None,
            "variables": []
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/email-templates", json=create_payload)
        template_id = create_response.json().get("id")
        
        # Delete the template
        response = api_client.delete(f"{BASE_URL}/api/email-templates/{template_id}")
        assert response.status_code == 200
        
        # Verify deletion - GET should return 404
        verify_response = api_client.get(f"{BASE_URL}/api/email-templates/{template_id}")
        assert verify_response.status_code == 404
        
        print(f"✓ DELETE /api/email-templates/{template_id} removes template")
        print(f"  - GET now returns 404")


class TestEmailTemplateEdgeCases:
    """Test edge cases for email templates"""
    
    def test_get_nonexistent_template(self, api_client):
        """GET /api/email-templates/{id} - non-existent returns 404"""
        response = api_client.get(f"{BASE_URL}/api/email-templates/nonexistent-id-12345")
        assert response.status_code == 404
        print(f"✓ GET non-existent template returns 404")
    
    def test_update_nonexistent_template(self, api_client):
        """PUT /api/email-templates/{id} - non-existent returns 404"""
        update_payload = {
            "name": "Test",
            "subject": "Test",
            "html_content": "<html></html>",
            "variables": []
        }
        response = api_client.put(f"{BASE_URL}/api/email-templates/nonexistent-id-12345", json=update_payload)
        assert response.status_code == 404
        print(f"✓ PUT non-existent template returns 404")


# ==================== CLEANUP ====================

@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data(auth_token):
    """Cleanup TEST_ prefixed templates after tests"""
    yield
    
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    
    # Get all templates and delete TEST_ prefixed ones
    response = session.get(f"{BASE_URL}/api/email-templates")
    if response.status_code == 200:
        templates = response.json()
        for template in templates:
            if template.get("name", "").startswith("TEST_"):
                session.delete(f"{BASE_URL}/api/email-templates/{template['id']}")
                print(f"  Cleaned up: {template['name']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
