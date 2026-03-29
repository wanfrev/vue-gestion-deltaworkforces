import bcrypt from 'bcrypt'
import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models'
import { ROLES, type Role } from '../constants/roles'

interface DevUserLogin {
  id: number
  nombre: string
  email: string
  password: string
  rol: Role
}

const DEV_LOCAL_USERS: DevUserLogin[] = [
  {
    id: 900001,
    nombre: 'Admin Delta',
    email: 'admin@delta.test',
    password: 'admin1234',
    rol: ROLES.ADMIN,
  },
  {
    id: 900002,
    nombre: 'Empleado Delta',
    email: 'empleado@delta.test',
    password: 'empleado1234',
    rol: ROLES.EMPLEADO,
  },
]

const allowDevLocalUsers = () => {
  return process.env.DEV_LOCAL_USERS === 'true' || process.env.NODE_ENV !== 'production'
}

const loginWithDevUser = (email: string, password: string) => {
  if (!allowDevLocalUsers()) {
    return null
  }

  const matchedUser = DEV_LOCAL_USERS.find((user) => {
    return user.email === email && user.password === password
  })

  if (!matchedUser) {
    return null
  }

  const token = jwt.sign(
    {
      id: matchedUser.id,
      rol: matchedUser.rol,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: '8h' },
  )

  return {
    token,
    user: {
      id: matchedUser.id,
      nombre: matchedUser.nombre,
      email: matchedUser.email,
      rol: matchedUser.rol,
    },
  }
}

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
      const devSession = loginWithDevUser(email, password)

      if (devSession) {
        return res.json(devSession)
      }

      return res.status(401).json({ msg: 'Credenciales inválidas.' })
    }

    const coincide = await bcrypt.compare(password, user.getDataValue('password_hash'))

    if (!coincide) {
      const devSession = loginWithDevUser(email, password)

      if (devSession) {
        return res.json(devSession)
      }

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
