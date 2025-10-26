"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

/**
 * Página de Registro de Usuarios
 * 
 * SEGURIDAD:
 * - Usa Supabase Auth para manejo seguro de contraseñas
 * - Validación de email en cliente y servidor
 * - Las contraseñas NUNCA se almacenan en texto plano
 * - Creación automática de perfil asociado
 * - Confirmación de email antes de activar cuenta (configurable)
 */
export default function SignUpPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  })

  // Validación de formulario
  const validateForm = (): string | null => {
    if (!formData.email) {
      return "El email es requerido"
    }
    
    if (!formData.email.includes("@")) {
      return "Email inválido"
    }

    if (!formData.password) {
      return "La contraseña es requerida"
    }

    if (formData.password.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres"
    }

    if (formData.password !== formData.confirmPassword) {
      return "Las contraseñas no coinciden"
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validar formulario
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      // PASO 1: Crear usuario en Supabase Auth
      // La contraseña es hasheada automáticamente por Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
          // Si tienes email confirmation habilitado en Supabase:
          // emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        throw new Error("No se pudo crear el usuario")
      }

      // PASO 2: Crear perfil en la tabla profiles
      // Esto puede fallar si ya existe el trigger en Supabase que lo hace automáticamente
      // En ese caso, el trigger handle_new_user ya creó el perfil
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              first_name: formData.firstName || null,
              last_name: formData.lastName || null,
              full_name: formData.firstName && formData.lastName 
                ? `${formData.firstName} ${formData.lastName}`
                : formData.firstName || formData.lastName || formData.email,
              is_admin: false, // Los nuevos usuarios NO son admin por defecto
              is_active: false, // Requieren aprobación de admin
            }
          ])
          .select()

        // Si el error es porque ya existe el registro (trigger automático), está bien
        if (profileError && !profileError.message.includes('duplicate')) {
          console.warn('Error al crear perfil (puede ser normal si existe trigger):', profileError)
        }
      } catch (profileError) {
        console.warn('Error al crear perfil:', profileError)
        // No lanzamos error aquí porque el trigger puede haberlo creado
      }

      // Éxito
      setSuccess(true)
      
      // Mensaje específico según configuración de email
      // Si tienes confirmación de email habilitada, mostrar mensaje diferente
      const needsEmailConfirmation = authData.user.identities && authData.user.identities.length === 0

      if (needsEmailConfirmation) {
        setError("Por favor revisa tu email para confirmar tu cuenta antes de iniciar sesión")
      }

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push('/login')
      }, 3000)

    } catch (err: any) {
      console.error('Error en registro:', err)
      
      // Mensajes de error amigables
      if (err.message?.includes('User already registered')) {
        setError('Este email ya está registrado. ¿Deseas iniciar sesión?')
      } else if (err.message?.includes('password')) {
        setError('La contraseña no cumple con los requisitos mínimos')
      } else if (err.message?.includes('email')) {
        setError('Email inválido o no permitido')
      } else {
        setError(err.message || 'Error al crear la cuenta. Por favor intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null) // Limpiar error al escribir
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Crear Cuenta
          </CardTitle>
          <CardDescription className="text-center">
            Ingresa tus datos para registrarte en MB Microcréditos
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Mensajes de error/éxito */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  ¡Cuenta creada exitosamente! Redirigiendo al login...
                </AlertDescription>
              </Alert>
            )}

            {/* Campos del formulario */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Juan"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  disabled={loading || success}
                  autoComplete="given-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Pérez"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  disabled={loading || success}
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={loading || success}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                disabled={loading || success}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 6 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                disabled={loading || success}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            {/* Nota de seguridad */}
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
              <p className="font-medium mb-1">📋 Nota importante:</p>
              <p className="text-xs">
                Tu cuenta será revisada por un administrador antes de ser activada.
                Recibirás un email cuando tu cuenta esté lista para usar.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Cuenta creada
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Crear Cuenta
                </>
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Iniciar sesión
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
