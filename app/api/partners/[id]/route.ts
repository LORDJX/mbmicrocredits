import { NextResponse } from "next/server"

const API_BASE_URL = process.env.API_BASE_URL

if (!API_BASE_URL) {
  console.error("API_BASE_URL no está definida. Por favor, configúrala en tus variables de entorno.")
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const url = `${API_BASE_URL}/partners/${id}`

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
    console.error(`Error al proxy GET /api/partners/${id}:`, error)
    return NextResponse.json({ detail: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const url = `${API_BASE_URL}/partners/${id}`

  try {
    const body = await request.json()
    const response = await fetch(url, {
      method: "PATCH",
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
    return NextResponse.json(data)
  } catch (error: any) {
    console.error(`Error al proxy PATCH /api/partners/${id}:`, error)
    return NextResponse.json({ detail: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const url = `${API_BASE_URL}/partners/${id}`

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: request.headers.get("Authorization") || "",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }))
      return NextResponse.json(errorData, { status: response.status })
    }

    // Para 204 No Content, response.json() fallará.
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error(`Error al proxy DELETE /api/partners/${id}:`, error)
    return NextResponse.json({ detail: "Error interno del servidor" }, { status: 500 })
  }
}
