"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { LogIn } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const normalizeEmailInput = (input: string): string => {
    if (input === "jcadmin") {
      return "jcadmin@microcreditos.com"
    }
    if (!input.includes("@")) {
      return `${input}@somosecoclean.com.ar`
    }
    return input
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setLoading(true)
    setError(null)

    try {
      const normalizedEmail = normalizeEmailInput(email)
      console.log("[v0] Intentando login con email:", normalizedEmail)

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
        },
      })

      if (error) {
        console.log("[v0] Error de login:", error.message)
        setError("Credenciales inválidas. Verifica tu usuario/email y contraseña.")
      } else {
        console.log("[v0] Login exitoso, redirigiendo al dashboard")
        router.push("/dashboard")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Error de conexión. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card text-card-foreground border-border shadow-2xl shadow-primary/10 transition-all hover:shadow-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Iniciar Sesión</CardTitle>
          <CardDescription className="text-muted-foreground">
            Accede a tu panel de control de microcréditos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Usuario o Correo Electrónico</Label>
              <Input
                id="email"
                type="text"
                placeholder="jcadmin o tu@ejemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50 focus:shadow-inner focus:shadow-primary/10"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-primary underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50 focus:shadow-inner focus:shadow-primary/10"
              />
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <div className="text-xs text-muted-foreground text-center">
              <p>Superadministrador: usa "jcadmin" como usuario</p>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary/80 to-primary text-primary-foreground font-semibold shadow-md transition-all hover:from-primary hover:to-primary/90 hover:shadow-lg hover:shadow-primary/20"
              disabled={loading}
            >
              {loading ? "Iniciando sesión..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
