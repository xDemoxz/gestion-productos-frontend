# Módulo 1 — Tipado

Todos los tipos viven en `src/types/`. Su trabajo es describir **exactamente** la forma en la que el backend te entrega o te pide los datos — no lo que tú crees que debería ser, sino lo que el Swagger/DTOs del backend realmente definen.

---

## `User.ts`

```ts
export type UserRole = "admin" | "user"

export interface User {
  id: string
  name: string
  email: string
  role: string        // 🔴 ver "Pendientes" abajo
  createdAt: string
}
```

- `UserRole` es un **union type literal**: solo acepta esos dos strings exactos, ningún otro. Es distinto de `role: string`, que aceptaría cualquier texto.
- No existe un campo `password` aquí. Verificado contra el backend: ningún endpoint (`/auth/login`, `/auth/register`, `/users/me`) devuelve la contraseña al frontend, así que no tiene sentido tipar algo que nunca vas a recibir.
- `createdAt` es `string`, no `Date`. Cuando un objeto `Date` del backend viaja por JSON, se serializa como string ISO (`"2026-08-01T10:00:00.000Z"`) — nunca llega un objeto `Date` real al navegador, así que tipar `Date` sería mentirle a TypeScript sobre lo que hay en runtime.

### 🔴 Pendiente
`role: string` **no usa** el tipo `UserRole` que ya definiste en la misma línea de arriba. Debería ser:
```ts
role: UserRole
```
Así, si en algún lugar del código escribes `user.role = "superadmin"`, TypeScript te lo marca como error antes de correr nada — que es justo la protección que buscas para tu RBAC.

---

## `AuthResponse.ts`

```ts
import type { User } from "../types/User"

export interface AuthResponse {
  accessToken: string
  user: User
}
```

- Esto es exactamente lo que devuelven `POST /auth/login` y `POST /auth/register`: un token y el usuario, juntos, en la misma respuesta. Por eso `AuthContext.login()` puede setear el usuario sin tener que hacer una segunda llamada a `/users/me` después de loguear.
- ✅ Correcto tal como está.

---

## `Jwt.ts`

```ts
import type { UserRole } from "../types/User"

export interface JwtPayload {
  sub: string
  email: string
  role: UserRole
  iat: number
  exp: number
}
```

- `sub` es el estándar JWT para "subject" — en tu caso, el `id` del usuario.
- `iat` (issued at) y `exp` (expiration) son **segundos desde 1970** (Unix epoch), por eso son `number` y no `Date` ni `string`.
- ✅ Correcto. Nota aparte: con el diseño actual del `AuthContext` (que usa `/users/me` para restaurar sesión, no decodifica el token) este archivo no está en la ruta crítica todavía — pero está bien tenerlo listo por si luego lo necesitas.

---

## `Category.ts`

```ts
export interface Category {
  id: string
  name: string
  description: string | null
  created_at: string   // 🔴 ver "Pendientes"
  updated_at: string   // 🔴 ver "Pendientes"
}

export interface CreateCategory {
  name: string
  description?: string
}

export interface UpdateCategory {
  name?: string
  description?: string
}
```

- `description: string | null` (no `description?: string`) porque el backend la modela como **nullable**, no como opcional: la clave `description` siempre viene en la respuesta, solo que su valor puede ser `null`. Es distinto de "la clave puede no existir".
- `CreateCategory`/`UpdateCategory` son tipos separados de `Category` — tiene sentido: lo que **envías** para crear una categoría no es lo mismo que lo que **recibes** de vuelta (tú no mandas `id`, `created_at`, etc.). Ahí `description?: string` sí es correcto como opcional, porque es lo que el DTO del backend espera al crear/actualizar.

### 🔴 Pendiente
`created_at` / `updated_at` deberían ser `createdAt` / `updatedAt` (camelCase). Esto no es un capricho de estilo: en el backend, el decorador `@CreateDateColumn({ name: 'created_at' })` **solo** define el nombre de la columna en PostgreSQL — la propiedad de la clase (y por lo tanto la clave del JSON que te llega) sigue siendo `createdAt`. Confirmado leyendo la entidad real del backend.

---

## `Product.ts`

```ts
import type { Category } from "../types/Category"
import type { ProductImage } from "../types/ProductImage"

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  categoryd: string     // 🔴 typo, ver "Pendientes"
  category: Category
  images: ProductImage[]
  created_at: string    // 🔴 ver "Pendientes"
  updated_at: string    // 🔴 ver "Pendientes"
}
```

- `category: Category` e `images: ProductImage[]` están ahí porque el backend usa relaciones `eager: true` — cada producto que llega del servidor ya trae la categoría completa y el arreglo de imágenes anidados, no solo los ids.
- `price` sigue siendo `number` — el backend transforma el `decimal` de PostgreSQL a `number` antes de mandarlo, así que no necesitas parsear nada del lado del frontend.

### 🔴 Pendientes
1. `categoryd` → debería ser `categoryId` (typo, falta la `I`).
2. `created_at` / `updated_at` → mismo caso que `Category.ts`, deberían ser `createdAt` / `updatedAt`.

---

## `Products.ts` (plural — este archivo genera confusión)

```ts
export interface Products {
  name: string
  description?: string | null
  price: number
  stock: number
  categoryId: number
  images: string
}
```

Por el nombre en plural y la forma, parece que este es tu intento de tipo para **crear/editar** un producto (el "input" del formulario), distinto de `Product` (el "output" que ya viste arriba). Esa separación input/output es una buena idea — el problema es la forma actual no coincide con lo que el backend espera recibir.

### 🔴 Pendientes
1. `categoryId: number` → el backend espera un **UUID en formato string** (`@IsUUID()`), no un número.
2. `images: string` → el backend espera un **arreglo de URLs** (`images?: string[]`), no un solo string.
3. El nombre `Products` (plural) es confuso al lado de `Product` (singular) — cuando lleguemos al formulario de productos, conviene renombrarlo a algo como `CreateProduct` o `ProductInput`, siguiendo el mismo patrón que ya usaste bien en `Category.ts` con `CreateCategory`/`UpdateCategory`.

No lo corrijas todavía si no estás trabajando en el formulario de productos — solo ten claro qué falta cuando llegues ahí.

---

## `ProductImage.ts`

```ts
export interface ProductImage {
  id: string
  url: string
  order: number
  productId: string
  createdAt: string
}
```

✅ Correcto — y nota que aquí sí usaste camelCase (`createdAt`) correctamente, a diferencia de `Category.ts` y `Product.ts`. Es el mismo patrón, solo falta aplicarlo de forma consistente en los otros dos archivos.

---

## `Pagination.ts`

```ts
export interface Pagination<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
```

- `<T>` es un **genérico**: en vez de escribir `data: Product[]` fijo, dejas que quien use el tipo decida qué va adentro — `Pagination<Product>`, `Pagination<Category>`, etc. Confirmado contra `products.service.ts` del backend: la forma real de la respuesta paginada es exactamente esta.
- Recuerda: **solo productos están paginados**. `GET /categories` devuelve `Category[]` directo, no `Pagination<Category>` — no envuelvas categorías en este tipo.
- ✅ Correcto tal como está.

---

## Resumen de pendientes del Módulo 1

| Archivo | Pendiente | Severidad |
|---|---|---|
| `User.ts` | `role: string` → `role: UserRole` | 🔴 |
| `Category.ts` | `created_at`/`updated_at` → camelCase | 🔴 |
| `Product.ts` | `categoryd` → `categoryId` | 🔴 |
| `Product.ts` | `created_at`/`updated_at` → camelCase | 🔴 |
| `Products.ts` | `categoryId: number` → `string` | 🔴 |
| `Products.ts` | `images: string` → `string[]` | 🔴 |
| `Products.ts` | Renombrar a `CreateProduct`/`ProductInput` | ⚠️ |

### 🧠 Pregúntate
- ¿Por qué `description: string | null` y `description?: string` no son intercambiables? Dame un ejemplo de código que se comporte distinto según cuál uses.
- ¿Por qué el `name: 'created_at'` en el decorador de TypeORM del backend **no** garantiza que el JSON tenga esa clave?
