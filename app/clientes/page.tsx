// app/clientes/page.tsx

import {
  TableRow,
  TableBody,
  TableHeader,
  TableHead,
  TableCell,
  TableCaption,
  TableFooter,
  Table,
} from "@/components/ui/table"
import { CardContent, CardDescription, CardTitle, CardHeader, Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Plus, Search, UserCheck, Phone, MapPin } from "lucide-react"
import { PageHeader } from "@/components/page-header" // Asegúrate de que esta ruta sea correcta
import { StatsCard } from "@/components/stats-card" // Asegúrate de que esta ruta sea correcta
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CreateClientForm } from "@/components/forms/create-client-form" // Asegúrate de que esta ruta sea correcta
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ClientCardPrint } from "@/components/client-card-print"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, CheckCircle } from "lucide-react"
import { useState } from "react"

// --- Interfaces de Datos ---
interface Client {
  id: string
  client_code: string
  first_name: string
  last_name: string
  dni: string
  phone: string | null
  address: string | null
  status: string
  is_active: boolean // Usado en el frontend para el Badge
  created_at: string
}

// --- Función de Carga de Datos (Server) ---
// Debe ser una función normal, NO exportada por defecto.
async function getClientsData() {
  const supabase = await createClient()

  const { data: clients, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching clients:", error)
    return { clients: [], totalClients: 0, activeClients: 0 }
  }

  // Contamos clientes activos (asumiendo que 'active' es el estado principal)
  const activeClientsCount =
    clients?.filter((client: Client) => client.status === "active" || client.status === "Activo").length || 0

  return {
    clients: (clients as Client[]) || [],
    totalClients: clients?.length || 0,
    activeClients: activeClientsCount,
  }
}

// --- Componente Principal ---
// Debe ser exportado con 'export default'.
export default async function ClientesPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Corregido: Llamada a la API/DB para obtener los datos
  const { clients, totalClients, activeClients } = await getClientsData()

  const handleBulkActivate = async () => {
    try {
      const response = await fetch("/api/clients/bulk-activate", {
        method: "POST",
      })

      if (!response.ok) throw new Error("Error al activar clientes")

      window.location.reload()
    } catch (error) {
      console.error("[v0] Error activating clients:", error)
      alert("Error al activar clientes")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" description="Gestiona tu cartera de clientes y su información">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBulkActivate} className="border-border bg-transparent">
            <CheckCircle className="h-4 w-4 mr-2" />
            Activar Todos
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent
              className="!max-w-none w-[95vw] max-h-[95vh] h-[95vh] p-0 gap-0"
              aria-describedby="create-client-description"
            >
              <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 12px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: #1a1a1a;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: #ffffff;
                  border-radius: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #e0e0e0;
                }
              `}</style>
              <div className="custom-scrollbar overflow-y-auto h-full p-6">
                <DialogHeader className="mb-4">
                  <DialogTitle>Crear Nuevo Cliente</DialogTitle>
                </DialogHeader>
                <div id="create-client-description" className="sr-only">
                  Formulario para crear un nuevo cliente en el sistema
                </div>
                <CreateClientForm
                  onSuccess={() => {
                    window.location.reload()
                  }}
                  onCancel={() => {}}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Total Clientes" value={totalClients} description="Clientes registrados" icon={Users} />
        <StatsCard
          title="Clientes Activos"
          value={activeClients}
          description="Con préstamos vigentes"
          icon={UserCheck}
        />
        <StatsCard
          title="Nuevos este mes"
          value={clients.filter((client) => new Date(client.created_at).getMonth() === new Date().getMonth()).length}
          description="Registrados en el mes"
          icon={Plus}
        />
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar clientes..." className="pl-10" />
        </div>
      </div>

      {/* Clients Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground font-work-sans">Lista de Clientes</CardTitle>
          <CardDescription>Todos los clientes registrados en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableCaption>Aquí puedes ver y gestionar todos los clientes registrados</TableCaption>
              <TableFooter>{/* Footer content */}</TableFooter>
              <TableBody>
                {clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay clientes registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {client.first_name} {client.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">{client.client_code}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{client.dni}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {client.phone || "No registrado"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {client.address || "No registrada"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ClientStatusSelector clientId={client.id} currentStatus={client.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="!max-w-none w-[95vw] max-h-[95vh] h-[95vh] p-0 gap-0">
                              <style jsx>{`
                                .custom-scrollbar::-webkit-scrollbar {
                                  width: 12px;
                                }
                                .custom-scrollbar::-webkit-scrollbar-track {
                                  background: #1a1a1a;
                                }
                                .custom-scrollbar::-webkit-scrollbar-thumb {
                                  background: #ffffff;
                                  border-radius: 6px;
                                }
                                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                                  background: #e0e0e0;
                                }
                              `}</style>
                              <div className="custom-scrollbar overflow-y-auto h-full p-6">
                                <DialogHeader className="mb-4">
                                  <DialogTitle>Editar Cliente</DialogTitle>
                                </DialogHeader>
                                <CreateClientForm
                                  initialData={client}
                                  onSuccess={() => window.location.reload()}
                                  onCancel={() => {}}
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                          <ClientCardPrint client={client} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
;("use client")

function ClientStatusSelector({ clientId, currentStatus }: { clientId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/clients/${clientId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error("Error al actualizar estado")

      setStatus(newStatus)
    } catch (error) {
      console.error("[v0] Error updating status:", error)
      alert("Error al actualizar estado")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Select value={status} onValueChange={handleStatusChange} disabled={isUpdating}>
      <SelectTrigger className="w-[130px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="active">Activo</SelectItem>
        <SelectItem value="inactive">Inactivo</SelectItem>
      </SelectContent>
    </Select>
  )
}
