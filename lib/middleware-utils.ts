import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // Implementación simplificada para el entorno v0
  // No requiere dependencias de Supabase SSR

  const response = NextResponse.next({
    request,
  })

  // En el entorno v0, la autenticación se maneja completamente del lado del cliente
  // Permitir todas las rutas sin verificación del lado del servidor
  return response
}
