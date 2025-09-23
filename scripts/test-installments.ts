// Test script for loan installments API
console.log("[v0] Starting loan installments API tests...")

const API_BASE = process.env.API_BASE_URL || "http://localhost:3000"

async function testAPI() {
  try {
    console.log("[v0] Testing loan creation with installments...")

    // Test 1: Create a loan with installments
    const loanData = {
      client_id: 1, // Assuming client exists from seed data
      amount: 10000,
      interest_rate: 15.5,
      installments: 6,
      frequency: "monthly",
      first_due_date: "2024-02-15",
    }

    console.log("[v0] Creating loan:", loanData)
    const createResponse = await fetch(`${API_BASE}/api/loans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loanData),
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error("[v0] Loan creation failed:", createResponse.status, errorText)
      return
    }

    const loan = await createResponse.json()
    console.log("[v0] Loan created successfully:", loan)

    // Test 2: Get loan schedule
    console.log("[v0] Fetching loan schedule...")
    const scheduleResponse = await fetch(`${API_BASE}/api/loans/${loan.id}/schedule`)

    if (!scheduleResponse.ok) {
      console.error("[v0] Schedule fetch failed:", scheduleResponse.status)
      return
    }

    const schedule = await scheduleResponse.json()
    console.log("[v0] Loan schedule:", schedule)

    // Test 3: Make a payment
    console.log("[v0] Making a payment...")
    const paymentData = {
      loan_id: loan.id,
      amount: 2000,
      payment_date: "2024-02-15",
      payment_method: "cash",
    }

    const paymentResponse = await fetch(`${API_BASE}/api/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    })

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text()
      console.error("[v0] Payment failed:", paymentResponse.status, errorText)
      return
    }

    const payment = await paymentResponse.json()
    console.log("[v0] Payment processed:", payment)

    // Test 4: Get updated loan summary
    console.log("[v0] Fetching loan summary...")
    const summaryResponse = await fetch(`${API_BASE}/api/loans/${loan.id}/summary`)

    if (!summaryResponse.ok) {
      console.error("[v0] Summary fetch failed:", summaryResponse.status)
      return
    }

    const summary = await summaryResponse.json()
    console.log("[v0] Loan summary after payment:", summary)

    console.log("[v0] All tests completed successfully!")
  } catch (error) {
    console.error("[v0] Test execution error:", error)
  }
}

// Run the tests
testAPI()
