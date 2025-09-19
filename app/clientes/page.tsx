"use client"

import { useEffect, useState } from "react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, PlusCircle, Search, Eye, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Client {
  id: string
  client_code: string
  first_name: string
  last_name: string
  phone: string
  address: string
  dni: string
  created_at: string
}

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [currentClient, setCurrentClient] = useState<Client | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchClients()
  }, [searchTerm])

  const fetchClients = async () => {
    setLoading(true)
    try {
      const url = searchTerm ? `/api/clients?search=${encodeURIComponent(searchTerm)}` : "/api/clients"
      const response = await fetch(url)
      if (!response.ok) throw new Error("Error al cargar clientes")
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePrintClient = (client: Client) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cliente - ${client.client_code}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #000; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-item { margin-bottom: 10px; }
            .label { font-weight: bold; color: #333; }
            .value { margin-left: 10px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BM MICROCRÉDITOS</h1>
            <h2>Información del Cliente</h2>
            <p>Código: ${client.client_code}</p>
          </div>
          <div class="info-grid">
            <div>
              <div class="info-item">
                <span class="label">Nombre Completo:</span>
                <span class="value">${client.first_name} ${client.last_name}</span>
              </div>
              <div class="info-item">
                <span class="label">DNI:</span>
                <span class="value">${client.dni || "No registrado"}</span>
              </div>
              <div class="info-item">
                <span class="label">Teléfono:</span>
                <span class="value">${client.phone || "No registrado"}</span>
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="label">Dirección:</span>
                <span class="value">${client.address || "No registrada"}</span>
              </div>
              <div class="info-item">
                <span class="label">Fecha de Registro:</span>
                <span class="value">${new Date(client.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
  }

  const filteredClients = clients.filter(
    (client) =>
      client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.client_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.dni?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <PageLayout title="Gestión de Clientes">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Clientes Registrados</CardTitle>
                <CardDescription>Gestiona la información de todos los clientes del sistema</CardDescription>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Nuevo Cliente
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, código o DNI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredClients.length} cliente{filteredClients.length !== 1 ? "s" : ""} encontrado
                {filteredClients.length !== 1 ? "s" : ""}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Cargando clientes...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>DNI</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.client_code}</TableCell>
                      <TableCell>
                        {client.first_name} {client.last_name}
                      </TableCell>
                      <TableCell>{client.dni || "No registrado"}</TableCell>
                      <TableCell>{client.phone || "No registrado"}</TableCell>
                      <TableCell>{new Date(client.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setCurrentClient(client)
                                setIsDetailDialogOpen(true)
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrintClient(client)}>
                              <Printer className="mr-2 h-4 w-4" />
                              Imprimir PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Detalles del Cliente */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalles del Cliente</DialogTitle>
              <DialogDescription>Información completa del cliente seleccionado</DialogDescription>
            </DialogHeader>
            {currentClient && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Código</Label>
                    <p className="text-sm text-muted-foreground">{currentClient.client_code}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Nombre Completo</Label>
                    <p className="text-sm text-muted-foreground">
                      {currentClient.first_name} {currentClient.last_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">DNI</Label>
                    <p className="text-sm text-muted-foreground">{currentClient.dni || "No registrado"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Teléfono</Label>
                    <p className="text-sm text-muted-foreground">{currentClient.phone || "No registrado"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Dirección</Label>
                    <p className="text-sm text-muted-foreground">{currentClient.address || "No registrada"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Fecha de Registro</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(currentClient.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => currentClient && handlePrintClient(currentClient)}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimir PDF
              </Button>
              <Button onClick={() => setIsDetailDialogOpen(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  )
}
