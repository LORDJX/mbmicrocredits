"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FollowUp {
  id: string
  client_id: string
  date: string // YYYY-MM-DD
  notes: string | null
  reminder_date: string | null
  created_at: string
  updated_at: string | null
  client?: {
    id: string
    first_name?: string | null
    last_name?: string | null
    name?: string | null
    surname?: string | null
    nombre?: string | null
    apellido?: string | null
  } | null
}

const initialNewFollowUpState = {
  client_id: "",
  date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
  notes: "",
  reminder_date: "",
}

// Convierte una Response en un mensaje de error legible
async function getResponseError(response: Response, fallback: string) {
  try {
    const contentType = response.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      const data = await response.json().catch(() => ({}) as any)
      const candidate =
        data?.message ??
        data?.error?.message ??
        (typeof data?.detail === "string" ? data.detail : data?.detail?.message)
      return candidate ? String(candidate) : fallback
    }
    const text = await response.text()
    return `${fallback}. Respuesta no JSON: ${text.slice(0, 200)}...`
  } catch {
    return fallback
  }
}

function getClientFullName(client?: FollowUp["client"]) {
  if (!client) return ""
  const first = client.first_name ?? client.name ?? client.nombre ?? ""
  const last = client.last_name ?? client.surname ?? client.apellido ?? ""
  return [first, last].filter(Boolean).join(" ").trim()
}

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [currentFollowUp, setCurrentFollowUp] = useState<FollowUp | null>(null)
  const [newFollowUp, setNewFollowUp] = useState(initialNewFollowUpState)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchFollowUps()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchFollowUps = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/followups", { cache: "no-store" })
      if (!response.ok) {
        const fallback = `Error al cargar seguimientos: ${response.status} ${response.statusText}`
        const errorMessage = await getResponseError(response, fallback)
        throw new Error(errorMessage)
      }
      const data: FollowUp[] = await response.json()
      setFollowUps(data)
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : "Error desconocido"
      console.error("Error al cargar seguimientos:", msg)
      setError("Error al cargar seguimientos: " + msg)
      toast({
        title: "Error",
        description: `No se pudieron cargar los seguimientos: ${msg}`,
        variant: "destructive",
      })
      if (msg.includes("permisos") || msg.includes("403")) {
        router.push("/dashboard")
      }
    } finally {
      setLoading(false)
    }
  }

  const toDateInput = (d?: string | null) => (d ? String(d).split("T")[0] : "")

  const handleEditClick = (followUp: FollowUp) => {
    setCurrentFollowUp({
      ...followUp,
      date: toDateInput(followUp.date),
      reminder_date: toDateInput(followUp.reminder_date),
    } as FollowUp)
    setIsEditDialogOpen(true)
  }

  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentFollowUp) return
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/followups/${currentFollowUp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: currentFollowUp.client_id,
          date: currentFollowUp.date, // requerido por schema
          notes: currentFollowUp.notes,
          reminder_date: currentFollowUp.reminder_date || null,
        }),
      })

      if (!response.ok) {
        const fallback = `Error al actualizar seguimiento: ${response.status} ${response.statusText}`
        const errorMessage = await getResponseError(response, fallback)
        throw new Error(errorMessage)
      }

      toast({ title: "Éxito", description: "Seguimiento actualizado correctamente." })
      setIsEditDialogOpen(false)
      fetchFollowUps()
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : "Error desconocido"
      console.error("Error al guardar seguimiento:", msg)
      setError("Error al guardar seguimiento: " + msg)
      toast({
        title: "Error",
        description: `No se pudo actualizar el seguimiento: ${msg}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newFollowUp,
          reminder_date: newFollowUp.reminder_date || null,
        }),
      })

      if (!response.ok) {
        const fallback = `Error al crear seguimiento: ${response.status} ${response.statusText}`
        const errorMessage = await getResponseError(response, fallback)
        throw new Error(errorMessage)
      }

      toast({ title: "Éxito", description: "Seguimiento creado correctamente." })
      setIsCreateDialogOpen(false)
      setNewFollowUp(initialNewFollowUpState)
      fetchFollowUps()
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : "Error desconocido"
      console.error("Error al crear seguimiento:", msg)
      setError("Error al crear seguimiento: " + msg)
      toast({
        title: "Error",
        description: `No se pudo crear el seguimiento: ${msg}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFollowUp = async (followUpId: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este seguimiento?")) return
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/followups/${followUpId}`, { method: "DELETE" })

      if (!response.ok) {
        const fallback = `Error al eliminar seguimiento: ${response.status} ${response.statusText}`
        const errorMessage = await getResponseError(response, fallback)
        throw new Error(errorMessage)
      }

      toast({ title: "Éxito", description: "Seguimiento eliminado correctamente." })
      fetchFollowUps()
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : "Error desconocido"
      console.error("Error al eliminar seguimiento:", msg)
      setError("Error al eliminar seguimiento: " + msg)
      toast({
        title: "Error",
        description: `No se pudo eliminar el seguimiento: ${msg}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-gray-100">
        <p>Cargando seguimientos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-red-400">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <Card className="bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-gray-50">Gestión de Seguimientos</CardTitle>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-gray-50 font-semibold"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Seguimiento
            </Button>
          </div>
          <CardDescription className="text-gray-400">
            Lista de todos los seguimientos de clientes registrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-gray-700 hover:bg-gray-700 border-gray-600">
                  <TableHead className="text-gray-300">Cliente</TableHead>
                  <TableHead className="text-gray-300">Fecha Seguimiento</TableHead>
                  <TableHead className="text-gray-300">Notas</TableHead>
                  <TableHead className="text-gray-300">Fecha Recordatorio</TableHead>
                  <TableHead className="text-gray-300">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {followUps.map((followUp) => (
                  <TableRow key={followUp.id} className="border-gray-700 hover:bg-gray-700/50">
                    <TableCell className="font-medium text-gray-200">
                      {getClientFullName(followUp.client) || followUp.client_id}
                    </TableCell>
                    <TableCell className="text-gray-300">{new Date(followUp.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-gray-300">{followUp.notes || "N/A"}</TableCell>
                    <TableCell className="text-gray-300">
                      {followUp.reminder_date ? new Date(followUp.reminder_date).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-50">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-700 border border-gray-600 text-gray-100">
                          <DropdownMenuItem
                            onClick={() => handleEditClick(followUp)}
                            className="hover:bg-gray-600 focus:bg-gray-600 cursor-pointer"
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteFollowUp(followUp.id)}
                            className="hover:bg-red-700 focus:bg-red-700 text-red-300 hover:text-red-50 focus:text-red-50 cursor-pointer"
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de Edición */}
      {currentFollowUp && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-gray-50">Editar Seguimiento</DialogTitle>
              <DialogDescription className="text-gray-400">
                Realiza cambios en la información del seguimiento aquí.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveFollowUp} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client_id" className="text-right text-gray-300">
                  ID Cliente
                </Label>
                <Input
                  id="client_id"
                  value={currentFollowUp.client_id}
                  onChange={(e) => setCurrentFollowUp({ ...currentFollowUp, client_id: e.target.value })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                  disabled
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right text-gray-300">
                  Fecha Seguimiento
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={currentFollowUp.date}
                  onChange={(e) => setCurrentFollowUp({ ...currentFollowUp, date: e.target.value })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right text-gray-300">
                  Notas
                </Label>
                <Input
                  id="notes"
                  value={currentFollowUp.notes || ""}
                  onChange={(e) => setCurrentFollowUp({ ...currentFollowUp, notes: e.target.value })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reminder_date" className="text-right text-gray-300">
                  Fecha Recordatorio
                </Label>
                <Input
                  id="reminder_date"
                  type="date"
                  value={currentFollowUp.reminder_date || ""}
                  onChange={(e) => setCurrentFollowUp({ ...currentFollowUp, reminder_date: e.target.value })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600 hover:text-gray-50"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-gray-600 hover:bg-gray-700 text-gray-50 font-semibold"
                  disabled={loading}
                >
                  {loading ? "Guardando..." : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo de Creación */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-50">Crear Nuevo Seguimiento</DialogTitle>
            <DialogDescription className="text-gray-400">
              Ingresa los detalles del nuevo seguimiento aquí.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateFollowUp} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_client_id" className="text-right text-gray-300">
                ID Cliente
              </Label>
              <Input
                id="new_client_id"
                value={newFollowUp.client_id}
                onChange={(e) => setNewFollowUp({ ...newFollowUp, client_id: e.target.value })}
                className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_date" className="text-right text-gray-300">
                Fecha Seguimiento
              </Label>
              <Input
                id="new_date"
                type="date"
                value={newFollowUp.date}
                onChange={(e) => setNewFollowUp({ ...newFollowUp, date: e.target.value })}
                className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_notes" className="text-right text-gray-300">
                Notas
              </Label>
              <Input
                id="new_notes"
                value={newFollowUp.notes}
                onChange={(e) => setNewFollowUp({ ...newFollowUp, notes: e.target.value })}
                className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_reminder_date" className="text-right text-gray-300">
                Fecha Recordatorio
              </Label>
              <Input
                id="new_reminder_date"
                type="date"
                value={newFollowUp.reminder_date}
                onChange={(e) => setNewFollowUp({ ...newFollowUp, reminder_date: e.target.value })}
                className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
              />
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600 hover:text-gray-50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-gray-50 font-semibold"
                disabled={loading}
              >
                {loading ? "Creando..." : "Crear Seguimiento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
