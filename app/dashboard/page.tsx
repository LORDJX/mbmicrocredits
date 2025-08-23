"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login") // Si no hay usuario, redirigir al login
      } else {
        setUser(user)
      }
      setLoading(false)
    }

    checkUser()

    // Escuchar cambios en el estado de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
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

  // El botón de cerrar sesión se ha movido al sidebar para una mejor UX
  // const handleLogout = async () => {
  //   setLoading(true)
  //   const { error } = await supabase.auth.signOut()
  //   if (error) {
  //     console.error("Error al cerrar sesión:", error.message)
  //     setLoading(false)
  //   } else {
  //     router.push("/login")
  //   }
  // }

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
          {/* El botón de cerrar sesión ahora está en el sidebar */}
        </CardContent>
      </Card>
    </div>
  )
}
