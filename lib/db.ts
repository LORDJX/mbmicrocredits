import Dexie, { type Table } from "dexie"

export type LocalTransaction = {
  id: string
  amount: number
  description?: string
  partner_id?: string | null
  created_at: string // ISO
  synced?: boolean
}

export type SyncQueueItem = {
  id: string
  entity: "transactions" | "clients" | "loans" | "partners" | "followups"
  op: "insert" | "update" | "delete"
  payload: unknown
  created_at: string // ISO
  error?: string | null
}

class LocalDB extends Dexie {
  transactions!: Table<LocalTransaction, string>
  sync_queue!: Table<SyncQueueItem, string>

  constructor() {
    super("mb_microcredits_local")
    this.version(1).stores({
      transactions: "id, created_at, synced",
      sync_queue: "id, entity, created_at",
    })
  }
}

export const db = new LocalDB()
