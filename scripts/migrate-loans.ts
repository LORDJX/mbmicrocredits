// Script de Node.js para ejecutar la migración de préstamos existentes
// Este script puede ejecutarse desde la interfaz de v0

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function migrateExistingLoans() {
  console.log("🚀 Iniciando migración de préstamos existentes...")
  console.log("📅 Fecha:", new Date().toLocaleString())
  console.log("")

  try {
    // Obtener reporte pre-migración
    console.log("📊 REPORTE PRE-MIGRACIÓN:")
    const { data: preReport, error: preError } = await supabase.rpc("get_migration_report")

    if (preError) {
      console.error("❌ Error obteniendo reporte pre-migración:", preError)
      return
    }

    if (preReport && preReport.length > 0) {
      const report = preReport[0]
      console.log(`- Total de préstamos: ${report.total_loans}`)
      console.log(`- Préstamos con cuotas: ${report.loans_with_installments}`)
      console.log(`- Préstamos sin cuotas: ${report.loans_without_installments}`)
      console.log(`- Préstamos con errores: ${report.loans_with_errors}`)
      console.log(`- Total cuotas existentes: ${report.total_installments_generated}`)
      console.log("")
    }

    // Ejecutar migración
    console.log("⚙️ EJECUTANDO MIGRACIÓN:")
    const { data: migrationResults, error: migrationError } = await supabase.rpc(
      "migrate_existing_loans_to_installments",
    )

    if (migrationError) {
      console.error("❌ Error ejecutando migración:", migrationError)
      return
    }

    // Procesar resultados
    let totalProcessed = 0
    let totalSuccess = 0
    let totalErrors = 0

    if (migrationResults && migrationResults.length > 0) {
      migrationResults.forEach((result: any) => {
        totalProcessed++

        if (result.status === "SUCCESS") {
          totalSuccess++
          console.log(`✅ ${result.loan_code}: ${result.message}`)
        } else {
          totalErrors++
          console.log(`❌ ${result.loan_code}: ${result.message}`)
        }
      })
    } else {
      console.log("ℹ️ No se encontraron préstamos para migrar")
    }

    console.log("")
    console.log("📈 RESUMEN DE MIGRACIÓN:")
    console.log(`- Préstamos procesados: ${totalProcessed}`)
    console.log(`- Migraciones exitosas: ${totalSuccess}`)
    console.log(`- Errores encontrados: ${totalErrors}`)
    console.log("")

    // Obtener reporte post-migración
    console.log("📊 REPORTE POST-MIGRACIÓN:")
    const { data: postReport, error: postError } = await supabase.rpc("get_migration_report")

    if (postError) {
      console.error("❌ Error obteniendo reporte post-migración:", postError)
      return
    }

    if (postReport && postReport.length > 0) {
      const report = postReport[0]
      console.log(`- Total de préstamos: ${report.total_loans}`)
      console.log(`- Préstamos con cuotas: ${report.loans_with_installments}`)
      console.log(`- Préstamos sin cuotas: ${report.loans_without_installments}`)
      console.log(`- Préstamos con errores: ${report.loans_with_errors}`)
      console.log(`- Total cuotas generadas: ${report.total_installments_generated}`)
    }

    console.log("")
    console.log("🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE")

    // Verificar integridad de datos
    console.log("")
    console.log("🔍 VERIFICANDO INTEGRIDAD DE DATOS:")

    const { data: installmentsCheck, error: checkError } = await supabase
      .from("installments_with_status")
      .select("status, count(*)", { count: "exact" })

    if (checkError) {
      console.error("❌ Error verificando integridad:", checkError)
    } else {
      console.log("✅ Verificación de integridad completada")
      console.log(`- Total de cuotas en el sistema: ${installmentsCheck?.length || 0}`)
    }
  } catch (error) {
    console.error("💥 Error inesperado durante la migración:", error)
  }
}

// Ejecutar migración
migrateExistingLoans()
