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

    const { data: installments, error: installmentsError } = await supabase
      .from("installments_with_calculated_status")
      .select(`
        id,
        loan_id,
        installment_number,
        amount,
        due_date,
        status,
        calculated_status,
        loans!inner(
          id,
          client_id,
          loan_code,
          clients!inner(
            id,
            first_name,
            last_name,
            phone
          )
        )
      `)
      .order("due_date", { ascending: true })

    if (installmentsError) {
      console.error("[v0] Error fetching installments:", installmentsError)
      return NextResponse.json({ error: "Error fetching installments" }, { status: 500 })
    }

    console.log("[v0] Total installments found:", installments?.length || 0)

    if (!installments || installments.length === 0) {
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
          // Determinar si fue pagada anticipada, a tiempo o con mora
          if (dueDateObj > todayObj) return "pagadas_anticipadas"
          return "pagadas"
        case "con_mora":
          return "con_mora"
        case "pendiente":
          if (dueDate === today) return "a_pagar_hoy"
          if (dueDateObj < todayObj) return "con_mora"
          return "a_vencer"
        default:
          return "pendiente"
      }
    }

    const processedInstallments = installments.map((inst) => ({
      id: inst.id,
      client_id: inst.loans.client_id,
      client_name: `${inst.loans.clients.first_name} ${inst.loans.clients.last_name}`,
      client_phone: inst.loans.clients.phone,
      loan_code: inst.loans.loan_code,
      installment_number: inst.installment_number,
      amount: inst.amount,
      due_date: inst.due_date,
      status: inst.status,
      calculated_status: inst.calculated_status,
      mapped_status: mapStatus(inst.calculated_status, inst.due_date),
    }))

    const todayInstallments = processedInstallments.filter((inst) => inst.mapped_status === "a_pagar_hoy")

    const overdueInstallments = processedInstallments.filter((inst) => inst.mapped_status === "con_mora")

    const monthInstallments = processedInstallments.filter((inst) => {
      const dueDate = new Date(inst.due_date)
      const isInMonth = dueDate >= startOfMonth && dueDate <= endOfMonth
      const isPending = ["a_vencer", "a_pagar_hoy", "con_mora"].includes(inst.mapped_status)
      return isInMonth && isPending
    })

    const { data: todayReceipts, error: receiptsError } = await supabase
      .from("receipts")
      .select(`
        id,
        amount,
        payment_date,
        payment_method,
        client_id,
        clients!inner(
          id,
          first_name,
          last_name,
          phone
        )
      `)
      .eq("payment_date", today)
      .order("created_at", { ascending: false })

    if (receiptsError) {
      console.error("[v0] Error fetching receipts:", receiptsError)
    }

    const { data: monthReceipts, error: monthReceiptsError } = await supabase
      .from("receipts")
      .select("amount, payment_date")
      .gte("payment_date", startOfMonth.toISOString().split("T")[0])
      .lte("payment_date", endOfMonth.toISOString().split("T")[0])

    if (monthReceiptsError) {
      console.error("[v0] Error fetching month receipts:", monthReceiptsError)
    }

    // Calcular totales
    const totalReceivedToday = (todayReceipts || []).reduce((sum, r) => sum + (r.amount || 0), 0)
    const totalReceivedMonth = (monthReceipts || []).reduce((sum, r) => sum + (r.amount || 0), 0)

    const summary = {
      total_due_today: todayInstallments.reduce((sum, inst) => sum + inst.amount, 0),
      total_received_today: totalReceivedToday,
      total_overdue: overdueInstallments.reduce((sum, inst) => sum + inst.amount, 0),
      total_received_month: totalReceivedMonth,
      total_due_month: monthInstallments.reduce((sum, inst) => sum + inst.amount, 0),
    }

    // Debug info
    const statusCounts = processedInstallments.reduce(
      (acc, inst) => {
        acc[inst.mapped_status] = (acc[inst.mapped_status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    console.log("[v0] Installments by status:", statusCounts)
    console.log("[v0] Today installments:", todayInstallments.length)
    console.log("[v0] Overdue installments:", overdueInstallments.length)
    console.log("[v0] Month installments:", monthInstallments.length)

    return NextResponse.json({
      success: true,
      today: todayInstallments,
      overdue: overdueInstallments,
      month: monthInstallments,
      todayReceipts: todayReceipts || [],
      summary,
      debug: {
        total_installments: installments.length,
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
    console.error("Error in cronograma API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
