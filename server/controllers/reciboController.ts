import { Request, Response } from 'express'
import { Employee, PaymentRecord, User } from '../models'
import { generarReciboPDF } from '../services/pdfService'

const buildEmployeeName = (employeeData?: Record<string, unknown>): string => {
  if (!employeeData) {
    return 'Empleado'
  }

  const firstName = String(employeeData.first_name ?? '').trim()
  const lastName = String(employeeData.last_name ?? '').trim()
  const fullName = `${firstName} ${lastName}`.trim()

  if (fullName) {
    return fullName
  }

  const userData = employeeData.User as Record<string, unknown> | undefined
  return String(userData?.username ?? 'Empleado')
}

const mapPaymentRecordToReciboPayload = (paymentRecordData: Record<string, unknown>) => {
  const employeeData = paymentRecordData.Employee as Record<string, unknown> | undefined
  const userData = employeeData?.User as Record<string, unknown> | undefined
  const detalles = (paymentRecordData.details as Record<string, unknown> | undefined) ?? {}
  const estado = String(detalles.status || 'Pagado')
  const nombreEmpleado = buildEmployeeName(employeeData)
  const username = String(userData?.username ?? '')

  return {
    id: Number(paymentRecordData.id || 0),
    fecha_pago: String(paymentRecordData.payment_date ?? ''),
    monto: Number(paymentRecordData.net_pay || 0),
    periodo: String(paymentRecordData.pay_period || detalles.periodo_pago || 'Periodo no especificado'),
    estado,
    detalles: {
      ...detalles,
      paystub_key: String(paymentRecordData.paystub_key || detalles.paystub_key || ''),
    },
    paystubKey: String(paymentRecordData.paystub_key || detalles.paystub_key || ''),
    User: {
      id: Number(userData?.id || 0),
      nombre: nombreEmpleado,
      email: username,
    },
    empleadoNombre: nombreEmpleado,
    empleadoEmail: username,
  }
}

export const getMisUltimosRecibos = async (req: Request, res: Response) => {
  try {
    const requestedLimit = Number(req.query.limit ?? 4)
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 200) : 4

    const paymentRecords = await PaymentRecord.findAll({
      include: [
        {
          model: Employee,
          required: true,
          where: { user_id: req.user?.id },
          include: [
            {
              model: User,
              attributes: ['id', 'username'],
              required: true,
            },
          ],
        },
      ],
      order: [
        ['payment_date', 'DESC'],
        ['id', 'DESC'],
      ],
      limit,
    })

    const payload = paymentRecords.map((paymentRecord) => {
      return mapPaymentRecordToReciboPayload(paymentRecord.toJSON() as Record<string, unknown>)
    })

    return res.json(payload)
  } catch {
    return res.status(500).json({ msg: 'Error al obtener nóminas.' })
  }
}

export const getMiReciboPDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const paymentRecord = await PaymentRecord.findOne({
      where: { id },
      include: [
        {
          model: Employee,
          required: true,
          where: { user_id: req.user?.id },
          include: [
            {
              model: User,
              attributes: ['id', 'username'],
              required: true,
            },
          ],
        },
      ],
    })

    if (!paymentRecord) {
      return res.status(404).json({ msg: 'Recibo no encontrado.' })
    }

    const mappedRecibo = mapPaymentRecordToReciboPayload(paymentRecord.toJSON() as Record<string, unknown>)

    const pdfBuffer = await generarReciboPDF({
      id: mappedRecibo.id,
      User: {
        nombre: mappedRecibo.User?.nombre,
      },
      fecha_pago: mappedRecibo.fecha_pago,
      periodo: mappedRecibo.periodo,
      estado: mappedRecibo.estado,
      monto: mappedRecibo.monto,
      detalles: mappedRecibo.detalles,
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=recibo-${id}.pdf`)

    return res.send(pdfBuffer)
  } catch {
    return res.status(500).json({ msg: 'Error al generar el PDF.' })
  }
}
