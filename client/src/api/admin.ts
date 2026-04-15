import http from './http'
import type { Recibo } from '../types/payroll'

export interface NominaImportItemPayload {
  quickbooksId: string
  nombre: string
  fecha: string
  totalNeto: number
  periodo?: string
  desglose?: Record<string, unknown>
  checkNumber?: string
}

interface ImportNominaResponse {
  msg: string
  resumen: {
    registrosProcesados: number
    usuariosNuevos: number
    recibosCreados: number
    recibosActualizados: number
    registrosOmitidos?: number
  }
  usuariosAutoCreados?: Array<{
    nombre: string
    username: string
    passwordTemporal: string
    quickbooksId: string
  }>
  errores?: string[]
}

export interface CreateEmployeeByAdminPayload {
  username: string
  password: string
  role: 'superadmin' | 'admin' | 'empleado'
  quickbooks_id?: string
  first_name?: string
  last_name?: string
  position?: string
  base_salary?: number
}

interface CreateEmployeeByAdminResponse {
  message: string
  data: {
    username: string
    role: 'superadmin' | 'admin' | 'empleado'
    employee?: string
    quickbooks_id?: string
    employee_id: number | null
  }
}

export interface PrivilegedUser {
  id: number
  username: string
  role: 'superadmin' | 'admin'
  createdAt: string
  updatedAt: string
  canDelete: boolean
}

interface PrivilegedUsersResponse {
  data: PrivilegedUser[]
}

interface DeletePrivilegedUserResponse {
  msg: string
  user: {
    id: number
    username: string
    role: 'superadmin' | 'admin'
  }
}

interface DeleteEmployeeRecordsResponse {
  msg: string
  deletedCount: number
}

interface UpdateEmployeePasswordAdminResponse {
  msg: string
  employeeId: number
}

interface DeleteEmployeeAdminResponse {
  msg: string
  deletedRecords: number
  employee: {
    id: number
    nombre: string
  }
}

export const importarNominaAdmin = async (payload: {
  nominaData?: NominaImportItemPayload[]
  csv?: string
  rawText?: string
  excelBase64?: string
  excelFileName?: string
  defaultEmployeeName?: string
  defaultEmployeeQuickbooksId?: string
}) => {
  const { data } = await http.post<ImportNominaResponse>('/admin/importar-nomina', payload)
  return data
}

export const getRecibosAdmin = async (search = '', limit = 200) => {
  const { data } = await http.get<Recibo[]>('/admin/recibos', {
    params: {
      search: search.trim() || undefined,
      limit,
    },
  })

  return data
}

export const createEmployeeAdmin = async (payload: CreateEmployeeByAdminPayload) => {
  const { data } = await http.post<CreateEmployeeByAdminResponse>('/admin/empleados', payload)
  return data
}

export const deleteEmployeePaymentRecordsAdmin = async (employeeId: number) => {
  const { data } = await http.delete<DeleteEmployeeRecordsResponse>(`/admin/empleados/${employeeId}/recibos`)
  return data
}

export const updateEmployeePasswordAdmin = async (employeeId: number, password: string) => {
  const { data } = await http.patch<UpdateEmployeePasswordAdminResponse>(`/admin/empleados/${employeeId}/password`, {
    password,
  })

  return data
}

export const deleteEmployeeAdmin = async (employeeId: number) => {
  const { data } = await http.delete<DeleteEmployeeAdminResponse>(`/admin/empleados/${employeeId}`)
  return data
}

export const getPrivilegedUsersAdmin = async () => {
  const { data } = await http.get<PrivilegedUsersResponse>('/admin/privileged-users')
  return data.data
}

export const deletePrivilegedUserAdmin = async (userId: number) => {
  const { data } = await http.delete<DeletePrivilegedUserResponse>(`/admin/privileged-users/${userId}`)
  return data
}
