<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-delta-gray px-4 py-8">
    <div class="absolute inset-0 bg-linear-to-b from-white via-delta-gray to-delta-gray" aria-hidden="true"></div>

    <div class="relative z-10 w-full max-w-md rounded-2xl border border-gray-100 bg-white p-10 shadow-lg">
      <div class="mb-6 flex justify-center">
        <DeltaLogo size="lg" centered :show-subtitle="true" />
      </div>

      <h1 class="mb-2 text-3xl font-bold text-delta-text">Acceso de Empleado</h1>
      <p class="mb-8 text-sm text-gray-600">Ingresa con tus credenciales para consultar tus recibos de nómina.</p>

      <form class="space-y-4" @submit.prevent="submitLogin">
        <div>
          <label for="email" class="mb-1 block text-sm font-medium text-gray-700">Correo electrónico</label>
          <div class="relative">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">✉</span>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="empleado@empresa.com"
              class="w-full rounded-lg border border-gray-300 px-3 py-3 pl-10 outline-none transition focus:border-delta-blue"
            />
          </div>
        </div>

        <div>
          <label for="password" class="mb-1 block text-sm font-medium text-gray-700">Contraseña</label>
          <div class="relative">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="w-full rounded-lg border border-gray-300 px-3 py-3 pl-10 outline-none transition focus:border-delta-blue"
            />
          </div>
        </div>

        <p v-if="validationError" class="text-sm text-red-600">{{ validationError }}</p>
        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>

        <DeltaButton type="submit" :loading="loading" full-width class="py-3 text-base">Entrar</DeltaButton>

        <p class="pt-1 text-center text-xs text-gray-500">Tus datos están protegidos y solo muestran información de tu cuenta.</p>
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

const router = useRouter()
const { loading, errorMessage, login } = useAuth()

const email = ref('')
const password = ref('')
const validationError = ref('')

const submitLogin = async () => {
  if (!email.value.trim() || !password.value.trim()) {
    validationError.value = 'Email y contraseña son obligatorios.'
    return
  }

  validationError.value = ''

  const ok = await login({
    email: email.value,
    password: password.value,
  })

  if (ok) {
    router.push('/dashboard')
  }
}
</script>
