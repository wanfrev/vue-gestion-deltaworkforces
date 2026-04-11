export interface ReciboDetalles {
  company?: string
  employee?: string
  period?: string
  earnings?: Array<{
    description?: string
    quantity?: number
    rate?: number
    total?: number
  }>
  total_paid?: number
  status?: string
  horas_regulares?: number
  pago_hora?: number
  deducciones?: number
  bonos?: number
  periodo_pago?: string
  cargo?: string
  [key: string]: unknown
}

export interface ReciboEmpleado {
  id?: number
  nombre?: string
  email?: string
}

export interface Recibo {
  id: number
  fecha_pago: string
  monto: number
  periodo: string
  employeeId?: number
  quickbooksId?: string
  estado?: string
  detalles: ReciboDetalles
  User?: ReciboEmpleado
  empleadoNombre?: string
  empleadoEmail?: string
}
