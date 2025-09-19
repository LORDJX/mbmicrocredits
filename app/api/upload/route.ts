import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

function getAdminClient() {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor.")
  }
  return createClient(url, serviceKey)
}

export async function POST(request: Request) {
  try {
    const supabase = getAdminClient()
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const hint = (formData.get("hint") as string) || "dni"
    const clientId = (formData.get("clientId") as string) || "new"
    const bucket = "dni-photos"

    if (!file) {
      return NextResponse.json({ detail: "Archivo no recibido." }, { status: 400 })
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ detail: "Solo se permiten imágenes." }, { status: 400 })
    }

    // Crear bucket público si no existe
    // si existe, el error se ignora
    await supabase.storage.createBucket(bucket, { public: true }).catch(() => {})

    const ext = file.name.split(".").pop() || "jpg"
    const fileName = `${clientId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${hint}.${ext}`
    const { error: upErr } = await supabase.storage.from(bucket).upload(fileName, file, {
      upsert: true,
      contentType: file.type,
    })
    if (upErr) {
      return NextResponse.json(
        { detail: "Error al subir archivo", error: { message: upErr.message, name: upErr.name } },
        { status: 500 },
      )
    }

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(fileName)
    return NextResponse.json({ url: pub.publicUrl, path: fileName }, { status: 201 })
  } catch (err: any) {
    console.error("❌ Error en POST /api/upload:", err)
    return NextResponse.json({ detail: String(err) }, { status: 500 })
  }
}
