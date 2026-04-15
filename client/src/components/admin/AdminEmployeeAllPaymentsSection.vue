<template>
  <section id="historial-pagos-completo" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <button
          type="button"
          class="mb-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          @click="emit('back')"
        >
          Volver
        </button>

        <h2 class="text-lg font-semibold text-delta-text">Todos los pagos</h2>
        <p class="text-sm text-gray-600">
          {{ empleadoNombre }}
          <span v-if="empleadoUsername">| {{ empleadoUsername }}</span>
        </p>
      </div>

      <div class="text-right">
        <p class="text-xs text-slate-600">Mostrando {{ pagosFiltrados.length }} de {{ pagos.length }} pagos</p>
        <p class="text-xs font-medium text-green-700">${{ montoTotalFiltrado.toFixed(2) }}</p>
      </div>
    </div>

    <div class="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-4">
      <label class="space-y-1">
        <span class="text-xs font-medium text-slate-600">Fecha desde</span>
        <input
          v-model="filtroFechaDesde"
          type="date"
          class="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none transition focus:border-delta-blue"
        />
      </label>

      <label class="space-y-1">
        <span class="text-xs font-medium text-slate-600">Fecha hasta</span>
        <input
          v-model="filtroFechaHasta"
          type="date"
          class="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none transition focus:border-delta-blue"
        />
      </label>

      <label class="space-y-1">
        <span class="text-xs font-medium text-slate-600">Monto minimo</span>
        <input
          v-model="filtroMontoMin"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          class="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none transition focus:border-delta-blue"
        />
      </label>

      <label class="space-y-1">
        <span class="text-xs font-medium text-slate-600">Monto maximo</span>
        <input
          v-model="filtroMontoMax"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          class="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none transition focus:border-delta-blue"
        />
      </label>

      <div class="sm:col-span-2 lg:col-span-4 flex justify-end">
        <button
          type="button"
          class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
          @click="limpiarFiltros"
        >
          Limpiar filtros
        </button>
      </div>
    </div>

    <div v-if="!pagos.length" class="mt-4 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
      Este empleado no tiene pagos para mostrar.
    </div>

    <div v-else-if="!pagosFiltrados.length" class="mt-4 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
      No hay pagos que coincidan con los filtros seleccionados.
    </div>

    <div v-else class="mt-4 space-y-2">
      <article
        v-for="recibo in pagosFiltrados"
        :key="`all-${recibo.id}`"
        class="rounded-xl border border-gray-200 bg-white transition hover:border-delta-blue/30"
      >
        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 rounded-xl p-3 text-left hover:bg-delta-gray"
          @click="emit('toggle-recibo-history', recibo, employeeKey)"
        >
          <div>
            <p class="text-sm font-semibold text-delta-text">{{ recibo.fecha_pago }}</p>
            <p class="text-xs text-gray-500">{{ recibo.periodo }}</p>
          </div>
          <p class="text-sm font-semibold text-green-700">${{ Number(recibo.monto).toFixed(2) }}</p>
        </button>

        <section v-if="reciboSeleccionadoId === recibo.id" class="border-t border-slate-100 p-3">
          <ReciboDetalle :recibo="recibo" @back="emit('close-recibo')" @print="emit('print-recibo')" />
        </section>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
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

const props = defineProps<{
  empleado: HistorialEmpleadoItem | null
  reciboSeleccionadoId: number | null
}>()

const emit = defineEmits<{
  (event: 'back'): void
  (event: 'toggle-recibo-history', recibo: Recibo, employeeKey?: string): void
  (event: 'close-recibo'): void
  (event: 'print-recibo'): void
}>()

const employeeKey = computed(() => props.empleado?.key)
const empleadoNombre = computed(() => props.empleado?.nombre || 'Empleado')
const empleadoUsername = computed(() => props.empleado?.username || '')
const pagos = computed(() => props.empleado?.pagos || [])

const filtroFechaDesde = ref('')
const filtroFechaHasta = ref('')
const filtroMontoMin = ref('')
const filtroMontoMax = ref('')

const parseFechaPago = (value?: string): number | null => {
  if (!value) {
    return null
  }

  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? null : timestamp
}

const pagosFiltrados = computed(() => {
  const fechaDesde = filtroFechaDesde.value ? Date.parse(`${filtroFechaDesde.value}T00:00:00`) : null
  const fechaHasta = filtroFechaHasta.value ? Date.parse(`${filtroFechaHasta.value}T23:59:59`) : null
  const montoMin = filtroMontoMin.value !== '' ? Number(filtroMontoMin.value) : null
  const montoMax = filtroMontoMax.value !== '' ? Number(filtroMontoMax.value) : null

  return pagos.value.filter((recibo) => {
    const fechaPago = parseFechaPago(recibo.fecha_pago)
    const monto = Number(recibo.monto || 0)

    if (fechaDesde !== null && (fechaPago === null || fechaPago < fechaDesde)) {
      return false
    }

    if (fechaHasta !== null && (fechaPago === null || fechaPago > fechaHasta)) {
      return false
    }

    if (montoMin !== null && !Number.isNaN(montoMin) && monto < montoMin) {
      return false
    }

    if (montoMax !== null && !Number.isNaN(montoMax) && monto > montoMax) {
      return false
    }

    return true
  })
})

const montoTotalFiltrado = computed(() => {
  return pagosFiltrados.value.reduce((sum, recibo) => sum + Number(recibo.monto || 0), 0)
})

const limpiarFiltros = () => {
  filtroFechaDesde.value = ''
  filtroFechaHasta.value = ''
  filtroMontoMin.value = ''
  filtroMontoMax.value = ''
}
</script>
