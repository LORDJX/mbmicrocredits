// scripts/fix-loan-data.mjs
// Ejecutar: node scripts/fix-loan-data.mjs
// Requiere: env DATABASE_URL (Postgres de Supabase/Neon) con SSL habilitado

import pg from "pg"
const { Client } = pg

// ⚙️ Config DB
const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error("❌ Falta env DATABASE_URL")
  process.exit(1)
}

// Supabase/Neon suelen requerir SSL
const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

function nowStr() {
  return new Date().toISOString()
}

async function main() {
  await client.connect()
  console.log("=== CORRIGIENDO DATOS DE PRÉSTAMOS ===")
  console.log("Fecha:", nowStr(), "\n")

  // Traemos los préstamos candidatos (activos/no finalizados)
  const { rows: loans } = await client.query(`
    SELECT
      id,
      loan_code,
      amount,
      installments,
      installment_amount,
      amount_to_repay,
      interest_rate,
      loan_type,
      start_date,
      status,
      created_at
    FROM loans
    WHERE deleted_at IS NULL
      AND (status IS NULL OR status NOT IN ('Cancelado','Finalizado'))
  `)

  let totalFixes = 0

  for (const L of loans) {
    // Transacción por préstamo para mantener atomicidad
    await client.query("BEGIN")
    try {
      // 1) loan_type
      if (!L.loan_type || L.loan_type.trim() === "")
