# Módulo 2 — Checklist consolidado

Todo lo marcado 🔴 aquí abajo está explicado en detalle en los archivos 01-04 de esta carpeta. Esta es solo la lista de tareas, para que la marques a medida que avances.

## 🔴 Bugs / pendientes críticos

- [ ] **`src/services/authService.ts` → `logout()`**: quitar `tokenStorage.remove()` y `return data`. Debe quedar como `await api.post("/auth/logout")`, nada más. *(Detalle: [`02-auth-service.md`](./02-auth-service.md))*
- [ ] **`src/types/User.ts`**: cambiar `role: string` por `role: UserRole`. *(Detalle: [`01-tipado/README.md`](../01-tipado/README.md))*
- [ ] **No existe `ProtectedRoute`**: el RBAC de 2 niveles que pide la rúbrica (autenticado/no autenticado + admin/user) todavía no está implementado en `router.tsx`. *(Detalle: [`04-rutas-y-paginas.md`](./04-rutas-y-paginas.md))*
- [ ] **`Login.tsx` y `Register.tsx` están vacíos** (placeholders sin formulario real). *(Detalle: [`04-rutas-y-paginas.md`](./04-rutas-y-paginas.md))*
- [ ] **`AuthContextValue` no expone `register`** — si quieres registrar usuarios desde el Context (recomendable, para consistencia con `login`), hay que agregarlo.

## ⚠️ Mejorables (no urgentes, cosméticos)

- [ ] **`src/lib/tokenStorage.ts`**: `TOKEN_KEY = "accestoken"` tiene un typo (falta la segunda `s`).
- [ ] **`src/main.tsx`**: el import `"../src/context/AuthContext"` funciona pero es una ruta confusa — debería ser `"./context/AuthContext"`.
- [ ] **`src/pages/Login.tsx`**: el componente se llama `LoginC` pero se importa como `Login` — inconsistencia de nombre, no un error.

## ✅ Ya está bien y no hay que tocarlo

- `axiosConfig.ts` — interceptores de request/response completos y correctos.
- `authService.ts` — `login`, `register`, `getMe` correctos.
- `AuthContext.tsx` — estructura completa: estado, efecto de rehidratación con `[]` correcto, `login`/`logout` bien separados de la capa de servicio, `role` derivado (no duplicado).
- `main.tsx` — `AuthProvider` ya envuelve `MainRouter` (esto era el bloqueante más grave y ya está resuelto).
- `types/AuthResponse.ts`, `types/Jwt.ts` — correctos.

## Orden sugerido para resolver esto antes del debugging en vivo

1. Los dos 🔴 de una línea (`logout()` y `role: UserRole`) — son cambios de 1-2 líneas cada uno, hazlos primero.
2. Corre `npm run dev` y prueba manualmente: loguéate con un usuario real de tu backend, revisa en DevTools → Application → Local Storage que el token se guarde, y en React DevTools (o un `console.log` temporal) que `user` quede seteado.
3. Simula el escenario de "recargar con sesión activa" — refresca la página y confirma que no te bota a `/login` de golpe (gracias a `isLoading`).
4. Recién ahí, si te queda tiempo, avanza en `ProtectedRoute` y los formularios reales de `Login`/`Register` — pero eso ya es la siguiente sesión de trabajo, no algo para resolver de afán hoy.
