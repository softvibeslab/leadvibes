# Integración de Apify MCP con LeadVibes CRM

Esta guía explica cómo usar el servidor MCP de Apify con Claude Code y el Agent SDK para automatizar tareas de web scraping en el CRM de bienes raíces.

## 📋 Configuración Completada

### 1. Archivo de Configuración de Claude Code

**Ubicación:** `~/.config/claude-code/config.json`

✅ **Ya configurado** con tu API token de Apify.

### 2. Script de Ejemplo

**Ubicación:** `/rogervibes/leadvibes/apify_agent_example.py`

Script funcional con 3 ejemplos de uso para LeadVibes.

## 🚀 Uso Rápido

### Instalar Dependencias

```bash
pip install claude-agent-sdk anyio
```

### Ejecutar el Script de Ejemplo

```bash
cd /rogervibes/leadvibes
python apify_agent_example.py
```

## 🎯 Casos de Uso para LeadVibes

### 1. Scrapear Listings de Airbnb

```python
async for message in query(
    prompt="Usa airbnb-scraper para buscar propiedades en Tulum...",
    options=ClaudeAgentOptions(
        mcp_servers={"apify": {...}},
        allowed_tools=["Read", "Write", "Agent"]
    )
):
    if isinstance(message, ResultMessage):
        print(message.result)
```

**Actores de Apify útiles:**
- `airbnb-scraper` - Listings de Airbnb
- `booking-scraper` - Listings de Booking.com
- `vrbo-scraper` - Listings de Vrbo

### 2. Encontrar Inmobiliarias en Google Maps

```python
async for message in query(
    prompt="Usa google-maps-scraper para inmobiliarias en Tulum...",
    options=ClaudeAgentOptions(...)
):
    # Procesar resultados
```

**Datos extraídos:**
- Nombre de la inmobiliaria
- Teléfono
- Dirección
- Website
- Rating y reseñas

### 3. Scrapear Redes Sociales

```python
# Instagram
prompt="Usa instagram-scraper para perfiles de agentes..."

# LinkedIn
prompt="Usa linkedin-profile-scraper para agentes inmobiliarios..."

# Facebook
prompt="Usa facebook-pages-scraper para páginas de inmobiliarias..."
```

### 4. Scraear Portales Inmobiliarios

```python
# Mercado Libre
prompt="Usa mercadolibre-scraper para propiedades en Tulum..."

# Zillow (USA)
prompt="Usa zillow-scraper para comparar precios..."

# Idealista (España)
prompt="Usa idealista-scraper para referencias de mercado..."
```

## 🔧 Integración con el Backend de LeadVibes

### Crear Endpoint para Importar Leads de Apify

```python
# Agregar a backend/server.py

@app.post("/api/leads/import-apify")
async def import_leads_apify(
    actor: str,
    search_params: dict,
    current_user: User = Depends(get_current_user)
):
    """
    Import leads usando un Actor de Apify.

    Ejemplo:
    {
        "actor": "google-maps-scraper",
        "search_params": {
            "searchString": "real estate Tulum Mexico",
            "maxCrawledPlaces": 50
        }
    }
    """
    from claude_agent_sdk import query, ClaudeAgentOptions, ResultMessage

    prompt = f"""
    Ejecuta el Actor de Apify "{actor}" con estos parámetros: {json.dumps(search_params)}.
    Extrae los datos y devuélvelos en formato JSON.
    """

    results = []
    async for message in query(
        prompt=prompt,
        options=ClaudeAgentOptions(
            cwd="/rogervibes/leadvibes",
            allowed_tools=["Agent"],
            mcp_servers={
                "apify": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-apify"],
                    "env": {"APIFY_API_TOKEN": os.getenv("APIFY_API_TOKEN")}
                }
            }
        )
    ):
        if isinstance(message, ResultMessage):
            # Procesar resultados y crear leads
            results.append(message.result)

    return {"imported": len(results), "leads": results}
```

### Variable de Entorno

Agregar a `.env`:

```bash
APIFY_API_TOKEN=YOUR_APIFY_API_TOKEN
```

## 📊 Actores de Apify Recomendados

### Para Bienes Raíces

| Actor | Uso | Datos que extrae |
|-------|-----|------------------|
| `google-maps-scraper` | Inmobiliarias locales | Teléfono, dirección, web |
| `airbnb-scraper` | Competencia Airbnb | Precios, occupancy |
| `instagram-scraper` | Agentes en Instagram | Seguidores, contacto |
| `linkedin-profile-scraper` | Perfiles de agentes | Experiencia, email |
| `tripadvisor-scraper` | Reviews de hoteles | Sentimiento, precios |
| `wayback-machine-scraper` | Historial de sitios | Datos históricos |

### Para Market Research

| Actor | Uso |
|-------|-----|
| `google-search-scraper` | Investigación de mercado |
| `reddit-scraper` | Opiniones de expatriados |
| `twitter-scraper` | Tendencias del mercado |
| `youtube-scraper` | Tours de propiedades |

## ⚠️ Consideraciones Importantes

1. **Límites de API:** Tu token de Apify tiene límites de uso mensual
2. **Términos de servicio:** Respeta las políticas de scraping de cada plataforma
3. **Privacidad:** No almacenes datos personales sin consentimiento
4. **Calidad de datos:** Valida los datos obtenidos antes de importarlos al CRM

## 🔄 Próximos Pasos

1. **Testear el script de ejemplo:**
   ```bash
   python apify_agent_example.py
   ```

2. **Crear endpoints en el backend:**
   - `/api/scrape/google-maps`
   - `/api/scrape/airbnb`
   - `/api/scrape/instagram`

3. **Agregar UI en el frontend:**
   - Página de "Importación Inteligente"
   - Selector de fuente (Google Maps, Airbnb, etc.)
   - Vista previa de resultados antes de importar

4. **Automatización:**
   - Cron jobs para scraping recurrente
   - Notificaciones cuando hay nuevos leads
   - Detección de cambios en precios de la competencia

## 📚 Recursos

- [Documentación de Apify MCP](https://apify.com/agentify/claude-code)
- [Agent SDK Python](https://github.com/anthropics/claude-agent-sdk-python)
- [Store de Apify Actors](https://apify.com/store)

## 💡 Tips

- **Empieza con Google Maps scraper:** Es el más útil para leads B2B
- **Usa maxCrawledPlaces:** Limita los resultados para ahorrar créditos
- **Combina múltiples scrapers:** Cruza datos de diferentes fuentes
- **Guarda datasets de Apify:** Reutiliza datos sin re-scrapear
