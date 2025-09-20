import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    const now = new Date()
    const argentinaOffset = -3 * 60 // UTC-3 in minutes
    const argentinaTime = new Date(now.getTime() + argentinaOffset * 60 * 1000)

    const today = argentinaTime.toISOString().split("T")[0]
    const startOfMonth = new Date(argentinaTime.getFullYear(), argentinaTime.getMonth(), 1).toISOString().split("T")[0]
    const endOfMonth = new Date(argentinaTime.getFullYear(), argentinaTime.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0]

    console.log("[v0] Cronograma API - Today (Argentina):", today)
    console.log("[v0] Cronograma API - Start of month:", startOfMonth)
    console.log("[v0] Cronograma API - End of month:", endOfMonth)

    const { data: installments, error: installmentsError } = await supabase
      .from("installments_with_calculated_status")
      .select(`
        id,
        loan_id,
        installment_no,
        installments_total,
        code,
        due_date,
        amount_due,
        amount_paid,
        paid_at,
        status,
        payment_date,
        loan_code,
        client_id,
        client_name,
        calculated_status
      `)
      .order("due_date", { ascending: true })

    if (installmentsError) {
      console.error("Error fetching installments:", installmentsError)
      return NextResponse.json({ error: "Error fetching installments" }, { status: 500 })
    }

    console.log("[v0] Total installments found:", installments?.length || 0)

    const transformedInstallments =
      installments?.map((inst) => ({
        id: inst.id,
        client_id: inst.client_id,
        client_name: inst.client_name,
        loan_code: inst.loan_code,
        installment_number: inst.installment_no,
        total_installments: inst.installments_total,
        amount: inst.amount_due,
        due_date: inst.due_date,
        status: mapCalculatedStatus(inst.calculated_status),
        calculated_status: inst.calculated_status,
        amount_paid: inst.amount_paid,
        paid_at: inst.paid_at,
        payment_date: inst.payment_date,
      })) || []

    const todayInstallments = transformedInstallments.filter(
      (inst) => inst.calculated_status === "a_pagar_hoy" && !inst.amount_paid,
    )

    const overdueInstallments = transformedInstallments.filter(
      (inst) => inst.calculated_status === "con_mora" && !inst.amount_paid,
    )

    const monthInstallments = transformedInstallments.filter((inst) => {
      const dueDate = inst.due_date
      return dueDate >= startOfMonth && dueDate <= endOfMonth && !inst.amount_paid
    })

    console.log("[v0] Today installments (a_pagar_hoy):", todayInstallments.length)
    console.log("[v0] Overdue installments (con_mora):", overdueInstallments.length)
    console.log("[v0] Month installments:", monthInstallments.length)

    const { data: todayReceipts, error: receiptsError } = await supabase
      .from("receipts")
      .select(`
        id,
        receipt_number,
        total_amount,
        receipt_date,
        payment_type,
        observations,
        selected_loans,
        client_id,
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
      console.error("Error fetching today receipts:", receiptsError)
    }

    const { data: monthReceipts, error: monthReceiptsError } = await supabase
      .from("receipts")
      .select("total_amount")
      .gte("receipt_date", startOfMonth)
      .lte("receipt_date", endOfMonth)

    if (monthReceiptsError) {
      console.error("Error fetching month receipts:", monthReceiptsError)
    }

    const totalReceivedToday = todayReceipts?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0
    const totalReceivedMonth = monthReceipts?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0

    console.log("[v0] Today receipts found:", todayReceipts?.length || 0, "Total amount:", totalReceivedToday)
    console.log("[v0] Month receipts total amount:", totalReceivedMonth)

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
      todayReceipts: todayReceipts || [],
      summary,
      debug: {
        total_installments: transformedInstallments.length,
        argentina_time: today,
        installments_by_status: {
          a_vencer: transformedInstallments.filter((i) => i.calculated_status === "a_vencer").length,
          a_pagar_hoy: transformedInstallments.filter((i) => i.calculated_status === "a_pagar_hoy").length,
          con_mora: transformedInstallments.filter((i) => i.calculated_status === "con_mora").length,
          pagadas: transformedInstallments.filter((i) => i.calculated_status === "pagadas").length,
          pagadas_anticipadas: transformedInstallments.filter((i) => i.calculated_status === "pagadas_anticipadas")
            .length,
          pagadas_con_mora: transformedInstallments.filter((i) => i.calculated_status === "pagadas_con_mora").length,
        },
      },
    })
  } catch (error) {
    console.error("Error in cronograma API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function mapCalculatedStatus(calculatedStatus: string): string {
  switch (calculatedStatus) {
    case "a_vencer":
      return "pending"
    case "a_pagar_hoy":
      return "due_today"
    case "con_mora":
      return "overdue"
    case "pagadas":
    case "pagadas_anticipadas":
    case "pagadas_con_mora":
      return "paid"
    default:
      return "pending"
  }
}
