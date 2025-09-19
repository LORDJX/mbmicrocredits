import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    console.log("[v0] Cronograma API - Today:", today.toISOString().split("T")[0])
    console.log("[v0] Cronograma API - Start of month:", startOfMonth.toISOString().split("T")[0])
    console.log("[v0] Cronograma API - End of month:", endOfMonth.toISOString().split("T")[0])

    console.log("[v0] Using mock data for testing - Supabase client not available")
    const activeLoans = [
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
      {
        id: "example-3",
        loan_code: "LOAN-003",
        client_id: "client-3",
        amount: 75000,
        installments: 8,
        installment_amount: 9375,
        loan_type: "Quincenal",
        start_date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0],
        status: "Activo",
        clients: {
          id: "client-3",
          first_name: "Carlos",
          last_name: "Rodriguez",
        },
      },
    ]

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

    const allReceipts = [
      {
        id: "receipt-1",
        total_amount: 10000,
        receipt_date: todayStr,
        payment_type: "Efectivo",
        observations: "Pago puntual",
        selected_loans: [{ loan_code: "LOAN-001", installment_number: 1 }],
        client_id: "client-1",
        receipt_number: "REC-001",
        clients: {
          id: "client-1",
          first_name: "Juan",
          last_name: "Pérez",
          phone: "123-456-7890",
        },
      },
    ]

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
