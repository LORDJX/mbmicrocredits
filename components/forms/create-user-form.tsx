"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface CreateUserFormProps {
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

export default function CreateUserForm({ onSuccess }: CreateUserFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    is_admin: false,
  })
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["/dashboard"])
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Email y contraseña son requeridos",
        variant: "destructive",
      })
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      })
      return
    }

    if (!formData.is_admin && selectedPermissions.length < 2) {
      toast({
        title: "Error",
        description: "Selecciona al menos un permiso además de Dashboard",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || error.message || "Error al crear usuario")
      }

      const newUser = await response.json()

      if (!formData.is_admin) {
        const permResponse = await fetch(`/api/users/${newUser.id}/permissions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: newUser.id,
            routes: selectedPermissions,
          }),
        })

        if (!permResponse.ok) {
          console.error("Error al asignar permisos, pero usuario creado")
        }
      }

      toast({
        title: "Éxito",
        description: "Usuario creado exitosamente",
      })

      // Reset form
      setFormData({
        email: "",
        password: "",
        full_name: "",
        is_admin: false,
      })
      setSelectedPermissions(["/dashboard"])

      onSuccess?.()
    } catch (error) {
      console.error("Error al crear usuario:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el usuario",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionChange = (route: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions((prev) => [...prev, route])
    } else if (route !== "/dashboard") {
      // No permitir desmarcar dashboard
      setSelectedPermissions((prev) => prev.filter((r) => r !== route))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="usuario@ejemplo.com"
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña *</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="••••••••"
          required
          minLength={6}
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_name">Nombre Completo</Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          placeholder="Juan Pérez"
          disabled={loading}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_admin"
          checked={formData.is_admin}
          onCheckedChange={(checked) => {
            setFormData({ ...formData, is_admin: checked })
            if (checked) {
              setSelectedPermissions([])
            } else {
              setSelectedPermissions(["/dashboard"])
            }
          }}
          disabled={loading}
        />
        <Label htmlFor="is_admin" className="cursor-pointer">
          Administrador del sistema
        </Label>
      </div>

      {!formData.is_admin && (
        <div className="space-y-3 pt-4 border-t">
          <Label>Permisos de Acceso *</Label>
          <p className="text-xs text-muted-foreground">Selecciona al menos un permiso además de Dashboard</p>
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-4">
            {AVAILABLE_PERMISSIONS.filter((p) => !p.adminOnly).map((perm) => (
              <div key={perm.route} className="flex items-center space-x-2">
                <Checkbox
                  id={`perm-${perm.route}`}
                  checked={selectedPermissions.includes(perm.route)}
                  onCheckedChange={(checked) => handlePermissionChange(perm.route, checked as boolean)}
                  disabled={perm.route === "/dashboard" || loading}
                />
                <label
                  htmlFor={`perm-${perm.route}`}
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
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : (
            "Crear Usuario"
          )}
        </Button>
      </div>
    </form>
  )
}
