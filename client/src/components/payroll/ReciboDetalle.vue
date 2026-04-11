<template>
  <article class="relative mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5">
    <img
      :src="logoMark"
      alt=""
      class="pointer-events-none absolute left-1/2 top-1/2 z-0 h-72 w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.035]"
      aria-hidden="true"
    />

    <div class="relative z-10">
      <header class="border-b border-slate-200 bg-white p-6 sm:p-8">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <DeltaLogo size="lg" />
            <p class="text-xs text-gray-500">Parque Industrial Delta, Monterrey, N.L.</p>
          </div>
          <div class="flex flex-col items-start gap-3 sm:items-end">
            <div class="text-left sm:text-right">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Earnings Statement</p>
              <p class="text-base font-semibold text-slate-900">Delta Workforces Payroll</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <DeltaButton class="px-4 py-2 text-sm" variant="secondary" @click="$emit('back')">Volver</DeltaButton>
              <DeltaButton class="px-4 py-2 text-sm" @click="$emit('print')">
                <span class="inline-flex items-center gap-1">
                  <span aria-hidden="true">⬇</span>
                  <span>Descargar PDF</span>
                </span>
              </DeltaButton>
            </div>
            <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-gray-600 sm:text-right">
              <p class="font-semibold text-delta-text">Comprobante de Nómina</p>
              <p><span class="font-semibold">Folio:</span> #{{ recibo.id }}</p>
              <p><span class="font-semibold">Fecha de pago:</span> {{ recibo.fecha_pago }}</p>
            </div>
          </div>
        </div>

        <div class="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p class="font-semibold text-delta-text">Datos de la empresa</p>
            <p class="mt-1 text-gray-600"><span class="font-medium">Empresa:</span> {{ companyName }}</p>
            <p class="text-gray-600"><span class="font-medium">Sistema:</span> Delta Workforces Payroll</p>
            <p class="text-gray-600"><span class="font-medium">Periodo:</span> {{ periodoPago }}</p>
          </div>

          <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p class="font-semibold text-delta-text">Datos del empleado</p>
            <p class="mt-1 text-gray-600"><span class="font-medium">Nombre:</span> {{ nombreEmpleado }}</p>
            <p class="text-gray-600"><span class="font-medium">ID:</span> {{ idEmpleado }}</p>
            <p class="text-gray-600"><span class="font-medium">Cargo:</span> {{ cargoEmpleado }}</p>
            <p class="text-gray-600">
              <span class="font-medium">Estatus:</span>
              <span class="ml-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="statusClass">
                {{ statusLabel }}
              </span>
            </p>
          </div>
        </div>
      </header>

      <section class="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
        <div class="rounded-xl border border-slate-100 bg-white p-4">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-delta-blue">Ingresos</h3>
        <div v-if="earningsRows.length" class="space-y-2 text-sm text-gray-700">
          <div
            class="grid border-b border-slate-100 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500"
            :class="showYtd ? 'grid-cols-[2.2fr_0.9fr_1fr_1fr_1fr]' : 'grid-cols-[2.6fr_1fr_1fr_1fr]'"
          >
            <span>Descripción</span>
            <span class="text-right">Cant.</span>
            <span class="text-right">Tarifa</span>
            <span class="text-right">Total</span>
            <span v-if="showYtd" class="text-right">YTD</span>
          </div>
          <div
            v-for="(earning, index) in earningsRows"
            :key="`earning-${index}`"
            class="grid"
            :class="showYtd ? 'grid-cols-[2.2fr_0.9fr_1fr_1fr_1fr]' : 'grid-cols-[2.6fr_1fr_1fr_1fr]'"
          >
            <span class="truncate pr-2">{{ earning.description }}</span>
            <span class="text-right">{{ earning.quantity }}</span>
            <span class="text-right">${{ formatCurrency(earning.rate) }}</span>
            <span class="text-right">${{ formatCurrency(earning.total) }}</span>
            <span v-if="showYtd" class="text-right font-medium text-slate-600">
              {{ earning.ytd === null ? 'N/D' : `$${formatCurrency(earning.ytd)}` }}
            </span>
          </div>
          <div class="flex justify-between">
            <span>Ingreso base</span>
            <span>${{ formatCurrency(ingresoBase) }}</span>
          </div>
          <div v-if="bonos > 0" class="flex justify-between font-semibold text-green-700">
            <span>Bonos</span>
            <span>+ ${{ formatCurrency(bonos) }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-gray-500">No hay conceptos de ingresos disponibles.</p>
        </div>

        <div class="rounded-xl border border-slate-100 bg-white p-4">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-delta-blue">Summary</h3>
        <div class="space-y-2 text-sm text-gray-700">
          <div class="flex justify-between">
            <span>Gross Pay</span>
            <span class="font-semibold text-slate-800">${{ formatCurrency(totalIngresos) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Deductions</span>
            <span class="font-semibold text-red-600">- ${{ formatCurrency(deducciones) }}</span>
          </div>
          <div class="mt-4 flex justify-between border-t border-gray-200 pt-2 font-semibold text-delta-text">
            <span>Net Pay</span>
            <span class="text-emerald-700">${{ formatCurrency(totalPagado) }}</span>
          </div>
        </div>
        </div>
      </section>

      <section class="mx-6 mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:mx-8 sm:mb-8 sm:p-7">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-sm text-slate-500">Resumen del depósito</p>
            <p class="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">${{ formatCurrency(totalPagado) }}</p>
            <p class="mt-1 text-xs uppercase tracking-wide text-slate-500">Total neto depositado</p>
          </div>

          <div class="space-y-1 text-sm text-slate-600">
          <p>
            Ingresos: <span class="font-semibold text-slate-800">${{ formatCurrency(totalIngresos) }}</span>
          </p>
          <p>
            Deducciones: <span class="font-semibold text-slate-800">${{ formatCurrency(deducciones) }}</span>
          </p>
          <p v-if="ytdTotal !== null">
            Acumulado anual (YTD): <span class="font-semibold text-slate-800">${{ formatCurrency(ytdTotal) }}</span>
          </p>
          </div>
        </div>
      </section>

      <section class="mx-6 mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 sm:mx-8">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p><span class="font-semibold text-slate-700">Fecha de pago:</span> {{ recibo.fecha_pago }}</p>
          <p v-if="checkNumber"><span class="font-semibold text-slate-700">Cheque:</span> {{ checkNumber }}</p>
          <p v-else><span class="font-semibold text-slate-700">Cheque:</span> No especificado</p>
        </div>
      </section>

      <p class="px-6 pb-1 text-center text-xs text-slate-400 sm:px-8">
        Documento generado electrónicamente por Delta Workforces Payroll System.
      </p>

    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import logoMark from '../../assets/logo.png'
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

const nombreEmpleado = computed(() => props.recibo.User?.nombre || props.recibo.empleadoNombre || authStore.user?.nombre || 'Empleado Delta')
const idEmpleado = computed(() => props.recibo.User?.id?.toString() || authStore.user?.id?.toString() || 'N/D')
const cargoEmpleado = computed(() => String(props.recibo.detalles?.cargo || 'No especificado'))
const companyName = computed(() => String(props.recibo.detalles?.company || props.recibo.detalles?.company_name || 'No especificada'))

interface EarningRow {
  description: string
  quantity: number
  rate: number
  total: number
  ytd: number | null
}

const earningsRows = computed<EarningRow[]>(() => {
  const raw = props.recibo.detalles?.earnings

  if (Array.isArray(raw) && raw.length) {
    return raw.map((item) => {
      const row = item as Record<string, unknown>
      const quantity = Number(row.quantity || 0)
      const rate = Number(row.rate || 0)
      const total = Number(row.total || quantity * rate)
      const ytd = toNumberOrNull(
        row.ytd || row.year_to_date || row.acumulado_anual || row.ytd_total,
      )

      return {
        description: String(row.description || 'Concepto'),
        quantity,
        rate,
        total,
        ytd,
      }
    })
  }

  const legacyQuantity = Number(props.recibo.detalles?.horas_regulares || 0)
  const legacyRate = Number(props.recibo.detalles?.pago_hora || 0)

  if (!legacyQuantity && !legacyRate) {
    return []
  }

  return [
    {
      description: 'Worked Hours',
      quantity: legacyQuantity,
      rate: legacyRate,
      total: legacyQuantity * legacyRate,
      ytd: null,
    },
  ]
})

const showYtd = computed(() => earningsRows.value.some((row) => row.ytd !== null))

const horasRegulares = computed(() => Number(props.recibo.detalles?.horas_regulares || 0))
const pagoHora = computed(() => Number(props.recibo.detalles?.pago_hora || 0))
const bonos = computed(() => Number(props.recibo.detalles?.bonos || 0))
const deducciones = computed(() => Number(props.recibo.detalles?.deducciones || 0))
const periodoPago = computed(() => String(props.recibo.detalles?.period || props.recibo.detalles?.periodo_pago || props.recibo.periodo || 'No especificado'))
const checkNumber = computed(() => String(props.recibo.detalles?.check_number || props.recibo.detalles?.numero_cheque || props.recibo.detalles?.cheque || props.recibo.detalles?.checkNumber || '').trim())

const totalPagado = computed(() => Number(props.recibo.detalles?.total_paid || props.recibo.monto || 0))

const ingresoBase = computed(() => {
  if (earningsRows.value.length) {
    return earningsRows.value.reduce((sum, row) => sum + row.total, 0)
  }

  return horasRegulares.value * pagoHora.value
})
const totalIngresos = computed(() => ingresoBase.value + bonos.value)

const ytdTotal = computed(() => {
  const fromDetails = toNumberOrNull(
    props.recibo.detalles?.ytd_total || props.recibo.detalles?.year_to_date || props.recibo.detalles?.acumulado_anual,
  )

  if (fromDetails !== null) {
    return fromDetails
  }

  const rowYtd = earningsRows.value
    .map((row) => row.ytd)
    .find((value) => value !== null)

  return rowYtd ?? null
})

const statusClass = computed(() => {
  const status = (props.recibo.estado || '').trim().toLowerCase()

  if (status === 'en procesamiento' || status.includes('proceso')) {
    return 'bg-amber-100 text-amber-700'
  }

  if (status === 'revisar' || status === 'error' || status.includes('error')) {
    return 'bg-rose-100 text-rose-700'
  }

  return 'bg-emerald-100 text-emerald-700'
})

const statusLabel = computed(() => {
  const status = (props.recibo.estado || '').trim().toLowerCase()

  if (status === 'en procesamiento' || status.includes('proceso')) {
    return 'En proceso'
  }

  if (status === 'revisar' || status === 'error' || status.includes('error')) {
    return 'Requiere revisión'
  }

  return 'Pagado'
})

const formatCurrency = (value: number) => Number(value).toFixed(2)

const toNumberOrNull = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
</script>
