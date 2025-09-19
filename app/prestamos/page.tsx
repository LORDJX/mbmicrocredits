"use client"

import { useEffect, useState } from "react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, PlusCircle, Search, Eye, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { NewLoanForm } from "@/app/dashboard/loans/new-loan-form"

interface ClientInfo {
  client_code: string
  first_name: string
  last_name: string
}

interface Loan {
  id: string
  loan_code: string
  client_id: string
  amount: number
  installments: number
  loan_type: string | null
  interest_rate: number | null
  installment_amount?: number
  delivery_mode?: string
  amount_to_repay?: number
  start_date: string | null
  end_date: string | null
  status: string | null
  created_at: string
  clients: ClientInfo | null
}

export default function PrestamosPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [currentLoan, setCurrentLoan] = useState<Loan | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchLoans()
  }, [searchTerm])

  const fetchLoans = async () => {
    setLoading(true)
    try {
      const url = searchTerm ? `/api/loans?search=${encodeURIComponent(searchTerm)}` : "/api/loans"
      const response = await fetch(url)
      if (!response.ok) throw new Error("Error al cargar préstamos")
      const data = await response.json()

      const sortedLoans = data.sort((a: Loan, b: Loan) => {
        const getNumber = (code: string) => {
          const match = code.match(/\d+/)
          return match ? Number.parseInt(match[0]) : 0
        }
        return getNumber(b.loan_code) - getNumber(a.loan_code)
      })

      setLoans(sortedLoans)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los préstamos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePrintLoan = (loan: Loan) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Préstamo - ${loan.loan_code}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #000; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-item { margin-bottom: 10px; }
            .label { font-weight: bold; color: #333; }
            .value { margin-left: 10px; }
            .cronograma { margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BM MICROCRÉDITOS</h1>
            <h2>Contrato de Préstamo</h2>
            <p>Código: ${loan.loan_code}</p>
          </div>
          <div class="info-grid">
            <div>
              <div class="info-item">
                <span class="label">Cliente:</span>
                <span class="value">${loan.clients?.first_name} ${loan.clients?.last_name}</span>
              </div>
              <div class="info-item">
                <span class="label">Código Cliente:</span>
                <span class="value">${loan.clients?.client_code}</span>
              </div>
              <div class="info-item">
                <span class="label">Monto Prestado:</span>
                <span class="value">$${loan.amount.toLocaleString()}</span>
              </div>
              <div class="info-item">
                <span class="label">Tipo de Préstamo:</span>
                <span class="value">${loan.loan_type}</span>
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="label">Número de Cuotas:</span>
                <span class="value">${loan.installments}</span>
              </div>
              <div class="info-item">
                <span class="label">Monto por Cuota:</span>
                <span class="value">$${(loan.installment_amount || 0).toLocaleString()}</span>
              </div>
              <div class="info-item">
                <span class="label">Total a Pagar:</span>
                <span class="value">$${(loan.amount_to_repay || 0).toLocaleString()}</span>
              </div>
              <div class="info-item">
                <span class="label">Fecha de Inicio:</span>
                <span class="value">${loan.start_date ? new Date(loan.start_date).toLocaleDateString() : "No definida"}</span>
              </div>
            </div>
          </div>
          <div class="cronograma">
            <h3>Cronograma de Pagos</h3>
            <table>
              <thead>
                <tr>
                  <th>Cuota</th>
                  <th>Fecha Vencimiento</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${Array.from({ length: loan.installments }, (_, i) => {
                  const installmentDate = new Date(loan.start_date || new Date())
                  if (loan.loan_type === "Semanal") {
                    installmentDate.setDate(installmentDate.getDate() + i * 7)
                  } else if (loan.loan_type === "Quincenal") {
                    installmentDate.setDate(installmentDate.getDate() + i * 15)
                  } else {
                    installmentDate.setMonth(installmentDate.getMonth() + i)
                  }
                  return `
                    <tr>
                      <td>${i + 1}</td>
                      <td>${installmentDate.toLocaleDateString()}</td>
                      <td>$${(loan.installment_amount || 0).toLocaleString()}</td>
                      <td>Pendiente</td>
                    </tr>
                  `
                }).join("")}
              </tbody>
            </table>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
  }

  return (
    <PageLayout title="Gestión de Préstamos">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Préstamos Registrados</CardTitle>
                <CardDescription>Administra todos los préstamos del sistema</CardDescription>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Nuevo Préstamo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por código o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Cargando préstamos...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Cuotas</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell className="font-medium">{loan.loan_code}</TableCell>
                      <TableCell>
                        {loan.clients
                          ? `${loan.clients.first_name} ${loan.clients.last_name}`
                          : "Cliente no encontrado"}
                      </TableCell>
                      <TableCell>${loan.amount.toLocaleString()}</TableCell>
                      <TableCell>{loan.installments}</TableCell>
                      <TableCell>{loan.loan_type}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            loan.status === "activo" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {loan.status}
                        </span>
                      </TableCell>
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
                                setCurrentLoan(loan)
                                setIsDetailDialogOpen(true)
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrintLoan(loan)}>
                              <Printer className="mr-2 h-4 w-4" />
                              Imprimir Contrato
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

        {/* Dialog para crear nuevo préstamo */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Préstamo</DialogTitle>
              <DialogDescription>Completa la información para crear un nuevo préstamo</DialogDescription>
            </DialogHeader>
            <NewLoanForm
              onSuccess={() => {
                setIsCreateDialogOpen(false)
                fetchLoans()
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  )
}
