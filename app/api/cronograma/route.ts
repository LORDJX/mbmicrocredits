import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    const now = new Date()
    const argentinaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }))
    const today = argentinaTime.toISOString().split("T")[0]
    const startOfMonth = new Date(argentinaTime.getFullYear(), argentinaTime.getMonth(), 1).toISOString().split("T")[0]
    const endOfMonth = new Date(argentinaTime.getFullYear(), argentinaTime.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0]

    console.log("[v0] Cronograma API - Argentina Time:", argentinaTime.toISOString())
    console.log("[v0] Cronograma API - Today:", today)
    console.log("[v0] Cronograma API - Start of month:", startOfMonth)
    console.log("[v0] Cronograma API - End of month:", endOfMonth)

    const { data: installmentsData, error: installmentsError } = await supabase
      .from("installments_with_calculated_status")
      .select("*")
      .order("due_date", { ascending: true })

    if (installmentsError) {
      console.error("Error fetching installments:", installmentsError)
      return NextResponse.json({ error: "Error fetching installments" }, { status: 500 })
    }

    console.log("[v0] Total installments found:", installmentsData?.length || 0)

    const { data: receiptsData, error: receiptsError } = await supabase
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
      .order("created_at", { ascending: false })

    if (receiptsError) {
      console.error("Error fetching receipts:", receiptsError)
    }

    const paidInstallmentKeys = new Set<string>()
    receiptsData?.forEach((receipt) => {
      if (receipt.selected_loans) {
        receipt.selected_loans.forEach((loan: any) => {
          if (loan.loan_code && loan.installment_number) {
            paidInstallmentKeys.add(`${loan.loan_code}-${loan.installment_number}`)
          }
        })
      }
    })

    console.log("[v0] Paid installments from receipts:", paidInstallmentKeys.size)

    const todayInstallments =
      installmentsData?.filter((inst) => {
        const key = `${inst.loan_code}-${inst.installment_no}`
        const isNotPaid = !paidInstallmentKeys.has(key)
        return inst.calculated_status === "a_pagar_hoy" && isNotPaid
      }) || []

    const overdueInstallments =
      installmentsData?.filter((inst) => {
        const key = `${inst.loan_code}-${inst.installment_no}`
        const isNotPaid = !paidInstallmentKeys.has(key)
        return inst.calculated_status === "con_mora" && isNotPaid
      }) || []

    const monthInstallments =
      installmentsData?.filter((inst) => {
        const key = `${inst.loan_code}-${inst.installment_no}`
        const isNotPaid = !paidInstallmentKeys.has(key)
        const dueDate = new Date(inst.due_date)
        const isInMonth = dueDate >= new Date(startOfMonth) && dueDate <= new Date(endOfMonth)
        return isInMonth && isNotPaid && !["con_mora"].includes(inst.calculated_status)
      }) || []

    const todayReceipts = receiptsData?.filter((receipt) => receipt.receipt_date === today) || []

    const summary = {
      total_due_today: todayInstallments.reduce((sum, inst) => sum + (inst.amount_due || 0), 0),
      total_received_today: todayReceipts.reduce((sum, receipt) => sum + (receipt.total_amount || 0), 0),
      total_overdue: overdueInstallments.reduce((sum, inst) => sum + (inst.amount_due || 0), 0),
      total_received_month:
        receiptsData
          ?.filter((r) => {
            const receiptDate = new Date(r.receipt_date)
            return receiptDate >= new Date(startOfMonth) && receiptDate <= new Date(endOfMonth)
          })
          .reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0,
      total_due_month: monthInstallments.reduce((sum, inst) => sum + (inst.amount_due || 0), 0),
    }

    const formatInstallment = (inst: any) => ({
      id: inst.id,
      client_id: inst.client_id,
      client_name: inst.client_name,
      loan_code: inst.loan_code,
      installment_number: inst.installment_no,
      total_installments: inst.installments_total,
      amount: inst.amount_due || 0,
      due_date: inst.due_date,
      status:
        inst.calculated_status === "con_mora"
          ? "overdue"
          : inst.calculated_status === "a_pagar_hoy"
            ? "due_today"
            : "pending",
      calculated_status: inst.calculated_status,
    })

    console.log("[v0] Summary calculated:", summary)
    console.log("[v0] Today installments:", todayInstallments.length)
    console.log("[v0] Overdue installments:", overdueInstallments.length)
    console.log("[v0] Month installments:", monthInstallments.length)

    return NextResponse.json({
      success: true,
      today: todayInstallments.map(formatInstallment),
      overdue: overdueInstallments.map(formatInstallment),
      month: monthInstallments.map(formatInstallment),
      todayReceipts: todayReceipts,
      summary,
    })
  } catch (error) {
    console.error("Error in cronograma API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
