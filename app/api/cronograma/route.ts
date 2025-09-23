import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams
    const viewMode = searchParams.get("view") || "current"
    const dateRange = searchParams.get("range") || "current_month"

    const today = new Date()
    const argentinaTime = new Date(today.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }))
    const todayStr = argentinaTime.toISOString().split("T")[0]

    console.log("[v0] Cronograma API - Iniciando consulta de datos reales...")
    console.log("[v0] Cronograma API - Today (Argentina):", todayStr)
    console.log("[v0] Cronograma API - View mode:", viewMode)
    console.log("[v0] Cronograma API - Date range:", dateRange)

    let startDate: string
    let endDate: string

    if (dateRange === "current_month") {
      const startOfMonth = new Date(argentinaTime.getFullYear(), argentinaTime.getMonth(), 1)
      const endOfMonth = new Date(argentinaTime.getFullYear(), argentinaTime.getMonth() + 1, 0)
      startDate = startOfMonth.toISOString().split("T")[0]
      endDate = endOfMonth.toISOString().split("T")[0]
    } else {
      startDate = todayStr
      endDate = todayStr
    }

    console.log("[v0] Cronograma API - Start date:", startDate)
    console.log("[v0] Cronograma API - End date:", endDate)

    const { data: installments, error: installmentsError } = await supabase
      .from("installments_with_status")
      .select(`
        id,
        loan_id,
        code,
        installment_no,
        installments_total,
        due_date,
        amount_due,
        amount_paid,
        paid_at,
        balance_due,
        status
      `)
      .order("due_date", { ascending: true })

    if (installmentsError) {
      console.error("[v0] Error fetching installments:", installmentsError)
      return NextResponse.json({ error: "Error fetching installments from installments_with_status" }, { status: 500 })
    }

    const allInstallments = installments || []
    console.log("Total installments found:", allInstallments.length)

    if (allInstallments.length === 0) {
      return NextResponse.json({
        success: true,
        today: [],
        overdue: [],
        month: [],
        upcoming: [],
        paid: [],
        todayReceipts: [],
        summary: {
          total_due_today: 0,
          total_received_today: 0,
          total_overdue: 0,
          total_received_month: 0,
          total_due_month: 0,
        },
        debug: {
          total_installments: 0,
          argentina_time: todayStr,
          view_mode: viewMode,
          date_range: dateRange,
          installments_by_status: {
            a_vencer: 0,
            a_pagar_hoy: 0,
            con_mora: 0,
            pagadas: 0,
            pagadas_anticipadas: 0,
            pagadas_con_mora: 0,
          },
        },
      })
    }

    const enrichedInstallments = []
    for (const installment of allInstallments) {
      const { data: loan } = await supabase
        .from("loans")
        .select(`
          loan_code,
          client_id,
          clients!inner(
            first_name,
            last_name
          )
        `)
        .eq("id", installment.loan_id)
        .single()

      if (loan) {
        enrichedInstallments.push({
          ...installment,
          loan_code: loan.loan_code,
          client_id: loan.client_id,
          client_name: `${loan.clients.first_name} ${loan.clients.last_name}`,
        })
      }
    }

    console.log("Enriched installments:", enrichedInstallments.length)

    const processedInstallments = enrichedInstallments.map((installment) => {
      const dueDate = new Date(installment.due_date)
      const isPaid = installment.amount_paid > 0 || installment.paid_at

      let processedStatus = "pending"
      if (isPaid) {
        processedStatus = "paid"
      } else if (installment.status === "con_mora" || installment.status === "overdue") {
        processedStatus = "overdue"
      } else if (installment.due_date === todayStr) {
        processedStatus = "due_today"
      } else if (dueDate < argentinaTime) {
        processedStatus = "overdue"
      }

      return {
        id: installment.id,
        loan_id: installment.loan_id,
        loan_code: installment.loan_code || installment.code,
        client_id: installment.client_id,
        client_name: installment.client_name,
        installment_number: installment.installment_no,
        total_installments: installment.installments_total,
        amount: installment.amount_due || 0,
        amount_paid: installment.amount_paid || 0,
        balance_due: installment.balance_due || 0,
        due_date: installment.due_date,
        paid_at: installment.paid_at,
        status: processedStatus,
        original_status: installment.status,
      }
    })

    const todayInstallments = processedInstallments.filter((inst) => inst.status === "due_today" && !inst.paid_at)
    const overdueInstallments = processedInstallments.filter((inst) => inst.status === "overdue" && !inst.paid_at)
    const upcomingInstallments = processedInstallments.filter(
      (inst) => inst.status === "pending" && !inst.paid_at && new Date(inst.due_date) > argentinaTime,
    )
    const paidInstallments = processedInstallments.filter((inst) => inst.paid_at)

    const { data: todayPayments } = await supabase
      .from("payments")
      .select(`
        id,
        paid_amount,
        paid_at,
        note,
        loans!inner(
          loan_code,
          clients!inner(
            first_name,
            last_name,
            phone
          )
        )
      `)
      .gte("paid_at", `${todayStr}T00:00:00`)
      .lt("paid_at", `${todayStr}T23:59:59`)
      .order("paid_at", { ascending: false })

    const { data: monthPayments } = await supabase
      .from("payments")
      .select("paid_amount, paid_at")
      .gte("paid_at", `${startDate}T00:00:00`)
      .lte("paid_at", `${endDate}T23:59:59`)

    const totalReceivedToday = todayPayments?.reduce((sum, p) => sum + (p.paid_amount || 0), 0) || 0
    const totalReceivedMonth = monthPayments?.reduce((sum, p) => sum + (p.paid_amount || 0), 0) || 0

    console.log("Today receipts:", todayPayments?.length || 0, "Total:", totalReceivedToday)
    console.log("Today installments:", todayInstallments.length)
    console.log("Overdue installments:", overdueInstallments.length)
    console.log("Upcoming installments:", upcomingInstallments.length)
    console.log("Paid installments:", paidInstallments.length)

    const summary = {
      total_due_today: todayInstallments.reduce((sum, inst) => sum + inst.amount, 0),
      total_received_today: totalReceivedToday,
      total_overdue: overdueInstallments.reduce((sum, inst) => sum + inst.amount, 0),
      total_received_month: totalReceivedMonth,
      total_due_month: processedInstallments
        .filter((inst) => {
          const dueDate = new Date(inst.due_date)
          const isInRange = dueDate >= new Date(startDate) && dueDate <= new Date(endDate)
          return isInRange && !inst.paid_at
        })
        .reduce((sum, inst) => sum + inst.amount, 0),
    }

    const statusCounts = {
      a_vencer: upcomingInstallments.length,
      a_pagar_hoy: todayInstallments.length,
      con_mora: overdueInstallments.length,
      pagadas: paidInstallments.length,
      pagadas_anticipadas: paidInstallments.filter((i) => i.paid_at && new Date(i.paid_at) < new Date(i.due_date))
        .length,
      pagadas_con_mora: paidInstallments.filter((i) => i.original_status === "con_mora").length,
    }

    console.log("Today receipts:", todayPayments?.length || 0, "Total:", totalReceivedToday)

    return NextResponse.json({
      success: true,
      today: todayInstallments,
      overdue: overdueInstallments,
      month: processedInstallments.filter((inst) => {
        const dueDate = new Date(inst.due_date)
        const isInRange = dueDate >= new Date(startDate) && dueDate <= new Date(endDate)
        return isInRange && !inst.paid_at
      }),
      upcoming: upcomingInstallments,
      paid: paidInstallments,
      todayReceipts: todayPayments || [],
      summary,
      debug: {
        total_installments: allInstallments.length,
        argentina_time: todayStr,
        view_mode: viewMode,
        date_range: dateRange,
        installments_by_status: statusCounts,
      },
    })
  } catch (error) {
    console.error("Error in cronograma API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
