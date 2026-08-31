import { Link, Outlet, useNavigate } from "react-router"
import { useAuth } from "../context/AuthContext"
import { ErrorBoundary } from "./ErrorBoundary"

const linkClass = "text-sm text-gray-600 hover:text-blue-600"

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
          {role === "admin" && (
            <Link to="/categories" className={linkClass}>Categorías</Link>
          )}

          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {user?.name} ({role})
            </span>
            <button
              onClick={handleLogout}
              className="rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
            >
              Salir
            </button>
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
