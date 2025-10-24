"use client"

import { useEffect, useState } from "react"
import { formatArgentinaDate } from "@/lib/utils/date-utils"

interface LoanPrintViewProps {
  loan: any
  onClose: () => void
}

export function LoanPrintView({ loan, onClose }: LoanPrintViewProps) {
  const [isPrinting, setIsPrinting] = useState(false)

  useEffect(() => {
    // Esperar a que el contenido se renderice antes de imprimir
    const timer = setTimeout(() => {
      setIsPrinting(true)
      window.print()
      // Cerrar después de imprimir
      setTimeout(() => {
        onClose()
      }, 100)
    }, 500)

    return () => clearTimeout(timer)
  }, [onClose])

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === "string" ? Number.parseFloat(amount) : amount
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(num)
  }

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      monthly: "Mensual",
      biweekly: "Quincenal",
      weekly: "Semanal",
    }
    return labels[frequency] || frequency
  }

  const installmentAmount = Number(loan.amount_to_repay) / Number(loan.installments)

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-content,
          #print-content * {
            visibility: visible;
          }
          #print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 2cm;
          }
        }
      `}</style>

      <div id="print-content" className="max-w-4xl mx-auto p-8 bg-white">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">MICROCRÉDITOS</h1>
          <h2 className="text-xl font-semibold text-gray-600">RESUMEN DE CRÉDITO OTORGADO</h2>
          <p className="text-sm text-gray-500 mt-2">
            Fecha de emisión: {formatArgentinaDate(new Date().toISOString())}
          </p>
        </div>

        {/* Contenido Principal */}
        <div className="space-y-6">
          {/* Información del Préstamo */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Datos del Crédito</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Código del Préstamo:</span>
                <div className="font-medium text-lg">{loan.loan_code}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Fecha de Inicio:</span>
                <div className="font-medium text-lg">{formatArgentinaDate(loan.start_date)}</div>
              </div>
            </div>
          </div>

          {/* Información del Cliente */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Datos del Cliente</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Nombre Completo:</span>
                <div className="font-medium text-lg">
                  {loan.active_clients.first_name} {loan.active_clients.last_name}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Código de Cliente:</span>
                <div className="font-medium text-lg">{loan.active_clients.client_code}</div>
              </div>
            </div>
          </div>

          {/* Detalles Financieros */}
          <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
            <h3 className="text-lg font-semibold mb-4 text-blue-800">Detalles del Crédito</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                <span className="text-gray-700 font-medium">Monto del Crédito:</span>
                <span className="text-2xl font-bold text-blue-600">{formatCurrency(loan.amount)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                <span className="text-gray-700 font-medium">Cantidad de Cuotas:</span>
                <span className="text-xl font-semibold">{loan.installments} cuotas</span>
              </div>
              <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                <span className="text-gray-700 font-medium">Monto de Cada Cuota:</span>
                <span className="text-xl font-semibold text-green-600">{formatCurrency(installmentAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Frecuencia de Pago:</span>
                <span className="text-xl font-semibold">{getFrequencyLabel(loan.frequency || "monthly")}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center text-sm text-gray-600">
            <p>Este documento es un resumen del crédito otorgado.</p>
            <p className="mt-2">Para consultas, contacte a su asesor de crédito.</p>
          </div>
        </div>
      </div>

      {!isPrinting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <p className="text-lg">Preparando impresión...</p>
          </div>
        </div>
      )}
    </>
  )
}
