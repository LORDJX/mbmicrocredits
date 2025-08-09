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

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    })

    if (updateError) {
      setError(updateError.message)
    } else {
      setMessage("¡Contraseña actualizada exitosamente! Redirigiendo al inicio de sesión...")
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
      <Card className="w-full max-w-md bg-gray-800 text-gray-100 border border-gray-700 shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-50">Actualizar Contraseña</CardTitle>
          <CardDescription className="text-gray-400">Ingresa tu nueva contraseña.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-gray-300">
                Nueva Contraseña
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
            <div className="grid gap-2">
              <Label htmlFor="confirm-password" className="text-gray-300">
                Confirmar Nueva Contraseña
              </Label>
              <Input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? "Actualizando..." : "Actualizar Contraseña"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-400">
            <Link href="/login" className="text-gray-300 hover:text-gray-200 underline">
              Volver al inicio de sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
