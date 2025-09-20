import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // Implementación simplificada para el entorno v0
  // Sin dependencias de Supabase SSR

  const response = NextResponse.next({
    request,
  })

  // La autenticación se maneja completamente del lado del cliente
  return response
}
