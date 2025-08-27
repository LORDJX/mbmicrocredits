import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Iniciando carga de datos de informes financieros")
    const supabase = createAdminClient()

    const { data: allLoans, error: loansError } = await supabase.from("loans").select("*")

    if (loansError) {
      console.error("[v0] Error al obtener préstamos:", loansError)
      throw loansError
    }

    const { data: allClients, error: clientsError } = await supabase.from("clients").select("*")

    if (clientsError) {
      console.error("[v0] Error al obtener clientes:", clientsError)
      throw clientsError
    }

    const { data: allPartners, error: partnersError } = await supabase.from("partners").select("*")

    if (partnersError) {
      console.error("[v0] Error al obtener socios:", partnersError)
      throw partnersError
    }

    const { data: allReceipts, error: receiptsError } = await supabase.from("receipts").select("*")

    if (receiptsError) {
      console.error("[v0] Error al obtener recibos:", receiptsError)
      throw receiptsError
    }

    const totalLoans = allLoans?.length || 0
    const totalLoanAmount = allLoans?.reduce((sum, loan) => sum + (loan.amount || 0), 0) || 0
    const totalClients = allClients?.length || 0
    const totalPartners = allPartners?.length || 0
    const totalPartnerCapital = allPartners?.reduce((sum, partner) => sum + (partner.capital || 0), 0) || 0
    const totalIncome = allReceipts?.reduce((sum, receipt) => sum + (receipt.total_amount || 0), 0) || 0
    const totalExpenses = 20000.25 // Valor fijo por ahora, se puede obtener de una tabla de gastos
    const netBalance = totalIncome - totalExpenses

    const loansByType =
      allLoans?.reduce((acc: any, loan) => {
        const type = loan.loan_type || "Semanal"
        if (!acc[type]) {
          acc[type] = { count: 0, amount: 0 }
        }
        acc[type].count += 1
        acc[type].amount += loan.amount || 0
        return acc
      }, {}) || {}

    const reportData = {
      totalLoans,
      totalLoanAmount,
      totalClients,
      totalPartners,
      totalPartnerCapital,
      totalIncome,
      totalExpenses,
      netBalance,
      loansByType,
    }

    console.log("[v0] Datos de informe calculados:", reportData)
    return NextResponse.json(reportData, { status: 200 })
  } catch (error: any) {
    console.error("[v0] Error en API de informes:", error)
    return NextResponse.json({ error: "Error al obtener datos de informes", details: error.message }, { status: 500 })
  }
}
