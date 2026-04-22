# Rovi Pocket — Guía de Repo Independiente y Submódulo

## Objetivo

Crear `Rovi Pocket` como producto independiente, pero mantenerlo conectado al repo principal `leadvibes` de forma controlada.

La mejor ruta para este caso es:

- arrancar el subproyecto dentro del repo principal,
- extraerlo después a un repo propio,
- reinsertarlo como `git submodule`.

Esto evita bloquear el trabajo inicial mientras todavía estamos definiendo UX, arquitectura y alcance.

## Estructura recomendada

```text
leadvibes/
├── backend/
├── frontend/
├── docs/
└── apps/
   └── rovi-pocket/
```

## Estrategia recomendada por fases

## Fase 1 — Semilla local en el repo principal

Usar:

```text
apps/rovi-pocket/
```

para:

- documentación,
- arquitectura,
- flows,
- prompts de diseño,
- bootstrap inicial del app shell.

Ventaja:

- velocidad.
- un solo contexto técnico mientras definimos el MVP.

## Fase 2 — Extraer historial a repo independiente

Cuando el folder `apps/rovi-pocket` ya tenga una base útil:

```bash
git subtree split --prefix=apps/rovi-pocket -b rovi-pocket-split
```

Después crear el repo remoto, por ejemplo:

```text
https://github.com/softvibeslab/rovi_pocket.git
```

Y empujar:

```bash
git push https://github.com/softvibeslab/rovi_pocket.git rovi-pocket-split:main
```

Resultado:

- el subproyecto queda con su propio historial limpio,
- sin arrastrar todo el historial del repo principal.

## Fase 3 — Reconectar como submódulo

Una vez validado el repo remoto:

1. quitar el folder trackeado del repo principal:

```bash
git rm -r apps/rovi-pocket
git commit -m "chore: remove local rovi-pocket folder before submodule"
```

2. agregar el repo independiente como submódulo:

```bash
git submodule add https://github.com/softvibeslab/rovi_pocket.git apps/rovi-pocket
git submodule update --init --recursive
git commit -m "chore: add rovi-pocket as submodule"
```

## Flujo para clonar y trabajar después

Para cualquier colaborador:

```bash
git clone <repo-principal>
cd leadvibes
git submodule update --init --recursive
```

Para actualizar el submódulo:

```bash
cd apps/rovi-pocket
git pull origin main
cd ../..
git add apps/rovi-pocket
git commit -m "chore: bump rovi-pocket submodule"
```

## Convención recomendada de ownership

| Repositorio | Responsabilidad |
|-------------|-----------------|
| `leadvibes` | backend compartido, documentación, infraestructura, contratos, integración |
| `rovi-pocket` | app Expo, UX mobile, navegación, pantallas, offline, push, UI |

## Qué compartir entre ambos

Se recomienda compartir a nivel de contrato, no de acoplamiento fuerte:

- OpenAPI / endpoints Pocket API
- modelos JSON del planner IA
- eventos de analytics
- tokens de diseño
- assets compartidos de marca

## Qué no compartir directamente

- componentes UI del frontend web actual,
- navegación del CRM web,
- lógica de campañas masivas,
- módulos de agencia.

## Decisiones recomendadas para arrancar

### Si queremos velocidad máxima

- trabajar Sprint 0 y Sprint 1 dentro de `apps/rovi-pocket`,
- extraer a repo independiente al cierre de Sprint 1.

### Si ya existe el repo remoto hoy

Podemos saltarnos la fase temporal y empezar directamente como repo separado + submódulo.

## Estado actual en este repo

Actualmente ya quedó preparado lo siguiente:

- existe el folder local `apps/rovi-pocket/`,
- se inicializó como repo Git independiente,
- se publicó el commit semilla en `https://github.com/softvibeslab/rovi_pocket.git`,
- y quedó registrado como submódulo en el repo principal.

Pendiente en el repo principal:

- hacer commit de `.gitmodules`
- hacer commit del gitlink `apps/rovi-pocket`

## Recomendación práctica

Mi recomendación para este equipo es:

1. diseñar y definir Pocket en local dentro de `apps/rovi-pocket`,
2. cerrar el diseño base y el app shell,
3. crear el repo independiente,
4. convertirlo a submódulo antes de entrar a Sprint 2.

Así mantenemos velocidad sin perder orden.
