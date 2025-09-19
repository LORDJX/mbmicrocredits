"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { Mail, CreditCard } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setLoading(true)
    setError(null)
    setMessage(null)

    const redirectUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/update-password`

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      if (error) throw error

      setMessage("¡Enlace de recuperación enviado! Revisa tu correo electrónico para restablecer tu contraseña.")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al enviar el enlace")
    } finally {
      setLoading(false)
    }
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
          <p className="text-slate-300">Recuperar contraseña</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-white">Recuperar Contraseña</CardTitle>
            <CardDescription className="text-center text-slate-300">
              Ingresa tu correo electrónico para recibir un enlace de recuperación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">
                  Correo Electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                  />
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
                {loading ? "Enviando..." : "Enviar Enlace de Recuperación"}
              </Button>
            </form>

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
