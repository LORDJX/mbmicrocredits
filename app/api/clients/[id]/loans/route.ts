import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const clientId = params.id

    // Obtener todos los préstamos del cliente
    const { data: loans, error: loansError } = await supabase
      .from("loans")
      .select("*")
      .eq("client_id", clientId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (loansError) {
      console.error("[v0] Error fetching loans:", loansError)
      return NextResponse.json({ error: "Error al obtener préstamos" }, { status: 500 })
    }

    // Para cada préstamo, obtener el resumen de cuotas
    const loansWithStatus = await Promise.all(
      loans.map(async (loan) => {
        const { data: installments } = await supabase
          .from("installments_with_status")
          .select("*")
          .eq("loan_id", loan.id)

        if (!installments || installments.length === 0) {
          return {
            ...loan,
            status: "sin_cronograma",
            total_due: 0,
            total_paid: 0,
            balance: 0,
            has_pending: false,
          }
        }

        const totalDue = installments.reduce((sum, i) => sum + Number(i.amount_due || 0), 0)
        const totalPaid = installments.reduce((sum, i) => sum + Number(i.amount_paid || 0), 0)
        const balance = totalDue - totalPaid
        const hasPending = installments.some((i) => !i.paid_at)

        return {
          ...loan,
          status: hasPending ? "activo" : "completado",
          total_due: totalDue,
          total_paid: totalPaid,
          balance,
          has_pending: hasPending,
          installments_count: installments.length,
          paid_count: installments.filter((i) => i.paid_at).length,
          overdue_count: installments.filter((i) => i.status === "VENCIDA").length,
        }
      }),
    )

    // Clasificar préstamos
    const activeLoans = loansWithStatus.filter((l) => l.status === "activo")
    const completedLoans = loansWithStatus.filter((l) => l.status === "completado")

    return NextResponse.json({
      client_id: clientId,
      active_loans: activeLoans,
      completed_loans: completedLoans,
      summary: {
        total_loans: loans.length,
        active_count: activeLoans.length,
        completed_count: completedLoans.length,
        total_balance: activeLoans.reduce((sum, l) => sum + Number(l.balance || 0), 0),
      },
    })
  } catch (error) {
    console.error("[v0] Error in client loans:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
