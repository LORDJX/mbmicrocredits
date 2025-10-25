"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"

interface UserRole {
  id: string
  name: string
  description: string | null
}

interface User {
  id: string
  first_name: string
  last_name: string
  dni: string
  phone: string | null
  address: string | null
  is_active: boolean
  role_id: string | null
}

interface CreateUserFormProps {
  user?: User
  roles: UserRole[]
  onSuccess?: () => void
}

export function CreateUserForm({ user, roles, onSuccess }: CreateUserFormProps) {
  const isEditing = !!user
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    dni: user?.dni || "",
    phone: user?.phone || "",
    address: user?.address || "",
    role_id: user?.role_id || "",
    is_active: user?.is_active ?? true,
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (isEditing) {
        // Actualizar usuario existente
        const response = await fetch(`/api/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: formData.first_name,
            last_name: formData.last_name,
            dni: formData.dni,
            phone: formData.phone || null,
            address: formData.address || null,
            role_id: formData.role_id || null,
            is_active: formData.is_active,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Error al actualizar usuario")
        }
      } else {
        // Crear nuevo usuario con Supabase Auth
        if (!formData.email || !formData.password) {
          throw new Error("Email y contraseña son requeridos para crear un usuario")
        }

        // 1. Crear usuario en Supabase Auth
        const authResponse = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        })

        if (!authResponse.ok) {
          const data = await authResponse.json()
          throw new Error(data.error || "Error al crear usuario en Auth")
        }

        const { user: newUser } = await authResponse.json()

        // 2. Crear perfil del usuario
        const profileResponse = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: newUser.id,
            first_name: formData.first_name,
            last_name: formData.last_name,
            dni: formData.dni,
            phone: formData.phone || null,
            address: formData.address || null,
            role_id: formData.role_id || null,
            is_active: formData.is_active,
          }),
        })

        if (!profileResponse.ok) {
          const data = await profileResponse.json()
          throw new Error(data.error || "Error al crear perfil de usuario")
        }
      }

      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!isEditing && (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="usuario@ejemplo.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
              disabled={isLoading}
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">Nombre *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            placeholder="Juan"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Apellido *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            placeholder="Pérez"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dni">DNI *</Label>
        <Input
          id="dni"
          value={formData.dni}
          onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
          placeholder="12345678"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+54 9 351 1234567"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Calle Falsa 123"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <Select
          value={formData.role_id}
          onValueChange={(value) => setFormData({ ...formData, role_id: value })}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Sin rol</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
                {role.description && ` - ${role.description}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          disabled={isLoading}
        />
        <Label htmlFor="is_active">Usuario Activo</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Actualizar Usuario" : "Crear Usuario"}
        </Button>
      </div>
    </form>
  )
}
