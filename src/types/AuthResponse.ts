import type { User } from "../types/User"

export interface AuthResponse {
  accessToken: string
  user: User
}
