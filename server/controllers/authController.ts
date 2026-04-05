import bcrypt from 'bcrypt'
import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { Employee, User } from '../models'

export const login = async (req: Request, res: Response) => {
  try {
    const username = String(req.body?.username ?? '').trim()
    const password = String(req.body?.password ?? '')

    if (!username || !password) {
      return res.status(400).json({ msg: 'Usuario y contraseña son obligatorios.' })
    }

    const user = await User.findOne({
      where: { username },
      include: [
        {
          model: Employee,
          attributes: ['quickbooks_id', 'first_name', 'last_name'],
          required: false,
        },
      ],
    })

    if (!user) {
      return res.status(401).json({ msg: 'Credenciales inválidas.' })
    }

    const coincide = await bcrypt.compare(password, user.getDataValue('password_hash'))

    if (!coincide) {
      return res.status(401).json({ msg: 'Credenciales inválidas.' })
    }

    const role = user.getDataValue('role')

    const token = jwt.sign(
      {
        id: user.getDataValue('id'),
        rol: role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '8h' },
    )

    const employee = user.getDataValue('Employee') as
      | { first_name?: string; last_name?: string }
      | undefined
    const firstName = String(employee?.first_name ?? '').trim()
    const lastName = String(employee?.last_name ?? '').trim()
    const fullName = `${firstName} ${lastName}`.trim()

    return res.json({
      token,
      user: {
        id: user.getDataValue('id'),
        nombre: fullName || user.getDataValue('username'),
        username: user.getDataValue('username'),
        rol: role,
      },
    })
  } catch {
    return res.status(500).json({ msg: 'Error interno al iniciar sesión.' })
  }
}
