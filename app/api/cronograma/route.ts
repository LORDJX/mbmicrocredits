export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface InstallmentData {
  id: string
  loan_code: string
  client_name: string
  client_code: string
  installment_no: number
  installments_total: number
  due_date: string
  amount_due: number
  amount_paid: number
  balance_due: number
  original_status: string
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener todas las cuotas con sus relaciones
    const { data: installments, error } = await supabase
      .from("installments")
      .select(
        `
        id, 
        loan_id, 
        installment_no, 
        installments_total, 
        due_date, 
        amount_due, 
        amount_paid, 
        paid_at, 
        status,
        loans!inner(
          loan_code, 
          clients!inner(
            first_name, 
            last_name, 
            client_code
          )
        )
      `,
      )
      .order("due_date", { ascending: true })

    if (error) {
      console.error("Error fetching installments:", error)
      return NextResponse.json({ error: "Error al obtener cuotas", details: error.message }, { status: 500 })
    }

    const pendingInstallments = (installments || []).filter((inst: Record<string, unknown>) => {
      const amountPaid = Number(inst.amount_paid) || 0
      const amountDue = Number(inst.amount_due) || 0
      return amountPaid < amountDue
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayInstallments: InstallmentData[] = []
    const overdueInstallments: InstallmentData[] = []
    const upcomingInstallments: InstallmentData[] = []

    let totalVenceHoy = 0
    let totalVencidas = 0
    let totalDueMonth = 0

    // Procesar cada cuota
    pendingInstallments.forEach((inst: Record<string, unknown>) => {
      const dueDate = new Date(inst.due_date as string)
      dueDate.setHours(0, 0, 0, 0)

      const amountPaid = Number(inst.amount_paid) || 0
      const amountDue = Number(inst.amount_due) || 0
      const balanceDue = amountDue - amountPaid

      let calculatedStatus = (inst.status as string) || "A_PAGAR"

      if (amountPaid >= amountDue) {
        if (inst.paid_at) {
          const paidDate = new Date(inst.paid_at as string)
          calculatedStatus = paidDate <= dueDate ? "PAGADA_A_TERMINO" : "PAGADA_VENCIDA"
        }
        return
      } else if (amountPaid > 0) {
        calculatedStatus = dueDate < today ? "PAGO_PARCIAL_VENCIDA" : "PAGO_PARCIAL_A_TERMINO"
      } else {
        if (dueDate < today) {
          calculatedStatus = "VENCIDA"
        } else if (dueDate.getTime() === today.getTime()) {
          calculatedStatus = "VENCE_HOY"
        } else {
          calculatedStatus = "A_PAGAR"
        }
      }

      const loans = inst.loans as Record<string, unknown>
      const clients = loans?.clients as Record<string, unknown>

      const installmentData: InstallmentData = {
        id: inst.id as string,
        loan_code: (loans?.loan_code as string) || "N/A",
        client_name: `${clients?.first_name || ""} ${clients?.last_name || ""}`.trim(),
        client_code: (clients?.client_code as string) || "N/A",
        installment_no: inst.installment_no as number,
        installments_total: inst.installments_total as number,
        due_date: inst.due_date as string,
        amount_due: amountDue,
        amount_paid: amountPaid,
        balance_due: balanceDue,
        original_status: calculatedStatus,
      }

      if (calculatedStatus === "VENCE_HOY") {
        todayInstallments.push(installmentData)
        totalVenceHoy += balanceDue
      } else if (calculatedStatus === "VENCIDA" || calculatedStatus === "PAGO_PARCIAL_VENCIDA") {
        overdueInstallments.push(installmentData)
        totalVencidas += balanceDue
      } else {
        upcomingInstallments.push(installmentData)
      }

      if (dueDate.getMonth() === today.getMonth() && dueDate.getFullYear() === today.getFullYear()) {
        totalDueMonth += balanceDue
      }
    })

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const { data: paymentsThisMonth } = await supabase
      .from("installments")
      .select("amount_paid")
      .gte("paid_at", firstDayOfMonth.toISOString())
      .not("paid_at", "is", null)

    const totalReceivedMonth = (paymentsThisMonth || []).reduce(
      (sum: number, p: Record<string, unknown>) => sum + (Number(p.amount_paid) || 0),
      0,
    )

    return NextResponse.json({
      success: true,
      today: todayInstallments,
      overdue: overdueInstallments,
      pending: upcomingInstallments,
      summary: {
        total_vence_hoy: totalVenceHoy,
        total_vencidas: totalVencidas,
        total_due_month: totalDueMonth,
        total_received_month: totalReceivedMonth,
      },
    })
  } catch (error) {
    console.error("Error in GET /api/cronograma:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
