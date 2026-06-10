from agent_media_pipeline import (
    build_agent_interpretation_job_doc,
    classify_agent_input_intent,
    detect_agent_input_source,
    extract_public_urls,
)


def test_extract_public_urls_detects_drive_link():
    text = "Te paso la carpeta https://drive.google.com/drive/folders/abc123 para la propiedad"
    assert extract_public_urls(text) == ["https://drive.google.com/drive/folders/abc123"]


def test_drive_link_maps_to_property_import_job():
    source = detect_agent_input_source(text="https://drive.google.com/drive/folders/abc123")
    assert source["source_type"] == "google_drive"

    job = build_agent_interpretation_job_doc(
        tenant_id="tenant-1",
        user_id="user-1",
        role_scope="agency_admin",
        source_channel="telegram",
        text="https://drive.google.com/drive/folders/abc123",
    )
    assert job["entity_type"] == "property"
    assert job["crm_target"] == "properties"
    assert job["mapping_status"] == "queued"


def test_shared_contact_maps_to_lead():
    source = detect_agent_input_source(
        attachment={
            "filename": "cliente.vcf",
            "mime_type": "text/vcard",
            "kind": "document",
        }
    )
    assert source["source_type"] == "shared_contact"

    intent = classify_agent_input_intent(source_type=source["source_type"], filename="cliente.vcf")
    assert intent["entity_type"] == "lead"
    assert intent["crm_target"] == "leads"


def test_audio_maps_to_pending_interpretation_job():
    job = build_agent_interpretation_job_doc(
        tenant_id="tenant-1",
        user_id="user-1",
        role_scope="broker",
        source_channel="telegram",
        text="Nota de voz: recuérdame llamar al lead mañana",
        attachment={
            "filename": "nota.ogg",
            "mime_type": "audio/ogg",
            "kind": "voice",
        },
    )
    assert job["source_type"] == "audio"
    assert job["entity_type"] == "task"
    assert job["extraction_status"] == "queued"


def test_image_caption_with_phone_maps_to_lead():
    job = build_agent_interpretation_job_doc(
        tenant_id="tenant-1",
        user_id="user-1",
        role_scope="broker",
        source_channel="telegram",
        text="Juan Perez busca lote en Tulum, WhatsApp +52 984 123 4567",
        attachment={
            "filename": "screenshot.png",
            "mime_type": "image/png",
            "kind": "photo",
        },
    )
    assert job["source_type"] == "image"
    assert job["entity_type"] == "lead"
    assert job["crm_target"] == "leads"


def test_youtube_link_maps_to_campaign_draft():
    job = build_agent_interpretation_job_doc(
        tenant_id="tenant-1",
        user_id="user-1",
        role_scope="growth_partner",
        source_channel="telegram",
        text="Analiza este video https://youtu.be/demo123 para sacar ideas de campaña",
    )
    assert job["source_type"] == "youtube"
    assert job["entity_type"] == "campaign"
    assert job["crm_target"] == "campaigns"
