<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 text-white">
    <div
      class="absolute inset-0"
      aria-hidden="true"
      style="background-image: linear-gradient(135deg, #050814 0%, #08142a 42%, #02040a 100%);"
    ></div>

    <div
      class="absolute inset-0 opacity-90"
      aria-hidden="true"
      style="background-image: radial-gradient(circle at 18% 18%, rgba(20, 72, 168, 0.48), transparent 24%), radial-gradient(circle at 78% 14%, rgba(96, 165, 250, 0.2), transparent 20%), radial-gradient(circle at 50% 84%, rgba(2, 6, 23, 0.35), transparent 30%), linear-gradient(120deg, rgba(255, 255, 255, 0.07), transparent 24%, transparent 76%, rgba(255, 255, 255, 0.03));"
    ></div>

    <div class="absolute inset-0 opacity-35 mix-blend-screen" aria-hidden="true">
      <div class="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-white/10 to-transparent"></div>
      <div class="absolute left-1/2 top-1/2 h-136 w-136 -translate-x-1/2 -translate-y-1/2 rounded-full bg-delta-blue/20 blur-3xl"></div>
    </div>

    <div class="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/92 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
      <div class="mb-8 flex justify-center px-4 pt-4 pb-3">
        <DeltaLogo size="2xl" centered />
      </div>

      <h1 class="mb-2 text-3xl font-bold text-delta-text">Employee Login</h1>
      <p class="mb-8 text-sm text-gray-600">Sign in with your credentials to view your payroll receipts.</p>

      <form class="space-y-4" @submit.prevent="submitLogin">
        <div>
          <label for="username" class="mb-1 block text-sm font-medium text-gray-700">Username</label>
          <div class="relative">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="m5 8 7 5 7-5" />
              </svg>
            </span>
            <input
              id="username"
              v-model="username"
              type="text"
              autocomplete="username"
              placeholder="jdoe2024"
              class="w-full rounded-lg border border-gray-300 bg-white/95 px-3 py-3 pl-11 text-delta-text outline-none transition duration-200 placeholder:text-gray-400 focus:border-delta-blue focus:ring-4 focus:ring-delta-blue/20"
            />
          </div>
        </div>

        <div>
          <label for="password" class="mb-1 block text-sm font-medium text-gray-700">Password</label>
          <div class="relative">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 10V7.5A4 4 0 0 1 12 3.5v0a4 4 0 0 1 4 4V10" />
              </svg>
            </span>
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full rounded-lg border border-gray-300 bg-white/95 px-3 py-3 pl-11 pr-11 text-delta-text outline-none transition duration-200 placeholder:text-gray-400 focus:border-delta-blue focus:ring-4 focus:ring-delta-blue/20"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-delta-blue focus-visible:outline-none focus-visible:text-delta-blue"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              <svg
                v-if="showPassword"
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 3 21 21" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.7 10.7a2 2 0 0 0 2.6 2.6" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.1 5.1A10.8 10.8 0 0 1 12 4.6c5 0 8.8 4.2 9.9 7.1a1 1 0 0 1 0 .7 13 13 0 0 1-3.3 4.8" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.2 6.2a13 13 0 0 0-4.1 5.5 1 1 0 0 0 0 .7c1.1 2.9 4.9 7.1 9.9 7.1 1.4 0 2.8-.3 4-.9" />
              </svg>
              <svg
                v-else
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.1 12.4a1 1 0 0 1 0-.7C3.2 8.8 7 4.6 12 4.6s8.8 4.2 9.9 7.1a1 1 0 0 1 0 .7c-1.1 2.9-4.9 7.1-9.9 7.1S3.2 15.3 2.1 12.4Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>

        <p v-if="validationError" class="text-sm text-red-600">{{ validationError }}</p>
        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>

        <DeltaButton type="submit" :loading="loading" :gradient="true" :spinner-only="true" full-width class="py-3 text-base font-semibold tracking-wide">
          Sign In
        </DeltaButton>

        <p class="pt-1 text-center text-xs text-gray-500">Your data is protected and only visible to your account.</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import DeltaButton from '../components/common/DeltaButton.vue'
import DeltaLogo from '../components/common/DeltaLogo.vue'
import { useAuth } from '../composables/useAuth'
import { resolveHomeByRole } from '../constants/roles'

const router = useRouter()
const { loading, errorMessage, login, authStore } = useAuth()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const validationError = ref('')

const submitLogin = async () => {
  if (!username.value.trim() || !password.value.trim()) {
    validationError.value = 'Username and password are required.'
    return
  }

  validationError.value = ''

  const ok = await login({
    username: username.value.trim(),
    password: password.value,
  })

  if (ok) {
    router.push(resolveHomeByRole(authStore.user?.rol))
  }
}
</script>
