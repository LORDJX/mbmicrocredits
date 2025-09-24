"use client"

import { useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

const CreateReceiptForm = () => {
  const [installments, setInstallments] = useState([])
  const [loading, setLoading] = useState(false)
  const supabase = createBrowserClient()

  const loadInstallments = async (clientId: string) => {
    if (!clientId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("installments_with_status")
        .select("*")
        .eq("client_id", clientId)
        .in("status", ["con_mora", "a_pagar_hoy", "a_vencer"])
        .order("due_date", { ascending: true })

      if (error) {
        console.error("Error loading installments:", error)
        return
      }

      setInstallments(data || [])
    } catch (error) {
      console.error("Error loading installments:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "con_mora":
        return "Con Mora"
      case "a_pagar_hoy":
        return "A Pagar Hoy"
      case "a_vencer":
        return "A Vencer"
      case "pagadas":
        return "Pagada"
      case "pagadas_anticipadas":
        return "Pagada Anticipada"
      case "pagadas_con_mora":
        return "Pagada con Mora"
      default:
        return "Pendiente"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "con_mora":
        return "text-red-600"
      case "a_pagar_hoy":
        return "text-orange-600"
      case "a_vencer":
        return "text-blue-600"
      case "pagadas":
        return "text-green-600"
      case "pagadas_anticipadas":
        return "text-green-500"
      case "pagadas_con_mora":
        return "text-yellow-600"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      {/* Formulario existente */}

      {installments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Cuotas Pendientes</h3>
          <div className="grid gap-2">
            {installments.map((installment: any) => (
              <div key={installment.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">{installment.code}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    Vence: {new Date(installment.due_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-medium">${installment.amount_due?.toLocaleString()}</div>
                  <div className={`text-sm ${getStatusColor(installment.status)}`}>
                    {getStatusDisplay(installment.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default CreateReceiptForm
