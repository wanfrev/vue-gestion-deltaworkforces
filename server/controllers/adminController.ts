import bcrypt from 'bcrypt'
import { Request, Response } from 'express'
import { parse } from 'csv-parse/sync'
import { Op, col, fn, where as sequelizeWhere, type Transaction } from 'sequelize'
import XLSX from 'xlsx'
import { Employee, PaymentRecord, User, sequelize } from '../models'
import { isRole, ROLES, type Role } from '../constants/roles'

interface NominaImportItem {
  quickbooksId: string
  nombre: string
  fecha: string
  totalNeto: number
  periodo?: string
  desglose?: Record<string, unknown>
  checkNumber?: string
}

interface CreateEmployeeByAdminPayload {
  username?: string
  password?: string
  role?: Role | string
  quickbooks_id?: string
  quickbooksId?: string
  first_name?: string
  firstName?: string
  last_name?: string
  lastName?: string
  position?: string
  base_salary?: number | string
  baseSalary?: number | string
}

interface RawNominaRecord {
  [key: string]: unknown
}

interface AutoCreatedUserSummary {
  nombre: string
  username: string
  passwordTemporal: string
  quickbooksId: string
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

const normalizeText = (value: unknown): string => {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

const parseDateTokenToISO = (token: string): string => {
  const value = token.trim()

  if (!value) {
    return ''
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const match = value.match(/^(\d{1,4})[\/.-](\d{1,2})[\/.-](\d{1,4})$/)

  if (!match) {
    return ''
  }

  const first = Number(match[1])
  const second = Number(match[2])
  const third = Number(match[3])

  let year = 0
  let month = 0
  let day = 0

  if (match[1].length === 4) {
    year = first
    month = second
    day = third
  } else {
    year = match[3].length === 2 ? 2000 + third : third

    if (first > 12 && second <= 12) {
      day = first
      month = second
    } else {
      month = first
      day = second
    }
  }

  if (!year || month < 1 || month > 12 || day < 1 || day > 31) {
    return ''
  }

  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

const formatDateToISO = (value: unknown): string => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value)

    if (parsed) {
      const date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d))
      return date.toISOString().slice(0, 10)
    }
  }

  if (typeof value === 'string' && value.trim()) {
    const parsedTokenDate = parseDateTokenToISO(value)

    if (parsedTokenDate) {
      return parsedTokenDate
    }

    const asDate = new Date(value)

    if (!Number.isNaN(asDate.getTime())) {
      return asDate.toISOString().slice(0, 10)
    }
  }

  return ''
}

const toTitleCase = (value: string): string => {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ')
}

const normalizeUsernameToken = (value: string): string => {
  return normalizeText(value).replace(/[^a-z0-9]/g, '')
}

const extractNamesFromNominaItem = (item: NominaImportItem): { firstName: string; lastName: string } | null => {
  const source = String(item.nombre || item.quickbooksId || '').trim()

  if (!source) {
    return null
  }

  const parts = source.split(/\s+/).filter(Boolean)

  if (!parts.length) {
    return null
  }

  const firstName = toTitleCase(parts[0])
  const lastName = toTitleCase(parts.slice(1).join(' ')) || 'Empleado'

  return { firstName, lastName }
}

const buildQuickbooksIdCandidate = (item: NominaImportItem, names: { firstName: string; lastName: string }): string => {
  const directQuickbooksId = String(item.quickbooksId || '').trim()

  if (directQuickbooksId) {
    return directQuickbooksId
  }

  return `${names.firstName} ${names.lastName}`.trim()
}

const generateUniqueUsername = async (
  firstName: string,
  lastName: string,
  transaction: Transaction,
): Promise<string> => {
  const firstToken = normalizeUsernameToken(firstName)
  const lastToken = normalizeUsernameToken(lastName)
  const baseUsername = [firstToken, lastToken].filter(Boolean).join('.') || 'empleado.delta'

  let attempt = 0

  while (attempt < 1000) {
    const candidate = attempt === 0 ? baseUsername : `${baseUsername}${attempt}`

    const exists = await User.findOne({
      where: {
        username: {
          [Op.iLike]: candidate,
        },
      },
      transaction,
    })

    if (!exists) {
      return candidate
    }

    attempt += 1
  }

  throw new Error('No fue posible generar un username único para el empleado importado.')
}

const autoCreateEmployeeFromNominaItem = async (
  item: NominaImportItem,
  transaction: Transaction,
) => {
  const names = extractNamesFromNominaItem(item)

  if (!names) {
    return { employee: null }
  }

  const quickbooksId = buildQuickbooksIdCandidate(item, names)

  const existingEmployee = await Employee.findOne({
    where: {
      quickbooks_id: {
        [Op.iLike]: quickbooksId,
      },
    },
    transaction,
  })

  if (existingEmployee) {
    return { employee: existingEmployee }
  }

  const username = await generateUniqueUsername(names.firstName, names.lastName, transaction)
  const passwordBase = normalizeUsernameToken(names.firstName) || 'empleado'
  const passwordTemporal = `${passwordBase}123`
  const passwordHash = await bcrypt.hash(passwordTemporal, 10)

  const newUser = await User.create(
    {
      username,
      password_hash: passwordHash,
      role: ROLES.EMPLEADO,
    },
    { transaction },
  )

  const newEmployee = await Employee.create(
    {
      user_id: Number(newUser.getDataValue('id')),
      quickbooks_id: quickbooksId,
      first_name: names.firstName,
      last_name: names.lastName,
      position: null,
      base_salary: null,
    },
    { transaction },
  )

  return {
    employee: newEmployee,
    createdUser: {
      nombre: `${names.firstName} ${names.lastName}`.trim(),
      username,
      passwordTemporal,
      quickbooksId,
    },
  }
}

const stripExcelDataUriPrefix = (value: string): string => {
  const marker = 'base64,'
  const index = value.indexOf(marker)

  if (index === -1) {
    return value.trim()
  }

  return value.slice(index + marker.length).trim()
}

const deriveEmployeeNameFromFileName = (fileName: string): string => {
  const cleanBase = fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b(paystub|payslip|payroll|nomina|recibo)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  return cleanBase ? toTitleCase(cleanBase) : ''
}

const formatCellValue = (worksheet: XLSX.WorkSheet, row: number, col: number): string => {
  const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
  const cell = worksheet[cellAddress]

  if (!cell || cell.v === undefined || cell.v === null) {
    return ''
  }

  if (cell.w && typeof cell.w === 'string') {
    return cell.w.trim()
  }

  return String(cell.v).trim()
}

const formatDateDisplay = (value: unknown): string => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  const iso = formatDateToISO(value)

  if (!iso) {
    return ''
  }

  const [year, month, day] = iso.split('-')
  return `${month}/${day}/${year}`
}

const getCellValueByAddress = (worksheet: XLSX.WorkSheet, address: string): string => {
  const decoded = XLSX.utils.decode_cell(address)
  return formatCellValue(worksheet, decoded.r, decoded.c)
}

const getCellRawValue = (worksheet: XLSX.WorkSheet, row: number, col: number): unknown => {
  const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
  const cell = worksheet[cellAddress]
  return cell?.v
}

const getCellRawValueByAddress = (worksheet: XLSX.WorkSheet, address: string): unknown => {
  const decoded = XLSX.utils.decode_cell(address)
  return getCellRawValue(worksheet, decoded.r, decoded.c)
}

const extractDateRangeFromText = (
  value: string,
): {
  startRaw?: string
  endRaw?: string
} | null => {
  const dateTokens = value.match(/\d{1,4}[\/.-]\d{1,2}[\/.-]\d{1,4}/g) ?? []
  const validTokens = dateTokens.filter((token) => Boolean(parseDateTokenToISO(token)))

  if (!validTokens.length) {
    return null
  }

  return {
    startRaw: validTokens[0],
    endRaw: validTokens[1],
  }
}

const extractPayPeriodRawValuesFromWorksheet = (
  worksheet: XLSX.WorkSheet,
): {
  startRaw: unknown
  endRaw: unknown
} => {
  const fallbackStart = getCellRawValueByAddress(worksheet, 'B11') ?? getCellValueByAddress(worksheet, 'B11')
  const fallbackEnd = getCellRawValueByAddress(worksheet, 'D11') ?? getCellValueByAddress(worksheet, 'D11')

  const payPeriodCell = findCellByNormalizedLabels(worksheet, [
    'Pay Period',
    'Periodo',
    'Periodo de pago',
    'Período',
    'Período de pago',
  ])

  if (!payPeriodCell) {
    return {
      startRaw: fallbackStart,
      endRaw: fallbackEnd,
    }
  }

  const offsets = [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 0],
    [1, 1],
    [1, 2],
    [1, 3],
  ] as const

  const candidateValues = offsets
    .map(([rowOffset, colOffset]) => {
      const row = payPeriodCell.row + rowOffset
      const col = payPeriodCell.col + colOffset
      const raw = getCellRawValue(worksheet, row, col)

      if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
        return raw
      }

      const formatted = formatCellValue(worksheet, row, col)
      return formatted || undefined
    })
    .filter((value): value is unknown => value !== undefined)

  for (const candidate of candidateValues) {
    const rangeFromText = extractDateRangeFromText(String(candidate))

    if (rangeFromText?.startRaw || rangeFromText?.endRaw) {
      return {
        startRaw: rangeFromText.startRaw ?? fallbackStart,
        endRaw: rangeFromText.endRaw ?? rangeFromText.startRaw ?? fallbackEnd,
      }
    }
  }

  const directDateCandidates = candidateValues.filter((candidate) => Boolean(formatDateToISO(candidate)))

  if (directDateCandidates.length >= 2) {
    return {
      startRaw: directDateCandidates[0],
      endRaw: directDateCandidates[1],
    }
  }

  if (directDateCandidates.length === 1) {
    return {
      startRaw: directDateCandidates[0],
      endRaw: fallbackEnd || directDateCandidates[0],
    }
  }

  return {
    startRaw: fallbackStart,
    endRaw: fallbackEnd,
  }
}

const findCellByNormalizedLabels = (
  worksheet: XLSX.WorkSheet,
  labels: string[],
): { row: number; col: number } | null => {
  const ref = worksheet['!ref']

  if (!ref) {
    return null
  }

  const normalizedLabels = new Set(labels.map((label) => normalizeText(label)))
  const range = XLSX.utils.decode_range(ref)

  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const value = formatCellValue(worksheet, row, col)

      if (!value) {
        continue
      }

      if (normalizedLabels.has(normalizeText(value))) {
        return { row, col }
      }
    }
  }

  return null
}

const extractEmployeeNameFromWorksheet = (worksheet: XLSX.WorkSheet): string => {
  const employeeCell = findCellByNormalizedLabels(worksheet, ['Employee', 'Empleado'])

  if (!employeeCell) {
    return ''
  }

  const candidateValues = [
    formatCellValue(worksheet, employeeCell.row + 1, employeeCell.col),
    formatCellValue(worksheet, employeeCell.row, employeeCell.col + 1),
    formatCellValue(worksheet, employeeCell.row + 1, employeeCell.col + 1),
  ]

  for (const candidate of candidateValues) {
    if (candidate && normalizeText(candidate) !== 'employee' && normalizeText(candidate) !== 'empleado') {
      return candidate
    }
  }

  return ''
}

const extractValueNearLabel = (
  worksheet: XLSX.WorkSheet,
  labels: string[],
  offsets: Array<{ rowOffset: number; colOffset: number }>,
): unknown => {
  const labelCell = findCellByNormalizedLabels(worksheet, labels)

  if (!labelCell) {
    return undefined
  }

  for (const { rowOffset, colOffset } of offsets) {
    const row = labelCell.row + rowOffset
    const col = labelCell.col + colOffset
    const raw = getCellRawValue(worksheet, row, col)

    if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
      return raw
    }

    const formatted = formatCellValue(worksheet, row, col)

    if (formatted) {
      return formatted
    }
  }

  return undefined
}

const extractCompanyNameFromWorksheet = (worksheet: XLSX.WorkSheet): string => {
  const directCandidates = ['A1', 'B1', 'A2', 'B2', 'B4']

  for (const address of directCandidates) {
    const value = getCellValueByAddress(worksheet, address)

    if (value) {
      return value
    }
  }

  const ref = worksheet['!ref']

  if (!ref) {
    return ''
  }

  const range = XLSX.utils.decode_range(ref)
  const maxRow = Math.min(range.e.r, 4)
  const maxCol = Math.min(range.e.c, 2)

  for (let row = range.s.r; row <= maxRow; row += 1) {
    for (let col = range.s.c; col <= maxCol; col += 1) {
      const value = formatCellValue(worksheet, row, col)

      if (value) {
        return value
      }
    }
  }

  return ''
}

const parseExcelNomina = (
  excelBase64: string,
  options?: {
    defaultEmployeeName?: string
    defaultEmployeeQuickbooksId?: string
    excelFileName?: string
  },
): NominaImportItem[] => {
  const payload = stripExcelDataUriPrefix(excelBase64)
  const workbook = XLSX.read(Buffer.from(payload, 'base64'), {
    type: 'buffer',
    cellDates: true,
  })

  const fileNameFallback = deriveEmployeeNameFromFileName(options?.excelFileName ?? '')
  const defaultEmployeeName =
    (options?.defaultEmployeeName || '').trim() || fileNameFallback || 'Empleado sin nombre'
  const defaultEmployeeQuickbooksId =
    (options?.defaultEmployeeQuickbooksId || '').trim() || defaultEmployeeName

  const items: NominaImportItem[] = []

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName]

    if (!worksheet) {
      return
    }

    const employeeRaw = extractEmployeeNameFromWorksheet(worksheet) || getCellValueByAddress(worksheet, 'B8')
    const { startRaw: startDateRaw, endRaw: endDateRaw } = extractPayPeriodRawValuesFromWorksheet(worksheet)
    const companyRaw = extractCompanyNameFromWorksheet(worksheet)
    const workedHoursRaw =
      extractValueNearLabel(
        worksheet,
        ['Worked Hours', 'Horas trabajadas', 'Horas regulares'],
        [
          { rowOffset: 0, colOffset: 1 },
          { rowOffset: 0, colOffset: 2 },
          { rowOffset: 1, colOffset: 0 },
        ],
      ) ??
      getCellRawValueByAddress(worksheet, 'B18') ??
      getCellValueByAddress(worksheet, 'B18')
    const hourlyRateRaw =
      extractValueNearLabel(
        worksheet,
        ['Hourly Rate', 'Tarifa por hora', 'Pago por hora'],
        [
          { rowOffset: 0, colOffset: 1 },
          { rowOffset: 0, colOffset: 2 },
          { rowOffset: 1, colOffset: 0 },
        ],
      ) ??
      getCellRawValueByAddress(worksheet, 'C18') ??
      getCellValueByAddress(worksheet, 'C18')
    const totalPaidRaw =
      extractValueNearLabel(
        worksheet,
        ['Total Paid', 'Total pagado', 'Pago total', 'Net Pay'],
        [
          { rowOffset: 0, colOffset: 1 },
          { rowOffset: 0, colOffset: 2 },
          { rowOffset: 1, colOffset: 0 },
        ],
      ) ??
      getCellRawValueByAddress(worksheet, 'B21') ??
      getCellValueByAddress(worksheet, 'B21')

    const employeeName =
      employeeRaw && normalizeText(employeeRaw) !== 'employee' ? employeeRaw : defaultEmployeeName
    const quickbooksId = employeeName || defaultEmployeeQuickbooksId

    const startDate = formatDateToISO(startDateRaw)
    const endDate = formatDateToISO(endDateRaw)
    const fallbackDate = new Date().toISOString().slice(0, 10)
    const fechaPago = endDate || startDate || fallbackDate
    const periodStart = startDate || endDate || fechaPago
    const periodEnd = endDate || startDate || fechaPago

    const workedHours = parseNumber(workedHoursRaw)
    const hourlyRate = parseNumber(hourlyRateRaw)
    const totalPaid = parseNumber(totalPaidRaw)
    const earningTotal = workedHours * hourlyRate
    const periodDisplayStart = formatDateDisplay(startDateRaw) || periodStart
    const periodDisplayEnd = formatDateDisplay(endDateRaw) || periodEnd
    const periodDisplay =
      periodDisplayStart && periodDisplayEnd
        ? `${periodDisplayStart} - ${periodDisplayEnd}`
        : periodDisplayEnd || periodDisplayStart || fechaPago

    items.push({
      quickbooksId,
      nombre: employeeName,
      fecha: fechaPago,
      totalNeto: totalPaid,
      periodo: `${periodStart} to ${periodEnd}`,
      desglose: {
        company: companyRaw || 'Empresa no especificada',
        employee: employeeName,
        period: periodDisplay,
        earnings: [
          {
            description: 'Worked Hours',
            quantity: workedHours,
            rate: hourlyRate,
            total: earningTotal,
          },
        ],
        total_paid: totalPaid,
        status: 'Pagado',
        source_sheet: sheetName,
        hours_worked: workedHours,
        hourly_rate: hourlyRate,
        horas_regulares: workedHours,
        pago_hora: hourlyRate,
        periodo_pago: periodDisplay,
      },
    })
  })

  return items
}

const parseJsonSafe = (value: unknown): Record<string, unknown> => {
  if (typeof value !== 'string' || !value.trim()) {
    return {}
  }

  try {
    const parsed = JSON.parse(value)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

const buildPeriodo = (item: {
  periodo?: string
  periodo_inicio?: string
  periodo_fin?: string
  periodo_pago?: string
}): string => {
  if (item.periodo) return item.periodo
  if (item.periodo_pago) return item.periodo_pago

  if (item.periodo_inicio && item.periodo_fin) {
    return `Del ${item.periodo_inicio} al ${item.periodo_fin}`
  }

  return 'Periodo no especificado'
}

const normalizeHeader = (header: string): string => {
  return header
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

const extractValue = (record: RawNominaRecord, aliases: string[]): unknown => {
  for (const alias of aliases) {
    if (record[alias] !== undefined && record[alias] !== null && String(record[alias]).trim() !== '') {
      return record[alias]
    }
  }

  return undefined
}

const parseDelimitedRow = (line: string, delimiter: string): string[] => {
  const values: string[] = []
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
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values
}

const detectDelimiter = (headerLine: string): string => {
  const delimiters = ['\t', ',', ';', '|']

  return delimiters
    .map((delimiter) => ({
      delimiter,
      count: headerLine.split(delimiter).length,
    }))
    .sort((a, b) => b.count - a.count)[0].delimiter
}

const mapRawRecordToNominaItem = (record: RawNominaRecord): NominaImportItem => {
  const periodo = buildPeriodo({
    periodo: String(extractValue(record, ['periodo']) ?? ''),
    periodo_inicio: String(extractValue(record, ['periodo_inicio', 'inicio_periodo']) ?? ''),
    periodo_fin: String(extractValue(record, ['periodo_fin', 'fin_periodo']) ?? ''),
    periodo_pago: String(extractValue(record, ['periodo_pago', 'rango_pago']) ?? ''),
  })

  const desglose = extractValue(record, ['desglose'])
  const rawDesglose =
    typeof desglose === 'string'
      ? parseJsonSafe(desglose)
      : typeof desglose === 'object' && desglose !== null
        ? (desglose as Record<string, unknown>)
        : {
            horas_regulares: parseNumber(
              extractValue(record, ['horas_regulares', 'horas', 'horas_trabajadas']),
            ),
            pago_hora: parseNumber(extractValue(record, ['pago_hora', 'tasa', 'tarifa_hora'])),
            deducciones: parseNumber(extractValue(record, ['deducciones', 'impuestos'])),
            bonos: parseNumber(extractValue(record, ['bonos', 'bonus'])),
            periodo_pago: periodo,
            cargo: String(extractValue(record, ['cargo', 'puesto']) ?? 'No especificado'),
          }

  return {
    quickbooksId: String(
      extractValue(record, [
        'quickbooks_id',
        'quickbooksid',
        'employee_id',
        'employee_code',
        'codigo_empleado',
        'empleado_id',
        'empleado',
        'nombre',
      ]) ?? '',
    ),
    nombre: String(extractValue(record, ['nombre', 'empleado', 'name']) ?? ''),
    fecha: String(extractValue(record, ['fecha', 'fecha_pago', 'pay_date']) ?? ''),
    totalNeto: parseNumber(
      extractValue(record, ['total_neto', 'totalneto', 'monto', 'neto', 'net_pay']),
    ),
    periodo,
    desglose: rawDesglose,
    checkNumber: String(extractValue(record, ['check_number', 'numero_cheque', 'cheque']) ?? ''),
  }
}

const parseTableNomina = (rawText: string): NominaImportItem[] => {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (!lines.length) {
    return []
  }

  const delimiter = detectDelimiter(lines[0])
  const headers = parseDelimitedRow(lines[0], delimiter).map(normalizeHeader)

  const records = lines.slice(1).map((line) => {
    const rowValues = parseDelimitedRow(line, delimiter)
    const row: RawNominaRecord = {}

    headers.forEach((header, index) => {
      row[header] = rowValues[index] ?? ''
    })

    return row
  })

  return records.map(mapRawRecordToNominaItem)
}

const parseCsvNomina = (csvRaw: string): NominaImportItem[] => {
  const records = parse(csvRaw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[]

  return records.map((record) => {
    const normalizedRecord: RawNominaRecord = {}

    Object.entries(record).forEach(([key, value]) => {
      normalizedRecord[normalizeHeader(key)] = value
    })

    return mapRawRecordToNominaItem(normalizedRecord)
  })
}

const normalizeNominaItem = (item: NominaImportItem): NominaImportItem => {
  const quickbooksId = String(item.quickbooksId || '').trim()
  const nombre = String(item.nombre || '').trim()
  const fecha = String(item.fecha || '').trim()

  return {
    quickbooksId,
    nombre,
    fecha,
    totalNeto: parseNumber(item.totalNeto),
    periodo: item.periodo || buildPeriodo({}),
    desglose:
      typeof item.desglose === 'string'
        ? parseJsonSafe(item.desglose)
        : typeof item.desglose === 'object' && item.desglose !== null
          ? item.desglose
          : {},
    checkNumber: String(item.checkNumber || '').trim(),
  }
}

const findEmployeeByHybridMatch = async (item: NominaImportItem, transaction: Transaction) => {
  const identifiers = Array.from(
    new Set(
      [item.quickbooksId, item.nombre]
        .map((value) => String(value || '').trim())
        .filter(Boolean),
    ),
  )

  for (const identifier of identifiers) {
    const employeeByQuickbooks = await Employee.findOne({
      where: {
        quickbooks_id: {
          [Op.iLike]: identifier,
        },
      },
      transaction,
    })

    if (employeeByQuickbooks) {
      return employeeByQuickbooks
    }
  }

  for (const identifier of identifiers) {
    const employeeByQuickbooksPartial = await Employee.findOne({
      where: {
        quickbooks_id: {
          [Op.iLike]: `%${identifier}%`,
        },
      },
      transaction,
    })

    if (employeeByQuickbooksPartial) {
      return employeeByQuickbooksPartial
    }
  }

  const fullNameCandidate = identifiers.find((identifier) => identifier.includes(' '))

  if (fullNameCandidate) {
    const byFullName = await Employee.findOne({
      where: sequelizeWhere(fn('concat', col('first_name'), ' ', col('last_name')), {
        [Op.iLike]: fullNameCandidate,
      }),
      transaction,
    })

    if (byFullName) {
      return byFullName
    }

    const nameParts = fullNameCandidate.split(/\s+/).filter(Boolean)

    if (nameParts.length >= 2) {
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ')

      const byFirstAndLastName = await Employee.findOne({
        where: {
          first_name: {
            [Op.iLike]: firstName,
          },
          last_name: {
            [Op.iLike]: lastName,
          },
        },
        transaction,
      })

      if (byFirstAndLastName) {
        return byFirstAndLastName
      }
    }
  }

  const singleTokenCandidate = identifiers.find((identifier) => !identifier.includes(' '))

  if (singleTokenCandidate) {
    const bySingleName = await Employee.findOne({
      where: {
        [Op.or]: [
          {
            first_name: {
              [Op.iLike]: singleTokenCandidate,
            },
          },
          {
            last_name: {
              [Op.iLike]: singleTokenCandidate,
            },
          },
        ],
      },
      transaction,
    })

    if (bySingleName) {
      return bySingleName
    }
  }

  return null
}

export const importarNomina = async (req: Request, res: Response) => {
  try {
    const {
      nominaData,
      csv,
      rawText,
      excelBase64,
      excelFileName,
      defaultEmployeeName,
      defaultEmployeeQuickbooksId,
    } = req.body as {
      nominaData?: NominaImportItem[]
      csv?: string
      rawText?: string
      excelBase64?: string
      excelFileName?: string
      defaultEmployeeName?: string
      defaultEmployeeQuickbooksId?: string
    }

    let items: NominaImportItem[] = []

    if (Array.isArray(nominaData)) {
      items = nominaData
    } else if (typeof excelBase64 === 'string' && excelBase64.trim()) {
      items = parseExcelNomina(excelBase64, {
        defaultEmployeeName,
        defaultEmployeeQuickbooksId,
        excelFileName,
      })
    } else if (typeof csv === 'string' && csv.trim()) {
      items = parseCsvNomina(csv)
    } else if (typeof rawText === 'string' && rawText.trim()) {
      const text = rawText.trim()

      if (text.startsWith('[')) {
        try {
          const parsed = JSON.parse(text)
          items = Array.isArray(parsed)
            ? parsed.map((entry) => mapRawRecordToNominaItem(entry as RawNominaRecord))
            : []
        } catch {
          items = parseTableNomina(text)
        }
      } else {
        items = parseTableNomina(text)
      }
    } else {
      return res.status(400).json({
        msg: 'Debes enviar nominaData (array JSON), excelBase64 (archivo Excel), csv (string) o rawText (texto pegado).',
      })
    }

    if (!items.length) {
      return res.status(400).json({ msg: 'No hay registros para importar.' })
    }

    let recibosCreados = 0
    let recibosActualizados = 0
    let usuariosNuevos = 0
    const identificadoresNoEncontrados = new Set<string>()
    const usuariosAutoCreados: AutoCreatedUserSummary[] = []

    await sequelize.transaction(async (transaction) => {
      for (const rawItem of items) {
        const item = normalizeNominaItem(rawItem)

        if ((!item.quickbooksId && !item.nombre) || !item.fecha) {
          throw new Error('Registro inválido: se requiere fecha y al menos quickbooksId o nombre.')
        }

        let employee = await findEmployeeByHybridMatch(item, transaction)

        if (!employee) {
          const autoCreated = await autoCreateEmployeeFromNominaItem(item, transaction)
          employee = autoCreated.employee

          if (autoCreated.createdUser) {
            usuariosNuevos += 1
            usuariosAutoCreados.push(autoCreated.createdUser)
          }
        }

        if (!employee) {
          identificadoresNoEncontrados.add(item.quickbooksId || item.nombre)
          continue
        }

        const resolvedQuickbooksId = String(employee.getDataValue('quickbooks_id') || item.quickbooksId).trim()

        const detalles = {
          ...(item.desglose ?? {}),
          status: 'Pagado',
          quickbooks_id: resolvedQuickbooksId,
        }

        const totalDeducciones = parseNumber(
          item.desglose?.total_deductions ?? item.desglose?.deducciones,
        )
        const grossEarnings = parseNumber(
          item.desglose?.gross_earnings ?? item.desglose?.total_earnings ?? item.totalNeto + totalDeducciones,
        )
        const checkNumber = String(
          item.checkNumber || item.desglose?.check_number || item.desglose?.numero_cheque || '',
        ).trim()

        const pagoExistente = await PaymentRecord.findOne({
          where: {
            employee_id: employee.getDataValue('id'),
            payment_date: item.fecha,
            pay_period: item.periodo,
          },
          transaction,
        })

        if (pagoExistente) {
          pagoExistente.set('net_pay', item.totalNeto)
          pagoExistente.set('gross_earnings', grossEarnings)
          pagoExistente.set('total_deductions', totalDeducciones)
          pagoExistente.set('check_number', checkNumber || null)
          pagoExistente.set('details', detalles)
          await pagoExistente.save({ transaction })
          recibosActualizados += 1
        } else {
          await PaymentRecord.create(
            {
              pay_period: item.periodo,
              gross_earnings: grossEarnings,
              total_deductions: totalDeducciones,
              net_pay: item.totalNeto,
              check_number: checkNumber || null,
              payment_date: item.fecha,
              details: detalles,
              employee_id: employee.getDataValue('id'),
            },
            { transaction },
          )

          recibosCreados += 1
        }
      }
    })

    return res.json({
      msg:
        identificadoresNoEncontrados.size > 0
          ? 'Nómina importada con observaciones'
          : 'Nómina importada exitosamente',
      resumen: {
        registrosProcesados: items.length,
        usuariosNuevos,
        recibosCreados,
        recibosActualizados,
        registrosOmitidos: identificadoresNoEncontrados.size,
      },
      usuariosAutoCreados,
      errores: Array.from(identificadoresNoEncontrados).map((identifier) => {
        return `No se encontró empleado para el identificador "${identifier}".`
      }),
    })
  } catch (error) {
    return res.status(500).json({
      msg: 'Error en la importación',
      error: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}

export const createEmployeeByAdmin = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction()

  try {
    const payload = req.body as CreateEmployeeByAdminPayload

    const username = String(payload.username ?? '')
      .trim()
      .toLowerCase()
    const password = String(payload.password ?? '')
    const requestedRole = String(payload.role ?? ROLES.EMPLEADO).trim().toLowerCase()
    const role: Role = isRole(requestedRole) ? requestedRole : ROLES.EMPLEADO
    const quickbooksId = String(payload.quickbooks_id ?? payload.quickbooksId ?? '').trim()
    const firstName = String(payload.first_name ?? payload.firstName ?? '').trim()
    const lastName = String(payload.last_name ?? payload.lastName ?? '').trim()
    const position = String(payload.position ?? '').trim()
    const rawBaseSalary = payload.base_salary ?? payload.baseSalary
    const parsedBaseSalary =
      rawBaseSalary === undefined || rawBaseSalary === null || String(rawBaseSalary).trim() === ''
        ? null
        : parseNumber(rawBaseSalary)

    if (!username || !password) {
      await transaction.rollback()

      return res.status(400).json({
        message: 'username y password son obligatorios.',
      })
    }

    if (!isRole(requestedRole)) {
      await transaction.rollback()
      return res.status(400).json({ message: 'role debe ser admin o empleado.' })
    }

    if (role === ROLES.EMPLEADO && (!quickbooksId || !firstName || !lastName)) {
      await transaction.rollback()
      return res.status(400).json({
        message: 'Para rol empleado, quickbooks_id, first_name y last_name son obligatorios.',
      })
    }

    if (password.length < 8) {
      await transaction.rollback()
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' })
    }

    if (parsedBaseSalary !== null && parsedBaseSalary < 0) {
      await transaction.rollback()
      return res.status(400).json({ message: 'base_salary no puede ser negativo.' })
    }

    const existingUser = await User.findOne({
      where: { username },
      transaction,
    })

    if (existingUser) {
      await transaction.rollback()
      return res.status(409).json({ message: 'El username ya existe.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = await User.create(
      {
        username,
        password_hash: passwordHash,
        role,
      },
      { transaction },
    )

    let employeeId: number | null = null

    if (role === ROLES.EMPLEADO) {
      const existingEmployee = await Employee.findOne({
        where: { quickbooks_id: quickbooksId },
        transaction,
      })

      if (existingEmployee) {
        await transaction.rollback()
        return res.status(409).json({ message: 'El quickbooks_id ya existe.' })
      }

      const newEmployee = await Employee.create(
        {
          user_id: newUser.getDataValue('id'),
          quickbooks_id: quickbooksId,
          first_name: firstName,
          last_name: lastName,
          position: position || null,
          base_salary: parsedBaseSalary,
        },
        { transaction },
      )

      employeeId = Number(newEmployee.getDataValue('id'))
    }

    await transaction.commit()

    return res.status(201).json({
      message:
        role === ROLES.ADMIN
          ? 'Administrador creado correctamente.'
          : 'Empleado y usuario creados correctamente.',
      data: {
        username,
        role,
        employee: role === ROLES.EMPLEADO ? `${firstName} ${lastName}` : undefined,
        quickbooks_id: role === ROLES.EMPLEADO ? quickbooksId : undefined,
        employee_id: employeeId,
      },
    })
  } catch (error) {
    await transaction.rollback()

    return res.status(400).json({
      message: 'Error al crear el usuario.',
      error: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}

export const getRecibosAdmin = async (req: Request, res: Response) => {
  try {
    const search = String(req.query.search ?? '').trim()
    const requestedLimit = Number(req.query.limit ?? (search ? 50 : 4))
    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 200)
        : search
          ? 50
          : 4

    const where = search
      ? {
          [Op.or]: [
            { '$Employee.quickbooks_id$': { [Op.iLike]: `%${search}%` } },
            { '$Employee.first_name$': { [Op.iLike]: `%${search}%` } },
            { '$Employee.last_name$': { [Op.iLike]: `%${search}%` } },
            { '$Employee.User.username$': { [Op.iLike]: `%${search}%` } },
          ],
        }
      : undefined

    const paymentRecords = await PaymentRecord.findAll({
      where,
      include: [
        {
          model: Employee,
          required: true,
          attributes: ['id', 'quickbooks_id', 'first_name', 'last_name', 'position'],
          include: [
            {
              model: User,
              required: true,
              attributes: ['id', 'username', 'role'],
              where: { role: ROLES.EMPLEADO },
            },
          ],
        },
      ],
      order: [
        ['payment_date', 'DESC'],
        ['id', 'DESC'],
      ],
      limit,
      subQuery: false,
    })

    const payload = paymentRecords.map((paymentRecord) => {
      const data = paymentRecord.toJSON() as Record<string, unknown>
      const employeeData = data.Employee as Record<string, unknown> | undefined
      const userData = employeeData?.User as Record<string, unknown> | undefined
      const detalles = (data.details as Record<string, unknown> | undefined) ?? {}
      const firstName = String(employeeData?.first_name ?? '').trim()
      const lastName = String(employeeData?.last_name ?? '').trim()
      const nombreEmpleado = `${firstName} ${lastName}`.trim() || String(userData?.username ?? 'Empleado')
      const username = String(userData?.username ?? '')

      return {
        id: Number(data.id || 0),
        fecha_pago: String(data.payment_date ?? ''),
        monto: Number(data.net_pay || 0),
        periodo: String(data.pay_period || detalles.periodo_pago || 'Periodo no especificado'),
        estado: String(detalles.status || 'Pagado'),
        detalles,
        employeeId: Number(employeeData?.id || 0),
        quickbooksId: String(employeeData?.quickbooks_id ?? ''),
        User: {
          id: Number(userData?.id || 0),
          nombre: nombreEmpleado,
          email: username,
        },
        empleadoNombre: nombreEmpleado,
        empleadoEmail: username,
      }
    })

    return res.json(payload)
  } catch {
    return res.status(500).json({ msg: 'Error al consultar recibos de nómina.' })
  }
}

export const deleteEmployeePaymentRecords = async (req: Request, res: Response) => {
  try {
    const employeeId = Number(req.params.employeeId)

    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return res.status(400).json({ msg: 'employeeId inválido.' })
    }

    const employee = await Employee.findByPk(employeeId)

    if (!employee) {
      return res.status(404).json({ msg: 'Empleado no encontrado.' })
    }

    const deletedCount = await PaymentRecord.destroy({
      where: { employee_id: employeeId },
    })

    return res.json({
      msg: 'Registros eliminados correctamente.',
      deletedCount,
      employee: {
        id: employeeId,
        quickbooks_id: String(employee.getDataValue('quickbooks_id') ?? ''),
        nombre: `${String(employee.getDataValue('first_name') ?? '').trim()} ${String(
          employee.getDataValue('last_name') ?? '',
        ).trim()}`.trim(),
      },
    })
  } catch {
    return res.status(500).json({ msg: 'No fue posible eliminar los registros del empleado.' })
  }
}
