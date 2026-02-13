#!/usr/bin/env python3
"""
SelvaVibes CRM Backend API Test Suite
Tests all API endpoints for authentication, onboarding, seeding, dashboard, leads, AI services, etc.
"""

import requests
import json
import sys
import time
from datetime import datetime
from typing import Dict, Any, Optional, List

class SelvaVibesCRMTester:
    def __init__(self, base_url: str = "https://deals-hub-13.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        # Demo credentials
        self.demo_email = "carlos.mendoza@selvavibes.mx"
        self.demo_password = "demo123"
        
        # Test user credentials
        self.test_email = f"test_{int(time.time())}@selvavibes.mx"
        self.test_password = "testpass123"
        self.test_name = "Test User"

    def log(self, message: str, test_name: str = None):
        if test_name:
            print(f"\n🔍 {test_name}: {message}")
        else:
            print(message)

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None) -> tuple[bool, Dict]:
        """Run a single API test"""
        url = f"{self.api_url}{endpoint}"
        
        # Default headers
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED - Status: {response.status_code}", name)
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log(f"❌ FAILED - Expected {expected_status}, got {response.status_code}", name)
                self.log(f"Response: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "endpoint": endpoint,
                    "error": response.text[:200]
                })
                try:
                    return False, response.json()
                except:
                    return False, {"error": response.text}

        except Exception as e:
            self.log(f"❌ FAILED - Error: {str(e)}", name)
            self.failed_tests.append({
                "test": name,
                "error": str(e),
                "endpoint": endpoint
            })
            return False, {}

    # Authentication Tests
    def test_health_check(self) -> bool:
        """Test API health"""
        return self.run_test("Health Check", "GET", "/health", 200)[0]

    def test_register(self) -> bool:
        """Test user registration"""
        data = {
            "email": self.test_email,
            "password": self.test_password,
            "name": self.test_name,
            "role": "broker",
            "phone": "+52 984 123 4567"
        }
        success, response = self.run_test("Register New User", "POST", "/auth/register", 200, data)
        if success and "access_token" in response:
            self.token = response["access_token"]
            self.user_id = response["user"]["id"]
            self.log(f"✅ Token received: {self.token[:20]}...")
        return success

    def test_login(self) -> bool:
        """Test user login with demo credentials"""
        data = {
            "email": self.demo_email,
            "password": self.demo_password
        }
        success, response = self.run_test("Login Demo User", "POST", "/auth/login", 200, data)
        if success and "access_token" in response:
            self.token = response["access_token"]
            self.user_id = response["user"]["id"]
            self.log(f"✅ Demo login successful")
        return success

    def test_get_me(self) -> bool:
        """Test get current user"""
        return self.run_test("Get Current User", "GET", "/auth/me", 200)[0]

    # Onboarding Tests
    def test_save_goals(self) -> bool:
        """Test saving user goals (onboarding)"""
        data = {
            "ventas_mes": 8,
            "ingresos_objetivo": 800000,
            "leads_contactados": 60,
            "tasa_conversion": 15,
            "apartados_mes": 12,
            "periodo": "mensual"
        }
        return self.run_test("Save User Goals", "POST", "/goals", 200, data)[0]

    # Seed Data Tests
    def test_seed_data(self) -> bool:
        """Test seeding demo data"""
        success, response = self.run_test("Seed Demo Data", "POST", "/seed", 200)
        if success:
            brokers = response.get("brokers", 0)
            leads = response.get("leads", 0)
            self.log(f"✅ Seeded {brokers} brokers and {leads} leads")
        return success

    # Dashboard Tests
    def test_dashboard_stats(self) -> bool:
        """Test dashboard statistics"""
        success, response = self.run_test("Dashboard Stats", "GET", "/dashboard/stats", 200)
        if success:
            stats = ["total_points", "ventas", "apartados", "brokers_activos", "leads_nuevos"]
            missing = [s for s in stats if s not in response]
            if missing:
                self.log(f"⚠️  Missing stats fields: {missing}")
        return success

    def test_dashboard_leaderboard(self) -> bool:
        """Test dashboard leaderboard"""
        success, response = self.run_test("Dashboard Leaderboard", "GET", "/dashboard/leaderboard", 200)
        if success and isinstance(response, list):
            self.log(f"✅ Leaderboard has {len(response)} brokers")
        return success

    def test_dashboard_recent_activity(self) -> bool:
        """Test dashboard recent activity"""
        success, response = self.run_test("Dashboard Recent Activity", "GET", "/dashboard/recent-activity", 200)
        if success and isinstance(response, list):
            self.log(f"✅ Recent activity has {len(response)} items")
        return success

    # Leads CRUD Tests
    def test_leads_list(self) -> bool:
        """Test getting all leads"""
        return self.run_test("Get All Leads", "GET", "/leads", 200)[0]

    def test_create_lead(self) -> str:
        """Test creating a new lead"""
        data = {
            "name": "Juan Test López",
            "email": "juan.test@email.com",
            "phone": "+52 984 555 0123",
            "source": "website",
            "budget_mxn": 2500000,
            "property_interest": "lote residencial premium",
            "notes": "Interesado en Tulum, inversión"
        }
        success, response = self.run_test("Create Lead", "POST", "/leads", 200, data)
        if success and "id" in response:
            return response["id"]
        return None

    def test_get_lead(self, lead_id: str) -> bool:
        """Test getting a specific lead"""
        if not lead_id:
            return False
        return self.run_test("Get Single Lead", "GET", f"/leads/{lead_id}", 200)[0]

    def test_update_lead(self, lead_id: str) -> bool:
        """Test updating a lead"""
        if not lead_id:
            return False
        data = {
            "status": "contactado",
            "priority": "alta",
            "notes": "Contactado por teléfono - muy interesado"
        }
        return self.run_test("Update Lead", "PUT", f"/leads/{lead_id}", 200, data)[0]

    # AI Analysis Tests
    def test_ai_lead_analysis(self, lead_id: str) -> bool:
        """Test AI lead analysis"""
        if not lead_id:
            return False
        success, response = self.run_test("AI Lead Analysis", "POST", f"/leads/{lead_id}/analyze", 200)
        if success:
            expected_fields = ["intent_score", "sentiment", "key_points", "next_action"]
            missing = [f for f in expected_fields if f not in response]
            if missing:
                self.log(f"⚠️  AI analysis missing fields: {missing}")
            else:
                self.log(f"✅ AI analysis complete - Intent: {response.get('intent_score')}")
        return success

    def test_ai_script_generation(self, lead_id: str) -> bool:
        """Test AI script generation"""
        if not lead_id:
            return False
        success, response = self.run_test("AI Script Generation", "POST", f"/leads/{lead_id}/generate-script?script_type=apertura", 200)
        if success and "script" in response:
            script_length = len(response["script"])
            self.log(f"✅ Generated script with {script_length} characters")
        return success

    # Activities Tests
    def test_create_activity(self, lead_id: str) -> bool:
        """Test creating an activity"""
        if not lead_id:
            return False
        data = {
            "lead_id": lead_id,
            "activity_type": "llamada",
            "description": "Primera llamada de contacto",
            "outcome": "Interesado, agendó zoom para mañana"
        }
        success, response = self.run_test("Create Activity", "POST", "/activities", 200, data)
        if success and "points_earned" in response:
            self.log(f"✅ Activity created, earned {response['points_earned']} points")
        return success

    def test_get_activities(self) -> bool:
        """Test getting activities"""
        return self.run_test("Get Activities", "GET", "/activities", 200)[0]

    # Brokers Tests
    def test_get_brokers(self) -> bool:
        """Test getting all brokers"""
        success, response = self.run_test("Get All Brokers", "GET", "/brokers", 200)
        if success and isinstance(response, list):
            self.log(f"✅ Found {len(response)} brokers")
        return success

    def test_get_broker_detail(self) -> bool:
        """Test getting broker details"""
        # First get brokers list to find one
        success, brokers = self.run_test("Get Brokers for Detail Test", "GET", "/brokers", 200)
        if success and brokers and len(brokers) > 0:
            broker_id = brokers[0]["id"]
            return self.run_test("Get Broker Detail", "GET", f"/brokers/{broker_id}", 200)[0]
        return False

    # Gamification Tests
    def test_gamification_rules(self) -> bool:
        """Test getting gamification rules"""
        success, response = self.run_test("Get Gamification Rules", "GET", "/gamification/rules", 200)
        if success and isinstance(response, list):
            self.log(f"✅ Found {len(response)} gamification rules")
        return success

    def test_gamification_points(self) -> bool:
        """Test getting point ledger"""
        success, response = self.run_test("Get Point Ledger", "GET", "/gamification/points", 200)
        if success and isinstance(response, list):
            self.log(f"✅ Found {len(response)} point entries")
        return success

    # Scripts Tests
    def test_get_scripts(self) -> bool:
        """Test getting sales scripts"""
        success, response = self.run_test("Get Scripts", "GET", "/scripts", 200)
        if success and isinstance(response, list):
            self.log(f"✅ Found {len(response)} scripts")
        return success

    def test_create_script(self) -> bool:
        """Test creating a script"""
        data = {
            "title": "Script de Apertura Premium",
            "category": "apertura",
            "content": "Hola [NOMBRE], soy [BROKER] de SelvaVibes Real Estate...",
            "tags": ["apertura", "premium", "tulum"]
        }
        return self.run_test("Create Script", "POST", "/scripts", 200, data)[0]

    # AI Chat Tests
    def test_ai_chat(self) -> bool:
        """Test AI chat functionality"""
        data = {
            "content": "¿Cómo puedo mejorar mi tasa de conversión de leads?"
        }
        success, response = self.run_test("AI Chat", "POST", "/chat", 200, data)
        if success and "content" in response:
            response_length = len(response["content"])
            self.log(f"✅ AI responded with {response_length} characters")
        return success

    def test_ai_chat_history(self) -> bool:
        """Test getting chat history"""
        success, response = self.run_test("AI Chat History", "GET", "/chat/history", 200)
        if success and isinstance(response, list):
            self.log(f"✅ Chat history has {len(response)} messages")
        return success

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting SelvaVibes CRM API Test Suite")
        print(f"🌐 Testing API at: {self.api_url}")
        print("=" * 60)

        # Phase 1: Basic Health & Auth
        print("\n📋 PHASE 1: Health & Authentication")
        self.test_health_check()
        
        # Test with new user registration first
        user_authenticated = False
        if self.test_register():
            print("\n📝 Testing with NEW USER account")
            self.test_save_goals()  # Complete onboarding
            user_authenticated = True
        else:
            print("\n⚠️  Registration failed, trying demo login")
            # Try demo login as backup
            if self.test_login():
                print("\n👤 Using DEMO USER account")
                user_authenticated = True

        if not user_authenticated:
            print("\n❌ Authentication failed completely!")
            return False

        self.test_get_me()

        # Phase 2: Seed Data
        print("\n📋 PHASE 2: Data Seeding")
        self.test_seed_data()

        # Phase 3: Dashboard
        print("\n📋 PHASE 3: Dashboard APIs")
        self.test_dashboard_stats()
        self.test_dashboard_leaderboard()
        self.test_dashboard_recent_activity()

        # Phase 4: Leads CRUD
        print("\n📋 PHASE 4: Leads Management")
        self.test_leads_list()
        lead_id = self.test_create_lead()
        self.test_get_lead(lead_id)
        self.test_update_lead(lead_id)

        # Phase 5: AI Services (with lead)
        print("\n📋 PHASE 5: AI Services")
        if lead_id:
            # Wait a bit for lead to be fully created
            time.sleep(2)
            self.test_ai_lead_analysis(lead_id)
            self.test_ai_script_generation(lead_id)
            self.test_create_activity(lead_id)
        else:
            print("⚠️  Skipping AI tests - no lead created")

        self.test_get_activities()

        # Phase 6: Brokers
        print("\n📋 PHASE 6: Brokers")
        self.test_get_brokers()
        self.test_get_broker_detail()

        # Phase 7: Gamification
        print("\n📋 PHASE 7: Gamification")
        self.test_gamification_rules()
        self.test_gamification_points()

        # Phase 8: Scripts
        print("\n📋 PHASE 8: Scripts")
        self.test_get_scripts()
        self.test_create_script()

        # Phase 9: AI Chat
        print("\n📋 PHASE 9: AI Chat")
        self.test_ai_chat()
        time.sleep(1)  # Wait for message to be saved
        self.test_ai_chat_history()

        # Print Results
        print("\n" + "=" * 60)
        print("🏁 TEST RESULTS SUMMARY")
        print("=" * 60)
        print(f"✅ Tests Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Tests Failed: {len(self.failed_tests)}/{self.tests_run}")
        print(f"📊 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")

        if self.failed_tests:
            print(f"\n❌ FAILED TESTS ({len(self.failed_tests)}):")
            for i, test in enumerate(self.failed_tests, 1):
                print(f"{i}. {test['test']}")
                if 'expected' in test:
                    print(f"   Expected: {test['expected']}, Got: {test['actual']}")
                print(f"   Endpoint: {test['endpoint']}")
                if 'error' in test:
                    print(f"   Error: {test['error']}")
                print()

        # Return success if >80% passed
        return self.tests_passed / self.tests_run >= 0.8

def main():
    tester = SelvaVibesCRMTester()
    success = tester.run_all_tests()
    
    if success:
        print("🎉 Overall Test Suite: PASSED")
        return 0
    else:
        print("💥 Overall Test Suite: FAILED")
        return 1

if __name__ == "__main__":
    sys.exit(main())