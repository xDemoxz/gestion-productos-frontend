# Índice de documentación — Simulacro Gestión de Productos

Este es el mapa de todo lo construido hasta ahora, organizado según los 6 módulos que define `CLAUDE.md`. Cada archivo documenta **el código tal como está escrito hoy** (no una versión "mejorada" ni con patrones que aún no hemos visto), con comentarios línea por línea, y cierra con una sección aparte marcando qué falta corregir.

## Leyenda de marcadores

| Marcador | Significado |
|---|---|
| ✅ | Correcto, ya lo entendiste, no lo toques |
| ⚠️ | Funciona, pero es mejorable (cosmético o de estilo, no urgente) |
| 🔴 | Bug real o pendiente que debes resolver antes de seguir avanzando |

## Estado por módulo

| # | Módulo (según CLAUDE.md) | Estado actual | Documentación |
|---|---|---|---|
| 1 | Tipado (`User`, `Product`, `Category`, `AuthResponse`, `Pagination<T>`) | Avanzado, con pendientes menores | [`01-tipado/README.md`](./01-tipado/README.md) |
| 2 | Auth y sesión (`AuthContext`, interceptores, rutas) | En construcción — falta RBAC y páginas reales | [`02-auth/`](./02-auth/) (5 archivos) |
| 3 | Categorías (CRUD, admin-only en mutaciones) | Apenas iniciado, con bugs | [`03-categorias/README.md`](./03-categorias/README.md) |
| 4 | Productos (CRUD paginado) | No iniciado | — |
| 5 | Favoritos | No iniciado | — |
| 6 | Manejo de errores + Error Boundary + testing | No iniciado | — |

Cuando avances en los módulos 4, 5 y 6 creamos su carpeta de documentación con el mismo formato — no se generó contenido para ellos porque todavía no existe código que documentar (documentar código que no existe sería inventar, no enseñar).

## Cómo usar esto

1. Lee las carpetas en orden (1 → 2 → 3), cada archivo es corto a propósito.
2. Cada archivo termina con una lista de "Pendientes" marcados con 🔴 o ⚠️ — esos son tu checklist real.
3. Los bloques "🧠 Pregúntate" son para que te autoevalúes en voz alta antes de la sesión de debugging en vivo — si no puedes responderlos sin mirar la respuesta, repasa esa sección.
