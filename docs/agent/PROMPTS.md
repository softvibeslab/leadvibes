# Prompts Operativos

## Analisis De Feature

```text
Actua como agente experto Rovi. Analiza esta feature contra SOUL.md, MODULE_MAP.md y PLAYBOOK.md.
Devuelve: dominio afectado, archivos a leer, riesgos de tenant/auth, rutas frontend/backend, pruebas minimas y plan de implementacion.
Feature: <descripcion>
```

## Revision De Permisos

```text
Revisa esta ruta o pantalla de Rovi para permisos multi-workspace.
Confirma: account_type permitido, active_workspace.tenant_type, rol, tenant_id usado en queries, redirects frontend y casos que deben bloquearse.
Archivo/ruta: <archivo o endpoint>
```

## Debug De Endpoint

```text
Diagnostica este fallo de endpoint Rovi.
Incluye: ruta real /api, modelo Pydantic esperado, dependencia auth, query Mongo, serializacion, integraciones externas y comando curl de verificacion.
Error: <error>
Endpoint: <endpoint>
```

## QA Preview

```text
Prepara checklist QA preview para este cambio Rovi.
Incluye usuarios preview, pantallas, endpoints, datos esperados, regresiones a vigilar y comandos de smoke.
Cambio: <descripcion>
```

## Actualizacion De Wiki

```text
Actualiza la wiki del agente Rovi con este hallazgo.
Debe quedar en el archivo correcto de docs/agent, con regla practica, archivos fuente y riesgo si se ignora.
Hallazgo: <hallazgo>
```

