"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Eye, EyeOff, CreditCard } from "lucide-react"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isValidSession, setIsValidSession] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        setIsValidSession(true)
      } else {
        setError("Sesión inválida. Por favor, solicita un nuevo enlace de recuperación.")
      }
    }
    checkSession()
  }, [])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.")
      setLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) throw updateError

      setMessage("¡Contraseña actualizada exitosamente! Redirigiendo al inicio de sesión...")
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al actualizar la contraseña")
    } finally {
      setLoading(false)
    }
  }

  if (!isValidSession && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardContent className="p-6 text-center">
            <p className="text-slate-300">Verificando sesión...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">BM Microcréditos</h1>
          <p className="text-slate-300">Actualizar contraseña</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-white">Actualizar Contraseña</CardTitle>
            <CardDescription className="text-center text-slate-300">Ingresa tu nueva contraseña</CardDescription>
          </CardHeader>
          <CardContent>
            {isValidSession ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-200">
                    Nueva Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-200">
                    Confirmar Nueva Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {message && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3">
                    <p className="text-sm text-green-400">{message}</p>
                  </div>
                )}

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                  {loading ? "Actualizando..." : "Actualizar Contraseña"}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-sm text-red-400">{error}</p>
                <Link href="/forgot-password">
                  <Button
                    variant="outline"
                    className="w-full bg-transparent border-slate-600 text-slate-200 hover:bg-slate-700/50"
                  >
                    Solicitar nuevo enlace
                  </Button>
                </Link>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-primary hover:text-primary/80">
                Volver al inicio de sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
