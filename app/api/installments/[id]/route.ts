// En api/installments/[id]/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Obtener una cuota por ID
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = params;

    const { data, error } = await supabase
      .from("installments")
      .select(`
        *,
        loans(loan_code, clients(client_code, first_name, last_name))
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching installment with ID ${id}:`, error);
      return NextResponse.json({ detail: `Error al obtener la cuota: ${error.message}` }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ detail: "Cuota no encontrada" }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 });
  }
}

// Actualizar una cuota (ejemplo)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = params;
    const body = await request.json();

    const { data, error } = await supabase
      .from("installments")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating installment with ID ${id}:`, error);
      return NextResponse.json({ detail: `Error al actualizar la cuota: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 });
  }
}

// Eliminar una cuota (ejemplo)
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = params;

    const { error } = await supabase
      .from("installments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting installment with ID ${id}:`, error);
      return NextResponse.json({ detail: `Error al eliminar la cuota: ${error.message}` }, { status: 500 });
    }

    return new Response(null, { status: 204 });
  } catch (e: any) {
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 });
  }
}
