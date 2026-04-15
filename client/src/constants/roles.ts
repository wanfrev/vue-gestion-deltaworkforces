export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  EMPLEADO: 'empleado',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const DEFAULT_HOME_BY_ROLE: Record<Role, string> = {
  [ROLES.SUPERADMIN]: '/admin',
  [ROLES.ADMIN]: '/admin',
  [ROLES.EMPLEADO]: '/dashboard',
}

export const isRole = (value: unknown): value is Role => {
  return value === ROLES.SUPERADMIN || value === ROLES.ADMIN || value === ROLES.EMPLEADO
}

export const isAdminPanelRole = (value?: string): value is typeof ROLES.ADMIN | typeof ROLES.SUPERADMIN => {
  return value === ROLES.ADMIN || value === ROLES.SUPERADMIN
}

export const resolveHomeByRole = (role?: string): string => {
  if (role && isRole(role)) {
    return DEFAULT_HOME_BY_ROLE[role]
  }

  return '/dashboard'
}
