"use client"

import { useEffect, useMemo, useState } from "react"
import { db, type LocalTransaction } from "@/lib/db"
import { addLocalTransaction, syncNow } from "@/lib/sync"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

function useConnectivity() {
  const [online, setOnline] = useState<boolean>(typeof window !== "undefined" ? navigator.onLine : true)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener("online", on)
    window.addEventListener("offline", off)
    return () => {
      window.removeEventListener("online", on)
      window.removeEventListener("offline", off)
    }
  }, [])
  return online
}

export default function MobileHome() {
  const [transactions, setTransactions] = useState<LocalTransaction[]>([])
  const [amount, setAmount] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [syncing, setSyncing] = useState(false)
  const online = useConnectivity()
  const statusText = online ? "En línea" : "Sin conexión"

  // cargar datos locales
  useEffect(() => {
    const sub = db.transactions.orderBy("created_at").reverse().toArray().then(setTransactions)
    const live = db.transactions.hook("creating", () => {})
    const reload = () => db.transactions.orderBy("created_at").reverse().toArray().then(setTransactions)
    const hooks = [
      db.transactions.hook("creating", reload),
      db.transactions.hook("updating", reload),
      db.transactions.hook("deleting", reload),
    ]
    return () => {
      hooks.forEach((h) => {
        // Dexie hooks son funciones asignadas; para limpieza se reasignan vacías
      })
    }
  }, [])

  const canSubmit = useMemo(() => {
    const val = Number.parseFloat(amount)
    return !isNaN(val) && val > 0
  }, [amount])

  const [userEmail, setUserEmail] = useState<string | null>(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null))
  }, [])

  async function onAdd() {
    if (!canSubmit) return
    const val = Number.parseFloat(amount)
    await addLocalTransaction({
      amount: val,
      description: description || undefined,
      partner_id: null,
    })
    setAmount("")
    setDescription("")
    // recargar
    const rows = await db.transactions.orderBy("created_at").reverse().toArray()
    setTransactions(rows)
  }

  async function onSync() {
    setSyncing(true)
    try {
      const result = await syncNow()
      alert(`${result.message}. Subidos: ${result.count}`)
      const rows = await db.transactions.orderBy("created_at").reverse().toArray()
      setTransactions(rows)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <main className="flex-1 p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transacciones (local)</h1>
        <Badge variant={online ? "default" : "secondary"}>{statusText}</Badge>
      </header>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Nueva transacción</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="desc">Descripción</Label>
            <Input
              id="desc"
              placeholder="Opcional"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={onAdd} disabled={!canSubmit}>
              Guardar local
            </Button>
            <Button variant="outline" onClick={onSync} disabled={syncing}>
              {syncing ? "Sincronizando..." : "Sincronizar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {userEmail ? `Sesión: ${userEmail}` : "No has iniciado sesión. Algunas acciones requieren login."}
          </p>
        </CardContent>
      </Card>

      <section className="space-y-2">
        <h2 className="text-base font-medium">Historial local</h2>
        <Separator />
        <ul className="space-y-2">
          {transactions.map((t) => (
            <li key={t.id} className="rounded-md border p-3 flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {"Monto: "}
                  <span className="tabular-nums">${t.amount.toFixed(2)}</span>
                </p>
                {t.description ? <p className="text-sm text-muted-foreground">{t.description}</p> : null}
                <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</p>
              </div>
              <Badge variant={t.synced ? "default" : "secondary"}>{t.synced ? "En nube" : "Local"}</Badge>
            </li>
          ))}
          {transactions.length === 0 && (
            <li className="text-sm text-muted-foreground">Aún no hay transacciones locales.</li>
          )}
        </ul>
      </section>
    </main>
  )
}
