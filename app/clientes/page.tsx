"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, UserPlus, FileText, Phone, Mail, Edit, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { ClientCardPrint } from "@/components/client-card-print"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// --- Interfaces de Datos ---
interface Client {
  id: string
  client_code: string | null
  first_name: string
  last_name: string
  full_name: string
  dni: string
  cuil: string
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  date_of_birth: string | null
  status: string
  created_at: string
  updated_at: string
}

// --- Componente Principal ---
export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showPrintModal, setShowPrintModal] = useState(false)

  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Cargar clientes
  useEffect(() => {
    loadClients()
  }, [])

  // Filtrar clientes cuando cambia el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = clients.filter(
        (client) =>
          client.full_name?.toLowerCase().includes(term) ||
          client.dni?.toLowerCase().includes(term) ||
          client.cuil?.toLowerCase().includes(term) ||
          client.phone?.toLowerCase().includes(term) ||
          client.email?.toLowerCase().includes(term),
      )
      setFilteredClients(filtered)
    }
  }, [searchTerm, clients])

  const loadClients = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("clients")
        .select("*, full_name:first_name || ' ' || last_name")
        .order("created_at", { ascending: false })

      if (error) throw error

      setClients(data || [])
      setFilteredClients(data || [])
    } catch (error) {
      console.error("Error loading clients:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNewClient = () => {
    router.push("/dashboard/clients")
  }

  const handleViewClient = (clientId: string) => {
    router.push(`/dashboard/clients/${clientId}`)
  }

  const handlePrintCard = (client: Client) => {
    setSelectedClient(client)
    setShowPrintModal(true)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Activo", variant: "default" as const },
      inactive: { label: "Inactivo", variant: "secondary" as const },
      pending: { label: "Pendiente", variant: "outline" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "outline" as const,
    }

    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gestiona la información de tus clientes</p>
        </div>
        <Button onClick={handleNewClient}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Barra de búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, DNI, CUIL, teléfono o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de clientes */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredClients.length} cliente{filteredClients.length !== 1 ? "s" : ""}
          </CardTitle>
          <CardDescription>{searchTerm && `Mostrando resultados para "${searchTerm}"`}</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? "No se encontraron clientes" : "No hay clientes registrados"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Intenta con otro término de búsqueda" : "Comienza agregando tu primer cliente"}
              </p>
              {!searchTerm && (
                <Button onClick={handleNewClient}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Crear Cliente
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>DNI/CUIL</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="font-mono text-sm">{client.client_code || "N/A"}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{client.full_name}</p>
                          {client.city && <p className="text-sm text-muted-foreground">{client.city}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {client.dni && <p className="text-sm">DNI: {client.dni}</p>}
                          {client.cuil && <p className="text-sm text-muted-foreground">CUIL: {client.cuil}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {client.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3" />
                              {client.phone}
                            </div>
                          )}
                          {client.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ClientStatusSelector clientId={client.id} currentStatus={client.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handlePrintCard(client)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleViewClient(client.id)}>
                            Ver detalles
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de impresión */}
      {showPrintModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Tarjeta de Cliente</CardTitle>
              <CardDescription>Vista previa para imprimir</CardDescription>
            </CardHeader>
            <CardContent>
              <ClientCardPrint client={selectedClient} />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPrintModal(false)}>
                Cancelar
              </Button>
              <Button onClick={() => window.print()}>Imprimir</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}

// Componente para cambiar el estado del cliente
function ClientStatusSelector({ clientId, currentStatus }: { clientId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.from("clients").update({ status: newStatus }).eq("id", clientId)

      if (error) throw error

      setStatus(newStatus)
      toast({
        title: "Estado actualizado",
        description: "El estado del cliente se actualizó correctamente",
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Select value={status} onValueChange={handleStatusChange} disabled={loading}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="active">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Activo
          </div>
        </SelectItem>
        <SelectItem value="inactive">
          <div className="flex items-center gap-2">
            <Edit className="h-4 w-4 text-gray-600" />
            Inactivo
          </div>
        </SelectItem>
        <SelectItem value="pending">
          <div className="flex items-center gap-2">
            <Edit className="h-4 w-4 text-yellow-600" />
            Pendiente
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
