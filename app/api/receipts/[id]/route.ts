import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient()
    const { id } = params
    const body = await request.json()

    const { receipt_date, payment_type, cash_amount, transfer_amount, total_amount, observations } = body

    const { data: updatedReceipt, error } = await supabase
      .from("receipts")
      .update({
        receipt_date,
        payment_type,
        cash_amount,
        transfer_amount,
        total_amount,
        observations,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating receipt:", error)
      return NextResponse.json({ error: "Error updating receipt: " + error.message }, { status: 500 })
    }

    return NextResponse.json(updatedReceipt)
  } catch (error) {
    console.error("Error updating receipt:", error)
    return NextResponse.json({ error: "Error updating receipt: " + (error as Error).message }, { status: 500 })
  }
}
