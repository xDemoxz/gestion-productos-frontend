# Módulo 2 — Parte 3: `AuthContext.tsx`

**Analogía general:** `AuthContext` es el altavoz central de un edificio. Sin él, cada componente tendría que preguntarle a su padre, y su padre al suyo, "¿quién está logueado?" (eso se llama *prop drilling*). Con Context, el `Provider` transmite el estado una sola vez desde arriba, y cualquier componente en cualquier nivel se "sintoniza" con `useAuth()` para escuchar la misma información.

---

## El estado

```tsx
const [user, setUser] = useState<User | null>(null)
const [isLoading, setIsLoading] = useState(true) // arrancamos SIN saber si hay sesión
```

Dos piezas de estado, no una. `user` es obvio. `isLoading` es la parte que la gente suele olvidar, y es la más importante: al arrancar la app, **no sabes todavía** si hay una sesión válida — necesitas tiempo para preguntarle al backend. Mientras esa pregunta está en el aire, `isLoading` es `true`.

---

## El efecto de arranque ("rehidratar" la sesión)

```tsx
useEffect(() => {
  const token = tokenStorage.get()
  if (!token) {
    setIsLoading(false)
    return
  }

  authService
    .getMe()
    .then(setUser)
    .catch(() => {
      // token inválido/vencido: el interceptor de axios ya limpia el storage
      // y redirige si fue un 401 — aquí no hace falta duplicar esa lógica
    })
    .finally(() => setIsLoading(false))
}, []) // vacío a propósito: corre UNA vez al montar, no en cada render
```

Paso a paso:
1. **¿Hay un token guardado?** Si no, no hay nada que restaurar — `isLoading` pasa a `false` de inmediato y `user` se queda en `null`.
2. **Si hay token,** se lo muestras al backend llamando `getMe()` (recuerda: el interceptor de request ya adjunta el `Bearer` automáticamente, no lo haces aquí).
3. **Si responde bien** (`.then(setUser)`), ya tienes tu usuario reconstruido.
4. **Si responde mal** (`.catch`), el `catch` está vacío a propósito — el interceptor de `axiosConfig.ts` ya se encarga de borrar el token y redirigir en un 401, así que duplicar esa lógica aquí sería repetir trabajo.
5. **Pase lo que pase** (`.finally`), `isLoading` termina en `false` — ya sabes la respuesta, sea cual sea.

**El `[]` vacío no es un detalle menor.** Significa "corre una sola vez, al montar el componente". Si por accidente agregas `user` al arreglo de dependencias, entras en un loop infinito: el efecto pone `user` → React re-renderiza porque `user` cambió → como `user` es dependencia, el efecto se vuelve a disparar → vuelve a llamar `getMe()` → vuelve a poner `user` → y así sin parar. Si mañana ves en la pestaña Network que `/users/me` se llama sin parar, esa es la primera causa que revisas.

**Nota sobre `<StrictMode>` (en `main.tsx`):** en desarrollo, React monta, desmonta y vuelve a montar los componentes una vez a propósito, para detectar efectos mal escritos. Vas a ver `/users/me` llamarse dos veces al cargar en `npm run dev`. Es normal, no es un bug tuyo, y no pasa así en producción — no "arregles" esto quitando `StrictMode`.

---

## `login`

```tsx
async function login(email: string, password: string) {
  const { accessToken, user } = await authService.login(email, password)
  tokenStorage.set(accessToken)
  setUser(user)
}
```

Aquí sí se hacen las dos cosas que `authService.login()` deliberadamente **no** hacía: guardar el token y actualizar el estado de React. Es la diferencia de responsabilidad entre las dos capas — el service solo habla con el backend, el Context decide qué hacer con la respuesta.

---

## `logout`

```tsx
async function logout() {
  await authService.logout().catch(() => {}) // aunque falle la red, igual cerramos sesión local
  tokenStorage.remove()
  setUser(null)
}
```

Fíjate en el `.catch(() => {})`: aunque la llamada al backend falle (servidor caído, por ejemplo), **igual quieres cerrar la sesión localmente**. No tiene sentido dejar al usuario "atrapado" logueado en su navegador solo porque la petición de logout no llegó — recuerda que el JWT es *stateless*, el backend ni siquiera revoca nada realmente en esa ruta.

Esto es justo lo que le preguntábamos en el archivo anterior sobre `authService.ts`: con el bug de `logout()` **corregido** en el service, este `.catch(() => {})` sigue garantizando que `tokenStorage.remove()` y `setUser(null)` se ejecuten pase lo que pase.

---

## El `Provider` y el `value`

```tsx
return (
  <AuthContext.Provider
    value={{ user, role: user?.role ?? null, isLoading, login, logout }}
  >
    {children}
  </AuthContext.Provider>
)
```

`role: user?.role ?? null` — el rol **no es un estado separado**, es un valor *derivado* de `user`. Esto es deliberado: si guardaras `role` en su propio `useState`, tendrías dos fuentes de verdad que podrían desincronizarse (¿qué pasa si actualizas `user` pero olvidas actualizar `role`?). Derivarlo evita ese problema por diseño.

`user?.role ?? null` se lee: "si `user` existe, dame su `role`; si no, dame `null`" (el `?.` corta la cadena si `user` es `null`, y el `??` pone el valor por defecto si el resultado es `null`/`undefined`).

---

## `useAuth`

```tsx
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>")
  return ctx
}
```

Este `throw` es una salvaguarda de desarrollo: si algún componente usa `useAuth()` fuera de un `<AuthProvider>`, en vez de recibir `undefined` y romperse con un error críptico más adelante ("Cannot read property 'user' of undefined"), recibe un error claro que dice exactamente cuál es el problema.

---

## ✅ Ya corregido: el wiring en `main.tsx`

```tsx
import { AuthProvider } from "../src/context/AuthContext"
// ...
<StrictMode>
  <AuthProvider>
    <MainRouter />
  </AuthProvider>
</StrictMode>
```

Bien — `AuthProvider` ya envuelve `MainRouter`. Sin esto, cualquier `useAuth()` en cualquier página lanzaría el error de arriba.

### ⚠️ Pendiente (cosmético)
El import usa `"../src/context/AuthContext"`. Como `main.tsx` ya está **dentro** de `src/`, esta ruta sube un nivel (`../`) y vuelve a entrar a `src/` — funciona porque el resultado final apunta al mismo archivo, pero es una ruta rara de leer. Lo normal sería `"./context/AuthContext"` (sin salir de `src/`). No es un bug, es solo más difícil de leer para alguien (incluido tú mismo en unos meses) que no sepa que funciona por coincidencia de carpetas.

### 🧠 Pregúntate
- Explica en tus palabras: al recargar la página estando logueado, ¿qué ve el usuario en la pantalla durante el primer instante (mientras `isLoading` es `true`), y qué ve después?
- ¿Por qué `role` no tiene su propio `useState`?

**Siguiente archivo:** [`04-rutas-y-paginas.md`](./04-rutas-y-paginas.md)
