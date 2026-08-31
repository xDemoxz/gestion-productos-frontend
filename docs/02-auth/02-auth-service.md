# Módulo 2 — Parte 2: `authService.ts`

Este archivo es la capa que **habla con el backend** para todo lo relacionado a autenticación. No sabe que React existe — no tiene `useState`, no tiene JSX, no importa nada de `react`. Es lógica pura.

**Analogía general:** piensa en este archivo como una recepcionista. Recibe una nota (los datos que le pasas), camina hasta la ventanilla correcta del backend, entrega la nota, y te trae de vuelta el sobre con la respuesta — **sin abrirlo ni quedarse con nada**. Guardar el token, actualizar quién está logueado en la app — eso es trabajo de otra persona (`AuthContext.tsx`, que se documenta en el siguiente archivo).

---

## `login`

```ts
export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", {
    email,
    password
  })
  return data
}
```

- `api.post<AuthResponse>(...)` — el `<AuthResponse>` le dice a TypeScript qué forma esperar en la respuesta. Si el backend cambiara esa forma, tu editor te avisaría antes de correr nada.
- `const { data } = await ...` — esto se llama **desestructuración de objetos**. `api.post` devuelve un objeto `AxiosResponse` con varias propiedades (`data`, `status`, `headers`...); aquí solo te quedas con `data`, que es lo único que te interesa.
- `return data` — entregas el sobre completo (`{ accessToken, user }`) a quien te llamó. No tocas `localStorage` aquí.

✅ Correcto, bien transcrito.

---

## `register`

```ts
export async function register(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", {
    name,
    email,
    password
  })
  return data
}
```

Mismo patrón exacto que `login`, solo cambia la ruta (`/auth/register`) y que la nota lleva un dato más (`name`). Si entendiste `login`, este no tiene nada nuevo — es reconocimiento de patrón, no un concepto distinto.

✅ Correcto.

---

## `logout`

```ts
export async function logout(): Promise<void> {
  const { data } = await api.post("/auth/logout")
  tokenStorage.remove()
  return data
}
```

**Qué se rompe aquí:** este archivo importó `tokenStorage` y ahora está tomando una decisión que no le corresponde — está borrando el token él mismo. Recuerda la analogía: *la recepcionista no se queda con nada ni decide nada, solo entrega el sobre.* Aquí "decidió" limpiar el storage.

El problema concreto: `AuthContext.logout()` (lo ves en el siguiente archivo) **también** hace `tokenStorage.remove()` después de llamar a esta función. Se ejecuta dos veces. No truena nada (`removeItem` sobre una clave que ya no existe no da error), pero es una señal de que la responsabilidad quedó repartida en dos lugares en vez de uno solo.

Además, la firma dice `Promise<void>` (no esperas ningún dato de vuelta), pero el código hace `return data` — como `data` viene de una llamada sin tipar (`api.post` sin `<T>`), TypeScript lo trata como `any`, y `any` se puede "colar" como si fuera `void` sin marcar error. Por eso `tsc` no se quejó — pero conceptualmente la firma y el cuerpo no están diciendo lo mismo.

### 🔴 Pendiente — corrección exacta

```ts
export async function logout(): Promise<void> {
  await api.post("/auth/logout")
}
```

Con esto, `authService.ts` deja de tocar `tokenStorage` por completo. El único que borra el token sigue siendo `AuthContext.logout()` — un solo lugar responsable de esa decisión.

---

## `getMe`

```ts
export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/users/me")
  return data
}
```

**Analogía:** llegas a la recepción sin nota, solo mostrando tu gafete (el interceptor de request ya lo agrega automáticamente), y preguntas "¿quién soy yo según sus registros?". Esta función es la pieza clave para cuando la página se recarga: el estado de React se resetea, pero el token sigue en `localStorage` — `getMe()` es como usas ese token para "reconstruir" quién eras.

✅ Correcto.

### 🧠 Pregúntate
- Si `logout()` tuviera el bug actual y AuthContext dejara de llamar `tokenStorage.remove()` por su cuenta (confiando en que el service ya lo hace), ¿qué le pasaría a tu app si la llamada a `/auth/logout` falla por caída de red? ¿El usuario seguiría "logueado" en localStorage aunque tú creas que cerró sesión?

**Siguiente archivo:** [`03-auth-context.md`](./03-auth-context.md)
