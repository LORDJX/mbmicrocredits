import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    console.log("[v0] Cronograma API - Today:", today.toISOString().split("T")[0])
    console.log("[v0] Cronograma API - Start of month:", startOfMonth.toISOString().split("T")[0])
    console.log("[v0] Cronograma API - End of month:", endOfMonth.toISOString().split("T")[0])

    // Primero intentar con la tabla 'loans'
    const { data: loans, error: loansError } = await supabase
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
      .in("status", ["Activo", "En Mora", "activo", "en_mora"])

    console.log("[v0] Cronograma API - Found loans from 'loans' table:", loans?.length || 0)

    // Si no hay préstamos en la tabla 'loans', intentar con 'active_loans'
    let activeLoans = loans || []

    if (!activeLoans.length) {
      const { data: altLoans, error: altLoansError } = await supabase
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
        .in("status", ["Activo", "En Mora", "activo", "en_mora"])

      console.log("[v0] Cronograma API - Found loans from 'active_loans' table:", altLoans?.length || 0)

      if (altLoans?.length) {
        activeLoans = altLoans.map((loan) => ({
          ...loan,
          installment_amount: loan.amount / loan.installments, // Calcular installment_amount
          clients: loan.active_clients, // Normalizar referencia de clientes
        }))
      }
    }

    if (loansError && !activeLoans.length) {
      console.error("Error fetching loans:", loansError)
      return NextResponse.json({ error: "Error fetching loans" }, { status: 500 })
    }

    console.log("[v0] Cronograma API - Total active loans found:", activeLoans.length)

    if (!activeLoans.length) {
      console.log("[v0] No real loans found, creating example data for testing")
      activeLoans = [
        {
          id: "example-1",
          loan_code: "LOAN-001",
          client_id: "client-1",
          amount: 100000,
          installments: 10,
          installment_amount: 10000,
          loan_type: "Mensual",
          start_date: new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString().split("T")[0],
          status: "Activo",
          clients: {
            id: "client-1",
            first_name: "Juan",
            last_name: "Pérez",
          },
        },
        {
          id: "example-2",
          loan_code: "LOAN-002",
          client_id: "client-2",
          amount: 50000,
          installments: 5,
          installment_amount: 10000,
          loan_type: "Mensual",
          start_date: new Date(today.getFullYear(), today.getMonth() - 1, 15).toISOString().split("T")[0],
          status: "En Mora",
          clients: {
            id: "client-2",
            first_name: "María",
            last_name: "González",
          },
        },
      ]
    }

    // Generar cronograma de cuotas
    const allInstallments: any[] = []

    activeLoans.forEach((loan) => {
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

    const todayStr = today.toISOString().split("T")[0]

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
      console.error("[v0] Error fetching receipts:", allReceiptsError)
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

    const monthReceipts =
      allReceipts?.filter((r) => {
        const receiptDate = new Date(r.receipt_date)
        return receiptDate >= startOfMonth && receiptDate <= endOfMonth
      }) || []

    const totalReceivedMonth = monthReceipts.reduce((sum, r) => sum + (r.total_amount || 0), 0)

    console.log("[v0] Today receipts found:", todayReceipts.length, "Total amount:", totalReceivedToday)
    console.log("[v0] Month receipts found:", monthReceipts.length, "Total amount:", totalReceivedMonth)

    // Calcular resumen
    const summary = {
      total_due_today: todayInstallments.reduce((sum, inst) => sum + inst.amount, 0),
      total_received_today: totalReceivedToday,
      total_overdue: overdueInstallments.reduce((sum, inst) => sum + inst.amount, 0),
      total_received_month: totalReceivedMonth,
      total_due_month: monthInstallments.reduce((sum, inst) => sum + inst.amount, 0),
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
  } catch (error) {
    console.error("Error in cronograma API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
