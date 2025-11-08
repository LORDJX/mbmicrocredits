import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

// Schema de validación con Zod
const loanSchema = z.object({
  client_id: z.string().uuid("ID de cliente inválido"),
  amount: z
    .number()
    .positive("El monto debe ser positivo")
    .min(1, "El monto mínimo es $1")
    .max(10000000, "El monto máximo es $10,000,000"),
  installments: z
    .number()
    .int("Las cuotas deben ser un número entero")
    .min(1, "Mínimo 1 cuota")
    .max(360, "Máximo 360 cuotas"),
  interest_rate: z.number().min(0, "La tasa no puede ser negativa").max(100, "La tasa máxima es 100%"),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  loan_type: z.enum(["personal", "business", "mortgage"]).optional().default("personal"),
  frequency: z.enum(["weekly", "biweekly", "monthly"]).default("monthly"),
  status: z.enum(["active", "completed", "defaulted"]).optional().default("active"),
})

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
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "50")

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from("loans")
      .select(
        `
        *,
        clients!inner(first_name, last_name, client_code, phone, email),
        installments(amount_paid)
      `,
        { count: "exact" },
      )
      .range(from, to)
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

    const { data: loans, error, count } = await query

    if (error) {
      console.error("Error fetching loans:", error)
      return NextResponse.json({ error: "Error al obtener préstamos" }, { status: 500 })
    }

    const mappedLoans = (loans || []).map((loan) => {
      // Sumamos todos los pagos realizados en las cuotas
      const totalPaid = (loan.installments || []).reduce(
        (sum: number, inst: any) => sum + (Number(inst.amount_paid) || 0),
        0,
      )

      // Calculamos el saldo pendiente
      const amountToRepay = Number(loan.amount_to_repay) || 0
      const balance = amountToRepay - totalPaid

      // Determinamos si tiene cuotas pendientes (considerando margen de error de $0.01)
      const hasPendingInstallments = balance > 0.01

      return {
        ...loan,
        active_clients: loan.clients,
        balance: Math.max(0, balance), // Nunca negativo
        has_pending_installments: hasPendingInstallments,
        // Removemos installments del objeto para no enviar data innecesaria
        installments: loan.installments?.length || 0,
      }
    })

    return NextResponse.json({
      loans: mappedLoans,
      total: count || 0,
      page,
      pageSize,
    })
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

    // Validación con Zod
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
          details: validation.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      )
    }

    const validatedData = validation.data

    // Validación adicional: fecha no muy antigua
    const startDate = new Date(validatedData.start_date)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    if (startDate < oneYearAgo) {
      return NextResponse.json(
        {
          error: "La fecha de inicio no puede ser anterior a un año",
        },
        { status: 400 },
      )
    }

    const { client_id, amount, installments, interest_rate, start_date, loan_type, status, frequency } = validatedData

    // CÁLCULO DE MONTOS
    const principal = amount
    const rate = interest_rate / 100
    const total_installments = installments

    const amount_to_repay = principal * (1 + rate * total_installments)
    const installment_amount = amount_to_repay / total_installments

    // GENERACIÓN DE CÓDIGO ÚNICO CON UUID
    const loan_code = `PR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

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

    // Generar Cuotas Automáticamente
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
        dueDate.setMonth(initialDueDate.getMonth() + intervalValue * (i - 1))
      } else {
        dueDate.setDate(initialDueDate.getDate() + intervalValue * (i - 1))
      }

      installmentsData.push({
        loan_id: newLoan.id,
        installment_no: i,
        installments_total: total_installments,
        due_date: dueDate.toISOString().split("T")[0],
        amount_due: installmentAmount,
        amount_paid: 0,
        status: "A_PAGAR",
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
