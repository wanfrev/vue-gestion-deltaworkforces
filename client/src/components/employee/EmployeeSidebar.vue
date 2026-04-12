<template>
  <aside class="w-full border-b border-slate-800/70 bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 md:w-80 md:border-r md:border-b-0 md:border-r-slate-800/70">
    <div class="sticky top-0 px-5 py-6 md:px-6">
      <div class="mb-7 flex justify-center">
        <DeltaLogo size="xl" centered />
      </div>

      <nav class="space-y-1.5 text-sm">
        <button
          type="button"
          class="group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl border px-3 py-2.5 text-left font-medium transition"
          :class="seccionActiva === 'mis-pagos'
            ? 'border-slate-700 bg-slate-800/80 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
            : 'border-transparent text-slate-300 hover:border-slate-700/80 hover:bg-slate-800/60 hover:text-slate-100'"
          @click="emit('change-section', 'mis-pagos')"
        >
          <span class="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-r-full transition" :class="seccionActiva === 'mis-pagos' ? 'bg-cyan-400' : 'bg-transparent group-hover:bg-slate-600/60'"></span>
          <Wallet :size="16" :stroke-width="1.75" :class="seccionActiva === 'mis-pagos' ? 'text-cyan-300' : 'text-slate-400 group-hover:text-slate-100'" />
          <span>My Payments</span>
        </button>
        <button
          type="button"
          class="group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl border px-3 py-2.5 text-left font-medium transition"
          :class="seccionActiva === 'mi-perfil'
            ? 'border-slate-700 bg-slate-800/80 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
            : 'border-transparent text-slate-300 hover:border-slate-700/80 hover:bg-slate-800/60 hover:text-slate-100'"
          @click="emit('change-section', 'mi-perfil')"
        >
          <span class="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-r-full transition" :class="seccionActiva === 'mi-perfil' ? 'bg-cyan-400' : 'bg-transparent group-hover:bg-slate-600/60'"></span>
          <User :size="16" :stroke-width="1.75" :class="seccionActiva === 'mi-perfil' ? 'text-cyan-300' : 'text-slate-400 group-hover:text-slate-100'" />
          <span>My Profile</span>
        </button>
      </nav>

      <div class="mt-6 rounded-2xl border border-slate-700/80 bg-slate-800/45 p-3 text-xs text-slate-300 backdrop-blur-xl">
        <p class="font-semibold text-slate-100">Summary</p>
        <p class="mt-2">Last payment: {{ ultimoPagoFechaLabel }}</p>
        <p>Monthly hours: {{ horasMesLabel }} hrs</p>
        <p>YTD: {{ ytdLabel }}</p>
      </div>

      <DeltaButton class="mt-6 w-full" variant="secondary" @click="emit('logout')">Sign out</DeltaButton>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { User, Wallet } from 'lucide-vue-next'
import DeltaButton from '../common/DeltaButton.vue'
import DeltaLogo from '../common/DeltaLogo.vue'

type EmployeeSection = 'mis-pagos' | 'mi-perfil'

defineProps<{
  seccionActiva: EmployeeSection
  ultimoPagoFechaLabel: string
  horasMesLabel: string
  ytdLabel: string
}>()

const emit = defineEmits<{
  (event: 'change-section', section: EmployeeSection): void
  (event: 'logout'): void
}>()
</script>
