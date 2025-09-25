// En api/installments/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const searchParams = request.nextUrl.searchParams;
    const loanId = searchParams.get("loan_id");
    
    if (!loanId) {
      return NextResponse.json({ detail: "loan_id es un parámetro requerido." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("installments")
      .select(`
        id,
        installment_no,
        due_date,
        amount_due,
        amount_paid,
        status,
        loans(loan_code, clients(client_code, first_name, last_name))
      `)
      .eq("loan_id", loanId)
      .filter("amount_paid", "lt", supabase.raw("amount_due")) 
      .order("due_date", { ascending: true });

    if (error) {
      console.error("[v0] Error fetching installments from DB:", error);
      return NextResponse.json({ detail: `Error al obtener las cuotas: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (e: any) {
    console.error("[v0] Unexpected error in GET /api/installments:", e);
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 });
  }
}
