import bcrypt from 'bcrypt'
import { Request, Response } from 'express'
import { parse } from 'csv-parse/sync'
import { Op } from 'sequelize'
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

    const employeeRaw = getCellValueByAddress(worksheet, 'B8')
    const startDateRaw = getCellValueByAddress(worksheet, 'B11')
    const endDateRaw = getCellValueByAddress(worksheet, 'D11')
    const companyRaw = getCellValueByAddress(worksheet, 'B4') || getCellValueByAddress(worksheet, 'B1')
    const workedHoursRaw = getCellValueByAddress(worksheet, 'B18')
    const hourlyRateRaw = getCellValueByAddress(worksheet, 'C18')
    const totalPaidRaw = getCellValueByAddress(worksheet, 'B21')

    const employeeName =
      employeeRaw && normalizeText(employeeRaw) !== 'employee' ? employeeRaw : defaultEmployeeName
    const quickbooksId = employeeRaw ? employeeRaw : defaultEmployeeQuickbooksId

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
      quickbooksId,
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
    const quickbooksNoEncontrados = new Set<string>()

    await sequelize.transaction(async (transaction) => {
      for (const rawItem of items) {
        const item = normalizeNominaItem(rawItem)

        if (!item.quickbooksId || !item.nombre || !item.fecha) {
          throw new Error('Registro inválido: quickbooksId, nombre y fecha son obligatorios.')
        }

        const employee = await Employee.findOne({
          where: { quickbooks_id: item.quickbooksId },
          transaction,
        })

        if (!employee) {
          quickbooksNoEncontrados.add(item.quickbooksId)
          continue
        }

        const detalles = {
          ...(item.desglose ?? {}),
          status: 'Pagado',
          quickbooks_id: item.quickbooksId,
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
        quickbooksNoEncontrados.size > 0
          ? 'Nómina importada con observaciones'
          : 'Nómina importada exitosamente',
      resumen: {
        registrosProcesados: items.length,
        usuariosNuevos: 0,
        recibosCreados,
        recibosActualizados,
        registrosOmitidos: quickbooksNoEncontrados.size,
      },
      errores: Array.from(quickbooksNoEncontrados).map((qbId) => {
        return `El empleado con quickbooksId "${qbId}" no existe en la base de datos.`
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
    const limit = 4

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
