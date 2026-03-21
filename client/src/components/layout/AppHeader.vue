<template>
  <header class="mb-6 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-black/5 sm:mb-8 sm:px-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-start gap-3">
        <DeltaLogo size="sm" />
        <div>
          <h1 class="text-2xl font-bold text-delta-text">{{ title }}</h1>
          <p v-if="subtitle" class="text-sm text-gray-500">{{ subtitle }}</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <RouterLink
          to="/dashboard"
          class="rounded-lg border border-transparent px-3 py-2 text-sm font-semibold text-delta-blue transition hover:border-delta-blue/20 hover:bg-delta-gray"
        >
          Mis Recibos
        </RouterLink>
        <RouterLink
          to="/admin"
          class="rounded-lg border border-transparent px-3 py-2 text-sm font-semibold text-delta-blue transition hover:border-delta-blue/20 hover:bg-delta-gray"
        >
          Admin
        </RouterLink>
        <DeltaButton v-if="showLogout" @click="$emit('logout')">Cerrar Sesión</DeltaButton>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import DeltaButton from '../common/DeltaButton.vue'
import DeltaLogo from '../common/DeltaLogo.vue'

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
