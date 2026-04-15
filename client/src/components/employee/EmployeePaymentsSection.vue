<template>
  <section>
    <section class="mb-5 grid gap-4 md:grid-cols-3">
      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Year-to-Date ({{ ytdYear }})</p>
        <div class="mt-2 flex items-baseline gap-2">
          <p class="font-mono text-2xl font-bold text-slate-900 sm:text-3xl">{{ ytdMontoLabel }}</p>
          <span class="text-sm font-semibold text-emerald-600">USD</span>
        </div>
        <p class="mt-1 text-sm text-slate-500">Yearly net pay total</p>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest Payment</p>
        <div class="mt-2 flex items-baseline gap-2">
          <p class="font-mono text-2xl font-bold text-slate-900 sm:text-3xl">{{ ultimoPagoMontoLabel }}</p>
          <span class="text-sm font-semibold text-emerald-600">USD</span>
        </div>
        <p class="mt-1 text-sm text-slate-500">Paid on {{ ultimoPagoFechaLabel }}</p>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Hours (Month)</p>
        <p class="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{{ horasMesLabel }} <span class="text-lg font-semibold text-slate-500 sm:text-xl">hrs</span></p>
        <p class="mt-1 text-sm text-slate-500">{{ etiquetaMes }}</p>
      </article>
    </section>

    <ReciboDetalle
      v-if="reciboSeleccionado"
      :recibo="reciboSeleccionado"
      @back="emit('clear-selected')"
      @print="emit('download-pdf', reciboSeleccionado)"
    />

    <template v-else>
      <div class="mb-4 flex flex-wrap items-center justify-start gap-2 sm:justify-end">
        <label for="limite-recibos" class="text-sm text-slate-600">Show</label>
        <select
          id="limite-recibos"
          :value="limiteRecibos"
          class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-delta-blue"
          @change="onChangeLimit"
        >
          <option v-for="option in opcionesLimiteRecibos" :key="`limite-${option}`" :value="option">
            {{ option === 'all' ? 'All' : option }}
          </option>
        </select>
        <span class="text-sm text-slate-500">receipts</span>
      </div>

      <PayrollTable
        :recibos="recibos"
        :loading="loading"
        :downloading-recibo-id="downloadingReciboId"
        @view-details="emit('view-details', $event)"
        @download-pdf="emit('download-pdf', $event)"
      />
      <p v-if="limiteRecibos === 'all'" class="mt-6 text-center text-sm italic text-slate-500">
        Showing all available receipts ({{ recibos.length }}).
      </p>
      <p v-else class="mt-6 text-center text-sm italic text-slate-500">
        Showing the latest {{ recibos.length }} receipts (limit {{ limiteRecibos }}).
      </p>
    </template>
  </section>
</template>

<script setup lang="ts">
import PayrollTable from '../common/PayrollTable.vue'
import ReciboDetalle from '../payroll/ReciboDetalle.vue'
import type { Recibo } from '../../types/payroll'
import type { ReceiptLimitOption } from '../../composables/useEmployeeDashboardState'

defineProps<{
  ytdYear: string
  ytdMontoLabel: string
  ultimoPagoMontoLabel: string
  ultimoPagoFechaLabel: string
  horasMesLabel: string
  etiquetaMes: string
  reciboSeleccionado: Recibo | null
  recibos: Recibo[]
  loading: boolean
  downloadingReciboId: number | null
  limiteRecibos: ReceiptLimitOption
  opcionesLimiteRecibos: ReceiptLimitOption[]
}>()

const emit = defineEmits<{
  (event: 'update:limiteRecibos', value: ReceiptLimitOption): void
  (event: 'change-limit'): void
  (event: 'clear-selected'): void
  (event: 'view-details', recibo: Recibo): void
  (event: 'download-pdf', recibo: Recibo): void
}>()

const onChangeLimit = (event: Event) => {
  const rawValue = (event.target as HTMLSelectElement).value
  const value = rawValue === 'all' ? 'all' : (Number(rawValue) as ReceiptLimitOption)

  emit('update:limiteRecibos', value)
  emit('change-limit')
}
</script>
