<template>
  <article class="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/10">
    <header class="border-b border-gray-200 bg-delta-gray/70 p-6 sm:p-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <DeltaLogo size="sm" :show-subtitle="true" />
          <p class="mt-2 text-sm text-gray-600">Delta Workforces S.A. de C.V.</p>
          <p class="text-xs text-gray-500">Parque Industrial Delta, Monterrey, N.L.</p>
        </div>
        <div class="rounded-lg border border-delta-blue/20 bg-white px-4 py-3 text-left text-sm text-gray-600 sm:text-right">
          <p class="font-semibold text-delta-text">Comprobante de Nómina</p>
          <p><span class="font-semibold">Folio:</span> #{{ recibo.id }}</p>
          <p><span class="font-semibold">Fecha de pago:</span> {{ recibo.fecha_pago }}</p>
        </div>
      </div>

      <div class="mt-5 grid gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm sm:grid-cols-2">
        <div class="space-y-1">
          <p class="font-semibold text-delta-text">Datos del empleado</p>
          <p class="text-gray-600"><span class="font-medium">Nombre:</span> {{ nombreEmpleado }}</p>
          <p class="text-gray-600"><span class="font-medium">ID:</span> {{ idEmpleado }}</p>
          <p class="text-gray-600"><span class="font-medium">Departamento:</span> Operaciones</p>
        </div>
        <div class="space-y-1">
          <p class="font-semibold text-delta-text">Periodo de pago</p>
          <p class="text-gray-600"><span class="font-medium">Periodo:</span> {{ recibo.periodo }}</p>
          <p class="text-gray-600"><span class="font-medium">Rango:</span> {{ recibo.detalles.periodo_pago }}</p>
          <p class="text-gray-600">
            <span class="font-medium">Estatus:</span>
            <span class="ml-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="statusClass">
              {{ recibo.estado || 'Pagado' }}
            </span>
          </p>
        </div>
      </div>
    </header>

    <section class="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
      <div class="rounded-xl border border-gray-200 p-4">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-delta-blue">Ingresos</h3>
        <div class="space-y-2 text-sm text-gray-700">
          <div class="flex justify-between">
            <span>Horas regulares</span>
            <span>{{ recibo.detalles.horas_regulares }}</span>
          </div>
          <div class="flex justify-between">
            <span>Pago por hora</span>
            <span>${{ formatCurrency(recibo.detalles.pago_hora) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Ingreso base</span>
            <span>${{ formatCurrency(ingresoBase) }}</span>
          </div>
          <div class="flex justify-between font-semibold text-green-700">
            <span>Bonos</span>
            <span>+ ${{ formatCurrency(recibo.detalles.bonos) }}</span>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 p-4">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-delta-blue">Deducciones</h3>
        <div class="space-y-2 text-sm text-gray-700">
          <div class="flex justify-between">
            <span>Impuestos y retenciones</span>
            <span class="font-semibold text-red-600">- ${{ formatCurrency(recibo.detalles.deducciones) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Seguro y prestaciones</span>
            <span>$0.00</span>
          </div>
          <div class="mt-4 flex justify-between border-t border-gray-200 pt-2 font-semibold text-delta-text">
            <span>Total deducciones</span>
            <span>${{ formatCurrency(recibo.detalles.deducciones) }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-6 mb-6 rounded-xl border border-delta-blue/20 bg-delta-gray p-5 sm:mx-8 sm:mb-8">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-sm text-gray-600">Total neto depositado</p>
          <p class="text-3xl font-bold text-delta-blue">${{ formatCurrency(recibo.monto) }}</p>
        </div>
        <p class="text-sm text-gray-600">
          Ingresos: <span class="font-semibold text-green-700">${{ formatCurrency(totalIngresos) }}</span>
        </p>
      </div>
    </section>

    <footer class="flex flex-col gap-3 px-6 pb-6 print:hidden sm:flex-row sm:px-8 sm:pb-8">
      <DeltaButton class="w-full sm:w-auto" variant="secondary" @click="$emit('back')">Volver al dashboard</DeltaButton>
      <DeltaButton class="w-full py-3 text-base sm:w-auto sm:min-w-56" @click="$emit('print')">
        <span class="inline-flex items-center gap-1">
          <span aria-hidden="true">⬇</span>
          <span>Descargar PDF</span>
        </span>
      </DeltaButton>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Recibo } from '../../types/payroll'
import { useAuthStore } from '../../store/auth'
import DeltaButton from '../common/DeltaButton.vue'
import DeltaLogo from '../common/DeltaLogo.vue'

const props = defineProps<{
  recibo: Recibo
}>()

defineEmits<{
  back: []
  print: []
}>()

const authStore = useAuthStore()

const nombreEmpleado = computed(() => authStore.user?.nombre || 'Empleado Delta')
const idEmpleado = computed(() => authStore.user?.id?.toString() || 'N/D')

const ingresoBase = computed(() => props.recibo.detalles.horas_regulares * props.recibo.detalles.pago_hora)
const totalIngresos = computed(() => ingresoBase.value + props.recibo.detalles.bonos)

const statusClass = computed(() => {
  const status = (props.recibo.estado || '').trim().toLowerCase()

  if (status === 'en procesamiento') {
    return 'bg-yellow-100 text-yellow-800'
  }

  if (status === 'revisar' || status === 'error' || status.includes('error')) {
    return 'bg-red-100 text-red-800'
  }

  return 'bg-green-100 text-green-800'
})

const formatCurrency = (value: number) => Number(value).toFixed(2)
</script>
