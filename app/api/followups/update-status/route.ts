import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * API Route para actualizar manualmente los estados de seguimientos
 * También puede ser llamada por Vercel Cron Jobs
 */
export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Permitir ejecución desde cron job (sin autenticación) o usuarios autenticados
    const authHeader = request.headers.get("authorization")
    const isCronJob = authHeader === `Bearer ${process.env.CRON_SECRET}`

    if (!isCronJob && (authError || !user)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("[v0] Iniciando actualización de estados de seguimientos...")

    // Ejecutar la función SQL que actualiza los estados
    const { error: updateError } = await supabase.rpc("update_followup_status")

    if (updateError) {
      console.error("[v0] Error al actualizar estados:", updateError)
      return NextResponse.json(
        { error: "Error al actualizar estados de seguimientos", details: updateError.message },
        { status: 500 },
      )
    }

    // Obtener estadísticas actualizadas
    const { data: stats, error: statsError } = await supabase.from("v_follow_ups").select("status")

    if (statsError) {
      console.error("[v0] Error al obtener estadísticas:", statsError)
    }

    const statusCounts = stats?.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    console.log("[v0] Estados actualizados correctamente:", statusCounts)

    return NextResponse.json({
      success: true,
      message: "Estados de seguimientos actualizados correctamente",
      timestamp: new Date().toISOString(),
      stats: statusCounts,
    })
  } catch (error) {
    console.error("[v0] Error inesperado:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// Permitir GET para verificar el estado del servicio
export async function GET() {
  return NextResponse.json({
    service: "Followup Status Updater",
    status: "active",
    description: "Actualiza automáticamente los estados de seguimientos basándose en fechas",
    schedule: "Diariamente a las 00:00:30 (UTC-3)",
  })
}
