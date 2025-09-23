import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const viewMode = searchParams.get("view") || "current"
    const dateRange = searchParams.get("dateRange") || "current_month"
    const statusFilter = searchParams.get("status") || "all"
    const searchQuery = searchParams.get("search") || ""

    const today = new Date()
    const argentinaTime = new Date(today.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }))
    const todayStr = argentinaTime.toISOString().split("T")[0]

    console.log("[v0] Cronograma API - Iniciando consulta de datos reales...")
    console.log("[v0] Cronograma API - Today (Argentina):", todayStr)
    console.log("[v0] Cronograma API - View mode:", viewMode)
    console.log("[v0] Cronograma API - Date range:", dateRange)

    // Calculate date ranges based on parameters
    let startDate: string, endDate: string

    if (dateRange === "current_month") {
      const startOfMonth = new Date(argentinaTime.getFullYear(), argentinaTime.getMonth(), 1)
      const endOfMonth = new Date(argentinaTime.getFullYear(), argentinaTime.getMonth() + 1, 0)
      startDate = startOfMonth.toISOString().split("T")[0]
      endDate = endOfMonth.toISOString().split("T")[0]
    } else if (dateRange === "last_month") {
      const startOfLastMonth = new Date(argentinaTime.getFullYear(), argentinaTime.getMonth() - 1, 1)
      const endOfLastMonth = new Date(argentinaTime.getFullYear(), argentinaTime.getMonth(), 0)
      startDate = startOfLastMonth.toISOString().split("T")[0]
      endDate = endOfLastMonth.toISOString().split("T")[0]
    } else if (dateRange === "custom") {
      startDate = searchParams.get("startDate") || todayStr
      endDate = searchParams.get("endDate") || todayStr
    } else {
      // Default to current month
      const startOfMonth = new Date(argentinaTime.getFullYear(), argentinaTime.getMonth(), 1)
      const endOfMonth = new Date(argentinaTime.getFullYear(), argentinaTime.getMonth() + 1, 0)
      startDate = startOfMonth.toISOString().split("T")[0]
      endDate = endOfMonth.toISOString().split("T")[0]
    }

    console.log("[v0] Cronograma API - Start date:", startDate)
    console.log("[v0] Cronograma API - End date:", endDate)

    let query = supabase.from("installments_with_status").select(`
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

    // Apply date filtering based on view mode
    if (viewMode === "current") {
      query = query.gte("due_date", startDate).lte("due_date", endDate)
    } else if (viewMode === "historical") {
      query = query.gte("due_date", startDate).lte("due_date", endDate).not("paid_at", "is", null) // Only show paid installments for historical view
    }
    // For "all" mode, no date filtering is applied

    // Apply status filtering
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter)
    }

    // Apply search query filtering
    if (searchQuery) {
      query = query.ilike("code", `%${searchQuery}%`)
    }

    const { data: installments, error: installmentsError } = await query.order("due_date", { ascending: false })

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
        upcoming: [],
        paid: [],
        todayReceipts: [],
        summary: {
          total_due_today: 0,
          total_received_today: 0,
          total_overdue: 0,
          total_received_month: 0,
          total_due_month: 0,
          total_upcoming: 0,
          total_paid: 0,
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
      try {
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

        if (loan && loan.clients) {
          enrichedInstallments.push({
            ...installment,
            loan_code: loan.loan_code || installment.code || "",
            client_id: loan.client_id,
            client_name:
              `${loan.clients.first_name || ""} ${loan.clients.last_name || ""}`.trim() || "Cliente Desconocido",
            first_name: loan.clients.first_name || "",
            last_name: loan.clients.last_name || "",
          })
        } else {
          // Include installment even if loan data is missing
          enrichedInstallments.push({
            ...installment,
            loan_code: installment.code || "N/A",
            client_id: null,
            client_name: "Cliente Desconocido",
            first_name: "",
            last_name: "",
          })
        }
      } catch (error) {
        console.error("[v0] Error enriching installment:", installment.id, error)
        // Include installment with minimal data
        enrichedInstallments.push({
          ...installment,
          loan_code: installment.code || "N/A",
          client_id: null,
          client_name: "Error al cargar cliente",
          first_name: "",
          last_name: "",
        })
      }
    }

    console.log("[v0] Enriched installments:", enrichedInstallments.length)

    const processedInstallments = enrichedInstallments.map((installment) => {
      const dueDate = new Date(installment.due_date)
      const isPaid = (installment.amount_paid || 0) > 0 || installment.paid_at

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
        loan_code: installment.loan_code || installment.code || "",
        client_id: installment.client_id,
        client_name: installment.client_name || "Cliente Desconocido",
        installment_number: installment.installment_no || 0,
        total_installments: installment.installments_total || 0,
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

    const { data: rangeReceipts } = await supabase
      .from("receipts")
      .select("total_amount, receipt_date")
      .gte("receipt_date", startDate)
      .lte("receipt_date", endDate)

    const totalReceivedToday = todayReceipts?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0
    const totalReceivedRange = rangeReceipts?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0

    const summary = {
      total_due_today: todayInstallments.reduce((sum, inst) => sum + (inst.amount || 0), 0),
      total_received_today: totalReceivedToday,
      total_overdue: overdueInstallments.reduce((sum, inst) => sum + (inst.amount || 0), 0),
      total_received_month: totalReceivedRange,
      total_due_month: processedInstallments
        .filter(
          (inst) =>
            !inst.paid_at &&
            new Date(inst.due_date) >= new Date(startDate) &&
            new Date(inst.due_date) <= new Date(endDate),
        )
        .reduce((sum, inst) => sum + (inst.amount || 0), 0),
      total_upcoming: upcomingInstallments.reduce((sum, inst) => sum + (inst.amount || 0), 0),
      total_paid: paidInstallments.reduce((sum, inst) => sum + (inst.amount || 0), 0),
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

    console.log("[v0] Today installments:", todayInstallments.length)
    console.log("[v0] Overdue installments:", overdueInstallments.length)
    console.log("[v0] Upcoming installments:", upcomingInstallments.length)
    console.log("[v0] Paid installments:", paidInstallments.length)
    console.log("[v0] Today receipts:", todayReceipts?.length || 0, "Total:", totalReceivedToday)

    return NextResponse.json({
      success: true,
      today: todayInstallments,
      overdue: overdueInstallments,
      upcoming: upcomingInstallments,
      paid: paidInstallments,
      todayReceipts: todayReceipts || [],
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
