import { NextResponse } from "next/server"

const API_BASE_URL = process.env.API_BASE_URL

if (!API_BASE_URL) {
  console.error("API_BASE_URL no está definida. Por favor, configúrala en tus variables de entorno.")
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.toString()
  const url = `${API_BASE_URL}/loans${query ? `?${query}` : ""}`

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: request.headers.get("Authorization") || "",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }))
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error al proxy GET /api/loans:", error)
    return NextResponse.json({ detail: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const url = `${API_BASE_URL}/loans`

  try {
    const body = await request.json()
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: request.headers.get("Authorization") || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }))
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error("Error al proxy POST /api/loans:", error)
    return NextResponse.json({ detail: "Error interno del servidor" }, { status: 500 })
  }
}
