import { computed, ref } from 'vue'
import { getRecibosAdmin, importarNominaAdmin, type NominaImportItemPayload } from '../api/admin'
import type { Recibo } from '../types/payroll'

interface RawRecord {
  [key: string]: string
}

const parseNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value !== 'string') {
    return 0
  }

  let sanitized = value.trim().replace(/[^\d.,-]/g, '')

  if (!sanitized) {
    return 0
  }

  const lastComma = sanitized.lastIndexOf(',')
  const lastDot = sanitized.lastIndexOf('.')

  if (lastComma > lastDot) {
    sanitized = sanitized.replaceAll('.', '').replace(',', '.')
  } else if (lastDot > lastComma) {
    sanitized = sanitized.replaceAll(',', '')
  } else if (lastComma !== -1) {
    sanitized = sanitized.replace(',', '.')
  }

  const parsed = Number(sanitized)
  return Number.isFinite(parsed) ? parsed : 0
}

const normalizeHeader = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

const pick = (record: RawRecord, aliases: string[]): string => {
  for (const alias of aliases) {
    const value = record[alias]

    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value)
    }
  }

  return ''
}

const parseDelimitedLine = (line: string, delimiter: string): string[] => {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }

      continue
    }

    if (char === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  result.push(current.trim())
  return result
}

const detectDelimiter = (line: string): string => {
  const delimiters = ['\t', ',', ';', '|']

  return delimiters
    .map((delimiter) => ({ delimiter, count: line.split(delimiter).length }))
    .sort((a, b) => b.count - a.count)[0].delimiter
}

const buildPeriodo = (record: RawRecord): string => {
  const periodo = pick(record, ['periodo'])

  if (periodo) {
    return periodo
  }

  const periodoPago = pick(record, ['periodo_pago', 'rango_pago'])

  if (periodoPago) {
    return periodoPago
  }

  const inicio = pick(record, ['periodo_inicio', 'inicio_periodo'])
  const fin = pick(record, ['periodo_fin', 'fin_periodo'])

  if (inicio && fin) {
    return `Del ${inicio} al ${fin}`
  }

  return 'Periodo no especificado'
}

const normalizeRawToImportItem = (record: RawRecord): NominaImportItemPayload => {
  const periodo = buildPeriodo(record)

  return {
    email: pick(record, ['email', 'correo', 'correo_electronico']),
    nombre: pick(record, ['nombre', 'empleado', 'name']),
    fecha: pick(record, ['fecha', 'fecha_pago', 'pay_date']),
    totalNeto: parseNumber(pick(record, ['total_neto', 'totalneto', 'monto', 'neto', 'net_pay'])),
    periodo,
    desglose: {
      horas_regulares: parseNumber(pick(record, ['horas_regulares', 'horas', 'horas_trabajadas'])),
      pago_hora: parseNumber(pick(record, ['pago_hora', 'tasa', 'tarifa_hora'])),
      deducciones: parseNumber(pick(record, ['deducciones', 'impuestos'])),
      bonos: parseNumber(pick(record, ['bonos', 'bonus'])),
      periodo_pago: periodo,
      cargo: pick(record, ['cargo', 'puesto']) || 'No especificado',
    },
  }
}

const parseJsonInput = (rawText: string): NominaImportItemPayload[] => {
  try {
    const parsed = JSON.parse(rawText) as Array<Record<string, unknown>>

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.map((item) => {
      const normalized: RawRecord = {}

      Object.entries(item).forEach(([key, value]) => {
        normalized[normalizeHeader(key)] = String(value ?? '')
      })

      return normalizeRawToImportItem(normalized)
    })
  } catch {
    return []
  }
}

const parseDelimitedInput = (rawText: string): NominaImportItemPayload[] => {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    return []
  }

  const delimiter = detectDelimiter(lines[0])
  const headers = parseDelimitedLine(lines[0], delimiter).map(normalizeHeader)

  return lines.slice(1).map((line) => {
    const values = parseDelimitedLine(line, delimiter)
    const record: RawRecord = {}

    headers.forEach((header, index) => {
      record[header] = values[index] ?? ''
    })

    return normalizeRawToImportItem(record)
  })
}

const toPreviewRecibo = (item: NominaImportItemPayload, index: number): Recibo => {
  const detalles = item.desglose ?? {}
  const horas = parseNumber(detalles.horas_regulares)
  const pagoHora = parseNumber(detalles.pago_hora)
  const bonos = parseNumber(detalles.bonos)
  const deducciones = parseNumber(detalles.deducciones)

  return {
    id: -(index + 1),
    fecha_pago: item.fecha,
    monto: item.totalNeto,
    periodo: item.periodo || 'Periodo no especificado',
    estado: 'Vista previa',
    User: {
      nombre: item.nombre,
      email: item.email,
    },
    detalles: {
      ...detalles,
      horas_regulares: horas,
      pago_hora: pagoHora,
      bonos,
      deducciones,
      periodo_pago: String(detalles.periodo_pago || item.periodo || 'No especificado'),
      cargo: String(detalles.cargo || 'No especificado'),
    },
  }
}

export const useAdminPayroll = () => {
  const rawInput = ref('')
  const search = ref('')

  const parsedItems = ref<NominaImportItemPayload[]>([])
  const previewRecibos = ref<Recibo[]>([])
  const recibosExistentes = ref<Recibo[]>([])
  const reciboSeleccionado = ref<Recibo | null>(null)

  const loadingPreview = ref(false)
  const loadingImport = ref(false)
  const loadingSearch = ref(false)

  const errorMessage = ref('')
  const successMessage = ref('')

  const validItems = computed(() => {
    return parsedItems.value.filter((item) => item.email && item.nombre && item.fecha)
  })

  const limpiarMensajes = () => {
    errorMessage.value = ''
    successMessage.value = ''
  }

  const generarPreview = () => {
    limpiarMensajes()
    loadingPreview.value = true

    try {
      const text = rawInput.value.trim()

      if (!text) {
        parsedItems.value = []
        previewRecibos.value = []
        errorMessage.value = 'Pega un CSV/TSV o JSON para generar la vista previa.'
        return
      }

      const parsed = text.startsWith('[') ? parseJsonInput(text) : parseDelimitedInput(text)

      if (!parsed.length) {
        parsedItems.value = []
        previewRecibos.value = []
        errorMessage.value = 'No fue posible interpretar los datos pegados.'
        return
      }

      parsedItems.value = parsed
      previewRecibos.value = parsed.map(toPreviewRecibo)
      reciboSeleccionado.value = previewRecibos.value[0] ?? null

      if (!validItems.value.length) {
        errorMessage.value = 'Se detectaron filas incompletas. Revisa email, nombre y fecha.'
      } else {
        successMessage.value = `Vista previa lista: ${validItems.value.length} registro(s) válidos.`
      }
    } finally {
      loadingPreview.value = false
    }
  }

  const importarNomina = async () => {
    limpiarMensajes()

    if (!parsedItems.value.length) {
      generarPreview()
    }

    if (!validItems.value.length) {
      errorMessage.value = 'No hay registros válidos para importar.'
      return false
    }

    loadingImport.value = true

    try {
      const payload = {
        nominaData: validItems.value,
      }

      const response = await importarNominaAdmin(payload)

      successMessage.value = `${response.msg}. Creados: ${response.resumen.recibosCreados}, actualizados: ${response.resumen.recibosActualizados}, usuarios nuevos: ${response.resumen.usuariosNuevos}.`

      await cargarRecibosAdmin(search.value)
      return true
    } catch {
      errorMessage.value = 'No fue posible importar la nómina.'
      return false
    } finally {
      loadingImport.value = false
    }
  }

  const cargarRecibosAdmin = async (query = '') => {
    loadingSearch.value = true

    try {
      const data = await getRecibosAdmin(query)
      recibosExistentes.value = data

      if (!reciboSeleccionado.value && data.length) {
        reciboSeleccionado.value = data[0]
      }
    } catch {
      errorMessage.value = 'No fue posible consultar recibos existentes.'
      recibosExistentes.value = []
    } finally {
      loadingSearch.value = false
    }
  }

  const seleccionarRecibo = (recibo: Recibo | null) => {
    reciboSeleccionado.value = recibo
  }

  const limpiarEntrada = () => {
    rawInput.value = ''
    parsedItems.value = []
    previewRecibos.value = []
    limpiarMensajes()
  }

  return {
    rawInput,
    search,
    previewRecibos,
    recibosExistentes,
    reciboSeleccionado,
    loadingPreview,
    loadingImport,
    loadingSearch,
    errorMessage,
    successMessage,
    validItems,
    generarPreview,
    importarNomina,
    cargarRecibosAdmin,
    seleccionarRecibo,
    limpiarEntrada,
    limpiarMensajes,
  }
}
