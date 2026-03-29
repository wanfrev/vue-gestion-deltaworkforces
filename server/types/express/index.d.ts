import type { Role } from '../../constants/roles'

declare global {
  namespace Express {
    interface UserPayload {
      id: number
      rol: Role
    }

    interface Request {
      user?: UserPayload
    }
  }
}

export {}
