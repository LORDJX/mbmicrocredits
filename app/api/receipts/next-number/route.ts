import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase.rpc("get_next_receipt_number")

    if (error) {
      console.error("Error getting next receipt number:", error)
      return NextResponse.json({ detail: `Error: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ next_number: data }, { status: 200 })
  } catch (e: any) {
    console.error("Unexpected error:", e)
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}
