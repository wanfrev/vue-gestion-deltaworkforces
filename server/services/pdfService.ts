import { promises as fs } from 'fs'
import path from 'path'
import puppeteer from 'puppeteer'

const escapeHtml = (value = ''): string => {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const formatCurrency = (value: unknown): string => {
  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: process.env.COMPANY_CURRENCY || 'MXN',
    minimumFractionDigits: 2,
  })

  return formatter.format(Number(value || 0))
}

const formatDate = (value?: string): string => {
  if (!value) return 'No especificado'

  const parsed = new Date(`${value}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const toNumberOrZero = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const resolvePeriodoPago = (data: ReciboPDFData): string => {
  const detalles = data.detalles ?? {}
  const detallePeriodo =
    (detalles.periodo_pago as string | undefined) ||
    (detalles.periodo as string | undefined) ||
    undefined

  if (detallePeriodo) return detallePeriodo
  if (data.periodo) return data.periodo

  const inicio = (detalles.periodo_inicio as string | undefined) ?? ''
  const fin = (detalles.periodo_fin as string | undefined) ?? ''

  if (inicio && fin) {
    return `Del ${inicio} al ${fin}`
  }

  return 'No especificado'
}

const logoSrc = (value?: string): string => {
  if (!value) return ''
  if (value.startsWith('data:image')) return value
  return `data:image/png;base64,${value}`
}

let cachedLocalLogo: string | null | undefined

const resolveCompanyLogo = async (value?: string): Promise<string> => {
  const directLogo = logoSrc(value || process.env.COMPANY_LOGO_BASE64)

  if (directLogo) {
    return directLogo
  }

  if (cachedLocalLogo !== undefined) {
    return cachedLocalLogo || ''
  }

  const candidates = [
    path.resolve(process.cwd(), '..', 'client', 'src', 'assets', 'logo.png'),
    path.resolve(__dirname, '..', '..', 'client', 'src', 'assets', 'logo.png'),
    path.resolve(__dirname, '..', '..', '..', 'client', 'src', 'assets', 'logo.png'),
  ]

  for (const filePath of candidates) {
    try {
      const logoBuffer = await fs.readFile(filePath)
      const extension = path.extname(filePath).toLowerCase()
      const mime = extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : 'image/png'
      cachedLocalLogo = `data:${mime};base64,${logoBuffer.toString('base64')}`
      return cachedLocalLogo
    } catch {
      // Continue trying other candidate paths.
    }
  }

  cachedLocalLogo = null
  return ''
}

interface ReciboPDFData {
  id?: number
  User?: { nombre?: string }
  fecha_pago?: string
  periodo?: string
  estado?: string
  monto?: number | string
  detalles?: Record<string, unknown>
  companyLogoBase64?: string
}

interface EarningRow {
  description: string
  quantity: number
  rate: number
  total: number
  ytd: number | null
}

const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const STANDARD_WEEKLY_HOURS = 40

const buildEarningsRows = (detalles: Record<string, unknown>): EarningRow[] => {
  const raw = detalles.earnings

  if (Array.isArray(raw) && raw.length) {
    return raw.map((item) => {
      const earning = item as Record<string, unknown>
      const quantity = toNumberOrZero(earning.quantity)
      const rate = toNumberOrZero(earning.rate)
      const total = toNumberOrZero(earning.total) || quantity * rate
      const ytd = toNumberOrNull(
        earning.ytd ||
          earning.year_to_date ||
          earning.acumulado_anual ||
          earning.ytd_total,
      )

      return {
        description: String(earning.description || 'Concepto'),
        quantity,
        rate,
        total,
        ytd,
      }
    })
  }

  const hoursWorked = toNumberOrZero(
    detalles.hours_worked || detalles.worked_hours || detalles.horas_regulares,
  )
  const baseRate = toNumberOrZero(detalles.pago_hora)
  const overtimeRate = toNumberOrZero(
    detalles.overtime_rate || detalles.pago_hora_extra || detalles.tarifa_extra_hora,
  )
  const overtimeHours = toNumberOrZero(
    detalles.overtime_hours || detalles.horas_extra || detalles.horas_overtime,
  )

  if (!hoursWorked && !baseRate) {
    return []
  }

  if (overtimeRate > 0 && (overtimeHours > 0 || hoursWorked > STANDARD_WEEKLY_HOURS)) {
    const resolvedOvertimeHours = overtimeHours > 0 ? overtimeHours : Math.max(hoursWorked - STANDARD_WEEKLY_HOURS, 0)
    const regularHours = overtimeHours > 0 ? Math.max(hoursWorked - resolvedOvertimeHours, 0) : Math.min(hoursWorked, STANDARD_WEEKLY_HOURS)

    if (resolvedOvertimeHours > 0) {
      return [
        {
          description: 'Regular Hours',
          quantity: regularHours,
          rate: baseRate,
          total: regularHours * baseRate,
          ytd: null,
        },
        {
          description: 'Overtime Hours',
          quantity: resolvedOvertimeHours,
          rate: overtimeRate,
          total: resolvedOvertimeHours * overtimeRate,
          ytd: null,
        },
      ]
    }
  }

  return [
    {
      description: 'Worked Hours',
      quantity: hoursWorked,
      rate: baseRate,
      total: hoursWorked * baseRate,
      ytd: null,
    },
  ]
}

const resolveEarningsRows = (detalles: Record<string, unknown>): EarningRow[] => {
  return buildEarningsRows(detalles)
}

const resolveStatusLabel = (status: unknown): string => {
  const normalized = String(status || '').trim().toLowerCase()

  if (!normalized || normalized === 'pagado') {
    return 'Pagado'
  }

  if (normalized.includes('proceso')) {
    return 'En proceso'
  }

  if (normalized.includes('error') || normalized.includes('revisar')) {
    return 'Revisar'
  }

  return String(status)
}

export const generarReciboPDF = async (datosRecibo: ReciboPDFData): Promise<Buffer> => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()

    const detalles = datosRecibo.detalles ?? {}
    const earningsRows = resolveEarningsRows(detalles)
    const ingresoBase = earningsRows.reduce((sum, row) => sum + row.total, 0)
    const bonos = toNumberOrZero(detalles.bonos)
    const deducciones = toNumberOrZero(detalles.deducciones)
    const totalIngresos = ingresoBase + bonos
    const totalNeto = toNumberOrZero(detalles.total_paid || datosRecibo?.monto)
    const ytdTotal =
      toNumberOrNull(detalles.ytd_total || detalles.year_to_date || detalles.acumulado_anual) ??
      earningsRows.map((row) => row.ytd).find((value) => value !== null) ??
      null
    const statusLabel = resolveStatusLabel(datosRecibo.estado || detalles.status || 'Pagado')
    const periodoPago = resolvePeriodoPago(datosRecibo)
    const companyName = String(detalles.company || detalles.company_name || 'Delta Workforces').trim()
    const empleado = String(datosRecibo?.User?.nombre || 'Empleado').trim() || 'Empleado'
    const puesto = String(detalles.cargo || 'No especificado').trim() || 'No especificado'
    const checkNumber = String(
      detalles.check_number || detalles.numero_cheque || detalles.cheque || detalles.checkNumber || '',
    ).trim()
    const paystubKey = String(detalles.paystub_key || detalles.paystubKey || '').trim()
    const paystubLabel = checkNumber || (paystubKey ? paystubKey.slice(-12).toUpperCase() : String(datosRecibo.id || 'N/A'))
    const showYtd = earningsRows.some((row) => row.ytd !== null)
    const companyLogo = await resolveCompanyLogo(datosRecibo.companyLogoBase64)

    const logoBlock = companyLogo
      ? `<img src="${companyLogo}" alt="Logo" style="height: 44px; max-width: 190px; object-fit: contain;" />`
      : '<div style="font-size: 13px; font-weight: 700; color: #1f2937;">Delta Workforces</div>'

    const earningsTableRows = earningsRows.length
      ? earningsRows
          .map((row) => {
            const descriptionCell = escapeHtml(row.description)
            const quantityCell = escapeHtml(row.quantity.toFixed(2))
            const rateCell = escapeHtml(formatCurrency(row.rate))
            const totalCell = escapeHtml(formatCurrency(row.total))
            const ytdCell = row.ytd === null ? 'N/A' : escapeHtml(formatCurrency(row.ytd))

            return `
              <tr>
                <td>${descriptionCell}</td>
                <td class="right">${quantityCell}</td>
                <td class="right">${rateCell}</td>
                <td class="right amount">${totalCell}</td>
                ${showYtd ? `<td class="right ytd">${ytdCell}</td>` : ''}
              </tr>
            `
          })
          .join('')
      : `
          <tr>
            <td colspan="${showYtd ? '5' : '4'}" class="empty-row">No hay conceptos disponibles</td>
          </tr>
        `

    const content = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            * { box-sizing: border-box; }

            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #0f172a;
              margin: 0;
              background: #f5f7fb;
              padding: 22px;
              font-size: 12px;
            }

            .sheet {
              background: #ffffff;
              border: 1px solid #dbe4f0;
              border-radius: 16px;
              overflow: hidden;
            }

            .header {
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              color: #f8fafc;
              padding: 22px 24px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 16px;
            }

            .header h1 {
              margin: 0;
              font-size: 21px;
              letter-spacing: 0.2px;
            }

            .header p {
              margin: 6px 0 0;
              color: #cbd5e1;
              font-size: 11px;
            }

            .badge {
              display: inline-flex;
              margin-top: 10px;
              padding: 5px 10px;
              border-radius: 999px;
              background: rgba(255, 255, 255, 0.12);
              border: 1px solid rgba(255, 255, 255, 0.2);
              font-weight: 700;
              font-size: 10px;
              letter-spacing: 0.4px;
              text-transform: uppercase;
            }

            .section {
              padding: 18px 24px;
            }

            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }

            .card {
              border: 1px solid #e2e8f0;
              background: #f8fafc;
              border-radius: 12px;
              padding: 12px 14px;
            }

            .card h3 {
              margin: 0 0 8px;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.45px;
              color: #475569;
            }

            .line {
              display: flex;
              justify-content: space-between;
              gap: 8px;
              margin: 4px 0;
            }

            .line .label {
              color: #64748b;
            }

            .line .value {
              font-weight: 600;
              color: #0f172a;
              text-align: right;
            }

            .table-wrap {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              overflow: hidden;
              background: #ffffff;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            th {
              background: #f1f5f9;
              color: #334155;
              text-transform: uppercase;
              letter-spacing: 0.35px;
              font-size: 10px;
              text-align: left;
              padding: 10px 11px;
              border-bottom: 1px solid #e2e8f0;
            }

            td {
              padding: 10px 11px;
              border-bottom: 1px solid #eef2f7;
              color: #1e293b;
              font-size: 11px;
            }

            tr:nth-child(even) td {
              background: #fcfdff;
            }

            .right {
              text-align: right;
            }

            .amount {
              font-weight: 700;
            }

            .ytd {
              color: #475569;
            }

            .empty-row {
              text-align: center;
              color: #64748b;
              padding: 14px 10px;
            }

            .summary {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-top: 14px;
            }

            .summary-card {
              border: 1px solid #dbe4f0;
              border-radius: 12px;
              padding: 12px 14px;
              background: #f8fafc;
            }

            .summary-card h4 {
              margin: 0 0 8px;
              font-size: 10px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.35px;
            }

            .summary-card .line {
              margin: 6px 0;
            }

            .net {
              background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
              border: 1px solid #86efac;
            }

            .net .value {
              color: #166534;
              font-size: 17px;
              font-weight: 800;
            }

            .footer {
              border-top: 1px solid #e2e8f0;
              padding: 12px 24px 16px;
              font-size: 10px;
              color: #64748b;
              display: flex;
              justify-content: space-between;
              gap: 12px;
            }
          </style>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 32px; color: #1f2937; background: #ffffff;">
          <main class="sheet">
            <header class="header">
              <div>
                <h1>Recibo de Pago</h1>
                <p>Comprobante oficial de nomina</p>
                <span class="badge">${escapeHtml(statusLabel)}</span>
              </div>
              <div>${logoBlock}</div>
            </header>

            <section class="section">
              <div class="grid">
                <article class="card">
                  <h3>Informacion del empleado</h3>
                  <div class="line"><span class="label">Nombre</span><span class="value">${escapeHtml(empleado)}</span></div>
                  <div class="line"><span class="label">Puesto</span><span class="value">${escapeHtml(puesto)}</span></div>
                  <div class="line"><span class="label">Recibo</span><span class="value">#${escapeHtml(String(datosRecibo.id || 'N/A'))}</span></div>
                  <div class="line"><span class="label">Paystub</span><span class="value">${escapeHtml(paystubLabel)}</span></div>
                </article>

                <article class="card">
                  <h3>Detalles de pago</h3>
                  <div class="line"><span class="label">Fecha de pago</span><span class="value">${escapeHtml(formatDate(datosRecibo.fecha_pago))}</span></div>
                  <div class="line"><span class="label">Periodo</span><span class="value">${escapeHtml(periodoPago)}</span></div>
                  <div class="line"><span class="label">Moneda</span><span class="value">${escapeHtml(process.env.COMPANY_CURRENCY || 'MXN')}</span></div>
                  <div class="line"><span class="label">Empresa</span><span class="value">${escapeHtml(companyName)}</span></div>
                </article>
              </div>
            </section>

            <section class="section" style="padding-top: 0;">
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Concepto</th>
                      <th class="right">Cantidad</th>
                      <th class="right">Tarifa</th>
                      <th class="right">Total</th>
                      ${showYtd ? '<th class="right">YTD</th>' : ''}
                    </tr>
                  </thead>
                  <tbody>
                    ${earningsTableRows}
                  </tbody>
                </table>
              </div>

              <div class="summary">
                <article class="summary-card">
                  <h4>Resumen financiero</h4>
                  <div class="line"><span class="label">Ingresos base</span><span class="value">${escapeHtml(formatCurrency(ingresoBase))}</span></div>
                  <div class="line"><span class="label">Bonos</span><span class="value">${escapeHtml(formatCurrency(bonos))}</span></div>
                  <div class="line"><span class="label">Ingresos brutos</span><span class="value">${escapeHtml(formatCurrency(totalIngresos))}</span></div>
                  <div class="line"><span class="label">Deducciones</span><span class="value">${escapeHtml(formatCurrency(deducciones))}</span></div>
                </article>

                <article class="summary-card net">
                  <h4>Total depositado</h4>
                  <div class="line"><span class="label">Total neto</span><span class="value">${escapeHtml(formatCurrency(totalNeto))}</span></div>
                  <div class="line"><span class="label">Cheque</span><span class="value">${escapeHtml(checkNumber || 'No especificado')}</span></div>
                  <div class="line"><span class="label">Acumulado anual</span><span class="value">${escapeHtml(ytdTotal === null ? 'N/A' : formatCurrency(ytdTotal))}</span></div>
                </article>
              </div>
            </section>

            <footer class="footer">
              <span>Documento generado automaticamente por Delta Workforces Payroll.</span>
              <span>Recibo #${escapeHtml(String(datosRecibo.id || 'N/A'))}</span>
            </footer>
          </main>
        </body>
      </html>
    `

    await page.setContent(content, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'A4', printBackground: true })

    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
