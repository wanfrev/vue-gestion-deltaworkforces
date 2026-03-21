<template>
  <div class="min-h-screen bg-delta-gray p-4 sm:p-6">
    <div class="mx-auto max-w-5xl">
      <AppHeader title="Carga de Excel" subtitle="Módulo exclusivo para cliente administrador." @logout="logout" />

      <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 class="text-lg font-semibold text-delta-text">Panel Admin</h2>
        <p class="mt-2 text-sm text-gray-600">
          Desde esta ruta se habilita la carga de nómina por Excel para usuarios con rol administrador.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '../components/layout/AppHeader.vue'
import { useAuth } from '../composables/useAuth'

const { logout } = useAuth()
</script>
