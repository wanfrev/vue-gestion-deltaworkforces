import axios from 'axios'
import { AUTH_SESSION_KEY } from '../types/auth'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

const http = axios.create({
  baseURL,
  timeout: 10000,
})

http.interceptors.request.use((config) => {
  const sessionRaw = localStorage.getItem(AUTH_SESSION_KEY)

  if (!sessionRaw) {
    return config
  }

  try {
    const session = JSON.parse(sessionRaw) as { token?: string }

    if (session.token) {
      config.headers.Authorization = `Bearer ${session.token}`
    }
  } catch {
    localStorage.removeItem(AUTH_SESSION_KEY)
  }

  return config
})

export default http
