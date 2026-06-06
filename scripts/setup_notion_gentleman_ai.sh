#!/usr/bin/env bash
set -euo pipefail

NOTION_VERSION="${NOTION_VERSION:-2025-09-03}"
DATABASE_TITLE="${DATABASE_TITLE:-Gentleman AI Ecosystem}"
TODAY="${TODAY:-$(date +%F)}"

usage() {
  cat <<'USAGE'
Create the "Gentleman AI Ecosystem" database in Notion and seed its rows.

Required environment variables:
  NOTION_API_KEY   Internal integration secret.
  PARENT_PAGE_ID   Notion page ID where the database will be created.

Optional environment variables:
  NOTION_VERSION   Defaults to 2025-09-03.
  DATABASE_TITLE   Defaults to "Gentleman AI Ecosystem".
  TODAY            Defaults to today's date.

Example:
  export NOTION_API_KEY="secret_..."
  export PARENT_PAGE_ID="THIS_IS_YOUR_PAGE_ID"
  ./scripts/setup_notion_gentleman_ai.sh
USAGE
}

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: ${name}" >&2
    usage >&2
    exit 1
  fi
}

require_command() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    echo "Missing required command: ${name}" >&2
    exit 1
  fi
}

normalize_page_id() {
  local value="$1"
  local id

  id="$(printf '%s' "${value}" | sed -E 's/\?.*$//' | grep -Eo '[0-9a-fA-F]{32}$|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' | tail -n 1)"
  if [[ -z "${id}" ]]; then
    echo "Could not extract a Notion page ID from PARENT_PAGE_ID." >&2
    exit 1
  fi

  printf '%s' "${id}"
}

notion_post() {
  local endpoint="$1"
  local payload="$2"

  curl -sS -X POST "https://api.notion.com/v1/${endpoint}" \
    -H "Authorization: Bearer ${NOTION_API_KEY}" \
    -H "Notion-Version: ${NOTION_VERSION}" \
    -H "Content-Type: application/json" \
    -d "${payload}"
}

create_database() {
  jq -n \
    --arg parent_page_id "${PARENT_PAGE_ID}" \
    --arg title "${DATABASE_TITLE}" \
    '{
      parent: {type: "page_id", page_id: $parent_page_id},
      title: [{type: "text", text: {content: $title}}],
      initial_data_source: {
        properties: {
          "Componente": {title: {}},
          "Descripción": {rich_text: {}},
          "Estado": {
            select: {
              options: [
                {name: "Pendiente", color: "gray"},
                {name: "En progreso", color: "orange"},
                {name: "Completado", color: "green"}
              ]
            }
          },
          "Enlace": {url: {}},
          "Última actualización": {date: {}}
        }
      }
    }' | notion_post "databases" "@-"
}

create_row() {
  local data_source_id="$1"
  local component="$2"
  local description="$3"
  local status="$4"
  local url="$5"

  jq -n \
    --arg data_source_id "${data_source_id}" \
    --arg component "${component}" \
    --arg description "${description}" \
    --arg status "${status}" \
    --arg url "${url}" \
    --arg today "${TODAY}" \
    '{
      parent: {data_source_id: $data_source_id},
      properties: {
        "Componente": {
          title: [{type: "text", text: {content: $component}}]
        },
        "Descripción": {
          rich_text: [{type: "text", text: {content: $description}}]
        },
        "Estado": {
          select: {name: $status}
        },
        "Enlace": {
          url: $url
        },
        "Última actualización": {
          date: {start: $today}
        }
      }
    }' | notion_post "pages" "@-"
}

create_board_view() {
  local database_id="$1"
  local data_source_id="$2"

  if [[ -z "${data_source_id}" || "${data_source_id}" == "null" ]]; then
    echo "Skipping Kanban view: data_source_id was not present in the database response." >&2
    return 0
  fi

  jq -n \
    --arg database_id "${database_id}" \
    --arg data_source_id "${data_source_id}" \
    '{
      database_id: $database_id,
      data_source_id: $data_source_id,
      name: "Kanban por Estado",
      type: "board"
    }' | notion_post "views" "@-"
}

main() {
  require_env "NOTION_API_KEY"
  require_env "PARENT_PAGE_ID"
  require_command "curl"
  require_command "jq"
  require_command "sed"
  require_command "grep"

  PARENT_PAGE_ID="$(normalize_page_id "${PARENT_PAGE_ID}")"
  export PARENT_PAGE_ID

  echo "Checking Notion API access..."
  notion_post "search" '{"query":"","page_size":1}' | jq -e '.object == "list"' >/dev/null

  echo "Creating database: ${DATABASE_TITLE}"
  database_response="$(create_database)"
  echo "${database_response}" | jq .

  database_id="$(echo "${database_response}" | jq -r '.id')"
  data_source_id="$(echo "${database_response}" | jq -r '.data_sources[0].id // .data_source_id // empty')"

  if [[ -z "${database_id}" || "${database_id}" == "null" ]]; then
    echo "Could not read database ID from Notion response." >&2
    exit 1
  fi
  if [[ -z "${data_source_id}" || "${data_source_id}" == "null" ]]; then
    echo "Could not read data source ID from Notion response." >&2
    exit 1
  fi

  echo "Adding ecosystem rows..."
  create_row "${data_source_id}" "Engram" \
    "Sistema de memoria persistente y contextual para agentes. Permite almacenar, recuperar y compartir información entre sesiones y agentes." \
    "Pendiente" \
    "https://github.com/Gentleman-Programming/engram" >/dev/null

  create_row "${data_source_id}" "SDD (Skill-Driven Development)" \
    "Flujo de desarrollo guiado por skills: instrucciones reutilizables, patrones operativos y automatización consistente para agentes." \
    "Pendiente" \
    "https://github.com/Gentleman-Programming" >/dev/null

  create_row "${data_source_id}" "Skills" \
    "Capacidades especializadas que extienden el comportamiento del agente con workflows, documentación y herramientas específicas." \
    "Pendiente" \
    "https://github.com/Gentleman-Programming" >/dev/null

  create_row "${data_source_id}" "MCP (Model Context Protocol)" \
    "Protocolo para conectar agentes con herramientas, fuentes de datos y contexto externo de forma estructurada." \
    "Pendiente" \
    "https://modelcontextprotocol.io/" >/dev/null

  create_row "${data_source_id}" "Personalidad del agente" \
    "Capa de comportamiento, tono, preferencias e instrucciones que define cómo colabora el agente con el usuario." \
    "Pendiente" \
    "https://github.com/Gentleman-Programming" >/dev/null

  echo "Creating Kanban board view..."
  create_board_view "${database_id}" "${data_source_id}" | jq . || {
    echo "Kanban view creation failed. The database and rows were created; add the board manually in Notion if needed." >&2
  }

  echo "Done."
  echo "Database ID: ${database_id}"
  echo "If the board is not grouped yet, open the view in Notion and group it by Estado."
}

main "$@"
