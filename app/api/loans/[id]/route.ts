import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { data: loan, error } = await supabase
      .from("active_loans")
      .select(`
        *,
        active_clients!inner(first_name, last_name, client_code, phone, email)
      `)
      .eq("id", params.id)
      .is("deleted_at", null)
      .single()

    if (error) {
      console.error("Error fetching loan:", error)
      return NextResponse.json({ error: "Préstamo no encontrado" }, { status: 404 })
    }

    // Obtener cuotas del préstamo
    const { data: installments } = await supabase
      .from("installments")
      .select("*")
      .eq("loan_id", params.id)
      .order("installment_no", { ascending: true })

    return NextResponse.json({
      loan: {
        ...loan,
        installments: installments || [],
      },
    })
  } catch (error) {
    console.error("Error in GET /api/loans/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const body = await request.json()
    const { amount, installments, interest_rate, start_date, end_date, loan_type, status } = body

    // Actualizar préstamo
    const { data: updatedLoan, error } = await supabase
      .from("active_loans")
      .update({
        amount: amount ? Number.parseFloat(amount) : undefined,
        installments: installments ? Number.parseInt(installments) : undefined,
        interest_rate: interest_rate ? Number.parseFloat(interest_rate) : undefined,
        start_date,
        end_date,
        loan_type,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select(`
        *,
        active_clients!inner(first_name, last_name, client_code)
      `)
      .single()

    if (error) {
      console.error("Error updating loan:", error)
      return NextResponse.json({ error: "Error al actualizar préstamo" }, { status: 500 })
    }

    return NextResponse.json({ loan: updatedLoan })
  } catch (error) {
    console.error("Error in PATCH /api/loans/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const body = await request.json()
    const {
      amount,
      installments,
      interest_rate,
      start_date,
      end_date,
      loan_type,
      status,
      frequency,
      installment_amount,
    } = body

    // Construir objeto de actualización solo con campos definidos
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (amount !== undefined) updateData.amount = Number.parseFloat(amount)
    if (installments !== undefined) updateData.installments = Number.parseInt(installments)
    if (interest_rate !== undefined) updateData.interest_rate = Number.parseFloat(interest_rate)
    if (start_date !== undefined) updateData.start_date = start_date
    if (end_date !== undefined) updateData.end_date = end_date
    if (loan_type !== undefined) updateData.loan_type = loan_type
    if (status !== undefined) updateData.status = status
    if (frequency !== undefined) updateData.frequency = frequency
    if (installment_amount !== undefined) updateData.installment_amount = Number.parseFloat(installment_amount)

    // Actualizar préstamo
    const { data: updatedLoan, error } = await supabase
      .from("loans")
      .update(updateData)
      .eq("id", params.id)
      .select(`
        *,
        clients!inner(first_name, last_name, client_code, phone, email)
      `)
      .single()

    if (error) {
      console.error("Error updating loan:", error)
      return NextResponse.json({ error: "Error al actualizar préstamo" }, { status: 500 })
    }

    return NextResponse.json({ loan: updatedLoan })
  } catch (error) {
    console.error("Error in PUT /api/loans/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Verificar si el préstamo tiene pagos realizados
    const { data: paidInstallments } = await supabase
      .from("installments")
      .select("id")
      .eq("loan_id", params.id)
      .gt("amount_paid", 0)

    if (paidInstallments && paidInstallments.length > 0) {
      return NextResponse.json(
        {
          error: "No se puede eliminar un préstamo con pagos realizados",
        },
        { status: 409 },
      )
    }

    // Soft delete - marcar como eliminado
    const { error } = await supabase
      .from("active_loans")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)

    if (error) {
      console.error("Error deleting loan:", error)
      return NextResponse.json({ error: "Error al eliminar préstamo" }, { status: 500 })
    }

    return NextResponse.json({ message: "Préstamo eliminado correctamente" })
  } catch (error) {
    console.error("Error in DELETE /api/loans/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
