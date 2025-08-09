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

// Definición de tipos para un socio
interface Partner {
  id: string
  name: string
  capital: number
  withdrawals: number
  generated_interest: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// Estado inicial para el nuevo socio
const initialNewPartnerState = {
  name: "",
  capital: 0,
}

// Tipos para errores de formulario
interface FormErrors {
  name?: string
  capital?: string
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [currentPartner, setCurrentPartner] = useState<Partner | null>(null)
  const [newPartner, setNewPartner] = useState(initialNewPartnerState)
  const [formErrors, setFormErrors] = useState<FormErrors>({}) // Estado para errores de formulario
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchPartners()
  }, [])

  const fetchPartners = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/partners", { cache: "no-store" })
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `Error al cargar socios: ${response.status} ${response.statusText}`
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail || errorMessage
        } catch (jsonError) {
          errorMessage = `Error al cargar socios: ${response.status} ${response.statusText}. Respuesta no JSON: ${errorText.substring(0, 100)}...`
        }
        throw new Error(errorMessage)
      }
      const data: Partner[] = await response.json()
      setPartners(data)
    } catch (err: any) {
      console.error("Error al cargar socios:", err.message)
      setError("Error al cargar socios: " + err.message)
      toast({
        title: "Error",
        description: `No se pudieron cargar los socios: ${err.message}`,
        variant: "destructive",
      })
      if (err.message.includes("permisos") || err.message.includes("403")) {
        router.push("/dashboard")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (partner: Partner) => {
    setCurrentPartner(partner)
    setIsEditDialogOpen(true)
  }

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPartner) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/partners/${currentPartner.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: currentPartner.name,
          capital: currentPartner.capital,
          withdrawals: currentPartner.withdrawals,
          generated_interest: currentPartner.generated_interest,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `Error al actualizar socio: ${response.status} ${response.statusText}`
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail || errorMessage
        } catch (jsonError) {
          errorMessage = `Error al actualizar socio: ${response.status} ${response.statusText}. Respuesta no JSON: ${errorText.substring(0, 100)}...`
        }
        throw new Error(errorMessage)
      }

      toast({
        title: "Éxito",
        description: "Socio actualizado correctamente.",
      })
      setIsEditDialogOpen(false)
      fetchPartners()
    } catch (err: any) {
      console.error("Error al guardar socio:", err.message)
      setError("Error al guardar socio: " + err.message)
      toast({
        title: "Error",
        description: `No se pudo actualizar el socio: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const validateCreateForm = (): boolean => {
    const errors: FormErrors = {}
    if (!newPartner.name.trim()) {
      errors.name = "El nombre es obligatorio."
    }
    if (newPartner.capital <= 0) {
      errors.capital = "El capital debe ser un número mayor que cero."
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateCreateForm()) {
      toast({
        title: "Error de validación",
        description: "Por favor, corrige los errores en el formulario.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/partners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPartner),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `Error al crear socio: ${response.status} ${response.statusText}`
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail || errorMessage
        } catch (jsonError) {
          errorMessage = `Error al crear socio: ${response.status} ${response.statusText}. Respuesta no JSON: ${errorText.substring(0, 100)}...`
        }
        throw new Error(errorMessage)
      }

      toast({
        title: "Éxito",
        description: "Socio creado correctamente.",
      })
      setIsCreateDialogOpen(false)
      setNewPartner(initialNewPartnerState) // Resetear el formulario
      setFormErrors({}) // Limpiar errores
      fetchPartners()
    } catch (err: any) {
      console.error("Error al crear socio:", err.message)
      setError("Error al crear socio: " + err.message)
      toast({
        title: "Error",
        description: `No se pudo crear el socio: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePartner = async (partnerId: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar (soft delete) este socio?")) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/partners/${partnerId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `Error al eliminar socio: ${response.status} ${response.statusText}`
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail || errorMessage
        } catch (jsonError) {
          errorMessage = `Error al eliminar socio: ${response.status} ${response.statusText}. Respuesta no JSON: ${errorText.substring(0, 100)}...`
        }
        throw new Error(errorMessage)
      }

      toast({
        title: "Éxito",
        description: "Socio eliminado (soft delete) correctamente.",
      })
      fetchPartners()
    } catch (err: any) {
      console.error("Error al eliminar socio:", err.message)
      setError("Error al eliminar socio: " + err.message)
      toast({
        title: "Error",
        description: `No se pudo eliminar el socio: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-gray-100">
        <p>Cargando socios...</p>
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
            <CardTitle className="text-2xl font-bold text-gray-50">Gestión de Socios</CardTitle>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-gray-50 font-semibold"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Socio
            </Button>
          </div>
          <CardDescription className="text-gray-400">
            Lista de todos los socios registrados y su información financiera.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-gray-700 hover:bg-gray-700 border-gray-600">
                  <TableHead className="text-gray-300">Nombre</TableHead>
                  <TableHead className="text-gray-300">Capital</TableHead>
                  <TableHead className="text-gray-300">Retiros</TableHead>
                  <TableHead className="text-gray-300">Intereses Generados</TableHead>
                  <TableHead className="text-gray-300">Estado</TableHead>
                  <TableHead className="text-gray-300">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => (
                  <TableRow key={partner.id} className="border-gray-700 hover:bg-gray-700/50">
                    <TableCell className="font-medium text-gray-200">{partner.name}</TableCell>
                    <TableCell className="text-gray-300">${partner.capital.toFixed(2)}</TableCell>
                    <TableCell className="text-gray-300">${partner.withdrawals.toFixed(2)}</TableCell>
                    <TableCell className="text-gray-300">${partner.generated_interest.toFixed(2)}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          partner.deleted_at ? "bg-red-600 text-red-50" : "bg-green-600 text-green-50"
                        }`}
                      >
                        {partner.deleted_at ? "Eliminado" : "Activo"}
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
                            onClick={() => handleEditClick(partner)}
                            className="hover:bg-gray-600 focus:bg-gray-600 cursor-pointer"
                          >
                            Editar
                          </DropdownMenuItem>
                          {!partner.deleted_at && (
                            <DropdownMenuItem
                              onClick={() => handleDeletePartner(partner.id)}
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

      {/* Diálogo de Edición de Socio */}
      {currentPartner && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-gray-50">Editar Socio</DialogTitle>
              <DialogDescription className="text-gray-400">
                Realiza cambios en la información del socio aquí. Haz clic en guardar cuando hayas terminado.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSavePartner} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-gray-300">
                  Nombre
                </Label>
                <Input
                  id="name"
                  value={currentPartner.name}
                  onChange={(e) => setCurrentPartner({ ...currentPartner, name: e.target.value })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="capital" className="text-right text-gray-300">
                  Capital
                </Label>
                <Input
                  id="capital"
                  type="number"
                  step="0.01"
                  value={currentPartner.capital}
                  onChange={(e) => setCurrentPartner({ ...currentPartner, capital: Number.parseFloat(e.target.value) })}
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="withdrawals" className="text-right text-gray-300">
                  Retiros
                </Label>
                <Input
                  id="withdrawals"
                  type="number"
                  step="0.01"
                  value={currentPartner.withdrawals}
                  onChange={(e) =>
                    setCurrentPartner({ ...currentPartner, withdrawals: Number.parseFloat(e.target.value) })
                  }
                  className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="generated_interest" className="text-right text-gray-300">
                  Intereses Generados
                </Label>
                <Input
                  id="generated_interest"
                  type="number"
                  step="0.01"
                  value={currentPartner.generated_interest}
                  onChange={(e) =>
                    setCurrentPartner({ ...currentPartner, generated_interest: Number.parseFloat(e.target.value) })
                  }
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

      {/* Diálogo de Creación de Nuevo Socio */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-50">Crear Nuevo Socio</DialogTitle>
            <DialogDescription className="text-gray-400">Ingresa los detalles del nuevo socio aquí.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePartner} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="new_name" className="text-right text-gray-300 pt-2">
                Nombre
              </Label>
              <div className="col-span-3">
                <Input
                  id="new_name"
                  value={newPartner.name}
                  onChange={(e) => {
                    setNewPartner({ ...newPartner, name: e.target.value })
                    if (formErrors.name) setFormErrors({ ...formErrors, name: undefined })
                  }}
                  className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="new_capital" className="text-right text-gray-300 pt-2">
                Capital
              </Label>
              <div className="col-span-3">
                <Input
                  id="new_capital"
                  type="number"
                  step="0.01"
                  value={newPartner.capital}
                  onChange={(e) => {
                    setNewPartner({ ...newPartner, capital: Number.parseFloat(e.target.value) || 0 })
                    if (formErrors.capital) setFormErrors({ ...formErrors, capital: undefined })
                  }}
                  className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
                {formErrors.capital && <p className="text-red-500 text-xs mt-1">{formErrors.capital}</p>}
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  setFormErrors({})
                  setNewPartner(initialNewPartnerState)
                }}
                className="bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600 hover:text-gray-50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-gray-50 font-semibold"
                disabled={loading}
              >
                {loading ? "Creando..." : "Crear Socio"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
