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
