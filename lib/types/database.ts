export interface Loan {
  id: string
  loan_code: string
  client_id: string
  amount: number
  principal: number
  installments_total: number
  status: string
  start_date: string
  end_date: string
  interest_rate: number
  created_at?: string
}

export interface Installment {
  id: string
  loan_id: string
  installment_no: number
  installments_total: number
  code: string
  due_date: string
  amount_due: number
  amount_paid: number
  paid_at: string | null
  status?: string
  loans?: {
    loan_code: string
    client_id?: string
  }
}

export interface InstallmentWithBalance extends Installment {
  balance_due: number
}

export interface Client {
  id: string
  client_code: string
  first_name: string
  last_name: string
  phone?: string
  email?: string
  address?: string
  dni?: string
  created_at?: string
}

export interface Receipt {
  id: string
  client_id: string
  receipt_number: string
  receipt_date: string
  payment_type: string
  cash_amount: number
  transfer_amount: number
  total_amount: number
  observations?: string
  selected_installments?: unknown[]
  created_at?: string
}

export interface PaymentImputation {
  id?: string
  receipt_id: string
  installment_id: string
  imputed_amount: number
  created_at?: string
}

export interface Transaction {
  id: string
  amount: number
  type: string
  created_at: string
}
