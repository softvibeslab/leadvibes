# Rovi Pocket — Prompts de Figma por Flujo

## Cómo usar este documento

Estos prompts están pensados para Figma AI o para un diseñador trabajando con IA asistida. Están escritos para generar pantallas, flows y decisiones de interfaz alineadas con `Rovi Pocket`.

### Principios globales que deben respetarse en todos los prompts

- Producto: app mobile-first para brokers individuales de Real Estate en México.
- Uso: varias veces al día desde celular.
- Tono visual: premium, claro, rápido, profesional, cero ruido.
- Estilo: SaaS táctico + asistente personal + CRM de bolsillo.
- Objetivo UX: tomar decisiones y ejecutar acciones en segundos.
- No diseñar nada orientado a agencia, equipos o campañas masivas.
- La IA es parte central de la experiencia, no un widget accesorio.
- La app debe sentirse útil incluso en sesiones de 20 a 90 segundos.

### Sistema de navegación recomendado

- bottom tab bar:
  - Inicio
  - Leads
  - Agenda
  - IA
  - Perfil
- floating action button central para:
  - nuevo lead
  - importar
  - nueva nota
  - nuevo evento

### Componentes base que deben repetirse

- cards compactas
- chips de estado
- quick actions
- progreso semanal / mensual
- timeline de actividades
- paneles contextuales
- estados vacíos útiles
- loading skeletons
- banner de offline/sync

## Prompt 1 — Shell principal de la app

```text
Diseña el app shell de una aplicación mobile-first llamada Rovi Pocket para brokers individuales de bienes raíces en México.

Objetivo:
Crear una estructura principal de navegación que se sienta rápida, premium y altamente accionable.

Incluye:
- bottom tab bar con 5 tabs: Inicio, Leads, Agenda, IA, Perfil
- floating action button central con acciones: Nuevo lead, Importar, Nueva nota, Nuevo evento
- header compacto con saludo contextual y acceso a notificaciones
- patrones consistentes de cards, chips, listas y quick actions
- soporte visual para estados offline, syncing y push reminders

Experiencia deseada:
- la app debe sentirse como el centro operativo diario del broker
- muy pocos elementos por pantalla
- mucha claridad jerárquica
- acciones importantes visibles sin navegar demasiado

Controles de interfaz a mostrar:
- tab bar
- FAB expandible
- top bar contextual
- badges de notificación
- cards compactas
- chips de estado
- dropdown sheet o bottom sheet para acciones rápidas

Estados:
- normal
- loading
- empty state
- offline
- error ligero

Diseña para iPhone 15 Pro y Android moderno.
Genera estilo coherente, reusable y escalable.
```

## Prompt 2 — Onboarding del broker

```text
Diseña el flujo completo de onboarding para Rovi Pocket, una app mobile-first para brokers individuales de bienes raíces.

Objetivo:
Permitir que un broker nuevo configure su cuenta rápidamente y llegue a una app lista para usar.

Flujo:
1. Bienvenida y propuesta de valor
2. Registro o login
3. Configuración de metas mensuales
4. Perfil profesional del broker
5. Configuración del perfil del agente IA
6. Permisos de contactos y notificaciones
7. Confirmación y entrada al dashboard

Experiencia de usuario:
- tono claro, cercano, premium y orientado a ventas
- pasos cortos, sin fricción
- siempre explicar por qué se pide cada dato
- progreso visible

Controles de interfaz:
- progress stepper
- form cards
- segmented controls
- input fields
- selectors para metas
- multi-select chips
- toggles de permisos
- CTA sticky inferior

Estados:
- formulario incompleto
- formulario completo
- permiso concedido / rechazado
- éxito final

No diseñar nada orientado a agencia o multiusuario.
```

## Prompt 3 — Dashboard Inteligente

```text
Diseña la pantalla principal de Rovi Pocket: un Dashboard Inteligente para un broker individual de bienes raíces.

Objetivo:
Que el broker abra la app y en menos de 10 segundos entienda:
- qué tan bien va vs su meta,
- qué debe hacer hoy,
- con qué leads,
- qué citas tiene,
- qué riesgos hay en su pipeline.

Secciones obligatorias:
- saludo contextual y resumen del día
- KPIs personales más importantes
- avance contra meta semanal y mensual
- plan del día generado por IA
- top 5 leads prioritarios
- citas de hoy
- oportunidades y alertas
- streak, puntos, badges y progreso personal

Experiencia deseada:
- extremadamente clara y accionable
- cada card debe llevar a una acción
- mezcla de analítica, coaching e impulso diario

Controles:
- KPI cards
- progress bars
- planner cards con botones de acción
- lead cards compactas
- chips de prioridad
- carousel horizontal para objetivos
- CTA para abrir el agente IA

Estados:
- día sin citas
- sin leads calientes
- metas en riesgo
- buen progreso semanal
- loading skeleton

Diseña con una estética premium, limpia, mobile-first y muy enfocada en ejecución.
```

## Prompt 4 — Lista de leads y pipeline móvil

```text
Diseña la experiencia mobile-first del módulo de leads para Rovi Pocket.

Objetivo:
Que el broker pueda revisar, filtrar, priorizar y actuar sobre sus leads rápidamente.

La pantalla debe incluir:
- barra de búsqueda
- filtros rápidos por etapa, prioridad y fuente
- lista de leads en formato compacto
- vista clara de score, etapa, último contacto y siguiente acción
- acceso a quick actions sin entrar al detalle

Experiencia deseada:
- comparable a una bandeja inteligente de trabajo
- muy rápida de escanear con una sola mano
- excelente para sesiones cortas repetidas

Controles de interfaz:
- search bar
- filter chips
- segmented control para vista Todos / Hoy / Estancados / Calientes
- lead cards
- swipe actions: llamar, WhatsApp, agendar, nota
- indicador visual de score e inactividad
- FAB para nuevo lead o importar

Estados:
- sin leads
- con leads calientes
- con leads estancados
- con sincronización pendiente

No usar una tabla tipo desktop.
```

## Prompt 5 — Detalle del lead

```text
Diseña la pantalla de detalle de lead para Rovi Pocket.

Objetivo:
Dar al broker una vista 360 del lead sin abrumarlo, y permitirle actuar de inmediato.

Información a mostrar:
- nombre, etapa, score, fuente y datos de contacto
- última interacción
- resumen ejecutivo del lead
- insights y recomendaciones de IA
- historial de actividades
- notas
- próxima acción sugerida
- acceso a scripts recomendados

Experiencia deseada:
- el broker debe sentir que esta pantalla reemplaza libreta, agenda y CRM pesado
- toda la información importante debe estar visible sin demasiados taps

Controles de interfaz:
- hero card del lead
- quick action bar: Llamar, WhatsApp, Email, Agendar, Nota
- AI insight card
- timeline vertical
- cards de notas
- expandable sections
- CTA para abrir el Agente IA con contexto del lead

Estados:
- lead nuevo
- lead caliente
- lead estancado
- lead con cita próxima
- lead sin teléfono o sin email
```

## Prompt 6 — Agente IA conversacional

```text
Diseña la pantalla del Agente IA de Rovi Pocket, el asistente principal del broker.

Objetivo:
Permitir que el broker converse con la IA sobre cualquier información de sus leads, pipeline, agenda, metas y acciones comerciales.

La IA debe parecer un copiloto operativo, no solo un chat genérico.

Casos de uso principales:
- preguntar a quién contactar hoy
- pedir resumen del pipeline
- pedir preparación para citas del día
- generar scripts de llamada, WhatsApp o email
- pedir seguimiento recomendado por lead
- crear tareas, notas o eventos con confirmación

Controles de interfaz:
- chat thread moderno
- composer fijo inferior
- botones de voz, texto y prompts sugeridos
- cards de respuesta con acciones rápidas
- contexto actual visible: por ejemplo “estás viendo Lead X”
- chips de acceso rápido: Hot leads, Agenda de hoy, Script, Resumen semanal
- modales o sheets para confirmación de acciones creadas por la IA

Experiencia deseada:
- conversación breve, útil y accionable
- respuestas cortas, inteligentes y ligadas al CRM real
- sensación de asistente premium y confiable

Estados:
- bienvenida sin historial
- conversación activa
- respuesta con acciones sugeridas
- loading / thinking
- error con fallback
- modo contextual desde un lead
```

## Prompt 7 — Agenda y calendario

```text
Diseña el módulo de agenda y calendario de Rovi Pocket.

Objetivo:
Que el broker pueda organizar y ejecutar su día comercial desde el celular.

Flujo:
- ver agenda de hoy
- ver semana
- abrir detalle de evento
- crear evento rápido
- asociar evento a lead
- sincronizar con Google Calendar

Controles:
- date strip horizontal
- lista de eventos del día
- calendar week sheet
- event cards por tipo
- botón de crear evento
- indicador de sync con Google
- quick actions desde evento: confirmar, completar, reprogramar, abrir lead

Experiencia deseada:
- agenda súper legible
- más parecida a “plan diario” que a calendario complejo
- preparada para recordatorios y follow-up

Estados:
- día vacío
- día con citas seguidas
- evento atrasado
- sync pendiente
- sync correcto
```

## Prompt 8 — Importación de leads

```text
Diseña el flujo mobile-first de importación de leads para Rovi Pocket.

Objetivo:
Que un broker pueda cargar su base de contactos con la menor fricción posible.

Fuentes:
- contactos del teléfono
- CSV
- contenido compartido desde WhatsApp

Flujo:
1. Elegir fuente
2. Revisar preview
3. Detectar duplicados
4. Confirmar importación
5. Ver leads cargados al pipeline

Controles:
- source selector
- cards de fuente
- preview list
- chips de coincidencia/dedupe
- toggle para ignorar duplicados
- CTA fijo de importación
- success state con siguiente acción sugerida

Experiencia deseada:
- muy sencilla, casi asistida
- sin parecer una herramienta administrativa
- debe sentirse útil incluso desde celular

Estados:
- permiso denegado
- archivo inválido
- duplicados encontrados
- importación exitosa
- importación parcial
```

## Prompt 9 — Landing simple del broker

```text
Diseña la landing page simple del broker para Rovi Pocket.

Objetivo:
Permitir al broker compartir una página sencilla, clara y confiable para captar leads que entren automáticamente al CRM.

Contenido:
- hero del broker
- foto y branding básico
- propuesta de valor
- tipo de propiedades o zonas
- botón o formulario de contacto
- lead magnet opcional
- prueba de confianza ligera

Controles:
- hero CTA
- form fields simples
- sticky CTA móvil
- testimonios cortos opcionales
- badge de respuesta rápida

Experiencia deseada:
- simple
- humana
- orientada a conversión
- optimizada para móvil

Estados:
- vista pública
- formulario enviado
- error de envío
```

## Prompt 10 — Sistema de quick actions y sheets

```text
Diseña el sistema transversal de quick actions para Rovi Pocket.

Objetivo:
Permitir ejecutar acciones frecuentes desde cualquier contexto sin romper el flujo del usuario.

Acciones frecuentes:
- llamar
- WhatsApp
- email
- agendar
- crear nota
- mover etapa
- abrir agente IA

Patrón visual:
- bottom sheets
- action chips
- contextual floating buttons
- confirmation sheets

Experiencia deseada:
- acciones de alta frecuencia
- mínimo número de pasos
- clara prevención de errores
- sensación de velocidad y control

Estados:
- acción disponible
- acción deshabilitada por falta de dato
- confirmación
- éxito
- error
```

## Prompt maestro para pegar en Figma antes de cualquier pantalla

```text
Diseña una experiencia mobile-first premium para una app llamada Rovi Pocket, dirigida exclusivamente a brokers individuales de bienes raíces en México.

La app debe sentirse como un CRM de bolsillo + asistente personal + centro operativo diario.

Características del producto:
- uso varias veces al día
- foco en ejecución, seguimiento y cierre
- IA como copiloto central del broker
- navegación corta, clara y táctil
- nada de complejidad de agencia, marketing masivo o módulos corporativos

Principios de interfaz:
- claridad extrema
- jerarquía visual fuerte
- acciones rápidas visibles
- lenguaje premium pero cercano
- componentes reutilizables
- cards compactas
- chips y estados visuales
- mucho énfasis en tiempo, prioridad, siguiente acción y progreso

Diseñar siempre:
- controles táctiles grandes
- navegación one-hand friendly
- estados loading, empty, offline y error
- transiciones suaves
- visualización clara del contexto del broker

Estética:
- premium, moderna, limpia, muy enfocada en productividad
- no genérica, no corporativa fría, no “dashboard pesado”
- mezcla de CRM táctico, asistente inteligente y tool móvil de alto uso
```

## Qué enviarme cuando tengas prototipos

Cuando me pases diseños o referencias, idealmente inclúyeme:

- flujo al que pertenece,
- objetivo de negocio,
- dudas de UX,
- capturas o links,
- qué se siente débil o confuso,
- qué quieres que optimicemos primero.
