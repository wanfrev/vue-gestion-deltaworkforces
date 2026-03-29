export const ROLES = {
  ADMIN: 'admin',
  EMPLEADO: 'empleado',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

const ALL_ROLES: Role[] = Object.values(ROLES)

export const isRole = (value: unknown): value is Role => {
  return typeof value === 'string' && ALL_ROLES.includes(value as Role)
}
