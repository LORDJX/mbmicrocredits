'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Printer, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { getClientUpcomingInstallments, getClientOverdueInstallments } from '@/lib/actions/receipt-actions'

interface FullReceiptData {
  id: string
  receipt_date: string
  total_amount: number
  cash_amount: number
  transfer_amount: number
  payment_type: string
  receipt_number: string
  observations: string | null
  client_id: string
  clients: {
    first_name: string
    last_name: string
    client_code: string
    phone: string
  }
}

const formatCurrency = (amount: number) => {
  return amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
}

const buildReceiptHTML = (data: any, upcoming: any[], overdue: any[] = []) => {
  const dateStr = new Date(data.receipt_date).toLocaleDateString()
  const nowStr = new Date().toLocaleDateString()
  const timeStr = new Date().toLocaleTimeString()
  const cashStr = formatCurrency(data.cash_amount)
  const transferStr = formatCurrency(data.transfer_amount)
  const totalStr = formatCurrency(data.total_amount)
  const typeStr = data.payment_type === 'total' ? 'TOTAL' : 'PARCIAL'

  let overdueRows = ''
  if (overdue.length > 0) {
    overdueRows = '<div class="overdue-section"><div class="overdue-title">CUOTAS VENCIDAS</div>'
    overdue.forEach((inst: any, idx: number) => {
      const dueStr = new Date(inst.due_date).toLocaleDateString()
      const amountStr = formatCurrency(inst.balance_due)
      const code = inst.loans?.loan_code || 'N/A'
      overdueRows += '<div class="overdue-row"><div class="overdue-item"><span>' + (idx + 1) + '.</span> ' + code + ' - Cuota ' + inst.installment_no + '</div><div class="overdue-details"><div>' + dueStr + '</div><div>' + amountStr + '</div></div></div>'
    })
    overdueRows += '</div>'
  }

  let upcomingRows = ''
  if (upcoming.length > 0) {
    upcomingRows = '<div class="upcoming-section"><div class="upcoming-title">PROXIMOS VENCIMIENTOS</div>'
    upcoming.forEach((inst: any, idx: number) => {
      const dueStr = new Date(inst.due_date).toLocaleDateString()
      const amountStr = formatCurrency(inst.balance_due)
      const code = inst.loans?.loan_code || 'N/A'
      upcomingRows += '<div class="upcoming-row"><div class="upcoming-item"><span>' + (idx + 1) + '.</span> ' + code + ' - Cuota ' + inst.installment_no + '</div><div class="upcoming-details"><div>' + dueStr + '</div><div>' + amountStr + '</div></div></div>'
    })
    upcomingRows += '</div>'
  }

  const obsRows = data.observations ? '<div class="observations"><div class="obs-label">OBSERVACIONES</div><div>' + data.observations + '</div></div>' : ''

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>* { margin: 0; padding: 0; } body { font-family: Courier New, monospace; background: white; } .receipt { width: 310px; padding: 16px; margin: 10px auto; } .header { text-align: center; border-bottom: 2px dashed black; padding-bottom: 10px; margin-bottom: 12px; } .company { font-size: 16px; font-weight: bold; margin-bottom: 2px; } .subtitle { font-size: 11px; color: #666; margin-bottom: 8px; } .title { font-size: 13px; font-weight: bold; } .number { font-size: 14px; font-weight: bold; } .separator { border-bottom: 1px dotted #999; margin: 10px 0; } .row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; } .label { font-weight: bold; } .section { background: #f9f9f9; padding: 10px; border: 1px solid #ddd; margin: 10px 0; } .detail { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; } .total { display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 14px; font-weight: bold; } .total-value { color: #008000; font-size: 16px; } .badge { display: inline-block; background: #007bff; color: white; padding: 3px 8px; font-size: 11px; } .observations { background: #fffef0; border-left: 3px solid gold; padding: 8px; margin: 10px 0; font-size: 11px; } .obs-label { font-weight: bold; margin-bottom: 3px; } .overdue-section { background: #ffcccc; border: 1px solid #cc0000; padding: 8px; margin: 10px 0; font-size: 11px; } .overdue-title { font-weight: bold; font-size: 12px; margin-bottom: 6px; text-align: center; color: #cc0000; } .overdue-row { display: flex; justify-content: space-between; margin-bottom: 4px; padding: 4px; border-bottom: 1px dotted #cc6666; } .overdue-item { flex: 1; font-size: 10px; color: #660000; font-weight: bold; } .overdue-details { text-align: right; font-size: 10px; color: #660000; } .upcoming-section { background: #f0f8ff; border: 1px solid #87ceeb; padding: 8px; margin: 10px 0; font-size: 11px; } .upcoming-title { font-weight: bold; font-size: 12px; margin-bottom: 6px; text-align: center; color: #003366; } .upcoming-row { display: flex; justify-content: space-between; margin-bottom: 4px; padding: 4px; border-bottom: 1px dotted #ccc; } .upcoming-item { flex: 1; font-size: 10px; } .upcoming-details { text-align: right; font-size: 10px; } .footer { text-align: center; border-top: 2px dashed black; padding-top: 10px; margin-top: 12px; } .thanks { font-weight: bold; font-size: 12px; margin-bottom: 6px; color: #008000; } .footer-text { color: #666; font-size: 10px; margin-bottom: 3px; } .time { color: #999; font-size: 9px; margin-top: 6px; padding-top: 6px; border-top: 1px dotted #ccc; }</style></head><body><div class="receipt"><div class="header"><div class="company">BM MICROCREDITOS</div><div class="subtitle">Gestion de Pagos</div><div class="title">RECIBO DE PAGO</div><div class="number">Rbo - ' + data.receipt_number + '</div></div><div class="separator"></div><div class="row"><div class="label">FECHA</div><div>' + dateStr + '</div></div><div class="row"><div class="label">CLIENTE</div><div>' + data.client_name + '</div></div><div class="separator"></div><div class="section"><div class="detail"><div>Efectivo</div><div>' + cashStr + '</div></div><div class="detail"><div>Transferencia</div><div>' + transferStr + '</div></div><div class="total"><div>TOTAL</div><div class="total-value">' + totalStr + '</div></div></div><div class="row"><div class="label">TIPO</div><div><span class="badge">' + typeStr + '</span></div></div><div class="separator"></div>' + obsRows + overdueRows + upcomingRows + '<div class="footer"><div class="thanks">GRACIAS POR SU PAGO</div><div class="footer-text">Su comprobante ha sido registrado</div><div class="footer-text">en nuestros sistemas</div><div class="time">' + nowStr + ' - ' + timeStr + '</div></div></div></body></html>'
}

const generateReceiptWhatsAppMessage = (data: any) => {
  return encodeURIComponent(
    '*Recibo N° ' + data.receipt_number + '*\nCliente: ' + data.client_name + '\nTotal Pagado: ' + formatCurrency(data.total_amount) + '\nDetalle: Efectivo ' + formatCurrency(data.cash_amount) + ', Transferencia ' + formatCurrency(data.transfer_amount) + '.\nGracias por su pago.',
  )
}

export function ReceiptActions({ receipt }: { receipt: FullReceiptData }) {
  const [isPrinting, setIsPrinting] = useState(false)

  const receiptData = {
    receipt_number: receipt.receipt_number,
    receipt_date: receipt.receipt_date,
    client_name: receipt.clients?.first_name + ' ' + receipt.clients?.last_name,
    client_code: receipt.clients?.client_code || '',
    client_phone: receipt.clients?.phone || '',
    cash_amount: Number(receipt.cash_amount || 0),
    transfer_amount: Number(receipt.transfer_amount || 0),
    total_amount: Number(receipt.total_amount || 0),
    payment_type: receipt.payment_type,
    observations: receipt.observations,
  }

  const whatsappMessage = generateReceiptWhatsAppMessage(receiptData)

  const handleWhatsApp = () => {
    if (receiptData.client_phone) {
      window.open('https://wa.me/' + receiptData.client_phone + '?text=' + whatsappMessage, '_blank')
    } else {
      alert('Telefono del cliente no disponible para WhatsApp.')
    }
  }

  const handlePrint = async () => {
    try {
      setIsPrinting(true)
      const { installments: upcoming } = await getClientUpcomingInstallments(receipt.client_id, 3)
      const { installments: overdue } = await getClientOverdueInstallments(receipt.client_id)
      
      const html = buildReceiptHTML(receiptData, upcoming, overdue)

      const printWindow = window.open('', '', 'height=600,width=800')
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        setTimeout(() => {
          printWindow.print()
          setIsPrinting(false)
        }, 250)
      }
    } catch (error) {
      console.error('Error printing:', error)
      alert('Error al preparar la impresion')
      setIsPrinting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPrinting}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleWhatsApp}>
          <MessageCircle className="h-4 w-4 mr-2" />
          Compartir WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint} disabled={isPrinting}>
          <Printer className="h-4 w-4 mr-2" />
          {isPrinting ? 'Cargando...' : 'Imprimir'}
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive">Anular recibo</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
