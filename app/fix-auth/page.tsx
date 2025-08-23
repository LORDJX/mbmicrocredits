"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabaseClient"

export default function FixAuthPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [testEmail, setTestEmail] = useState("jcadmin@microcreditos.com")
  const [testPassword, setTestPassword] = useState("30473781")

  const createSuperAdmin = async () => {
    setLoading(true)
    setMessage("Creando superadministrador...")

    try {
      // 1. Crear usuario usando signUp
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: "jcadmin@microcreditos.com",
        password: "30473781",
        options: {
          data: {
            full_name: "JC Admin",
            username: "jcadmin",
          },
        },
      })

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setMessage("✅ Usuario jcadmin ya existe. Verificando perfil...")
        } else {
          throw signUpError
        }
      } else {
        setMessage("✅ Usuario jcadmin creado exitosamente. Configurando perfil...")
      }

      // 2. Obtener el usuario actual para crear/actualizar perfil
      const {
        data: { user },
        error: getUserError,
      } = await supabase.auth.getUser()

      if (getUserError) {
        // Si no hay usuario logueado, hacer login con el admin
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: "jcadmin@microcreditos.com",
          password: "30473781",
        })

        if (loginError) {
          throw new Error(`Error al hacer login: ${loginError.message}`)
        }
      }

      // 3. Crear/actualizar perfil del superadministrador
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: signUpData?.user?.id || user?.id,
        email: "jcadmin@microcreditos.com",
        full_name: "JC Admin",
        username: "jcadmin",
        is_admin: true,
        role: "superadmin",
      })

      if (profileError) {
        throw profileError
      }

      setMessage("✅ Superadministrador creado y configurado correctamente!")
    } catch (error: any) {
      console.error("Error:", error)
      setMessage(`❌ Error: ${error.message}`)
    }

    setLoading(false)
  }

  const fixExistingProfiles = async () => {
    setLoading(true)
    setMessage("Arreglando perfiles existentes...")

    try {
      // Obtener todos los usuarios de auth que no tienen perfil
      const {
        data: { users },
        error: usersError,
      } = await supabase.auth.admin.listUsers()

      if (usersError) {
        throw usersError
      }

      for (const user of users) {
        // Verificar si ya tiene perfil
        const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", user.id).single()

        if (!existingProfile) {
          // Crear perfil para usuario sin perfil
          const { error: createError } = await supabase.from("profiles").insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario",
            username: user.user_metadata?.username || user.email?.split("@")[0],
            is_admin: user.email === "jcadmin@microcreditos.com",
            role: user.email === "jcadmin@microcreditos.com" ? "superadmin" : "user",
          })

          if (createError) {
            console.error(`Error creando perfil para ${user.email}:`, createError)
          }
        }
      }

      setMessage("✅ Perfiles arreglados correctamente!")
    } catch (error: any) {
      console.error("Error:", error)
      setMessage(`❌ Error: ${error.message}`)
    }

    setLoading(false)
  }

  const testLogin = async () => {
    setLoading(true)
    setMessage("Probando login...")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })

      if (error) {
        throw error
      }

      setMessage(`✅ Login exitoso para ${testEmail}!`)

      // Verificar perfil
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single()

      if (profileError) {
        setMessage((prev) => prev + ` ⚠️ Pero no se encontró perfil: ${profileError.message}`)
      } else {
        setMessage((prev) => prev + ` ✅ Perfil encontrado: ${profile.full_name} (${profile.role})`)
      }
    } catch (error: any) {
      setMessage(`❌ Error en login: ${error.message}`)
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Arreglar Sistema de Autenticación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Button onClick={createSuperAdmin} disabled={loading} className="w-full">
              1. Crear Superadministrador (jcadmin)
            </Button>

            <Button
              onClick={fixExistingProfiles}
              disabled={loading}
              className="w-full bg-transparent"
              variant="outline"
            >
              2. Arreglar Perfiles Existentes
            </Button>

            <div className="space-y-2">
              <Label>Probar Login:</Label>
              <div className="flex gap-2">
                <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="Email" />
                <Input
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="Contraseña"
                  type="password"
                />
                <Button onClick={testLogin} disabled={loading}>
                  Probar
                </Button>
              </div>
            </div>
          </div>

          {message && (
            <div className="p-4 bg-muted rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">{message}</pre>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Instrucciones:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Haz clic en "Crear Superadministrador" para crear el usuario jcadmin</li>
              <li>Haz clic en "Arreglar Perfiles Existentes" para crear perfiles faltantes</li>
              <li>Prueba el login con jcadmin@microcreditos.com / 30473781</li>
              <li>
                Una vez que funcione, ve a <code>/login</code> para usar la app normalmente
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
