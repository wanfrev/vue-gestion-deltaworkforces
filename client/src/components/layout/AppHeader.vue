<template>
  <header class="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-delta-text">{{ title }}</h1>
      <p v-if="subtitle" class="text-sm text-gray-500">{{ subtitle }}</p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <RouterLink
        to="/dashboard"
        class="rounded-lg px-3 py-2 text-sm font-medium text-delta-blue transition hover:bg-delta-gray"
      >
        Mis Recibos
      </RouterLink>
      <RouterLink
        to="/admin"
        class="rounded-lg px-3 py-2 text-sm font-medium text-delta-blue transition hover:bg-delta-gray"
      >
        Admin
      </RouterLink>
      <DeltaButton v-if="showLogout" @click="$emit('logout')">Cerrar Sesión</DeltaButton>
    </div>
  </header>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import DeltaButton from '../common/DeltaButton.vue'

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    showLogout?: boolean
  }>(),
  {
    subtitle: '',
    showLogout: true,
  },
)

defineEmits<{
  logout: []
}>()
</script>
