import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AuthUser, LoginResponse } from '../types/auth'
import { AUTH_SESSION_KEY } from '../types/auth'

interface AuthSession {
  token: string
  user: AuthUser
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>('')
  const user = ref<AuthUser | null>(null)

  const isAuthenticated = computed(() => Boolean(token.value))

  const persist = () => {
    if (!token.value || !user.value) {
      localStorage.removeItem(AUTH_SESSION_KEY)
      return
    }

    const payload: AuthSession = {
      token: token.value,
      user: user.value,
    }

    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(payload))
  }

  const setSession = ({ token: newToken, user: newUser }: LoginResponse) => {
    token.value = newToken
    user.value = newUser
    persist()
  }

  const clearSession = () => {
    token.value = ''
    user.value = null
    persist()
  }

  const hydrate = () => {
    const raw = localStorage.getItem(AUTH_SESSION_KEY)

    if (!raw) {
      return
    }

    try {
      const session = JSON.parse(raw) as AuthSession
      token.value = session.token
      user.value = session.user
    } catch {
      clearSession()
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    setSession,
    clearSession,
    hydrate,
  }
})
