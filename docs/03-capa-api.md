# 03 — Capa API (45 min)

Los interceptores y las clases de error son **una sola unidad de trabajo**, no dos: resuelven el mismo problema — que el error llegue completo hasta quien lo tiene que mostrar.

## 3.1 · `lib/tokenStorage.ts`

```ts
export const TOKEN_KEY = "accessToken"

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  remove: (): void => localStorage.removeItem(TOKEN_KEY)
}
```

Envolver `localStorage` en tres funciones centraliza la decisión: cambiar a `sessionStorage` es editar **un** archivo.

**Justificación que te van a pedir:** `localStorage` sobrevive al cierre de la pestaña (la sesión persiste entre visitas); `sessionStorage` muere con ella, reduciendo la ventana de exposición en equipos compartidos. Es decisión de producto — lo que evalúan es que la puedas defender.

## 3.2 · `lib/errors.ts`

```ts
import axios from "axios"

export class NetworkError extends Error {
  constructor(message = "No se pudo conectar con el servidor") {
    super(message)
    this.name = "NetworkError"
  }
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)          // sin esto, message y stack quedan mal formados
    this.name = "ApiError"
    this.status = status
  }

  get isValidation(): boolean {
    return this.status === 400 || this.status === 404 || this.status === 409
  }

  get isAuth(): boolean {
    return this.status === 401 || this.status === 403
  }
}

export function toAppError(error: unknown): NetworkError | ApiError {
  if (error instanceof NetworkError || error instanceof ApiError) return error

  if (axios.isAxiosError(error)) {
    // Sin response = la petición nunca llegó al servidor (caído, CORS, sin red).
    if (!error.response) return new NetworkError()

    const data = error.response.data as { message?: string | string[] } | undefined
    const raw = data?.message
    // NestJS devuelve message como string[] cuando falla class-validator.
    const message = Array.isArray(raw) ? raw.join(". ") : raw

    return new ApiError(message ?? `Error ${error.response.status}`, error.response.status)
  }

  return new NetworkError("Ocurrió un error inesperado")
}

export function getErrorMessage(error: unknown): string {
  return toAppError(error).message
}
```

### Por qué dos clases y no una

Un error de red **no tiene status** — nunca hubo respuesta. Un rechazo de la API sí. Unificarlas obliga a `status?: number` y a preguntar "¿existe status?" en cada `catch`, en vez de preguntar directamente `instanceof`.

### La distinción clave

`fetch`/`axios` **solo lanzan excepción cuando la red falla de verdad**. Un 404 o un 401 son respuestas válidas, con status malo — no rechazan la promesa por esa vía. Por eso `!error.response` es exactamente el discriminador entre "no llegó" y "llegó mal".

## 3.3 · `lib/axiosConfig.ts`

```ts
import axios from "axios"
import { tokenStorage } from "./tokenStorage"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

// Antes de cada petición: adjunta el gafete si lo hay.
api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Después de cada respuesta: 401 = sesión vencida.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.remove()
      window.location.href = "/login"
    }
    return Promise.reject(error)   // ← imprescindible
  }
)
```

**Analogía:** `api` es una línea telefónica ya configurada. El interceptor de request es un guardia que te cuelga el gafete al salir; el de response es quien te avisa que el gafete venció.

**El `Promise.reject(error)` no es opcional.** Sin él, el error se consume ahí y el `catch` de quien llamó nunca corre — el código de arriba cree que todo salió bien. El interceptor **observa y actúa, pero no consume**.

Gracias a esto, ningún servicio adjunta el token a mano ni maneja 401 por su cuenta.

## 3.4 · Servicios

Sin React, sin storage. Reciben argumentos, devuelven datos, lanzan errores tipados.

### `services/productService.ts` — el molde

```ts
import { api } from "../lib/axiosConfig"
import { toAppError } from "../lib/errors"
import type { Pagination } from "../types/Pagination"
import type { CreateProduct, Product, ProductQuery, UpdateProduct } from "../types/Product"

export async function getProducts(query: ProductQuery = {}): Promise<Pagination<Product>> {
  try {
    const { data } = await api.get<Pagination<Product>>("/products", { params: query })
    return data
  } catch (error) {
    throw toAppError(error)
  }
}

export async function getProduct(id: string): Promise<Product> {
  try {
    const { data } = await api.get<Product>(`/products/${id}`)
    return data
  } catch (error) {
    throw toAppError(error)
  }
}

export async function createProduct(dto: CreateProduct): Promise<Product> {
  try {
    const { data } = await api.post<Product>("/products", dto)
    return data
  } catch (error) {
    throw toAppError(error)
  }
}

export async function updateProduct(id: string, dto: UpdateProduct): Promise<Product> {
  try {
    const { data } = await api.patch<Product>(`/products/${id}`, dto)
    return data
  } catch (error) {
    throw toAppError(error)
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    await api.delete(`/products/${id}`)
  } catch (error) {
    throw toAppError(error)
  }
}
```

`{ params: query }` deja que axios arme el query string. Los `undefined` se omiten solos — por eso las páginas pasan `search || undefined` en vez de `""`.

`categoryServiceAxios.ts` es el mismo molde contra `/categories`, devolviendo `Category[]` (sin paginar) en el listado.

### `services/favoriteService.ts` — manejo idempotente

```ts
// 409 = ya estaba en favoritos. El resultado deseado ya se cumple,
// así que lo tratamos como éxito en vez de propagar el error a la UI.
export async function addFavorite(productId: string): Promise<void> {
  try {
    await api.post(`/favorites/${productId}`)
  } catch (error) {
    const appError = toAppError(error)
    if (appError instanceof ApiError && appError.status === 409) return
    throw appError
  }
}

// 404 = no estaba en favoritos. Mismo criterio.
export async function removeFavorite(productId: string): Promise<void> {
  try {
    await api.delete(`/favorites/${productId}`)
  } catch (error) {
    const appError = toAppError(error)
    if (appError instanceof ApiError && appError.status === 404) return
    throw appError
  }
}
```

**El criterio:** si el estado final que buscabas ya se cumple, no es un fallo. Marcar dos veces el mismo favorito no debe mostrar un error rojo al usuario.

Recuerda del reconocimiento: `GET /favorites` devuelve **`Product[]`**, no una lista de favoritos.

## Verificación del paso

- [ ] `tsc --noEmit` limpio
- [ ] Ningún servicio importa React ni `tokenStorage`
- [ ] Todos los servicios envuelven en `try/catch` con `toAppError`
- [ ] El interceptor de response termina en `Promise.reject`

**Siguiente:** [04-auth-sesion.md](./04-auth-sesion.md)
