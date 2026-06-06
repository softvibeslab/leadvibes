# Modulo Valuador Certificado ROVI

## Objetivo

Crear un workspace operativo para valuadores certificados y equipos inmobiliarios que necesitan estimar, justificar y auditar valores de venta/renta con evidencia de mercado, normativas urbanas y restricciones ambientales.

El modulo no sustituye un avaluo oficial. Su funcion es crear un expediente dinamico y defendible para que un valuador certificado pueda revisar, ajustar y emitir criterio profesional.

## Perfil nuevo

**Valuador Certificado**

- `account_type`: `valuation`
- `role`: `certified_valuator`
- Home: `/valuations`
- Alcance: casos de valuacion, comparables, normativas PDU/POEL, calculadora y dashboard de confianza/riesgo.

## Variables que afectan venta y renta

| Categoria | Variables |
| --- | --- |
| Fisicas | superficie de terreno, construccion, frente, fondo, edad, estado, calidad, recamaras, banos, estacionamientos, amenidades |
| Ubicacion | zona, microzona, acceso, distancia a playa/centro/transporte, servicios, seguridad, ruido, infraestructura |
| Legales | titulo, clave catastral, gravamen, regimen condominal, permisos, subdivision, licencia de uso de suelo |
| Normativas | PDU/PMDU/PPDU, POEL/POETDUM, uso permitido, COS, CUS, densidad, altura, UGA, politica ambiental, usos compatibles/restringidos |
| Mercado | comparables venta/renta, precio m2, renta m2, dias en mercado, descuento negociado, absorcion, tendencia |
| Ingresos | renta mensual, ocupacion, gastos, NOI, cap rate, estacionalidad, riesgo de plataforma/canal |
| Riesgo | fuente no verificada, restricciones ambientales, irregularidad legal, acceso/infraestructura, liquidez baja |

## Enfoques de calculo

### 1. Comparativo de mercado

Usa comparables de venta o renta y ajusta por diferencias de zona, fecha, superficie, edad, condicion, calidad, amenidades, liquidez y normativa. Es el enfoque mas intuitivo para pricing comercial.

### 2. Ingresos

Para propiedades de renta o inversion: `NOI = renta anual estabilizada - gastos operativos`; `valor = NOI / cap_rate`. El modulo usa ocupacion, gastos y cap rate como variables editables.

### 3. Costos / residual

Para terrenos, construccion nueva o mercados con pocos comparables: estima suelo + costo de reposicion depreciado, o escenarios de desarrollo si el PDU/POEL permite mayor aprovechamiento.

## Funcionalidades CRUD

- Casos de valuacion: crear, editar, archivar y recalcular expedientes.
- Normativas PDU/POEL: registrar fuentes oficiales, zonificacion, COS, CUS, densidad, altura, UGA y restricciones.
- Comparables: alta de ventas/rentas, fuentes, precio, m2, fecha, zona y score de calidad.
- Dashboard: KPIs de valor estimado, confianza, riesgo normativo, comparables activos y dispersion.
- Calculadora dinamica: recalcula low/base/high, renta sugerida, precio m2, yield y confidence score.

## Valor para ROVI

- Agrega un perfil profesional vendible: valuador certificado.
- Convierte datos de brokers/inmobiliarias en inteligencia de precios.
- Permite a COPIM/asociaciones ofrecer servicios premium de valuacion.
- Alimenta marketplace con servicios certificados y reportes.
- Mejora confianza en captacion, pricing, negociacion y cierre.

## Fuentes base

- INDAABIN, metodologia de servicios valuatorios para valor comercial de inmuebles.
- DOF, enfoques de valuacion de costo, ingresos y mercado.
- SEMARNAT, ordenamiento ecologico.
- Municipio de Tulum, Bitacora Ambiental POEL.
- Municipio de Tulum, Plan Municipal de Desarrollo 2024-2027.
