import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { z } from "zod"

export const dynamic = "force-dynamic"

const CreatePaymentSchema = z.object({
  loan_id: z.string().uuid(),
  paid_amount: z.number().positive(),
  paid_at: z.string().datetime().optional(),
  note: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()

    const validatedData = CreatePaymentSchema.parse(body)

    // Call the SQL function to apply payment with imputation
    const { data, error } = await supabase.rpc("apply_payment", {
      p_loan_id: validatedData.loan_id,
      p_paid_amount: validatedData.paid_amount,
      p_paid_at: validatedData.paid_at || new Date().toISOString(),
      p_note: validatedData.note || null,
    })

    if (error) {
      return NextResponse.json({ detail: `Error procesando pago: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ detail: "Datos de entrada inválidos", errors: e.errors }, { status: 400 })
    }
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}
