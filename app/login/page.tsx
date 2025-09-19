"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabaseClient"
import { Eye, EyeOff, LogIn } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw signInError
      }

      if (data.user) {
        // Crear sesión local para compatibilidad con el sistema existente
        const session = {
          user: {
            email: data.user.email,
            id: data.user.id,
            name: data.user.user_metadata?.full_name || data.user.email,
          },
          expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        }
        localStorage.setItem("mb_session", JSON.stringify(session))

        // Redirigir al dashboard
        router.push("/dashboard")
      }
    } catch (error: any) {
      console.error("Error de login:", error)
      setError(error.message || "Error al iniciar sesión. Verifica tus credenciales.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <Card className="w-full max-w-md bg-gray-800 text-gray-100 border border-gray-700 shadow-2xl shadow-blue-500/10 transition-all hover:shadow-blue-500/20">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-50">Iniciar Sesión</CardTitle>
          <CardDescription className="text-gray-400">
            Ingresa tus credenciales para acceder a MB Microcréditos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-gray-300 font-medium">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@ejemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password" className="text-gray-300 font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-md">{error}</div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="text-center text-sm text-gray-400">
              <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300 underline transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <div className="text-center text-sm text-gray-400">
              ¿No tienes una cuenta?{" "}
              <Link href="/register" className="text-blue-400 hover:text-blue-300 underline transition-colors">
                Registrarse
              </Link>
            </div>
          </div>

          {process.env.NODE_ENV === "development" && (
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-md text-sm text-blue-300">
              <strong>Modo Desarrollo:</strong>
              <br />
              Usa las credenciales de tu cuenta Supabase registrada.
              <br />
              Si no tienes cuenta, ve a{" "}
              <Link href="/register" className="underline">
                Registrarse
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
