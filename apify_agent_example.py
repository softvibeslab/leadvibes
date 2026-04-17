#!/usr/bin/env python3
"""
Apify MCP Agent - Ejemplo de integración con LeadVibes CRM

Este script demuestra cómo usar el servidor MCP de Apify con el Agent SDK de Claude
para automatizar tareas de web scraping para el CRM de bienes raíces.

Requisitos:
    pip install claude-agent-sdk anyio

Uso:
    python apify_agent_example.py
"""

import anyio
from claude_agent_sdk import query, ClaudeAgentOptions, ResultMessage


async def scrape_real_estate_leads():
    """
    Ejemplo 1: Scrapear listings de propiedades en Tulum desde Airbnb
    """
    print("🏠 Scrapeando listings de Airbnb en Tulum...")

    async for message in query(
        prompt="""
        Busca el Actor de Apify llamado "airbnb-scraper" y úsalo para scrapear
        listings de propiedades en Tulum, México con:
        - Check-in: próximo fin de semana
        - Check-out: 5 días después
        - Huéspedes: 2 personas

        Extrae: precio, título, ubicación, rating y URL del anfitrión.
        """,
        options=ClaudeAgentOptions(
            cwd="/rogervibes/leadvibes",
            allowed_tools=["Read", "Write", "Agent"],
            mcp_servers={
                "apify": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-apify"],
                    "env": {
                        "APIFY_API_TOKEN": "YOUR_APIFY_API_TOKEN"
                    }
                }
            }
        )
    ):
        if isinstance(message, ResultMessage):
            print(f"\n✅ Resultado:\n{message.result}")


async def scrape_google_maps_leads():
    """
    Ejemplo 2: Scraeper bienes raíces en Google Maps de Tulum
    """
    print("\n📍 Scrapeando inmobiliarias en Google Maps (Tulum)...")

    async for message in query(
        prompt="""
        Busca el Actor de Apify "google-maps-scraper" y úsalo para encontrar
        inmobiliarias en Tulum, Quintana Roo, México.

        Extrae: nombre, teléfono, dirección, website y rating.
        Guarda los resultados en un archivo JSON.
        """,
        options=ClaudeAgentOptions(
            cwd="/rogervibes/leadvibes",
            allowed_tools=["Read", "Write", "Agent"],
            mcp_servers={
                "apify": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-apify"],
                    "env": {
                        "APIFY_API_TOKEN": "YOUR_APIFY_API_TOKEN"
                    }
                }
            }
        )
    ):
        if isinstance(message, ResultMessage):
            print(f"\n✅ Resultado:\n{message.result}")


async def scrape_instagram_leads():
    """
    Ejemplo 3: Scrapear perfiles de Instagram de agentes inmobiliarios
    """
    print("\n📸 Scrapeando perfiles de Instagram...")

    async for message in query(
        prompt="""
        Busca el Actor de Apify "instagram-scraper" y explica cómo usarlo
        para obtener datos de perfiles de Instagram de agentes inmobiliarios.

        No ejecutes nada, solo explica los parámetros necesarios.
        """,
        options=ClaudeAgentOptions(
            cwd="/rogervibes/leadvibes",
            allowed_tools=["Read", "Agent"],
            mcp_servers={
                "apify": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-apify"],
                    "env": {
                        "APIFY_API_TOKEN": "YOUR_APIFY_API_TOKEN"
                    }
                }
            }
        )
    ):
        if isinstance(message, ResultMessage):
            print(f"\n✅ Resultado:\n{message.result}")


async def main():
    """Ejecutar todos los ejemplos"""
    print("=" * 60)
    print("🤖 Apify MCP Agent - LeadVibes CRM")
    print("=" * 60)

    # Ejecutar ejemplos
    await scrape_real_estate_leads()
    # await scrape_google_maps_leads()  # Descomentar para ejecutar
    # await scrape_instagram_leads()    # Descomentar para ejecutar

    print("\n" + "=" * 60)
    print("✨ Ejemplos completados")
    print("=" * 60)


if __name__ == "__main__":
    anyio.run(main)
