import { api } from "../lib/axiosConfig"
import { tokenStorage } from "../lib/tokenStorage"
import type { AuthResponse } from "../types/AuthResponse"
import type { User } from "../types/User"

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

export async function logout(): Promise<void> {
  const { data } = await api.post("/auth/logout")
  tokenStorage.remove()
  return data
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/users/me")
  return data
}
