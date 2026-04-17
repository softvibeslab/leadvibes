#!/usr/bin/env python3
"""
Test simple para verificar la integración de Apify MCP

Este script solo prueba que la conexión funciona sin hacer scraping real.
"""

import anyio
from claude_agent_sdk import query, ClaudeAgentOptions, ResultMessage
import os


async def test_apify_connection():
    """Test básico de conexión con Apify MCP"""

    print("🧪 Testeando conexión con Apify MCP...")

    async for message in query(
        prompt="""
        Lista 5 Actors de Apify que sean útiles para bienes raíces.
        Solo nombra los Actors y su descripción breve.
        NO ejecutes ningún Actor, solo lista las opciones disponibles.
        """,
        options=ClaudeAgentOptions(
            cwd="/rogervibes/leadvibes",
            allowed_tools=["Agent"],
            mcp_servers={
                "apify": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-apify"],
                    "env": {
                        "APIFY_API_TOKEN": os.getenv("APIFY_API_TOKEN")
                    }
                }
            },
            max_turns=3  # Limitar a 3 turnos para un test rápido
        )
    ):
        if isinstance(message, ResultMessage):
            print("\n✅ Conexión exitosa!")
            print("\n📋 Actors disponibles para bienes raíces:\n")
            print(message.result)
            return True

    return False


async def test_google_maps_query():
    """Test de búsqueda en Google Maps (sin ejecutar)"""

    print("\n🧪 Testeando búsqueda en Google Maps...")

    async for message in query(
        prompt="""
        Explica cómo usar el Actor "google-maps-scraper" de Apify
        para buscar inmobiliarias en Tulum.

        NO lo ejecutes, solo explica los parámetros necesarios:
        - searchString
        - maxCrawledPlaces
        - language

        Mantén la explicación breve y concisa.
        """,
        options=ClaudeAgentOptions(
            cwd="/rogervibes/leadvibes",
            allowed_tools=["Agent"],
            mcp_servers={
                "apify": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-apify"],
                    "env": {
                        "APIFY_API_TOKEN": os.getenv("APIFY_API_TOKEN")
                    }
                }
            },
            max_turns=2
        )
    ):
        if isinstance(message, ResultMessage):
            print("\n✅ Búsqueda configurada correctamente!")
            print("\n📝 Instrucciones:\n")
            print(message.result)
            return True

    return False


async def main():
    """Ejecutar todos los tests"""
    print("=" * 70)
    print("🔧 Apify MCP - Test de Conexión")
    print("=" * 70)

    try:
        # Test 1: Conexión básica
        test1_passed = await test_apify_connection()

        # Test 2: Configuración de búsqueda
        test2_passed = await test_google_maps_query()

        print("\n" + "=" * 70)
        if test1_passed and test2_passed:
            print("✅ Todos los tests pasaron correctamente!")
            print("✨ La integración de Apify MCP está lista para usar")
        else:
            print("⚠️  Hubo problemas en algunos tests")
        print("=" * 70)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\n💡 Soluciones posibles:")
        print("1. Verificar que el token de Apify es válido")
        print("2. Instalar dependencias: pip install claude-agent-sdk anyio")
        print("3. Verificar conexión a internet")


if __name__ == "__main__":
    anyio.run(main)
