# Módulo 2 — Parte 1: los cimientos (`tokenStorage.ts` + `axiosConfig.ts`)

Antes de tocar React, estos dos archivos resuelven un problema que no tiene nada que ver con componentes: **¿cómo hablamos con el backend, y cómo probamos quiénes somos en cada llamada?**

---

## `src/lib/tokenStorage.ts`

```ts
export const TOKEN_KEY = "accestoken"

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  remove: (): void => localStorage.removeItem(TOKEN_KEY)
}
```

**Qué hace:** es un envoltorio (*wrapper*) alrededor de `localStorage`. En vez de escribir `localStorage.getItem("accestoken")` regado por todo el proyecto, centralizas el acceso en un solo lugar con tres funciones con nombre claro.

**Por qué importa centralizarlo:** si mañana decides cambiar de `localStorage` a `sessionStorage` (por ejemplo, para que la sesión no sobreviva a cerrar la pestaña), solo tocas este archivo. Si tuvieras `localStorage.getItem(...)` copiado en 5 archivos distintos, tendrías que cambiar los 5.

### ⚠️ Pendiente (cosmético, no urgente)
`TOKEN_KEY = "accestoken"` tiene un typo — le falta la segunda `s` (`accessToken`). No rompe nada porque se usa consistentemente en las tres funciones, pero si algún día lo lees en las DevTools → Application → Local Storage, te va a confundir ver una clave mal escrita. Corrígelo cuando tengas un respiro.

---

## `src/lib/axiosConfig.ts`

```ts
import axios from "axios"
import { tokenStorage } from "./tokenStorage"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.remove()
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)
```

**Analogía:** piensa en `api` como una línea telefónica directa hacia el backend, que ya viene configurada con dos comportamientos automáticos — no tienes que repetirlos en cada llamada.

### Bloque 1 — `axios.create(...)`
Crea una instancia de axios con una `baseURL` fija. Así, en el resto del proyecto escribes `api.get("/categories")` en vez de `axios.get("http://localhost:3000/categories")` cada vez.

### Bloque 2 — interceptor de **request**
```ts
api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```
Esto se ejecuta **antes** de que cualquier petición salga hacia el backend. Es como un guardia en la puerta que, si tienes gafete (token guardado), te lo cuelga automáticamente en el cuello (`Authorization: Bearer ...`) antes de dejarte pasar. Si no hay token (usuario no logueado), simplemente no agrega el header — la petición sigue su curso sin autenticación.

Esta es la pieza que cumple el requisito de la rúbrica: *"capa API con interceptor de Authorization: Bearer"*. Gracias a esto, **ningún** archivo de servicios (`authService.ts`, `categoryServiceAxios.ts`, etc.) tiene que preocuparse por adjuntar el token manualmente.

### Bloque 3 — interceptor de **response**
```ts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.remove()
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)
```
Esto se ejecuta **después** de que llega cualquier respuesta. `axios.interceptors.response.use` recibe dos funciones: la primera para respuestas exitosas (aquí simplemente la deja pasar tal cual), la segunda para errores.

Si el backend responde `401` (token vencido o inválido), este bloque:
1. Borra el token guardado (`tokenStorage.remove()`) — ya no sirve, no tiene sentido conservarlo.
2. Redirige de una vez a `/login` con `window.location.href` — esto hace un **refresh completo de la página**, no una navegación de React Router. Es una decisión válida para este alcance, aunque más "brusca" que usar el router.
3. `return Promise.reject(error)` — MUY importante: esto le sigue avisando al código que hizo la llamada original (`categoryServiceAxios.ts`, por ejemplo) que hubo un error, para que su propio `try/catch` también pueda reaccionar. Si no hicieras este `reject`, el error "desaparecería" silenciosamente aquí y el resto del código pensaría que todo salió bien.

### 🧠 Pregúntate
- ¿Qué pasaría si el interceptor de response **no** hiciera `return Promise.reject(error)` al final? ¿El `catch` de `categoryServiceAxios.ts` se ejecutaría igual?
- ¿Por qué el interceptor de *request* es el lugar correcto para adjuntar el token, en vez de hacerlo manualmente en cada función de `authService.ts`?

**Siguiente archivo:** [`02-auth-service.md`](./02-auth-service.md)
