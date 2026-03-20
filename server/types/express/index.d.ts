declare global {
  namespace Express {
    interface UserPayload {
      id: number
      rol: string
    }

    interface Request {
      user?: UserPayload
    }
  }
}

export {}
