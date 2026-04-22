#!/usr/bin/env python3
import requests
import json

BACKEND_URL = "http://localhost:8100"

# Login
login_resp = requests.post(
    f"{BACKEND_URL}/api/auth/login",
    json={"email": "admin@rovi.crm", "password": "RoviProspect2026!"}
)
token = login_resp.json()["access_token"]

# Get leads
headers = {"Authorization": f"Bearer {token}"}
leads_resp = requests.get(f"{BACKEND_URL}/api/leads", headers=headers)

print(f"Status: {leads_resp.status_code}")
print(f"Response type: {type(leads_resp.json())}")

data = leads_resp.json()
print(f"\nKeys: {data.keys() if isinstance(data, dict) else 'Not a dict'}")
print(f"\nFull response:")
print(json.dumps(data, indent=2)[:500])
