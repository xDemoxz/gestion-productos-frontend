# 05 — RBAC y rutas protegidas (45 min)

**RBAC** = *Role-Based Access Control*: lo que puedes hacer depende del rol que tengas, no de tu identidad individual.

**Analogía:** un hotel. La llave de habitación abre solo tu cuarto (`user`). La llave maestra abre todo (`admin`). La puerta no sabe tu nombre — solo lee qué tipo de llave traes.

La rúbrica pide **dos niveles**:
1. Autenticado vs. no autenticado.
2. Por rol: `/categories` solo para `admin`, y un `user` que entre por URL directa **debe ser redirigido**, no solo no ver el botón.

## Los 5 archivos que componen esto

| Archivo | Papel |
|---|---|
| `types/User.ts` | Define qué roles existen (`UserRole`) |
| `context/AuthContext.tsx` | Fuente de verdad: `user`, `role`, `isLoading` |
| `routes/ProtectedRoute.tsx` | **El guardia.** Decide y redirige |
| `routes/router.tsx` | Declara qué ruta necesita qué protección |
| `components/Layout.tsx` | Oculta enlaces según rol (**solo cosmético**) |

## 5.1 · `routes/ProtectedRoute.tsx`

Un solo componente cubre los dos niveles, según reciba o no `requiredRole`.

```tsx
import { Navigate } from "react-router"
import type { ReactNode } from "react"
import { useAuth } from "../context/AuthContext"
import type { UserRole } from "../types/User"

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: UserRole
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth()

  if (isLoading) {
    return <p className="p-8 text-center text-gray-500">Cargando sesión...</p>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
```

### El orden de los tres `if` es todo el punto

1. **`isLoading`** → todavía no sé, no decidas.
2. **`!user`** → nivel 1, autenticación.
3. **`requiredRole`** → nivel 2, autorización.

Si revisaras `!user` antes de `isLoading`, tendrías el bug más visible posible en una demo: **recargar con sesión válida te expulsa a login**, porque `user` todavía es `null` mientras `/users/me` viaja.

Si revisaras `requiredRole` antes de `!user`, leerías el rol de un usuario que ni existe.

`replace` mantiene la ruta bloqueada fuera del historial: sin él, el botón "atrás" del navegador vuelve a entrar.

`requiredRole?: UserRole` (no `string`) hace que un typo como `requiredRole="admn"` no compile.

## 5.2 · `routes/router.tsx`

Los dos niveles se **anidan**: el guard externo protege todo, el interno agrega el rol solo donde hace falta.

```tsx
export function MainRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* NIVEL 1: envuelve el Layout y con él todas las rutas hijas */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<ProductsPage />} />
          <Route path="/products/new" element={<ProductCreatePage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/products/:id/edit" element={<ProductEditPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />

          {/* NIVEL 2: solo esta ruta exige rol */}
          <Route
            path="/categories"
            element={
              <ProtectedRoute requiredRole="admin">
                <CategoriesPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

**Ruta sin `path`** (*layout route*): existe solo para envolver. Un `<Route element={...}>` sin `path` aplica su elemento a todas las rutas hijas, que se renderizan donde el `Layout` ponga su `<Outlet />`. Así el guard de nivel 1 se escribe **una vez** para seis rutas.

### Traza del ataque por URL directa

Un usuario con rol `user` escribe `localhost:5173/categories`:

1. **Guard externo** → `isLoading` false, `user` existe → pasa. *(Estar logueado no basta.)*
2. **`Layout`** renderiza su `<Outlet />`.
3. **Guard interno** → `requiredRole="admin"` pero `role === "user"` → **`<Navigate to="/" replace />`**.

`CategoriesPage` nunca se monta.

## 5.3 · `components/Layout.tsx`

```tsx
export function Layout() {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-4">
          <Link to="/" className="font-semibold text-gray-800">Productos</Link>
          <Link to="/favorites" className={linkClass}>Favoritos</Link>

          {/* Cosmético: no muestres puertas que no se pueden abrir */}
          {role === "admin" && (
            <Link to="/categories" className={linkClass}>Categorías</Link>
          )}

          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.name} ({role})</span>
            <button onClick={handleLogout}>Salir</button>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}
```

El `<Outlet />` es donde React Router inserta la ruta hija activa. Envolverlo en un `ErrorBoundary` hace que una página que truene no borre la navegación.

## La distinción que sí te van a preguntar

`{role === "admin" && <Link .../>}` **no es protección.** Es cortesía visual. Si borras esa línea, la app sigue igual de segura, porque quien protege es `ProtectedRoute`.

Y el punto final, el que remata la respuesta:

> **Ninguno de los dos es seguridad real.** Cualquiera puede abrir DevTools y llamar `POST /categories` directamente. La puerta de verdad es el guard del backend (`@Auth(UserRole.ADMIN)`), que rechaza con 403 aunque tu frontend no exista. El frontend evita el viaje inútil; el backend es el que dice que no.

## Verificación del paso

- [ ] Sin sesión, cualquier ruta privada redirige a `/login`
- [ ] Con rol `user`, escribir `/categories` en la barra **redirige a `/`**
- [ ] Con rol `user`, el enlace "Categorías" no aparece en la navegación
- [ ] Con rol `admin`, `/categories` carga normalmente
- [ ] Recargar en una ruta privada con sesión válida **no** expulsa

**Siguiente:** [06-hooks.md](./06-hooks.md)
