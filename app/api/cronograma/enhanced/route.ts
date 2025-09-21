import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Obtener parámetros de consulta
    const url = new URL(request.url)
    const date = url.searchParams.get("date") // Fecha específica (opcional)
    const status = url.searchParams.get("status") // Filtro por estado
    const clientId = url.searchParams.get("client_id") // Filtro por cliente

    console.log("[v0] Enhanced Cronograma API - Params:", { date, status, clientId })

    let query = supabase.from("installments_with_enhanced_status").select("*").order("due_date", { ascending: true })

    // Aplicar filtros
    if (date) {
      query = query.eq("due_date", date)
    }

    if (status) {
      query = query.eq("enhanced_status", status)
    }

    if (clientId) {
      query = query.eq("client_id", clientId)
    }

    const { data: installments, error } = await query

    if (error) {
      console.error("Error fetching enhanced installments:", error)
      return NextResponse.json({ error: "Error fetching installments" }, { status: 500 })
    }

    console.log("[v0] Enhanced installments found:", installments?.length || 0)

    const { data: dailySchedule, error: dailyError } = await supabase.rpc("get_daily_schedule", {
      p_date: date || null,
    })

    if (dailyError) {
      console.error("Error fetching daily schedule:", dailyError)
    }

    const statusGroups = {
      a_vencer: installments?.filter((i) => i.enhanced_status === "a_vencer") || [],
      a_pagar_hoy: installments?.filter((i) => i.enhanced_status === "a_pagar_hoy") || [],
      con_mora: installments?.filter((i) => i.enhanced_status === "con_mora") || [],
      pagada_anticipada: installments?.filter((i) => i.enhanced_status === "pagada_anticipada") || [],
      pagada: installments?.filter((i) => i.enhanced_status === "pagada") || [],
      pagada_con_mora: installments?.filter((i) => i.enhanced_status === "pagada_con_mora") || [],
    }

    const summary = {
      total_a_vencer: statusGroups.a_vencer.reduce((sum, i) => sum + (i.amount_due || 0), 0),
      total_a_pagar_hoy: statusGroups.a_pagar_hoy.reduce((sum, i) => sum + (i.amount_due || 0), 0),
      total_con_mora: statusGroups.con_mora.reduce((sum, i) => sum + (i.amount_due || 0), 0),
      total_pagado_anticipado: statusGroups.pagada_anticipada.reduce((sum, i) => sum + (i.amount_paid || 0), 0),
      total_pagado: statusGroups.pagada.reduce((sum, i) => sum + (i.amount_paid || 0), 0),
      total_pagado_con_mora: statusGroups.pagada_con_mora.reduce((sum, i) => sum + (i.amount_paid || 0), 0),
      count_a_vencer: statusGroups.a_vencer.length,
      count_a_pagar_hoy: statusGroups.a_pagar_hoy.length,
      count_con_mora: statusGroups.con_mora.length,
      count_pagada_anticipada: statusGroups.pagada_anticipada.length,
      count_pagada: statusGroups.pagada.length,
      count_pagada_con_mora: statusGroups.pagada_con_mora.length,
    }

    console.log("[v0] Enhanced summary calculated:", summary)

    return NextResponse.json({
      success: true,
      installments: installments || [],
      dailySchedule: dailySchedule || [],
      statusGroups,
      summary,
      metadata: {
        total_installments: installments?.length || 0,
        query_date: date || new Date().toISOString().split("T")[0],
        timezone: "America/Argentina/Buenos_Aires",
      },
    })
  } catch (error) {
    console.error("Error in enhanced cronograma API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { installment_id, payment_date, amount_paid } = body

    if (!installment_id) {
      return NextResponse.json({ error: "installment_id es requerido" }, { status: 400 })
    }

    console.log("[v0] Marking installment as paid:", { installment_id, payment_date, amount_paid })

    const { data, error } = await supabase.rpc("mark_installment_as_paid", {
      p_installment_id: installment_id,
      p_payment_date: payment_date || null,
      p_amount_paid: amount_paid || null,
    })

    if (error) {
      console.error("Error marking installment as paid:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Installment marked as paid successfully")

    return NextResponse.json({
      success: true,
      message: "Cuota marcada como pagada exitosamente",
    })
  } catch (error) {
    console.error("Error in POST enhanced cronograma:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
