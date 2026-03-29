import http from './http'
import type { Recibo } from '../types/payroll'

export interface NominaImportItemPayload {
  email: string
  nombre: string
  fecha: string
  totalNeto: number
  periodo?: string
  desglose?: Record<string, unknown>
}

interface ImportNominaResponse {
  msg: string
  resumen: {
    registrosProcesados: number
    usuariosNuevos: number
    recibosCreados: number
    recibosActualizados: number
  }
}

export const importarNominaAdmin = async (payload: {
  nominaData?: NominaImportItemPayload[]
  csv?: string
  rawText?: string
}) => {
  const { data } = await http.post<ImportNominaResponse>('/admin/importar-nomina', payload)
  return data
}

export const getRecibosAdmin = async (search = '', limit = 40) => {
  const { data } = await http.get<Recibo[]>('/admin/recibos', {
    params: {
      search: search.trim() || undefined,
      limit,
    },
  })

  return data
}
