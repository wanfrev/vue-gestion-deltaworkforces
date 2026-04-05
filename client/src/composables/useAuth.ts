import { ref } from 'vue'
import axios from 'axios'
import { loginRequest } from '../api/auth'
import { useAuthStore } from '../store/auth'
import router from '../router'
import type { LoginCredentials } from '../types/auth'

const resolveLoginErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiMessage = error.response?.data?.msg

    if (typeof apiMessage === 'string' && apiMessage.trim()) {
      return apiMessage
    }
  }

  return 'Credenciales inválidas o servidor no disponible.'
}

export const useAuth = () => {
  const authStore = useAuthStore()
  const loading = ref(false)
  const errorMessage = ref('')

  const login = async (credentials: LoginCredentials) => {
    loading.value = true
    errorMessage.value = ''

    try {
      const session = await loginRequest(credentials)
      authStore.setSession(session)
      return true
    } catch (error) {
      errorMessage.value = resolveLoginErrorMessage(error)
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    authStore.clearSession()
    router.replace('/')
  }

  return {
    loading,
    errorMessage,
    login,
    logout,
    authStore,
  }
}
