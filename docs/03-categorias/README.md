# Módulo 3 — Categorías (estado actual: apenas iniciado)

Este módulo tiene dos archivos de servicio, uno vacío y otro con bugs reales. Se documenta tal cual está — no se ha empezado a construir la UI (listado, formulario, etc.) todavía.

---

## `src/services/categoryService.ts`

Archivo completamente vacío. Parece un intento abandonado — probablemente el primer nombre que le diste antes de crear `categoryServiceAxios.ts`. No lo borres sin confirmarlo tú mismo (por si tenías planeado usarlo para algo distinto, como una versión con `fetch` en vez de `axios`), pero si no tienes un plan claro para él, es candidato a eliminar para no tener dos archivos con nombres casi iguales.

---

## `src/services/categoryServiceAxios.ts`

```ts
import { api } from "../lib/axiosConfig"
import type { Category } from "../types/Category"

export async function getCategories(): Promise<Category[]> {
  try {
    const response = await api.get<Category[]>("/categories")
    return response.data
  } catch (error) {
    throw new Error("Joa mani no me tocaba")
  }
}

export async function postCategories(): Promise<Category[]> {
  try {
    const response = await api.get<Category[]>("/categories")
    return response.data
  } catch (error) {
    throw new Error("Joa mani no me tocaba")
  }
}
```

### `getCategories` — la forma general está bien
`api.get<Category[]>("/categories")` es correcto: el backend confirma que `GET /categories` devuelve `Category[]` directo (sin paginar, sin envolver). El patrón `try { ... } catch { ... }` con `async/await` también es correcto en estructura.

### 🔴 Pendiente #1 — `postCategories` no hace un POST

```ts
export async function postCategories(): Promise<Category[]> {
  const response = await api.get<Category[]>("/categories")  // ← esto es un GET
  // ...
}
```

El nombre dice `post` pero el cuerpo hace `api.get`. Además, no recibe ningún parámetro — una función para *crear* una categoría necesita recibir los datos de la categoría a crear (usa el tipo `CreateCategory` que ya tienes en `types/Category.ts`) y mandarlos en el body:

```ts
// forma correcta (pseudocódigo, complétalo tú):
export async function postCategories(dto: CreateCategory): Promise<Category> {
  const response = await api.post<Category>("/categories", dto)
  return response.data
}
```

Nota que también cambia el tipo de retorno: crear **una** categoría devuelve **una** `Category`, no un arreglo `Category[]`.

### 🔴 Pendiente #2 — el `catch` esconde el error real

```ts
catch (error) {
  throw new Error("Joa mani no me tocaba")
}
```

Este es el problema más importante de los dos, porque rompe directamente un requisito de la rúbrica: *"try/catch/finally... distinguiendo error de red, error de validación (400/409/404), y no autorizado (401/403)"*.

Ahora mismo, sin importar si el error fue una caída de red, un `400` de validación, o un `401` de sesión vencida, **todos** terminan convertidos en el mismo `Error` genérico con un mensaje de broma que no dice nada sobre qué pasó. Perdiste el `error.response.status` que traía la información real.

Recuerda lo que vimos en `axiosConfig.ts`: el interceptor de response ya hace `Promise.reject(error)` para que el error original (con su `status`, su `message` del backend, etc.) llegue completo hasta aquí. Este `catch` lo está tirando a la basura y reemplazándolo por un mensaje inventado.

No se te da la solución completa aquí (es exactamente el patrón de `request<T>` con `ApiError`/`NetworkError` que ya conversamos conceptualmente) — pero ten claro que **este archivo es el ejemplo perfecto de por qué ese diseño importa**: sin distinguir el tipo de error, no puedes mostrarle al usuario un mensaje útil ("ya existe una categoría con ese nombre" vs. "no tienes permiso" vs. "revisa tu conexión").

---

## Resumen de pendientes del Módulo 3

| Archivo | Pendiente | Severidad |
|---|---|---|
| `categoryService.ts` | Archivo vacío, decidir si se borra o se usa | ⚠️ |
| `categoryServiceAxios.ts` | `postCategories` usa `api.get` en vez de `api.post`, y no recibe el DTO a crear | 🔴 |
| `categoryServiceAxios.ts` | Los `catch` descartan el `status` real del error con un mensaje genérico | 🔴 |

Esto no bloquea tu trabajo de mañana (que es Módulo 2 / `AuthContext`), pero queda documentado para cuando retomes categorías.
