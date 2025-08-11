export type Frequency = "Semanal" | "Quincenal" | "Mensual"

export function addDays(baseISO: string, days: number): string {
  const d = new Date(baseISO)
  d.setDate(d.getDate() + days)
  // Formato dd/mm/aaaa para impresión
  return d.toLocaleDateString()
}

export function getFrequencyDays(freq: Frequency): number {
  if (freq === "Semanal") return 7
  if (freq === "Quincenal") return 15
  return 30
}

export function openPrintWindowForLoan(opts: {
  logoSrc: string
  companyName: string
  loanCode: string
  clientLabel: string
  amountToReturn: number
  installments: number
  startDateISO: string
  frequency: Frequency
}) {
  const { logoSrc, companyName, loanCode, clientLabel, amountToReturn, installments, startDateISO, frequency } = opts

  const perInstallment = installments > 0 ? amountToReturn / installments : 0
  const days = getFrequencyDays(frequency)
  const rows = Array.from({ length: installments }).map((_, i) => {
    const date = addDays(startDateISO, days * i)
    return { n: i + 1, date, amount: perInstallment }
  })

  const html = `
<!doctype html>
<html>
<head>
  <meta charSet="utf-8" />
  <title>Comprobante Préstamo ${loanCode}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji'; color: #111827; }
    .header { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
    .brand { font-size: 14px; font-weight: 600; color:#111827; }
    .title { font-size: 20px; font-weight:700; margin-top:8px; margin-bottom:16px; color:#111827; }
    .meta { display:grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin-bottom: 16px; }
    .meta div { font-size: 12px; }
    .card { border:1px solid #E5E7EB; border-radius: 10px; padding: 12px; margin-bottom: 16px; background: #fff; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom:1px solid #E5E7EB; padding: 8px; font-size: 12px; text-align:left; }
    th { background:#F3F4F6; font-weight:600; }
    .muted { color:#6B7280; }
    .right { text-align:right; }
    .footer { margin-top: 16px; font-size: 11px; color:#6B7280; }
    .logo { width: 36px; height: 36px; border-radius:8px; object-fit:cover; }
    .sum { font-weight:600; }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoSrc}" alt="Logo" class="logo" />
    <div class="brand">${companyName}</div>
  </div>
  <div class="title">Comprobante de Préstamo</div>

  <div class="card">
    <div class="meta">
      <div><span class="muted">Código de Préstamo:</span> ${loanCode}</div>
      <div><span class="muted">Cliente:</span> ${clientLabel}</div>
      <div><span class="muted">Monto a devolver:</span> $${amountToReturn.toFixed(2)}</div>
      <div><span class="muted">Cantidad de cuotas:</span> ${installments}</div>
      <div><span class="muted">Frecuencia:</span> ${frequency}</div>
      <div><span class="muted">Inicio:</span> ${new Date(startDateISO).toLocaleDateString()}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Fecha</th>
          <th class="right">Monto de cuota</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (r) => `
            <tr>
              <td>${r.n}</td>
              <td>${r.date}</td>
              <td class="right">$${r.amount.toFixed(2)}</td>
            </tr>`,
          )
          .join("")}
      </tbody>
      <tfoot>
        <tr>
          <td></td>
          <td class="right sum">Total</td>
          <td class="right sum">$${amountToReturn.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>

    <div class="footer">Generado por ${companyName}. Este comprobante está listo para imprimir o guardar como PDF.</div>
  </div>
  <script>
    window.onload = () => window.print();
  </script>
</body>
</html>
  `.trim()

  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=700")
  if (!w) return
  w.document.open()
  w.document.write(html)
  w.document.close()
}
