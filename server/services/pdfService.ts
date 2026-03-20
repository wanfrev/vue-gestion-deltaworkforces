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

interface ReciboPDFData {
  User?: { nombre?: string }
  fecha_pago?: string
  periodo?: string
  monto?: number | string
  detalles?: Record<string, unknown>
  companyLogoBase64?: string
}

export const generarReciboPDF = async (datosRecibo: ReciboPDFData): Promise<Buffer> => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()

    const detalles = datosRecibo.detalles ?? {}
    const subtotalBase = Number(detalles.horas_regulares || 0) * Number(detalles.pago_hora || 0)
    const bonos = Number(detalles.bonos || 0)
    const deducciones = Number(detalles.deducciones || 0)
    const periodoPago = resolvePeriodoPago(datosRecibo)
    const companyLogo = logoSrc(datosRecibo.companyLogoBase64 || process.env.COMPANY_LOGO_BASE64)

    const logoBlock = companyLogo
      ? `<img src="${companyLogo}" alt="Logo" style="height: 48px; max-width: 180px; object-fit: contain;" />`
      : '<div style="font-size: 14px; color: #6b7280;">Tu Empresa</div>'

    const content = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 32px; color: #1f2937; background: #ffffff;">
          <header style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 14px; margin-bottom: 22px;">
            <div>
              <h1 style="margin: 0; font-size: 24px;">Recibo de Pago</h1>
              <p style="margin: 8px 0 0; color: #6b7280; font-size: 13px;">Comprobante oficial de nómina</p>
            </div>
            ${logoBlock}
          </header>

          <section style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; margin-bottom: 20px; font-size: 14px;">
            <p style="margin: 0;"><strong>Empleado:</strong> ${escapeHtml(datosRecibo?.User?.nombre)}</p>
            <p style="margin: 0;"><strong>Fecha de pago:</strong> ${escapeHtml(datosRecibo?.fecha_pago)}</p>
            <p style="margin: 0;"><strong>Periodo:</strong> ${escapeHtml(periodoPago)}</p>
            <p style="margin: 0;"><strong>Moneda:</strong> ${escapeHtml(process.env.COMPANY_CURRENCY || 'MXN')}</p>
          </section>

          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="text-align: left; padding: 10px; border: 1px solid #e5e7eb;">Concepto</th>
                <th style="text-align: right; padding: 10px; border: 1px solid #e5e7eb;">Monto</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">Pago base (${Number(detalles.horas_regulares || 0)} hrs × ${formatCurrency(detalles.pago_hora || 0)})</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(subtotalBase)}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">Bonos</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; color: #166534;">+ ${formatCurrency(bonos)}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">Deducciones</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; color: #991b1b;">- ${formatCurrency(deducciones)}</td>
              </tr>
              <tr style="background: #eff6ff; font-weight: bold;">
                <td style="padding: 10px; border: 1px solid #bfdbfe;">Total neto</td>
                <td style="padding: 10px; border: 1px solid #bfdbfe; text-align: right;">${formatCurrency(datosRecibo?.monto)}</td>
              </tr>
            </tbody>
          </table>

          <footer style="margin-top: 26px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 12px; color: #6b7280; text-align: center;">
            Documento generado automáticamente por el sistema de nómina.
          </footer>
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
