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
import { NewLoanForm } from "./new-loan-form"
import { openPrintWindowForLoan, type Frequency } from "@/lib/print-loan"

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
  total_to_return?: number | null
  installments: number
  loan_type: Frequency | null // Semanal | Quincenal | Mensual
  interest_rate?: number | null // ya no editable, solo referencia si llega del backend
  start_date: string | null // ISO
  end_date: string | null // ISO
  status: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  clients: ClientInfo | null
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [currentLoan, setCurrentLoan] = useState<Loan | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchLoans()
  }, [searchTerm])

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
        } catch {
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
          total_to_return: currentLoan.total_to_return ?? undefined,
          installments: currentLoan.installments,
          loan_type: currentLoan.loan_type,
          start_date: currentLoan.start_date,
          end_date: currentLoan.end_date,
          status: currentLoan.status,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `Error al actualizar préstamo: ${response.status} ${response.statusText}`
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail || errorMessage
        } catch {
          errorMessage = `Error al actualizar préstamo: ${response.status} ${response.statusText}. Respuesta no JSON: ${errorText.substring(0, 100)}...`
        }
        throw new Error(errorMessage)
      }

      toast({
        title: "Éxito",
        description: "Préstamo actualizado correctamente.",
      })
      setIsEditDialogOpen(false)
      fetchLoans()
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
        } catch {
          errorMessage = `Error al eliminar préstamo: ${response.status} ${response.statusText}. Respuesta no JSON: ${errorText.substring(0, 100)}...`
        }
        throw new Error(errorMessage)
      }
      toast({
        title: "Éxito",
        description: "Préstamo eliminado (soft delete) correctamente.",
      })
      fetchLoans()
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

  const computedRate = (loan: Loan): number | null => {
    if (loan.amount > 0 && loan.total_to_return && loan.total_to_return > 0) {
      return (loan.total_to_return / loan.amount - 1) * 100
    }
    if (loan.interest_rate != null) return loan.interest_rate
    return null
  }

  if (loading && loans.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p>Cargando préstamos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-red-600">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white text-gray-900 border border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Gestión de Préstamos</CardTitle>
              <CardDescription className="text-gray-500">
                Lista de todos los préstamos registrados y su estado.
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gray-700 text-gray-50 hover:bg-gray-800">
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
              className="w-full pl-10"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-600">Código Préstamo</TableHead>
                  <TableHead className="text-gray-600">Cliente</TableHead>
                  <TableHead className="text-gray-600">Monto</TableHead>
                  <TableHead className="text-gray-600">Monto a devolver</TableHead>
                  <TableHead className="text-gray-600">Cuotas</TableHead>
                  <TableHead className="text-gray-600">Tipo de préstamo</TableHead>
                  <TableHead className="text-gray-600">Tasa calculada</TableHead>
                  <TableHead className="text-gray-600">Inicio</TableHead>
                  <TableHead className="text-gray-600">Fin</TableHead>
                  <TableHead className="text-gray-600">Estado</TableHead>
                  <TableHead className="text-gray-600">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => {
                  const rate = computedRate(loan)
                  const clientLabel = loan.clients
                    ? `${loan.clients.first_name} ${loan.clients.last_name} (${loan.clients.client_code})`
                    : loan.client_id

                  return (
                    <TableRow key={loan.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{loan.loan_code}</TableCell>
                      <TableCell>{clientLabel}</TableCell>
                      <TableCell>${loan.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        {loan.total_to_return != null ? `$${loan.total_to_return.toFixed(2)}` : "N/D"}
                      </TableCell>
                      <TableCell>{loan.installments}</TableCell>
                      <TableCell>{loan.loan_type || "N/A"}</TableCell>
                      <TableCell>{rate != null ? `${rate.toFixed(2)}%` : "N/A"}</TableCell>
                      <TableCell>{loan.start_date ? new Date(loan.start_date).toLocaleDateString() : "N/A"}</TableCell>
                      <TableCell>{loan.end_date ? new Date(loan.end_date).toLocaleDateString() : "N/A"}</TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            loan.deleted_at
                              ? "bg-red-100 text-red-700"
                              : loan.status === "activo"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {loan.deleted_at ? "Eliminado" : loan.status || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:text-gray-900"
                            title="Imprimir PDF"
                            onClick={() => {
                              const amountToReturn =
                                loan.total_to_return != null
                                  ? loan.total_to_return
                                  : loan.amount * (1 + (loan.interest_rate ?? 0) / 100)
                              const freq = (loan.loan_type ?? "Mensual") as Frequency
                              openPrintWindowForLoan({
                                logoSrc: "/images/logo-bm.png",
                                companyName: "BM Microcredits",
                                loanCode: loan.loan_code,
                                clientLabel,
                                amountToReturn,
                                installments: loan.installments,
                                startDateISO: loan.start_date ?? new Date().toISOString(),
                                frequency: freq,
                              })
                            }}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditClick(loan)} className="cursor-pointer">
                                Editar
                              </DropdownMenuItem>
                              {!loan.deleted_at && (
                                <DropdownMenuItem
                                  onClick={() => handleDeleteLoan(loan.id)}
                                  className="cursor-pointer text-red-600 focus:text-red-700"
                                >
                                  Eliminar (Soft Delete)
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de Creación de Préstamo */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Préstamo</DialogTitle>
            <DialogDescription>Completa la información para registrar un nuevo préstamo.</DialogDescription>
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Préstamo</DialogTitle>
              <DialogDescription>
                Realiza cambios en la información del préstamo aquí. Haz clic en guardar cuando hayas terminado.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveLoan} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client_id" className="text-right">
                  ID Cliente
                </Label>
                <Input
                  id="client_id"
                  value={currentLoan.client_id}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, client_id: e.target.value })}
                  className="col-span-3"
                  disabled
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Monto
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={currentLoan.amount}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, amount: Number.parseFloat(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="total_to_return" className="text-right">
                  Monto a devolver
                </Label>
                <Input
                  id="total_to_return"
                  type="number"
                  step="0.01"
                  value={currentLoan.total_to_return ?? ""}
                  onChange={(e) =>
                    setCurrentLoan({
                      ...currentLoan,
                      total_to_return: e.target.value ? Number.parseFloat(e.target.value) : null,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="installments" className="text-right">
                  Cuotas
                </Label>
                <Input
                  id="installments"
                  type="number"
                  step="1"
                  value={currentLoan.installments}
                  onChange={(e) =>
                    setCurrentLoan({ ...currentLoan, installments: Number.parseInt(e.target.value || "0", 10) })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="loan_type" className="text-right">
                  Tipo de préstamo
                </Label>
                <Input
                  id="loan_type"
                  value={currentLoan.loan_type || ""}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, loan_type: e.target.value as Frequency })}
                  className="col-span-3"
                  placeholder="Semanal | Quincenal | Mensual"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="start_date" className="text-right">
                  Fecha Inicio
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={currentLoan.start_date ? currentLoan.start_date.split("T")[0] : ""}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, start_date: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="end_date" className="text-right">
                  Fecha Fin
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  value={currentLoan.end_date ? currentLoan.end_date.split("T")[0] : ""}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, end_date: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <DialogFooter className="mt-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gray-700 text-gray-50 hover:bg-gray-800" disabled={loading}>
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
