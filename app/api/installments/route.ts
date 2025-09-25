// /api/installments/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const searchParams = request.nextUrl.searchParams;
    const loanId = searchParams.get("loan_id");
    
    // Si no se proporciona un ID de préstamo, devolvemos un error 400
    if (!loanId) {
      return NextResponse.json({ detail: "loan_id es un parámetro requerido." }, { status: 400 });
    }

    // Consulta las cuotas de un préstamo específico.
    const { data, error } = await supabase
      .from("installments")
      .select(`
        id,
        installment_no,
        due_date,
        amount_due,
        amount_paid,
        status
      `)
      .eq("loan_id", loanId)
      // Filtramos las cuotas que no se han pagado completamente
      .filter("amount_paid", "lt", supabase.raw("amount_due")) 
      .order("due_date", { ascending: true });

    if (error) {
      console.error("[v0] Error fetching installments from DB:", error);
      return NextResponse.json({ detail: `Error al obtener las cuotas: ${error.message}` }, { status: 500 });
    }

    // Devolvemos los datos como JSON, o un array vacío si no se encuentran
    return NextResponse.json(data || [], { status: 200 });
  } catch (e: any) {
    console.error("[v0] Unexpected error in GET /api/installments:", e);
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 });
  }
}
