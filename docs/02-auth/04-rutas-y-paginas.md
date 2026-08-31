# Módulo 2 — Parte 4: rutas y páginas (estado actual)

Esta parte del módulo 2 todavía está muy incompleta — se documenta tal cual está para que tengas claro exactamente qué falta, no para que creas que ya funciona.

---

## `src/routes/router.tsx`

```tsx
import { BrowserRouter, Routes, Route } from "react-router"
import App from "../pages/App"
import Login from "../pages/Login"

export function MainRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}
```

Solo existen dos rutas: `/` y `/login`. No hay ruta `/register`, no hay ninguna ruta protegida, no hay ningún componente tipo `ProtectedRoute` que redirija según `isLoading`/`user`/`role`.

## `src/pages/App.tsx`

```tsx
export default function App() {
  return <h1>Hello!</h1>
}
```

Placeholder — no usa `useAuth()`, no muestra nada real.

## `src/pages/Login.tsx`

```tsx
export default function LoginC() {
  return (
    <div>
      <h1></h1>
    </div>
  )
}
```

Placeholder también. Dos cosas a notar:
- El componente se llama `LoginC` pero el archivo se importa como `Login` en `router.tsx` (`import Login from "../pages/Login"`) — funciona porque en un `export default` el nombre de la función no importa para quien lo importa, pero es una inconsistencia de nombres que vale la pena limpiar cuando construyas el formulario real.
- No tiene ningún formulario, no llama a `useAuth().login(...)` todavía.

## `src/pages/Register.tsx`

Archivo completamente vacío (0 bytes). Ni siquiera tiene un `export default` — si algo intentara importarlo hoy, fallaría.

---

## 🔴 Lo que falta para que el Módulo 2 esté completo (según CLAUDE.md)

La rúbrica pide **RBAC en 2 niveles**: autenticado/no autenticado, y por rol (`admin`/`user`) a nivel de router. Hoy no existe nada de esto:

1. **`Login.tsx` real** — formulario con `email`/`password`, que llame a `useAuth().login(...)` y navegue a `/` (o donde corresponda) si tiene éxito, mostrando el error si falla.
2. **`Register.tsx` real** — mismo patrón, con `name` adicional, llamando a `useAuth().register(...)` (ojo: ese método no existe todavía en `AuthContextValue` — solo están `login` y `logout` expuestos; si quieres registro desde el Context, hay que agregarlo ahí también, no solo en `authService.ts`).
3. **Un componente `ProtectedRoute`** (o `PrivateRoute`) que:
   - Si `isLoading` es `true`, muestre un loader (o `null`) — no decidas nada todavía.
   - Si no hay `user`, redirija a `/login`.
   - Si la ruta requiere un rol específico (por ejemplo, crear categoría es admin-only) y el `role` del usuario no coincide, redirija o muestre un "no autorizado".
4. **Rutas nuevas en `router.tsx`** — `/register`, y las rutas protegidas envueltas en tu `ProtectedRoute`.

No se te da la implementación de `ProtectedRoute` ni de los formularios aquí — eso es justo lo que la rúbrica marca como lógica de RBAC y formularios, que se trabaja contigo paso a paso cuando llegues a esa parte, no de entrada.

### 🧠 Pregúntate
- ¿Qué diferencia debería haber en el comportamiento de `ProtectedRoute` entre "usuario no logueado" y "usuario logueado pero sin el rol correcto"? (pista: no es el mismo mensaje ni necesariamente la misma redirección)

**Siguiente archivo:** [`05-pendientes-por-mejorar.md`](./05-pendientes-por-mejorar.md) — el checklist consolidado de todo el módulo 2.
