import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Cronograma API - Iniciando consulta de datos reales...")
    const supabase = await createClient()

    // Obtener fecha actual en zona horaria de Argentina (UTC-3)
    const now = new Date()
    const argentinaOffset = -3 * 60 // UTC-3 en minutos
    const argentinaTime = new Date(now.getTime() + argentinaOffset * 60 * 1000)
    const today = argentinaTime.toISOString().split("T")[0]

    // Calcular inicio y fin del mes actual
    const startOfMonth = new Date(argentinaTime.getFullYear(), argentinaTime.getMonth(), 1)
    const endOfMonth = new Date(argentinaTime.getFullYear(), argentinaTime.getMonth() + 1, 0)
    const startOfMonthStr = startOfMonth.toISOString().split("T")[0]
    const endOfMonthStr = endOfMonth.toISOString().split("T")[0]

    console.log("[v0] Cronograma API - Today (Argentina):", today)
    console.log("[v0] Cronograma API - Start of month:", startOfMonthStr)
    console.log("[v0] Cronograma API - End of month:", endOfMonthStr)

    const { data: installments, error: installmentsError } = await supabase
      .from("installments_with_calculated_status")
      .select("*")
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
          if (dueDateObj > todayObj) return "pagadas_anticipadas"
          if (dueDateObj < todayObj) return "pagadas_con_mora"
          return "pagadas"
        case "con_mora":
          return "con_mora"
        case "pendiente":
          if (dueDate === today) return "a_pagar_hoy"
          if (dueDateObj > todayObj) return "a_vencer"
          return "con_mora" // Pendiente pero vencida = con mora
        default:
          return "pendiente"
      }
    }

    const todayInstallments = installments.filter((inst) => {
      const status = mapStatus(inst.calculated_status, inst.due_date)
      return status === "a_pagar_hoy" && inst.calculated_status !== "pagada"
    })

    const overdueInstallments = installments.filter((inst) => {
      const status = mapStatus(inst.calculated_status, inst.due_date)
      return status === "con_mora" && inst.calculated_status !== "pagada"
    })

    const monthInstallments = installments.filter((inst) => {
      const dueDate = inst.due_date
      const isInMonth = dueDate >= startOfMonthStr && dueDate <= endOfMonthStr
      const isNotPaid = inst.calculated_status !== "pagada"
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

    const { data: monthReceipts } = await supabase
      .from("receipts")
      .select("total_amount")
      .gte("receipt_date", startOfMonthStr)
      .lte("receipt_date", endOfMonthStr)

    if (receiptsError) {
      console.error("[v0] Error fetching receipts:", receiptsError)
    }

    // Calcular totales
    const totalReceivedToday = (todayReceipts || []).reduce((sum, r) => sum + (r.total_amount || 0), 0)
    const totalReceivedMonth = (monthReceipts || []).reduce((sum, r) => sum + (r.total_amount || 0), 0)

    const summary = {
      total_due_today: todayInstallments.reduce((sum, inst) => sum + (inst.amount_due || 0), 0),
      total_received_today: totalReceivedToday,
      total_overdue: overdueInstallments.reduce((sum, inst) => sum + (inst.amount_due || 0), 0),
      total_received_month: totalReceivedMonth,
      total_due_month: monthInstallments.reduce((sum, inst) => sum + (inst.amount_due || 0), 0),
    }

    // Contar cuotas por estado para debug
    const installmentsByStatus = {
      a_vencer: 0,
      a_pagar_hoy: 0,
      con_mora: 0,
      pagadas: 0,
      pagadas_anticipadas: 0,
      pagadas_con_mora: 0,
    }

    installments.forEach((inst) => {
      const status = mapStatus(inst.calculated_status, inst.due_date)
      if (installmentsByStatus.hasOwnProperty(status)) {
        installmentsByStatus[status as keyof typeof installmentsByStatus]++
      }
    })

    console.log("[v0] Today installments:", todayInstallments.length)
    console.log("[v0] Overdue installments:", overdueInstallments.length)
    console.log("[v0] Month installments:", monthInstallments.length)
    console.log("[v0] Today receipts:", (todayReceipts || []).length, "Total:", totalReceivedToday)

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
        installments_by_status: installmentsByStatus,
      },
    })
  } catch (error) {
    console.error("Error in cronograma API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
