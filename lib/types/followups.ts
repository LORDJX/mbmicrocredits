export interface FollowUp {
  id: string
  client_id: string
  date: string // ISO date string
  reminder_date: string | null // ISO date string
  notes: string | null
  status: FollowUpStatus // Agregado campo status
  created_at: string
  updated_at: string
}

export interface FollowUpWithClient extends FollowUp {
  client_code: string
  client_name: string
  client_phone: string | null
  client_email: string | null
}

export interface CreateFollowUpData {
  client_id: string
  date: string
  reminder_date?: string | null
  notes?: string | null
  status?: FollowUpStatus // Agregado campo status opcional
}

export interface UpdateFollowUpData {
  client_id?: string
  date?: string
  reminder_date?: string | null
  notes?: string | null
  status?: FollowUpStatus // Agregado campo status opcional
}

export type FollowUpStatus = "pendiente" | "completado" | "vencido" | "programado"
