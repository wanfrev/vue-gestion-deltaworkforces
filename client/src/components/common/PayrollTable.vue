<template>
  <template v-if="loading">
    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-black/5">
      <div class="hidden grid-cols-[1.6fr_1fr_0.9fr_auto] gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 md:grid">
        <div class="h-3 w-28 animate-pulse rounded bg-slate-200"></div>
        <div class="h-3 w-20 animate-pulse rounded bg-slate-200"></div>
        <div class="mx-auto h-3 w-20 animate-pulse rounded bg-slate-200"></div>
        <div class="ml-auto h-3 w-16 animate-pulse rounded bg-slate-200"></div>
      </div>

      <div v-for="index in 4" :key="`skeleton-${index}`" class="border-b border-slate-100 px-4 py-4 last:border-b-0 sm:px-5 md:py-3.5">
        <div class="grid gap-4 md:grid-cols-[1.6fr_1fr_0.9fr_auto] md:items-center md:gap-3">
          <div class="space-y-2">
            <div class="h-3 w-36 animate-pulse rounded bg-slate-200"></div>
            <div class="h-3 w-28 animate-pulse rounded bg-slate-200"></div>
          </div>
          <div class="h-6 w-20 animate-pulse rounded bg-slate-200 md:mx-auto"></div>
          <div class="h-6 w-24 animate-pulse rounded-full bg-slate-200"></div>
          <div class="flex gap-2 md:justify-end">
            <div class="h-8 w-8 animate-pulse rounded-full bg-slate-200"></div>
          </div>
        </div>
      </div>
    </section>
  </template>

  <template v-else>
    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-black/5">
      <div class="hidden grid-cols-[1.6fr_1fr_0.9fr_auto] gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
        <p>Periodo</p>
        <p class="text-center">Monto neto</p>
        <p>Estado</p>
        <p class="text-right">Acciones</p>
      </div>

      <div v-for="recibo in recibos" :key="recibo.id" class="border-b border-slate-100 last:border-b-0">
        <div
          class="grid cursor-pointer gap-4 px-4 py-5 transition-transform duration-200 hover:-translate-y-1 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-delta-blue/30 sm:px-5 md:grid-cols-[1.6fr_1fr_0.9fr_auto] md:items-center md:gap-3 md:py-4"
          role="button"
          tabindex="0"
          @click="$emit('view-details', recibo)"
          @keydown.enter.prevent="$emit('view-details', recibo)"
          @keydown.space.prevent="$emit('view-details', recibo)"
        >
          <div class="flex items-start gap-2.5">
            <span class="mt-0.5 text-slate-400">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
                <rect x="3" y="4" width="18" height="17" rx="2"></rect>
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 2.5V6M16 2.5V6M3 9h18"></path>
              </svg>
            </span>
            <div>
              <p class="text-sm font-semibold leading-relaxed text-slate-700">{{ recibo.periodo }}</p>
              <p class="mt-0.5 text-xs leading-relaxed text-gray-500">Pago: {{ formatPayDate(recibo.fecha_pago) }}</p>
            </div>
          </div>

          <p class="text-left font-mono text-lg font-bold leading-relaxed text-slate-800 md:text-center">${{ formatCurrency(recibo.monto) }}</p>

          <div class="md:justify-self-start">
            <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" :class="getStatusClass(recibo.estado)">
              <CheckCircle2 v-if="isPaidStatus(recibo.estado)" class="h-3.5 w-3.5" :size="14" :stroke-width="2" />
              {{ getStatusLabel(recibo.estado) }}
            </span>
          </div>

          <div class="flex flex-wrap gap-2 md:justify-end">
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-delta-blue/40 hover:text-delta-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-delta-blue/30 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="isDownloading(recibo.id)"
              :aria-label="`Descargar recibo ${recibo.id}`"
              @click.stop="$emit('download-pdf', recibo)"
            >
              <svg
                v-if="isDownloading(recibo.id)"
                class="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle class="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3"></circle>
                <path class="opacity-90" fill="currentColor" d="M21 12a9 9 0 0 0-9-9v3a6 6 0 0 1 6 6h3Z"></path>
              </svg>
              <svg
                v-else
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.9"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v11m0 0 4-4m-4 4-4-4" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 17.5v.5A2 2 0 0 0 6 20h12a2 2 0 0 0 2-2v-.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="!recibos.length" class="px-5 py-10">
        <div class="mx-auto max-w-md rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <Wallet class="mx-auto h-7 w-7 text-slate-400" :size="28" :stroke-width="1.8" />
          <p class="mt-3 text-sm font-semibold text-slate-700">Tu primer pago aparecera aqui pronto.</p>
          <p class="mt-1 text-sm text-slate-500">Bienvenido a Delta, estamos preparando tu historial de nomina.</p>
        </div>
      </div>
    </section>
  </template>
</template>

<script setup lang="ts">
import { CheckCircle2, Wallet } from 'lucide-vue-next'
import type { Recibo } from '../../types/payroll'

const props = withDefaults(
  defineProps<{
    recibos: Recibo[]
    loading: boolean
    downloadingReciboId?: number | null
  }>(),
  {
    downloadingReciboId: null,
  },
)

defineEmits<{
  'view-details': [recibo: Recibo]
  'download-pdf': [recibo: Recibo]
  'download-latest': [recibo: Recibo]
}>()

const isDownloading = (reciboId: number) => props.downloadingReciboId === reciboId

const formatCurrency = (value: number) => Number(value).toFixed(2)

const formatPayDate = (dateIso: string) => {
  const date = new Date(`${dateIso}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return dateIso
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const isPaidStatus = (estado?: string) => {
  const status = (estado || '').trim().toLowerCase()
  return !status || status === 'pagado' || status.includes('pag')
}

const getStatusClass = (estado?: string) => {
  const status = (estado || '').trim().toLowerCase()

  if (status === 'en proceso' || status === 'en procesamiento' || status.includes('proceso')) {
    return 'bg-amber-100 text-amber-700'
  }

  if (status === 'revisar' || status === 'error' || status.includes('error')) {
    return 'bg-rose-100 text-rose-700'
  }

  return 'bg-emerald-100 text-emerald-700'
}

const getStatusLabel = (estado?: string) => {
  const status = (estado || '').trim().toLowerCase()

  if (status === 'en procesamiento' || status.includes('proceso')) {
    return 'En proceso'
  }

  if (status === 'revisar' || status === 'error' || status.includes('error')) {
    return 'Requiere revisión'
  }

  return 'Pagado'
}
</script>
