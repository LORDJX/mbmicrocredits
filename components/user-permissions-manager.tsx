"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Save, Shield } from "lucide-react"

interface Permission {
  id: string
  route_path: string
}

interface UserPermissionsManagerProps {
  userId: string
  userName: string
}

// Rutas disponibles en tu aplicación
const AVAILABLE_ROUTES = [
  { path: "/dashboard", label: "Dashboard", description: "Página principal" },
  { path: "/dashboard/prestamos", label: "Préstamos", description: "Gestión de préstamos" },
  { path: "/dashboard/clientes", label: "Clientes", description: "Gestión de clientes" },
  { path: "/dashboard/cronograma", label: "Cronograma", description: "Ver cronograma de cuotas" },
  { path: "/dashboard/seguimientos", label: "Seguimientos", description: "Seguimientos de clientes" },
  { path: "/dashboard/recibos", label: "Recibos", description: "Gestión de recibos" },
  { path: "/dashboard/gastos", label: "Gastos", description: "Gestión de gastos" },
  { path: "/dashboard/socios", label: "Socios", description: "Gestión de socios" },
  { path: "/dashboard/usuarios", label: "Usuarios", description: "Gestión de usuarios (Admin)" },
]

export function UserPermissionsManager({ userId, userName }: UserPermissionsManagerProps) {
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Cargar permisos actuales
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/permissions`)
        if (!response.ok) throw new Error("Error al cargar permisos")
        
        const data = await response.json()
        const routePaths = data.permissions.map((p: Permission) => p.route_path)
        setPermissions(routePaths)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar permisos")
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [userId])

  const togglePermission = (routePath: string) => {
    setPermissions((prev) => {
      if (prev.includes(routePath)) {
        return prev.filter((p) => p !== routePath)
      } else {
        return [...prev, routePath]
      }
    })
    setSuccess(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")
    setSuccess(false)

    try {
      const response = await fetch(`/api/users/${userId}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ route_paths: permissions }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al guardar permisos")
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar permisos")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          Permisos guardados correctamente
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permisos de Acceso
          </CardTitle>
          <CardDescription>
            Selecciona las rutas a las que {userName} puede acceder
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {AVAILABLE_ROUTES.map((route) => {
              const isChecked = permissions.includes(route.path)
              
              return (
                <div
                  key={route.path}
                  className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={route.path}
                    checked={isChecked}
                    onCheckedChange={() => togglePermission(route.path)}
                    disabled={saving}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={route.path}
                      className="font-medium cursor-pointer"
                    >
                      {route.label}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {route.description}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {route.path}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {permissions.length} {permissions.length === 1 ? "permiso" : "permisos"} seleccionado
              {permissions.length !== 1 ? "s" : ""}
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Guardar Permisos
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPermissions(AVAILABLE_ROUTES.map((r) => r.path))
              setSuccess(false)
            }}
            disabled={saving}
          >
            Seleccionar Todo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPermissions([])
              setSuccess(false)
            }}
            disabled={saving}
          >
            Deseleccionar Todo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPermissions(["/dashboard", "/dashboard/prestamos", "/dashboard/clientes"])
              setSuccess(false)
            }}
            disabled={saving}
          >
            Permisos Básicos
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
