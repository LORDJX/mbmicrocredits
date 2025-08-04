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
import { MoreHorizontal, Search, PlusCircle } from "lucide-react" // Importamos PlusCircle para el botón de añadir
import { useToast } from "@/hooks/use-toast"

// Definición de tipos para un cliente
interface Client {
  id: string
  client_code: string
  last_name: string
  first_name: string
  dni: string | null
  address: string | null
  phone: string | null
  email: string | null
  referred_by: string | null
  status: string | null
  observations: string | null
  dni_photo_url: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// Estado inicial para el nuevo cliente
const initialNewClientState = {
  first_name: "",
  last_name: "",
  dni: "",
  address: "",
  phone: "",
  email: "",
  referred_by: "",
  status: "",
  observations: "",
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false) // Nuevo estado para el diálogo de creación
  const [currentClient, setCurrentClient] = useState<Client | null>(null)
  const [newClient, setNewClient] = useState(initialNewClientState) // Estado para el nuevo cliente
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchClients()
  }, [searchTerm])

  const fetchClients = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = searchTerm ? `/api/clients?search=${encodeURIComponent(searchTerm)}` : "/api/clients"
      const response = await fetch(url)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error al cargar clientes.")
      }
      const data: Client[] = await response.json()
      setClients(data)
    } catch (err: any) {
      console.error("Error al cargar clientes:", err.message)
      setError("Error al cargar clientes: " + err.message)
      toast({
        title: "Error",
        description: `No se pudieron cargar los clientes: ${err.message}`,
        variant: "destructive",
      })
      if (err.message.includes("permisos")) {
        router.push("/dashboard")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (client: Client) => {
    setCurrentClient(client)
    setIsEditDialogOpen(true)
  }

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentClient) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/clients/${currentClient.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          last_name: currentClient.last_name,
          first_name: currentClient.first_name,
          dni: currentClient.dni,
          address: currentClient.address,
          phone: currentClient.phone,
          email: currentClient.email,
          referred_by: currentClient.referred_by,
          status: currentClient.status,
          observations: currentClient.observations,
          dni_photo_url: currentClient.dni_photo_url,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error al actualizar cliente.")
      }

      toast({
        title: "Éxito",
        description: "Cliente actualizado correctamente.",
      })
      setIsEditDialogOpen(false)
      fetchClients()
    } catch (err: any) {
      console.error("Error al guardar cliente:", err.message)
      setError("Error al guardar cliente: " + err.message)
      toast({
        title: "Error",
        description: `No se pudo actualizar el cliente: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newClient),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error al crear cliente.")
      }

      toast({
        title: "Éxito",
        description: "Cliente creado correctamente.",
      })
      setIsCreateDialogOpen(false)
      setNewClient(initialNewClientState) // Resetear el formulario
      fetchClients()
    } catch (err: any) {
      console.error("Error al crear cliente:", err.message)
      setError("Error al crear cliente: " + err.message)
      toast({
        title: "Error",
        description: `No se pudo crear el cliente: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar (soft delete) este cliente?")) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error al eliminar cliente.")
      }

      toast({
        title: "Éxito",
        description: "Cliente eliminado (soft delete) correctamente.",
      })
      fetchClients()
    } catch (err: any) {
      console.error("Error al eliminar cliente:", err.message)
      setError("Error al eliminar cliente: " + err.message)
      toast({
        title: "Error",
        description: `No se pudo eliminar el cliente: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-gray-100">
        <p>Cargando clientes...</p>
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
            <CardTitle className="text-2xl font-bold text-gray-50">Gestión de Clientes</CardTitle>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-gray-50 font-semibold"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </div>
          <CardDescription className="text-gray-400">
            Lista de todos los clientes registrados y su información de contacto.
          </CardDescription>
          <div className="relative mt-4">
            <Input
              type="text"
              placeholder="Buscar por nombre, apellido o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400 focus:ring-gray-500 focus:border-gray-500 pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-gray-700 hover:bg-gray-700 border-gray-600">
                  <TableHead className="text-gray-300">Código</TableHead>
                  <TableHead className="text-gray-300">Nombre Completo</TableHead>
                  <TableHead className="text-gray-300">DNI</TableHead>
                  <TableHead className="text-gray-300">Teléfono</TableHead>
                  <TableHead className="text-gray-300">Email</TableHead>
                  <TableHead className="text-gray-300">Estado</TableHead>
                  <TableHead className="text-gray-300">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} className="border-gray-700 hover:bg-gray-700/50">
                    <TableCell className="font-medium text-gray-200">{client.client_code}</TableCell>
                    <TableCell className="text-gray-300">
                      {client.first_name} {client.last_name}
                    </TableCell>
                    <TableCell className="text-gray-300">{client.dni || "N/A"}</TableCell>
                    <TableCell className="text-gray-300">{client.phone || "N/A"}</TableCell>
                    <TableCell className="text-gray-300">{client.email || "N/A"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          client.deleted_at ? "bg-red-600 text-red-50" : "bg-green-600 text-green-50"
                        }`}
                      >
                        {client.deleted_at ? "Eliminado" : "Activo"}
                      </span>
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
                            onClick={() => handleEditClick(client)}
                            className="hover:bg-gray-600 focus:bg-gray-600 cursor-pointer"
                          >
                            Editar
                          </DropdownMenuItem>
                          {!client.deleted_at && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteClient(client.id)}
                              className="hover:bg-red-700 focus:bg-red-700 text-red-300 hover:text-red-50 focus:text-red-50 cursor-pointer"
                            >
                              Eliminar (Soft Delete)
                            </DropdownMenuItem>
                          )}
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

      {/* Diálogo de Edición de Cliente */}
      {currentClient && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-gray-50">Editar Cliente</DialogTitle>
              <DialogDescription className="text-gray-400">
                Realiza cambios en la información del cliente aquí. Haz clic en guardar cuando hayas terminado.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveClient} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="first_name" className="text-right text-gray-300">
                  Nombre
                </Label>
                <Input
                  id="first_name"
                  value={currentClient.first_name}
                  onChange={(e) => setCurrentClient({ ...currentClient, first_name: e.target.value })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="last_name" className="text-right text-gray-300">
                  Apellido
                </Label>
                <Input
                  id="last_name"
                  value={currentClient.last_name}
                  onChange={(e) => setCurrentClient({ ...currentClient, last_name: e.target.value })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dni" className="text-right text-gray-300">
                  DNI
                </Label>
                <Input
                  id="dni"
                  value={currentClient.dni || ""}
                  onChange={(e) => setCurrentClient({ ...currentClient, dni: e.target.value })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right text-gray-300">
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  value={currentClient.phone || ""}
                  onChange={(e) => setCurrentClient({ ...currentClient, phone: e.target.value })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={currentClient.email || ""}
                  onChange={(e) => setCurrentClient({ ...currentClient, email: e.target.value })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right text-gray-300">
                  Dirección
                </Label>
                <Input
                  id="address"
                  value={currentClient.address || ""}
                  onChange={(e) => setCurrentClient({ ...currentClient, address: e.target.value })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="referred_by" className="text-right text-gray-300">
                  Referido por
                </Label>
                <Input
                  id="referred_by"
                  value={currentClient.referred_by || ""}
                  onChange={(e) => setCurrentClient({ ...currentClient, referred_by: e.target.value })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right text-gray-300">
                  Estado
                </Label>
                <Input
                  id="status"
                  value={currentClient.status || ""}
                  onChange={(e) => setCurrentClient({ ...currentClient, status: e.target.value })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="observations" className="text-right text-gray-300">
                  Observaciones
                </Label>
                <Input
                  id="observations"
                  value={currentClient.observations || ""}
                  onChange={(e) => setCurrentClient({ ...currentClient, observations: e.target.value })}
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

      {/* Diálogo de Creación de Nuevo Cliente */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-50">Crear Nuevo Cliente</DialogTitle>
            <DialogDescription className="text-gray-400">
              Ingresa los detalles del nuevo cliente aquí.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateClient} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_first_name" className="text-right text-gray-300">
                Nombre
              </Label>
              <Input
                id="new_first_name"
                value={newClient.first_name}
                onChange={(e) => setNewClient({ ...newClient, first_name: e.target.value })}
                className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_last_name" className="text-right text-gray-300">
                Apellido
              </Label>
              <Input
                id="new_last_name"
                value={newClient.last_name}
                onChange={(e) => setNewClient({ ...newClient, last_name: e.target.value })}
                className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_dni" className="text-right text-gray-300">
                DNI
              </Label>
              <Input
                id="new_dni"
                value={newClient.dni}
                onChange={(e) => setNewClient({ ...newClient, dni: e.target.value })}
                className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_phone" className="text-right text-gray-300">
                Teléfono
              </Label>
              <Input
                id="new_phone"
                value={newClient.phone}
                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_email" className="text-right text-gray-300">
                Email
              </Label>
              <Input
                id="new_email"
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_address" className="text-right text-gray-300">
                Dirección
              </Label>
              <Input
                id="new_address"
                value={newClient.address}
                onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_referred_by" className="text-right text-gray-300">
                Referido por
              </Label>
              <Input
                id="new_referred_by"
                value={newClient.referred_by}
                onChange={(e) => setNewClient({ ...newClient, referred_by: e.target.value })}
                className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_status" className="text-right text-gray-300">
                Estado
              </Label>
              <Input
                id="new_status"
                value={newClient.status}
                onChange={(e) => setNewClient({ ...newClient, status: e.target.value })}
                className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_observations" className="text-right text-gray-300">
                Observaciones
              </Label>
              <Input
                id="new_observations"
                value={newClient.observations}
                onChange={(e) => setNewClient({ ...newClient, observations: e.target.value })}
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
                {loading ? "Creando..." : "Crear Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
