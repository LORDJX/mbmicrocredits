// En api/installments/summary/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Sumar todos los montos adeudados de las cuotas pendientes
    const { data: totalDue, error: errorDue } = await supabase
      .from("installments")
      .select("amount_due")
      .filter("status", "in", "('a_vencer', 'a_pagar_hoy', 'con_mora')");
      
    // Sumar todos los montos pagados de las cuotas pagadas
    const { data: totalPaid, error: errorPaid } = await supabase
      .from("installments")
      .select("amount_paid")
      .filter("status", "in", "('pagada', 'pagada_anticipada', 'pagada_con_mora')");

    if (errorDue || errorPaid) {
      console.error("Error fetching summary data:", errorDue || errorPaid);
      return NextResponse.json({ detail: "Error al obtener el resumen de cuotas" }, { status: 500 });
    }

    const totalAmountDue = totalDue.reduce((sum, item) => sum + item.amount_due, 0);
    const totalAmountPaid = totalPaid.reduce((sum, item) => sum + item.amount_paid, 0);

    return NextResponse.json({
      total_due: totalAmountDue,
      total_paid: totalAmountPaid,
      // Puedes añadir más cálculos aquí
    }, { status: 200 });

  } catch (e: any) {
    console.error("Unexpected error in GET /api/installments/summary:", e);
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 });
  }
}
