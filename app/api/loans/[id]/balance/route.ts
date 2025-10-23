import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener todas las cuotas del préstamo
    const { data: installments, error } = await supabase
      .from("installments")
      .select("amount_due, amount_paid")
      .eq("loan_id", params.id)

    if (error) {
      console.error("[v0] Error fetching installments:", error)
      return NextResponse.json({ error: "Error al obtener cuotas" }, { status: 500 })
    }

    // Calcular saldo pendiente
    const totalDue = installments?.reduce((sum, inst) => sum + Number(inst.amount_due || 0), 0) || 0
    const totalPaid = installments?.reduce((sum, inst) => sum + Number(inst.amount_paid || 0), 0) || 0
    const balance = totalDue - totalPaid

    return NextResponse.json({
      totalDue,
      totalPaid,
      balance,
      installmentsCount: installments?.length || 0,
    })
  } catch (error) {
    console.error("[v0] Error in GET /api/loans/[id]/balance:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
