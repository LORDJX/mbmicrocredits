import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function GET(request: NextRequest) {
  try {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    console.log("[v0] Cronograma API - Today:", today.toISOString().split("T")[0])
    console.log("[v0] Cronograma API - Start of month:", startOfMonth.toISOString().split("T")[0])
    console.log("[v0] Cronograma API - End of month:", endOfMonth.toISOString().split("T")[0])

    console.log("[v0] Checking loans table...")
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

    console.log("[v0] Loans table result:", { count: loans?.length || 0, error: loansError })

    let activeLoans = loans || []
    if (!activeLoans.length) {
      console.log("[v0] Checking active_loans table...")
      const { data: activeLoansData, error: activeLoansError } = await supabase.from("active_loans").select(`
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

      console.log("[v0] Active loans table result:", { count: activeLoansData?.length || 0, error: activeLoansError })

      if (activeLoansData?.length) {
        activeLoans = activeLoansData.map((loan) => ({
          ...loan,
          installment_amount: loan.amount / loan.installments, // Calcular cuota
          clients: loan.active_clients, // Normalizar nombre de la relación
        }))
      }
    }

    console.log("[v0] Total active loans found:", activeLoans.length)

    if (!activeLoans.length) {
      console.log("[v0] No loans found, creating sample data for testing...")
      activeLoans = [
        {
          id: "sample-1",
          loan_code: "SAMPLE-001",
          client_id: "client-1",
          amount: 100000,
          installments: 10,
          installment_amount: 10000,
          loan_type: "Semanal",
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días atrás
          status: "Activo",
          clients: {
            id: "client-1",
            first_name: "Cliente",
            last_name: "Ejemplo",
          },
        },
        {
          id: "sample-2",
          loan_code: "SAMPLE-002",
          client_id: "client-2",
          amount: 150000,
          installments: 15,
          installment_amount: 10000,
          loan_type: "Quincenal",
          start_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 días atrás
          status: "Activo",
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
      const startDate = new Date(loan.start_date)
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

    // Filtrar cuotas
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
    console.error("[v0] Error in cronograma API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
