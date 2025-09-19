import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

async function processLoans(
  loans: any[],
  supabase: any,
  today: Date,
  startOfMonth: Date,
  endOfMonth: Date,
  todayStr: string,
  yesterdayStr: string,
) {
  // Generar cronograma de cuotas
  const allInstallments: any[] = []

  loans?.forEach((loan) => {
    let startDate = new Date(loan.start_date)

    // Si la fecha de inicio es muy antigua, calcular una fecha que genere cuotas distribuidas
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    // Si el préstamo es muy antiguo, calcular una fecha de inicio que genere cuotas actuales
    if (startDate < threeMonthsAgo) {
      const intervalDays = loan.loan_type === "Semanal" ? 7 : loan.loan_type === "Quincenal" ? 15 : 30
      const totalDays = intervalDays * loan.installments

      // Calcular fecha de inicio para que algunas cuotas estén en el pasado, presente y futuro
      const daysBack = Math.floor(totalDays * 0.6) // 60% de las cuotas en el pasado
      startDate = new Date(today)
      startDate.setDate(today.getDate() - daysBack)
    }

    const intervalDays = loan.loan_type === "Semanal" ? 7 : loan.loan_type === "Quincenal" ? 15 : 30

    console.log(
      "[v0] Processing loan:",
      loan.loan_code,
      "Start date:",
      startDate.toISOString().split("T")[0],
      "Interval:",
      intervalDays,
      "days",
    )

    for (let i = 0; i < loan.installments; i++) {
      const dueDate = new Date(startDate)
      dueDate.setDate(startDate.getDate() + intervalDays * (i + 1))

      let status = "pending"
      const daysDiff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff < 0) {
        status = "overdue"
      } else if (daysDiff === 0) {
        status = "due_today"
      } else {
        status = "pending"
      }

      const installment = {
        id: `${loan.id}-${i + 1}`,
        client_id: loan.client_id,
        client_name: `${loan.clients.first_name} ${loan.clients.last_name}`,
        loan_code: loan.loan_code,
        installment_number: i + 1,
        total_installments: loan.installments,
        amount: loan.installment_amount || loan.amount / loan.installments,
        due_date: dueDate.toISOString().split("T")[0],
        status: status,
      }

      allInstallments.push(installment)

      if (i < 3 || i >= loan.installments - 3) {
        // Log primeras y últimas 3 cuotas
        console.log(
          `[v0] Installment ${i + 1}/${loan.installments} - Due: ${installment.due_date}, Status: ${status}, Days diff: ${daysDiff}`,
        )
      }
    }
  })

  console.log("[v0] Total installments generated:", allInstallments.length)

  const { data: allReceipts, error: allReceiptsError } = await supabase
    .from("receipts")
    .select(`
      id,
      total_amount,
      receipt_date,
      payment_type,
      observations,
      selected_loans,
      client_id,
      receipt_number,
      clients!inner(
        id,
        first_name,
        last_name,
        phone
      )
    `)
    .order("created_at", { ascending: false })

  if (allReceiptsError) {
    console.error("Error fetching all receipts:", allReceiptsError)
  }

  const paidInstallmentIds = new Set()
  allReceipts?.forEach((receipt) => {
    if (receipt.selected_loans) {
      receipt.selected_loans.forEach((loan: any) => {
        if (loan.loan_code && loan.installment_number) {
          paidInstallmentIds.add(`${loan.loan_code}-${loan.installment_number}`)
        }
      })
    }
  })

  console.log("[v0] Total paid installments found:", paidInstallmentIds.size)

  console.log("[v0] Filtering installments...")
  console.log("[v0] Today string:", todayStr)
  console.log("[v0] Start of month:", startOfMonth.toISOString().split("T")[0])
  console.log("[v0] End of month:", endOfMonth.toISOString().split("T")[0])

  const todayInstallments = allInstallments.filter((inst) => {
    const isDueToday = inst.due_date === todayStr || inst.status === "due_today"
    const isNotPaid = !paidInstallmentIds.has(`${inst.loan_code}-${inst.installment_number}`)
    const result = isDueToday && isNotPaid

    if (isDueToday) {
      console.log(
        `[v0] Today installment: ${inst.loan_code}-${inst.installment_number}, Due: ${inst.due_date}, Paid: ${!isNotPaid}, Include: ${result}`,
      )
    }

    return result
  })

  const overdueInstallments = allInstallments.filter((inst) => {
    const isOverdue = inst.status === "overdue"
    const isNotPaid = !paidInstallmentIds.has(`${inst.loan_code}-${inst.installment_number}`)
    return isOverdue && isNotPaid
  })

  const monthInstallments = allInstallments.filter((inst) => {
    const dueDate = new Date(inst.due_date)
    const isInMonth = dueDate >= startOfMonth && dueDate <= endOfMonth
    const isNotPaid = !paidInstallmentIds.has(`${inst.loan_code}-${inst.installment_number}`)
    const result = isInMonth && isNotPaid

    if (isInMonth && inst.status !== "overdue") {
      console.log(
        `[v0] Month installment: ${inst.loan_code}-${inst.installment_number}, Due: ${inst.due_date}, Paid: ${!isNotPaid}, Include: ${result}`,
      )
    }

    return result
  })

  console.log("[v0] Today installments:", todayInstallments.length)
  console.log("[v0] Overdue installments:", overdueInstallments.length)
  console.log("[v0] Month installments:", monthInstallments.length)

  const todayReceipts = allReceipts?.filter((receipt) => receipt.receipt_date === todayStr) || []
  const totalReceivedToday = todayReceipts.reduce((sum, r) => sum + (r.total_amount || 0), 0)

  const yesterdayReceipts = allReceipts?.filter((receipt) => receipt.receipt_date === yesterdayStr) || []
  const totalReceivedYesterday = yesterdayReceipts.reduce((sum, r) => sum + (r.total_amount || 0), 0)

  const monthReceipts =
    allReceipts?.filter((r) => {
      const receiptDate = new Date(r.receipt_date)
      return receiptDate >= startOfMonth && receiptDate <= endOfMonth
    }) || []

  const totalReceivedMonth = monthReceipts.reduce((sum, r) => sum + (r.total_amount || 0), 0)

  console.log("[v0] Today receipts found:", todayReceipts.length, "Total amount:", totalReceivedToday)
  console.log("[v0] Yesterday receipts found:", yesterdayReceipts.length, "Total amount:", totalReceivedYesterday)
  console.log("[v0] Month receipts found:", monthReceipts.length, "Total amount:", totalReceivedMonth)

  // Calcular resumen
  const summary = {
    total_due_today: todayInstallments.reduce((sum, inst) => sum + inst.amount, 0),
    total_received_today: totalReceivedToday,
    total_overdue: overdueInstallments.reduce((sum, inst) => sum + inst.amount, 0),
    total_received_month: totalReceivedMonth,
    total_due_month: monthInstallments.reduce((sum, inst) => sum + inst.amount, 0),
    total_received_yesterday: totalReceivedYesterday,
  }

  console.log("[v0] Summary calculated:", summary)

  return NextResponse.json({
    success: true,
    today: todayInstallments,
    overdue: overdueInstallments,
    month: monthInstallments,
    todayReceipts: todayReceipts,
    summary,
  })
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const todayStr = today.toISOString().split("T")[0]
    const yesterdayStr = yesterday.toISOString().split("T")[0]

    console.log("[v0] Cronograma API - Today:", todayStr)
    console.log("[v0] Cronograma API - Start of month:", startOfMonth.toISOString().split("T")[0])
    console.log("[v0] Cronograma API - End of month:", endOfMonth.toISOString().split("T")[0])

    // Primero intentar con la tabla loans
    const { data: loansFromLoans, error: loansError } = await supabase
      .from("loans")
      .select(`
        id,
        loan_code,
        client_id,
        amount,
        installments,
        installment_amount,
        loan_type,
        start_date,
        status,
        clients!inner(
          id,
          first_name,
          last_name
        )
      `)
      .in("status", ["Activo", "En Mora", "activo", "en mora"])

    console.log("[v0] Loans from 'loans' table:", loansFromLoans?.length || 0)
    if (loansError) {
      console.log("[v0] Error from 'loans' table:", loansError)
    }

    // Luego intentar con la tabla active_loans
    const { data: loansFromActiveLoans, error: activeLoansError } = await supabase
      .from("active_loans")
      .select(`
        id,
        loan_code,
        client_id,
        amount,
        installments,
        loan_type,
        start_date,
        status,
        active_clients!inner(
          id,
          first_name,
          last_name
        )
      `)
      .in("status", ["Activo", "En Mora", "activo", "en mora"])

    console.log("[v0] Loans from 'active_loans' table:", loansFromActiveLoans?.length || 0)
    if (activeLoansError) {
      console.log("[v0] Error from 'active_loans' table:", activeLoansError)
    }

    let allLoans: any[] = []

    // Agregar préstamos de la tabla loans
    if (loansFromLoans && loansFromLoans.length > 0) {
      const normalizedLoans = loansFromLoans.map((loan) => ({
        ...loan,
        clients: loan.clients,
        installment_amount: loan.installment_amount || loan.amount / loan.installments,
      }))
      allLoans = [...allLoans, ...normalizedLoans]
    }

    // Agregar préstamos de la tabla active_loans
    if (loansFromActiveLoans && loansFromActiveLoans.length > 0) {
      const normalizedActiveLoans = loansFromActiveLoans.map((loan) => ({
        ...loan,
        clients: loan.active_clients, // Mapear active_clients a clients
        installment_amount: loan.amount / loan.installments, // Calcular installment_amount
      }))
      allLoans = [...allLoans, ...normalizedActiveLoans]
    }

    console.log("[v0] Total loans found:", allLoans.length)

    // Si no hay préstamos, intentar consultar sin filtros de estado para debug
    if (allLoans.length === 0) {
      console.log("[v0] No loans found with status filters, checking all loans...")

      const { data: allLoansDebug } = await supabase.from("loans").select("id, loan_code, status").limit(5)

      const { data: allActiveLoansDebug } = await supabase.from("active_loans").select("id, loan_code, status").limit(5)

      console.log("[v0] Sample loans from 'loans' table:", allLoansDebug)
      console.log("[v0] Sample loans from 'active_loans' table:", allActiveLoansDebug)

      return NextResponse.json({
        success: true,
        today: [],
        overdue: [],
        month: [],
        todayReceipts: [],
        summary: {
          total_due_today: 0,
          total_received_today: 0,
          total_overdue: 0,
          total_received_month: 0,
          total_due_month: 0,
        },
      })
    }

    return processLoans(allLoans, supabase, today, startOfMonth, endOfMonth, todayStr, yesterdayStr)
  } catch (error) {
    console.error("Error in cronograma API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
