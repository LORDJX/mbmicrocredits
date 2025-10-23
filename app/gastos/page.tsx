"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, DollarSign, Calendar, FileText, Edit2 } from "lucide-react"
import { CreateExpenseForm } from "@/components/forms/create-expense-form"
import { ManageCategoriesDialog } from "@/components/manage-categories-dialog"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import type { ExpenseWithDetails, ExpenseCategory, CategoryExpenseStats } from "@/lib/types/expenses"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

export default function GastosPage() {
  const { toast } = useToast()
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [editingExpense, setEditingExpense] = useState<ExpenseWithDetails | null>(null)

  useEffect(() => {
    loadData()
  }, [selectedCategory, selectedStatus])

  const loadData = async () => {
    setLoading(true)
    try {
      const categoriesRes = await fetch("/api/expense-categories")
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)
      }

      const params = new URLSearchParams()
      if (selectedCategory !== "all") params.append("category", selectedCategory)
      if (selectedStatus !== "all") params.append("status", selectedStatus)

      const expensesRes = await fetch(`/api/expenses?${params}`)
      if (expensesRes.ok) {
        const expensesData = await expensesRes.json()
        setExpenses(expensesData)
      }
    } catch (error) {
      console.error("[v0] Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.expense_code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
  const pendingExpenses = filteredExpenses.filter((e) => e.status === "pending").length
  const approvedExpenses = filteredExpenses.filter((e) => e.audit_status === "approved").length

  const categoryStats: CategoryExpenseStats[] = useMemo(() => {
    const stats = new Map<string, CategoryExpenseStats>()

    filteredExpenses.forEach((expense) => {
      const catId = expense.category_id || "sin-categoria"
      const catName = expense.category_name || "Sin Categoría"
      const catColor = expense.category_color || "#6B7280"

      if (!stats.has(catId)) {
        stats.set(catId, {
          category_id: catId,
          category_name: catName,
          category_color: catColor,
          total_amount: 0,
          expense_count: 0,
          percentage: 0,
        })
      }

      const stat = stats.get(catId)!
      stat.total_amount += Number(expense.amount)
      stat.expense_count += 1
    })

    const statsArray = Array.from(stats.values())
    const total = statsArray.reduce((sum, s) => sum + s.total_amount, 0)

    statsArray.forEach((stat) => {
      stat.percentage = total > 0 ? (stat.total_amount / total) * 100 : 0
    })

    return statsArray.sort((a, b) => b.total_amount - a.total_amount)
  }, [filteredExpenses])

  const handleUpdateStatus = async (expenseId: string, newStatus: "pending" | "paid") => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error("Error al actualizar estado")

      toast({
        title: "Estado actualizado",
        description: `El gasto ahora está marcado como ${newStatus === "paid" ? "pagado" : "pendiente"}`,
      })

      loadData()
    } catch (error) {
      console.error("[v0] Error updating status:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      })
    }
  }

  const handleUpdateAuditStatus = async (expenseId: string, newAuditStatus: "pending" | "approved" | "rejected") => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audit_status: newAuditStatus }),
      })

      if (!response.ok) throw new Error("Error al actualizar auditoría")

      toast({
        title: "Auditoría actualizada",
        description: `El gasto ha sido ${newAuditStatus === "approved" ? "aprobado" : newAuditStatus === "rejected" ? "rechazado" : "marcado como pendiente"}`,
      })

      loadData()
    } catch (error) {
      console.error("[v0] Error updating audit status:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la auditoría",
        variant: "destructive",
      })
    }
  }

  const handleEditExpense = (expense: ExpenseWithDetails) => {
    setEditingExpense(expense)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingExpense(null)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: "Pendiente" },
      paid: { variant: "default", label: "Pagado" },
    }
    const config = variants[status] || variants.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getAuditStatusBadge = (auditStatus: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: "Pendiente" },
      approved: { variant: "default", label: "Aprobado" },
      rejected: { variant: "destructive", label: "Rechazado" },
    }
    const config = variants[auditStatus] || variants.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Efectivo",
      transfer: "Transferencia",
      card: "Tarjeta",
      check: "Cheque",
      other: "Otro",
    }
    return labels[method] || method
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Registro de Gastos</h1>
          <p className="text-muted-foreground">Gestiona y controla todos los gastos del negocio</p>
        </div>
        <div className="flex gap-2">
          <ManageCategoriesDialog onCategoriesChange={loadData} />
          <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Nuevo Gasto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingExpense ? "Editar Gasto" : "Registrar Nuevo Gasto"}</DialogTitle>
              </DialogHeader>
              <CreateExpenseForm
                expense={editingExpense}
                onSuccess={() => {
                  handleCloseDialog()
                  loadData()
                }}
                onCancel={handleCloseDialog}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalExpenses.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">{filteredExpenses.length} gastos registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes de Pago</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingExpenses}</div>
            <p className="text-xs text-muted-foreground">Gastos por pagar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedExpenses}</div>
            <p className="text-xs text-muted-foreground">Gastos aprobados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gastos por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryStats.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats}
                    dataKey="total_amount"
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ category_name, percentage }) => `${category_name}: ${percentage.toFixed(1)}%`}
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.category_color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `$${value.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No hay datos para mostrar</div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descripción, proveedor o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando gastos...</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron gastos. Crea uno nuevo para comenzar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Método de Pago</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Auditoría</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-mono text-sm">{expense.expense_code}</TableCell>
                      <TableCell>{format(new Date(expense.expense_date), "dd/MM/yyyy", { locale: es })}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: expense.category_color || "#6B7280" }}
                          />
                          {expense.category_name || "Sin categoría"}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                      <TableCell>{expense.vendor_name || "-"}</TableCell>
                      <TableCell>{getPaymentMethodLabel(expense.payment_method)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ${Number(expense.amount).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={expense.status}
                          onValueChange={(value: any) => handleUpdateStatus(expense.id, value)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue>{getStatusBadge(expense.status)}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="paid">Pagado</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={expense.audit_status}
                          onValueChange={(value: any) => handleUpdateAuditStatus(expense.id, value)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue>{getAuditStatusBadge(expense.audit_status)}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="approved">Aprobado</SelectItem>
                            <SelectItem value="rejected">Rechazado</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEditExpense(expense)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
