"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { User, Edit, Save, X, Eye, EyeOff } from "lucide-react"

interface UserProfile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  website: string | null
  is_admin: boolean
  updated_at: string | null
  email: string | null
}

const profileSchema = z.object({
  username: z.string().email("Debe ser un email válido").optional().or(z.literal("")),
  full_name: z.string().trim().min(1, "El nombre es requerido").max(120, "Máximo 120 caracteres"),
  avatar_url: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
  website: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
})

type ProfileInput = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/profile")
      if (!response.ok) {
        throw new Error("Error al cargar el perfil")
      }
      const data = await response.json()
      setProfile(data)
      reset({
        username: data.username || "",
        full_name: data.full_name || "",
        avatar_url: data.avatar_url || "",
        website: data.website || "",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar el perfil",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (values: ProfileInput) => {
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error al actualizar el perfil")
      }

      const updatedProfile = await response.json()
      setProfile(updatedProfile)
      setIsEditing(false)
      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado correctamente",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    reset({
      username: profile?.username || "",
      full_name: profile?.full_name || "",
      avatar_url: profile?.avatar_url || "",
      website: profile?.website || "",
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-gray-100">
        <p>Cargando perfil...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-red-400">
        <p>No se pudo cargar el perfil del usuario</p>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Card className="bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-blue-400" />
              <div>
                <CardTitle className="text-2xl font-bold text-gray-50">Mi Perfil</CardTitle>
                <CardDescription className="text-gray-400">
                  Gestiona tu información personal y configuración de cuenta
                </CardDescription>
              </div>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Edit className="h-4 w-4 mr-2" />
                Editar Perfil
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || "N/A"}
                  disabled
                  className="bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">El email no se puede modificar</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-300">
                  Usuario (Email visible)
                </Label>
                {isEditing ? (
                  <>
                    <Input
                      id="username"
                      placeholder="usuario@correo.com"
                      className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                      {...register("username")}
                    />
                    {errors.username && <p className="text-red-400 text-sm">{errors.username.message}</p>}
                  </>
                ) : (
                  <Input
                    value={profile.username || "N/A"}
                    disabled
                    className="bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-gray-300">
                  Nombre Completo
                </Label>
                {isEditing ? (
                  <>
                    <Input
                      id="full_name"
                      placeholder="Nombre y apellido"
                      className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                      {...register("full_name")}
                    />
                    {errors.full_name && <p className="text-red-400 text-sm">{errors.full_name.message}</p>}
                  </>
                ) : (
                  <Input
                    value={profile.full_name || "N/A"}
                    disabled
                    className="bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={showPassword ? "password123" : "••••••••••"}
                    disabled
                    className="bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Contacta al administrador para cambiar la contraseña</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar_url" className="text-gray-300">
                  URL del Avatar
                </Label>
                {isEditing ? (
                  <>
                    <Input
                      id="avatar_url"
                      placeholder="https://ejemplo.com/avatar.jpg"
                      className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                      {...register("avatar_url")}
                    />
                    {errors.avatar_url && <p className="text-red-400 text-sm">{errors.avatar_url.message}</p>}
                  </>
                ) : (
                  <Input
                    value={profile.avatar_url || "N/A"}
                    disabled
                    className="bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-gray-300">
                  Sitio Web
                </Label>
                {isEditing ? (
                  <>
                    <Input
                      id="website"
                      placeholder="https://misitio.com"
                      className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                      {...register("website")}
                    />
                    {errors.website && <p className="text-red-400 text-sm">{errors.website.message}</p>}
                  </>
                ) : (
                  <Input
                    value={profile.website || "N/A"}
                    disabled
                    className="bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed"
                  />
                )}
              </div>
            </div>

            {/* Información del sistema */}
            <div className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-200 mb-4">Información del Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-300">Rol</Label>
                  <div className="flex items-center">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        profile.is_admin ? "bg-purple-600 text-purple-50" : "bg-blue-600 text-blue-50"
                      }`}
                    >
                      {profile.is_admin ? "Administrador" : "Usuario"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">ID de Usuario</Label>
                  <Input
                    value={profile.id}
                    disabled
                    className="bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Última Actualización</Label>
                  <Input
                    value={
                      profile.updated_at ? new Date(profile.updated_at).toLocaleString("es-ES") : "Nunca actualizado"
                    }
                    disabled
                    className="bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
