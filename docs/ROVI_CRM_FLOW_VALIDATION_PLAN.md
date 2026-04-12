# Rovi CRM - Plan de Validacion de Flujos

Fecha de corte: 8 de abril de 2026
Base de referencia: mapeo de flujos consolidado a partir de los audios 1 al 10 y su cruce con la documentacion operativa y de marketing del repositorio.

## Objetivo del plan

Validar que los flujos principales de `Rovi CRM` funcionan como una experiencia conectada y no como modulos aislados.

Este plan busca confirmar:

- coherencia entre onboarding, CRM y automatizaciones,
- utilidad real de la IA dentro del trabajo del broker,
- continuidad entre captura, seguimiento, campanas y analitica,
- alineacion entre lo que el producto promete y lo que los flujos realmente permiten ejecutar.

## Resultado esperado

Al finalizar la validacion, el equipo debe poder responder con evidencia:

- si un broker puede entrar y configurar Rovi sin soporte manual,
- si puede cargar leads e inventario y empezar a operar,
- si puede priorizar, dar seguimiento y automatizar,
- si puede medir resultados desde dashboards y campañas,
- si la experiencia soporta la narrativa comercial usada en contenido y venta.

## Alcance

### Flujos incluidos

1. Onboarding y configuracion
2. Pipeline y gestion de leads
3. Inventario / productos
4. Inbox omnicanal y priorizacion
5. Automatizaciones y campanas
6. Productividad: calendario y scripts
7. Analiticas

### Fuera de alcance en esta ronda

- performance tecnica profunda,
- hardening de seguridad,
- testeo de billing o monetizacion,
- validacion legal de integraciones externas.

## Personas de validacion

### Persona A - Broker nuevo

- llega sin estructura previa,
- necesita onboarding guiado,
- depende de prompts y automatizaciones iniciales,
- valida claridad de activacion.

### Persona B - Broker experimentado high-ticket

- ya tiene proceso comercial,
- espera personalizacion, velocidad y tono premium,
- valida la calidad del perfilamiento, scripts y recomendaciones IA.

### Persona C - Usuario trial

- entra con limites y plantillas predeterminadas,
- valida restricciones del free trial,
- confirma que el producto aun entrega valor antes de pagar.

### Persona D - Coordinacion comercial / marketing

- revisa campañas, bandeja unificada y dashboards,
- valida trazabilidad y lectura de rendimiento.

## Criterios de entrada

- ambiente operativo accesible,
- credenciales o metodo de registro disponible,
- integraciones minimas conectadas o mockeadas de forma controlada,
- datos de prueba listos para leads, inventario y mensajes,
- responsables asignados para documentar hallazgos.

## Evidencia a capturar

Para cada flujo, documentar:

- objetivo del flujo,
- resultado esperado,
- evidencia visual,
- hallazgos,
- bloqueo o friccion,
- impacto en producto, marketing o ventas,
- decision: `Pasa`, `Pasa con observaciones` o `No pasa`.

## Ruta critica de validacion

Secuencia recomendada:

1. Onboarding y configuracion
2. Pipeline y gestion de leads
3. Inventario
4. Inbox omnicanal y priorizacion
5. Automatizaciones y campanas
6. Calendario y scripts
7. Analiticas

No conviene validar automatizaciones o dashboards antes de confirmar que el dato origen entra bien desde onboarding, leads e inventario.

## Matriz de validacion por flujo

### 1. Onboarding y configuracion

Objetivo:
confirmar que el broker puede entrar, definir contexto y dejar a la IA calibrada para recomendaciones utiles.

Casos a validar:

- registro inicial con datos basicos,
- captura de KPIs y metas,
- perfilamiento por experiencia, estilo, tipo de propiedad y zona,
- modificacion posterior de metas y configuraciones,
- alta o revision de integraciones.

Criterio de aceptacion:

- el usuario entiende que debe capturar y por que,
- las metas impactan la configuracion o narrativa del sistema,
- el cambio posterior de KPIs recalibra expectativas del flujo,
- no hay campos ambiguos o redundantes.

### 2. Pipeline y gestion de leads

Objetivo:
confirmar que el broker puede mover oportunidades, enriquecerlas y operar sobre ellas sin romper contexto.

Casos a validar:

- vista Kanban por etapas,
- edicion de presupuesto y propiedades del lead,
- alta de propiedades personalizadas,
- calendarizacion de actividades desde el mismo flujo,
- lectura de valor frente a competidores.

Criterio de aceptacion:

- el lead puede avanzar de estado con claridad,
- el usuario entiende la cualificacion del lead,
- la IA o la accion manual no genera friccion,
- la actividad queda visible y con contexto.

### 3. Inventario / productos

Objetivo:
confirmar que el inventario soporta el trabajo comercial diario sin desorden.

Casos a validar:

- segmentacion por tipo de operacion,
- uso de SKU o identificador consistente,
- ubicacion por Google Maps,
- thumbnails o preview visual,
- importacion y exportacion por CSV.

Criterio de aceptacion:

- el usuario no pierde trazabilidad entre propiedad y lead,
- la importacion masiva no rompe estructura,
- la visualizacion facilita contexto comercial rapido.

### 4. Inbox omnicanal y priorizacion

Objetivo:
confirmar que la bandeja unificada realmente ayuda a decidir a quien contactar y con que contexto.

Casos a validar:

- lectura de historial por lead,
- concentracion de WhatsApp, correo y SMS,
- clasificacion de chats activos,
- sugerencias IA de top leads,
- continuidad entre inbox y pipeline.

Criterio de aceptacion:

- el usuario entiende la prioridad sin tener que reconstruirla manualmente,
- el historial conversacional se siente centralizado,
- las recomendaciones IA son accionables y no decorativas.

### 5. Automatizaciones y campanas

Objetivo:
confirmar que Rovi puede ejecutar y medir seguimientos tacticos y automaciones basicas.

Casos a validar:

- visualizacion tabular de campañas,
- uso de SMS y email con apoyo IA,
- medicion de apertura, estado y conversion,
- plantillas de n8n para free trial,
- limites de envio y entendimiento del usuario sobre esos limites.

Criterio de aceptacion:

- el usuario sabe que automaciones estan corriendo,
- entiende que plantillas tiene disponibles,
- puede diferenciar campaña tactica de automatizacion recurrente,
- la experiencia no se siente opaca o demasiado tecnica.

### 6. Productividad: calendario y scripts

Objetivo:
confirmar que el producto ayuda al broker a ejecutar mejor su dia, no solo a registrar informacion.

Casos a validar:

- calendario por dia y semana,
- relacion entre eventos, leads y prioridades,
- uso de scripts de apertura y seguimiento,
- edicion de templates de correo,
- continuidad entre recomendacion IA y script sugerido.

Criterio de aceptacion:

- el calendario refleja accion diaria real,
- los scripts se sienten utiles y editables,
- existe conexion clara entre productividad e impacto comercial.

### 7. Analiticas

Objetivo:
confirmar que los dashboards permiten leer desempeno y tomar decisiones.

Casos a validar:

- integracion de fuentes externas,
- filtros por fecha y etiquetas,
- lectura de metricas clave,
- relacion entre campañas, inbox y conversion,
- utilidad para broker y para lider comercial.

Criterio de aceptacion:

- el usuario entiende que esta viendo,
- puede responder preguntas operativas reales,
- existe trazabilidad entre actividad y resultado.

## Orden de ejecucion sugerido

### Fase 1 - Activacion

- onboarding,
- configuracion,
- integraciones,
- perfilamiento.

### Fase 2 - Operacion core

- inventario,
- leads,
- pipeline,
- bandeja.

### Fase 3 - Ejecucion y seguimiento

- automatizaciones,
- campanas,
- calendario,
- scripts.

### Fase 4 - Medicion

- dashboards,
- cruces de datos,
- lectura de conversion.

## Hallazgos que deben etiquetarse

- `bloqueo funcional`
- `friccion UX`
- `friccion de copy o educacion`
- `promesa comercial no soportada`
- `dato incompleto o inconsistente`
- `integracion no confiable`
- `mejora futura`

## Preguntas de validacion clave

- El onboarding prepara de verdad al sistema para ayudar al broker?
- El pipeline y el inbox se sienten conectados o separados?
- La IA recomienda algo util o solo acompana visualmente?
- Las automatizaciones se entienden y se controlan?
- Los scripts y campanas cumplen lo que el marketing promete?
- Las analiticas explican el negocio o solo muestran datos?

## Cruce con la narrativa de marketing

### "Automatiza y Vende"

Debe quedar validado por:

- plantillas activas,
- seguimiento automatico visible,
- capacidad real de medicion.

### "Lead o No Lead"

Debe quedar validado por:

- score o priorizacion,
- cambios en pipeline,
- lectura clara del historial y presupuesto.

### "Emails que Convierten"

Debe quedar validado por:

- editor o templates funcionales,
- uso de scripts,
- posibilidad de programar o lanzar secuencias.

### "Experiencia Premium"

Debe quedar validado por:

- onboarding sensible al tipo de broker,
- tono y estilo personalizable,
- utilidad para high-ticket y perfiles internacionales.

## Salida esperada

Al cierre de la validacion se debe publicar:

- resumen ejecutivo de hallazgos,
- matriz de estado por flujo,
- decision de `listo / no listo / listo con condiciones`,
- backlog de correcciones priorizado,
- recomendaciones para producto, marketing y ventas.
