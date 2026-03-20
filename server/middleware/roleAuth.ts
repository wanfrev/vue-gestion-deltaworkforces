import { NextFunction, Request, Response } from 'express'

const roleAuth = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.rol !== role) {
      return res.status(403).json({ msg: 'No tienes permisos para esta acción' })
    }

    next()
  }
}

export default roleAuth
