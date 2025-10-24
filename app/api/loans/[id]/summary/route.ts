import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient() // ✅ AGREGADO await
    
    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const loanId = params.id

    // Obtener préstamo
    const { data: loan, error: loanError } = await supabase
      .from("loans")
      .select("*, clients(*)")
      .eq("id", loanId)
      .single()

    if (loanError || !loan) {
      return NextResponse.json({ error: "Préstamo no encontrado" }, { status: 404 })
    }

    // Obtener cuotas con estado
    const { data: installments, error: installmentsError } = await supabase
      .from("installments_with_status")
      .select("*")
      .eq("loan_id", loanId)
      .order("installment_no", { ascending: true })

    if (installmentsError) {
      console.error("Error fetching installments:", installmentsError)
      return NextResponse.json({ error: "Error al obtener cuotas" }, { status: 500 })
    }

    // Calcular totales
    const totalDue = installments?.reduce((sum, inst) => sum + Number(inst.amount_due || 0), 0) || 0
    const totalPaid = installments?.reduce((sum, inst) => sum + Number(inst.amount_paid || 0), 0) || 0
    const balance = totalDue - totalPaid
    const hasOverdue = installments?.some((i) => i.status === "VENCIDA") || false
    const nextInstallments = installments?.filter((i) => !i.paid_at).slice(0, 3) || []

    return NextResponse.json({
      loan,
      summary: {
        total_due: totalDue,
        total_paid: totalPaid,
        balance,
        has_overdue: hasOverdue,
        next_installments: nextInstallments,
        installments_count: installments?.length || 0,
        paid_count: installments?.filter((i) => i.paid_at).length || 0,
      },
    })
  } catch (error) {
    console.error("Error in summary:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
