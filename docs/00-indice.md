# Guía de construcción — Frontend React + TS contra API REST

Documentación **en orden de construcción**: si sigues los archivos del 01 al 09 de corrido, terminas con el proyecto completo. Cada paso explica *qué* escribir, *por qué* así, y *cómo verificar* que quedó bien antes de pasar al siguiente.

Todo el código aquí es el que está realmente en `src/` de este repo, no pseudocódigo.

## Orden de trabajo

| # | Paso | Tiempo | Archivo |
|---|---|---|---|
| 01 | Preparación y reconocimiento del backend | 20 min | [01-preparacion.md](./01-preparacion.md) |
| 02 | Tipado | 30 min | [02-tipado.md](./02-tipado.md) |
| 03 | Capa API: storage, interceptores, errores, servicios | 45 min | [03-capa-api.md](./03-capa-api.md) |
| 04 | Auth y sesión | 45 min | [04-auth-sesion.md](./04-auth-sesion.md) |
| 05 | RBAC y rutas protegidas | 45 min | [05-rbac-rutas.md](./05-rbac-rutas.md) |
| 06 | Hooks genéricos | 30 min | [06-hooks.md](./06-hooks.md) |
| 07 | CRUD y formulario reutilizable | 120 min | [07-crud-ui.md](./07-crud-ui.md) |
| 08 | Resiliencia y testing | 45 min | [08-resiliencia-testing.md](./08-resiliencia-testing.md) |
| 09 | Verificación final y defensa | 25 min | [09-verificacion-defensa.md](./09-verificacion-defensa.md) |
| 10 | Retrospectiva de la primera pasada | — | [10-retrospectiva.md](./10-retrospectiva.md) |

Total planificado: **6:45** de un presupuesto de 8 h. El margen sobrante es para lo que no se puede prever.

## La regla que gobierna todo

**No pulas un módulo mientras otro siga en cero.** Un criterio ausente no puntúa nada; uno a medias sí. Si vas corto de tiempo, salta a llenar los ceros y vuelve después.

## Dependencias entre pasos

```
01 Preparación
     ↓
02 Tipado ──────────────┐
     ↓                  │
03 Capa API             │
     ↓                  │
04 Auth ────→ 05 RBAC   │
     ↓                  │
06 Hooks ←──────────────┘
     ↓
07 CRUD ──→ 08 Resiliencia ──→ 09 Verificación
```

El paso 06 es la bisagra: media hora ahí convierte el paso 07 en repetición de un molde. Si lo saltas, el CRUD se vuelve tres veces más largo.

## Pendiente conocido en este repo

`src/services/authService.ts` → la función `logout()` todavía llama a `tokenStorage.remove()` y hace `return data`, rompiendo la separación de capas. La versión correcta está en [04-auth-sesion.md](./04-auth-sesion.md). Corrígelo cuando lo retomes.
