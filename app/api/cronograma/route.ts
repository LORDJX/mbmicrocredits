import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    const now = new Date()
    const argentinaOffset = -3 * 60 // UTC-3 en minutos
    const argentinaTime = new Date(now.getTime() + argentinaOffset * 60 * 1000)
    const today = argentinaTime.toISOString().split("T")[0]

    const startOfMonth = new Date(argentinaTime.getFullYear(), argentinaTime.getMonth(), 1)
    const endOfMonth = new Date(argentinaTime.getFullYear(), argentinaTime.getMonth() + 1, 0)

    console.log("[v0] Cronograma API - Today (Argentina):", today)
    console.log("[v0] Cronograma API - Start of month:", startOfMonth.toISOString().split("T")[0])
    console.log("[v0] Cronograma API - End of month:", endOfMonth.toISOString().split("T")[0])

    const { data: allInstallments, error: installmentsError } = await supabase
      .from("installments_with_calculated_status")
      .select(`
        id,
        loan_id,
        loan_code,
        client_id,
        client_name,
        first_name,
        last_name,
        installment_no,
        installments_total,
        amount_due,
        amount_paid,
        due_date,
        payment_date,
        paid_at,
        status,
        calculated_status,
        code,
        created_at
      `)
      .order("due_date", { ascending: true })

    if (installmentsError) {
      console.error("[v0] Error fetching installments:", installmentsError)
      return NextResponse.json({ error: "Error fetching installments" }, { status: 500 })
    }

    console.log("[v0] Total installments found:", allInstallments?.length || 0)

    if (!allInstallments || allInstallments.length === 0) {
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
          argentina_time: today,
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

    const mapStatus = (calculatedStatus: string) => {
      switch (calculatedStatus?.toLowerCase()) {
        case "a_vencer":
          return "a_vencer"
        case "a_pagar_hoy":
          return "a_pagar_hoy"
        case "con_mora":
          return "con_mora"
        case "pagadas":
          return "pagadas"
        case "pagadas_anticipadas":
          return "pagadas_anticipadas"
        case "pagadas_con_mora":
          return "pagadas_con_mora"
        default:
          return "a_vencer"
      }
    }

    const processedInstallments = allInstallments.map((installment) => ({
      id: installment.id,
      client_id: installment.client_id,
      client_name: installment.client_name || `${installment.first_name || ""} ${installment.last_name || ""}`.trim(),
      loan_code: installment.loan_code,
      installment_number: installment.installment_no,
      total_installments: installment.installments_total,
      amount: installment.amount_due || 0,
      amount_paid: installment.amount_paid || 0,
      due_date: installment.due_date,
      payment_date: installment.payment_date,
      paid_at: installment.paid_at,
      status: mapStatus(installment.calculated_status),
      code: installment.code,
    }))

    const todayInstallments = processedInstallments.filter((inst) => inst.status === "a_pagar_hoy")

    const overdueInstallments = processedInstallments.filter((inst) => inst.status === "con_mora")

    const monthInstallments = processedInstallments.filter((inst) => {
      const dueDate = new Date(inst.due_date)
      const isInMonth = dueDate >= startOfMonth && dueDate <= endOfMonth
      const isNotPaid = !["pagadas", "pagadas_anticipadas", "pagadas_con_mora"].includes(inst.status)
      return isInMonth && isNotPaid
    })

    console.log("[v0] Today installments (a_pagar_hoy):", todayInstallments.length)
    console.log("[v0] Overdue installments (con_mora):", overdueInstallments.length)
    console.log("[v0] Month installments:", monthInstallments.length)

    const { data: allReceipts, error: receiptsError } = await supabase
      .from("receipts")
      .select(`
        id,
        total_amount,
        receipt_date,
        payment_type,
        observations,
        selected_loans,
        selected_installments,
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

    if (receiptsError) {
      console.error("[v0] Error fetching receipts:", receiptsError)
    }

    const todayReceipts = allReceipts?.filter((receipt) => receipt.receipt_date === today) || []
    const totalReceivedToday = todayReceipts.reduce((sum, r) => sum + (r.total_amount || 0), 0)

    const monthReceipts =
      allReceipts?.filter((r) => {
        const receiptDate = new Date(r.receipt_date)
        return receiptDate >= startOfMonth && receiptDate <= endOfMonth
      }) || []

    const totalReceivedMonth = monthReceipts.reduce((sum, r) => sum + (r.total_amount || 0), 0)

    console.log("[v0] Today receipts found:", todayReceipts.length, "Total amount:", totalReceivedToday)
    console.log("[v0] Month receipts total amount:", totalReceivedMonth)

    const summary = {
      total_due_today: todayInstallments.reduce((sum, inst) => sum + inst.amount, 0),
      total_received_today: totalReceivedToday,
      total_overdue: overdueInstallments.reduce((sum, inst) => sum + inst.amount, 0),
      total_received_month: totalReceivedMonth,
      total_due_month: monthInstallments.reduce((sum, inst) => sum + inst.amount, 0),
    }

    const installmentsByStatus = {
      a_vencer: processedInstallments.filter((i) => i.status === "a_vencer").length,
      a_pagar_hoy: processedInstallments.filter((i) => i.status === "a_pagar_hoy").length,
      con_mora: processedInstallments.filter((i) => i.status === "con_mora").length,
      pagadas: processedInstallments.filter((i) => i.status === "pagadas").length,
      pagadas_anticipadas: processedInstallments.filter((i) => i.status === "pagadas_anticipadas").length,
      pagadas_con_mora: processedInstallments.filter((i) => i.status === "pagadas_con_mora").length,
    }

    console.log("[v0] Summary calculated:", summary)

    return NextResponse.json({
      success: true,
      today: todayInstallments,
      overdue: overdueInstallments,
      month: monthInstallments,
      todayReceipts: todayReceipts,
      summary,
      debug: {
        total_installments: allInstallments.length,
        argentina_time: today,
        installments_by_status: installmentsByStatus,
      },
    })
  } catch (error) {
    console.error("Error in cronograma API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
