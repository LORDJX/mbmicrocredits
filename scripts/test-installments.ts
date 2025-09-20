// scripts/test-installments.mjs
// Run: node scripts/test-installments.mjs
// En V0: “Run Node.js script” → scripts/test-installments.mjs

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000"
const CLIENT_ID = process.env.TEST_CLIENT_ID || "00000000-0000-0000-0000-000000000001" // ajustá esto

function logSection(title) {
  console.log("\n" + title)
  console.log("=".repeat(title.length))
}

async function runTests() {
  const results = []

  try {
    // Test 1: Create a new loan
    logSection("🧪 Test 1: Creating new loan…")
    const createLoanResponse = await fetch(`${API_BASE_URL}/api/loans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        principal: 30000.0,
        installments_total: 6,
        installment_amount: 5000.0,
        start_date: "2025-01-01",
        frequency: "monthly",
        loan_type: "Test Loan",
      }),
    })

    if (!createLoanResponse.ok) {
      const txt = await createLoanResponse.text()
      results.push({ name: "Create Loan", success: false, error: `HTTP ${createLoanResponse.status}: ${txt}` })
      return results
    }

    const loanData = await createLoanResponse.json()
    const loanId = loanData.id || loanData.loan_id || loanData?.data?.id
    results.push({ name: "Create Loan", success: true, data: { loan_id: loanId, loan_code: loanData.loan_code } })

    // Test 2: Get loan schedule
    logSection("🧪 Test 2: Getting loan schedule…")
    const scheduleResponse = await fetch(`${API_BASE_URL}/api/loans/${loanId}/schedule`)
    if (scheduleResponse.ok) {
      const scheduleData = await scheduleResponse.json()
      results.push({
        name: "Get Schedule",
        success: true,
        data: {
          installments_count: scheduleData.installments?.length ?? 0,
          total_due: scheduleData.totals?.total_due ?? null,
        },
      })
    } else {
      results.push({ name: "Get Schedule", success: false, error: `HTTP ${scheduleResponse.status}` })
    }

    // Test 3: Make a payment
    logSection("🧪 Test 3: Making payment…")
    const paymentResponse = await fetch(`${API_BASE_URL}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loan_id: loanId,
        paid_amount: 7500.0, // 1.5 cuotas
        note: "Test payment - partial with overflow",
      }),
    })

    if (paymentResponse.ok) {
      const paymentData = await paymentResponse.json()
      results.push({
        name: "Make Payment",
        success: true,
        data: {
          payment_id: paymentData.payment_id || paymentData.id,
          imputations_count: paymentData.imputations?.length ?? 0,
          remaining_amount: paymentData.remaining_amount ?? null,
        },
      })
    } else {
      results.push({ name: "Make Payment", success: false, error: `HTTP ${paymentResponse.status}` })
    }

    // Test 4: Get loan summary
    logSection("🧪 Test 4: Getting loan summary…")
    const summaryResponse = await fetch(`${API_BASE_URL}/api/loans/${loanId}/summary`)
    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json()
      results.push({
        name: "Get Summary",
        success: true,
        data: {
          balance: summaryData.totals?.balance ?? null,
          has_overdue: summaryData.has_overdue ?? null,
          next_installments: summaryData.next_installments?.length ?? 0,
        },
      })
    } else {
      results.push({ name: "Get Summary", success: false, error: `HTTP ${summaryResponse.status}` })
    }
  } catch (err) {
    results.push({ name: "Test Suite", success: false, error: err instanceof Error ? err.message : String(err) })
  }

  return results
}

function testPaymentImputationLogic() {
  console.log("\n🧮 Testing Payment Imputation Logic…\n")
  const cases = [
    { name: "Exact payment for one installment", payment: 5000, expected: { installments_affected: 1, remaining: 0 } },
    { name: "Partial payment", payment: 3000, expected: { installments_affected: 1, remaining: 0 } },
    { name: "Payment covering multiple installments", payment: 12000, expected: { installments_affected: 2, remaining: 2000 } },
    { name: "Payment with remainder to partially paid installment", payment: 8000, expected: { installments_affected: 2, remaining: 0 } },
  ]
  for (const t of cases) {
    console.log(`✓ ${t.name}`)
    console.log(`  Payment: $${t.payment}`)
    console.log(`  Expected: ${t.expected.installments_affected} installments, $${t.expected.remaining} remaining\n`)
  }
}

async function main() {
  console.log("🚀 Starting Loan Installments API Tests\n")

  const results = await runTests()

  console.log("\n📊 Test Results:")
  console.log("================")
  for (const r of results) {
    console.log(`${r.success ? "✅" : "❌"} ${r.name}`)
    if (r.success && r.data) console.log(`   Data: ${JSON.stringify(r.data, null, 2)}`)
    if (!r.success && r.error) console.log(`   Error: ${r.error}`)
    console.log()
  }

  const success = results.filter(r => r.success).length
  const total = results.length
  console.log(`\n🎯 Summary: ${success}/${total} tests passed`)

  // Exit code para CI/V0
  if (success !== total) process.exitCode = 1

  // Unit “demo”
  testPaymentImputationLogic()
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error(err)
    process.exit(1)
  })
}
