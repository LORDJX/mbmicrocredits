"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function CreateAdminPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const supabase = createClientComponentClient()

  const createSuperAdmin = async () => {
    setLoading(true)
    setMessage("")
    setError("")

    try {
      console.log("[v0] Iniciando creación de superadministrador...")

      // Registrar usuario usando el método normal de Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: "jcadmin@microcreditos.com",
        password: "30473781",
        options: {
          data: {
            full_name: "JC Admin",
            is_admin: true,
            is_superadmin: true,
          },
        },
      })

      if (authError) {
        console.log("[v0] Error en registro:", authError)
        throw authError
      }

      console.log("[v0] Usuario registrado:", authData)

      // Si el usuario ya existe, intentar actualizar su perfil
      if (authError?.message?.includes("already registered")) {
        console.log("[v0] Usuario ya existe, actualizando perfil...")

        // Buscar el usuario por email
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", "jcadmin@microcreditos.com")

        if (profileError) {
          console.log("[v0] Error buscando perfil:", profileError)
          throw profileError
        }

        if (profiles && profiles.length > 0) {
          // Actualizar perfil existente
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              is_admin: true,
              is_superadmin: true,
              full_name: "JC Admin",
            })
            .eq("email", "jcadmin@microcreditos.com")

          if (updateError) {
            console.log("[v0] Error actualizando perfil:", updateError)
            throw updateError
          }

          setMessage(
            "Superadministrador actualizado exitosamente. Email: jcadmin@microcreditos.com, Contraseña: 30473781",
          )
        }
      } else {
        setMessage("Superadministrador creado exitosamente. Email: jcadmin@microcreditos.com, Contraseña: 30473781")
      }
    } catch (err: any) {
      console.log("[v0] Error general:", err)
      setError(err.message || "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    setLoading(true)
    setMessage("")
    setError("")

    try {
      console.log("[v0] Probando login...")

      const { data, error } = await supabase.auth.signInWithPassword({
        email: "jcadmin@microcreditos.com",
        password: "30473781",
      })

      if (error) {
        console.log("[v0] Error en login:", error)
        throw error
      }

      console.log("[v0] Login exitoso:", data)
      setMessage("Login exitoso! Redirigiendo al dashboard...")

      // Redirigir al dashboard después de 2 segundos
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 2000)
    } catch (err: any) {
      console.log("[v0] Error en login:", err)
      setError(err.message || "Error en login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Crear Superadministrador</CardTitle>
          <CardDescription>Crear usuario jcadmin con permisos completos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> jcadmin@microcreditos.com
            </p>
            <p className="text-sm text-gray-600">
              <strong>Contraseña:</strong> 30473781
            </p>
          </div>

          <Button onClick={createSuperAdmin} disabled={loading} className="w-full">
            {loading ? "Creando..." : "Crear Superadministrador"}
          </Button>

          <Button onClick={testLogin} disabled={loading} variant="outline" className="w-full bg-transparent">
            {loading ? "Probando..." : "Probar Login"}
          </Button>

          {message && (
            <Alert>
              <AlertDescription className="text-green-600">{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert>
              <AlertDescription className="text-red-600">{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-gray-500 mt-4">
            <p>Esta página es temporal para configuración inicial.</p>
            <p>Accede a: /create-admin</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
