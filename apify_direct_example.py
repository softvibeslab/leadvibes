#!/usr/bin/env python3
"""
Ejemplo alternativo: Usar Apify directamente sin Agent SDK

Este script muestra cómo usar la API de Apify directamente con Python,
sin necesidad del Claude Agent SDK que tiene problemas de dependencias.
"""

import os
import requests
import json
import time


class ApifyClient:
    """Cliente simple para la API de Apify"""

    def __init__(self, api_token=None):
        self.api_token = api_token or os.getenv(
            "APIFY_API_TOKEN",
            "YOUR_APIFY_API_TOKEN"
        )
        self.base_url = "https://api.apify.com/v2"
        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }

    def list_actors(self, query="real estate", limit=10):
        """Listar Actors de Apify"""
        url = f"{self.base_url}/actors"
        params = {
            "search": query,
            "limit": limit
        }

        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()

    def run_actor(self, actor_id, input_data):
        """Ejecutar un Actor de Apify"""
        url = f"{self.base_url}/acts/{actor_id}/runs"

        payload = {"input": input_data}

        response = requests.post(url, headers=self.headers, json=payload)
        response.raise_for_status()
        return response.json()

    def get_run_status(self, run_id):
        """Obtener estado de una ejecución"""
        url = f"{self.base_url}/actor-runs/{run_id}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def get_run_results(self, run_id, limit=100):
        """Obtener resultados de una ejecución"""
        url = f"{self.base_url}/actor-runs/{run_id}/dataset/items"
        params = {"limit": limit}
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()

    def wait_for_completion(self, run_id, max_wait=300, poll_interval=5):
        """Esperar a que termine la ejecución"""
        start_time = time.time()

        while True:
            if time.time() - start_time > max_wait:
                raise TimeoutError(f"La ejecución {run_id} excedió el tiempo límite")

            status = self.get_run_status(run_id)
            status_text = status.get("data", {}).get("status", "UNKNOWN")

            if status_text == "SUCCEEDED":
                print(f"✅ Ejecución {run_id} completada exitosamente")
                return True
            elif status_text in ["FAILED", "ABORTED", "TIMED-OUT"]:
                raise Exception(f"Ejecución {run_id} falló con estado: {status_text}")
            elif status_text in ["RUNNING", "READY", "TRANSITIONING"]:
                elapsed = int(time.time() - start_time)
                print(f"⏳ Ejecutando... ({elapsed}s)")
                time.sleep(poll_interval)
            else:
                print(f"⚠️  Estado desconocido: {status_text}")
                time.sleep(poll_interval)


def scrape_google_maps_real_estate(location="Tulum, Mexico", max_results=10):
    """
    Scrapear inmobiliarias de Google Maps

    Args:
        location: Ubicación a buscar
        max_results: Número máximo de resultados
    """
    client = ApifyClient()

    print(f"📍 Buscando inmobiliarias en: {location}")

    # Input para el Actor de Google Maps
    input_data = {
        "searchString": f"real estate agency {location}",
        "maxCrawledPlaces": max_results,
        "language": "en",
        "type": "search"
    }

    try:
        # Ejecutar el Actor
        print("🚀 Iniciando scraping...")
        run_info = client.run_actor("streamers/google-maps-scraper", input_data)
        run_id = run_info.get("data", {}).get("id")

        if not run_id:
            raise Exception("No se pudo obtener el ID de la ejecución")

        print(f"📝 Ejecución creada: {run_id}")

        # Esperar a que termine
        client.wait_for_completion(run_id)

        # Obtener resultados
        print("📊 Obteniendo resultados...")
        results = client.get_run_results(run_id, limit=max_results)

        print(f"\n✅ Se encontraron {len(results)} inmobiliarias:\n")

        for i, place in enumerate(results, 1):
            print(f"{i}. {place.get('title', 'N/A')}")
            print(f"   📍 {place.get('address', 'N/A')}")
            print(f"   📞 {place.get('phone', 'N/A')}")
            print(f"   ⭐ {place.get('totalScore', 'N/A')} ({place.get('reviewsCount', 0)} reseñas)")
            print(f"   🔗 {place.get('website', 'N/A')}")
            print()

        return results

    except Exception as e:
        print(f"❌ Error: {e}")
        return None


def scrape_airbnb_listings(location="Tulum", check_in=None, check_out=None, max_results=10):
    """
    Scrapear listings de Airbnb

    Args:
        location: Ciudad a buscar
        check_in: Fecha de check-in (YYYY-MM-DD)
        check_out: Fecha de check-out (YYYY-MM-DD)
        max_results: Número máximo de resultados
    """
    client = ApifyClient()

    print(f"🏠 Buscando listings en Airbnb: {location}")

    # Input para el Actor de Airbnb
    input_data = {
        "searchQueries": [location],
        "maxItems": max_results,
        "startUrls": []
    }

    if check_in and check_out:
        input_data["checkIn"] = check_in
        input_data["checkOut"] = check_out

    try:
        print("🚀 Iniciando scraping...")
        run_info = client.run_actor("dtrangtin/airbnb-scraper", input_data)
        run_id = run_info.get("data", {}).get("id")

        if not run_id:
            raise Exception("No se pudo obtener el ID de la ejecución")

        print(f"📝 Ejecución creada: {run_id}")

        # Esperar a que termine
        client.wait_for_completion(run_id, max_wait=600)  # Airbnb toma más tiempo

        # Obtener resultados
        print("📊 Obteniendo resultados...")
        results = client.get_run_results(run_id, limit=max_results)

        print(f"\n✅ Se encontraron {len(results)} listings:\n")

        for i, listing in enumerate(results, 1):
            print(f"{i}. {listing.get('name', 'N/A')}")
            print(f"   💰 ${listing.get('price', 'N/A')}/noche")
            print(f"   📍 {listing.get('location', {}).get('address', 'N/A')}")
            print(f"   ⭐ {listing.get('rating', 'N/A')}")
            print(f"   👥 {listing.get('personCapacity', 'N/A')} huéspedes")
            print(f"   🔗 {listing.get('url', 'N/A')}")
            print()

        return results

    except Exception as e:
        print(f"❌ Error: {e}")
        return None


def list_real_estate_actors():
    """Listar Actors de Apify para bienes raíces"""
    client = ApifyClient()

    print("🔍 Buscando Actors de bienes raíces en Apify...\n")

    actors = client.list_actors(query="real estate", limit=10)

    items = actors.get("data", {}).get("items", [])

    print(f"✅ Se encontraron {len(items)} Actors:\n")

    for i, actor in enumerate(items, 1):
        print(f"{i}. {actor.get('name', 'N/A')}")
        print(f"   📝 {actor.get('description', 'Sin descripción')[:100]}...")
        print(f"   🔗 https://apify.com/{actor.get('username', 'N/A')}/{actor.get('name', 'N/A')}")
        print()

    return items


def main():
    """Función principal con ejemplos"""
    print("=" * 70)
    print("🤖 Apify Direct Client - LeadVibes CRM")
    print("=" * 70)
    print()

    # Ejemplo 1: Listar Actors disponibles
    print("📋 EJEMPLO 1: Listar Actors de bienes raíces")
    print("-" * 70)
    list_real_estate_actors()

    print("\n" + "=" * 70 + "\n")

    # Ejemplo 2: Scrapear inmobiliarias
    print("📍 EJEMPLO 2: Scrapear inmobiliarias de Google Maps")
    print("-" * 70)
    # scrape_google_maps_real_estate(location="Tulum, Mexico", max_results=5)

    print("\n" + "=" * 70 + "\n")

    # Ejemplo 3: Scrapear Airbnb (comentado para no consumir créditos)
    # print("🏠 EJEMPLO 3: Scrapear listings de Airbnb")
    # print("-" * 70)
    # scrape_airbnb_listings(location="Tulum", max_results=5)

    print("\n✨ Ejemplos completados!")
    print("\n💡 Para ejecutar los ejemplos de scraping, descomenta las líneas")
    print("   correspondientes en la función main().")


if __name__ == "__main__":
    main()
