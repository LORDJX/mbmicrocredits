// app/api/loans/route.ts

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// --- LÓGICA GET (Lectura) ---
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const search = searchParams.get("search")
        const status = searchParams.get("status")
        const client_id = searchParams.get("client_id")

        let query = supabase
            .from("loans")
            .select(`*, clients!inner(first_name, last_name, client_code)`)
            .order("created_at", { ascending: false })

        if (search) {
            query = query.or(`loan_code.ilike.%${search}%,clients.first_name.ilike.%${search}%,clients.last_name.ilike.%${search}%`)
        }
        if (status) {
            query = query.eq("status", status)
        }
        if (client_id) {
            query = query.eq("client_id", client_id)
        }

        const { data: loans, error } = await query

        if (error) {
            console.error("Error fetching loans:", error)
            return NextResponse.json({ error: "Error al obtener préstamos" }, { status: 500 })
        }

        // ✅ CALCULAR SALDO REAL basado en cuotas
        const loansWithBalance = await Promise.all(
            (loans || []).map(async (loan) => {
                // Obtener todas las cuotas del préstamo
                const { data: installments } = await supabase
                    .from("installments")
                    .select("amount_due, amount_paid, paid_at")
                    .eq("loan_id", loan.id)

                // Calcular totales
                const totalDue = installments?.reduce((sum, inst) => sum + Number(inst.amount_due || 0), 0) || 0
                const totalPaid = installments?.reduce((sum, inst) => sum + Number(inst.amount_paid || 0), 0) || 0
                const balance = totalDue - totalPaid

                // Verificar si tiene cuotas pendientes
                const hasPendingInstallments = installments?.some((inst) => !inst.paid_at) || false

                return {
                    ...loan,
                    active_clients: loan.clients,
                    balance,  // ✅ Saldo calculado correctamente
                    has_pending_installments: hasPendingInstallments,
                }
            })
        )

        return NextResponse.json({ loans: loansWithBalance })
    } catch (error) {
        console.error("Error in GET /api/loans:", error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}


// --- LÓGICA POST (Creación de Préstamo y Cuotas) ---
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const body = await request.json()
        const { client_id, amount, installments, interest_rate, start_date, loan_type = "personal", status = "active", frequency = "monthly" } = body

        if (!client_id || !amount || !installments || !interest_rate || !start_date) {
            return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
        }

        // CÁLCULO DE MONTOS
        const principal = Number.parseFloat(amount)
        const rate = Number.parseFloat(interest_rate) / 100
        const total_installments = Number.parseInt(installments)
        
        const amount_to_repay = principal * (1 + rate * total_installments)
        const installment_amount = amount_to_repay / total_installments

        // Generar código de préstamo
        const { data: lastLoan } = await supabase
            .from("loans")
            .select("loan_code")
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

        let nextNumber = 1
        if (lastLoan?.loan_code) {
            const match = lastLoan.loan_code.match(/PR(\d+)/)
            if (match) { 
                nextNumber = Number.parseInt(match[1]) + 1 
            }
        }
        const loan_code = `PR${nextNumber.toString().padStart(5, "0")}`

        // Calcular fecha de fin
        const startDateObj = new Date(start_date)
        const endDateObj = new Date(startDateObj)
        endDateObj.setMonth(endDateObj.getMonth() + total_installments)
        const end_date = endDateObj.toISOString().split("T")[0]

        // 3. Insertar Préstamo en la DB
        const { data: newLoan, error } = await supabase
            .from("loans")
            .insert({
                client_id, 
                amount: principal, 
                installments: total_installments, 
                interest_rate: rate * 100,
                start_date, 
                end_date, 
                loan_type, 
                status, 
                loan_code,
                amount_to_repay, 
                installment_amount, 
                principal, 
                installments_total: total_installments, 
                frequency
            })
            .select(`*, clients!inner(first_name, last_name, client_code)`)
            .single()

        if (error) {
            console.error("Error creating loan:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // 4. Generar Cuotas Automáticamente
        const installmentsData = []
        const installmentAmount = amount_to_repay / total_installments
        
        let intervalUnit = 'month';
        let intervalValue = 1;
        
        if (frequency === 'weekly') {
            intervalUnit = 'day';
            intervalValue = 7;
        } else if (frequency === 'biweekly') {
            intervalUnit = 'day';
            intervalValue = 15;
        }

        const initialDueDate = new Date(start_date);
        initialDueDate.setHours(12); // Para evitar problemas de DST

        for (let i = 1; i <= total_installments; i++) {
            let dueDate = new Date(initialDueDate);

            if (intervalUnit === 'month') {
                // Cálculo absoluto de meses basado en el índice (i - 1)
                dueDate.setMonth(initialDueDate.getMonth() + intervalValue * (i - 1));
            } else {
                // Cálculo absoluto de días basado en el índice (i - 1)
                dueDate.setDate(initialDueDate.getDate() + intervalValue * (i - 1));
            }

            installmentsData.push({
                loan_id: newLoan.id, 
                installment_no: i, 
                installments_total: total_installments,
                due_date: dueDate.toISOString().split("T")[0], 
                amount_due: installmentAmount,
                amount_paid: 0, 
                status: "A_PAGAR", // Estado inicial
                code: `${loan_code}-${i.toString().padStart(2, "0")}`,
            })
        }

        const { error: installmentsError } = await supabase
            .from("installments")
            .insert(installmentsData)

        if (installmentsError) {
            console.error("Error creating installments:", installmentsError)
        }

        return NextResponse.json({ loan: newLoan }, { status: 201 })
    } catch (error) {
        console.error("Error in POST /api/loans:", error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}
