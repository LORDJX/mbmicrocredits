"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const createSuperAdmin = async () => {
    setLoading(true)
    setMessage("")
    setError("")

    try {
      console.log("[v0] Creando superadministrador...")

      // Crear usuario con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: "jcadmin@microcreditos.com",
        password: "30473781",
        options: {
          data: {
            username: "jcadmin",
            full_name: "Super Administrador",
          },
        },
      })

      if (authError) {
        console.log("[v0] Error creando usuario:", authError)
        setError(`Error creando usuario: ${authError.message}`)
        return
      }

      console.log("[v0] Usuario creado exitosamente:", authData.user?.id)

      // Actualizar perfil para hacerlo superadmin
      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: authData.user.id,
          email: "jcadmin@microcreditos.com",
          username: "jcadmin",
          full_name: "Super Administrador",
          is_admin: true,
          is_superadmin: true,
        })

        if (profileError) {
          console.log("[v0] Error actualizando perfil:", profileError)
          setError(`Error actualizando perfil: ${profileError.message}`)
          return
        }

        console.log("[v0] Perfil actualizado exitosamente")
        setMessage("¡Superadministrador creado exitosamente! Email: jcadmin@microcreditos.com, Contraseña: 30473781")
      }
    } catch (err: any) {
      console.log("[v0] Error inesperado:", err)
      setError(`Error inesperado: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    setLoading(true)
    setMessage("")
    setError("")

    try {
      console.log("[v0] Probando login del superadministrador...")

      const { data, error } = await supabase.auth.signInWithPassword({
        email: "jcadmin@microcreditos.com",
        password: "30473781",
      })

      if (error) {
        console.log("[v0] Error en login:", error)
        setError(`Error en login: ${error.message}`)
        return
      }

      console.log("[v0] Login exitoso:", data.user?.email)
      setMessage("¡Login exitoso! El superadministrador funciona correctamente.")

      // Cerrar sesión después de la prueba
      await supabase.auth.signOut()
    } catch (err: any) {
      console.log("[v0] Error inesperado:", err)
      setError(`Error inesperado: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Configuración de Superadministrador</CardTitle>
          <CardDescription>Crear el usuario superadministrador para el sistema de microcréditos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> jcadmin@microcreditos.com
            </p>
            <p className="text-sm text-gray-600">
              <strong>Contraseña:</strong> 30473781
            </p>
            <p className="text-sm text-gray-600">
              <strong>Username:</strong> jcadmin
            </p>
          </div>

          <div className="space-y-2">
            <Button onClick={createSuperAdmin} disabled={loading} className="w-full">
              {loading ? "Creando..." : "Crear Superadministrador"}
            </Button>

            <Button onClick={testLogin} disabled={loading} variant="outline" className="w-full bg-transparent">
              {loading ? "Probando..." : "Probar Login"}
            </Button>
          </div>

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
            <p>Esta página es temporal para configurar el superadministrador.</p>
            <p>Una vez creado exitosamente, puedes eliminar esta página.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
