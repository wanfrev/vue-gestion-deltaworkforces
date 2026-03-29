import { NextFunction, Request, Response } from 'express'
import { type Role } from '../constants/roles'

const roleAuth = (roles: Role | Role[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles]

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({ msg: 'No tienes permisos para esta acción' })
    }

    next()
  }
}

export default roleAuth
