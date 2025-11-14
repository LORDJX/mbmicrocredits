"use client"

import type React from "react"

import { useEffect, useState, useMemo, memo } from "react"
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
import { MoreHorizontal, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce"

// Definición de tipos para un préstamo
interface Loan {
  id: string
  loan_code: string
  client_id: string
  amount: number
  installments: number
  loan_type: string | null
  interest_rate: number | null
  start_date: string | null
  end_date: string | null
  status: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// OPTIMIZACIÓN: Componente memoizado para cada fila
// Evita re-renders innecesarios cuando cambia el searchTerm
interface LoanRowProps {
  loan: Loan
  onEdit: (loan: Loan) => void
  onDelete: (loanId: string) => void
}

const LoanRow = memo(({ loan, onEdit, onDelete }: LoanRowProps) => {
  return (
    <TableRow className="border-gray-700 hover:bg-gray-700/50">
      <TableCell className="font-medium text-gray-200">{loan.loan_code}</TableCell>
      <TableCell className="text-gray-300">{loan.client_id}</TableCell>
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
              onClick={() => onEdit(loan)}
              className="hover:bg-gray-600 focus:bg-gray-600 cursor-pointer"
            >
              Editar
            </DropdownMenuItem>
            {!loan.deleted_at && (
              <DropdownMenuItem
                onClick={() => onDelete(loan.id)}
                className="hover:bg-red-700 focus:bg-red-700 text-red-300 hover:text-red-50 focus:text-red-50 cursor-pointer"
              >
                Eliminar (Soft Delete)
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
})

LoanRow.displayName = "LoanRow"

// Constantes de paginación
const ITEMS_PER_PAGE = 50 // Mostrar 50 préstamos por página

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentLoan, setCurrentLoan] = useState<Loan | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const { toast } = useToast()
  const router = useRouter()

  // OPTIMIZACIÓN: Debounce del search term para evitar fetches excesivos
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  useEffect(() => {
    fetchLoans()
    // Reset a página 1 cuando cambia la búsqueda
    setCurrentPage(1)
  }, [debouncedSearchTerm])

  const fetchLoans = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = debouncedSearchTerm 
        ? `/api/loans?search=${encodeURIComponent(debouncedSearchTerm)}` 
        : "/api/loans"
      const response = await fetch(url)
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

  // OPTIMIZACIÓN: Calcular préstamos paginados solo cuando sea necesario
  const paginatedLoans = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return loans.slice(startIndex, endIndex)
  }, [loans, currentPage])

  const totalPages = Math.ceil(loans.length / ITEMS_PER_PAGE)

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
        headers: {
          "Content-Type": "application/json",
        },
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

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  if (loading && loans.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-gray-100">
        <p>Cargando préstamos...</p>
      </div>
    )
  }

  if (error && loans.length === 0) {
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
          <CardTitle className="text-2xl font-bold text-gray-50">Gestión de Préstamos</CardTitle>
          <CardDescription className="text-gray-400">
            Lista de todos los préstamos registrados y su estado. Mostrando {paginatedLoans.length} de {loans.length} préstamos.
          </CardDescription>
          <div className="relative mt-4">
            <Input
              type="text"
              placeholder="Buscar por código de préstamo o ID de cliente..."
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
                  <TableHead className="text-gray-300">ID Cliente</TableHead>
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
                {paginatedLoans.map((loan) => (
                  <LoanRow 
                    key={loan.id} 
                    loan={loan} 
                    onEdit={handleEditClick} 
                    onDelete={handleDeleteLoan} 
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* PAGINACIÓN */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
              <div className="text-sm text-gray-400">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                <Label htmlFor="edit-client-id" className="text-right text-gray-300">
                  ID Cliente
                </Label>
                <Input
                  id="edit-client-id"
                  value={currentLoan.client_id}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, client_id: e.target.value })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                  disabled
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-amount" className="text-right text-gray-300">
                  Monto
                </Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  value={currentLoan.amount}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, amount: Number.parseFloat(e.target.value) })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-installments" className="text-right text-gray-300">
                  Cuotas
                </Label>
                <Input
                  id="edit-installments"
                  type="number"
                  step="1"
                  value={currentLoan.installments}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, installments: Number.parseInt(e.target.value) })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-loan-type" className="text-right text-gray-300">
                  Tipo de Préstamo
                </Label>
                <Input
                  id="edit-loan-type"
                  value={currentLoan.loan_type || ""}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, loan_type: e.target.value })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-interest-rate" className="text-right text-gray-300">
                  Tasa de Interés (%)
                </Label>
                <Input
                  id="edit-interest-rate"
                  type="number"
                  step="0.01"
                  value={currentLoan.interest_rate || ""}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, interest_rate: Number.parseFloat(e.target.value) })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-start-date" className="text-right text-gray-300">
                  Fecha Inicio
                </Label>
                <Input
                  id="edit-start-date"
                  type="date"
                  value={currentLoan.start_date ? currentLoan.start_date.split("T")[0] : ""}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, start_date: e.target.value })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-end-date" className="text-right text-gray-300">
                  Fecha Fin
                </Label>
                <Input
                  id="edit-end-date"
                  type="date"
                  value={currentLoan.end_date ? currentLoan.end_date.split("T")[0] : ""}
                  onChange={(e) => setCurrentLoan({ ...currentLoan, end_date: e.target.value })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right text-gray-300">
                  Estado
                </Label>
                <Input
                  id="edit-status"
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
