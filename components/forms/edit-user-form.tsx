"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  username: string | null
  is_admin: boolean
}

interface EditUserFormProps {
  user: UserProfile
  onSuccess?: () => void
}

const AVAILABLE_PERMISSIONS = [
  { route: "/dashboard", label: "Dashboard", adminOnly: false, alwaysIncluded: true },
  { route: "/dashboard/users", label: "Gestión de Usuarios", adminOnly: true },
  { route: "/dashboard/partners", label: "Gestión de Socios", adminOnly: false },
  { route: "/clientes", label: "Gestión de Clientes", adminOnly: false },
  { route: "/prestamos", label: "Gestión de Préstamos", adminOnly: false },
  { route: "/dashboard/receipts", label: "Recibos", adminOnly: false },
  { route: "/cronogramas", label: "Cronograma", adminOnly: false },
  { route: "/gastos", label: "Gastos", adminOnly: false },
  { route: "/dashboard/followups", label: "Seguimientos", adminOnly: false },
  { route: "/dashboard/resumen", label: "Resumen para Socios", adminOnly: false },
  { route: "/reportes", label: "Informes Financieros", adminOnly: false },
  { route: "/formulas", label: "Fórmulas", adminOnly: false },
]

export default function EditUserForm({ user, onSuccess }: EditUserFormProps) {
  const [loading, setLoading] = useState(false)
  const [loadingPermissions, setLoadingPermissions] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user.full_name || "",
    email: user.email,
    is_admin: user.is_admin,
  })
  const [editPermissions, setEditPermissions] = useState<string[]>([])
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user.is_admin) {
        setLoadingPermissions(true)
        try {
          const response = await fetch(`/api/users/${user.id}/permissions?userId=${user.id}`)
          if (response.ok) {
            const data = await response.json()
            setEditPermissions(data.user_routes || ["/dashboard"])
          }
        } catch (error) {
          console.error("Error al cargar permisos:", error)
          setEditPermissions(["/dashboard"])
        } finally {
          setLoadingPermissions(false)
        }
      }
    }
    loadPermissions()
  }, [user.id, user.is_admin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.is_admin && editPermissions.length < 2) {
      toast({
        title: "Error",
        description: "Selecciona al menos un permiso además de Dashboard",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name || null,
          is_admin: formData.is_admin,
        })
        .eq("id", user.id)

      if (profileError) {
        throw new Error(profileError.message)
      }

      if (!formData.is_admin) {
        const permResponse = await fetch(`/api/users/${user.id}/permissions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            routes: editPermissions,
          }),
        })

        if (!permResponse.ok) {
          console.error("Error al actualizar permisos")
        }
      } else {
        await fetch(`/api/users/${user.id}/permissions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            routes: [],
          }),
        })
      }

      toast({
        title: "Éxito",
        description: "Usuario actualizado exitosamente",
      })

      onSuccess?.()
    } catch (error) {
      console.error("Error al actualizar usuario:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar el usuario",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionChange = (route: string, checked: boolean) => {
    if (checked) {
      setEditPermissions((prev) => [...prev, route])
    } else if (route !== "/dashboard") {
      setEditPermissions((prev) => prev.filter((r) => r !== route))
    }
  }

  const handleAdminChange = (checked: boolean) => {
    setFormData({ ...formData, is_admin: checked })
    if (checked) {
      setEditPermissions([])
    } else {
      setEditPermissions(["/dashboard"])
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-email">Email</Label>
        <Input id="edit-email" type="email" value={formData.email} disabled className="bg-muted" />
        <p className="text-xs text-muted-foreground">El email no se puede modificar</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-full_name">Nombre Completo</Label>
        <Input
          id="edit-full_name"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          placeholder="Juan Pérez"
          disabled={loading}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch id="edit-is_admin" checked={formData.is_admin} onCheckedChange={handleAdminChange} disabled={loading} />
        <Label htmlFor="edit-is_admin" className="cursor-pointer">
          Administrador del sistema
        </Label>
      </div>

      {!formData.is_admin && (
        <div className="space-y-3 pt-4 border-t">
          <Label>Permisos de Acceso *</Label>
          {loadingPermissions ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Cargando permisos...</span>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">Selecciona al menos un permiso además de Dashboard</p>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                {AVAILABLE_PERMISSIONS.filter((p) => !p.adminOnly).map((perm) => (
                  <div key={perm.route} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-perm-${perm.route}`}
                      checked={editPermissions.includes(perm.route)}
                      onCheckedChange={(checked) => handlePermissionChange(perm.route, checked as boolean)}
                      disabled={perm.route === "/dashboard" || loading}
                    />
                    <label
                      htmlFor={`edit-perm-${perm.route}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {perm.label}
                      {perm.route === "/dashboard" && (
                        <span className="text-xs text-muted-foreground ml-2">(obligatorio)</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1" disabled={loading || loadingPermissions}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Actualizando...
            </>
          ) : (
            "Guardar Cambios"
          )}
        </Button>
      </div>
    </form>
  )
}
