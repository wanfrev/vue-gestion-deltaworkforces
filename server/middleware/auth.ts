import { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { isRole, type Role } from '../constants/roles'

const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ msg: 'Acceso denegado. No hay token.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string)

    if (typeof decoded === 'string') {
      return res.status(400).json({ msg: 'Token no válido.' })
    }

    const payload = decoded as JwtPayload & { id?: number; rol?: Role }

    if (!Number.isInteger(payload.id) || (payload.id as number) <= 0 || !isRole(payload.rol)) {
      return res.status(400).json({ msg: 'Token no válido.' })
    }

    req.user = { id: payload.id, rol: payload.rol }
    next()
  } catch {
    return res.status(400).json({ msg: 'Token no válido.' })
  }
}

export default auth
