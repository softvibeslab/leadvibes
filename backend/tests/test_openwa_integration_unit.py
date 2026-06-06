from openwa_integration import (
    classify_whatsapp_text,
    normalize_chat_id,
    normalize_openwa_base_url,
)


def test_normalize_openwa_base_url_defaults_and_strips_slash():
    assert normalize_openwa_base_url(None) == "http://127.0.0.1:2785/api"
    assert (
        normalize_openwa_base_url("http://localhost:2785/api/")
        == "http://localhost:2785/api"
    )


def test_normalize_chat_id_accepts_existing_whatsapp_ids():
    assert normalize_chat_id("5219841855257@c.us") == "5219841855257@c.us"
    assert normalize_chat_id("120363000000000@g.us") == "120363000000000@g.us"


def test_normalize_chat_id_converts_phone_numbers():
    assert normalize_chat_id("+52 984 185 5257") == "529841855257@c.us"


def test_classify_whatsapp_text_detects_lead_intent():
    result = classify_whatsapp_text(
        "Hola, me interesa una visita. Tengo presupuesto de 4M."
    )
    assert result["category"] == "lead"
    assert result["recommended_agent"] == "ai_lead_qualifier"
    assert result["crm_action"] == "create_or_update_lead"


def test_classify_whatsapp_text_detects_property_post():
    result = classify_whatsapp_text(
        "Departamento 2 recamaras, 90 m2, amenidades, precio $250k USD"
    )
    assert result["category"] == "property"
    assert result["recommended_agent"] == "property_matcher"


def test_classify_whatsapp_text_protects_personal_messages():
    result = classify_whatsapp_text("Mama, nos vemos en la cena familiar")
    assert result["category"] == "family_personal"
    assert result["requires_human_approval"] is True
    assert result["crm_action"] == "ignore_by_default"
