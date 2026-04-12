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
  role: 'admin' | 'empleado'
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
    role: 'admin' | 'empleado'
    employee?: string
    quickbooks_id?: string
    employee_id: number | null
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
