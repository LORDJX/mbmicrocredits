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
        // Esperar a que se cargue el contenido antes de imprimir
        setTimeout(() => {
          window.print()
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

  if (loading || !loan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando...</p>
      </div>
    )
  }

  const installmentAmount = loan.amount / loan.installments
  const frequencyMap: Record<string, string> = {
    monthly: "Mensual",
    biweekly: "Quincenal",
    weekly: "Semanal",
  }

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
            size: A4;
            margin: 2cm;
          }
        }
      `}</style>

      <div id="print-content" className="max-w-4xl mx-auto p-8 bg-white">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
          <h1 className="text-3xl font-bold text-gray-800">SISTEMA DE PRÉSTAMOS</h1>
          <p className="text-sm text-gray-600 mt-2">Documento de Crédito Otorgado</p>
        </div>

        {/* Título */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">RESUMEN DE CRÉDITO OTORGADO</h2>
          <p className="text-sm text-gray-500 mt-2">Fecha de emisión: {new Date().toLocaleDateString("es-AR")}</p>
        </div>

        {/* Información del Préstamo */}
        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="border-l-4 border-blue-600 pl-4">
              <p className="text-sm text-gray-600 font-medium">Código del Préstamo</p>
              <p className="text-xl font-bold text-gray-800">{loan.loan_code}</p>
            </div>
            <div className="border-l-4 border-blue-600 pl-4">
              <p className="text-sm text-gray-600 font-medium">Cliente</p>
              <p className="text-xl font-bold text-gray-800">
                {loan.active_clients?.first_name} {loan.active_clients?.last_name}
              </p>
              {loan.active_clients?.dni && <p className="text-sm text-gray-600">DNI: {loan.active_clients.dni}</p>}
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Fecha de Inicio del Préstamo</p>
                <p className="text-lg font-semibold text-gray-800">
                  {new Date(loan.start_date).toLocaleDateString("es-AR")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Monto del Crédito</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(loan.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Cantidad de Cuotas</p>
                <p className="text-lg font-semibold text-gray-800">{loan.installments} cuotas</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Monto de Cada Cuota</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(installmentAmount)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600 font-medium mb-1">Frecuencia de Pago</p>
                <p className="text-lg font-semibold text-gray-800">{frequencyMap[loan.frequency] || "Mensual"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t-2 border-gray-300">
          <p className="text-xs text-gray-500 text-center">
            Este documento es un resumen del crédito otorgado. Para más información, contacte con nuestro equipo.
          </p>
        </div>
      </div>
    </>
  )
}
