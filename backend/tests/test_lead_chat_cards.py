import asyncio

import server


class FakeCursor:
    def __init__(self, rows):
        self.rows = rows

    def sort(self, *_args, **_kwargs):
        self.rows = sorted(self.rows, key=lambda row: row.get("budget_mxn", 0), reverse=True)
        return self

    def limit(self, limit):
        self.rows = self.rows[:limit]
        return self

    async def to_list(self, limit):
        return self.rows[:limit]


class FakeLeadsCollection:
    def __init__(self, rows):
        self.rows = rows
        self.last_query = None

    def find(self, query, _projection=None):
        self.last_query = query
        rows = [row for row in self.rows if row.get("tenant_id") == query.get("tenant_id")]
        if "priority" in query:
            priority = query["priority"]
            if isinstance(priority, dict) and "$in" in priority:
                rows = [row for row in rows if row.get("priority") in priority["$in"]]
            else:
                rows = [row for row in rows if row.get("priority") == priority]
        if "status" in query:
            rows = [row for row in rows if row.get("status") == query["status"]]
        if "name" in query:
            regex = query["name"].get("$regex")
            options = query["name"].get("$options", "")
            if options == "i":
                rows = [row for row in rows if regex.lower() in row.get("name", "").lower()]
            else:
                rows = [row for row in rows if regex in row.get("name", "")]
        return FakeCursor(rows)


class FakeDB:
    def __init__(self, rows):
        self.leads = FakeLeadsCollection(rows)


def test_lead_detail_response_includes_clickable_cards_for_each_lead(monkeypatch):
    rows = [
        {
            "tenant_id": "tenant-1",
            "name": "David Müller",
            "phone": "+5211111111111",
            "email": "david@example.com",
            "status": "nuevo",
            "priority": "baja",
            "budget_mxn": 6000000,
            "property_interest": "Lote premium zona norte",
            "next_action": "Llamar hoy",
        },
        {
            "tenant_id": "tenant-1",
            "name": "Martín Aguilar",
            "status": "apartado",
            "priority": "urgente",
            "budget_mxn": 5500000,
            "property_interest": "Lote premium zona norte",
        },
    ]
    monkeypatch.setattr(server, "db", FakeDB(rows))

    result = asyncio.run(server.build_lead_detail_for_chat("tenant-1", "Detalle de todos los leads", {"by_status": {}}))

    assert result["lead_items"][0]["name"] == "David Müller"
    assert result["cards"][0] == {
        "type": "lead",
        "label": "David Müller",
        "value": "$6,000,000 MXN",
        "subtitle": "Lote premium zona norte",
        "meta": "nuevo/baja",
        "tone": "blue",
        "query": "Detalle del lead David Müller",
    }
    assert result["cards"][1]["query"] == "Detalle del lead Martín Aguilar"


def test_single_lead_detail_query_returns_contact_and_next_action(monkeypatch):
    rows = [
        {
            "id": "lead-david",
            "tenant_id": "tenant-1",
            "name": "David Müller",
            "phone": "+521****1111",
            "email": "david@example.com",
            "status": "nuevo",
            "priority": "baja",
            "budget_mxn": 6000000,
            "property_interest": "Lote premium zona norte",
            "next_action": "Llamar hoy",
        }
    ]
    fake_db = FakeDB(rows)
    monkeypatch.setattr(server, "db", fake_db)

    result = asyncio.run(server.build_lead_detail_for_chat("tenant-1", "Detalle del lead David Müller", {"by_status": {}}))

    assert fake_db.leads.last_query["name"] == {"$regex": "David Müller", "$options": "i"}
    assert "**David Müller**" in result["content"]
    assert "david@example.com" in result["content"]
    assert "Llamar hoy" in result["content"]
    assert result["cards"][0]["label"] == "Stage pipeline"
    assert result["cards"][0]["value"] == "nuevo"
    assert result["cards"][1]["label"] == "Paso siguiente"
    assert result["cards"][1]["value"] == "Llamar hoy"
    assert result["cards"][2]["label"] == "Embudo opcional"
    assert result["cards"][2]["query"] == "Dame ideas de embudo para David Müller usando Lote premium zona norte y llevarlo a reunión"


def test_category_detail_query_still_filters_by_priority(monkeypatch):
    rows = [
        {
            "tenant_id": "tenant-1",
            "name": "Martín Aguilar",
            "status": "apartado",
            "priority": "urgente",
            "budget_mxn": 5500000,
            "property_interest": "Lote premium zona norte",
        }
    ]
    fake_db = FakeDB(rows)
    monkeypatch.setattr(server, "db", fake_db)

    result = asyncio.run(server.build_lead_detail_for_chat("tenant-1", "Detalle de leads calientes", {"by_status": {}}))

    assert fake_db.leads.last_query["priority"] == {"$in": ["alta", "urgente"]}
    assert result["cards"][0]["label"] == "Martín Aguilar"



def test_affirmative_after_single_lead_detail_generates_whatsapp_message():
    lead = {
        "name": "Martín Aguilar",
        "phone": "+52 55 2222 3333",
        "email": "maguilar@yahoo.com",
        "status": "apartado",
        "priority": "urgente",
        "budget_mxn": 5500000,
        "property_interest": "Lote premium zona norte",
        "next_action": "Agendar visita",
    }

    assert server._is_affirmative_followup("si") is True
    response = server.build_lead_whatsapp_followup(lead, broker_name="Carlos")

    assert "WhatsApp para Martín Aguilar" in response["content"]
    assert "Martín" in response["content"]
    assert "Lote premium zona norte" in response["content"]
    assert "$5,500,000 MXN" in response["content"]
    assert "Agendar visita" in response["content"]
    assert response["lead_items"] == [lead]
    assert response["cards"] == []
    assert response["actions"][:2] == [
        {
            "type": "whatsapp_link",
            "label": "Enviar",
            "url": "https://wa.me/525522223333?text=Hola%20Mart%C3%ADn%2C%20soy%20Carlos%20de%20Rovi.%20Vi%20que%20est%C3%A1s%20interesado%20en%20Lote%20premium%20zona%20norte%20con%20presupuesto%20aproximado%20de%20%245%2C500%2C000%20MXN.%20Tengo%20una%20opci%C3%B3n%20que%20puede%20encajar%20muy%20bien%20contigo.%20%C2%BFTe%20parece%20si%20coordinamos%20agendar%20visita%20para%20revisar%20disponibilidad%20y%20resolver%20dudas%3F%20Siguiente%20paso%20sugerido%3A%20Agendar%20visita.",
            "message": "Hola Martín, soy Carlos de Rovi. Vi que estás interesado en Lote premium zona norte con presupuesto aproximado de $5,500,000 MXN. Tengo una opción que puede encajar muy bien contigo. ¿Te parece si coordinamos agendar visita para revisar disponibilidad y resolver dudas? Siguiente paso sugerido: Agendar visita.",
        },
        {"type": "chat_prompt", "label": "Modificar", "query": "Ajusta el WhatsApp para Martín Aguilar"},
    ]


def test_pipeline_guidance_for_single_lead_adds_meeting_and_asset_actions(monkeypatch):
    rows = [
        {
            "id": "lead-david",
            "tenant_id": "tenant-1",
            "name": "David Müller",
            "phone": "+52 55 1111 2222",
            "email": "david@example.com",
            "status": "nuevo",
            "priority": "alta",
            "budget_mxn": 6000000,
            "property_interest": "Lote premium zona norte",
            "next_action": "Llamar hoy",
        }
    ]
    fake_db = FakeDB(rows)
    monkeypatch.setattr(server, "db", fake_db)

    result = asyncio.run(server.build_lead_detail_for_chat(
        "tenant-1",
        "Detalle del lead David Müller",
        {"by_status": {}},
        active_modules={"google_calendar": True, "sendgrid": True, "twilio": True, "vapi": True, "whatsapp": True},
    ))

    assert "Siguiente estado sugerido: contactado" in result["content"]
    assert "Objetivo sugerido:" in result["content"]
    labels = [action["label"] for action in result["actions"]]
    assert labels == ["WhatsApp", "Email", "Activo digital"]
    assert all(action["type"] == "chat_prompt" for action in result["actions"])
    assert "Crear activo + campaña" not in labels
    assert "Agendar reunión" not in labels
    assert result["actions"][1]["query"] == "Prepara un email para David Müller para avanzar de nuevo a contactado y agendar reunión"
    assert result["actions"][2]["query"] == "Genera un activo digital para David Müller sobre Lote premium zona norte"


def test_inactive_channel_modules_are_not_suggested():
    lead = {
        "name": "Michael Brown",
        "phone": "+52 55 4444 5555",
        "email": "michael@example.com",
        "status": "calificacion",
        "budget_mxn": 5000000,
        "property_interest": "Terreno frente a cenote",
    }

    actions = server.build_pipeline_action_tags(lead, active_modules={"google_calendar": False, "sendgrid": False, "twilio": False, "vapi": False, "whatsapp": True})

    labels = [action["label"] for action in actions]
    assert labels == ["WhatsApp", "Activo digital", "Ver embudo"]
    assert all(action["label"] not in {"Agendar reunión", "Email", "SMS", "Llamada IA"} for action in actions)


def test_quick_pipeline_action_response_avoids_slow_ai_for_asset_prompt():
    lead = {
        "id": "lead-david",
        "name": "David Müller",
        "phone": "+52 55 1111 2222",
        "email": "david@example.com",
        "status": "calificacion",
        "budget_mxn": 6000000,
        "property_interest": "Lote premium zona norte",
    }

    prompt = "Genera un activo digital para David Müller sobre Lote premium zona norte"
    assert server._extract_action_lead_name(prompt) == "David Müller"

    result = server.build_quick_pipeline_response(
        lead,
        prompt,
        active_modules={"google_calendar": True, "sendgrid": True, "twilio": True, "vapi": True, "whatsapp": True},
    )

    assert "**Activo digital para David Müller**" in result["content"]
    assert "Lote premium zona norte" in result["content"]
    assert result["lead_items"] == [lead]
    labels = [action["label"] for action in result["actions"]]
    assert "Agendar reunión" in labels
    assert "Email" in labels
    assert "SMS" in labels
    assert "Llamada IA" in labels


def test_quick_pipeline_action_response_generates_funnel_without_llm():
    lead = {
        "name": "Michael Brown",
        "status": "nuevo",
        "budget_mxn": 5000000,
        "property_interest": "Terreno frente a cenote",
    }

    result = server.build_quick_pipeline_response(
        lead,
        "Dame ideas de embudo para Michael Brown usando Terreno frente a cenote y llevarlo a reunión",
        active_modules={"google_calendar": True, "sendgrid": False, "twilio": False, "vapi": False, "whatsapp": False},
    )

    assert "**Idea de embudo para Michael Brown**" in result["content"]
    assert "nuevo" in result["content"]
    assert "contactado" in result["content"]
    assert [action["label"] for action in result["actions"]] == ["Agendar reunión", "Activo digital", "Idea de embudo"]


def test_step_detail_action_response_avoids_slow_ai_timeout():
    lead = {
        "id": "lead-isabella",
        "name": "Isabella Torres",
        "phone": "+52 984 555 1122",
        "email": "isabella@example.com",
        "status": "presentacion",
        "budget_mxn": 4000000,
        "property_interest": "Lote con vista al mar",
    }
    prompt = "Detalle del paso 2 para Isabella Torres: Enviar activo digital"

    assert server._extract_action_lead_name(prompt) == "Isabella Torres"
    result = server.build_quick_pipeline_response(lead, prompt, active_modules={"google_calendar": True, "sendgrid": True, "twilio": False, "vapi": False, "whatsapp": True})

    assert "**Detalle del paso 2: Enviar activo digital**" in result["content"]
    assert "Lote con vista al mar" in result["content"]
    assert "Crear activo + campaña" in result["content"]
    assert result["lead_items"] == [lead]
    assert "Crear activo + campaña" in [action["label"] for action in result["actions"]]


class FakeInsertCollection:
    def __init__(self, rows=None):
        self.rows = rows or []
        self.inserted = []
        self.updated = []

    async def find_one(self, query, _projection=None):
        for row in self.rows:
            if row.get("tenant_id") != query.get("tenant_id"):
                continue
            if "id" in query and row.get("id") != query["id"]:
                continue
            return row
        return None

    async def insert_one(self, doc):
        self.inserted.append(doc)
        self.rows.append(doc)
        return type("InsertResult", (), {"inserted_id": doc.get("id")})()

    async def update_one(self, query, update):
        self.updated.append((query, update))
        return type("UpdateResult", (), {"modified_count": 1})()


class FakeFlowDB:
    def __init__(self, lead):
        self.leads = FakeInsertCollection([lead])
        self.email_templates = FakeInsertCollection([])
        self.campaigns = FakeInsertCollection([])
        self.automation_workflows = FakeInsertCollection([])
        self.activities = FakeInsertCollection([])


def test_quick_pipeline_response_offers_campaign_and_dynamic_pipeline_actions():
    lead = {
        "id": "lead-isabella",
        "name": "Isabella Torres",
        "phone": "+52 81 3333 4444",
        "email": "isa.torres@yahoo.com",
        "status": "presentacion",
        "priority": "alta",
        "budget_mxn": 4000000,
        "property_interest": "Lote con vista al mar",
    }

    result = server.build_quick_pipeline_response(
        lead,
        "Dame ideas de embudo para Isabella Torres usando Lote con vista al mar y llevarlo a reunión",
        active_modules={"google_calendar": True, "sendgrid": True, "twilio": True, "vapi": True, "whatsapp": True},
    )

    labels = [action["label"] for action in result["actions"]]
    assert "Crear activo + campaña" in labels
    assert "Crear pipeline temporal" in labels
    flow_action = next(action for action in result["actions"] if action["label"] == "Crear pipeline temporal")
    assert flow_action["type"] == "api_post"
    assert flow_action["endpoint"] == "/ai/actions/create-flow"
    assert flow_action["payload"]["flow_type"] == "dynamic_pipeline"
    assert flow_action["payload"]["lead_id"] == "lead-isabella"


def test_create_agent_recommended_flow_builds_asset_campaign_and_pipeline(monkeypatch):
    lead = {
        "id": "lead-isabella",
        "tenant_id": "tenant-1",
        "name": "Isabella Torres",
        "phone": "+52 81 3333 4444",
        "email": "isa.torres@yahoo.com",
        "status": "presentacion",
        "priority": "alta",
        "budget_mxn": 4000000,
        "property_interest": "Lote con vista al mar",
    }
    fake_db = FakeFlowDB(lead)
    monkeypatch.setattr(server, "db", fake_db)

    result = asyncio.run(server.create_agent_recommended_flow(
        {
            "lead_id": "lead-isabella",
            "flow_type": "asset_campaign_pipeline",
            "asset_title": "Ficha PDF/landing corta",
            "campaign_channel": "email",
        },
        {"user_id": "user-1", "tenant_id": "tenant-1", "name": "Broker Demo"},
    ))

    assert result["success"] is True
    assert result["lead_id"] == "lead-isabella"
    assert result["email_template_id"]
    assert result["campaign_id"]
    assert result["workflow_id"]
    assert len(result["cards"]) == 8
    assert [card["label"] for card in result["cards"][:3]] == ["Activo digital", "Campaña", "Pipeline temporal"]
    assert result["cards"][3]["type"] == "flow_step"
    assert result["cards"][3]["value"] == "WhatsApp de apertura"
    template = fake_db.email_templates.inserted[0]
    assert template["category"] == "property_promo"
    assert "Lote con vista al mar" in template["html_content"]
    assert "presentacion" in template["html_content"]
    assert "apartado" in template["html_content"]
    assert "Agenda una revisión de disponibilidad" in template["html_content"]
    assert len(template["json_content"]["blocks"]) >= 7
    assert template["json_content"]["blocks"][0]["type"] == "text"
    property_card = next(block for block in template["json_content"]["blocks"] if block["type"] == "propertyCard")
    assert property_card["propertyImage"].startswith("https://images.unsplash.com/")
    assert template["thumbnail_url"] == property_card["propertyImage"]
    assert property_card["propertyImage"].replace("&", "&amp;") in template["html_content"]
    assert any("Pedir señal/apartado" in block.get("content", "") for block in template["json_content"]["blocks"])
    assert fake_db.campaigns.inserted[0]["campaign_type"] == "email"
    assert fake_db.campaigns.inserted[0]["lead_ids"] == ["lead-isabella"]
    workflow = fake_db.automation_workflows.inserted[0]
    assert workflow["category"] == "sales"
    assert workflow["is_active"] is True
    assert workflow["config_values"]["next_status"] == "apartado"
    assert workflow["config_values"]["steps"] == [
        "WhatsApp de apertura",
        "Enviar activo digital",
        "Agendar reunión de 15 min",
        "Enviar propuesta",
        "Pedir señal/apartado",
    ]
