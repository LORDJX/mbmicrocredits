"use server"

import { createClient } from "@/lib/supabase/server"
import type { Loan, Installment, InstallmentWithBalance } from "@/lib/types/database"

export async function getClientActiveLoans(clientId: string) {
  try {
    const supabase = await createClient()
    const { data: loans, error } = await supabase
      .from("loans")
      .select("id, loan_code, amount, principal, installments_total, status, start_date, end_date, interest_rate")
      .eq("client_id", clientId)
      .eq("status", "activo")
      .order("created_at", { ascending: false })

    if (error) throw error
    return { loans: (loans || []) as Loan[], error: null }
  } catch (error) {
    console.error("Error fetching loans:", error)
    return { loans: [] as Loan[], error: "Error al obtener préstamos" }
  }
}

export async function getLoansPendingInstallments(loanIds: string[]) {
  try {
    const supabase = await createClient()
    const { data: installments, error } = await supabase
      .from("installments")
      .select(
        "id, loan_id, installment_no, installments_total, code, due_date, amount_due, amount_paid, paid_at, loans(loan_code)",
      )
      .in("loan_id", loanIds)
      .is("paid_at", null)
      .order("due_date", { ascending: true })

    if (error) throw error

    const enriched = (installments || []).map(
      (inst: Installment): InstallmentWithBalance => ({
        ...inst,
        balance_due: Math.max(0, Number(inst.amount_due) - Number(inst.amount_paid)),
      }),
    )

    return { installments: enriched, error: null }
  } catch (error) {
    console.error("Error fetching installments:", error)
    return { installments: [] as InstallmentWithBalance[], error: "Error al obtener cuotas" }
  }
}

export async function getClientUpcomingInstallments(clientId: string, limit = 3) {
  try {
    const supabase = await createClient()
    const { data: installments, error } = await supabase
      .from("installments")
      .select("id, installment_no, due_date, amount_due, amount_paid, code, loans(id, loan_code, client_id)")
      .is("paid_at", null)
      .order("due_date", { ascending: true })

    if (error) throw error

    const today = new Date().toISOString().split("T")[0]
    const filtered = (installments || [])
      .filter((inst: Installment) => inst.loans?.client_id === clientId && inst.due_date >= today)
      .slice(0, limit)

    const enriched = filtered.map(
      (inst: Installment): InstallmentWithBalance => ({
        ...inst,
        balance_due: Math.max(0, Number(inst.amount_due) - Number(inst.amount_paid)),
      }),
    )

    return { installments: enriched, error: null }
  } catch (error) {
    console.error("Error fetching upcoming installments:", error)
    return { installments: [] as InstallmentWithBalance[], error: "Error al obtener próximos vencimientos" }
  }
}

export async function getClientOverdueInstallments(clientId: string) {
  try {
    const supabase = await createClient()
    const today = new Date().toISOString().split("T")[0]

    const { data: installments, error } = await supabase
      .from("installments")
      .select("id, installment_no, due_date, amount_due, amount_paid, code, loans(id, loan_code, client_id)")
      .is("paid_at", null)
      .lt("due_date", today)
      .order("due_date", { ascending: true })

    if (error) throw error

    const filtered = (installments || []).filter((inst: Installment) => inst.loans?.client_id === clientId)

    const enriched = filtered.map(
      (inst: Installment): InstallmentWithBalance => ({
        ...inst,
        balance_due: Math.max(0, Number(inst.amount_due) - Number(inst.amount_paid)),
      }),
    )

    return { installments: enriched, error: null }
  } catch (error) {
    console.error("Error fetching overdue installments:", error)
    return { installments: [] as InstallmentWithBalance[], error: "Error al obtener cuotas vencidas" }
  }
}

interface ImputationResult {
  installment_id: string
  imputed_amount: number
}

export function distributePayment(installments: InstallmentWithBalance[], totalAmount: number) {
  if (!installments.length || totalAmount <= 0) {
    return { imputations: [] as ImputationResult[], remaining: totalAmount }
  }

  const imputations: ImputationResult[] = []
  let remaining = totalAmount
  const sorted = [...installments].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

  for (let i = 0; i < sorted.length && remaining > 0; i++) {
    const inst = sorted[i]
    const balanceDue = Number(inst.balance_due)
    const toImpute = Math.min(remaining, balanceDue)

    if (toImpute > 0) {
      imputations.push({
        installment_id: inst.id,
        imputed_amount: toImpute,
      })
      remaining -= toImpute
    }
  }

  return { imputations, remaining }
}
