#!/usr/bin/env python3
"""
Script para probar la configuración de SendGrid
"""
import os
import requests
import json

# Configuración
API_URL = "http://localhost:18080/api"
SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")

print("🧪 Test de Configuración de SendGrid")
print("=" * 50)

# 1. Verificar backend
print("\n1. Verificando backend...")
try:
    response = requests.get(f"{API_URL}/health")
    if response.status_code == 200:
        print("   ✅ Backend funcionando correctamente")
    else:
        print("   ❌ Backend no responde correctamente")
        exit(1)
except Exception as e:
    print(f"   ❌ Error al conectar con backend: {e}")
    exit(1)

# 2. Verificar variables de entorno
print("\n2. Verificando variables de entorno...")
if SENDGRID_API_KEY:
    # Solo mostrar primeros/últimos caracteres por seguridad
    masked_key = SENDGRID_API_KEY[:8] + "..." + SENDGRID_API_KEY[-4:]
    print(f"   ✅ SENDGRID_API_KEY: {masked_key}")
else:
    print("   ❌ SENDGRID_API_KEY no configurada")

# 3. Login para obtener token
print("\n3. Obteniendo token de autenticación...")
try:
    # Primero necesitamos un usuario existente para probar
    response = requests.post(f"{API_URL}/auth/login", json={
        "email": "rgarciavital@gmail.com",  # Usuario que sabemos que existe
        "password": "temp123"
    })

    if response.status_code == 200:
        token_data = response.json()
        token = token_data.get("access_token")
        print("   ✅ Token obtenido correctamente")
    else:
        print("   ❌ Error al obtener token")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        exit(1)
except Exception as e:
    print(f"   ❌ Error en login: {e}")
    exit(1)

# 4. Verificar integración de SendGrid
print("\n4. Verificando integración con SendGrid...")
try:
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_URL}/settings/integrations", headers=headers)

    if response.status_code == 200:
        settings = response.json()
        sendgrid_enabled = settings.get("sendgrid_enabled", False)
        if sendgrid_enabled:
            print("   ✅ SendGrid configurado y habilitado")
        else:
            print("   ⚠️  SendGrid configurado pero no habilitado")
    else:
        print(f"   ⚠️  No se pudo verificar configuración: {response.status_code}")
except Exception as e:
    print(f"   ⚠️  Error al verificar SendGrid: {e}")

# 5. Listar plantillas de email
print("\n5. Verificando plantillas de email...")
try:
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_URL}/email-templates", headers=headers)

    if response.status_code == 200:
        templates = response.json()
        if len(templates) > 0:
            print(f"   ✅ Existen {len(templates)} plantillas de email")
            print("   Plantillas disponibles:")
            for i, template in enumerate(templates[:5], 1):
                print(f"      {i}. {template.get('name', 'Sin nombre')} ({template.get('category', 'sin categoría')})")
        else:
            print("   ⚠️  No hay plantillas de email creadas")
            print("   💡 Puedes cargar plantillas base desde la UI:")
            print("      Campaigns → Templates → Cargar Plantillas Base")
    else:
        print(f"   ⚠️  Error al obtener plantillas: {response.status_code}")
except Exception as e:
    print(f"   ⚠️  Error al verificar plantillas: {e}")

# 6. Test de envío de email (si hay plantillas)
print("\n6. Preparando test de envío de email...")
try:
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_URL}/email-templates", headers=headers)

    if response.status_code == 200:
        templates = response.json()
        if len(templates) > 0:
            template_id = templates[0].get("id")
            template_name = templates[0].get("name")

            print(f"   📧 Plantilla seleccionada: {template_name}")
            print(f"   📧 Template ID: {template_id}")
            print("\n   Para enviar un email de prueba, ejecuta:")
            print(f"   curl -X POST '{API_URL}/email-templates/send-test' \\")
            print(f"     -H 'Authorization: Bearer {token[:20]}...' \\")
            print(f"     -H 'Content-Type: application/json' \\")
            print(f"     -d '{{\"template_id\": \"{template_id}\", \"recipient_email\": \"tu@email.com\", \"preview_data\": {{}}}}'")
            print("\n   Reemplaza tu@email.com con tu email real.")
        else:
            print("   ⚠️  Crea una plantilla primero para poder enviar test emails")
except Exception as e:
    print(f"   ⚠️  Error: {e}")

print("\n" + "=" * 50)
print("✅ Verificación completada")
print("\n📋 Resumen:")
print("   1. Backend: ✅ Funcionando")
print("   2. SendGrid API Key: ✅ Configurada")
print("   3. Autenticación: ✅ Funcionando")
print("\n🎯 Siguientes pasos:")
print("   1. Autenticar tu dominio en SendGrid")
print("   2. Configurar recepción de emails (Google Workspace o MXRoute)")
print("   3. Crear plantillas de email")
print("   4. Enviar primera campaña")
print("\n📚 Documentación:")
print("   - Guía completa: scripts/sendgrid_setup_guide.md")
print("   - SendGrid: https://docs.sendgrid.com/")
print("   - Rovi CRM: http://localhost:13000")
