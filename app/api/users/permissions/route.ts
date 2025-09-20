import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  console.log("[v0] API permissions called")

  const userId = request.nextUrl.searchParams.get("userId") || request.nextUrl.searchParams.get("user_id")
  console.log("[v0] UserId from params:", userId)

  if (!userId) {
    console.log("[v0] No userId provided")
    return NextResponse.json({ detail: "Falta el parámetro userId." }, { status: 400 })
  }

  const response = {
    available_routes: [
      { id: "dashboard", path: "/dashboard", name: "Dashboard Principal" },
      { id: "clients", path: "/dashboard/clients", name: "Gestión de Clientes" },
      { id: "loans", path: "/dashboard/loans", name: "Gestión de Préstamos" },
      { id: "cronograma", path: "/dashboard/cronograma", name: "Cronograma" },
    ],
    permissions: ["dashboard", "clients", "loans", "cronograma"],
    user_routes: ["/dashboard", "/dashboard/clients", "/dashboard/loans", "/dashboard/cronograma"],
    message: "API funcionando correctamente - respuesta de prueba",
    userId: userId,
    timestamp: new Date().toISOString(),
  }

  console.log("[v0] Returning response:", response)
  return NextResponse.json(response, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  })
}

export async function POST(request: NextRequest) {
  console.log("[v0] API permissions POST called")
  return NextResponse.json({ message: "POST funcionando correctamente" }, { status: 200 })
}
