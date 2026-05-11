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
            <p class="text-xs text-gray-500">Payroll system statement</p>
          </div>
          <div class="flex flex-col items-start gap-3 sm:items-end">
            <div class="text-left sm:text-right">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Earnings Statement</p>
              <p class="text-base font-semibold text-slate-900">Delta Workforces Payroll</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <DeltaButton class="px-4 py-2 text-sm" variant="secondary" @click="$emit('back')">Back</DeltaButton>
              <DeltaButton class="px-4 py-2 text-sm" @click="$emit('print')">
                <span class="inline-flex items-center gap-1">
                  <span aria-hidden="true">⬇</span>
                  <span>Download PDF</span>
                </span>
              </DeltaButton>
            </div>
            <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-gray-600 sm:text-right">
              <p class="font-semibold text-delta-text">Payroll Receipt</p>
              <p><span class="font-semibold">Receipt:</span> #{{ recibo.id }}</p>
              <p><span class="font-semibold">Paystub:</span> {{ paystubLabel }}</p>
              <p><span class="font-semibold">Payment date:</span> {{ recibo.fecha_pago }}</p>
            </div>
          </div>
        </div>

        <div class="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p class="font-semibold text-delta-text">Company details</p>
            <p class="mt-1 text-gray-600"><span class="font-medium">Company:</span> {{ companyName }}</p>
            <p class="text-gray-600"><span class="font-medium">System:</span> Delta Workforces Payroll</p>
            <p class="text-gray-600"><span class="font-medium">Period:</span> {{ periodoPago }}</p>
          </div>

          <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p class="font-semibold text-delta-text">Employee details</p>
            <p class="mt-1 text-gray-600"><span class="font-medium">Name:</span> {{ nombreEmpleado }}</p>
            <p class="text-gray-600"><span class="font-medium">ID:</span> {{ idEmpleado }}</p>
            <p class="text-gray-600"><span class="font-medium">Position:</span> {{ cargoEmpleado }}</p>
            <p class="text-gray-600">
              <span class="font-medium">Status:</span>
              <span class="ml-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="statusClass">
                {{ statusLabel }}
              </span>
            </p>
          </div>
        </div>
      </header>

      <section class="grid gap-4 p-4 sm:grid-cols-2 sm:p-8">
        <div class="rounded-xl border border-slate-100 bg-white p-4">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-delta-blue">Earnings</h3>
        <div v-if="earningsRows.length" class="space-y-3 text-sm text-gray-700">
          <div class="grid gap-3" style="grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));">
            <div class="rounded-xl border border-slate-100 bg-slate-50 p-3 min-w-0">
              <p class="text-xs uppercase tracking-wide text-slate-500">Worked Hours</p>
              <p class="mt-1 text-base font-semibold text-slate-900 break-all">{{ horasTrabajadas }}</p>
            </div>
            <div class="rounded-xl border border-slate-100 bg-slate-50 p-3 min-w-0">
              <p class="text-xs uppercase tracking-wide text-slate-500">Hourly Rate</p>
              <p class="mt-1 text-base font-semibold text-slate-900 break-all">${{ formatCurrency(pagoHora) }}</p>
            </div>
            <div class="rounded-xl border border-slate-100 bg-slate-50 p-3 min-w-0">
              <p class="text-xs uppercase tracking-wide text-slate-500">Overtime Hourly Rate</p>
              <p class="mt-1 text-base font-semibold text-slate-900 break-all">${{ formatCurrency(resolvedOvertimeRate) }}</p>
            </div>
            <div class="rounded-xl border border-slate-100 bg-slate-50 p-3 min-w-0">
              <p class="text-xs uppercase tracking-wide text-slate-500">Total Paid</p>
              <p class="mt-1 text-base font-semibold text-slate-900 break-all">${{ formatCurrency(totalPagado) }}</p>
            </div>
          </div>

          <div v-if="overtimeHours > 0" class="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
            <p class="text-xs uppercase tracking-wide text-amber-700">Overtime Hours</p>
            <p class="mt-1 text-lg font-semibold">{{ overtimeHours }}</p>
          </div>

          <div class="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <span class="font-medium text-slate-700">Base earnings</span>
            <span class="text-base font-semibold text-slate-900">${{ formatCurrency(ingresoBase) }}</span>
          </div>
          <div v-if="bonos > 0" class="flex flex-col gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <span class="font-medium text-emerald-800">Bonuses</span>
            <span class="text-base font-semibold text-emerald-700">+ ${{ formatCurrency(bonos) }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-gray-500">No earnings items available.</p>
        </div>

        <div class="rounded-xl border border-slate-100 bg-white p-4">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-delta-blue">Summary</h3>
        <div class="space-y-3 text-sm text-gray-700">
          <article class="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span class="font-medium text-slate-700">Gross Pay</span>
              <span class="text-base font-semibold text-slate-900">${{ formatCurrency(totalIngresos) }}</span>
            </div>
          </article>

          <article class="rounded-xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span class="font-medium text-emerald-800">Net Pay</span>
              <span class="text-2xl font-extrabold tracking-tight text-emerald-700">${{ formatCurrency(totalPagado) }}</span>
            </div>
          </article>
        </div>
        </div>
      </section>

      <section class="mx-6 mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:mx-8 sm:mb-8 sm:p-7">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-sm text-slate-500">Deposit summary</p>
            <p class="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">${{ formatCurrency(totalPagado) }}</p>
            <p class="mt-1 text-xs uppercase tracking-wide text-slate-500">Total net deposited</p>
          </div>

          <div class="space-y-1 text-sm text-slate-600">
          <p>
            Earnings: <span class="font-semibold text-slate-800">${{ formatCurrency(totalIngresos) }}</span>
          </p>
          <p v-if="ytdTotal !== null">
            Year to date (YTD): <span class="font-semibold text-slate-800">${{ formatCurrency(ytdTotal) }}</span>
          </p>
          </div>
        </div>
      </section>

      <section class="mx-6 mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 sm:mx-8">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p><span class="font-semibold text-slate-700">Payment date:</span> {{ recibo.fecha_pago }}</p>
          <p v-if="checkNumber"><span class="font-semibold text-slate-700">Check:</span> {{ checkNumber }}</p>
          <p v-else><span class="font-semibold text-slate-700">Check:</span> Not specified</p>
          <p><span class="font-semibold text-slate-700">Paystub:</span> {{ paystubLabel }}</p>
        </div>
      </section>

      <p class="px-6 pb-1 text-center text-xs text-slate-400 sm:px-8">
        Document generated electronically by Delta Workforces Payroll System.
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

const nombreEmpleado = computed(() => props.recibo.User?.nombre || props.recibo.empleadoNombre || authStore.user?.nombre || 'Delta Employee')
const idEmpleado = computed(() => props.recibo.User?.id?.toString() || authStore.user?.id?.toString() || 'N/A')
const cargoEmpleado = computed(() => String(props.recibo.detalles?.cargo || 'Not specified'))
const companyName = computed(() => String(props.recibo.detalles?.company || props.recibo.detalles?.company_name || 'Not specified'))

interface EarningRow {
  description: string
  quantity: number
  rate: number
  total: number
  ytd: number | null
}

const STANDARD_WEEKLY_HOURS = 40

const buildLegacyEarningsRows = (): EarningRow[] => {
  const hoursWorked = Number(
    props.recibo.detalles?.hours_worked ||
      props.recibo.detalles?.worked_hours ||
      props.recibo.detalles?.horas_regulares ||
      0,
  )
  const baseRate = Number(props.recibo.detalles?.pago_hora || 0)
  const overtimeRate = Number(
    props.recibo.detalles?.overtime_rate || props.recibo.detalles?.pago_hora_extra || 0,
  )
  const overtimeHours = Number(
    props.recibo.detalles?.overtime_hours || props.recibo.detalles?.horas_extra || 0,
  )

  if (overtimeRate > 0 && (overtimeHours > 0 || hoursWorked > STANDARD_WEEKLY_HOURS)) {
    const resolvedOvertimeHours = overtimeHours > 0 ? overtimeHours : Math.max(hoursWorked - STANDARD_WEEKLY_HOURS, 0)
    const regularHours = overtimeHours > 0 ? Math.max(hoursWorked - resolvedOvertimeHours, 0) : Math.min(hoursWorked, STANDARD_WEEKLY_HOURS)

    if (resolvedOvertimeHours > 0) {
      return [
        {
          description: 'Regular Hours',
          quantity: regularHours,
          rate: baseRate,
          total: regularHours * baseRate,
          ytd: null,
        },
        {
          description: 'Overtime Hours',
          quantity: resolvedOvertimeHours,
          rate: overtimeRate,
          total: resolvedOvertimeHours * overtimeRate,
          ytd: null,
        },
      ]
    }
  }

  if (!hoursWorked && !baseRate) {
    return []
  }

  return [
    {
      description: 'Worked Hours',
      quantity: hoursWorked,
      rate: baseRate,
      total: hoursWorked * baseRate,
      ytd: null,
    },
  ]
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
        description: String(row.description || 'Item'),
        quantity,
        rate,
        total,
        ytd,
      }
    })
  }

  return buildLegacyEarningsRows()
})

const horasTrabajadas = computed(() =>
  Number(
    props.recibo.detalles?.hours_worked ||
      props.recibo.detalles?.worked_hours ||
      props.recibo.detalles?.horas_regulares ||
      0,
  ),
)
const pagoHora = computed(() => Number(props.recibo.detalles?.pago_hora || 0))
const overtimeRate = computed(() =>
  Number(props.recibo.detalles?.overtime_rate || props.recibo.detalles?.pago_hora_extra || 0),
)
const overtimeHours = computed(() =>
  Number(props.recibo.detalles?.overtime_hours || props.recibo.detalles?.horas_extra || 0),
)
const resolvedOvertimeRate = computed(() => {
  if (overtimeRate.value > 0) {
    return overtimeRate.value
  }

  const overtimeRow = earningsRows.value.find((row) => row.description.toLowerCase().includes('overtime'))
  return overtimeRow?.rate || 0
})
const bonos = computed(() => Number(props.recibo.detalles?.bonos || 0))
const deducciones = computed(() => Number(props.recibo.detalles?.deducciones || 0))
const periodoPago = computed(() => String(props.recibo.detalles?.period || props.recibo.detalles?.periodo_pago || props.recibo.periodo || 'Not specified'))
const checkNumber = computed(() => String(props.recibo.detalles?.check_number || props.recibo.detalles?.numero_cheque || props.recibo.detalles?.cheque || props.recibo.detalles?.checkNumber || '').trim())
const paystubLabel = computed(() => {
  if (checkNumber.value) {
    return checkNumber.value
  }

  const explicitPaystub = String(
    props.recibo.detalles?.paystub_id ||
      props.recibo.detalles?.external_paystub_id ||
      props.recibo.detalles?.recibo_id ||
      '',
  ).trim()

  if (explicitPaystub) {
    return explicitPaystub
  }

  const paystubKey = String(props.recibo.paystubKey || props.recibo.detalles?.paystub_key || '').trim()

  if (!paystubKey) {
    return `#${props.recibo.id}`
  }

  return paystubKey.length > 18 ? paystubKey.slice(-12).toUpperCase() : paystubKey
})

const totalPagado = computed(() => Number(props.recibo.detalles?.total_paid || props.recibo.monto || 0))

const ingresoBase = computed(() => {
  if (earningsRows.value.length) {
    return earningsRows.value.reduce((sum, row) => sum + row.total, 0)
  }

  return horasTrabajadas.value * pagoHora.value
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
    return 'In process'
  }

  if (status === 'revisar' || status === 'error' || status.includes('error')) {
    return 'Needs review'
  }

  return 'Paid'
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

<style scoped>
</style>
