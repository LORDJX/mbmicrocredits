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
import { MoreHorizontal, PlusCircle, Search, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { NewLoanForm } from "./new-loan-form" // Importar el nuevo componente

// Información del cliente anidada
interface ClientInfo {
  client_code: string
  first_name: string
  last_name: string
}

// Definición de tipos para un préstamo
interface Loan {
  id: string
  loan_code: string
  client_id: string
  amount: number
  installments: number
  loan_type: string | null
  interest_rate: number | null
  installment_amount?: number // Nuevo campo opcional
  delivery_mode?: string // Nuevo campo opcional
  amount_to_repay?: number // Nuevo campo opcional
  start_date: string | null // Formato ISO string
  end_date: string | null // Formato ISO string
  status: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  clients: ClientInfo | null // Cliente asociado
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false) // Estado para el diálogo de creación
  const [currentLoan, setCurrentLoan] = useState<Loan | null>(null)
  const [searchTerm, setSearchTerm] = useState("") // Estado para el término de búsqueda
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchLoans()
  }, [searchTerm]) // Volver a cargar préstamos cuando cambie el término de búsqueda

  const fetchLoans = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = searchTerm ? `/api/loans?search=${encodeURIComponent(searchTerm)}` : "/api/loans"
      const response = await fetch(url, { cache: "no-store" })
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `Error al cargar préstamos: ${response.status} ${response.statusText}`
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail || errorMessage
        } catch (jsonError) {
          errorMessage = `Error al cargar préstamos: ${response.status} ${response.statusText}. Respuesta no JSON: ${errorText.substring(0, 100)}...`
        }
        throw new Error(errorMessage)
      }
      const data: Loan[] = await response.json()
      setLoans(data)
    } catch (err: any) {
      console.error("Error al cargar préstamos:", err.message)
      setError("Error al cargar préstamos: " + err.message)
      toast({
        title: "Error",
        description: `No se pudieron cargar los préstamos: ${err.message}`,
        variant: "destructive",
      })
      if (err.message.includes("permisos") || err.message.includes("403")) {
        router.push("/dashboard")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (loan: Loan) => {
    setCurrentLoan(loan)
    setIsEditDialogOpen(true)
  }

  const handleSaveLoan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentLoan) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/loans/${currentLoan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          client_id: currentLoan.client_id,
          amount: currentLoan.amount,
          installments: currentLoan.installments,
          loan_type: currentLoan.loan_type,
          interest_rate: currentLoan.interest_rate,
          start_date: currentLoan.start_date,
          end_date: currentLoan.end_date,
          status: currentLoan.status,
          installment_amount: currentLoan.installment_amount,
          delivery_mode: currentLoan.delivery_mode,
          amount_to_repay: currentLoan.amount_to_repay,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `Error al actualizar préstamo: ${response.status} ${response.statusText}`
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail || errorMessage
        } catch (jsonError) {
          errorMessage = `Error al actualizar préstamo: ${response.status} ${response.statusText}. Respuesta no JSON: ${errorText.substring(0, 100)}...`
        }
        throw new Error(errorMessage)
      }

      toast({
        title: "Éxito",
        description: "Préstamo actualizado correctamente.",
      })
      setIsEditDialogOpen(false)
      fetchLoans() // Volver a cargar la lista para ver los cambios
    } catch (err: any) {
      console.error("Error al guardar préstamo:", err.message)
      setError("Error al guardar préstamo: " + err.message)
      toast({
        title: "Error",
        description: `No se pudo actualizar el préstamo: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLoan = async (loanId: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar (soft delete) este préstamo?")) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/loans/${loanId}`, {
        method: "DELETE",
        cache: "no-store",
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `Error al eliminar préstamo: ${response.status} ${response.statusText}`
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail || errorMessage
        } catch (jsonError) {
          errorMessage = `Error al eliminar préstamo: ${response.status} ${response.statusText}. Respuesta no JSON: ${errorText.substring(0, 100)}...`
        }
        throw new Error(errorMessage)
      }

      toast({
        title: "Éxito",
        description: "Préstamo eliminado (soft delete) correctamente.",
      })
      fetchLoans() // Volver a cargar la lista para ver los cambios
    } catch (err: any) {
      console.error("Error al eliminar préstamo:", err.message)
      setError("Error al eliminar préstamo: " + err.message)
      toast({
        title: "Error",
        description: `No se pudo eliminar el préstamo: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateInterestRate = (loan: Loan): number => {
    if (loan.amount_to_repay && loan.amount > 0) {
      return Math.round((loan.amount_to_repay / loan.amount - 1) * 100)
    }
    if (loan.installment_amount && loan.installments > 0 && loan.amount > 0) {
      const totalAmount = loan.installment_amount * loan.installments
      return Math.round((totalAmount / loan.amount - 1) * 100)
    }
    return loan.interest_rate ? Math.round(loan.interest_rate) : 0
  }

  const generatePaymentSchedule = (loan: Loan) => {
    if (!loan.start_date || !loan.installment_amount) return []

    const startDate = new Date(loan.start_date)
    const schedule = []
    const currentDate = new Date(startDate)

    const dayIncrement = loan.loan_type === "Semanal" ? 7 : loan.loan_type === "Quincenal" ? 15 : 30

    for (let i = 1; i <= loan.installments; i++) {
      schedule.push({
        installment: i,
        date: new Date(currentDate),
        amount: loan.installment_amount,
      })
      currentDate.setDate(currentDate.getDate() + dayIncrement)
    }

    return schedule
  }

  const printLoanSchedule = (loan: Loan) => {
    const schedule = generatePaymentSchedule(loan)
    const clientName = loan.clients ? `${loan.clients.first_name} ${loan.clients.last_name}` : "Cliente no encontrado"
    const totalAmount = loan.installment_amount ? loan.installment_amount * loan.installments : 0

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cronograma de Préstamo - ${loan.loan_code}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .logo { width: 80px; height: 80px; margin: 0 auto 10px; }
            .company-name { font-size: 24px; font-weight: bold; color: #d4a574; margin-bottom: 5px; }
            .document-title { font-size: 18px; color: #666; }
            .loan-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-section { background: #f8f9fa; padding: 15px; border-radius: 8px; }
            .info-title { font-weight: bold; color: #333; margin-bottom: 10px; font-size: 16px; }
            .info-item { margin-bottom: 8px; }
            .label { font-weight: bold; color: #666; }
            .schedule-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .schedule-table th, .schedule-table td { border: 1px solid #ddd; padding: 12px; text-align: center; }
            .schedule-table th { background-color: #f8f9fa; font-weight: bold; color: #333; }
            .schedule-table tr:nth-child(even) { background-color: #f8f9fa; }
            .total-row { background-color: #e9ecef !important; font-weight: bold; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">
              <img src="/images/logo-bm.png" alt="BM Microcréditos" style="width: 80px; height: 80px;" />
            </div>
            <div class="company-name">BM MICROCRÉDITOS</div>
            <div class="document-title">Cronograma de Pagos</div>
          </div>
          
          <div class="loan-info">
            <div class="info-section">
              <div class="info-title">Información del Préstamo</div>
              <div class="info-item"><span class="label">Código:</span> ${loan.loan_code}</div>
              <div class="info-item"><span class="label">Cliente:</span> ${clientName}</div>
              <div class="info-item"><span class="label">Monto Prestado:</span> $${loan.amount.toFixed(2)}</div>
              <div class="info-item"><span class="label">Monto Total a Devolver:</span> $${totalAmount.toFixed(2)}</div>
            </div>
            <div class="info-section">
              <div class="info-title">Detalles del Pago</div>
              <div class="info-item"><span class="label">Tipo:</span> ${loan.loan_type || "N/A"}</div>
              <div class="info-item"><span class="label">Cantidad de Cuotas:</span> ${loan.installments}</div>
              <div class="info-item"><span class="label">Monto por Cuota:</span> $${(loan.installment_amount || 0).toFixed(2)}</div>
              <div class="info-item"><span class="label">Fecha de Inicio:</span> ${loan.start_date ? new Date(loan.start_date).toLocaleDateString() : "N/A"}</div>
            </div>
          </div>
          
          <table class="schedule-table">
            <thead>
              <tr>
                <th>Cuota N°</th>
                <th>Fecha de Pago</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              ${schedule
                .map(
                  (payment) => `
                <tr>
                  <td>${payment.installment}</td>
                  <td>${payment.date.toLocaleDateString()}</td>
                  <td>$${payment.amount.toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
              <tr class="total-row">
                <td colspan="2"><strong>TOTAL</strong></td>
                <td><strong>$${totalAmount.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
          
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              }
            }
          </script>
        </body>
      </html>
    `)

    printWindow.document.close()
  }

  if (loading && loans.length === 0) {
    // Mostrar cargando solo en la carga inicial
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-gray-100">
        <p>Cargando préstamos...</p>
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
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-50">Gestión de Préstamos</CardTitle>
              <CardDescription className="text-gray-400">
                Lista de todos los préstamos registrados y su estado.
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gray-600 hover:bg-gray-700 text-gray-50 font-semibold"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Préstamo
            </Button>
          </div>
          <div className="relative mt-4">
            <Input
              type="text"
              placeholder="Buscar por código de préstamo, cliente..."
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
                  <TableHead className="text-gray-300">Código Préstamo</TableHead>
                  <TableHead className="text-gray-300">Cliente</TableHead>
                  <TableHead className="text-gray-300">Monto</TableHead>
                  <TableHead className="text-gray-300">Cuotas</TableHead>
                  <TableHead className="text-gray-300">Tipo</TableHead>
                  <TableHead className="text-gray-300">Tasa Interés</TableHead>{" "}
                  {/* Mantener columna pero calcular dinámicamente */}
                  <TableHead className="text-gray-300">Modo Entrega</TableHead> {/* Nueva columna */}
                  <TableHead className="text-gray-300">Fecha Inicio</TableHead>
                  <TableHead className="text-gray-300">Estado</TableHead>
                  <TableHead className="text-gray-300">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id} className="border-gray-700 hover:bg-gray-700/50">
                    <TableCell className="font-medium text-gray-200">{loan.loan_code}</TableCell>
                    <TableCell className="text-gray-300">
                      {loan.clients
                        ? `${loan.clients.first_name} ${loan.clients.last_name} (${loan.clients.client_code})`
                        : loan.client_id}
                    </TableCell>
                    <TableCell className="text-gray-300">${loan.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-gray-300">{loan.installments}</TableCell>
                    <TableCell className="text-gray-300">{loan.loan_type || "N/A"}</TableCell>
                    <TableCell className="text-gray-300">{calculateInterestRate(loan)}%</TableCell>
                    <TableCell className="text-gray-300">{loan.delivery_mode || "N/A"}</TableCell> {/* Nueva columna */}
                    <TableCell className="text-gray-300">
                      {loan.start_date ? new Date(loan.start_date).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          loan.deleted_at
                            ? "bg-red-600 text-red-50"
                            : loan.status === "activo"
                              ? "bg-green-600 text-green-50"
                              : "bg-yellow-600 text-yellow-50"
                        }`}
                      >
                        {loan.deleted_at ? "Eliminado" : loan.status || "N/A"}
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
                            onClick={() => handleEditClick(loan)}
                            className="hover:bg-gray-600 focus:bg-gray-600 cursor-pointer"
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => printLoanSchedule(loan)}
                            className="hover:bg-gray-600 focus:bg-gray-600 cursor-pointer"
                          >
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir Cronograma
                          </DropdownMenuItem>
                          {!loan.deleted_at && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteLoan(loan.id)}
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

      {/* Diálogo de Creación de Préstamo */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-50">Crear Nuevo Préstamo</DialogTitle>
            <DialogDescription className="text-gray-400">
              Completa la información para registrar un nuevo préstamo.
            </DialogDescription>
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

      {/* Diálogo de Edición de Préstamo */}
      {currentLoan && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-gray-50">Editar Préstamo</DialogTitle>
              <DialogDescription className="text-gray-400">
                Realiza cambios en la información del préstamo aquí. Haz clic en guardar cuando hayas terminado.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveLoan} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client_id" className="text-right text-gray-300">
                  ID Cliente
                </Label>
                <Input
                  id="client_id"
                  value={currentLoan.client_id}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, client_id: e.target.value })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                  disabled
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right text-gray-300">
                  Monto
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={currentLoan.amount}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, amount: Number.parseFloat(e.target.value) })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="installments" className="text-right text-gray-300">
                  Cuotas
                </Label>
                <Input
                  id="installments"
                  type="number"
                  step="1"
                  value={currentLoan.installments}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, installments: Number.parseInt(e.target.value) })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="loan_type" className="text-right text-gray-300">
                  Tipo de Préstamo
                </Label>
                <Input
                  id="loan_type"
                  value={currentLoan.loan_type || ""}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, loan_type: e.target.value })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="interest_rate" className="text-right text-gray-300">
                  Tasa de Interés (%)
                </Label>
                <Input
                  id="interest_rate"
                  type="number"
                  step="0.01"
                  value={currentLoan.interest_rate || ""}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, interest_rate: Number.parseFloat(e.target.value) })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="installment_amount" className="text-right text-gray-300">
                  Monto por Cuota
                </Label>
                <Input
                  id="installment_amount"
                  type="number"
                  step="0.01"
                  value={currentLoan.installment_amount || ""}
                  onChange={(e) =>
                    setCurrentLoan({ ...currentLoan, installment_amount: Number.parseFloat(e.target.value) })
                  }
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="delivery_mode" className="text-right text-gray-300">
                  Modo Entrega
                </Label>
                <Input
                  id="delivery_mode"
                  value={currentLoan.delivery_mode || ""}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, delivery_mode: e.target.value })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="start_date" className="text-right text-gray-300">
                  Fecha Inicio
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={currentLoan.start_date ? currentLoan.start_date.split("T")[0] : ""}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, start_date: e.target.value })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="end_date" className="text-right text-gray-300">
                  Fecha Fin
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  value={currentLoan.end_date ? currentLoan.end_date.split("T")[0] : ""}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, end_date: e.target.value })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right text-gray-300">
                  Estado
                </Label>
                <Input
                  id="status"
                  value={currentLoan.status || ""}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, status: e.target.value })}
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
    </div>
  )
}
