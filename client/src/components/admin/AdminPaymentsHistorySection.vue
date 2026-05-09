<template>
  <section id="historial-pagos" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-delta-text">Payment History</h2>
        <p class="text-sm text-gray-600">Browse and open previously imported receipts.</p>
      </div>
      <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
        {{ recibosExistentesCount }} records
      </span>
    </div>

    <div v-if="loadingSearch" class="mt-4 rounded-lg bg-delta-gray p-3 text-sm text-gray-600">Loading receipts...</div>

    <div v-else class="mt-4 space-y-3">
      <div>
        <label for="payment-history-search" class="sr-only">Search employee</label>
        <input
          id="payment-history-search"
          :value="search"
          type="search"
          placeholder="Search employee by name, email, or QuickBooks ID"
          class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-delta-blue transition placeholder:text-slate-400 focus:border-delta-blue focus:ring-2"
          @input="emit('update:search', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <article
        v-for="empleado in historialAgrupadoPorEmpleado"
        :key="empleado.key"
        class="rounded-xl border border-slate-200 bg-white p-4"
      >
        <button
          type="button"
          class="flex w-full items-start justify-between gap-3 text-left"
          @click="emit('toggle-employee-history', empleado.key)"
        >
          <div>
            <p class="text-sm font-semibold text-delta-text">{{ empleado.nombre }}</p>
            <p class="mt-1 text-xs text-gray-500">
              {{ empleado.username || 'No username' }}
              <span v-if="empleado.quickbooksId">| {{ empleado.quickbooksId }}</span>
            </p>
          </div>

          <div class="text-right">
            <p class="text-xs text-slate-600">{{ empleado.pagos.length }} payments</p>
            <p class="text-xs font-medium text-green-700">${{ empleado.montoTotal.toFixed(2) }}</p>
          </div>
        </button>

        <div v-if="empleadoHistorialAbierto === empleado.key" class="mt-4 space-y-2 border-t border-slate-100 pt-4">
          <article
            v-for="recibo in empleado.pagos.slice(0, 4)"
            :key="`existente-${recibo.id}`"
            class="rounded-xl border border-gray-200 bg-white transition hover:border-delta-blue/30"
          >
            <button
              type="button"
              class="flex w-full items-center justify-between gap-3 rounded-xl p-3 text-left hover:bg-delta-gray"
              @click="emit('toggle-recibo-history', recibo, empleado.key)"
            >
              <div>
                <p class="text-sm font-semibold text-delta-text">{{ recibo.fecha_pago }}</p>
                <p class="text-xs text-gray-500">{{ recibo.periodo }}</p>
                <p class="text-xs text-slate-400">{{ getPaystubSummary(recibo) }}</p>
              </div>
              <p class="text-sm font-semibold text-green-700">${{ Number(recibo.monto).toFixed(2) }}</p>
            </button>

            <section v-if="reciboSeleccionadoId === recibo.id" class="border-t border-slate-100 p-3">
              <ReciboDetalle :recibo="recibo" @back="emit('close-recibo')" @print="emit('print-recibo')" />
            </section>
          </article>

          <div v-if="empleado.pagos.length > 4" class="flex justify-end pt-1">
            <button
              type="button"
              class="rounded-lg px-2 py-1 text-sm font-medium text-delta-blue transition hover:bg-delta-gray hover:text-blue-700"
              @click="emit('view-all-payments', empleado.key)"
            >
              Ver todos
            </button>
          </div>
        </div>
      </article>

      <p
        v-if="!historialAgrupadoPorEmpleado.length"
        class="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500"
      >
        No receipts to display with the current filter.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import ReciboDetalle from '../payroll/ReciboDetalle.vue'
import type { Recibo } from '../../types/payroll'

interface HistorialEmpleadoItem {
  key: string
  nombre: string
  quickbooksId: string
  username: string
  pagos: Recibo[]
  montoTotal: number
}

defineProps<{
  loadingSearch: boolean
  search: string
  recibosExistentesCount: number
  historialAgrupadoPorEmpleado: HistorialEmpleadoItem[]
  empleadoHistorialAbierto: string | null
  reciboSeleccionadoId: number | null
}>()

const emit = defineEmits<{
  (event: 'update:search', value: string): void
  (event: 'toggle-employee-history', employeeKey: string): void
  (event: 'toggle-recibo-history', recibo: Recibo, employeeKey?: string): void
  (event: 'view-all-payments', employeeKey: string): void
  (event: 'close-recibo'): void
  (event: 'print-recibo'): void
}>()

const getPaystubSummary = (recibo: Recibo) => {
  const checkNumber = String(
    recibo.detalles?.check_number ||
      recibo.detalles?.numero_cheque ||
      recibo.detalles?.cheque ||
      recibo.detalles?.checkNumber ||
      '',
  ).trim()

  if (checkNumber) {
    return `Check ${checkNumber}`
  }

  const paystubKey = String(recibo.paystubKey || recibo.detalles?.paystub_key || '').trim()
  return paystubKey ? `Paystub ${paystubKey.slice(-8).toUpperCase()}` : `Receipt #${recibo.id}`
}
</script>
