"""
Enhancements for Email Campaign System - Implementation Plan

PROBLEMAS IDENTIFICADOS:
========================

1. ERROR 422 en test email:
   - Backend espera: POST /email-templates/send-test con template_id como path parameter
   - Frontend envía: template_id en el body del JSON
   - Solución: Modificar backend para aceptar template_id en el body

2. Modelo CampaignCreate incompleto:
   - No tiene campos para email_template_id
   - No soporta selección de plantillas existentes
   - Solución: Agregar campos al modelo

3. Personalización limitada:
   - Solo reemplaza {nombre}
   - Las plantillas tienen variables como: {{nombre}}, {{propiedad}}, {{precio}}, etc.
   - Solución: Sistema de reemplazo de variables completo

4. Falta integración real con SendGrid:
   - El código existe pero no está probado
   - No hay manejo de webhooks para opens/clicks
   - Solución: Implementar y probar integración completa

SOLUCIONES PROPUESTAS:
====================="""

# 1. CORREGIR ENDPOINT DE TEST EMAIL
# ===================================

"""
CAMBIO EN backend/server.py (línea 3271):

ANTES:
@api_router.post("/email-templates/send-test")
async def send_test_email(
    template_id: str,  # ❌ Path parameter
    request_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):

DESPUÉS:
@api_router.post("/email-templates/send-test")
async def send_test_email(
    request_data: Dict[str, Any],  # ✅ Todo en el body
    current_user: dict = Depends(get_current_user)
):
    template_id = request_data.get("template_id")  # ✅ Extraer del body
    recipient = request_data.get("recipient_email") or current_user.get("email")
    preview_data = request_data.get("preview_data", {})
"""

# 2. ACTUALIZAR MODELOS PARA SOPORTAR EMAIL TEMPLATES
# ==================================================

"""
CAMBIOS EN backend/models.py:

AGREGAR AL MODELO CampaignCreate:

class CampaignCreate(BaseModel):
    name: str
    campaign_type: CampaignType
    message_template: Optional[str] = None  # For SMS
    email_subject: Optional[str] = None  # ✅ NUEVO: Asunto del email
    email_template_id: Optional[str] = None  # ✅ NUEVO: ID de plantilla
    lead_ids: List[str] = []
    lead_filter: Optional[Dict[str, Any]] = None
    scheduled_at: Optional[datetime] = None
"""

# 3. SISTEMA DE PERSONALIZACIÓN DE VARIABLES
# ===========================================

def personalize_email_content(template: dict, lead: dict) -> dict:
    """
    Personaliza el contenido del email reemplazando variables

    Args:
        template: Plantilla de email con html_content y variables
        lead: Datos del lead

    Returns:
        dict con subject y html_content personalizados
    """
    # Mapeo de variables del lead a variables de la plantilla
    var_mapping = {
        'nombre': lead.get('name', '').split()[0] if lead.get('name') else 'Estimado/a',
        'nombre_completo': lead.get('name', 'Cliente'),
        'email': lead.get('email', ''),
        'telefono': lead.get('phone', ''),
        'compania': lead.get('company', ''),
        'puesto': lead.get('position', ''),
        'ubicacion': lead.get('location_preference', ''),
        'propiedad': 'Propiedad destacada',  # Puede venir de campaña
        'precio': '$500,000 USD',  # Puede venir de campaña
        'broker_name': 'Tu Agente Inmobiliario',
        'company_name': 'Rovi Real Estate',
    }

    # Reemplazar en el subject
    subject = template.get('subject', '')
    for var_key, var_value in var_mapping.items():
        subject = subject.replace('{{' + var_key + '}}', str(var_value))
        subject = subject.replace('{' + var_key + '}', str(var_value))

    # Reemplazar en el contenido HTML
    html_content = template.get('html_content', '')
    for var_key, var_value in var_mapping.items():
        html_content = html_content.replace('{{' + var_key + '}}', str(var_value))
        html_content = html_content.replace('{' + var_key + '}', str(var_value))

    return {
        'subject': subject,
        'html_content': html_content
    }


# 4. MEJORAR EL PROCESAMIENTO DE CAMPAÑAS DE EMAIL
# =================================================

"""
CAMBIOS EN backend/server.py (línea 2307):

REEMPLAZAR el bloque de email con:

elif campaign["campaign_type"] == CampaignType.EMAIL.value:
    # Process Emails with SendGrid
    if not settings or not settings.get("sendgrid_enabled"):
        raise HTTPException(status_code=400, detail="SendGrid no está configurado")

    # Obtener plantilla si se especificó
    template = None
    if campaign.get("email_template_id"):
        template = await db.email_templates.find_one({
            "id": campaign["email_template_id"],
            "tenant_id": tenant_id
        }, {"_id": 0})

    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, TrackingSettings, ClickTracking, OpenTracking

        sg = SendGridAPIClient(settings["sendgrid_api_key"])

        for lead in leads:
            if not lead.get("email"):
                results["failed"] += 1
                results["errors"].append(f"{lead['name']}: Sin email")
                continue

            try:
                # Personalizar contenido
                if template:
                    # Usar plantilla con sistema de variables
                    personalized = personalize_email_content(template, lead)
                    subject = personalized['subject']
                    html_content = personalized['html_content']
                else:
                    # Usar plantilla básica de la campaña
                    subject = campaign.get("email_subject", "Mensaje de Rovi")
                    html_content = campaign.get("message_template", "")
                    # Reemplazo básico de {nombre}
                    subject = subject.replace("{nombre}", lead["name"])
                    html_content = html_content.replace("{nombre}", lead["name"])

                message = Mail(
                    from_email=(settings["sendgrid_sender_email"], settings.get("sendgrid_sender_name", "Rovi")),
                    to_emails=lead["email"],
                    subject=subject,
                    html_content=html_content
                )

                # Enable tracking
                tracking_settings = TrackingSettings()
                tracking_settings.click_tracking = ClickTracking(enable=True)
                tracking_settings.open_tracking = OpenTracking(enable=True)
                message.tracking_settings = tracking_settings

                response = sg.send(message)

                email_record = EmailRecord(
                    user_id=current_user["user_id"],
                    tenant_id=tenant_id,
                    lead_id=lead["id"],
                    lead_name=lead["name"],
                    email=lead["email"],
                    subject=subject,
                    html_content=html_content,
                    campaign_id=campaign_id,
                    sendgrid_id=response.headers.get("X-Message-Id", ""),
                    status=EmailStatus.SENT if response.status_code == 202 else EmailStatus.FAILED,
                    sent_at=datetime.now(timezone.utc)
                )
                await db.email_records.insert_one(email_record.model_dump())
                results["success"] += 1

            except Exception as e:
                results["failed"] += 1
                results["errors"].append(f"{lead['name']}: {str(e)}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error SendGrid: {str(e)}")
"""

# 5. AGREGAR WEBHOOK DE SENDGRID PARA TRACKING
# =============================================

"""
NUEVO ENDPOINT en backend/server.py:

@api_router.post("/webhooks/sendgrid")
async def sendgrid_webhook(request: Request):
    \"\"\"
    Webhook para eventos de SendGrid (opens, clicks, bounces, etc.)
    \"\"\"
    from fastapi import BackgroundTasks
    import json

    body = await request.body()

    # SendGrid events come as array of JSON objects
    events = json.loads(body.decode('utf-8'))

    for event in events:
        # Process event
        email_id = event.get('rovi_email_id')  # Custom argument sent with email
        event_type = event.get('event')  # open, click, bounce, etc.

        if not email_id:
            continue

        # Update email record status
        status_map = {
            'open': EmailStatus.OPENED,
            'click': EmailStatus.CLICKED,
            'bounce': EmailStatus.BOUNCED,
            'dropped': EmailStatus.FAILED,
            'spamreport': EmailStatus.FAILED,
        }

        new_status = status_map.get(event_type)
        if new_status:
            await db.email_records.update_one(
                {"id": email_id},
                {
                    "$set": {
                        "status": new_status.value,
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )

    return {"status": "ok"}
"""

# 6. FRONTEND - ACTUALIZAR MODAL DE CAMPAÑAS
# ==========================================

"""
CAMBIOS EN frontend/src/pages/CampaignsPage.js:

ACTUALIZAR el NewCampaignModal para incluir selección de plantillas:

1. Agregar estado para plantillas de email:
   const [emailTemplates, setEmailTemplates] = useState([])

2. Agregar select de plantillas cuando campaign_type === 'email':
   {form.campaign_type === 'email' && (
     <div className="space-y-2">
       <Label>Plantilla de Email</Label>
       <Select value={form.email_template_id} onValueChange={(v) => setForm({...form, email_template_id: v})}>
         <SelectTrigger>
           <SelectValue placeholder="Selecciona una plantilla" />
         </SelectTrigger>
         <SelectContent>
           {emailTemplates.map(template => (
             <SelectItem key={template.id} value={template.id}>
               {template.name} - {template.subject}
             </SelectItem>
           ))}
         </SelectContent>
       </Select>
     </div>
   )}
"""

# 7. CONFIGURACIÓN DE SENDGRID
# =============================

"""
VARIABLES DE ENTORNO requeridas en .env:

SENDGRID_API_KEY=SG.xxxxx  # API Key de SendGrid
SENDGRID_SENDER_EMAIL=noreply@rovirealestate.com  # Email verificado en SendGrid
SENDGRID_SENDER_NAME="Rovi Real Estate"  # Nombre del remitente

PASOS PARA CONFIGURAR SENDGRID:
1. Crear cuenta en https://sendgrid.com/
2. Verificar el dominio o email remitente
3. Crear API Key con permisos "Mail Send"
4. Configurar webhooks para eventos (opcional)
5. Agregar variables al .env
"""

# 8. TESTING PLAN
# ===============

"""
PLAN DE PRUEBAS E2E:

1. Test Email Endpoint:
   - [ ] Corregir endpoint para aceptar template_id en body
   - [ ] Probar envío de email de prueba
   - [ ] Verificar que llegue a la bandeja de entrada

2. Campaign Creation:
   - [ ] Crear campaña con plantilla existente
   - [ ] Crear campaña con contenido personalizado
   - [ ] Verificar que se guarden todos los campos

3. Email Sending:
   - [ ] Enviar campaña a 1 lead
   - [ ] Enviar campaña con filtros a múltiples leads
   - [ ] Verificar personalización de variables
   - [ ] Verificar tracking de opens/clicks

4. Webhook:
   - [ ] Configurar webhook de SendGrid
   - [ ] Probar eventos de open
   - [ ] Probar eventos de click
   - [ ] Verificar actualización de estatus en BD

5. Error Handling:
   - [ ] Probar con email inválido
   - [ ] Probar sin configuración de SendGrid
   - [ ] Probar con plantilla inexistente
"""

print(__doc__)