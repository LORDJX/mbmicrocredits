"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface UserRole {
  id: string
  name: string
  description: string
}

interface CreateUserFormProps {
  onSuccess?: () => void
}

export default function CreateUserForm({ onSuccess }: CreateUserFormProps) {
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<UserRole[]>([])
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    username: "",
    phone: "",
    dni: "",
    is_admin: false,
    role_id: "",
  })
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Cargar roles disponibles
  useEffect(() => {
    const loadRoles = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('name')

      if (!error && data) {
        setRoles(data)
      }
    }
    loadRoles()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        throw new Error(error.message || "Error al crear usuario")
      }

      toast({
        title: "Éxito",
        description: "Usuario creado correctamente",
      })

      // Reset form
      setFormData({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        username: "",
        phone: "",
        dni: "",
        is_admin: false,
        role_id: "",
      })

      // Llamar al callback de éxito
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">Nombre</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            placeholder="Juan"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Apellido</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            placeholder="Pérez"
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="juan@ejemplo.com"
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Usuario</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          placeholder="juanperez"
          minLength={3}
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+54 351 123-4567"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dni">DNI</Label>
          <Input
            id="dni"
            value={formData.dni}
            onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
            placeholder="12345678"
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role_id">Rol</Label>
        <Select
          value={formData.role_id}
          onValueChange={(value) => setFormData({ ...formData, role_id: value })}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un rol (opcional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Sin rol asignado</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_admin"
          checked={formData.is_admin}
          onCheckedChange={(checked) => setFormData({ ...formData, is_admin: checked })}
          disabled={loading}
        />
        <Label htmlFor="is_admin" className="cursor-pointer">
          Administrador del sistema
        </Label>
      </div>

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
