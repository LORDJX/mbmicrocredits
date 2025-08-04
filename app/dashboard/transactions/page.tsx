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
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Definición de tipos para una transacción
interface Transaction {
  id: string
  type: "income" | "expense"
  amount: number
  description: string | null
  partner_id: string | null
  created_at: string
  updated_at: string
}

// Estado inicial para la nueva transacción
const initialNewTransactionState = {
  type: "income" as "income" | "expense",
  amount: 0,
  description: "",
  partner_id: "",
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null)
  const [newTransaction, setNewTransaction] = useState(initialNewTransactionState)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/transactions")
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `Error al cargar transacciones: ${response.status} ${response.statusText}`
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail || errorMessage
        } catch (jsonError) {
          errorMessage = `Error al cargar transacciones: ${response.status} ${response.statusText}. Respuesta no JSON: ${errorText.substring(0, 100)}...`
        }
        throw new Error(errorMessage)
      }
      const data: Transaction[] = await response.json()
      setTransactions(data)
    } catch (err: any) {
      console.error("Error al cargar transacciones:", err.message)
      setError("Error al cargar transacciones: " + err.message)
      toast({
        title: "Error",
        description: `No se pudieron cargar las transacciones: ${err.message}`,
        variant: "destructive",
      })
      if (err.message.includes("permisos") || err.message.includes("403")) {
        router.push("/dashboard")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (transaction: Transaction) => {
    setCurrentTransaction(transaction)
    setIsEditDialogOpen(true)
  }

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentTransaction) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/transactions/${currentTransaction.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: currentTransaction.type,
          amount: currentTransaction.amount,
          description: currentTransaction.description,
          partner_id: currentTransaction.partner_id || null, // Asegurarse de enviar null si está vacío
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `Error al actualizar transacción: ${response.status} ${response.statusText}`
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail || errorMessage
        } catch (jsonError) {
          errorMessage = `Error al actualizar transacción: ${response.status} ${response.statusText}. Respuesta no JSON: ${errorText.substring(0, 100)}...`
        }
        throw new Error(errorMessage)
      }

      toast({
        title: "Éxito",
        description: "Transacción actualizada correctamente.",
      })
      setIsEditDialogOpen(false)
      fetchTransactions()
    } catch (err: any) {
      console.error("Error al guardar transacción:", err.message)
      setError("Error al guardar transacción: " + err.message)
      toast({
        title: "Error",
        description: `No se pudo actualizar la transacción: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newTransaction,
          partner_id: newTransaction.partner_id || null, // Asegurarse de enviar null si está vacío
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `Error al crear transacción: ${response.status} ${response.statusText}`
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail || errorMessage
        } catch (jsonError) {
          errorMessage = `Error al crear transacción: ${response.status} ${response.statusText}. Respuesta no JSON: ${errorText.substring(0, 100)}...`
        }
        throw new Error(errorMessage)
      }

      toast({
        title: "Éxito",
        description: "Transacción creada correctamente.",
      })
      setIsCreateDialogOpen(false)
      setNewTransaction(initialNewTransactionState) // Resetear el formulario
      fetchTransactions()
    } catch (err: any) {
      console.error("Error al crear transacción:", err.message)
      setError("Error al crear transacción: " + err.message)
      toast({
        title: "Error",
        description: `No se pudo crear la transacción: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta transacción?")) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `Error al eliminar transacción: ${response.status} ${response.statusText}`
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail || errorMessage
        } catch (jsonError) {
          errorMessage = `Error al eliminar transacción: ${response.status} ${response.statusText}. Respuesta no JSON: ${errorText.substring(0, 100)}...`
        }
        throw new Error(errorMessage)
      }

      toast({
        title: "Éxito",
        description: "Transacción eliminada correctamente.",
      })
      fetchTransactions()
    } catch (err: any) {
      console.error("Error al eliminar transacción:", err.message)
      setError("Error al eliminar transacción: " + err.message)
      toast({
        title: "Error",
        description: `No se pudo eliminar la transacción: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-gray-100">
        <p>Cargando transacciones...</p>
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
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-gray-50">Gestión de Transacciones</CardTitle>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-gray-50 font-semibold"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Transacción
            </Button>
          </div>
          <CardDescription className="text-gray-400">
            Lista de todos los ingresos y egresos registrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-gray-700 hover:bg-gray-700 border-gray-600">
                  <TableHead className="text-gray-300">Tipo</TableHead>
                  <TableHead className="text-gray-300">Monto</TableHead>
                  <TableHead className="text-gray-300">Descripción</TableHead>
                  <TableHead className="text-gray-300">ID Socio</TableHead>
                  <TableHead className="text-gray-300">Fecha Creación</TableHead>
                  <TableHead className="text-gray-300">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} className="border-gray-700 hover:bg-gray-700/50">
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          transaction.type === "income" ? "bg-blue-600 text-blue-50" : "bg-red-600 text-red-50"
                        }`}
                      >
                        {transaction.type === "income" ? "Ingreso" : "Egreso"}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-gray-200">${transaction.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-gray-300">{transaction.description || "N/A"}</TableCell>
                    <TableCell className="text-gray-300">{transaction.partner_id || "N/A"}</TableCell>
                    <TableCell className="text-gray-300">
                      {new Date(transaction.created_at).toLocaleDateString()}
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
                            onClick={() => handleEditClick(transaction)}
                            className="hover:bg-gray-600 focus:bg-gray-600 cursor-pointer"
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="hover:bg-red-700 focus:bg-red-700 text-red-300 hover:text-red-50 focus:text-red-50 cursor-pointer"
                          >
                            Eliminar
                          </DropdownMenuItem>
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

      {/* Diálogo de Edición de Transacción */}
      {currentTransaction && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-gray-50">Editar Transacción</DialogTitle>
              <DialogDescription className="text-gray-400">
                Realiza cambios en la información de la transacción aquí.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveTransaction} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right text-gray-300">
                  Tipo
                </Label>
                <Select
                  value={currentTransaction.type}
                  onValueChange={(value: "income" | "expense") =>
                    setCurrentTransaction({ ...currentTransaction, type: value })
                  }
                >
                  <SelectTrigger className="col-span-3 bg-gray-700 border-gray-600 text-gray-100">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 text-gray-100 border-gray-600">
                    <SelectItem value="income">Ingreso</SelectItem>
                    <SelectItem value="expense">Egreso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right text-gray-300">
                  Monto
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={currentTransaction.amount}
                  onChange={(e) =>
                    setCurrentTransaction({ ...currentTransaction, amount: Number.parseFloat(e.target.value) })
                  }
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right text-gray-300">
                  Descripción
                </Label>
                <Input
                  id="description"
                  value={currentTransaction.description || ""}
                  onChange={(e) => setCurrentTransaction({ ...currentTransaction, description: e.target.value })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="partner_id" className="text-right text-gray-300">
                  ID Socio
                </Label>
                <Input
                  id="partner_id"
                  value={currentTransaction.partner_id || ""}
                  onChange={(e) => setCurrentTransaction({ ...currentTransaction, partner_id: e.target.value })}
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

      {/* Diálogo de Creación de Nueva Transacción */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-50">Crear Nueva Transacción</DialogTitle>
            <DialogDescription className="text-gray-400">
              Ingresa los detalles de la nueva transacción aquí.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTransaction} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_type" className="text-right text-gray-300">
                Tipo
              </Label>
              <Select
                value={newTransaction.type}
                onValueChange={(value: "income" | "expense") => setNewTransaction({ ...newTransaction, type: value })}
              >
                <SelectTrigger id="new_type" className="col-span-3 bg-gray-700 border-gray-600 text-gray-100">
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 text-gray-100 border-gray-600">
                  <SelectItem value="income">Ingreso</SelectItem>
                  <SelectItem value="expense">Egreso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_amount" className="text-right text-gray-300">
                Monto
              </Label>
              <Input
                id="new_amount"
                type="number"
                step="0.01"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: Number.parseFloat(e.target.value) })}
                className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_description" className="text-right text-gray-300">
                Descripción
              </Label>
              <Input
                id="new_description"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_partner_id" className="text-right text-gray-300">
                ID Socio (Opcional)
              </Label>
              <Input
                id="new_partner_id"
                value={newTransaction.partner_id}
                onChange={(e) => setNewTransaction({ ...newTransaction, partner_id: e.target.value })}
                className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
              />
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600 hover:text-gray-50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-gray-50 font-semibold"
                disabled={loading}
              >
                {loading ? "Creando..." : "Crear Transacción"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
