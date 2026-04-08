# PRD y Plan Maestro de Desarrollo: Rovi Pocket

## 1. Visión General del Producto
**Rovi Pocket** es una aplicación móvil (iOS, Android y WebApp) diseñada exclusivamente para el **Broker Inmobiliario Individual**. A diferencia de los CRMs tradicionales de escritorio, Rovi Pocket elimina la fricción operativa actuando como un asistente personal proactivo, impulsado por Inteligencia Artificial.

* **Objetivo:** Convertirse en la herramienta de uso diario más importante del broker, permitiéndole gestionar leads, calendario y comunicaciones con una sola mano y en movimiento.
* **Modelo de Negocio:** *Try & Buy*. Prueba completa de 7 días por $1 USD (requiere tarjeta). Finalizado el trial, suscripción mensual de $39 USD. Versión gratuita limitada a 50 leads sin funciones IA.

---

## 2. Arquitectura y Stack Tecnológico

La aplicación se construirá manteniendo compatibilidad total con el backend existente de Rovi Web.

### Frontend (Mobile & WebApp)
* **Framework:** Flutter (estable).
* **Gestión de Estado:** Riverpod.
* **Navegación:** GoRouter.
* **Consumo de API:** Dio (con interceptores de tokens JWT).
* **Almacenamiento Local:** `flutter_secure_storage` (Auth) y `Isar`/`Hive` (Caché offline).

### Backend Reutilizado (API Mobile)
* **Stack:** FastAPI + Motor (MongoDB asíncrono).
* **Integración:** Creación de un nuevo router (`/api/mobile/v1/`) para servir payloads ligeros y optimizados para móvil, sin alterar la web actual.
* **IA:** OpenAI (`gpt-4o-mini` para chat diario, `gpt-4o` para Function Calling complejo).
* **Pagos:** Stripe API para suscripciones y el cargo de $1 de validación.

---

## 3. Definición del MVP (Minimum Viable Product)

### Funcionalidades Excluidas (Fuera del MVP)
* Vistas de agencia o gestión de equipos.
* Gamificación multijugador.
* Campañas de marketing masivo o embudos complejos.

### Funcionalidades Core (Incluidas)
1. **Agente IA Conversacional (Feature Estrella):** Chat (texto/voz) con contexto total de la base de datos del broker. Capaz de resumir el día, sugerir scripts de respuesta, y actualizar estados de leads mediante Function Calling.
2. **Dashboard Inteligente:** Vista rápida de tareas de hoy, citas y comisiones proyectadas.
3. **Pipeline de Leads (Tinder/Kanban style):** Visualización y movimiento fluido de prospectos (Frío, Tibio, Caliente).
4. **Sincronización de Contactos:** Importación a 1 clic desde la agenda del teléfono y Google Calendar.
5. **Micrositio Personal (Landing Page):** Un link único (Lead Magnet) personalizable desde la app para captación rápida.

---

## 4. Instrucciones para Asistentes de IA (Cursor & Claude Code)

Para mantener la consistencia en el desarrollo, los agentes de IA deben adherirse a las siguientes reglas (guardadas también en el archivo `.cursorrules`):

* **Enfoque Mobile-First:** Interfaces operables con una sola mano (pulgar).
* **Patrón de Arquitectura:** *Feature-First* (ej. `/lib/features/dashboard/`, `/lib/features/auth/`).
* **Estilo Visual ("Tulum Luxury"):** Minimalismo, espacios en blanco amplios, bordes redondeados (Radius 16-24), sin formularios largos (usar modales/bottom sheets).
* **Gestión de Estado:** Todo el estado global debe fluir a través de Riverpod (`NotifierProvider`, `ConsumerWidget`).

### Secuencia de Trabajo Paralelo (Humano + IA)
1. **Estructura (Claude Code - Terminal):** Creación de carpetas, configuración de GoRouter y cliente Dio.
2. **Modelos y Repositorios (Claude Code / Cursor):** Generación de clases de datos (Freezed) y conexión con FastAPI.
3. **Maquetación UI (Cursor Composer):** Generación de pantallas a partir de descripciones funcionales o código extraído de Figma (MCP).
4. **Lógica Compleja (Claude Code):** Implementación del streaming de respuestas de IA y sincronización offline.

---

## 5. Estrategia Go-to-Market (Lanzamiento)

* **Adquisición:** Anuncios de Meta (FB/IG) con formato *User Generated Content* (UGC). Ejemplo de ángulo: *Broker en su auto usando la voz para actualizar su CRM y generar un guion de ventas.*
* **Fricción Cero en Registro:** El usuario descarga gratis y crea cuenta sin tarjeta. El paywall de $1 aparece únicamente cuando intenta invocar al Agente IA por primera vez o sobrepasa los 50 leads.
* **Onboarding Mágico:** Al pagar el $1, la app importa contactos del teléfono y la IA envía proactivamente el primer mensaje sugiriendo acciones inmediatas para recuperar leads fríos.

---

## 6. Roadmap del Proyecto (12 Semanas)

| Fase | Título | Objetivo | Duración |
| :--- | :--- | :--- | :--- |
| **Fase 1** | Setup & Auth | Estructura base de Flutter, login/registro JWT conectado a FastAPI. | Semanas 1-2 |
| **Fase 2** | Core Data & UI | Dashboard, Pipeline móvil, importación nativa de contactos del celular. | Semanas 3-4 |
| **Fase 3** | El Cerebro IA | Integración del Agente IA con acceso al backend (Function Calling). | Semanas 5-7 |
| **Fase 4** | Monetización | Flujo de Stripe, Paywall de Try & Buy ($1) y lógica de roles. | Semana 8 |
| **Fase 5** | Landing & Polish | Creación de micro-landing pages, notificaciones Push (FCM). | Semanas 9-10 |
| **Fase 6** | QA & Lanzamiento | Pruebas en dispositivos físicos, subida a App Store y Play Store. | Semanas 11-12 |