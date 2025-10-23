import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Obtener datos del préstamo
    const { data: loan, error: loanError } = await supabase.from("loans").select("*").eq("id", loanId).single()

    if (loanError || !loan) {
      return NextResponse.json({ error: "Préstamo no encontrado" }, { status: 404 })
    }

    // Verificar si ya existen cuotas
    const { data: existingInstallments } = await supabase
      .from("installments")
      .select("id")
      .eq("loan_id", loanId)
      .limit(1)

    if (existingInstallments && existingInstallments.length > 0) {
      return NextResponse.json({
        message: "El cronograma ya existe para este préstamo",
        loan_id: loanId,
      })
    }

    // Generar cuotas
    const installmentsTotal = loan.installments || loan.installments_total || 1
    const amountPerInstallment = (loan.amount_to_repay || loan.amount) / installmentsTotal
    const startDate = new Date(loan.start_date)

    const installmentsToCreate = []

    for (let i = 1; i <= installmentsTotal; i++) {
      const dueDate = new Date(startDate)
      dueDate.setMonth(dueDate.getMonth() + i)

      installmentsToCreate.push({
        loan_id: loanId,
        installment_no: i,
        installments_total: installmentsTotal,
        code: `${loan.loan_code}-C${i}`,
        due_date: dueDate.toISOString().split("T")[0],
        amount_due: amountPerInstallment,
        amount_paid: 0,
        paid_at: null,
      })
    }

    // Insertar cuotas
    const { data: createdInstallments, error: insertError } = await supabase
      .from("installments")
      .insert(installmentsToCreate)
      .select()

    if (insertError) {
      console.error("[v0] Error creating installments:", insertError)
      return NextResponse.json({ error: "Error al crear cronograma" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Cronograma generado exitosamente",
      loan_id: loanId,
      installments_created: createdInstallments.length,
    })
  } catch (error) {
    console.error("[v0] Error in generate-schedule:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
