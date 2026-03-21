import type { Recibo } from './types/payroll'

export const recibosMock: Recibo[] = [
  {
    id: 1,
    fecha_pago: '2026-03-15',
    monto: 1250.0,
    periodo: 'Semana 11 - Marzo',
    estado: 'Pagado',
    detalles: {
      horas_regulares: 40,
      pago_hora: 25,
      deducciones: 150.0,
      bonos: 50.0,
      periodo_pago: 'Del 08 al 14 de Marzo',
    },
  },
  {
    id: 2,
    fecha_pago: '2026-03-08',
    monto: 1100.5,
    periodo: 'Semana 10 - Marzo',
    estado: 'Pagado',
    detalles: {
      horas_regulares: 38,
      pago_hora: 25,
      deducciones: 120.0,
      bonos: 30.5,
      periodo_pago: 'Del 01 al 07 de Marzo',
    },
  },
  {
    id: 3,
    fecha_pago: '2026-03-01',
    monto: 1325.75,
    periodo: 'Semana 9 - Marzo',
    estado: 'Pagado',
    detalles: {
      horas_regulares: 42,
      pago_hora: 25,
      deducciones: 140.25,
      bonos: 65.0,
      periodo_pago: 'Del 22 al 28 de Febrero',
    },
  },
  {
    id: 4,
    fecha_pago: '2026-02-22',
    monto: 1180.2,
    periodo: 'Semana 8 - Febrero',
    estado: 'En Procesamiento',
    detalles: {
      horas_regulares: 39,
      pago_hora: 25,
      deducciones: 110.8,
      bonos: 40.0,
      periodo_pago: 'Del 15 al 21 de Febrero',
    },
  },
]
