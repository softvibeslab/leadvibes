# Rovi Pocket - Kit Visual para Canva o Figma

Fecha de referencia: 8 de abril de 2026
Producto: `ROVI Pocket`
Base de trabajo: branding plan del repo, manual de marketing existente y design system exportado desde Stitch.

## Objetivo del kit

Dejar un sistema visual ejecutable para que diseno monte una libreria unica en Canva o Figma sin reinterpretar la marca en cada pieza.

## North Star visual

Tomar la direccion de producto definida en Stitch y bajarla a marketing:

- concepto: `Digital Concierge`
- estetica: `Tactical Editorial`
- sensacion: premium, silenciosa, rapida, clara
- analogia: reloj suizo, HUD de auto premium, centro operativo de bolsillo

## Principios que no se negocian

- Nada de look "template generico SaaS".
- Nada de cajas con borde de `1px` por todos lados.
- Todo debe verse mobile-first aunque la pieza viva en social.
- Los visuales deben hablar de accion y criterio, no de lujo decorativo.
- Un buen asset debe poder entenderse en menos de `3` segundos.

## Paleta aprobada

### Paleta Pocket primaria

| Token | Hex | Uso |
|------|-----|-----|
| Deep Space | `#0C0E11` | fondo principal, base premium |
| Electric Emerald | `#3FFF8B` | CTA, highlights, estados positivos |
| Emerald Gradient End | `#13EA79` | degradado de botones y brillos |
| Soft Cobalt | `#929BFA` | data, indicadores, soporte IA |
| Soft White | `#F9F9FD` | texto principal sobre fondos oscuros |

### Paleta de soporte Rovi

| Token | Hex | Uso |
|------|-----|-----|
| Sand | `#E7E5E4` | piezas claras, fondos editoriales secundarios |
| Amber | `#D97706` | urgencia, countdown, webinar badges |

## Tipografia

- Headline principal: `Manrope Bold`
- Subheadline: `Manrope SemiBold`
- Body y labels: `Inter`
- Fallback operativo si un template viejo ya usa la marca madre: `Montserrat` para titulares

## Reglas tipograficas

- Todo cargado a la izquierda; no centrar por defecto.
- Titular corto, una promesa por slide.
- Evitar bloques largos de texto.
- Nunca usar blanco puro.
- Si el layout se siente apretado, quitar contenedores antes de reducir texto.

## Composicion

- usar asimetria intencional,
- trabajar por capas tonales, no por lineas,
- apoyar la jerarquia con escala tipografica y espacios,
- mantener una "spine" visual izquierda para escaneo rapido,
- guardar la accion principal en la zona natural del pulgar cuando se use UI del producto.

## Motivos visuales aprobados

- mockups de celular con UI de Pocket,
- recortes de cards, chips, timelines y agenda,
- brillo verde suave tipo pantalla,
- fondos oscuros con profundidad tonal,
- mapas, propiedades o contexto inmobiliario solo cuando aporten al mensaje,
- fotografia con manos, celular, movimiento y contexto real de trabajo.

## Motivos visuales prohibidos

- mansiones o renders de lujo sin contexto operativo,
- apretones de manos,
- stock de oficina generico,
- fondos morados sobre blanco,
- iconografia ilustrada infantil o excesivamente "startup".

## Sistema de templates

### Perfil y encamizado

- avatar maestro,
- cover de LinkedIn,
- cover de Facebook,
- banner de YouTube,
- portada destacada para webinar,
- set de highlights / portadas de stories.

### Contenido evergreen

- carrusel `Problema -> Claridad -> Accion`,
- carrusel `Mito -> Realidad -> Siguiente paso`,
- quote card con insight tactico,
- comparativa `Antes / Despues`,
- reel cover,
- short cover,
- story `poll`,
- story `countdown`,
- story `CTA`.

### Lanzamiento y webinar

- asset hero de registro,
- speaker card,
- countdown `T-7 / T-3 / T-1`,
- reminder de ultimo lugar,
- replay card,
- CTA final a demo,
- thumbnail de YouTube,
- slide master para deck de webinar.

### WhatsApp Business

- status vertical,
- card cuadrada para reenviar,
- card `demo disponible`,
- card `replay`,
- card `pregunta / respuesta`.

## Tamano de mesas de trabajo y exportacion

Usar estas medidas base para el archivo maestro.

| Activo | Tamano recomendado | Nota |
|-------|--------------------|------|
| Avatar universal master | `1080 x 1080` | mantener logo o simbolo centrado por crop circular |
| Instagram feed vertical | `1080 x 1350` | formato principal del sistema |
| Instagram story / reel cover | `1080 x 1920` | usar area segura central para texto |
| Facebook story | `1080 x 1920` | reutilizable desde story master |
| LinkedIn logo de pagina | `400 x 400` | pagina empresa |
| LinkedIn cover de pagina | `4200 x 700` | mantener texto lejos de bordes |
| LinkedIn post con enlace | `1200 x 627` | ideal para assets de trafico |
| Facebook perfil | `320 x 320` | export cuadrado desde avatar master |
| Facebook cover | `851 x 315` | dejar texto en centro seguro |
| YouTube perfil | `800 x 800` | export cuadrado centrado |
| YouTube banner | `2560 x 1440` | texto y logo dentro del area segura central |
| YouTube thumbnail | `1280 x 720` | una idea, una cara o una UI, un CTA corto |
| WhatsApp status | `1080 x 1920` | usar el mismo sistema de stories |
| WhatsApp profile master | `1080 x 1080` | export cuadrado centrado |

## Areas seguras recomendadas

- En assets `9:16`, mantener headline, logo y CTA dentro del bloque central seguro.
- En Instagram Stories, considerar una zona segura aproximada de `1080 x 1610` para no tapar texto con interfaz.
- En YouTube banner, concentrar todo el texto y el logo en la franja central visible en todos los dispositivos.
- En avatars circulares, no acercar ningun elemento clave al borde.

## Estructura sugerida del archivo maestro

### Si se construye en Figma

- `00 Foundations`
- `01 Brand Tokens`
- `02 Profile Assets`
- `03 Social Templates`
- `04 Webinar Launch`
- `05 Motion Covers`
- `06 Export Queue`

### Si se construye en Canva

- `Brand Kit`
- `Perfiles`
- `Carruseles`
- `Stories y Reels`
- `Webinar`
- `YouTube`
- `WhatsApp`

## Convencion de nombres

Usar este formato:

`ROVIPOCKET_[canal]_[asset]_[tamano]_v01`

Ejemplos:

- `ROVIPOCKET_ig_carousel_pain_1080x1350_v01`
- `ROVIPOCKET_linkedin_cover_4200x700_v01`
- `ROVIPOCKET_youtube_banner_2560x1440_v01`

## Checklist del kit minimo viable

- avatar maestro exportado,
- covers de LinkedIn, Facebook y YouTube,
- 3 templates de carrusel,
- 3 templates de story,
- 2 reel covers,
- 1 hero visual de webinar,
- 1 thumbnail de YouTube,
- 1 set de status de WhatsApp,
- deck master de webinar,
- carpeta de exports lista por canal.

## Prompt maestro para Canva

```text
Crea un kit visual para una marca llamada ROVI Pocket, un CRM de bolsillo para brokers individuales de real estate en Mexico.

Direccion creativa:
- premium, rapido, silencioso, mobile-first
- estetica tactical editorial
- fondos oscuros con profundidad tonal
- acento verde electrico y azul suave
- titulares grandes en Manrope, cuerpo en Inter
- nada de look SaaS generico ni fotos stock vacias

Necesito:
- avatar principal
- cover para LinkedIn, Facebook y YouTube
- 3 templates de carrusel 1080x1350
- 3 templates de story 1080x1920
- 2 covers para reel / Shorts
- hero visual para webinar
- thumbnail para YouTube
- card cuadrada para WhatsApp

Cada template debe dejar espacio claro para headline, captura de producto, badge y CTA.
```

## Prompt maestro para Figma

```text
Construye un archivo maestro de branding para ROVI Pocket con paginas para Foundations, Profile Assets, Social Templates, Webinar Launch y Export Queue.

La marca debe sentirse como un Digital Concierge para brokers individuales:
- premium, editorial, clara y nada ruidosa
- mobile-first
- con fondos Deep Space (#0C0E11), acentos Electric Emerald (#3FFF8B) y Soft Cobalt (#929BFA)
- tipografia Manrope para headlines e Inter para body
- composicion asimetrica y jerarquia por capas tonales, no por bordes

Crear:
- avatar maestro
- cover de LinkedIn, Facebook y YouTube
- templates 1080x1350 para carruseles
- templates 1080x1920 para stories y reels
- hero de webinar
- thumbnail de YouTube
- card de WhatsApp

Todos los componentes deben ser reutilizables y quedar listos para exportacion por canal.
```

## Fuentes de referencia usadas para este kit

- Design system exportado de Stitch en `apps/rovi-pocket/design/stitch/.../design-system.md`
- LinkedIn Page image specs oficiales
- YouTube Help para banner y profile picture
- Guia actualizada de tamanos 2026 de Hootsuite para assets sociales y formatos mobile-first
