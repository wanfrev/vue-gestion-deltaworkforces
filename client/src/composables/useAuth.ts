import { ref } from 'vue'
import { loginRequest } from '../api/auth'
import { useAuthStore } from '../store/auth'
import type { LoginCredentials } from '../types/auth'

const USE_LOCAL_MOCK = import.meta.env.VITE_USE_LOCAL_MOCK === 'true'

const getNombreDesdeEmail = (email: string) => {
  const parteLocal = email.split('@')[0] || 'Empleado'
  const [nombre] = parteLocal.split('.')
  return nombre.charAt(0).toUpperCase() + nombre.slice(1)
}

export const useAuth = () => {
  const authStore = useAuthStore()
  const loading = ref(false)
  const errorMessage = ref('')

  const login = async (credentials: LoginCredentials) => {
    loading.value = true
    errorMessage.value = ''

    if (USE_LOCAL_MOCK) {
      authStore.setSession({
        token: 'mock-token',
        user: {
          id: 0,
          nombre: getNombreDesdeEmail(credentials.email),
          email: credentials.email,
          rol: credentials.email.includes('admin') ? 'admin' : 'empleado',
        },
      })
      loading.value = false
      return true
    }

    try {
      const session = await loginRequest(credentials)
      authStore.setSession(session)
      return true
    } catch {
      errorMessage.value = 'Credenciales inválidas o servidor no disponible.'
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    authStore.clearSession()
  }

  return {
    loading,
    errorMessage,
    login,
    logout,
    authStore,
  }
}
