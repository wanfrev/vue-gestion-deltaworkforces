import { computed, ref, type Ref } from 'vue'
import type { Recibo } from '../types/payroll'

export type AdminSection =
  | 'cargar-nomina'
  | 'gestionar-empleados'
  | 'historial-pagos'
  | 'historial-pagos-empleado'

interface UseAdminViewStateOptions {
  search: Ref<string>
  recibosExistentes: Ref<Recibo[]>
  reciboSeleccionado: Ref<Recibo | null>
  cargarRecibosAdmin: (query?: string, limit?: number) => Promise<void>
  seleccionarRecibo: (recibo: Recibo | null) => void
}

const normalizeSearchText = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

const parseIsoDate = (value?: string): Date | null => {
  if (!value) {
    return null
  }

  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const getInitials = (name: string): string => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')

  return initials || '--'
}

const levenshteinDistance = (left: string, right: string): number => {
  if (left === right) {
    return 0
  }

  if (!left.length) {
    return right.length
  }

  if (!right.length) {
    return left.length
  }

  const matrix: number[][] = Array.from({ length: left.length + 1 }, () => [])

  for (let i = 0; i <= left.length; i += 1) {
    matrix[i][0] = i
  }

  for (let j = 0; j <= right.length; j += 1) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
    }
  }

  return matrix[left.length][right.length]
}

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value || 0))
}

export const useAdminViewState = ({
  search,
  recibosExistentes,
  reciboSeleccionado,
  cargarRecibosAdmin,
  seleccionarRecibo,
}: UseAdminViewStateOptions) => {
  const seccionActiva = ref<AdminSection>('cargar-nomina')
  const empleadoHistorialAbierto = ref<string | null>(null)
  const empleadoHistorialCompletoKey = ref<string | null>(null)
  const historialPagosSearch = ref('')
  const menuEmpleadoAbiertoId = ref<number | null>(null)

  const empleadosConRegistros = computed(() => {
    const grouped = new Map<
      number,
      {
        employeeId: number
        nombre: string
        quickbooksId: string
        username: string
        registros: number
        montoTotal: number
      }
    >()

    for (const recibo of recibosExistentes.value) {
      const employeeId = Number(recibo.employeeId || 0)

      if (!employeeId) {
        continue
      }

      const current = grouped.get(employeeId)

      if (!current) {
        grouped.set(employeeId, {
          employeeId,
          nombre: String(recibo.User?.nombre || recibo.empleadoNombre || 'Empleado').trim(),
          quickbooksId: String(recibo.quickbooksId || recibo.detalles?.quickbooks_id || '').trim(),
          username: String(recibo.User?.email || recibo.empleadoEmail || '').trim(),
          registros: 1,
          montoTotal: Number(recibo.monto || 0),
        })
        continue
      }

      current.registros += 1
      current.montoTotal += Number(recibo.monto || 0)
    }

    return Array.from(grouped.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
  })

  const empleadosFiltrados = computed(() => {
    const query = normalizeSearchText(search.value)

    if (!query) {
      return empleadosConRegistros.value
    }

    return empleadosConRegistros.value.filter((empleado) => {
      const searchable = normalizeSearchText(
        [empleado.nombre, empleado.quickbooksId, empleado.username].filter(Boolean).join(' '),
      )

      if (searchable.includes(query)) {
        return true
      }

      return searchable
        .split(/\s+/)
        .filter(Boolean)
        .some((token) => token.includes(query) || levenshteinDistance(token, query) <= 2)
    })
  })

  const fechaNominaReciente = computed(() => {
    let latest: Date | null = null

    for (const recibo of recibosExistentes.value) {
      const candidate = parseIsoDate(recibo.fecha_pago)

      if (!candidate) {
        continue
      }

      if (!latest || candidate > latest) {
        latest = candidate
      }
    }

    return latest
  })

  const fechaUltimaNominaLabel = computed(() => {
    if (!fechaNominaReciente.value) {
      return 'No data'
    }

    return fechaNominaReciente.value.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  })

  const totalPayoutMensual = computed(() => {
    const anchor = fechaNominaReciente.value

    if (!anchor) {
      return 0
    }

    const month = anchor.getMonth()
    const year = anchor.getFullYear()

    return recibosExistentes.value
      .filter((recibo) => {
        const date = parseIsoDate(recibo.fecha_pago)
        return Boolean(date) && date!.getMonth() === month && date!.getFullYear() === year
      })
      .reduce((sum, recibo) => sum + Number(recibo.monto || 0), 0)
  })

  const quickbooksSyncStats = computed(() => {
    const total = empleadosConRegistros.value.length
    const mapped = empleadosConRegistros.value.filter((empleado) => Boolean(empleado.quickbooksId)).length

    return {
      total,
      mapped,
      pending: Math.max(total - mapped, 0),
      ok: total > 0 && mapped === total,
    }
  })

  const empleadosDataGrid = computed(() => {
    return empleadosFiltrados.value.map((empleado) => {
      return {
        ...empleado,
        initials: getInitials(empleado.nombre),
      }
    })
  })

  const historialAgrupadoPorEmpleado = computed(() => {
    const grouped = new Map<
      string,
      {
        key: string
        nombre: string
        quickbooksId: string
        username: string
        pagos: Recibo[]
        montoTotal: number
      }
    >()

    for (const recibo of recibosExistentes.value) {
      const employeeId = recibo.employeeId ? String(recibo.employeeId) : ''
      const nombre = String(recibo.User?.nombre || recibo.empleadoNombre || 'Empleado').trim() || 'Empleado'
      const quickbooksId = String(recibo.quickbooksId || recibo.detalles?.quickbooks_id || '').trim()
      const username = String(recibo.User?.email || recibo.empleadoEmail || '').trim()
      const key = employeeId || `no-id-${normalizeSearchText([nombre, quickbooksId, username].filter(Boolean).join('-')) || recibo.id}`

      const current = grouped.get(key)

      if (!current) {
        grouped.set(key, {
          key,
          nombre,
          quickbooksId,
          username,
          pagos: [recibo],
          montoTotal: Number(recibo.monto || 0),
        })
        continue
      }

      current.pagos.push(recibo)
      current.montoTotal += Number(recibo.monto || 0)
    }

    return Array.from(grouped.values())
      .map((empleado) => ({
        ...empleado,
        pagos: empleado.pagos.sort((left, right) => right.fecha_pago.localeCompare(left.fecha_pago)),
      }))
      .sort((left, right) => left.nombre.localeCompare(right.nombre))
  })

  const historialAgrupadoPorEmpleadoFiltrado = computed(() => {
    const query = normalizeSearchText(historialPagosSearch.value)

    if (!query) {
      return historialAgrupadoPorEmpleado.value
    }

    return historialAgrupadoPorEmpleado.value.filter((empleado) => {
      const searchable = normalizeSearchText(
        [empleado.nombre, empleado.quickbooksId, empleado.username].filter(Boolean).join(' '),
      )

      if (searchable.includes(query)) {
        return true
      }

      return searchable
        .split(/\s+/)
        .filter(Boolean)
        .some((token) => token.includes(query) || levenshteinDistance(token, query) <= 2)
    })
  })

  const historialEmpleadoCompleto = computed(() => {
    if (!empleadoHistorialCompletoKey.value) {
      return null
    }

    return historialAgrupadoPorEmpleado.value.find((item) => item.key === empleadoHistorialCompletoKey.value) || null
  })

  const cambiarSeccion = (seccion: AdminSection) => {
    seccionActiva.value = seccion

    if (seccion !== 'historial-pagos-empleado') {
      empleadoHistorialCompletoKey.value = null
    }

    if (seccion === 'historial-pagos' || seccion === 'historial-pagos-empleado' || seccion === 'gestionar-empleados') {
      void cargarRecibosAdmin('', 200)
    }
  }

  const buscarRecibos = async () => {
    await cargarRecibosAdmin('', 200)
  }

  const alternarMenuEmpleado = (employeeId: number) => {
    menuEmpleadoAbiertoId.value = menuEmpleadoAbiertoId.value === employeeId ? null : employeeId
  }

  const cerrarMenuEmpleado = () => {
    menuEmpleadoAbiertoId.value = null
  }

  const abrirHistorialEmpleado = (employeeId: number) => {
    const key = String(employeeId)
    const empleado = historialAgrupadoPorEmpleado.value.find((item) => item.key === key)

    cambiarSeccion('historial-pagos')
    empleadoHistorialCompletoKey.value = null
    empleadoHistorialAbierto.value = key
    seleccionarRecibo(empleado?.pagos?.[0] ?? null)
    cerrarMenuEmpleado()
  }

  const updateHistorialPagosSearch = (value: string) => {
    historialPagosSearch.value = value
  }

  const verTodosPagosEmpleado = (employeeKey: string) => {
    const empleado = historialAgrupadoPorEmpleado.value.find((item) => item.key === employeeKey)

    if (!empleado) {
      return
    }

    empleadoHistorialCompletoKey.value = employeeKey
    seccionActiva.value = 'historial-pagos-empleado'
    empleadoHistorialAbierto.value = employeeKey
    seleccionarRecibo(null)
  }

  const volverAHistorialPagos = () => {
    seccionActiva.value = 'historial-pagos'
    seleccionarRecibo(null)
  }

  const seleccionarParaVista = (recibo: Recibo, employeeKey?: string) => {
    const key = employeeKey || (recibo.employeeId ? String(recibo.employeeId) : null)

    if (key) {
      empleadoHistorialAbierto.value = key
    }

    seleccionarRecibo(recibo)
  }

  const alternarReciboHistorial = (recibo: Recibo, employeeKey?: string) => {
    if (reciboSeleccionado.value?.id === recibo.id) {
      cerrarReciboActivo()
      return
    }

    seleccionarParaVista(recibo, employeeKey)
  }

  const alternarEmpleadoHistorial = (employeeKey: string) => {
    if (empleadoHistorialAbierto.value === employeeKey) {
      empleadoHistorialAbierto.value = null
      seleccionarRecibo(null)
      return
    }

    empleadoHistorialAbierto.value = employeeKey
    seleccionarRecibo(null)
  }

  const cerrarReciboActivo = () => {
    seleccionarRecibo(null)
  }

  const imprimirVista = () => {
    window.print()
  }

  return {
    seccionActiva,
    empleadoHistorialAbierto,
    historialPagosSearch,
    menuEmpleadoAbiertoId,
    empleadosConRegistros,
    empleadosFiltrados,
    fechaUltimaNominaLabel,
    totalPayoutMensual,
    quickbooksSyncStats,
    empleadosDataGrid,
    historialAgrupadoPorEmpleado: historialAgrupadoPorEmpleadoFiltrado,
    historialEmpleadoCompleto,
    formatMoney,
    cambiarSeccion,
    buscarRecibos,
    alternarMenuEmpleado,
    cerrarMenuEmpleado,
    abrirHistorialEmpleado,
    updateHistorialPagosSearch,
    alternarReciboHistorial,
    alternarEmpleadoHistorial,
    verTodosPagosEmpleado,
    volverAHistorialPagos,
    cerrarReciboActivo,
    imprimirVista,
  }
}
