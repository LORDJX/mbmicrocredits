import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

// --- LÓGICA GET (Lectura) ---
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    const client_id = searchParams.get("client_id")

    let query = supabase
      .from("loans")
      .select(`*, clients!inner(first_name, last_name, client_code)`)
      .order("created_at", { ascending: false })

    if (search) {
      query = query.or(
        `loan_code.ilike.%${search}%,clients.first_name.ilike.%${search}%,clients.last_name.ilike.%${search}%`,
      )
    }
    if (status) {
      query = query.eq("status", status)
    }
    if (client_id) {
      query = query.eq("client_id", client_id)
    }

    const { data: loans, error } = await query

    if (error) {
      console.error("Error fetching loans:", error)
      return NextResponse.json({ error: "Error al obtener préstamos" }, { status: 500 })
    }

    const mappedLoans = (loans || []).map((loan) => ({
      ...loan,
      active_clients: loan.clients,
    }))

    return NextResponse.json({ loans: mappedLoans })
  } catch (error) {
    console.error("Error in GET /api/loans:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// --- LÓGICA POST (Creación de Préstamo y Cuotas) ---
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()

    const loanSchema = z.object({
      client_id: z.string().uuid("ID de cliente inválido"),
      amount: z.number().positive("El monto debe ser positivo").min(1, "El monto mínimo es $1"),
      installments: z
        .number()
        .int("Las cuotas deben ser un número entero")
        .min(1, "Mínimo 1 cuota")
        .max(360, "Máximo 360 cuotas"),
      interest_rate: z.number().min(0, "La tasa no puede ser negativa").max(100, "La tasa máxima es 100%"),
      start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),
      loan_type: z.enum(["personal", "business", "mortgage"]).optional().default("personal"),
      frequency: z.enum(["weekly", "biweekly", "monthly"]).default("monthly"),
      status: z.enum(["active", "completed", "defaulted"]).optional().default("active"),
    })

    const validation = loanSchema.safeParse({
      ...body,
      amount: Number.parseFloat(body.amount),
      installments: Number.parseInt(body.installments),
      interest_rate: Number.parseFloat(body.interest_rate || "0"),
    })

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validation.error.errors,
        },
        { status: 400 },
      )
    }

    const validatedData = validation.data
    const { client_id, amount, installments, interest_rate, start_date, loan_type, status, frequency } = validatedData

    // CÁLCULO DE MONTOS
    const principal = amount
    const rate = interest_rate / 100
    const total_installments = installments

    const amount_to_repay = principal * (1 + rate * total_installments)
    const installment_amount = amount_to_repay / total_installments

    const { data: loanCodeData, error: codeError } = await supabase.rpc("get_next_loan_code")

    if (codeError) {
      console.error("Error generating loan code:", codeError)
      return NextResponse.json({ error: "Error al generar código de préstamo" }, { status: 500 })
    }

    const loan_code = loanCodeData

    // Calcular fecha de fin
    const startDateObj = new Date(start_date)
    const endDateObj = new Date(startDateObj)
    endDateObj.setMonth(endDateObj.getMonth() + total_installments)
    const end_date = endDateObj.toISOString().split("T")[0]

    // Insertar Préstamo en la DB
    const { data: newLoan, error } = await supabase
      .from("loans")
      .insert({
        client_id,
        amount: principal,
        installments: total_installments,
        interest_rate: rate * 100,
        start_date,
        end_date,
        loan_type,
        status,
        loan_code,
        amount_to_repay,
        installment_amount,
        principal,
        installments_total: total_installments,
        frequency,
      })
      .select(`*, clients!inner(first_name, last_name, client_code)`)
      .single()

    if (error) {
      console.error("Error creating loan:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Generar Cuotas Automáticamente (Lógica mejorada y estable)
    const installmentsData = []
    const installmentAmount = amount_to_repay / total_installments

    let intervalUnit = "month"
    let intervalValue = 1

    if (frequency === "weekly") {
      intervalUnit = "day"
      intervalValue = 7
    } else if (frequency === "biweekly") {
      intervalUnit = "day"
      intervalValue = 15
    }

    const initialDueDate = new Date(start_date)
    initialDueDate.setHours(12) // Para evitar problemas de DST

    for (let i = 1; i <= total_installments; i++) {
      const dueDate = new Date(initialDueDate)

      if (intervalUnit === "month") {
        // Cálculo absoluto de meses basado en el índice (i - 1)
        dueDate.setMonth(initialDueDate.getMonth() + intervalValue * (i - 1))
      } else {
        // Cálculo absoluto de días basado en el índice (i - 1)
        dueDate.setDate(initialDueDate.getDate() + intervalValue * (i - 1))
      }

      installmentsData.push({
        loan_id: newLoan.id,
        installment_no: i,
        installments_total: total_installments,
        due_date: dueDate.toISOString().split("T")[0],
        amount_due: installmentAmount,
        amount_paid: 0,
        status: "A_PAGAR", // Estado inicial
        code: `${loan_code}-${i.toString().padStart(2, "0")}`,
      })
    }

    const { error: installmentsError } = await supabase.from("installments").insert(installmentsData)

    if (installmentsError) {
      console.error("Error creating installments:", installmentsError)
    }

    return NextResponse.json({ loan: newLoan }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/loans:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
