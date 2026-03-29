export const ROLES = {
  ADMIN: 'admin',
  EMPLEADO: 'empleado',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const DEFAULT_HOME_BY_ROLE: Record<Role, string> = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.EMPLEADO]: '/dashboard',
}

export const isRole = (value: unknown): value is Role => {
  return value === ROLES.ADMIN || value === ROLES.EMPLEADO
}

export const resolveHomeByRole = (role?: string): string => {
  if (role && isRole(role)) {
    return DEFAULT_HOME_BY_ROLE[role]
  }

  return '/dashboard'
}
