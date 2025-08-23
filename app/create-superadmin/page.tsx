"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function CreateSuperAdminPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const supabase = createClient()
  const router = useRouter()

  const createSuperAdmin = async () => {
    setLoading(true)
    setMessage("Creando superadministrador...")

    try {
      // Crear usuario con Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: "jcadmin@microcreditos.com",
        password: "30473781",
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) {
        setMessage(`Error al crear usuario: ${error.message}`)
        setLoading(false)
        return
      }

      if (data.user) {
        // Crear perfil de superadministrador
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          email: "jcadmin@microcreditos.com",
          full_name: "Super Administrador",
          username: "jcadmin",
          is_admin: true,
          role: "superadmin",
        })

        if (profileError) {
          setMessage(`Error al crear perfil: ${profileError.message}`)
        } else {
          setMessage("¡Superadministrador creado exitosamente! Puedes hacer login con jcadmin@microcreditos.com")
        }
      }
    } catch (error) {
      setMessage(`Error: ${error}`)
    }

    setLoading(false)
  }

  const testLogin = async () => {
    setLoading(true)
    setMessage("Probando login...")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "jcadmin@microcreditos.com",
        password: "30473781",
      })

      if (error) {
        setMessage(`Error de login: ${error.message}`)
      } else {
        setMessage("¡Login exitoso! Redirigiendo al dashboard...")
        setTimeout(() => {
          router.push("/dashboard")
        }, 1000)
      }
    } catch (error) {
      setMessage(`Error: ${error}`)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 text-gray-100 border border-gray-700">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Crear Superadministrador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-400">Email: jcadmin@microcreditos.com</p>
            <p className="text-sm text-gray-400">Contraseña: 30473781</p>
          </div>

          <Button onClick={createSuperAdmin} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
            {loading ? "Creando..." : "Crear Superadministrador"}
          </Button>

          <Button
            onClick={testLogin}
            disabled={loading}
            variant="outline"
            className="w-full border-gray-600 text-gray-100 hover:bg-gray-700 bg-transparent"
          >
            {loading ? "Probando..." : "Probar Login"}
          </Button>

          {message && (
            <div className="p-3 bg-gray-700 rounded-md">
              <p className="text-sm">{message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
