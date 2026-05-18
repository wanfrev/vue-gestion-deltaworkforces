import axios from 'axios'
import { getActivePinia } from 'pinia'
import { useAuthStore } from '../store/auth'
import { AUTH_SESSION_KEY } from '../types/auth'

const baseURL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

const http = axios.create({
  baseURL,
  timeout: 10000,
})

http.interceptors.request.use((config) => {
  let token: string | undefined

  const pinia = getActivePinia()

  if (pinia) {
    try {
      const authStore = useAuthStore(pinia)
      token = authStore.token
    } catch {
      // Pinia store not available, fall back to localStorage
    }
  }

  if (!token) {
    const sessionRaw = localStorage.getItem(AUTH_SESSION_KEY)

    if (sessionRaw) {
      try {
        const session = JSON.parse(sessionRaw) as { token?: string }
        token = session.token
      } catch {
        localStorage.removeItem(AUTH_SESSION_KEY)
      }
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default http
