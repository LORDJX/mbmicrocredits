import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    // Obtener el último número de recibo
    const { data, error } = await supabase
      .from("receipts")
      .select("receipt_number")
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Error fetching last receipt number:", error)
      return NextResponse.json({ receipt_number: "Rbo - 00000001" }, { status: 200 })
    }

    let nextNumber = 1

    if (data && data.length > 0) {
      const lastNumber = data[0].receipt_number
      // Extraer el número del formato "Rbo - 00000001"
      const match = lastNumber.match(/Rbo - (\d+)/)
      if (match) {
        nextNumber = Number.parseInt(match[1]) + 1
      }
    }

    // Formatear con ceros a la izquierda (8 dígitos)
    const formattedNumber = `Rbo - ${nextNumber.toString().padStart(8, "0")}`

    return NextResponse.json({ receipt_number: formattedNumber }, { status: 200 })
  } catch (e: any) {
    console.error("Unexpected error in GET /api/receipts/next-number:", e)
    return NextResponse.json({ receipt_number: "Rbo - 00000001" }, { status: 200 })
  }
}
