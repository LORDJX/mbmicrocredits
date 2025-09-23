import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const today = new Date().toISOString().split("T")[0]
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]

    // Total de recibos
    const { count: totalReceipts } = await supabase.from("receipts").select("*", { count: "exact", head: true })

    // Recaudación de hoy
    const { data: todayData } = await supabase.from("receipts").select("total_amount").eq("receipt_date", today)

    const todayCollection = todayData?.reduce((sum, r) => sum + r.total_amount, 0) || 0

    // Recaudación del mes
    const { data: monthData } = await supabase.from("receipts").select("total_amount").gte("receipt_date", startOfMonth)

    const monthCollection = monthData?.reduce((sum, r) => sum + r.total_amount, 0) || 0

    return NextResponse.json(
      {
        total_receipts: totalReceipts || 0,
        today_collection: todayCollection,
        month_collection: monthCollection,
      },
      { status: 200 },
    )
  } catch (e: any) {
    console.error("Unexpected error in GET /api/receipts/summary:", e)
    return NextResponse.json(
      {
        total_receipts: 0,
        today_collection: 0,
        month_collection: 0,
      },
      { status: 200 },
    )
  }
}
