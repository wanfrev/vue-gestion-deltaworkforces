<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
    <div
      class="absolute inset-0 bg-cover bg-center"
      :style="{ backgroundImage: `url(${heroImage})` }"
      aria-hidden="true"
    ></div>
    <div class="absolute inset-0 bg-[#1A1A1A]/55 backdrop-blur-sm" aria-hidden="true"></div>

    <div class="relative z-10 w-full max-w-md rounded-2xl border border-white/15 bg-white/95 p-8 shadow-xl">
      <p class="mb-2 inline-flex rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-semibold text-[#1448A8]">
        Portal Seguro Delta
      </p>
      <h1 class="mb-2 text-2xl font-bold text-[#1A1A1A]">Acceso de Empleado</h1>
      <p class="mb-6 text-sm text-gray-600">Ingresa con tus credenciales para consultar tus recibos de nómina.</p>

      <form class="space-y-4" @submit.prevent="submitLogin">
        <div>
          <label for="email" class="mb-1 block text-sm font-medium text-gray-700">Correo electrónico</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="empleado@empresa.com"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-[#1448A8]"
          />
        </div>

        <div>
          <label for="password" class="mb-1 block text-sm font-medium text-gray-700">Contraseña</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-[#1448A8]"
          />
        </div>

        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>

        <button type="submit" class="w-full rounded-lg bg-[#1448A8] py-2 font-medium text-white transition hover:bg-[#0F3B8C]">
          Entrar
        </button>

        <p class="text-center text-xs text-gray-500">
          Tus datos están protegidos y solo muestran información de tu cuenta.
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import heroImage from '../assets/hero.png'

const emit = defineEmits(['login'])

const email = ref('')
const password = ref('')
const errorMessage = ref('')

const submitLogin = () => {
  if (!email.value.trim() || !password.value.trim()) {
    errorMessage.value = 'Escribe cualquier correo y contraseña para continuar.'
    return
  }

  errorMessage.value = ''
  emit('login', {
    email: email.value,
  })
}
</script>
