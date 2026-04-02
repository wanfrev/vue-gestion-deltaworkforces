import bcrypt from 'bcrypt'
import { Request, Response } from 'express'
import { parse } from 'csv-parse/sync'
import { Op } from 'sequelize'
import XLSX from 'xlsx'
import { Recibo, User, sequelize } from '../models'
import { ROLES } from '../constants/roles'

interface NominaImportItem {
  email: string
  nombre: string
  fecha: string
  totalNeto: number
  periodo?: string
  desglose?: Record<string, unknown>
}

interface RawNominaRecord {
  [key: string]: unknown
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

const buildFallbackEmail = (name: string): string => {
  const localPart = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')

  return `${localPart || 'empleado'}.temp@delta.local`
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

const parseExcelNomina = (
  excelBase64: string,
  options?: {
    defaultEmployeeName?: string
    defaultEmployeeEmail?: string
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
  const defaultEmployeeEmail = (options?.defaultEmployeeEmail || '').trim().toLowerCase()

  const items: NominaImportItem[] = []

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName]

    if (!worksheet) {
      return
    }

    const employeeRaw = getCellValueByAddress(worksheet, 'B8')
    const startDateRaw = getCellValueByAddress(worksheet, 'B11')
    const endDateRaw = getCellValueByAddress(worksheet, 'D11')
    const companyRaw = getCellValueByAddress(worksheet, 'B4') || getCellValueByAddress(worksheet, 'B1')
    const workedHoursRaw = getCellValueByAddress(worksheet, 'B18')
    const hourlyRateRaw = getCellValueByAddress(worksheet, 'C18')
    const totalPaidRaw = getCellValueByAddress(worksheet, 'B21')

    const employeeName =
      employeeRaw && normalizeText(employeeRaw) !== 'employee' ? employeeRaw : defaultEmployeeName

    const startDate = formatDateToISO(startDateRaw)
    const endDate = formatDateToISO(endDateRaw)
    const fechaPago = endDate || startDate

    if (!fechaPago) {
      return
    }

    const workedHours = parseNumber(workedHoursRaw)
    const hourlyRate = parseNumber(hourlyRateRaw)
    const totalPaid = parseNumber(totalPaidRaw)
    const earningTotal = workedHours * hourlyRate
    const periodDisplayStart = formatDateDisplay(startDateRaw)
    const periodDisplayEnd = formatDateDisplay(endDateRaw)
    const periodDisplay =
      periodDisplayStart && periodDisplayEnd
        ? `${periodDisplayStart} - ${periodDisplayEnd}`
        : periodDisplayEnd || periodDisplayStart || sheetName

    items.push({
      email: defaultEmployeeEmail || buildFallbackEmail(employeeName),
      nombre: employeeName,
      fecha: fechaPago,
      totalNeto: totalPaid,
      periodo: startDate && endDate ? `Del ${startDate} al ${endDate}` : sheetName,
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
    email: String(extractValue(record, ['email', 'correo', 'correo_electronico']) ?? ''),
    nombre: String(extractValue(record, ['nombre', 'empleado', 'name']) ?? ''),
    fecha: String(extractValue(record, ['fecha', 'fecha_pago', 'pay_date']) ?? ''),
    totalNeto: parseNumber(
      extractValue(record, ['total_neto', 'totalneto', 'monto', 'neto', 'net_pay']),
    ),
    periodo,
    desglose: rawDesglose,
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
  const email = String(item.email || '').trim().toLowerCase()
  const nombre = String(item.nombre || '').trim()
  const fecha = String(item.fecha || '').trim()

  return {
    email,
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
  }
}

export const importarNomina = async (req: Request, res: Response) => {
  try {
    const { nominaData, csv, rawText, excelBase64, excelFileName, defaultEmployeeName, defaultEmployeeEmail } = req.body as {
      nominaData?: NominaImportItem[]
      csv?: string
      rawText?: string
      excelBase64?: string
      excelFileName?: string
      defaultEmployeeName?: string
      defaultEmployeeEmail?: string
    }

    let items: NominaImportItem[] = []

    if (Array.isArray(nominaData)) {
      items = nominaData
    } else if (typeof excelBase64 === 'string' && excelBase64.trim()) {
      items = parseExcelNomina(excelBase64, {
        defaultEmployeeName,
        defaultEmployeeEmail,
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

    const tempPassword = process.env.TEMP_PASSWORD ?? 'password_temporal'
    const passwordHash = await bcrypt.hash(tempPassword, 10)

    let usuariosNuevos = 0
    let recibosCreados = 0
    let recibosActualizados = 0

    await sequelize.transaction(async (transaction) => {
      for (const rawItem of items) {
        const item = normalizeNominaItem(rawItem)

        if (!item.email || !item.nombre || !item.fecha) {
          throw new Error('Registro inválido: email, nombre y fecha son obligatorios.')
        }

        const [user, wasCreated] = await User.findOrCreate({
          where: { email: item.email },
          defaults: {
            nombre: item.nombre,
            password_hash: passwordHash,
            rol: 'empleado',
          },
          transaction,
        })

        if (wasCreated) {
          usuariosNuevos += 1
        } else if (item.nombre && user.getDataValue('nombre') !== item.nombre) {
          user.set('nombre', item.nombre)
          await user.save({ transaction })
        }

        const reciboExistente = await Recibo.findOne({
          where: {
            UserId: user.getDataValue('id'),
            fecha_pago: item.fecha,
            periodo: item.periodo,
          },
          transaction,
        })

        if (reciboExistente) {
          const detalles = {
            ...(item.desglose ?? {}),
            status: 'Pagado',
          }

          reciboExistente.set('monto', item.totalNeto)
          reciboExistente.set('detalles', detalles)
          await reciboExistente.save({ transaction })
          recibosActualizados += 1
        } else {
          const detalles = {
            ...(item.desglose ?? {}),
            status: 'Pagado',
          }

          await Recibo.create(
            {
              fecha_pago: item.fecha,
              monto: item.totalNeto,
              periodo: item.periodo,
              detalles,
              UserId: user.getDataValue('id'),
            },
            { transaction },
          )

          recibosCreados += 1
        }
      }
    })

    return res.json({
      msg: 'Nómina importada exitosamente',
      resumen: {
        registrosProcesados: items.length,
        usuariosNuevos,
        recibosCreados,
        recibosActualizados,
      },
    })
  } catch (error) {
    return res.status(500).json({
      msg: 'Error en la importación',
      error: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}

export const getRecibosAdmin = async (req: Request, res: Response) => {
  try {
    const search = String(req.query.search ?? '').trim()
    const requestedLimit = Number(req.query.limit)
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 40

    const userWhere = {
      rol: ROLES.EMPLEADO,
      ...(search
        ? {
            [Op.or]: [
              { nombre: { [Op.iLike]: `%${search}%` } },
              { email: { [Op.iLike]: `%${search}%` } },
            ],
          }
        : {}),
    }

    const includeUser = {
      model: User,
      attributes: ['id', 'nombre', 'email'],
      where: userWhere,
      required: true,
    }

    const recibos = await Recibo.findAll({
      include: [includeUser],
      order: [
        ['fecha_pago', 'DESC'],
        ['id', 'DESC'],
      ],
      limit,
    })

    const payload = recibos.map((recibo) => {
      const data = recibo.toJSON() as Record<string, unknown>
      const detalles = (data.detalles as Record<string, unknown> | undefined) ?? {}

      return {
        ...data,
        estado: String(detalles.status || 'Pagado'),
      }
    })

    return res.json(payload)
  } catch {
    return res.status(500).json({ msg: 'Error al consultar recibos de nómina.' })
  }
}
