import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

type CreatePaymentBody = {
  loan_id: string
  paid_amount: number
  note?: string
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams

    const loanId = searchParams.get("loan_id")
    const clientId = searchParams.get("client_id")

    let query = supabase
      .from("payments")
      .select(`
        id,
        loan_id,
        paid_amount,
        paid_at,
        note,
        loans:loan_id (
          loan_code,
          client_id,
          clients:client_id (
            client_code,
            first_name,
            last_name
          )
        ),
        payment_imputations (
          id,
          imputed_amount,
          installments:installment_id (
            code,
            installment_no,
            due_date
          )
        )
      `)
      .order("paid_at", { ascending: false })

    if (loanId) {
      query = query.eq("loan_id", loanId)
    }

    if (clientId) {
      const { data: loanIds } = await supabase.from("loans").select("id").eq("client_id", clientId)

      if (loanIds && loanIds.length > 0) {
        query = query.in(
          "loan_id",
          loanIds.map((l) => l.id),
        )
      } else {
        return NextResponse.json([], { status: 200 })
      }
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ detail: `Error obteniendo pagos: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json(data || [], { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = (await request.json()) as CreatePaymentBody

    if (!body.loan_id || !body.paid_amount || body.paid_amount <= 0) {
      return NextResponse.json({ detail: "loan_id y paid_amount (mayor a 0) son requeridos" }, { status: 400 })
    }

    // Verificar que el préstamo existe
    const { data: loan, error: loanError } = await supabase
      .from("loans")
      .select("id, loan_code, status")
      .eq("id", body.loan_id)
      .single()

    if (loanError || !loan) {
      return NextResponse.json({ detail: "Préstamo no encontrado" }, { status: 404 })
    }

    // Procesar el pago usando la función SQL
    const { data: paymentId, error: processError } = await supabase.rpc("process_payment", {
      p_loan_id: body.loan_id,
      p_amount: body.paid_amount,
      p_note: body.note || null,
    })

    if (processError) {
      console.error("Error processing payment:", processError)
      return NextResponse.json({ detail: `Error procesando pago: ${processError.message}` }, { status: 500 })
    }

    // Obtener el pago creado con sus imputaciones
    const { data: payment, error: fetchError } = await supabase
      .from("payments")
      .select(`
        id,
        loan_id,
        paid_amount,
        paid_at,
        note,
        loans:loan_id (
          loan_code,
          client_id,
          clients:client_id (
            client_code,
            first_name,
            last_name
          )
        ),
        payment_imputations (
          id,
          imputed_amount,
          installments:installment_id (
            code,
            installment_no,
            due_date,
            amount_due,
            amount_paid
          )
        )
      `)
      .eq("id", paymentId)
      .single()

    if (fetchError) {
      console.error("Error fetching created payment:", fetchError)
      return NextResponse.json({ detail: `Error obteniendo pago creado: ${fetchError.message}` }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: `Pago de $${body.paid_amount} procesado exitosamente para el préstamo ${loan.loan_code}`,
        payment,
      },
      { status: 201 },
    )
  } catch (e: any) {
    console.error("Unexpected error in POST /api/payments:", e)
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}
