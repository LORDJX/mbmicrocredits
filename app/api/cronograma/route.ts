import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const today = new Date()
    const argentinaTime = new Date(today.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }))
    const todayStr = argentinaTime.toISOString().split("T")[0]

    const startOfMonth = new Date(argentinaTime.getFullYear(), argentinaTime.getMonth(), 1)
    const endOfMonth = new Date(argentinaTime.getFullYear(), argentinaTime.getMonth() + 1, 0)

    console.log("[v0] Cronograma API - Iniciando consulta de datos reales...")
    console.log("[v0] Cronograma API - Today (Argentina):", todayStr)
    console.log("[v0] Cronograma API - Start of month:", startOfMonth.toISOString().split("T")[0])
    console.log("[v0] Cronograma API - End of month:", endOfMonth.toISOString().split("T")[0])

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
    console.log("[v0] Total installments found:", allInstallments.length)

    if (allInstallments.length === 0) {
      console.log("[v0] No installments found in database")
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
        debug: {
          total_installments: 0,
          argentina_time: todayStr,
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
          first_name: loan.clients.first_name,
          last_name: loan.clients.last_name,
        })
      }
    }

    console.log("[v0] Enriched installments:", enrichedInstallments.length)

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
        client_name: installment.client_name || `${installment.first_name || ""} ${installment.last_name || ""}`.trim(),
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

    const monthInstallments = processedInstallments.filter((inst) => {
      const dueDate = new Date(inst.due_date)
      const isInMonth = dueDate >= startOfMonth && dueDate <= endOfMonth
      return isInMonth && !inst.paid_at
    })

    const paidInstallments = processedInstallments.filter((inst) => inst.paid_at)

    const { data: todayReceipts } = await supabase
      .from("receipts")
      .select(`
        id,
        total_amount,
        receipt_date,
        payment_type,
        observations,
        receipt_number,
        clients!inner(
          first_name,
          last_name,
          phone
        )
      `)
      .eq("receipt_date", todayStr)
      .order("created_at", { ascending: false })

    const { data: monthReceipts } = await supabase
      .from("receipts")
      .select("total_amount, receipt_date")
      .gte("receipt_date", startOfMonth.toISOString().split("T")[0])
      .lte("receipt_date", endOfMonth.toISOString().split("T")[0])

    const totalReceivedToday = todayReceipts?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0
    const totalReceivedMonth = monthReceipts?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0

    const summary = {
      total_due_today: todayInstallments.reduce((sum, inst) => sum + inst.amount, 0),
      total_received_today: totalReceivedToday,
      total_overdue: overdueInstallments.reduce((sum, inst) => sum + inst.amount, 0),
      total_received_month: totalReceivedMonth,
      total_due_month: monthInstallments.reduce((sum, inst) => sum + inst.amount, 0),
    }

    const statusCounts = {
      a_vencer: processedInstallments.filter((i) => i.status === "pending" && !i.paid_at).length,
      a_pagar_hoy: todayInstallments.length,
      con_mora: overdueInstallments.length,
      pagadas: paidInstallments.length,
      pagadas_anticipadas: paidInstallments.filter((i) => i.payment_date && i.payment_date < i.due_date).length,
      pagadas_con_mora: paidInstallments.filter((i) => i.original_status === "con_mora").length,
    }

    console.log("[v0] Processed installments by status:", statusCounts)
    console.log("[v0] Summary:", summary)

    return NextResponse.json({
      success: true,
      today: todayInstallments,
      overdue: overdueInstallments,
      month: monthInstallments,
      upcoming: processedInstallments.filter(
        (inst) => inst.status === "pending" && !inst.paid_at && new Date(inst.due_date) > argentinaTime,
      ),
      paid: paidInstallments,
      todayReceipts: todayReceipts || [],
      summary,
      debug: {
        total_installments: allInstallments.length,
        argentina_time: todayStr,
        installments_by_status: statusCounts,
      },
    })
  } catch (error) {
    console.error("Error in cronograma API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
