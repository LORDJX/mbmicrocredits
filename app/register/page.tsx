"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabaseClient } from "@/lib/supabase/client-singleton"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`, // URL de callback para confirmación
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage("¡Registro exitoso! Por favor, revisa tu correo electrónico para confirmar tu cuenta.")
      // Opcional: redirigir después de un tiempo
      // setTimeout(() => router.push('/login'), 3000);
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
      <Card className="w-full max-w-md bg-gray-800 text-gray-100 border border-gray-700 shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-50">Registrarse</CardTitle>
          <CardDescription className="text-gray-400">Crea una nueva cuenta para empezar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-gray-300">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@ejemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400 focus:ring-gray-500 focus:border-gray-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-gray-300">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400 focus:ring-gray-500 focus:border-gray-500"
              />
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            {message && <p className="text-green-400 text-sm text-center">{message}</p>}
            <Button
              type="submit"
              className="w-full bg-gray-600 hover:bg-gray-700 text-gray-50 font-semibold py-2 px-4 rounded-md transition-colors duration-200"
              disabled={loading}
            >
              {loading ? "Registrando..." : "Registrarse"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-400">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-gray-300 hover:text-gray-200 underline">
              Iniciar Sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
