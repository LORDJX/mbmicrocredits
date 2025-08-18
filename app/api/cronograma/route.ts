import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function GET(request: NextRequest) {
  try {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Obtener préstamos activos con información del cliente
    const { data: loans, error: loansError } = await supabase
      .from("loans")
      .select(`
        id,
        loan_code,
        client_id,
        amount,
        installments,
        installment_amount,
        loan_type,
        start_date,
        status,
        clients!inner(
          id,
          first_name,
          last_name
        )
      `)
      .in("status", ["Activo", "En Mora"])

    if (loansError) {
      console.error("Error fetching loans:", loansError)
      return NextResponse.json({ error: "Error fetching loans" }, { status: 500 })
    }

    // Generar cronograma de cuotas
    const allInstallments: any[] = []

    loans?.forEach((loan) => {
      const startDate = new Date(loan.start_date)
      const intervalDays = loan.loan_type === "Semanal" ? 7 : loan.loan_type === "Quincenal" ? 15 : 30

      for (let i = 0; i < loan.installments; i++) {
        const dueDate = new Date(startDate)
        dueDate.setDate(startDate.getDate() + intervalDays * (i + 1))

        const installment = {
          id: `${loan.id}-${i + 1}`,
          client_name: `${loan.clients.first_name} ${loan.clients.last_name}`,
          loan_code: loan.loan_code,
          installment_number: i + 1,
          total_installments: loan.installments,
          amount: loan.installment_amount || loan.amount / loan.installments,
          due_date: dueDate.toISOString().split("T")[0],
          status: dueDate < today ? "overdue" : "pending",
        }

        allInstallments.push(installment)
      }
    })

    // Filtrar cuotas por categorías
    const todayStr = today.toISOString().split("T")[0]
    const todayInstallments = allInstallments.filter((inst) => inst.due_date === todayStr)
    const overdueInstallments = allInstallments.filter((inst) => inst.status === "overdue")
    const monthInstallments = allInstallments.filter((inst) => {
      const dueDate = new Date(inst.due_date)
      return dueDate >= startOfMonth && dueDate <= endOfMonth
    })

    // Obtener recibos para calcular montos cobrados
    const { data: receipts, error: receiptsError } = await supabase
      .from("receipts")
      .select("total_amount, receipt_date")
      .gte("receipt_date", startOfMonth.toISOString().split("T")[0])
      .lte("receipt_date", endOfMonth.toISOString().split("T")[0])

    const totalReceivedToday =
      receipts?.filter((r) => r.receipt_date === todayStr).reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0

    const totalReceivedMonth = receipts?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0

    // Calcular resumen
    const summary = {
      total_due_today: todayInstallments.reduce((sum, inst) => sum + inst.amount, 0),
      total_received_today: totalReceivedToday,
      total_overdue: overdueInstallments.reduce((sum, inst) => sum + inst.amount, 0),
      total_received_month: totalReceivedMonth,
      total_due_month: monthInstallments.reduce((sum, inst) => sum + inst.amount, 0),
    }

    return NextResponse.json({
      success: true,
      today: todayInstallments,
      overdue: overdueInstallments,
      month: monthInstallments,
      summary,
    })
  } catch (error) {
    console.error("Error in cronograma API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
