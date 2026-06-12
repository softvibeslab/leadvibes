"""Tests unitarios de la unificación Agent Studio ↔ runtime Hermes.

Verifican que resolve_agent_runtime_config aplica las capas
(agent_configs → perfil de Agent Studio → agent_user_settings) y que
find_relevant_knowledge mezcla las dos colecciones de conocimiento.
Sin Mongo: colecciones fake en memoria.
"""

import asyncio

from agent_control import find_relevant_knowledge, resolve_agent_runtime_config

# ---------------------------------------------------------------------------
# Fakes
# ---------------------------------------------------------------------------


def matches(doc, query):
    for key, value in query.items():
        if key == "$or":
            if not any(matches(doc, sub) for sub in value):
                return False
        elif isinstance(value, dict) and "$in" in value:
            if doc.get(key) not in value["$in"]:
                return False
        elif doc.get(key) != value:
            return False
    return True


class FakeCursor:
    def __init__(self, docs):
        self.docs = docs

    def sort(self, *args, **kwargs):
        return self

    def limit(self, *args):
        return self

    async def to_list(self, length):
        return [dict(d) for d in self.docs[:length]]


class FakeCollection:
    def __init__(self, docs=None):
        self.docs = [dict(d) for d in (docs or [])]

    async def find_one(self, query, projection=None):
        for doc in self.docs:
            if matches(doc, query):
                return dict(doc)
        return None

    def find(self, query, projection=None):
        return FakeCursor([d for d in self.docs if matches(d, query)])

    async def update_one(self, query, update, upsert=False):
        return None


class FakeDB:
    def __init__(self, **collections):
        self.agent_configs = FakeCollection(collections.get("agent_configs"))
        self.agent_studio_profiles = FakeCollection(
            collections.get("agent_studio_profiles")
        )
        self.agent_user_settings = FakeCollection(
            collections.get("agent_user_settings")
        )
        self.agent_knowledge_chunks = FakeCollection(
            collections.get("agent_knowledge_chunks")
        )
        self.agent_studio_knowledge_chunks = FakeCollection(
            collections.get("agent_studio_knowledge_chunks")
        )


BASE_CONFIG = {
    "id": "agent-config-broker",
    "role_scope": "broker",
    "is_active": True,
    "system_prompt": "PROMPT BASE",
    "provider": "chat.z",
    "model": "glm-5",
    "temperature": 0.25,
    "tools": {"lead_metrics": True, "list_leads": True},
}

USER = {"user_id": "user-1", "tenant_id": "tenant-1", "active_tenant_id": "tenant-1"}


def run(coro):
    return asyncio.run(coro)


# ---------------------------------------------------------------------------
# resolve_agent_runtime_config
# ---------------------------------------------------------------------------


def test_sin_perfil_studio_usa_config_base():
    db = FakeDB(agent_configs=[BASE_CONFIG])
    config = run(resolve_agent_runtime_config(db, "broker", USER))
    assert config["system_prompt"] == "PROMPT BASE"
    assert config["provider"] == "chat.z"
    assert "agent_studio_profile_id" not in config


def test_perfil_studio_pisa_prompt_pero_no_proveedor_placeholder():
    profile = {
        "id": "profile-1",
        "tenant_id": "tenant-1",
        "role_scope": "broker",
        "is_active": True,
        "system_prompt": "PROMPT DEL STUDIO",
        "tone_instructions": "Tono cálido",
        "enabled_skills": ["lead_triage", "whatsapp_followup"],
        "temperature": 0.6,
        "tools": {"leads": True, "tasks": True},
        "provider": "rovi_crm",  # placeholder: no debe pisar la plomería
        "model": "glm-5",
    }
    db = FakeDB(agent_configs=[BASE_CONFIG], agent_studio_profiles=[profile])
    config = run(resolve_agent_runtime_config(db, "broker", USER))
    assert config["system_prompt"] == "PROMPT DEL STUDIO"
    assert config["tone_instructions"] == "Tono cálido"
    assert config["enabled_skills"] == ["lead_triage", "whatsapp_followup"]
    assert config["temperature"] == 0.6
    # merge aditivo: conserva tools de contexto y agrega los del perfil
    assert config["tools"]["lead_metrics"] is True
    assert config["tools"]["leads"] is True
    # provider placeholder no pisa
    assert config["provider"] == "chat.z"
    assert config["agent_studio_profile_id"] == "profile-1"


def test_perfil_studio_con_proveedor_real_si_pisa():
    profile = {
        "id": "profile-2",
        "tenant_id": "tenant-1",
        "role_scope": "broker",
        "is_active": True,
        "system_prompt": "X",
        "provider": "ollama",
        "model": "llama3.1",
    }
    db = FakeDB(agent_configs=[BASE_CONFIG], agent_studio_profiles=[profile])
    config = run(resolve_agent_runtime_config(db, "broker", USER))
    assert config["provider"] == "ollama"
    assert config["model"] == "llama3.1"


def test_settings_de_usuario_pisan_skills_y_seleccionan_perfil():
    profile_role = {
        "id": "profile-role",
        "tenant_id": "tenant-1",
        "role_scope": "broker",
        "is_active": True,
        "system_prompt": "PERFIL ROL",
    }
    profile_custom = {
        "id": "profile-custom",
        "tenant_id": "tenant-1",
        "role_scope": "broker",
        "is_active": True,
        "system_prompt": "PERFIL PERSONALIZADO",
        "enabled_skills": ["property_matcher"],
    }
    settings = {
        "tenant_id": "tenant-1",
        "user_id": "user-1",
        "role_scope": "broker",
        "profile_id": "profile-custom",
        "enabled_skills": ["meeting_prep"],
        "tools": {"media": True},
        "is_active": True,
    }
    db = FakeDB(
        agent_configs=[BASE_CONFIG],
        agent_studio_profiles=[profile_role, profile_custom],
        agent_user_settings=[settings],
    )
    config = run(resolve_agent_runtime_config(db, "broker", USER))
    assert config["system_prompt"] == "PERFIL PERSONALIZADO"
    assert config["agent_studio_profile_id"] == "profile-custom"
    # settings del usuario pisan los skills del perfil
    assert config["enabled_skills"] == ["meeting_prep"]
    assert config["tools"]["media"] is True
    assert config["tools"]["lead_metrics"] is True


# ---------------------------------------------------------------------------
# find_relevant_knowledge
# ---------------------------------------------------------------------------


def test_conocimiento_mezcla_control_tower_y_agent_studio():
    tower_chunk = {
        "id": "kb-1",
        "role_scope": "broker",
        "status": "indexed",
        "title": "Guía de objeciones",
        "content": "Manejo de objeciones de precio en Tulum para brokers",
        "file_id": "file-tower",
        "chunk_index": 0,
    }
    studio_chunk = {
        "id": "kb-2",
        "tenant_id": "tenant-1",
        "profile_id": "profile-1",
        "role_scope": "broker",
        "filename": "playbook-ventas.pdf",
        "content": "Playbook de objeciones y cierre de ventas para brokers de Tulum",
        "file_id": "file-studio",
        "chunk_index": 3,
    }
    irrelevante = {
        "id": "kb-3",
        "tenant_id": "tenant-1",
        "profile_id": "profile-1",
        "filename": "otro.pdf",
        "content": "contenido sin relación alguna",
    }
    db = FakeDB(
        agent_knowledge_chunks=[tower_chunk],
        agent_studio_knowledge_chunks=[studio_chunk, irrelevante],
    )
    chunks = run(
        find_relevant_knowledge(
            db,
            "broker",
            "cómo manejo objeciones de precio con un lead en Tulum",
            tenant_id="tenant-1",
            studio_profile_id="profile-1",
        )
    )
    ids = [chunk["id"] for chunk in chunks]
    assert "kb-1" in ids
    assert "kb-2" in ids
    assert "kb-3" not in ids
    studio = next(chunk for chunk in chunks if chunk["id"] == "kb-2")
    # title normalizado desde filename para citas en knowledge_sources
    assert studio["title"] == "playbook-ventas.pdf"


def test_conocimiento_studio_no_se_filtra_entre_tenants():
    ajeno = {
        "id": "kb-x",
        "tenant_id": "tenant-OTRO",
        "profile_id": "profile-1",
        "role_scope": "broker",
        "filename": "secreto.pdf",
        "content": "objeciones de precio broker Tulum",
    }
    db = FakeDB(agent_studio_knowledge_chunks=[ajeno])
    chunks = run(
        find_relevant_knowledge(
            db,
            "broker",
            "objeciones de precio broker Tulum",
            tenant_id="tenant-1",
            studio_profile_id="profile-1",
        )
    )
    assert chunks == []
