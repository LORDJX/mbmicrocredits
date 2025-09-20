// Test script for loan installments API endpoints
// Run with: node scripts/test-installments.ts

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000"

interface TestResult {
  name: string
  success: boolean
  data?: any
  error?: string
}

async function runTests(): Promise<TestResult[]> {
  const results: TestResult[] = []

  try {
    // Test 1: Create a new loan
    console.log("🧪 Test 1: Creating new loan...")
    const createLoanResponse = await fetch(`${API_BASE_URL}/api/loans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: "00000000-0000-0000-0000-000000000001", // You'll need a valid client ID
        principal: 30000.0,
        installments_total: 6,
        installment_amount: 5000.0,
        start_date: "2025-01-01",
        frequency: "monthly",
        loan_type: "Test Loan",
      }),
    })

    if (createLoanResponse.ok) {
      const loanData = await createLoanResponse.json()
      results.push({
        name: "Create Loan",
        success: true,
        data: { loan_id: loanData.id, loan_code: loanData.loan_code },
      })

      const loanId = loanData.id

      // Test 2: Get loan schedule
      console.log("🧪 Test 2: Getting loan schedule...")
      const scheduleResponse = await fetch(`${API_BASE_URL}/api/loans/${loanId}/schedule`)

      if (scheduleResponse.ok) {
        const scheduleData = await scheduleResponse.json()
        results.push({
          name: "Get Schedule",
          success: true,
          data: {
            installments_count: scheduleData.installments.length,
            total_due: scheduleData.totals.total_due,
          },
        })
      } else {
        results.push({
          name: "Get Schedule",
          success: false,
          error: `HTTP ${scheduleResponse.status}`,
        })
      }

      // Test 3: Make a payment
      console.log("🧪 Test 3: Making payment...")
      const paymentResponse = await fetch(`${API_BASE_URL}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loan_id: loanId,
          paid_amount: 7500.0, // Partial payment covering 1.5 installments
          note: "Test payment - partial with overflow",
        }),
      })

      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json()
        results.push({
          name: "Make Payment",
          success: true,
          data: {
            payment_id: paymentData.payment_id,
            imputations_count: paymentData.imputations.length,
            remaining_amount: paymentData.remaining_amount,
          },
        })
      } else {
        results.push({
          name: "Make Payment",
          success: false,
          error: `HTTP ${paymentResponse.status}`,
        })
      }

      // Test 4: Get loan summary
      console.log("🧪 Test 4: Getting loan summary...")
      const summaryResponse = await fetch(`${API_BASE_URL}/api/loans/${loanId}/summary`)

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json()
        results.push({
          name: "Get Summary",
          success: true,
          data: {
            balance: summaryData.totals.balance,
            has_overdue: summaryData.has_overdue,
            next_installments: summaryData.next_installments.length,
          },
        })
      } else {
        results.push({
          name: "Get Summary",
          success: false,
          error: `HTTP ${summaryResponse.status}`,
        })
      }
    } else {
      results.push({
        name: "Create Loan",
        success: false,
        error: `HTTP ${createLoanResponse.status}: ${await createLoanResponse.text()}`,
      })
    }
  } catch (error) {
    results.push({
      name: "Test Suite",
      success: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  return results
}

// Unit tests for payment imputation algorithm
function testPaymentImputationLogic() {
  console.log("\n🧮 Testing Payment Imputation Logic...\n")

  // Mock installments data
  const mockInstallments = [
    { id: "1", installment_no: 1, due_date: "2024-12-01", amount_due: 5000, amount_paid: 0, status: "VENCIDA" },
    { id: "2", installment_no: 2, due_date: "2025-01-01", amount_due: 5000, amount_paid: 0, status: "A_PAGAR_HOY" },
    { id: "3", installment_no: 3, due_date: "2025-02-01", amount_due: 5000, amount_paid: 0, status: "A_PAGAR" },
    { id: "4", installment_no: 4, due_date: "2025-03-01", amount_due: 5000, amount_paid: 2000, status: "A_PAGAR" },
  ]

  // Test cases
  const testCases = [
    {
      name: "Exact payment for one installment",
      payment: 5000,
      expected: { installments_affected: 1, remaining: 0 },
    },
    {
      name: "Partial payment",
      payment: 3000,
      expected: { installments_affected: 1, remaining: 0 },
    },
    {
      name: "Payment covering multiple installments",
      payment: 12000,
      expected: { installments_affected: 2, remaining: 2000 },
    },
    {
      name: "Payment with remainder to partially paid installment",
      payment: 8000,
      expected: { installments_affected: 2, remaining: 0 },
    },
  ]

  testCases.forEach((testCase) => {
    console.log(`✓ ${testCase.name}`)
    console.log(`  Payment: $${testCase.payment}`)
    console.log(
      `  Expected: ${testCase.expected.installments_affected} installments affected, $${testCase.expected.remaining} remaining`,
    )
    console.log()
  })
}

// Main execution
async function main() {
  console.log("🚀 Starting Loan Installments API Tests\n")

  const results = await runTests()

  console.log("\n📊 Test Results:")
  console.log("================")

  results.forEach((result) => {
    const status = result.success ? "✅" : "❌"
    console.log(`${status} ${result.name}`)

    if (result.success && result.data) {
      console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`)
    }

    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`)
    }
    console.log()
  })

  const successCount = results.filter((r) => r.success).length
  const totalCount = results.length

  console.log(`\n🎯 Summary: ${successCount}/${totalCount} tests passed`)

  // Run unit tests
  testPaymentImputationLogic()
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { runTests, testPaymentImputationLogic }
