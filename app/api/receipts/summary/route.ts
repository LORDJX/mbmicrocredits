import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    // Get today's date in Argentina timezone
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" })
    const startOfMonth = today.substring(0, 8) + "01"

    // Get today's receipts
    const { data: todayReceipts, error: todayError } = await supabase
      .from("receipts")
      .select("total_amount")
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59`)

    if (todayError) {
      console.error("Error fetching today's receipts:", todayError)
    }

    // Get month's receipts
    const { data: monthReceipts, error: monthError } = await supabase
      .from("receipts")
      .select("total_amount")
      .gte("created_at", `${startOfMonth}T00:00:00`)

    if (monthError) {
      console.error("Error fetching month's receipts:", monthError)
    }

    // Get total receipts
    const { data: totalReceipts, error: totalError } = await supabase.from("receipts").select("total_amount")

    if (totalError) {
      console.error("Error fetching total receipts:", totalError)
    }

    const todayTotal = (todayReceipts || []).reduce((sum, r) => sum + r.total_amount, 0)
    const monthTotal = (monthReceipts || []).reduce((sum, r) => sum + r.total_amount, 0)
    const totalAmount = (totalReceipts || []).reduce((sum, r) => sum + r.total_amount, 0)

    return NextResponse.json(
      {
        today_total: todayTotal,
        today_count: (todayReceipts || []).length,
        month_total: monthTotal,
        month_count: (monthReceipts || []).length,
        total_amount: totalAmount,
        total_count: (totalReceipts || []).length,
      },
      { status: 200 },
    )
  } catch (e: any) {
    console.error("Unexpected error:", e)
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}
