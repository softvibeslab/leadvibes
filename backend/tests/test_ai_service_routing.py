import asyncio

import ai_service


def test_get_ai_response_uses_ollama_as_primary(monkeypatch):
    calls = []

    async def fake_ollama(*, system_prompt, user_message, task_type="chat"):
        calls.append(("ollama", task_type, system_prompt, user_message))
        return "Respuesta local"

    async def fake_openai(*args, **kwargs):
        calls.append(("openai", kwargs.get("task_type")))
        return "Respuesta OpenAI"

    monkeypatch.setattr(ai_service, "_call_ollama_chat", fake_ollama)
    monkeypatch.setattr(ai_service, "_call_openai_chat", fake_openai)
    monkeypatch.setenv("AI_PROVIDER", "ollama")
    monkeypatch.setenv("AI_FALLBACK_PROVIDER", "openai")

    response = asyncio.run(ai_service.get_ai_response("¿Cómo vendo más?", "test-session"))

    assert response == "Respuesta local"
    assert [call[0] for call in calls] == ["ollama"]
    assert calls[0][1] == "chat"


def test_get_ai_response_falls_back_to_openai_when_ollama_fails(monkeypatch):
    calls = []

    async def fake_ollama(*, system_prompt, user_message, task_type="chat"):
        calls.append(("ollama", task_type))
        raise RuntimeError("ollama unavailable")

    async def fake_openai(*, system_prompt, user_message, session_id, task_type="chat"):
        calls.append(("openai", task_type, session_id))
        return "Respuesta premium"

    monkeypatch.setattr(ai_service, "_call_ollama_chat", fake_ollama)
    monkeypatch.setattr(ai_service, "_call_openai_chat", fake_openai)
    monkeypatch.setenv("AI_PROVIDER", "ollama")
    monkeypatch.setenv("AI_FALLBACK_PROVIDER", "openai")

    response = asyncio.run(ai_service.get_ai_response("¿Cómo va mi meta?", "session-123"))

    assert response == "Respuesta premium"
    assert calls == [("ollama", "chat"), ("openai", "chat", "session-123")]


def test_analyze_lead_retries_openai_when_local_json_is_invalid(monkeypatch):
    calls = []

    async def fake_ollama(*, system_prompt, user_message, task_type="chat"):
        calls.append(("ollama", task_type))
        return "no es json"

    async def fake_openai(*, system_prompt, user_message, session_id, task_type="chat"):
        calls.append(("openai", task_type, session_id))
        return '{"intent_score": 88, "sentiment": "positivo", "key_points": ["Buen presupuesto"], "next_action": "Agendar visita", "opening_script": "Hola"}'

    monkeypatch.setattr(ai_service, "_call_ollama_chat", fake_ollama)
    monkeypatch.setattr(ai_service, "_call_openai_chat", fake_openai)
    monkeypatch.setenv("AI_PROVIDER", "ollama")
    monkeypatch.setenv("AI_FALLBACK_PROVIDER", "openai")

    result = asyncio.run(ai_service.analyze_lead({"id": "lead-1", "name": "Ana", "budget_mxn": 3000000}))

    assert result["intent_score"] == 88
    assert result["sentiment"] == "positivo"
    assert calls == [("ollama", "lead_analysis"), ("openai", "lead_analysis", "lead-analysis-lead-1")]


def test_get_ai_response_injects_lead_summary_context_and_short_answer_rules(monkeypatch):
    calls = []

    async def fake_ollama(*, system_prompt, user_message, task_type="chat"):
        calls.append((system_prompt, user_message))
        return "Tienes 20 leads. ¿Quieres ver los calientes?"

    monkeypatch.setattr(ai_service, "_call_ollama_chat", fake_ollama)
    monkeypatch.setenv("AI_PROVIDER", "ollama")
    monkeypatch.setenv("AI_FALLBACK_PROVIDER", "")

    response = asyncio.run(ai_service.get_ai_response(
        "¿Qué leads tengo?",
        "test-session",
        context={
            "lead_summary": {
                "total": 20,
                "hot": 6,
                "warm": 9,
                "cold": 5,
                "by_status": {"nuevo": 8, "contactado": 7},
                "top_interests": {"Lotes en Tulum Centro": 12},
            }
        },
    ))

    assert response == "Tienes 20 leads. ¿Quieres ver los calientes?"
    system_prompt, user_message = calls[0]
    assert "máximo 3 bullets" in system_prompt
    assert "una pregunta de seguimiento" in system_prompt
    assert "Resumen de leads" in user_message
    assert "Total: 20" in user_message
    assert "Lotes en Tulum Centro: 12" in user_message



def test_get_ai_response_uses_role_prompt_and_recent_conversation(monkeypatch):
    calls = []

    async def fake_ollama(*, system_prompt, user_message, task_type="chat"):
        calls.append((system_prompt, user_message))
        return "Mensaje listo para WhatsApp."

    monkeypatch.setattr(ai_service, "_call_ollama_chat", fake_ollama)
    monkeypatch.setenv("AI_PROVIDER", "ollama")
    monkeypatch.setenv("AI_FALLBACK_PROVIDER", "")

    response = asyncio.run(ai_service.get_ai_response(
        "si",
        "test-session",
        context={
            "conversation_history": [
                {"role": "assistant", "content": "¿Quieres que prepare el mensaje de WhatsApp para este lead?"},
                {"role": "user", "content": "si"},
            ],
            "last_intent": "lead_whatsapp_followup",
        },
        user_role="manager",
    ))

    assert response == "Mensaje listo para WhatsApp."
    system_prompt, user_message = calls[0]
    assert "ROL ACTUAL DEL USUARIO: manager" in system_prompt
    assert "supervisar equipo" in system_prompt
    assert "lead_whatsapp_followup" in user_message
    assert "Conversación reciente" in user_message
    assert "¿Quieres que prepare el mensaje de WhatsApp" in user_message
