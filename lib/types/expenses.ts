export interface ExpenseCategory {
  id: string
  name: string
  description: string | null
  color: string
  icon: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  expense_code: string
  category_id: string | null
  amount: number
  expense_date: string
  payment_method: "cash" | "transfer" | "card" | "check" | "other"
  description: string
  notes: string | null
  receipt_number: string | null
  attachment_url: string | null
  vendor_name: string | null
  vendor_phone: string | null
  vendor_email: string | null
  is_recurring: boolean
  recurrence_frequency: "daily" | "weekly" | "monthly" | "yearly" | null
  tags: string[] | null
  created_by: string | null
  approved_by: string | null
  status: "pending" | "approved" | "rejected" | "paid"
  audit_status: "pending" | "approved" | "rejected"
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ExpenseWithDetails extends Expense {
  category_name: string | null
  category_color: string | null
  category_icon: string | null
  created_by_name: string | null
  approved_by_name: string | null
}

export interface ExpenseFormData {
  category_id: string
  amount: number
  expense_date: string
  payment_method: "cash" | "transfer" | "card" | "check" | "other"
  description: string
  notes?: string
  receipt_number?: string
  vendor_name?: string
  vendor_phone?: string
  vendor_email?: string
  is_recurring?: boolean
  recurrence_frequency?: "daily" | "weekly" | "monthly" | "yearly"
  tags?: string[]
  status?: "pending" | "paid"
  audit_status?: "pending" | "approved" | "rejected"
}

export interface CategoryExpenseStats {
  category_id: string
  category_name: string
  category_color: string
  total_amount: number
  expense_count: number
  percentage: number
}
