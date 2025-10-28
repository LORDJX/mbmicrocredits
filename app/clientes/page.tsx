"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserPlus, Search, FileText, Eye } from "lucide-react"
import { ClientCard } from "@/components/client-card"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Client {
  id: string
  client_code: string
  first_name: string
  last_name: string
  dni: string
  phone: string
  email: string
  address: string
  status: string
  dni_photo_url?: string
  dni_back_url?: string
  cbu_cvu?: string
  alias?: string
  referred_by?: string
  observations?: string
}

export default function ClientesPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showCard, setShowCard] = useState(false)

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    try {
      setLoading(true)
      const supabase = await createClient()

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      if (error) throw error

      setClients(data || [])
    } catch (error) {
      console.error("Error loading clients:", error)
      toast.error("Error al cargar los clientes")
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter((client) => {
    const searchLower = searchTerm.toLowerCase()
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase()

    return (
      fullName.includes(searchLower) ||
      client.dni?.toLowerCase().includes(searchLower) ||
      client.client_code?.toLowerCase().includes(searchLower) ||
      client.phone?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower)
    )
  })

  const handleViewDetails = (clientId: string) => {
    try {
      router.push(`/clientes/${clientId}`)
    } catch (error) {
      console.error("Error navigating to client details:", error)
      toast.error("Error al abrir los detalles del cliente")
    }
  }

  const handleShowCard = (client: Client) => {
    setSelectedClient(client)
    setShowCard(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-7xl">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-work-sans">Clientes</h1>
              <p className="text-muted-foreground mt-2">Gestiona la información de tus clientes</p>
            </div>
            <Button onClick={() => router.push("/clientes/nuevo")} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Nuevo Cliente
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre, DNI, CUIL, teléfono o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="p-6">
              <div className="text-sm text-muted-foreground mb-4">
                {filteredClients.length} cliente{filteredClients.length !== 1 ? "s" : ""}
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Cargando clientes...</p>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchTerm ? "No se encontraron clientes" : "No hay clientes registrados"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cliente</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">DNI/CUIL</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Contacto</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Estado</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map((client) => (
                        <tr key={client.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">
                                {client.first_name} {client.last_name}
                              </span>
                              <span className="text-sm text-muted-foreground">{client.client_code}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-foreground">DNI: {client.dni}</td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1">
                              {client.phone && (
                                <span className="text-sm text-foreground flex items-center gap-2">
                                  📞 {client.phone}
                                </span>
                              )}
                              {client.email && <span className="text-sm text-muted-foreground">{client.email}</span>}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-2 w-2 rounded-full ${
                                  client.status === "activo" ? "bg-green-500" : "bg-gray-400"
                                }`}
                              />
                              <span className="text-sm text-foreground capitalize">{client.status || "Activo"}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShowCard(client)}
                                title="Ver ficha"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(client.id)}
                                title="Ver detalles"
                              >
                                <Eye className="h-4 w-4" />
                                Ver detalles
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Client Card Modal */}
      {showCard && selectedClient && (
        <ClientCard
          client={selectedClient}
          onClose={() => {
            setShowCard(false)
            setSelectedClient(null)
          }}
        />
      )}
    </div>
  )
}
