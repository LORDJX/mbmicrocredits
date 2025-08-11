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
import { MoreHorizontal, PlusCircle, Search } from "lucide-react"
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
                  <TableHead className="text-gray-300">Tasa Interés</TableHead>
                  <TableHead className="text-gray-300">Fecha Inicio</TableHead>
                  <TableHead className="text-gray-300">Fecha Fin</TableHead>
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
                    <TableCell className="text-gray-300">
                      {loan.interest_rate ? `${loan.interest_rate}%` : "N/A"}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {loan.start_date ? new Date(loan.start_date).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {loan.end_date ? new Date(loan.end_date).toLocaleDateString() : "N/A"}
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
