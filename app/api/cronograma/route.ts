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

    // Primero intentar con la tabla 'loans' que tiene installment_amount
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
      .in("status", ["Activo", "En Mora", "activo", "en mora", "ACTIVO", "EN MORA"])

    console.log("[v0] Loans table query result:", { count: loans?.length || 0, error: loansError })

    // Si no hay datos en 'loans', intentar con 'active_loans'
    let activeLoans = null
    if (!loans || loans.length === 0) {
      const { data: activeLoanData, error: activeLoansError } = await supabase
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
        .in("status", ["Activo", "En Mora", "activo", "en mora", "ACTIVO", "EN MORA"])

      console.log("[v0] Active loans table query result:", {
        count: activeLoanData?.length || 0,
        error: activeLoansError,
      })
      activeLoans = activeLoanData
    }

    // Usar los datos que estén disponibles
    const finalLoans = loans && loans.length > 0 ? loans : activeLoans || []

    console.log("[v0] Final loans to process:", finalLoans.length)

    if (finalLoans.length === 0) {
      console.log("[v0] No active loans found in either table")
      // Aún así devolver la estructura con recibos
      const { data: allReceipts } = await supabase
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

      const todayStr = today.toISOString().split("T")[0]
      const todayReceipts = allReceipts?.filter((receipt) => receipt.receipt_date === todayStr) || []
      const monthReceipts =
        allReceipts?.filter((r) => {
          const receiptDate = new Date(r.receipt_date)
          return receiptDate >= startOfMonth && receiptDate <= endOfMonth
        }) || []

      const totalReceivedToday = todayReceipts.reduce((sum, r) => sum + (r.total_amount || 0), 0)
      const totalReceivedMonth = monthReceipts.reduce((sum, r) => sum + (r.total_amount || 0), 0)

      return NextResponse.json({
        success: true,
        today: [],
        overdue: [],
        month: [],
        todayReceipts: todayReceipts,
        summary: {
          total_due_today: 0,
          total_received_today: totalReceivedToday,
          total_overdue: 0,
          total_received_month: totalReceivedMonth,
          total_due_month: 0,
        },
      })
    }

    // Generar cronograma de cuotas
    const allInstallments: any[] = []

    finalLoans.forEach((loan) => {
      let startDate = new Date(loan.start_date)

      // Si la fecha de inicio es muy antigua, calcular una fecha que genere cuotas distribuidas
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

      if (startDate < threeMonthsAgo) {
        const intervalDays = loan.loan_type === "Semanal" ? 7 : loan.loan_type === "Quincenal" ? 15 : 30
        const totalDays = intervalDays * loan.installments
        const daysBack = Math.floor(totalDays * 0.6)
        startDate = new Date(today)
        startDate.setDate(today.getDate() - daysBack)
      }

      const intervalDays = loan.loan_type === "Semanal" ? 7 : loan.loan_type === "Quincenal" ? 15 : 30

      const installmentAmount = loan.installment_amount || loan.amount / loan.installments

      console.log(
        "[v0] Processing loan:",
        loan.loan_code,
        "Start date:",
        startDate.toISOString().split("T")[0],
        "Interval:",
        intervalDays,
        "days",
        "Installment amount:",
        installmentAmount,
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

        const clientData = loan.clients || loan.active_clients
        const clientName = clientData ? `${clientData.first_name} ${clientData.last_name}` : "Cliente desconocido"

        const installment = {
          id: `${loan.id}-${i + 1}`,
          client_id: loan.client_id,
          client_name: clientName,
          loan_code: loan.loan_code,
          installment_number: i + 1,
          total_installments: loan.installments,
          amount: installmentAmount,
          due_date: dueDate.toISOString().split("T")[0],
          status: status,
        }

        allInstallments.push(installment)

        if (i < 3 || i >= loan.installments - 3) {
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

    const todayInstallments = allInstallments.filter((inst) => {
      const isDueToday = inst.due_date === todayStr || inst.status === "due_today"
      const isNotPaid = !paidInstallmentIds.has(`${inst.loan_code}-${inst.installment_number}`)
      return isDueToday && isNotPaid
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
      return isInMonth && isNotPaid
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
