import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin()
  } catch (e: any) {
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}
