"use client"

import { useEffect, useState } from "react"
import { formatArgentineDate } from "@/lib/utils/date-utils"

interface LoanPrintViewProps {
  loan: any
  onClose: () => void
}

export function LoanPrintView({ loan, onClose }: LoanPrintViewProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Esperar a que se renderice antes de imprimir
    setTimeout(() => {
      window.print()
      onClose()
    }, 500)
  }, [])

  if (!mounted) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      monthly: "Mensual",
      biweekly: "Quincenal",
      weekly: "Semanal",
    }
    return labels[frequency] || "Mensual"
  }

  const installmentAmount = Number(loan.amount) / Number(loan.installments)

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-content, #print-content * {
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

      <div id="print-content" className="p-8 max-w-4xl mx-auto bg-white">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">CRÉDITO OTORGADO</h1>
          <p className="text-sm text-gray-600">Fecha de emisión: {formatArgentineDate(new Date().toISOString())}</p>
        </div>

        {/* Información del Préstamo */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Código del Préstamo</p>
              <p className="text-lg font-semibold">{loan.loan_code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Cliente</p>
              <p className="text-lg font-semibold">
                {loan.active_clients?.first_name} {loan.active_clients?.last_name}
              </p>
              {loan.active_clients?.dni && <p className="text-sm text-gray-600">DNI: {loan.active_clients.dni}</p>}
            </div>
          </div>

          <div className="border-t-2 border-gray-200 pt-6 mt-6">
            <h2 className="text-xl font-bold mb-4">Detalles del Crédito</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">Fecha de Inicio del Préstamo:</span>
                <span className="font-semibold">{formatArgentineDate(loan.start_date)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">Monto del Crédito:</span>
                <span className="font-semibold text-xl">{formatCurrency(Number(loan.amount))}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">Cantidad de Cuotas:</span>
                <span className="font-semibold">{loan.installments} cuotas</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">Monto de Cada Cuota:</span>
                <span className="font-semibold text-xl">{formatCurrency(installmentAmount)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">Frecuencia:</span>
                <span className="font-semibold">{getFrequencyLabel(loan.frequency || "monthly")}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center text-sm text-gray-600">
            <p>Este documento es un resumen del crédito otorgado.</p>
            <p>Para consultas, contacte con su asesor financiero.</p>
          </div>
        </div>
      </div>
    </>
  )
}
