export interface ReciboDetalles {
  horas_regulares: number
  pago_hora: number
  deducciones: number
  bonos: number
  periodo_pago: string
}

export interface Recibo {
  id: number
  fecha_pago: string
  monto: number
  periodo: string
  estado: string
  detalles: ReciboDetalles
}
