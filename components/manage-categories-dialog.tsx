"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Settings, Plus, Trash2, Loader2, Edit2, X, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { ExpenseCategory } from "@/lib/types/expenses"

interface ManageCategoriesDialogProps {
  onCategoriesChange?: () => void
}

export function ManageCategoriesDialog({ onCategoriesChange }: ManageCategoriesDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: "", color: "#3b82f6", icon: "📁" })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState({ name: "", color: "", icon: "" })

  useEffect(() => {
    if (open) {
      loadCategories()
    }
  }, [open])

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/expense-categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("[v0] Error loading categories:", error)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la categoría es requerido",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/expense-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory),
      })

      if (!response.ok) throw new Error("Error al crear categoría")

      toast({
        title: "Categoría creada",
        description: "La categoría se ha creado correctamente",
      })

      setNewCategory({ name: "", color: "#3b82f6", icon: "📁" })
      loadCategories()
      onCategoriesChange?.()
    } catch (error) {
      console.error("[v0] Error creating category:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la categoría",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartEdit = (category: ExpenseCategory) => {
    setEditingId(category.id)
    setEditingCategory({
      name: category.name,
      color: category.color,
      icon: category.icon,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingCategory({ name: "", color: "", icon: "" })
  }

  const handleSaveEdit = async (id: string) => {
    if (!editingCategory.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la categoría es requerido",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/expense-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCategory),
      })

      if (!response.ok) throw new Error("Error al actualizar categoría")

      toast({
        title: "Categoría actualizada",
        description: "La categoría se ha actualizado correctamente",
      })

      setEditingId(null)
      setEditingCategory({ name: "", color: "", icon: "" })
      loadCategories()
      onCategoriesChange?.()
    } catch (error) {
      console.error("[v0] Error updating category:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta categoría?")) return

    try {
      const response = await fetch(`/api/expense-categories/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Error al eliminar categoría")

      toast({
        title: "Categoría eliminada",
        description: "La categoría se ha eliminado correctamente",
      })

      loadCategories()
      onCategoriesChange?.()
    } catch (error) {
      console.error("[v0] Error deleting category:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <Settings className="mr-2 h-4 w-4" />
          Gestionar Categorías
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Categorías de Gastos</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulario para agregar nueva categoría */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Agregar Nueva Categoría</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="Ej: Servicios"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input value={newCategory.color} readOnly className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icono</Label>
                <Input
                  id="icon"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  placeholder="📁"
                  maxLength={2}
                />
              </div>
            </div>
            <Button onClick={handleAddCategory} disabled={loading} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Agregar Categoría
            </Button>
          </div>

          {/* Lista de categorías existentes */}
          <div className="space-y-2">
            <h3 className="font-semibold">Categorías Existentes</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Icono</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      {editingId === category.id ? (
                        <>
                          <TableCell>
                            <Input
                              value={editingCategory.name}
                              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                              placeholder="Nombre"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Input
                                type="color"
                                value={editingCategory.color}
                                onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                                className="w-12 h-8"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editingCategory.icon}
                              onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                              placeholder="📁"
                              maxLength={2}
                              className="w-16"
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant={category.is_active ? "default" : "secondary"}>
                              {category.is_active ? "Activa" : "Inactiva"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSaveEdit(category.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEdit}
                                className="text-gray-600 hover:text-gray-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded" style={{ backgroundColor: category.color }} />
                              <span className="text-sm text-muted-foreground">{category.color}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-2xl">{category.icon}</TableCell>
                          <TableCell>
                            <Badge variant={category.is_active ? "default" : "secondary"}>
                              {category.is_active ? "Activa" : "Inactiva"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStartEdit(category)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCategory(category.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
