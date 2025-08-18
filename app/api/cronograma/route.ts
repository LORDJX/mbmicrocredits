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
          client_id: loan.client_id,
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

    const todayStr = today.toISOString().split("T")[0]
    const { data: todayReceipts, error: receiptsError } = await supabase
      .from("receipts")
      .select(`
        id,
        total_amount,
        receipt_date,
        payment_type,
        observations,
        selected_loans,
        client_id,
        clients!inner(
          id,
          first_name,
          last_name,
          phone
        )
      `)
      .eq("receipt_date", todayStr)
      .order("created_at", { ascending: false })

    if (receiptsError) {
      console.error("Error fetching today receipts:", receiptsError)
    }

    const paidInstallmentIds = new Set()
    todayReceipts?.forEach((receipt) => {
      if (receipt.selected_loans) {
        receipt.selected_loans.forEach((loan: any) => {
          if (loan.loan_code && loan.installment_number) {
            paidInstallmentIds.add(`${loan.loan_code}-${loan.installment_number}`)
          }
        })
      }
    })

    // Filtrar cuotas por categorías excluyendo las pagadas
    const todayInstallments = allInstallments.filter(
      (inst) => inst.due_date === todayStr && !paidInstallmentIds.has(`${inst.loan_code}-${inst.installment_number}`),
    )
    const overdueInstallments = allInstallments.filter(
      (inst) => inst.status === "overdue" && !paidInstallmentIds.has(`${inst.loan_code}-${inst.installment_number}`),
    )
    const monthInstallments = allInstallments.filter((inst) => {
      const dueDate = new Date(inst.due_date)
      return (
        dueDate >= startOfMonth &&
        dueDate <= endOfMonth &&
        !paidInstallmentIds.has(`${inst.loan_code}-${inst.installment_number}`)
      )
    })

    // Obtener recibos para calcular montos cobrados
    const { data: receipts, error: allReceiptsError } = await supabase
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
      todayReceipts: todayReceipts || [], // Agregar recibos del día
      summary,
    })
  } catch (error) {
    console.error("Error in cronograma API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
