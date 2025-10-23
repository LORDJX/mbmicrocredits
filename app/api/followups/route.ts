import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { CreateFollowUpData } from "@/lib/types/followups"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("client_id")
    const status = searchParams.get("status")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    let query = supabase.from("v_follow_ups").select("*")

    // Apply filters
    if (clientId) {
      query = query.eq("client_id", clientId)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (startDate) {
      query = query.gte("date", startDate)
    }

    if (endDate) {
      query = query.lte("date", endDate)
    }

    const { data, error } = await query.order("date", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching follow-ups:", error)
      return NextResponse.json({ error: "Error al obtener seguimientos" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in GET /api/followups:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body: CreateFollowUpData = await request.json()

    // Validate required fields
    if (!body.client_id || !body.date) {
      return NextResponse.json({ error: "client_id y date son requeridos" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("follow_ups")
      .insert({
        client_id: body.client_id,
        date: body.date,
        reminder_date: body.reminder_date || null,
        notes: body.notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating follow-up:", error)
      return NextResponse.json({ error: "Error al crear seguimiento" }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in POST /api/followups:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
