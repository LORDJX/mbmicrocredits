import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin()
    const loanId = params.id

    // Get installments with status
    const { data: installments, error: installmentsError } = await supabase
      .from("installments_with_status")
      .select("*")
      .eq("loan_id", loanId)
      .order("installment_no")

    if (installmentsError) {
      return NextResponse.json({ detail: `Error obteniendo cronograma: ${installmentsError.message}` }, { status: 500 })
    }

    // Calculate totals
    const totals = installments?.reduce(
      (acc, installment) => {
        acc.total_due += Number(installment.amount_due)
        acc.total_paid += Number(installment.amount_paid)

        switch (installment.status) {
          case "VENCIDA":
            acc.count_overdue++
            break
          case "A_PAGAR_HOY":
            acc.count_due_today++
            break
          case "A_PAGAR":
            acc.count_future++
            break
          case "PAGADA_EN_FECHA":
            acc.count_paid_ontime++
            break
          case "PAGO_ANTICIPADO":
            acc.count_paid_early++
            break
          case "PAGADA_CON_MORA":
            acc.count_paid_late++
            break
        }

        return acc
      },
      {
        total_due: 0,
        total_paid: 0,
        count_overdue: 0,
        count_due_today: 0,
        count_future: 0,
        count_paid_ontime: 0,
        count_paid_early: 0,
        count_paid_late: 0,
      },
    ) || {
      total_due: 0,
      total_paid: 0,
      count_overdue: 0,
      count_due_today: 0,
      count_future: 0,
      count_paid_ontime: 0,
      count_paid_early: 0,
      count_paid_late: 0,
    }

    return NextResponse.json({
      installments: installments || [],
      totals,
    })
  } catch (e: any) {
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}
