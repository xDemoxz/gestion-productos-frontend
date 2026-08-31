// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react"
import type { User } from "../types/User"
import * as authService from "../services/authService"
import { tokenStorage } from "../lib/tokenStorage"

interface AuthContextValue {
  user: User | null
  role: User["role"] | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true) // arrancamos SIN saber si hay sesión

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
    await authService.logout().catch(() => {}) // aunque falle la red, igual cerramos sesión local
    tokenStorage.remove()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, role: user?.role ?? null, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>")
  return ctx
}
