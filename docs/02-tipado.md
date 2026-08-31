# 02 — Tipado (30 min)

Todo en `src/types/`. Es mecánico **si hiciste el reconocimiento**; si no, cada campo mal escrito cuesta un ciclo de debugging en runtime.

## Principio: entrada y salida son tipos distintos

Lo que **recibes** del backend no tiene la misma forma que lo que **envías**. Modelarlos con un solo tipo obliga a llenarlo de opcionales y pierdes la protección.

| Tipo | Papel |
|---|---|
| `Product` | Lo que recibes: con `id`, fechas, relaciones anidadas |
| `CreateProduct` | Lo que envías al crear: sin `id`, sin fechas |
| `UpdateProduct` | Lo que envías al editar: todo opcional |
| `ProductQuery` | Parámetros de búsqueda |

## `User.ts`

```ts
export type UserRole = "admin" | "user"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}
```

**`UserRole` es un union literal, no `string`.** Con `role: string`, escribir `"superadmin"` compila sin error y tu control de acceso falla en silencio. Con el union, TypeScript lo rechaza antes de correr.

No hay campo `password`: el backend nunca lo devuelve. Tipar algo que jamás llega es mentirle al compilador.

## `AuthResponse.ts`

```ts
import type { User } from "./User"

export interface AuthResponse {
  accessToken: string
  user: User
}
```

Es lo que devuelven `/auth/login` y `/auth/register`. Como trae el usuario completo, tras iniciar sesión **no necesitas una segunda llamada** para saber quién es.

Verifica el nombre exacto del campo del token: `accessToken`, `access_token` y `token` son todos comunes según el backend.

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

El genérico `<T>` es lo que hace que sirva para cualquier recurso: `Pagination<Product>`, `Pagination<Category>`.

**`data: T[]`, no `T[] | undefined`.** El `undefined` mezcla dos cosas distintas: la forma que promete el backend, y el estado de tu componente antes de que llegue la respuesta. Ese segundo caso se modela en el `useState` del componente, no en el tipo de la respuesta HTTP.

## `Category.ts`

```ts
export interface Category {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
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

Fíjate en `description`: **nullable al recibir** (`string | null`) pero **opcional al enviar** (`?:`). Es el mismo campo con dos contratos distintos.

## `Product.ts`

```ts
import type { Category } from "./Category"
import type { ProductImage } from "./ProductImage"

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  categoryId: string
  category: Category        // ← viene anidado por eager: true
  images: ProductImage[]    // ← también eager
  createdAt: string
  updatedAt: string
}

export interface CreateProduct {
  name: string
  description?: string
  price: number
  stock: number
  categoryId: string
  images?: string[]         // ← al ENVIAR son URLs sueltas
}

export type UpdateProduct = Partial<CreateProduct>

export interface ProductQuery {
  search?: string
  categoryId?: string
  page?: number
  limit?: number
}
```

Tres cosas que se derivan del reconocimiento:

- **`category` e `images` anidados** porque el backend usa `eager: true`. Puedes mostrar el nombre de la categoría en una tarjeta sin pedir nada más.
- **`images` cambia de forma según la dirección:** recibes `ProductImage[]` (objetos con id, url, orden), envías `string[]` (solo URLs).
- **`UpdateProduct = Partial<CreateProduct>`** usa un utility type en vez de repetir la interfaz. El backend hace lo mismo con `PartialType(CreateProductDto)`.

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

## `Jwt.ts`

```ts
import type { UserRole } from "./User"

export interface JwtPayload {
  sub: string
  email: string
  role: UserRole
  iat: number    // segundos Unix, NO Date ni string
  exp: number
}
```

`sub` es el estándar JWT para "subject" (el id del usuario). `iat`/`exp` son **números** (segundos desde 1970). Tiparlos como `Date` o `string` deja pasar comparaciones que no significan nada.

Con el diseño de sesión que usamos (consultar el perfil al arrancar) este archivo no está en la ruta crítica, pero lo necesitarías si decidieras leer el rol decodificando el token.

## Verificación del paso

- [ ] `npx tsc --noEmit` sin errores
- [ ] Cero `any`
- [ ] Todos los `createdAt`/`updatedAt` en el casing real del JSON
- [ ] Fechas como `string`
- [ ] Roles como union literal
- [ ] Tipos de entrada separados de los de salida

**Siguiente:** [03-capa-api.md](./03-capa-api.md)
