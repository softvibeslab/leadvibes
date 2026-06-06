# ROVI / LeadVibes — Sprint para crear dinero

**Fecha:** 2026-05-18 02:35 EST  
**Objetivo:** convertir el activo ROVI / LeadVibes / COPIM en ingresos reales lo antes posible, sin esperar a que todo el producto esté perfecto.

## 1. Tesis directa

ROVI ya tiene suficiente base para vender **demos, pilotos pagados y membresías iniciales**. La prioridad no es construir más por construir; es empaquetar una oferta, mostrar una demo viva, cerrar primeros clientes y cobrar.

La ruta más rápida es:

1. **Vender pilotos B2B de ROVI CRM a brokers/agencias inmobiliarias.**
2. **Vender a COPIM / asociaciones el Marketplace + membresías + comunidad transaccional.**
3. **Usar el marketplace como motor de comisiones:** productos digitales, servicios y Agent Skills.

## 2. Estado operativo verificado

### Preview API

- URL verificada: `http://preview.srv1318804.hstgr.cloud:8200/api/health`
- Estado: `200 OK`
- Respuesta: `{"status":"healthy"}`

### Usuarios demo probados

- `nacional@copim.mx / demo123`
  - Estado: login correcto.
  - Rol detectado: `copim_admin`.
  - Uso: demo COPIM / asociaciones / marketplace comunitario.

- `admin@rovicrm.com / demo123`
  - Estado actual: `401 Credenciales inválidas`.
  - Acción: actualizar docs o reseed si se necesita demo ROVI interna.

- `carlos.mendoza@leadvibes.mx / demo123`
  - Estado actual: `401 Credenciales inválidas`.
  - Acción: actualizar demo broker o reseed si se usará para vender CRM inmobiliario.

## 3. Oferta que se debe vender primero

### Oferta A — Piloto ROVI CRM para broker/agencia

**Promesa:** “En 7 días te dejamos un CRM inmobiliario con tus leads cargados, pipeline visual, seguimiento y automatizaciones básicas para no perder oportunidades.”

**Precio recomendado inicial:**

- Setup piloto: **$9,900 MXN** una vez.
- Mensualidad broker: **$99 USD/mes**.
- Mensualidad agencia chica: **$299 USD/mes**.
- Mensualidad agencia grande: **$599 USD/mes**.

**Qué incluye el piloto:**

- Carga/importación inicial de leads.
- Pipeline por etapas: nuevo → contactado → calificación → presentación → apartado → venta/perdido.
- Dashboard de seguimiento.
- Scripts comerciales.
- Capacitación corta por videollamada.
- Soporte de arranque por 7 días.

**Qué NO prometer todavía:**

- Automatización completa con pagos, llamadas masivas o IA perfecta.
- Integraciones personalizadas ilimitadas.
- Desarrollo a la medida sin anticipo.

### Oferta B — COPIM Marketplace / comunidad transaccional

**Promesa:** “Convertimos la comunidad COPIM en una economía digital propia: membresías, productos, servicios, skills de IA y comisiones trazables.”

**Precio recomendado inicial:**

- Implementación / diagnóstico: **$25,000–$75,000 MXN** según alcance.
- Membresía Marketplace Pro: **$799 MXN/mes** por vendedor/miembro activo.
- Comisión por transacción: **12–15% ROVI**, según tier.

**Qué incluye:**

- Portal COPIM.
- Marketplace de productos digitales y servicios.
- Splits: creador / asociación / plataforma.
- Demo de membresías y catálogo.
- Plan de monetización por asociación.

## 4. Meta numérica inicial

Escenario mínimo razonable:

- 10 brokers en plan Estándar de $99 USD = **$990 USD MRR**.
- 5 agencias en plan Pro de $299 USD = **$1,495 USD MRR**.
- 2 agencias Enterprise de $599 USD = **$1,198 USD MRR**.
- Total SaaS inicial: **$3,683 USD MRR**.

Marketplace COPIM:

- 30 miembros Pro a $799 MXN = **$23,970 MXN MRR**.
- $150,000 MXN de volumen transaccional mensual x 15% = **$22,500 MXN/mes**.
- Total marketplace inicial: **$46,470 MXN/mes**.

## 5. Plan de acción 72 horas

### Día 1 — Preparar demo vendible

- [ ] Reparar o confirmar demo broker (`carlos.mendoza@leadvibes.mx`) o crear usuario demo nuevo.
- [ ] Reparar o confirmar demo ROVI interna (`admin@rovicrm.com`) o crear usuario demo nuevo.
- [ ] Mantener demo COPIM con `nacional@copim.mx`, ya validada.
- [ ] Preparar 2 rutas de demo:
  - Demo broker/agencia: CRM + leads + pipeline + dashboard.
  - Demo COPIM: marketplace + asociaciones + membresías.
- [ ] Crear una landing o PDF corto con 3 secciones: problema, solución, precio piloto.

### Día 2 — Prospección y cierres

- [ ] Lista de 30 prospectos inmobiliarios: brokers, agencias, desarrolladoras pequeñas.
- [ ] Lista de 10 asociaciones/comunidades/cámaras tipo COPIM.
- [ ] Enviar mensajes directos con oferta de piloto pagado.
- [ ] Agendar mínimo 5 demos.
- [ ] Cerrar mínimo 1 piloto con anticipo.

### Día 3 — Cobro y onboarding

- [ ] Crear link de pago manual: transferencia, Stripe, Mercado Pago o factura.
- [ ] Cobrar setup antes de personalizar.
- [ ] Recibir CSV/Excel de leads.
- [ ] Importar leads.
- [ ] Hacer llamada de onboarding de 45 minutos.
- [ ] Pedir testimonio o permiso para caso de uso.

## 6. Mensajes listos para vender

### DM para broker/agencia

Hola, {{nombre}}. Estoy lanzando un piloto cerrado de ROVI CRM para brokers/agencias inmobiliarias.  
La idea es simple: centralizar tus leads, darles seguimiento visual y evitar que oportunidades se pierdan por WhatsApp, Excel o falta de control.

Estoy abriendo pocos pilotos con setup inicial. En 7 días dejamos tu pipeline cargado con tus leads y una demo funcionando para tu operación.

¿Te puedo mostrar una demo rápida esta semana?

### Follow-up si responde con interés

Perfecto. La demo dura 20 minutos. Te muestro:

1. Pipeline de leads.
2. Dashboard de oportunidades.
3. Importación de CSV/Excel.
4. Cómo se vería con tu operación.

El piloto tiene setup de $9,900 MXN y después mensualidad según tamaño del equipo. Si te hace sentido después de la demo, arrancamos con tus leads.

### Mensaje para COPIM/asociaciones

Hola, {{nombre}}. Estamos desarrollando ROVI como infraestructura digital para convertir comunidades inmobiliarias en economías transaccionales: membresías, marketplace de servicios, productos digitales, skills de IA y comisiones para la asociación.

Ya tenemos una demo funcional para mostrar cómo una asociación puede monetizar su red sin perder control de datos ni depender de plataformas externas.

¿Te gustaría verla en una llamada de 20 minutos?

## 7. Guion de demo de 20 minutos

1. **Problema:** leads dispersos, seguimiento manual, oportunidades perdidas, comunidad sin monetización digital.
2. **ROVI CRM:** mostrar pipeline, dashboard y gestión de leads.
3. **COPIM Marketplace:** mostrar comunidad, productos, servicios y comisiones.
4. **Oferta piloto:** setup pagado + mensualidad.
5. **Cierre:** “Si te interesa, hoy dejamos apartado el piloto con anticipo y mañana iniciamos carga de datos.”

## 8. Checklist de cierre

Antes de invertir más horas de desarrollo, conseguir al menos uno de estos:

- [ ] 1 anticipo de broker/agencia.
- [ ] 1 carta de intención de asociación/COPIM.
- [ ] 1 piloto pagado de marketplace.
- [ ] 3 demos agendadas con decisores reales.

## 9. Prioridades técnicas que sí crean dinero

Orden recomendado:

1. **Reparar usuarios demo y rutas de demo.**
2. **Importación CSV/XLSX estable.**
3. **Vista de pipeline limpia para enseñar en demo.**
4. **Landing / propuesta con precio.**
5. **Cobro manual primero; Stripe/Mercado Pago después.**
6. **Marketplace con catálogo y splits demostrables.**

## 10. Decisión operativa

A partir de ahora, cualquier tarea técnica debe responder una pregunta:

> ¿Esto ayuda a vender, cobrar, entregar el piloto o retener al cliente?

Si la respuesta es no, se aplaza.
