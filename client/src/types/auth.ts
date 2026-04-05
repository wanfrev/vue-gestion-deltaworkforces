import type { Role } from '../constants/roles'

export const AUTH_SESSION_KEY = 'delta.auth.session'

export interface AuthUser {
  id: number
  nombre: string
  username: string
  email?: string
  rol: Role
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}
