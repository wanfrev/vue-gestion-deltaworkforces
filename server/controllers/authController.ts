import bcrypt from 'bcrypt'
import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models'

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ msg: 'Email y contraseña son obligatorios.' })
    }

    const user = await User.findOne({
      where: { email },
    })

    if (!user) {
      return res.status(401).json({ msg: 'Credenciales inválidas.' })
    }

    const coincide = await bcrypt.compare(password, user.getDataValue('password_hash'))

    if (!coincide) {
      return res.status(401).json({ msg: 'Credenciales inválidas.' })
    }

    const token = jwt.sign(
      {
        id: user.getDataValue('id'),
        rol: user.getDataValue('rol'),
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '8h' },
    )

    return res.json({
      token,
      user: {
        id: user.getDataValue('id'),
        nombre: user.getDataValue('nombre'),
        email: user.getDataValue('email'),
        rol: user.getDataValue('rol'),
      },
    })
  } catch {
    return res.status(500).json({ msg: 'Error interno al iniciar sesión.' })
  }
}
