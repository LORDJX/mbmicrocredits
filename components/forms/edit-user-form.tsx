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

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  username: string | null
  is_admin: boolean
  is_active: boolean
  role_id: string | null
  phone: string | null
  dni: string | null
}

interface EditUserFormProps {
  user: UserProfile
  onSuccess?: () => void
}

export default function EditUserForm({ user, onSuccess }: EditUserFormProps) {
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<UserRole[]>([])
  const [formData, setFormData] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    username: user.username || "",
    email: user.email,
    phone: user.phone || "",
    dni: user.dni || "",
    is_admin: user.is_admin,
    is_active: user.is_active,
    role_id: user.role_id || "",
    password: "", // Opcional para cambiar contraseña
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
      // Solo enviar password si se ingresó uno nuevo
      const dataToSend = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        dni: formData.dni,
        is_admin: formData.is_admin,
        is_active: formData.is_active,
        role_id: formData.role_id || null,
        ...(formData.password && { password: formData.password }),
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Error al actualizar usuario")
      }

      toast({
        title: "Éxito",
        description: "Usuario actualizado correctamente",
      })

      // Llamar al callback de éxito
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-first_name">Nombre</Label>
          <Input
            id="edit-first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            placeholder="Juan"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-last_name">Apellido</Label>
          <Input
            id="edit-last_name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            placeholder="Pérez"
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-email">Email</Label>
        <Input
          id="edit-email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="juan@ejemplo.com"
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-username">Usuario</Label>
        <Input
          id="edit-username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          placeholder="juanperez"
          minLength={3}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-password">
          Nueva Contraseña (dejar en blanco para no cambiar)
        </Label>
        <Input
          id="edit-password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="••••••••"
          minLength={6}
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-phone">Teléfono</Label>
          <Input
            id="edit-phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+54 351 123-4567"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-dni">DNI</Label>
          <Input
            id="edit-dni"
            value={formData.dni}
            onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
            placeholder="12345678"
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-role_id">Rol</Label>
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

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Switch
            id="edit-is_admin"
            checked={formData.is_admin}
            onCheckedChange={(checked) => setFormData({ ...formData, is_admin: checked })}
            disabled={loading}
          />
          <Label htmlFor="edit-is_admin" className="cursor-pointer">
            Administrador del sistema
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="edit-is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            disabled={loading}
          />
          <Label htmlFor="edit-is_active" className="cursor-pointer">
            Usuario activo
          </Label>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1" disabled={loading}>
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
