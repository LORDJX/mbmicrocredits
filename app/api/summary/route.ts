import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Iniciando carga de datos de resumen para socios")
    const supabase = createAdminClient()

    const { data: activeLoans, error: loansError } = await supabase.from("loans").select("*").eq("status", "activo")

    if (loansError) {
      console.error("[v0] Error al obtener préstamos activos:", loansError)
      throw loansError
    }

    const { data: clients, error: clientsError } = await supabase.from("clients").select("*").eq("status", "activo")

    if (clientsError) {
      console.error("[v0] Error al obtener clientes:", clientsError)
      throw clientsError
    }

    const { data: partners, error: partnersError } = await supabase.from("partners").select("*").eq("status", "activo")

    if (partnersError) {
      console.error("[v0] Error al obtener socios:", partnersError)
      throw partnersError
    }

    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    const { data: monthlyReceipts, error: receiptsError } = await supabase
      .from("receipts")
      .select("*")
      .gte("created_at", firstDayOfMonth.toISOString())
      .lte("created_at", lastDayOfMonth.toISOString())

    if (receiptsError) {
      console.error("[v0] Error al obtener recibos mensuales:", receiptsError)
      throw receiptsError
    }

    const totalActiveLoans = activeLoans?.length || 0
    const totalActiveLoanAmount = activeLoans?.reduce((sum, loan) => sum + (loan.amount || 0), 0) || 0
    const totalClients = clients?.length || 0
    const totalPartners = partners?.length || 0
    const monthlyIncome = monthlyReceipts?.reduce((sum, receipt) => sum + (receipt.total_amount || 0), 0) || 0
    const monthlyExpenses = 4200.0 // Valor fijo por ahora, se puede obtener de una tabla de gastos
    const profitMargin = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0
    const averageLoanAmount = totalActiveLoans > 0 ? totalActiveLoanAmount / totalActiveLoans : 0

    const summaryData = {
      totalActiveLoans,
      totalActiveLoanAmount,
      totalClients,
      totalPartners,
      monthlyIncome,
      monthlyExpenses,
      profitMargin,
      averageLoanAmount,
    }

    console.log("[v0] Datos de resumen calculados:", summaryData)
    return NextResponse.json(summaryData, { status: 200 })
  } catch (error: any) {
    console.error("[v0] Error en API de resumen:", error)
    return NextResponse.json({ error: "Error al obtener datos de resumen", details: error.message }, { status: 500 })
  }
}
