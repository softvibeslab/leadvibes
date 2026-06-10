# Arquitectura del Agente Hermes - Diagramas

## 1. Diagrama de Arquitectura General

```mermaid
flowchart TB
    subgraph Telegram["Telegram Bot"]
        TUSER[Usuario]
        TBOT[Bot Hermes]
        TUSER -- "/envía mensaje" --> TBOT
    end

    subgraph Webhook["Webhook Layer"]
        WH[Webhook Handler<br/>/api/telegram/webhook]
        AUTH[Auth & Link Validation]
    end

    subgraph Processor["Message Processor"]
        INTENT[Intent Detector<br/>action type]
        BUILDER[Action Builder<br/>pending action]
        CONFIRM[Confirmation Flow]
        EXECUTOR[Action Executor<br/>CRUD operations]
    end

    subgraph Data[(MongoDB)]
        LEADS[leads]
        TASKS[tasks]
        EVENTS[calendar_events]
        PRODS[products]
        PENDING[telegram_agent_pending_actions]
        AUDIT[agent_action_audit]
    end

    subgraph AgentStudio["Agent Studio"]
        PROFILE[Profile Config]
        SETTINGS[User Settings]
    end

    TBOT -- "POST update" --> WH
    WH --> AUTH
    AUTH --> INTENT
    INTENT --> BUILDER
    BUILDER -- "save pending" --> PENDING
    BUILDER -- "preview" --> CONFIRM
    CONFIRM -- "user confirms" --> EXECUTOR
    CONFIRM -- "user cancels" --> PENDING
    EXECUTOR --> LEADS
    EXECUTOR --> TASKS
    EXECUTOR --> EVENTS
    EXECUTOR --> PRODS
    EXECUTOR --> AUDIT
    PROFILE -.-> AUTH
    SETTINGS -.-> INTENT
```

## 2. Flujo de CRUD - Crear Lead

```mermaid
sequenceDiagram
    participant U as Usuario Telegram
    participant W as Webhook Handler
    participant B as Action Builder
    participant D as MongoDB
    participant X as Action Executor

    U->>W: "Crear lead Juan tel +52..."
    W->>W: Validate link by chat_id
    W->>B: build_pending_lead_action()
    B->>B: extract_name(), extract_phone()
    B->>B: validate required fields
    B->>D: Insert pending_action (status: pending_confirmation)
    D-->>B: action_id
    B-->>W: pending action doc
    W-->>U: Preview: "Nombre: Juan, Tel: +52...<br/>¿Confirmar?"

    U->>W: "sí"
    W->>D: Find pending_action
    W->>X: execute_pending_telegram_action()
    X->>X: Build lead_doc with all fields
    X->>D: Insert leads collection
    X->>D: Update pending_action (status: executed)
    X->>D: Insert agent_action_audit
    D-->>X: lead_id
    X-->>W: result with lead_id
    W-->>U: "✅ Lead creado ID: abc123"
```

## 3. Flujo de CRUD - Crear Tarea

```mermaid
sequenceDiagram
    participant U as Usuario Telegram
    participant W as Webhook Handler
    participant B as Action Builder
    participant D as MongoDB
    participant X as Action Executor

    U->>W: "Recordar llamar a Carlos mañana"
    W->>W: Validate link by chat_id
    W->>B: build_pending_task_action()
    B->>D: Find visible lead "Carlos"
    D-->>B: lead_doc
    B->>B: Build task with lead_id
    B->>D: Insert pending_action
    D-->>B: action_id
    B-->>W: pending action with task preview
    W-->>U: "Tarea: Llamar a Carlos<br/>Prioridad: alta<br/>¿Confirmar?"

    U->>W: "sí"
    W->>X: execute_pending_telegram_action()
    X->>X: Build task_doc (multiple assignees possible)
    X->>D: Insert tasks collection
    X->>D: Update pending_action (status: executed)
    X->>D: Insert agent_action_audit
    D-->>X: task_ids[]
    X-->>W: result
    W-->>U: "✅ Guardé 1 tarea en ROVI"
```

## 4. Máquina de Estados de una Acción

```mermaid
stateDiagram-v2
    [*] --> PendingConfirmation: User sends message
    PendingConfirmation --> Executed: User confirms "sí"
    PendingConfirmation --> Cancelled: User cancels "no"
    PendingConfirmation --> Expired: 30 min timeout
    Executed --> [*]
    Cancelled --> [*]
    Expired --> [*]

    note right of PendingConfirmation
        Preview enviado a Telegram
        Esperando confirmación
    end note

    note right of Executed
        CRUD operation completada
        Audit trail guardado
    end note
```

## 5. Detección de Intención

```mermaid
flowchart LR
    TEXT[Mensaje de usuario] --> PATTERNS{Pattern matching}

    PATTERNS --|contiene "tarea<br/>recordar<br/>seguimiento"|> TASK_ACTION[build_pending_task_action]
    PATTERNS --|contiene "lead<br/>cliente<br/>prospecto"|> LEAD_ACTION[build_pending_lead_action]
    PATTERNS --|contiene "cita<br/>reunión<br/>visita"|> EVENT_ACTION[build_pending_event_action]
    PATTERNS --|contiene "propiedad<br/>inmueble<br/>lote"|> PROPERTY_ACTION[build_pending_property_action]
    PATTERNS --|contiene "actualizar<br/>cambiar<br/>status"|> UPDATE_ACTION[build_pending_lead_update_action]

    TASK_ACTION --> PREVIEW[Send preview to user]
    LEAD_ACTION --> PREVIEW
    EVENT_ACTION --> PREVIEW
    PROPERTY_ACTION --> PREVIEW
    UPDATE_ACTION --> PREVIEW
```

## 6. Multi-tenancy y Seguridad

```mermaid
flowchart TB
    subgraph Request["Incoming Request"]
        MSG[Telegram Message]
    end

    subgraph Auth["Authentication Layer"]
        VALIDATE[Validate chat_id]
        FIND_LINK[Find user_device_link]
        GET_USER[Get user from DB]
    end

    subgraph Tenant["Tenant Resolution"]
        TENANT_ID[Get tenant_id from link or user]
        ROLE_SCOPE[Get role_scope: broker/agency_admin/etc]
    end

    subgraph Query["Query Building"]
        BASE_FILTER[Base tenant_id filter]
        ROLE_FILTER[Role-based visibility filter]
    end

    subgraph Collections["MongoDB Collections"]
        LEADS_Q[leads: tenant_id + deleted=false]
        TASKS_Q[tasks: tenant_id + visible_to_user]
        EVENTS_Q[calendar_events: tenant_id + user_id]
        PRODS_Q[products: tenant_id + is_active]
    end

    MSG --> VALIDATE
    VALIDATE --> FIND_LINK
    FIND_LINK --> GET_USER
    GET_USER --> TENANT_ID
    TENANT_ID --> ROLE_SCOPE
    ROLE_SCOPE --> BASE_FILTER
    BASE_FILTER --> ROLE_FILTER
    ROLE_FILTER --> LEADS_Q
    ROLE_FILTER --> TASKS_Q
    ROLE_FILTER --> EVENTS_Q
    ROLE_FILTER --> PRODS_Q
```

## 7. Estructura de Datos - Lead

```mermaid
erDiagram
    LEAD ||--o{ ACTIVITY : has
    LEAD ||--o{ TASK : "assigned in"
    LEAD ||--o{ CALENDAR_EVENT : "scheduled for"
    LEAD ||--o{ LEAD_PRODUCT_INTEREST : "interested in"

    LEAD {
        string id PK
        string tenant_id FK
        string name
        string email
        string phone
        enum status "nuevo|contactado|calificacion|..."
        enum priority "baja|media|alta|urgente"
        string source
        float budget_mxn
        string assigned_broker_id FK
        datetime created_at
        datetime updated_at
    }

    TASK {
        string id PK
        string tenant_id FK
        string title
        enum status "pendiente|en_progreso|completada"
        string lead_id FK
        string assigned_to FK
        datetime due_date
    }

    CALENDAR_EVENT {
        string id PK
        string tenant_id FK
        string user_id FK
        string title
        datetime start_time
        string lead_id FK
    }

    PRODUCT {
        string id PK
        string tenant_id FK
        string sku UK
        string title
        float price_mxn
        enum product_type "real_estate|service|..."
    }
```

## 8. Integración con Google Calendar (Opcional)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant H as Hermes Agent
    participant R as ROVI API
    participant G as Google Calendar

    U->>H: "Agendar visita mañana 10am"
    H->>R: POST /api/calendar/events
    R->>R: Create event in calendar_events
    R-->>H: event with google_event_id=null

    Note over H,G: Si Google integrado:
    H->>R: POST /api/calendar/events/{id}/sync-google
    R->>G: Create event via Google Calendar API
    G-->>R: google_event_id
    R->>R: Update calendar_events with google_event_id
    R-->>H: Synced event
    H-->>U: "✅ Evento creado y sincronizado con Google"
```
