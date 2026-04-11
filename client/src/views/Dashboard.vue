<template>
  <div class="min-h-screen bg-slate-900">
    <div class="flex min-h-screen flex-col md:flex-row">
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
              @click="seccionActiva = 'mis-pagos'"
            >
              <span class="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-r-full transition" :class="seccionActiva === 'mis-pagos' ? 'bg-cyan-400' : 'bg-transparent group-hover:bg-slate-600/60'"></span>
              <Wallet :size="16" :stroke-width="1.75" :class="seccionActiva === 'mis-pagos' ? 'text-cyan-300' : 'text-slate-400 group-hover:text-slate-100'" />
              <span>Mis Pagos</span>
            </button>
            <button
              type="button"
              class="group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl border px-3 py-2.5 text-left font-medium transition"
              :class="seccionActiva === 'mi-perfil'
                ? 'border-slate-700 bg-slate-800/80 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                : 'border-transparent text-slate-300 hover:border-slate-700/80 hover:bg-slate-800/60 hover:text-slate-100'"
              @click="seccionActiva = 'mi-perfil'"
            >
              <span class="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-r-full transition" :class="seccionActiva === 'mi-perfil' ? 'bg-cyan-400' : 'bg-transparent group-hover:bg-slate-600/60'"></span>
              <User :size="16" :stroke-width="1.75" :class="seccionActiva === 'mi-perfil' ? 'text-cyan-300' : 'text-slate-400 group-hover:text-slate-100'" />
              <span>Mi Perfil</span>
            </button>
          </nav>

          <div class="mt-6 rounded-2xl border border-slate-700/80 bg-slate-800/45 p-3 text-xs text-slate-300 backdrop-blur-xl">
            <p class="font-semibold text-slate-100">Resumen</p>
            <p class="mt-2">Último pago: {{ ultimoPagoFechaLabel }}</p>
            <p>Horas del mes: {{ formatHours(horasMes) }} hrs</p>
            <p>YTD: {{ formatMoney(ytdMonto) }}</p>
          </div>

          <DeltaButton class="mt-6 w-full" variant="secondary" @click="logout">Cerrar Sesión</DeltaButton>
        </div>
      </aside>

      <main class="flex-1 bg-slate-50 p-4 sm:p-6 md:p-8">
        <div class="mx-auto max-w-7xl">
          <header class="mb-5 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Bienvenido de nuevo, {{ nombreCorto }}</h1>
            <p class="mt-1 text-sm text-slate-600">Revisa tus pagos, horas y acumulados en un solo centro de control.</p>
          </header>

          <p v-if="errorMessage" class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {{ errorMessage }}
          </p>

          <template v-if="seccionActiva === 'mis-pagos'">
            <section class="mb-5 grid gap-4 md:grid-cols-3">
              <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Year-to-Date ({{ ytdYear }})</p>
                <div class="mt-2 flex items-baseline gap-2">
                  <p class="font-mono text-3xl font-bold text-slate-900">{{ formatMoney(ytdMonto) }}</p>
                  <span class="text-sm font-semibold text-emerald-600">USD</span>
                </div>
                <p class="mt-1 text-sm text-slate-500">Suma anual de net pay</p>
              </article>

              <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Último Pago</p>
                <div class="mt-2 flex items-baseline gap-2">
                  <p class="font-mono text-3xl font-bold text-slate-900">{{ formatMoney(ultimoPagoMonto) }}</p>
                  <span class="text-sm font-semibold text-emerald-600">USD</span>
                </div>
                <p class="mt-1 text-sm text-slate-500">Pagado el {{ ultimoPagoFechaLabel }}</p>
              </article>

              <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Horas Totales (Mes)</p>
                <p class="mt-2 text-3xl font-bold text-slate-900">{{ formatHours(horasMes) }} <span class="text-xl font-semibold text-slate-500">hrs</span></p>
                <p class="mt-1 text-sm text-slate-500">{{ etiquetaMes }}</p>
              </article>
            </section>

            <ReciboDetalle
              v-if="reciboSeleccionado"
              :recibo="reciboSeleccionado"
              @back="limpiarReciboSeleccionado"
              @print="imprimirReciboEnPantalla"
            />

            <template v-else>
              <PayrollTable
                :recibos="recibos"
                :loading="loading"
                :downloading-recibo-id="downloadingReciboId"
                @view-details="abrirDetalle"
                @download-pdf="descargarRecibo"
              />
              <p class="mt-6 text-center text-sm italic text-slate-500">Mostrando las últimas 4 semanas de pago.</p>
            </template>
          </template>

          <section v-else class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 class="text-lg font-semibold text-slate-900">Mi Perfil</h2>
            <p class="mt-1 text-sm text-slate-600">Información principal de tu cuenta en Delta Workforces.</p>

            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre</p>
                <p class="mt-1 text-sm font-medium text-slate-800">{{ authStore.user?.nombre || 'No disponible' }}</p>
              </div>
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Usuario</p>
                <p class="mt-1 text-sm font-medium text-slate-800">{{ authStore.user?.username || 'No disponible' }}</p>
              </div>
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Rol</p>
                <p class="mt-1 text-sm font-medium capitalize text-slate-800">{{ authStore.user?.rol || 'No disponible' }}</p>
              </div>
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Estado de cuenta</p>
                <p class="mt-1 text-sm font-medium text-emerald-700">Activo</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { User, Wallet } from 'lucide-vue-next'
import DeltaButton from '../components/common/DeltaButton.vue'
import DeltaLogo from '../components/common/DeltaLogo.vue'
import PayrollTable from '../components/common/PayrollTable.vue'
import ReciboDetalle from '../components/payroll/ReciboDetalle.vue'
import { usePayroll } from '../composables/usePayroll'
import { useAuth } from '../composables/useAuth'
import type { Recibo } from '../types/payroll'

const { logout, authStore } = useAuth()

const {
  recibos,
  reciboSeleccionado,
  loading,
  errorMessage,
  cargarRecibos,
  seleccionarRecibo,
  limpiarReciboSeleccionado,
  descargarPdf,
} = usePayroll()

const downloadingReciboId = ref<number | null>(null)
const seccionActiva = ref<'mis-pagos' | 'mi-perfil'>('mis-pagos')

const nombreCorto = computed(() => {
  const nombreCompleto = authStore.user?.nombre?.trim()

  if (!nombreCompleto) {
    return 'Empleado'
  }

  return nombreCompleto.split(' ')[0]
})

const ultimoRecibo = computed(() => recibos.value[0] ?? null)

const parseDate = (dateText?: string) => {
  if (!dateText) {
    return null
  }

  const parsed = new Date(`${dateText}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const fechaAncla = computed(() => parseDate(ultimoRecibo.value?.fecha_pago) ?? new Date())

const ultimoPagoMonto = computed(() => Number(ultimoRecibo.value?.monto || 0))

const ultimoPagoFechaLabel = computed(() => {
  const date = parseDate(ultimoRecibo.value?.fecha_pago)

  if (!date) {
    return 'N/D'
  }

  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
})

const horasMes = computed(() => {
  const anchor = fechaAncla.value
  return recibos.value
    .filter((recibo) => {
      const date = parseDate(recibo.fecha_pago)
      return Boolean(date) && date!.getFullYear() === anchor.getFullYear() && date!.getMonth() === anchor.getMonth()
    })
    .reduce((sum, recibo) => sum + Number(recibo.detalles?.horas_regulares || 0), 0)
})

const etiquetaMes = computed(() =>
  fechaAncla.value.toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric',
  }),
)

const ytdYear = computed(() => String(fechaAncla.value.getFullYear()))

const ytdMonto = computed(() => {
  const detalle = ultimoRecibo.value?.detalles
  const explicitYtd = Number(detalle?.ytd_total || detalle?.year_to_date || detalle?.acumulado_anual || 0)

  if (explicitYtd > 0) {
    return explicitYtd
  }

  const year = fechaAncla.value.getFullYear()
  return recibos.value
    .filter((recibo) => {
      const date = parseDate(recibo.fecha_pago)
      return Boolean(date) && date!.getFullYear() === year
    })
    .reduce((sum, recibo) => sum + Number(recibo.monto || 0), 0)
})

const formatMoney = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value || 0))
}

const formatHours = (value: number) => Number(value || 0).toFixed(1)

onMounted(async () => {
  await cargarRecibos()
})

const imprimirReciboEnPantalla = () => {
  window.print()
}

const descargarRecibo = async (recibo: Recibo) => {
  if (downloadingReciboId.value === recibo.id) {
    return
  }

  downloadingReciboId.value = recibo.id

  try {
    const descargado = await descargarPdf(recibo)

    if (!descargado) {
      seleccionarRecibo(recibo)
      await nextTick()
      window.print()
    }
  } finally {
    downloadingReciboId.value = null
  }
}

const abrirDetalle = (recibo: Recibo) => {
  seccionActiva.value = 'mis-pagos'
  seleccionarRecibo(recibo)
}
</script>
