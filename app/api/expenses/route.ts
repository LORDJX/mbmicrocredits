import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const search = searchParams.get("search")

    // Construir query - solo gastos no eliminados
    let query = supabase
      .from("v_expenses")
      .select("*")
      .is("deleted_at", null)
      .order("expense_date", { ascending: false })

    // Aplicar filtros
    if (category) {
      query = query.eq("category_id", category)
    }
    if (status) {
      query = query.eq("status", status)
    }
    if (startDate) {
      query = query.gte("expense_date", startDate)
    }
    if (endDate) {
      query = query.lte("expense_date", endDate)
    }
    if (search) {
      query = query.or(`description.ilike.%${search}%,vendor_name.ilike.%${search}%,expense_code.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching expenses:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in GET /api/expenses:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()

    // Validar datos requeridos
    if (!body.category_id || !body.amount || !body.expense_date || !body.payment_method || !body.description) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Crear gasto
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        ...body,
        created_by: user.id,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating expense:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in POST /api/expenses:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
