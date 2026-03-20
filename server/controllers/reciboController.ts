import { Request, Response } from 'express'
import { Recibo, User } from '../models'
import { generarReciboPDF } from '../services/pdfService'

export const getMisUltimosRecibos = async (req: Request, res: Response) => {
  try {
    const recibos = await Recibo.findAll({
      where: { UserId: req.user?.id },
      order: [['fecha_pago', 'DESC']],
      limit: 4,
    })

    return res.json(recibos)
  } catch {
    return res.status(500).json({ msg: 'Error al obtener nóminas.' })
  }
}

export const getMiReciboPDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const recibo = await Recibo.findOne({
      where: {
        id,
        UserId: req.user?.id,
      },
      include: [
        {
          model: User,
          attributes: ['nombre', 'email'],
        },
      ],
    })

    if (!recibo) {
      return res.status(404).json({ msg: 'Recibo no encontrado.' })
    }

    const pdfBuffer = await generarReciboPDF(recibo.toJSON())

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=recibo-${id}.pdf`)

    return res.send(pdfBuffer)
  } catch {
    return res.status(500).json({ msg: 'Error al generar el PDF.' })
  }
}
