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

    const loanId = params.id

    // Obtener cuotas con estado derivado
    const { data: installments, error: installmentsError } = await supabase
      .from("installments_with_status")
      .select("*")
      .eq("loan_id", loanId)
      .order("installment_no", { ascending: true })

    if (installmentsError) {
      console.error("[v0] Error fetching installments:", installmentsError)
      return NextResponse.json({ error: "Error al obtener cronograma" }, { status: 500 })
    }

    // Calcular totales y contadores
    const totalDue = installments.reduce((sum, inst) => sum + Number(inst.amount_due || 0), 0)
    const totalPaid = installments.reduce((sum, inst) => sum + Number(inst.amount_paid || 0), 0)
    const balance = totalDue - totalPaid

    const counters = {
      vencidas: installments.filter((i) => i.status === "VENCIDA").length,
      hoy: installments.filter((i) => i.status === "A_PAGAR_HOY").length,
      futuras: installments.filter((i) => i.status === "A_PAGAR").length,
      pagadas: installments.filter((i) => i.paid_at !== null).length,
      total: installments.length,
    }

    // Próximas 3 cuotas pendientes
    const nextInstallments = installments.filter((i) => !i.paid_at).slice(0, 3)

    return NextResponse.json({
      loan_id: loanId,
      installments,
      summary: {
        total_due: totalDue,
        total_paid: totalPaid,
        balance,
        counters,
        next_installments: nextInstallments,
      },
    })
  } catch (error) {
    console.error("[v0] Error in schedule:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
