import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Plus, Search, Phone, Mail, MapPin } from "lucide-react"

async function getClients() {
  const supabase = await createClient()

  const { data: clients, error } = await supabase
    .from("active_clients")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching clients:", error)
    return []
  }

  return clients || []
}

export default async function ClientesPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const clients = await getClients()

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Activo
          </Badge>
        )
      case "inactive":
        return <Badge variant="secondary">Inactivo</Badge>
      case "pending":
        return (
          <Badge variant="outline" className="border-orange-200 text-orange-800">
            Pendiente
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status || "Sin estado"}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-work-sans">Clientes</h1>
          <p className="text-muted-foreground mt-2">Gestiona tu cartera de clientes y su información</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{clients.length}</div>
            <p className="text-xs text-muted-foreground">Clientes registrados</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {clients.filter((c) => c.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">Con préstamos activos</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Nuevos Este Mes</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {
                clients.filter((c) => {
                  const created = new Date(c.created_at)
                  const now = new Date()
                  return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Registrados este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground font-work-sans">Buscar Clientes</CardTitle>
          <CardDescription>Encuentra clientes por nombre, DNI o código</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, DNI o código..." className="pl-10 bg-input border-border" />
            </div>
            <Button variant="outline" className="border-border bg-transparent">
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

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
                <TableRow className="border-border">
                  <TableHead className="text-card-foreground">Código</TableHead>
                  <TableHead className="text-card-foreground">Nombre</TableHead>
                  <TableHead className="text-card-foreground">DNI</TableHead>
                  <TableHead className="text-card-foreground">Contacto</TableHead>
                  <TableHead className="text-card-foreground">Estado</TableHead>
                  <TableHead className="text-card-foreground">Fecha Registro</TableHead>
                  <TableHead className="text-card-foreground">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} className="border-border">
                    <TableCell className="font-mono text-sm">{client.client_code || "N/A"}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-card-foreground">
                          {client.first_name} {client.last_name}
                        </div>
                        {client.referred_by && (
                          <div className="text-xs text-muted-foreground">Referido por: {client.referred_by}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{client.dni || "N/A"}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {client.phone && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 mr-1" />
                            {client.phone}
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 mr-1" />
                            {client.email}
                          </div>
                        )}
                        {client.address && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            {client.address.substring(0, 30)}...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(client.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(client.created_at).toLocaleDateString("es-ES")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="border-border bg-transparent">
                          Ver
                        </Button>
                        <Button variant="outline" size="sm" className="border-border bg-transparent">
                          Editar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {clients.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground">No hay clientes</h3>
              <p className="text-muted-foreground">Comienza agregando tu primer cliente</p>
              <Button className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Cliente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
