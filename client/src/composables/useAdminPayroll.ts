import axios from 'axios'
import { ref } from 'vue'
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

const toTitleCase = (value: string): string => {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ')
}

const inferEmployeeFromFileName = (fileName: string): { name: string; quickbooksId: string } => {
  const cleanBase = fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b(paystub|payslip|payroll|nomina|recibo)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  const name = cleanBase ? toTitleCase(cleanBase) : ''

  return {
    name,
    quickbooksId: name.toUpperCase(),
  }
}

interface ApiErrorPayload {
  msg?: unknown
  error?: unknown
  message?: unknown
}

const resolveApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  const payload = error.response?.data as ApiErrorPayload | undefined
  const apiError = typeof payload?.error === 'string' ? payload.error.trim() : ''
  const apiMsg = typeof payload?.msg === 'string' ? payload.msg.trim() : ''
  const apiMessage = typeof payload?.message === 'string' ? payload.message.trim() : ''

  return apiError || apiMsg || apiMessage || fallback
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
  const quickbooksId = pick(record, [
    'quickbooks_id',
    'quickbooksid',
    'employee_id',
    'employee_code',
    'codigo_empleado',
    'empleado_id',
    'empleado',
    'nombre',
  ])

  return {
    quickbooksId,
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
    checkNumber: pick(record, ['check_number', 'numero_cheque', 'cheque']),
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

const readFileAsDataUrlWithProgress = (file: File, onProgress?: (percent: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onProgress?.(100)
        resolve(reader.result)
        return
      }

      reject(new Error('No fue posible leer el archivo.'))
    }

    reader.onerror = () => {
      reject(new Error('No fue posible leer el archivo.'))
    }

    reader.onprogress = (event) => {
      if (!event.lengthComputable) {
        return
      }

      const percent = Math.round((event.loaded / event.total) * 100)
      onProgress?.(percent)
    }

    reader.readAsDataURL(file)
  })
}

interface ImportNominaResult {
  ok: boolean
  linkedRecords: number
  employeeName: string
}

export const useAdminPayroll = () => {
  const rawInput = ref('')
  const selectedExcelFile = ref<File | null>(null)
  const defaultEmployeeName = ref('')
  const defaultEmployeeQuickbooksId = ref('')
  const search = ref('')

  const recibosExistentes = ref<Recibo[]>([])
  const reciboSeleccionado = ref<Recibo | null>(null)

  const loadingImport = ref(false)
  const importProgress = ref(0)
  const loadingSearch = ref(false)

  const errorMessage = ref('')
  const successMessage = ref('')

  const limpiarMensajes = () => {
    errorMessage.value = ''
    successMessage.value = ''
  }

  const importarNomina = async (): Promise<ImportNominaResult> => {
    limpiarMensajes()

    const hasExcelFile = Boolean(selectedExcelFile.value)

    if (hasExcelFile && selectedExcelFile.value) {
      loadingImport.value = true
      importProgress.value = 5

      try {
        const sourceEmployeeName = defaultEmployeeName.value.trim()
        const excelBase64 = await readFileAsDataUrlWithProgress(selectedExcelFile.value, (percent) => {
          importProgress.value = Math.max(5, Math.min(55, Math.round(5 + percent * 0.5)))
        })
        importProgress.value = 65

        const payload = {
          excelBase64,
          excelFileName: selectedExcelFile.value.name,
          defaultEmployeeName: sourceEmployeeName || undefined,
          defaultEmployeeQuickbooksId: defaultEmployeeQuickbooksId.value.trim() || undefined,
        }

        const response = await importarNominaAdmin(payload)
        importProgress.value = 100

        successMessage.value = `${response.msg}. Creados: ${response.resumen.recibosCreados}, actualizados: ${response.resumen.recibosActualizados}, usuarios nuevos: ${response.resumen.usuariosNuevos}.`

        const linkedRecords = Math.max(
          response.resumen.registrosProcesados || 0,
          (response.resumen.recibosCreados || 0) + (response.resumen.recibosActualizados || 0),
        )

        selectedExcelFile.value = null

        await cargarRecibosAdmin(search.value)
        return {
          ok: true,
          linkedRecords,
          employeeName: sourceEmployeeName || 'empleado',
        }
      } catch (error) {
        errorMessage.value = resolveApiErrorMessage(error, 'No fue posible importar el archivo Excel.')
        return {
          ok: false,
          linkedRecords: 0,
          employeeName: '',
        }
      } finally {
        loadingImport.value = false
        importProgress.value = 0
      }
    }

    const text = rawInput.value.trim()

    if (!text) {
      errorMessage.value = 'Pega un CSV/TSV o JSON para importar la nómina.'
      return {
        ok: false,
        linkedRecords: 0,
        employeeName: '',
      }
    }

    const parsed = text.startsWith('[') ? parseJsonInput(text) : parseDelimitedInput(text)

    if (!parsed.length) {
      errorMessage.value = 'No fue posible interpretar los datos pegados.'
      return {
        ok: false,
        linkedRecords: 0,
        employeeName: '',
      }
    }

    const validItems = parsed.filter((item) => item.quickbooksId && item.nombre && item.fecha)

    if (!validItems.length) {
      errorMessage.value = 'No hay registros válidos para importar.'
      return {
        ok: false,
        linkedRecords: 0,
        employeeName: '',
      }
    }

    loadingImport.value = true
    importProgress.value = 35

    try {
      const payload = {
        nominaData: validItems,
      }

      const response = await importarNominaAdmin(payload)
      importProgress.value = 100

      successMessage.value = `${response.msg}. Creados: ${response.resumen.recibosCreados}, actualizados: ${response.resumen.recibosActualizados}, usuarios nuevos: ${response.resumen.usuariosNuevos}.`

      await cargarRecibosAdmin(search.value)

      const linkedRecords = Math.max(
        response.resumen.registrosProcesados || 0,
        (response.resumen.recibosCreados || 0) + (response.resumen.recibosActualizados || 0),
      )

      return {
        ok: true,
        linkedRecords,
        employeeName: defaultEmployeeName.value.trim() || validItems[0]?.nombre || 'empleado',
      }
    } catch (error) {
      errorMessage.value = resolveApiErrorMessage(error, 'No fue posible importar la nómina.')
      return {
        ok: false,
        linkedRecords: 0,
        employeeName: '',
      }
    } finally {
      loadingImport.value = false
      importProgress.value = 0
    }
  }

  const cargarRecibosAdmin = async (query = '', limit = 4) => {
    loadingSearch.value = true

    try {
      const data = await getRecibosAdmin(query, limit)
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
    selectedExcelFile.value = null
    defaultEmployeeName.value = ''
    defaultEmployeeQuickbooksId.value = ''
    limpiarMensajes()
  }

  const setExcelFile = (file: File | null) => {
    selectedExcelFile.value = file

    if (file) {
      const inferred = inferEmployeeFromFileName(file.name)

      defaultEmployeeName.value = inferred.name
      defaultEmployeeQuickbooksId.value = inferred.quickbooksId
      rawInput.value = ''
      limpiarMensajes()
      return
    }

    defaultEmployeeName.value = ''
    defaultEmployeeQuickbooksId.value = ''
  }

  return {
    rawInput,
    selectedExcelFile,
    defaultEmployeeName,
    defaultEmployeeQuickbooksId,
    search,
    recibosExistentes,
    reciboSeleccionado,
    loadingImport,
    importProgress,
    loadingSearch,
    errorMessage,
    successMessage,
    importarNomina,
    cargarRecibosAdmin,
    seleccionarRecibo,
    limpiarEntrada,
    limpiarMensajes,
    setExcelFile,
  }
}
