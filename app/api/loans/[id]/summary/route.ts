import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin()
    const loanId = params.id

    // Call the SQL function to get loan summary
    const { data, error } = await supabase.rpc("get_loan_summary", { p_loan_id: loanId })

    if (error) {
      return NextResponse.json({ detail: `Error obteniendo resumen: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}
