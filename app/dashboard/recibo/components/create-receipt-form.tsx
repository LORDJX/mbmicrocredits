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
        .from("installments_with_calculated_status")
        .select("*")
        .eq("client_id", clientId)
        .in("calculated_status", ["pendiente", "con_mora"])
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
                  <div
                    className={`text-sm ${
                      installment.calculated_status === "con_mora" ? "text-red-600" : "text-muted-foreground"
                    }`}
                  >
                    {installment.calculated_status === "con_mora" ? "Con Mora" : "Pendiente"}
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
