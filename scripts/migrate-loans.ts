import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface MigrationResult {
  success: boolean
  loansProcessed: number
  installmentsCreated: number
  errors: string[]
  details: Array<{
    loanId: string
    loanNumber: string
    installmentsCreated: number
    error?: string
  }>
}

async function migrateLoanToInstallments(loanId: string): Promise<{
  success: boolean
  installmentsCreated: number
  error?: string
}> {
  try {
    console.log(`[v0] Migrating loan ${loanId}...`)

    // Call the generate_installments function
    const { data, error } = await supabase.rpc("generate_installments", {
      p_loan_id: loanId,
    })

    if (error) {
      console.log(`[v0] Error generating installments for loan ${loanId}:`, error)
      return {
        success: false,
        installmentsCreated: 0,
        error: error.message,
      }
    }

    // Count the installments created for this loan
    const { count } = await supabase
      .from("installments")
      .select("*", { count: "exact", head: true })
      .eq("loan_id", loanId)

    console.log(`[v0] Successfully created ${count || 0} installments for loan ${loanId}`)

    return {
      success: true,
      installmentsCreated: count || 0,
    }
  } catch (error) {
    console.log(`[v0] Unexpected error migrating loan ${loanId}:`, error)
    return {
      success: false,
      installmentsCreated: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

async function migrateAllLoans(): Promise<MigrationResult> {
  console.log("[v0] Starting loan migration process...")

  const result: MigrationResult = {
    success: true,
    loansProcessed: 0,
    installmentsCreated: 0,
    errors: [],
    details: [],
  }

  try {
    // Get all loans that don't have installments yet
    const { data: loans, error: loansError } = await supabase
      .from("loans")
      .select(`
        id,
        loan_number,
        installments!left(id)
      `)
      .is("installments.id", null)

    if (loansError) {
      console.log("[v0] Error fetching loans:", loansError)
      result.success = false
      result.errors.push(`Error fetching loans: ${loansError.message}`)
      return result
    }

    if (!loans || loans.length === 0) {
      console.log("[v0] No loans found that need migration")
      return result
    }

    console.log(`[v0] Found ${loans.length} loans to migrate`)

    // Process each loan
    for (const loan of loans) {
      const migrationResult = await migrateLoanToInstallments(loan.id)

      result.loansProcessed++
      result.installmentsCreated += migrationResult.installmentsCreated

      const detail = {
        loanId: loan.id,
        loanNumber: loan.loan_number || "N/A",
        installmentsCreated: migrationResult.installmentsCreated,
        error: migrationResult.error,
      }

      result.details.push(detail)

      if (!migrationResult.success) {
        result.success = false
        result.errors.push(`Loan ${loan.loan_number}: ${migrationResult.error}`)
      }
    }

    console.log("[v0] Migration process completed")
    console.log(`[v0] Loans processed: ${result.loansProcessed}`)
    console.log(`[v0] Total installments created: ${result.installmentsCreated}`)
    console.log(`[v0] Errors: ${result.errors.length}`)

    return result
  } catch (error) {
    console.log("[v0] Unexpected error during migration:", error)
    result.success = false
    result.errors.push(`Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`)
    return result
  }
}

// Execute migration
migrateAllLoans()
  .then((result) => {
    console.log("\n=== MIGRATION SUMMARY ===")
    console.log(`Success: ${result.success}`)
    console.log(`Loans processed: ${result.loansProcessed}`)
    console.log(`Installments created: ${result.installmentsCreated}`)
    console.log(`Errors: ${result.errors.length}`)

    if (result.errors.length > 0) {
      console.log("\nErrors encountered:")
      result.errors.forEach((error) => console.log(`- ${error}`))
    }

    console.log("\nDetailed results:")
    result.details.forEach((detail) => {
      const status = detail.error ? "❌ FAILED" : "✅ SUCCESS"
      console.log(
        `${status} Loan ${detail.loanNumber} (${detail.loanId}): ${detail.installmentsCreated} installments${detail.error ? ` - Error: ${detail.error}` : ""}`,
      )
    })

    console.log("\n=== MIGRATION COMPLETE ===")
  })
  .catch((error) => {
    console.error("Fatal error during migration:", error)
  })
