import bcrypt from 'bcrypt'
import { Request, Response } from 'express'
import { parse } from 'csv-parse/sync'
import { Recibo, User, sequelize } from '../models'

interface NominaImportItem {
  email: string
  nombre: string
  fecha: string
  totalNeto: number
  periodo?: string
  desglose?: Record<string, unknown>
}

const parseNumber = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
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

const parseCsvNomina = (csvRaw: string): NominaImportItem[] => {
  const records = parse(csvRaw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[]

  return records.map((record) => {
    const desglose = record.desglose
      ? parseJsonSafe(record.desglose)
      : {
          horas_regulares: parseNumber(record.horas_regulares),
          pago_hora: parseNumber(record.pago_hora),
          deducciones: parseNumber(record.deducciones),
          bonos: parseNumber(record.bonos),
          periodo_pago: buildPeriodo({
            periodo: record.periodo,
            periodo_inicio: record.periodo_inicio,
            periodo_fin: record.periodo_fin,
            periodo_pago: record.periodo_pago,
          }),
        }

    return {
      email: record.email,
      nombre: record.nombre,
      fecha: record.fecha ?? record.fecha_pago,
      totalNeto: parseNumber(record.totalNeto ?? record.total_neto ?? record.monto),
      periodo: buildPeriodo({
        periodo: record.periodo,
        periodo_inicio: record.periodo_inicio,
        periodo_fin: record.periodo_fin,
        periodo_pago: record.periodo_pago,
      }),
      desglose,
    }
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
    desglose: item.desglose ?? {},
  }
}

export const importarNomina = async (req: Request, res: Response) => {
  try {
    const { nominaData, csv } = req.body as {
      nominaData?: NominaImportItem[]
      csv?: string
    }

    let items: NominaImportItem[] = []

    if (Array.isArray(nominaData)) {
      items = nominaData
    } else if (typeof csv === 'string' && csv.trim()) {
      items = parseCsvNomina(csv)
    } else {
      return res.status(400).json({
        msg: 'Debes enviar nominaData (array JSON) o csv (string).',
      })
    }

    if (!items.length) {
      return res.status(400).json({ msg: 'No hay registros para importar.' })
    }

    const tempPassword = process.env.TEMP_PASSWORD ?? 'password_temporal'
    const passwordHash = await bcrypt.hash(tempPassword, 10)

    let usuariosNuevos = 0
    let recibosCreados = 0

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

        await Recibo.create(
          {
            fecha_pago: item.fecha,
            monto: item.totalNeto,
            periodo: item.periodo,
            detalles: item.desglose ?? {},
            UserId: user.getDataValue('id'),
          },
          { transaction },
        )

        recibosCreados += 1
      }
    })

    return res.json({
      msg: 'Nómina importada exitosamente',
      resumen: {
        registrosProcesados: items.length,
        usuariosNuevos,
        recibosCreados,
      },
    })
  } catch (error) {
    return res.status(500).json({
      msg: 'Error en la importación',
      error: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}
