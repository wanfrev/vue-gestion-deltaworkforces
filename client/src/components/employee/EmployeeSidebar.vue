<template>
  <div>
    <button
      v-if="isMobileOpen"
      type="button"
      class="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[1px] md:hidden"
      aria-label="Close navigation menu"
      @click="emit('close-mobile')"
    ></button>

    <aside
      class="z-50 w-[86vw] max-w-80 border-r border-slate-800/70 bg-linear-to-b from-[#0b1324] via-[#0f172a] to-[#0b1324] text-slate-100 transition-transform duration-200 md:static md:w-80 md:translate-x-0"
      :class="isMobileOpen ? 'fixed inset-y-0 left-0 translate-x-0' : 'fixed inset-y-0 left-0 -translate-x-full md:translate-x-0'"
    >
      <div class="flex h-full flex-col overflow-y-auto px-5 py-6 md:sticky md:top-0 md:px-6">
        <div class="mb-5 flex items-center justify-end md:hidden">
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900/60 text-slate-200 transition hover:border-slate-500"
            aria-label="Close menu"
            @click="emit('close-mobile')"
          >
            <X :size="18" :stroke-width="2" />
          </button>
        </div>

        <div class="mb-7 border-b border-slate-800/80 pb-5">
          <div class="flex justify-center">
            <DeltaLogo size="xl" centered />
          </div>
        </div>

        <div class="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Navigation</div>
        <nav class="space-y-1.5 text-sm">
        <button
          type="button"
          class="group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl border px-3 py-2.5 text-left font-medium transition"
          :class="seccionActiva === 'mis-pagos'
            ? 'border-slate-700 bg-slate-800/85 text-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
            : 'border-transparent text-slate-300 hover:border-slate-700/85 hover:bg-slate-800/65 hover:text-slate-100'"
          @click="onSectionClick('mis-pagos')"
        >
          <span class="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-r-full transition" :class="seccionActiva === 'mis-pagos' ? 'bg-delta-blue' : 'bg-transparent group-hover:bg-slate-600/60'"></span>
          <Wallet :size="16" :stroke-width="2" :class="seccionActiva === 'mis-pagos' ? 'text-blue-300' : 'text-slate-400 group-hover:text-slate-100'" />
          <span>My Payments</span>
        </button>
        <button
          type="button"
          class="group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl border px-3 py-2.5 text-left font-medium transition"
          :class="seccionActiva === 'mi-perfil'
            ? 'border-slate-700 bg-slate-800/85 text-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
            : 'border-transparent text-slate-300 hover:border-slate-700/85 hover:bg-slate-800/65 hover:text-slate-100'"
          @click="onSectionClick('mi-perfil')"
        >
          <span class="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-r-full transition" :class="seccionActiva === 'mi-perfil' ? 'bg-delta-blue' : 'bg-transparent group-hover:bg-slate-600/60'"></span>
          <User :size="16" :stroke-width="2" :class="seccionActiva === 'mi-perfil' ? 'text-blue-300' : 'text-slate-400 group-hover:text-slate-100'" />
          <span>My Profile</span>
        </button>
        </nav>

        <div class="mt-auto border-t border-slate-800/80 pt-5">
          <div class="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-3">
            <div class="flex items-center gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-sm font-semibold text-slate-200">
                {{ userInitial }}
              </div>
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-slate-100">{{ userName }}</p>
                <p class="text-xs uppercase tracking-wide text-slate-400">{{ userRole }}</p>
              </div>
            </div>
            <button
              type="button"
              class="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700/90 bg-slate-800/60 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
              @click="emit('logout')"
            >
              <LogOut :size="16" :stroke-width="2" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LogOut, User, Wallet, X } from 'lucide-vue-next'
import DeltaLogo from '../common/DeltaLogo.vue'

type EmployeeSection = 'mis-pagos' | 'mi-perfil'

const props = defineProps<{
  seccionActiva: EmployeeSection
  ultimoPagoFechaLabel: string
  horasMesLabel: string
  ytdLabel: string
  isMobileOpen: boolean
  userName: string
  userRole: string
}>()

const emit = defineEmits<{
  (event: 'change-section', section: EmployeeSection): void
  (event: 'logout'): void
  (event: 'close-mobile'): void
}>()

const onSectionClick = (section: EmployeeSection) => {
  emit('change-section', section)
  emit('close-mobile')
}

const userInitial = computed(() => props.userName.trim().charAt(0).toUpperCase() || 'E')
</script>
