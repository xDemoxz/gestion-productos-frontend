# 04 — Auth y sesión (45 min)

No pases al siguiente paso hasta poder iniciar sesión, recargar con F5, y seguir dentro.

## 4.1 · `services/authService.ts`

**Analogía:** es una recepcionista. Recibe una nota, camina a la ventanilla correcta, y te trae el sobre — **sin abrirlo ni quedarse con nada**. Guardar el token y actualizar el estado de React es trabajo de otro.

```ts
import { api } from "../lib/axiosConfig"
import type { AuthResponse } from "../types/AuthResponse"
import type { User } from "../types/User"

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", { email, password })
  return data
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", { name, email, password })
  return data
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout")
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/users/me")
  return data
}
```

> ⚠️ **Pendiente en este repo:** `logout()` actualmente hace `tokenStorage.remove()` y `return data`. Eso rompe la separación de capas — el servicio decide algo que no le toca, y `AuthContext` ya lo hace también (se ejecuta dos veces). Usa la versión de arriba.

`getMe()` es la pieza que permite reconstruir la sesión: el estado de React se pierde al recargar, pero el token sigue en el storage.

## 4.2 · `context/AuthContext.tsx`

**Analogía:** es el altavoz central del edificio. Sin él, cada componente le pregunta a su padre "¿quién está logueado?" piso por piso (*prop drilling*). Con Context, el dato se transmite una vez y cualquier componente se sintoniza con `useAuth()`.

### El contrato

```tsx
interface AuthContextValue {
  user: User | null
  role: User["role"] | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
```

### El estado: tres situaciones, no dos

```tsx
const [user, setUser] = useState<User | null>(null)
const [isLoading, setIsLoading] = useState(true)   // arrancamos SIN saber
```

**Este es el concepto central de todo el módulo.** `user === null` significa dos cosas opuestas:

| isLoading | user | Significa |
|---|---|---|
| `true` | `null` | Todavía no sé — **no decidas nada** |
| `false` | `null` | Ya pregunté: no hay sesión |
| `false` | objeto | Autenticado |

Sin `isLoading`, las dos primeras filas son indistinguibles, y la ruta protegida te expulsa a login al recargar aunque el token sea válido.

### Rehidratación al arrancar

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
}, [])   // vacío a propósito: corre UNA vez al montar
```

1. ¿Hay token? Si no, no hay nada que restaurar.
2. Si hay, se lo muestras al backend (el interceptor adjunta el `Bearer` solo).
3. `.then` → usuario reconstruido. `.catch` vacío a propósito: el interceptor ya limpió.
4. `.finally` → pase lo que pase, ya sabes la respuesta.

**El `[]` vacío es crítico.** Si agregas `user` a las dependencias entras en bucle infinito: el efecto pone `user` → cambia `user` → se dispara el efecto → llama de nuevo. Si ves `/users/me` repitiéndose sin parar en la pestaña Network, esa es la causa.

**Sobre `<StrictMode>`:** en desarrollo React monta, desmonta y remonta a propósito. Verás `/users/me` dos veces al cargar. Es normal, no pasa en producción, y **no se arregla quitando StrictMode**.

### Acciones

```tsx
async function login(email: string, password: string) {
  const { accessToken, user } = await authService.login(email, password)
  tokenStorage.set(accessToken)
  setUser(user)
}

async function register(name: string, email: string, password: string) {
  const { accessToken, user } = await authService.register(name, email, password)
  tokenStorage.set(accessToken)
  setUser(user)
}

async function logout() {
  await authService.logout().catch(() => {})   // aunque falle la red, cerramos local
  tokenStorage.remove()
  setUser(null)
}
```

Aquí sí se hace lo que el servicio deliberadamente **no** hacía. Esa es la frontera de responsabilidad.

El `.catch(() => {})` en logout: si el backend está caído, igual quieres cerrar sesión localmente. No tiene sentido dejar al usuario atrapado adentro porque una petición no llegó — más aún cuando el JWT es *stateless* y el backend no revoca nada.

### El valor expuesto

```tsx
<AuthContext.Provider
  value={{ user, role: user?.role ?? null, isLoading, login, register, logout }}
>
  {children}
</AuthContext.Provider>
```

**`role` es derivado, no un estado aparte.** Si tuviera su propio `useState`, tendrías dos fuentes de verdad que pueden desincronizarse. Derivarlo elimina el problema por diseño.

`user?.role ?? null` se lee: "si hay usuario, su rol; si no, null".

### El hook consumidor

```tsx
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>")
  return ctx
}
```

El `throw` convierte un error críptico más adelante ("Cannot read property 'user' of undefined") en un mensaje que dice exactamente qué pasa.

## 4.3 · Montaje en `main.tsx`

```tsx
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  </StrictMode>
)
```

**El Provider va afuera del router.** Si lo pones dentro de una ruta, cada navegación lo remonta y pierdes el estado en memoria.

## 4.4 · Formularios de acceso

Patrón común a `Login.tsx` y `Register.tsx`:

```tsx
async function handleSubmit(e: FormEvent) {
  e.preventDefault()
  setError(null)
  setIsSubmitting(true)

  try {
    await login(email, password)
    navigate("/")
  } catch {
    setError("Correo o contraseña incorrectos.")
  } finally {
    setIsSubmitting(false)
  }
}
```

- **`e.preventDefault()`** cancela la recarga nativa del formulario. Sin él, el navegador recarga la página y destruye el estado de React antes de que la llamada asíncrona termine. El evento se dispara igual — lo que cancelas es el comportamiento del navegador, no el de React.
- **Inputs controlados:** `value={email}` **y** `onChange`. Solo con `onChange` el DOM lleva su propio valor, desincronizado del estado.
- **`finally`:** sin él, si falla el login, `isSubmitting` queda en `true` y el botón se queda deshabilitado para siempre.

## Verificación del paso

- [ ] Registrarse crea la cuenta e inicia sesión de una vez
- [ ] Iniciar sesión guarda el token (DevTools → Application → Local Storage)
- [ ] **Recargar con F5 estando logueado no te bota a login**
- [ ] Cerrar sesión limpia el token
- [ ] Ningún servicio de auth toca `tokenStorage`

**Siguiente:** [05-rbac-rutas.md](./05-rbac-rutas.md)
