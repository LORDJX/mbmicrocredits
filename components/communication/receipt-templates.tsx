// app/components/communication/receipt-templates.tsx

"use client"

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '$0.00';
    return amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
};

interface ReceiptData {
  receipt_number: string
  receipt_date: string
  client_name: string
  client_code: string
  client_phone?: string
  payment_type: string
  cash_amount: number
  transfer_amount: number
  total_amount: number
  observations?: string
  imputations?: Array<{
    installment_no: number
    loan_code: string
    due_date: string
    imputed_amount: number
  }>
}

export function generateReceiptHTML(receipt: ReceiptData): string {
  return `<div style="max-width: 600px; margin: 0 auto; font-family: sans-serif;">
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #ddd; padding-bottom: 10px;">
        <h1 style="color: #333; margin-bottom: 5px;">RECIBO DE PAGO</h1>
        <p style="font-size: 18px; font-weight: bold;">N° ${receipt.receipt_number}</p>
    </div>
    <div style="padding: 15px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 15px;">
        <h3 style="margin-top: 0; color: #333; font-size: 16px;">Datos del Cliente</h3>
        <p><strong>Nombre:</strong> ${receipt.client_name}</p>
        <p><strong>Código:</strong> ${receipt.client_code}</p>
        ${receipt.client_phone ? `<p><strong>Teléfono:</strong> ${receipt.client_phone}</p>` : ""}
    </div>
    <div style="padding: 15px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 15px;">
        <h3 style="margin-top: 0; color: #333; font-size: 16px;">Detalles del Pago</h3>
        <p><strong>Tipo:</strong> ${
          receipt.payment_type === "cash" ? "Efectivo" : receipt.payment_type === "transfer" ? "Transferencia" : "Mixto"
        }</p>
        ${receipt.cash_amount > 0 ? `<p><strong>Efectivo:</strong> ${formatCurrency(receipt.cash_amount)}</p>` : ""}
        ${receipt.transfer_amount > 0 ? `<p><strong>Transferencia:</strong> ${formatCurrency(receipt.transfer_amount)}</p>` : ""}
        <p style="font-size: 20px; font-weight: bold; color: #10b981; border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px;">
          <strong>TOTAL: ${formatCurrency(receipt.total_amount)}</strong>
        </p>
    </div>
    ${
      receipt.imputations && receipt.imputations.length > 0
        ? `
    <div style="margin-bottom: 15px;">
        <h3 style="color: #333; font-size: 16px;">Cuotas Pagadas</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
                <tr style="background: #f3f4f6;">
                    <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Préstamo</th>
                    <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Cuota</th>
                    <th style="border: 1px solid #ddd; padding: 6px; text-align: right;">Monto Apl.</th>
                </tr>
            </thead>
            <tbody>
                ${receipt.imputations
                  .map(
                    (imp) => `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="border: 1px solid #ddd; padding: 6px;">${imp.loan_code}</td>
                    <td style="border: 1px solid #ddd; padding: 6px;">${imp.installment_no} (${new Date(imp.due_date).toLocaleDateString("es-ES")})</td>
                    <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${formatCurrency(imp.imputed_amount)}</td>
                </tr>
                `,
                  )
                  .join("")}
            </tbody>
        </table>
    </div>
    `
        : ""
    }
    ${
      receipt.observations
        ? `
    <div style="padding: 15px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 15px;">
        <h3 style="margin-top: 0; color: #333; font-size: 16px;">Observaciones</h3>
        <p style="font-size: 14px;">${receipt.observations}</p>
    </div>
    `
        : ""
    }
</div>
`;
}

export function generateReceiptWhatsAppMessage(receipt: ReceiptData): string {
  const paymentTypeText =
    receipt.payment_type === "cash" ? "Efectivo" : receipt.payment_type === "transfer" ? "Transferencia" : "Mixto"

  let message = `🧾 *RECIBO DE PAGO*\n\n`
  message += `📋 *Recibo N°:* ${receipt.receipt_number}\n`
  message += `📅 *Fecha:* ${new Date(receipt.receipt_date).toLocaleDateString("es-ES")}\n\n`
  message += `👤 *Cliente:* ${receipt.client_name}\n`
  message += `💰 *TOTAL PAGADO:* ${formatCurrency(receipt.total_amount)}\n`
  message += `*Tipo de Pago:* ${paymentTypeText}\n\n`

  if (receipt.cash_amount > 0) {
    message += `💵 *Efectivo:* ${formatCurrency(receipt.cash_amount)}\n`
  }
  if (receipt.transfer_amount > 0) {
    message += `🏦 *Transferencia:* ${formatCurrency(receipt.transfer_amount)}\n`
  }

  if (receipt.imputations && receipt.imputations.length > 0) {
    message += `\n📊 *Cuotas Aplicadas:*\n`
    receipt.imputations.forEach((imp) => {
      message += `• ${imp.loan_code} - C${imp.installment_no}: ${formatCurrency(imp.imputed_amount)}\n`
    })
    message += `\n`
  }

  if (receipt.observations) {
    message += `📝 *Observaciones:* ${receipt.observations}\n\n`
  }

  message += `Gracias por su pago! 🙏\n`
  message += `_MB Microcréditos_`

  return encodeURIComponent(message)
}
