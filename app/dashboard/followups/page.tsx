"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Calendar, AlertCircle, Clock, Pencil, Trash2, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CreateFollowUpForm } from "@/components/forms/create-followup-form"
import type { FollowUpWithClient } from "@/lib/types/followups"
import { PageHeader } from "@/components/page-header"

export default function FollowUpsPage() {
  const [followups, setFollowups] = useState<FollowUpWithClient[]>([])
  const [filteredFollowups, setFilteredFollowups] = useState<FollowUpWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFollowup, setEditingFollowup] = useState<FollowUpWithClient | null>(null)

  useEffect(() => {
    fetchFollowups()
  }, [])

  useEffect(() => {
    filterFollowups()
  }, [followups, searchTerm, statusFilter])

  const fetchFollowups = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/followups")
      if (!response.ok) throw new Error("Error al cargar seguimientos")
      const data = await response.json()
      setFollowups(data)
    } catch (error) {
      console.error("[v0] Error fetching follow-ups:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterFollowups = () => {
    let filtered = [...followups]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (f) =>
          f.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.client_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.notes?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((f) => f.status === statusFilter)
    }

    setFilteredFollowups(filtered)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este seguimiento?")) return

    try {
      const response = await fetch(`/api/followups/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Error al eliminar seguimiento")

      await fetchFollowups()
    } catch (error) {
      console.error("[v0] Error deleting follow-up:", error)
      alert("Error al eliminar seguimiento")
    }
  }

  const handleEdit = (followup: FollowUpWithClient) => {
    setEditingFollowup(followup)
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingFollowup(null)
  }

  const handleSuccess = async () => {
    handleDialogClose()
    await fetchFollowups()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        )
      case "overdue":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Vencido
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const stats = {
    total: followups.length,
    pending: followups.filter((f) => f.status === "pending").length,
    overdue: followups.filter((f) => f.status === "overdue").length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Seguimientos" description="Gestiona los seguimientos de clientes" />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Seguimientos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por cliente o notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="overdue">Vencidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Seguimiento
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Recordatorio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFollowups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron seguimientos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFollowups.map((followup) => (
                    <TableRow key={followup.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{followup.client_name}</div>
                          <div className="text-sm text-muted-foreground">{followup.client_code}</div>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(followup.date), "dd/MM/yyyy", { locale: es })}</TableCell>
                      <TableCell>
                        {followup.reminder_date
                          ? format(new Date(followup.reminder_date), "dd/MM/yyyy", { locale: es })
                          : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(followup.status)}</TableCell>
                      <TableCell className="max-w-xs truncate">{followup.notes || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(followup)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(followup.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingFollowup ? "Editar" : "Nuevo"} Seguimiento</DialogTitle>
          </DialogHeader>
          <CreateFollowUpForm
            followup={editingFollowup || undefined}
            onSuccess={handleSuccess}
            onCancel={handleDialogClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
