import { computed, nextTick, ref, type Ref } from 'vue'
import type { Recibo } from '../types/payroll'

export type EmployeeSection = 'mis-pagos' | 'mi-perfil'
export type ReceiptLimitOption = 'all' | 1 | 2 | 3 | 4

interface UseEmployeeDashboardStateOptions {
  recibos: Ref<Recibo[]>
  authNombre: Ref<string | undefined>
  cargarRecibos: (limit?: number) => Promise<void>
  seleccionarRecibo: (recibo: Recibo) => void
  limpiarReciboSeleccionado: () => void
  descargarPdf: (recibo: Recibo) => Promise<boolean>
}

const parseDate = (dateText?: string): Date | null => {
  if (!dateText) {
    return null
  }

  const parsed = new Date(`${dateText}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value || 0))
}

const formatHours = (value: number): string => Number(value || 0).toFixed(1)

export const useEmployeeDashboardState = ({
  recibos,
  authNombre,
  cargarRecibos,
  seleccionarRecibo,
  limpiarReciboSeleccionado,
  descargarPdf,
}: UseEmployeeDashboardStateOptions) => {
  const downloadingReciboId = ref<number | null>(null)
  const seccionActiva = ref<EmployeeSection>('mis-pagos')
  const limiteRecibos = ref<ReceiptLimitOption>('all')
  const opcionesLimiteRecibos: ReceiptLimitOption[] = ['all', 1, 2, 3, 4]

  const resolveReceiptLimit = (value: ReceiptLimitOption): number => {
    // Backend caps requests at 200, so "all" maps to the maximum supported value.
    return value === 'all' ? 200 : value
  }

  const nombreCorto = computed(() => {
    const nombreCompleto = authNombre.value?.trim()

    if (!nombreCompleto) {
      return 'Employee'
    }

    return nombreCompleto.split(' ')[0]
  })

  const ultimoRecibo = computed(() => recibos.value[0] ?? null)

  const fechaAncla = computed(() => parseDate(ultimoRecibo.value?.fecha_pago) ?? new Date())

  const ultimoPagoMonto = computed(() => Number(ultimoRecibo.value?.monto || 0))

  const ultimoPagoMontoLabel = computed(() => formatMoney(ultimoPagoMonto.value))

  const ultimoPagoFechaLabel = computed(() => {
    const date = parseDate(ultimoRecibo.value?.fecha_pago)

    if (!date) {
      return 'N/A'
    }

    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
  })

  const horasMes = computed(() => {
    const anchor = fechaAncla.value

    return recibos.value
      .filter((recibo) => {
        const date = parseDate(recibo.fecha_pago)

        if (!date) {
          return false
        }

        return date.getFullYear() === anchor.getFullYear() && date.getMonth() === anchor.getMonth()
      })
      .reduce((sum, recibo) => sum + Number(recibo.detalles?.horas_regulares || 0), 0)
  })

  const horasMesLabel = computed(() => formatHours(horasMes.value))

  const etiquetaMes = computed(() =>
    fechaAncla.value.toLocaleDateString('en-US', {
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

        if (!date) {
          return false
        }

        return date.getFullYear() === year
      })
      .reduce((sum, recibo) => sum + Number(recibo.monto || 0), 0)
  })

  const ytdMontoLabel = computed(() => formatMoney(ytdMonto.value))

  const cambiarSeccionEmpleado = (section: EmployeeSection) => {
    seccionActiva.value = section
  }

  const cargarInicialRecibos = async () => {
    await cargarRecibos(resolveReceiptLimit(limiteRecibos.value))
  }

  const cambiarLimiteRecibos = async () => {
    limpiarReciboSeleccionado()
    await cargarRecibos(resolveReceiptLimit(limiteRecibos.value))
  }

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

  return {
    downloadingReciboId,
    seccionActiva,
    limiteRecibos,
    opcionesLimiteRecibos,
    nombreCorto,
    ultimoPagoFechaLabel,
    ultimoPagoMontoLabel,
    horasMesLabel,
    etiquetaMes,
    ytdYear,
    ytdMontoLabel,
    cambiarSeccionEmpleado,
    cargarInicialRecibos,
    cambiarLimiteRecibos,
    imprimirReciboEnPantalla,
    descargarRecibo,
    abrirDetalle,
  }
}
