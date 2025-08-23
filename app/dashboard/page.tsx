"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      console.log("[v0] Verificando usuario en dashboard...")

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        console.log("[v0] Error obteniendo usuario:", error)
        router.push("/login")
      } else if (!user) {
        console.log("[v0] No hay usuario autenticado, redirigiendo al login")
        router.push("/login")
      } else {
        console.log("[v0] Usuario autenticado:", user.email)
        setUser(user)
      }
      setLoading(false)
    }

    checkUser()

    const supabase = createClient()
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("[v0] Cambio en estado de auth:", _event, session?.user?.email)
      if (!session) {
        router.push("/login")
      } else {
        setUser(session.user)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-gray-100">
        <p>Cargando dashboard...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <Card className="w-full max-w-2xl bg-gray-800 text-gray-100 border border-gray-700 shadow-lg rounded-lg">
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
        </CardContent>
      </Card>
    </div>
  )
}
