import http from './http'
import type { LoginCredentials, LoginResponse } from '../types/auth'

export const loginRequest = async (credentials: LoginCredentials) => {
  const { data } = await http.post<LoginResponse>('/login', credentials)
  return data
}
