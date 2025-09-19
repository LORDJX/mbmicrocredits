import { supabase } from "@/lib/supabaseClient"
import { db, type LocalTransaction, type SyncQueueItem } from "./db"

// Encola una operación para sincronizar luego (offline-first)
export async function enqueue(item: Omit<SyncQueueItem, "id" | "created_at">) {
  const id = crypto.randomUUID()
  await db.sync_queue.add({
    id,
    created_at: new Date().toISOString(),
    ...item,
  })
  return id
}

// Inserta local y encola para sync
export async function addLocalTransaction(input: Omit<LocalTransaction, "id" | "created_at" | "synced">) {
  const id = crypto.randomUUID()
  const tx: LocalTransaction = {
    id,
    created_at: new Date().toISOString(),
    synced: false,
    ...input,
  }
  await db.transactions.add(tx)
  await enqueue({
    entity: "transactions",
    op: "insert",
    payload: tx,
  })
  return tx
}

// Sincroniza cola -> Supabase. Devuelve resumen.
export async function syncNow() {
  // Nota: requiere usuario autenticado para que RLS permita insertar
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) {
    return { ok: false, message: "No autenticado. Inicia sesión para sincronizar.", count: 0 }
  }

  const items = await db.sync_queue.toArray()
  let okCount = 0
  for (const item of items) {
    try {
      if (item.entity === "transactions" && item.op === "insert") {
        // Ajusta el mapeo de columnas según tu esquema en Supabase
        const payload = item.payload as LocalTransaction
        const { error } = await supabase.from("transactions").insert({
          id: payload.id,
          amount: payload.amount,
          description: payload.description ?? null,
          partner_id: payload.partner_id ?? null,
          created_at: payload.created_at,
        })
        if (error) throw error
        await db.transactions.update(payload.id, { synced: true })
      }
      // Otros entities/ops se pueden añadir aquí

      await db.sync_queue.delete(item.id)
      okCount++
    } catch (e: any) {
      await db.sync_queue.update(item.id, { error: String(e?.message ?? e) })
    }
  }
  return { ok: true, message: "Sincronización completada", count: okCount }
}
