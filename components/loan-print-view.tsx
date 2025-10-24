"use client"

import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/utils"

interface LoanPrintViewProps {
  loanId: string
  onClose: () => void
}

export function LoanPrintView({ loanId, onClose }: LoanPrintViewProps) {
  const [loan, setLoan] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLoanData()
  }, [loanId])

  const fetchLoanData = async () => {
    try {
      const response = await fetch(`/api/loans/${loanId}`)
      if (response.ok) {
        const data = await response.json()
        setLoan(data.loan)
        setTimeout(() => {
          generateAndPrint(data.loan)
          onClose()
        }, 500)
      }
    } catch (error) {
      console.error("Error fetching loan:", error)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const generateAndPrint = (loanData: any) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const installmentAmount = Number(loanData.amount_to_repay) / loanData.installments
    const frequencyMap: Record<string, string> = {
      monthly: "Mensual",
      biweekly: "Quincenal",
      weekly: "Semanal",
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Resumen de Crédito - ${loanData.loan_code}</title>
          <style>
            @page { margin: 2cm; }
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6;
              color: #333;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #333; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .header h1 { 
              margin: 0; 
              color: #333; 
              font-size: 28px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .info-section { 
              margin-bottom: 30px; 
            }
            .info-section h2 {
              color: #444;
              border-bottom: 1px solid #ddd;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .info-row { 
              display: flex; 
              justify-content: space-between; 
              padding: 10px 0; 
              border-bottom: 1px solid #eee; 
            }
            .label { 
              font-weight: bold; 
              color: #666; 
            }
            .value { 
              color: #333; 
              font-weight: 600;
            }
            .highlight {
              background-color: #f0f9ff;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .footer { 
              margin-top: 50px; 
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center; 
              font-size: 12px; 
              color: #999; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RESUMEN DE CRÉDITO OTORGADO</h1>
            <p>Código: ${loanData.loan_code}</p>
            <p>Fecha de emisión: ${new Date().toLocaleDateString("es-AR")}</p>
          </div>
          
          <div class="info-section">
            <h2>Datos del Cliente</h2>
            <div class="info-row">
              <span class="label">Nombre:</span>
              <span class="value">${loanData.clients?.first_name || ""} ${loanData.clients?.last_name || ""}</span>
            </div>
            <div class="info-row">
              <span class="label">Código Cliente:</span>
              <span class="value">${loanData.clients?.client_code || "N/A"}</span>
            </div>
            ${
              loanData.clients?.phone
                ? `
            <div class="info-row">
              <span class="label">Teléfono:</span>
              <span class="value">${loanData.clients.phone}</span>
            </div>
            `
                : ""
            }
          </div>

          <div class="info-section">
            <h2>Detalles del Crédito</h2>
            <div class="info-row">
              <span class="label">Fecha de Inicio:</span>
              <span class="value">${new Date(loanData.start_date).toLocaleDateString("es-AR")}</span>
            </div>
            <div class="info-row">
              <span class="label">Monto del Crédito:</span>
              <span class="value">${formatCurrency(loanData.amount)}</span>
            </div>
            <div class="info-row">
              <span class="label">Tasa de Interés:</span>
              <span class="value">${loanData.interest_rate}%</span>
            </div>
            <div class="info-row">
              <span class="label">Cantidad de Cuotas:</span>
              <span class="value">${loanData.installments} cuotas</span>
            </div>
            <div class="info-row">
              <span class="label">Monto por Cuota:</span>
              <span class="value">${formatCurrency(installmentAmount)}</span>
            </div>
            <div class="info-row">
              <span class="label">Frecuencia:</span>
              <span class="value">${frequencyMap[loanData.frequency] || "Mensual"}</span>
            </div>
          </div>

          <div class="highlight">
            <div class="info-row" style="border: none;">
              <span class="label" style="font-size: 18px;">TOTAL A DEVOLVER:</span>
              <span class="value" style="font-size: 24px; color: #2563eb;">${formatCurrency(loanData.amount_to_repay)}</span>
            </div>
          </div>

          <div class="footer">
            <p>Documento generado automáticamente - ${new Date().toLocaleDateString("es-AR")} ${new Date().toLocaleTimeString("es-AR")}</p>
            <p>Este documento es un resumen del crédito otorgado y no incluye información de pagos realizados.</p>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  if (loading || !loan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando...</p>
      </div>
    )
  }

  return null
}
