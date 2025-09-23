"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [diagnostics, setDiagnostics] = useState({
    authStatus: "checking",
    permissionsStatus: "checking",
    sessionStatus: "checking",
  })

  useEffect(() => {
    const runDiagnostics = async () => {
      console.log("[v0] Iniciando diagnóstico completo del dashboard")

      try {
        setDiagnostics((prev) => ({ ...prev, authStatus: "checking" }))
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) {
          console.log("[v0] Error de autenticación:", authError)
          setDiagnostics((prev) => ({ ...prev, authStatus: "error" }))
          return
        }

        if (!user) {
          console.log("[v0] No hay usuario autenticado")
          setDiagnostics((prev) => ({ ...prev, authStatus: "no-user" }))
          return
        }

        console.log("[v0] Usuario autenticado:", user.id)
        setUser(user)
        setDiagnostics((prev) => ({ ...prev, authStatus: "success" }))

        setDiagnostics((prev) => ({ ...prev, sessionStatus: "checking" }))
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError || !session) {
          console.log("[v0] Error de sesión:", sessionError)
          setDiagnostics((prev) => ({ ...prev, sessionStatus: "error" }))
        } else {
          console.log("[v0] Sesión válida")
          setDiagnostics((prev) => ({ ...prev, sessionStatus: "success" }))
        }

        setDiagnostics((prev) => ({ ...prev, permissionsStatus: "checking" }))
        try {
          const response = await fetch(`/api/users/permissions?userId=${user.id}`)
          if (response.ok) {
            console.log("[v0] API de permisos funcionando correctamente")
            setDiagnostics((prev) => ({ ...prev, permissionsStatus: "success" }))
          } else {
            console.log("[v0] Error en API de permisos:", response.status)
            setDiagnostics((prev) => ({ ...prev, permissionsStatus: "error" }))
          }
        } catch (permError) {
          console.log("[v0] Error al verificar permisos:", permError)
          setDiagnostics((prev) => ({ ...prev, permissionsStatus: "error" }))
        }
      } catch (error) {
        console.log("[v0] Error general en diagnóstico:", error)
        setDiagnostics((prev) => ({
          ...prev,
          authStatus: "error",
          sessionStatus: "error",
          permissionsStatus: "error",
        }))
      } finally {
        setLoading(false)
      }
    }

    runDiagnostics()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[v0] Cambio de estado de auth:", event)
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
      case "no-user":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "checking":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "success":
        return "Funcionando correctamente"
      case "error":
        return "Error detectado"
      case "no-user":
        return "Usuario no autenticado"
      case "checking":
        return "Verificando..."
      default:
        return "Estado desconocido"
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-gray-100">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p>Ejecutando diagnóstico del dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-6 h-full w-full">
      <Card className="w-full bg-gray-800 text-gray-100 border border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-50">Diagnóstico del Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Alert className="bg-gray-700 border-gray-600">
              <div className="flex items-center space-x-2">
                {getStatusIcon(diagnostics.authStatus)}
                <div>
                  <h4 className="font-semibold">Autenticación</h4>
                  <AlertDescription className="text-sm">{getStatusText(diagnostics.authStatus)}</AlertDescription>
                </div>
              </div>
            </Alert>

            <Alert className="bg-gray-700 border-gray-600">
              <div className="flex items-center space-x-2">
                {getStatusIcon(diagnostics.sessionStatus)}
                <div>
                  <h4 className="font-semibold">Sesión</h4>
                  <AlertDescription className="text-sm">{getStatusText(diagnostics.sessionStatus)}</AlertDescription>
                </div>
              </div>
            </Alert>

            <Alert className="bg-gray-700 border-gray-600">
              <div className="flex items-center space-x-2">
                {getStatusIcon(diagnostics.permissionsStatus)}
                <div>
                  <h4 className="font-semibold">API Permisos</h4>
                  <AlertDescription className="text-sm">
                    {getStatusText(diagnostics.permissionsStatus)}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full bg-gray-800 text-gray-100 border border-gray-700 shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-50">¡Bienvenido al Dashboard!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {user && (
            <p className="text-lg text-gray-300">
              Has iniciado sesión como: <span className="font-semibold">{user.email}</span>
            </p>
          )}
          <p className="text-gray-400">
            Esta es tu área de trabajo. Usa la barra lateral para navegar por las diferentes secciones.
          </p>

          {Object.values(diagnostics).every((status) => status === "success") && (
            <Alert className="bg-green-900/20 border-green-500/50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-400">
                Todos los sistemas funcionan correctamente. El dashboard se ha cargado exitosamente.
              </AlertDescription>
            </Alert>
          )}

          {Object.values(diagnostics).some((status) => status === "error" || status === "no-user") && (
            <Alert className="bg-red-900/20 border-red-500/50">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-400">
                Se detectaron problemas en el sistema. Revisa el panel de diagnóstico arriba.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
