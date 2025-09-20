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
      .select("*")
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

    const mapStatus = (calculatedStatus: string, dueDate: string) => {
      const dueDateObj = new Date(dueDate)
      const todayObj = new Date(today)

      switch (calculatedStatus) {
        case "pagada":
          return "pagadas"
        case "pagada_anticipada":
          return "pagadas_anticipadas"
        case "pagada_con_mora":
          return "pagadas_con_mora"
        case "con_mora":
          return "con_mora"
        case "pendiente":
          if (dueDateObj.getTime() === todayObj.getTime()) {
            return "a_pagar_hoy"
          } else if (dueDateObj > todayObj) {
            return "a_vencer"
          } else {
            return "con_mora"
          }
        default:
          return "a_vencer"
      }
    }

    const processedInstallments = allInstallments.map((installment) => ({
      id: installment.id,
      client_id: installment.client_id,
      client_name: `${installment.first_name || ""} ${installment.last_name || ""}`.trim(),
      loan_code: installment.loan_code,
      installment_number: installment.installment_no,
      total_installments: installment.installments_total,
      amount: Number(installment.amount_due || 0),
      amount_paid: Number(installment.amount_paid || 0),
      due_date: installment.due_date,
      status: mapStatus(installment.calculated_status, installment.due_date),
      calculated_status: installment.calculated_status,
      paid_at: installment.paid_at,
    }))

    const todayInstallments = processedInstallments.filter(
      (inst) => inst.status === "a_pagar_hoy" && inst.calculated_status !== "pagada",
    )

    const overdueInstallments = processedInstallments.filter(
      (inst) => inst.status === "con_mora" && inst.calculated_status !== "pagada",
    )

    const monthInstallments = processedInstallments.filter((inst) => {
      const dueDate = new Date(inst.due_date)
      const isInMonth = dueDate >= startOfMonth && dueDate <= endOfMonth
      const isNotPaid = !["pagada", "pagada_anticipada", "pagada_con_mora"].includes(inst.calculated_status)
      return isInMonth && isNotPaid
    })

    const { data: todayReceipts, error: receiptsError } = await supabase
      .from("receipts")
      .select(`
        id,
        total_amount,
        receipt_date,
        payment_type,
        observations,
        receipt_number,
        clients!inner(
          id,
          first_name,
          last_name,
          phone
        )
      `)
      .eq("receipt_date", today)
      .order("created_at", { ascending: false })

    if (receiptsError) {
      console.error("[v0] Error fetching today receipts:", receiptsError)
    }

    const { data: monthReceipts, error: monthReceiptsError } = await supabase
      .from("receipts")
      .select("total_amount")
      .gte("receipt_date", startOfMonth.toISOString().split("T")[0])
      .lte("receipt_date", endOfMonth.toISOString().split("T")[0])

    if (monthReceiptsError) {
      console.error("[v0] Error fetching month receipts:", monthReceiptsError)
    }

    const totalReceivedToday = (todayReceipts || []).reduce((sum, r) => sum + Number(r.total_amount || 0), 0)
    const totalReceivedMonth = (monthReceipts || []).reduce((sum, r) => sum + Number(r.total_amount || 0), 0)

    const statusCounts = processedInstallments.reduce(
      (acc, inst) => {
        acc[inst.status] = (acc[inst.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const summary = {
      total_due_today: todayInstallments.reduce((sum, inst) => sum + inst.amount, 0),
      total_received_today: totalReceivedToday,
      total_overdue: overdueInstallments.reduce((sum, inst) => sum + inst.amount, 0),
      total_received_month: totalReceivedMonth,
      total_due_month: monthInstallments.reduce((sum, inst) => sum + inst.amount, 0),
    }

    console.log("[v0] Today installments:", todayInstallments.length)
    console.log("[v0] Overdue installments:", overdueInstallments.length)
    console.log("[v0] Month installments:", monthInstallments.length)
    console.log("[v0] Today receipts:", (todayReceipts || []).length, "Total:", totalReceivedToday)
    console.log("[v0] Summary:", summary)

    return NextResponse.json({
      success: true,
      today: todayInstallments,
      overdue: overdueInstallments,
      month: monthInstallments,
      todayReceipts: todayReceipts || [],
      summary,
      debug: {
        total_installments: allInstallments.length,
        argentina_time: today,
        installments_by_status: {
          a_vencer: statusCounts.a_vencer || 0,
          a_pagar_hoy: statusCounts.a_pagar_hoy || 0,
          con_mora: statusCounts.con_mora || 0,
          pagadas: statusCounts.pagadas || 0,
          pagadas_anticipadas: statusCounts.pagadas_anticipadas || 0,
          pagadas_con_mora: statusCounts.pagadas_con_mora || 0,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Error in cronograma API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
