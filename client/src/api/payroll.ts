import http from './http'
import type { Recibo } from '../types/payroll'

export const getMisRecibos = async (limit = 4) => {
  const { data } = await http.get<Recibo[]>('/mis-recibos', {
    params: {
      limit,
    },
  })
  return data
}

export const getReciboPdf = async (id: number) => {
  const { data } = await http.get<Blob>(`/mis-recibos/${id}/pdf`, {
    responseType: 'blob',
  })

  return data
}
