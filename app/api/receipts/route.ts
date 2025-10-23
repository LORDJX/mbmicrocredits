import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface ImputationInput {
  installment_id: string
  imputed_amount: number
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const client_id = searchParams.get("client_id")
    const payment_type = searchParams.get("payment_type")

    let query = supabase
      .from("receipts")
      .select(`
        *,
        clients!inner(first_name, last_name, client_code, phone) 
      `)
      .order("created_at", { ascending: false })

    if (search) {
      query = query.or(
        `receipt_number.ilike.%${search}%,clients.first_name.ilike.%${search}%,clients.last_name.ilike.%${search}%`,
      )
    }

    if (client_id) {
      query = query.eq("client_id", client_id)
    }

    if (payment_type) {
      query = query.eq("payment_type", payment_type)
    }

    const { data: receipts, error } = await query

    if (error) {
      console.error("Error fetching receipts:", error)
      return NextResponse.json({ error: "Error al obtener recibos", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ receipts: receipts || [] })
  } catch (error) {
    console.error("Error in GET /api/receipts:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { client_id, receipt_date, payment_type, cash_amount, transfer_amount, observations, selected_installments } =
      body

    if (!client_id || !receipt_date || !payment_type) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const totalAmount = (Number(cash_amount) || 0) + (Number(transfer_amount) || 0)

    if (totalAmount <= 0) {
      return NextResponse.json({ error: "El monto total debe ser mayor a 0" }, { status: 400 })
    }

    if (!selected_installments || selected_installments.length === 0) {
      return NextResponse.json({ error: "Debe seleccionar al menos una cuota" }, { status: 400 })
    }

    const totalImputations = (selected_installments as ImputationInput[]).reduce(
      (sum: number, imp: ImputationInput) => sum + Number(imp.imputed_amount),
      0,
    )

    if (Math.abs(totalAmount - totalImputations) > 0.01) {
      return NextResponse.json(
        {
          error: "El monto total no coincide con las cuotas seleccionadas",
          expected: totalAmount,
          received: totalImputations,
        },
        { status: 400 },
      )
    }

    const { data: lastReceipt } = await supabase
      .from("receipts")
      .select("receipt_number")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    let receiptNumber = "REC-0001"
    if (lastReceipt?.receipt_number) {
      const lastNumber = Number.parseInt(lastReceipt.receipt_number.split("-")[1])
      receiptNumber = `REC-${String(lastNumber + 1).padStart(4, "0")}`
    }

    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        client_id,
        receipt_date,
        payment_type,
        cash_amount: Number(cash_amount) || 0,
        transfer_amount: Number(transfer_amount) || 0,
        total_amount: totalAmount,
        observations: observations || null,
        receipt_number: receiptNumber,
        selected_installments: selected_installments,
      })
      .select()
      .single()

    if (receiptError) {
      console.error("Error creating receipt:", receiptError)
      return NextResponse.json({ error: "Error al crear recibo", details: receiptError.message }, { status: 500 })
    }

    const imputationResults = []

    for (const imputation of selected_installments as ImputationInput[]) {
      const { installment_id, imputed_amount } = imputation

      if (!installment_id || !imputed_amount || imputed_amount <= 0) continue

      try {
        const { error: imputationError } = await supabase.from("payment_imputations").insert({
          receipt_id: receipt.id,
          installment_id: installment_id,
          imputed_amount: Number(imputed_amount),
        })

        if (imputationError) {
          console.error("Error creating imputation:", imputationError)
          continue
        }

        const { data: currentInstallment, error: fetchError } = await supabase
          .from("installments")
          .select("amount_paid, amount_due, due_date, paid_at")
          .eq("id", installment_id)
          .single()

        if (fetchError || !currentInstallment) {
          console.error("Error fetching installment:", fetchError)
          continue
        }

        const newAmountPaid = Number(currentInstallment.amount_paid || 0) + Number(imputed_amount)
        const amountDue = Number(currentInstallment.amount_due)

        const isPaid = newAmountPaid >= amountDue
        const paidAt = isPaid ? receipt_date : null

        const { error: updateError } = await supabase
          .from("installments")
          .update({
            amount_paid: newAmountPaid,
            paid_at: paidAt,
          })
          .eq("id", installment_id)

        if (updateError) {
          console.error("Error updating installment:", updateError)
          continue
        }

        imputationResults.push({
          installment_id,
          success: true,
          newAmountPaid,
          isPaid,
        })
      } catch (error) {
        console.error(`Error processing imputation for ${installment_id}:`, error)
      }
    }

    return NextResponse.json(
      {
        success: true,
        receipt: {
          ...receipt,
          receipt_number: receiptNumber,
        },
        imputations: imputationResults,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error in POST /api/receipts:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
