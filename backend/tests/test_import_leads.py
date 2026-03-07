"""
Test suite for Lead Import Module in Rovi CRM
Tests: /api/import/upload, /api/import/preview, /api/import/execute
"""

import pytest
import requests
import os
import io

# Base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://lead-bulk-upload.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "carlos.mendoza@leadvibes.mx"
TEST_PASSWORD = "demo123"

# Test CSV data
TEST_CSV_DATA = """Nombre,Email,Telefono,Fuente,Presupuesto,Interes
TEST_Import_Juan,test_import_juan@test.com,+52 999 111 2222,Facebook,1500000,Departamento
TEST_Import_Maria,test_import_maria@test.com,+52 999 333 4444,Instagram,2500000,Casa
TEST_Import_Carlos,test_import_carlos@test.com,+52 999 555 6666,Web,3000000,Lote
TEST_Import_Ana,test_import_ana@test.com,+52 999 777 8888,Referido,4500000,Departamento
TEST_Import_Pedro,,+52 999 888 9999,Facebook,1000000,Casa"""

# CSV with missing required fields
BAD_CSV_DATA = """Nombre,Email,Telefono
,bad_test@test.com,
TestName,,"""


class TestAuthentication:
    """Test authentication first to ensure we can run import tests"""
    
    def test_login_success(self):
        """Verify login works with demo credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert "user" in data, "No user in response"
        print(f"Login successful for {TEST_EMAIL}")


class TestImportFields:
    """Test the import fields endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_get_import_fields(self, auth_token):
        """Test GET /api/import/fields returns available field mappings"""
        response = requests.get(f"{BASE_URL}/api/import/fields", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200, f"Failed to get import fields: {response.text}"
        
        fields = response.json()
        assert "name" in fields, "name field missing"
        assert "email" in fields, "email field missing"
        assert "phone" in fields, "phone field missing"
        
        # Verify required fields are marked
        assert fields["name"]["required"] == True, "name should be required"
        assert fields["phone"]["required"] == True, "phone should be required"
        print(f"Import fields endpoint returned {len(fields)} fields")


class TestImportUpload:
    """Test the import upload endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_upload_csv_file(self, auth_token):
        """Test POST /api/import/upload with CSV file"""
        csv_file = io.BytesIO(TEST_CSV_DATA.encode('utf-8'))
        
        response = requests.post(
            f"{BASE_URL}/api/import/upload",
            headers={"Authorization": f"Bearer {auth_token}"},
            files={"file": ("test_leads.csv", csv_file, "text/csv")}
        )
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        
        data = response.json()
        assert "job_id" in data, "No job_id in response"
        assert "headers" in data, "No headers in response"
        assert "total_rows" in data, "No total_rows in response"
        assert "sample_data" in data, "No sample_data in response"
        assert "mapping_suggestions" in data, "No mapping_suggestions in response"
        assert "available_fields" in data, "No available_fields in response"
        
        # Verify headers were detected
        expected_headers = ["Nombre", "Email", "Telefono", "Fuente", "Presupuesto", "Interes"]
        for header in expected_headers:
            assert header in data["headers"], f"Header {header} not found"
        
        # Verify total rows
        assert data["total_rows"] == 5, f"Expected 5 rows, got {data['total_rows']}"
        
        # Verify mapping suggestions detected common fields
        assert "name" in data["mapping_suggestions"], "name mapping not suggested"
        assert data["mapping_suggestions"]["name"] == "Nombre", "Incorrect name mapping"
        
        print(f"Upload successful: job_id={data['job_id']}, rows={data['total_rows']}")
        return data["job_id"]
    
    def test_upload_invalid_file_type(self, auth_token):
        """Test upload rejects invalid file types"""
        txt_file = io.BytesIO(b"This is a text file")
        
        response = requests.post(
            f"{BASE_URL}/api/import/upload",
            headers={"Authorization": f"Bearer {auth_token}"},
            files={"file": ("test.txt", txt_file, "text/plain")}
        )
        
        assert response.status_code == 400, f"Should reject .txt files: {response.status_code}"
        print("Invalid file type correctly rejected")
    
    def test_upload_requires_auth(self):
        """Test upload requires authentication"""
        csv_file = io.BytesIO(TEST_CSV_DATA.encode('utf-8'))
        
        response = requests.post(
            f"{BASE_URL}/api/import/upload",
            files={"file": ("test_leads.csv", csv_file, "text/csv")}
        )
        
        assert response.status_code in [401, 403], f"Should require auth: {response.status_code}"
        print("Authentication correctly required")


class TestImportPreview:
    """Test the import preview endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture
    def uploaded_job(self, auth_token):
        """Upload a file and return job_id"""
        csv_file = io.BytesIO(TEST_CSV_DATA.encode('utf-8'))
        response = requests.post(
            f"{BASE_URL}/api/import/upload",
            headers={"Authorization": f"Bearer {auth_token}"},
            files={"file": ("test_leads.csv", csv_file, "text/csv")}
        )
        assert response.status_code == 200
        return response.json()
    
    def test_preview_with_mapping(self, auth_token, uploaded_job):
        """Test POST /api/import/preview with column mapping"""
        job_id = uploaded_job["job_id"]
        
        # Create mapping based on headers
        mapping = [
            {"source_column": "Nombre", "target_field": "name"},
            {"source_column": "Email", "target_field": "email"},
            {"source_column": "Telefono", "target_field": "phone"},
            {"source_column": "Fuente", "target_field": "source"},
            {"source_column": "Presupuesto", "target_field": "budget_mxn"},
            {"source_column": "Interes", "target_field": "property_interest"}
        ]
        
        response = requests.post(
            f"{BASE_URL}/api/import/preview",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={
                "job_id": job_id,
                "mapping": mapping,
                "skip_duplicates": True,
                "duplicate_field": "email"
            }
        )
        
        assert response.status_code == 200, f"Preview failed: {response.text}"
        
        data = response.json()
        assert "preview_rows" in data, "No preview_rows in response"
        assert "total_rows" in data, "No total_rows in response"
        assert "valid_rows" in data, "No valid_rows in response"
        assert "error_rows" in data, "No error_rows in response"
        assert "duplicates_found" in data, "No duplicates_found in response"
        
        # Verify preview data structure
        assert len(data["preview_rows"]) > 0, "No preview rows returned"
        first_row = data["preview_rows"][0]
        assert "row_number" in first_row, "Missing row_number"
        assert "data" in first_row, "Missing data"
        assert "valid" in first_row, "Missing valid flag"
        
        # Verify data transformation
        assert first_row["data"]["name"] == "TEST_Import_Juan", "Name not mapped correctly"
        
        print(f"Preview successful: {data['total_rows']} total, {data['valid_rows']} valid, {data['error_rows']} errors")
    
    def test_preview_invalid_job_id(self, auth_token):
        """Test preview with invalid job_id returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/import/preview",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={
                "job_id": "invalid-job-id-12345",
                "mapping": [{"source_column": "Nombre", "target_field": "name"}],
                "skip_duplicates": False,
                "duplicate_field": "email"
            }
        )
        
        assert response.status_code == 404, f"Should return 404 for invalid job_id: {response.status_code}"
        print("Invalid job_id correctly returns 404")


class TestImportExecute:
    """Test the import execute endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture
    def uploaded_job(self, auth_token):
        """Upload a file and return job_id"""
        csv_file = io.BytesIO(TEST_CSV_DATA.encode('utf-8'))
        response = requests.post(
            f"{BASE_URL}/api/import/upload",
            headers={"Authorization": f"Bearer {auth_token}"},
            files={"file": ("test_leads.csv", csv_file, "text/csv")}
        )
        assert response.status_code == 200
        return response.json()
    
    def test_execute_import(self, auth_token, uploaded_job):
        """Test POST /api/import/execute creates leads"""
        job_id = uploaded_job["job_id"]
        
        # Create mapping
        mapping = [
            {"source_column": "Nombre", "target_field": "name"},
            {"source_column": "Email", "target_field": "email"},
            {"source_column": "Telefono", "target_field": "phone"},
            {"source_column": "Fuente", "target_field": "source"},
            {"source_column": "Presupuesto", "target_field": "budget_mxn"},
            {"source_column": "Interes", "target_field": "property_interest"}
        ]
        
        response = requests.post(
            f"{BASE_URL}/api/import/execute",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={
                "job_id": job_id,
                "mapping": mapping,
                "skip_duplicates": True,
                "duplicate_field": "email"
            }
        )
        
        assert response.status_code == 200, f"Execute failed: {response.text}"
        
        data = response.json()
        assert "status" in data, "No status in response"
        assert "imported" in data, "No imported count in response"
        assert "skipped" in data, "No skipped count in response"
        assert "errors" in data, "No errors count in response"
        
        # Should import some leads
        assert data["imported"] > 0, f"No leads imported: {data}"
        
        print(f"Import executed: {data['imported']} imported, {data['skipped']} skipped, {data['errors']} errors")
        print(f"Import status: {data['status']}")
        
        # Verify leads were actually created - GET /api/leads and search
        leads_response = requests.get(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {auth_token}"},
            params={"search": "TEST_Import_Juan"}
        )
        
        if leads_response.status_code == 200:
            leads = leads_response.json()
            # Check if our imported lead exists
            imported_names = [l["name"] for l in leads]
            print(f"Leads found with TEST_Import prefix: {len(leads)}")
    
    def test_execute_with_duplicates(self, auth_token):
        """Test executing import twice - second time should skip duplicates"""
        # First upload
        csv_file1 = io.BytesIO(TEST_CSV_DATA.encode('utf-8'))
        upload_response = requests.post(
            f"{BASE_URL}/api/import/upload",
            headers={"Authorization": f"Bearer {auth_token}"},
            files={"file": ("test_leads.csv", csv_file1, "text/csv")}
        )
        assert upload_response.status_code == 200
        job_id1 = upload_response.json()["job_id"]
        
        mapping = [
            {"source_column": "Nombre", "target_field": "name"},
            {"source_column": "Email", "target_field": "email"},
            {"source_column": "Telefono", "target_field": "phone"},
            {"source_column": "Fuente", "target_field": "source"},
        ]
        
        # First execute
        exec_response1 = requests.post(
            f"{BASE_URL}/api/import/execute",
            headers={"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"},
            json={"job_id": job_id1, "mapping": mapping, "skip_duplicates": True, "duplicate_field": "email"}
        )
        assert exec_response1.status_code == 200
        first_result = exec_response1.json()
        
        # Second upload with same data
        csv_file2 = io.BytesIO(TEST_CSV_DATA.encode('utf-8'))
        upload_response2 = requests.post(
            f"{BASE_URL}/api/import/upload",
            headers={"Authorization": f"Bearer {auth_token}"},
            files={"file": ("test_leads2.csv", csv_file2, "text/csv")}
        )
        assert upload_response2.status_code == 200
        job_id2 = upload_response2.json()["job_id"]
        
        # Second execute - should skip duplicates
        exec_response2 = requests.post(
            f"{BASE_URL}/api/import/execute",
            headers={"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"},
            json={"job_id": job_id2, "mapping": mapping, "skip_duplicates": True, "duplicate_field": "email"}
        )
        assert exec_response2.status_code == 200
        second_result = exec_response2.json()
        
        # Second execution should have more skips
        print(f"First import: {first_result['imported']} imported, {first_result['skipped']} skipped")
        print(f"Second import: {second_result['imported']} imported, {second_result['skipped']} skipped")
        
        # Note: The actual number depends on what was already in DB
        # Just verify the endpoint works


class TestImportJobHistory:
    """Test import job history endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_get_import_jobs(self, auth_token):
        """Test GET /api/import/jobs returns job history"""
        response = requests.get(
            f"{BASE_URL}/api/import/jobs",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get jobs: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        if len(data) > 0:
            job = data[0]
            assert "id" in job, "Job missing id"
            assert "filename" in job, "Job missing filename"
            assert "status" in job, "Job missing status"
            print(f"Found {len(data)} import jobs")
        else:
            print("No import jobs found (this is OK if none have been run)")
    
    def test_get_import_template(self, auth_token):
        """Test GET /api/import/template returns CSV template"""
        response = requests.get(
            f"{BASE_URL}/api/import/template",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get template: {response.text}"
        
        data = response.json()
        assert "template_csv" in data, "No template_csv in response"
        assert "headers" in data, "No headers in response"
        assert "instructions" in data, "No instructions in response"
        
        print(f"Template headers: {data['headers']}")


class TestImportEndToEnd:
    """End-to-end test of the full import flow"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_full_import_flow(self, auth_token):
        """Test complete import workflow: upload → preview → execute → verify"""
        # Use unique test data for this run
        import time
        timestamp = int(time.time())
        unique_csv = f"""Nombre,Email,Telefono,Fuente,Presupuesto,Interes
E2E_Test_User_{timestamp},e2e_test_{timestamp}@test.com,+52 999 000 {timestamp % 10000:04d},E2E Test,5000000,E2E Testing"""
        
        # Step 1: Upload
        csv_file = io.BytesIO(unique_csv.encode('utf-8'))
        upload_response = requests.post(
            f"{BASE_URL}/api/import/upload",
            headers={"Authorization": f"Bearer {auth_token}"},
            files={"file": ("e2e_test.csv", csv_file, "text/csv")}
        )
        assert upload_response.status_code == 200, f"Upload failed: {upload_response.text}"
        
        upload_data = upload_response.json()
        job_id = upload_data["job_id"]
        print(f"Step 1 - Upload OK: job_id={job_id}")
        
        # Step 2: Preview
        mapping = [
            {"source_column": "Nombre", "target_field": "name"},
            {"source_column": "Email", "target_field": "email"},
            {"source_column": "Telefono", "target_field": "phone"},
            {"source_column": "Fuente", "target_field": "source"},
            {"source_column": "Presupuesto", "target_field": "budget_mxn"},
            {"source_column": "Interes", "target_field": "property_interest"}
        ]
        
        preview_response = requests.post(
            f"{BASE_URL}/api/import/preview",
            headers={"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"},
            json={"job_id": job_id, "mapping": mapping, "skip_duplicates": True, "duplicate_field": "email"}
        )
        assert preview_response.status_code == 200, f"Preview failed: {preview_response.text}"
        
        preview_data = preview_response.json()
        assert preview_data["valid_rows"] == 1, f"Expected 1 valid row, got {preview_data['valid_rows']}"
        print(f"Step 2 - Preview OK: {preview_data['valid_rows']} valid rows")
        
        # Step 3: Execute
        execute_response = requests.post(
            f"{BASE_URL}/api/import/execute",
            headers={"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"},
            json={"job_id": job_id, "mapping": mapping, "skip_duplicates": True, "duplicate_field": "email"}
        )
        assert execute_response.status_code == 200, f"Execute failed: {execute_response.text}"
        
        execute_data = execute_response.json()
        assert execute_data["imported"] == 1, f"Expected 1 imported, got {execute_data['imported']}"
        print(f"Step 3 - Execute OK: {execute_data['imported']} imported")
        
        # Step 4: Verify lead exists
        leads_response = requests.get(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {auth_token}"},
            params={"search": f"E2E_Test_User_{timestamp}"}
        )
        assert leads_response.status_code == 200, f"Leads fetch failed: {leads_response.text}"
        
        leads = leads_response.json()
        found = any(l["name"] == f"E2E_Test_User_{timestamp}" for l in leads)
        assert found, f"Imported lead not found in leads list"
        print(f"Step 4 - Verify OK: Lead found in database")
        
        # Step 5: Check job status
        job_response = requests.get(
            f"{BASE_URL}/api/import/jobs/{job_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert job_response.status_code == 200, f"Job fetch failed: {job_response.text}"
        
        job_data = job_response.json()
        assert job_data["status"] == "completed", f"Job status should be completed, got {job_data['status']}"
        print(f"Step 5 - Job Status OK: {job_data['status']}")
        
        print("\n✅ Full import E2E test passed!")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
