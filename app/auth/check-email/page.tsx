import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail, Building2 } from "lucide-react"

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Building2 className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground font-work-sans">MB Microcréditos</h1>
          </div>

          <Card className="border-border bg-card">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Mail className="h-16 w-16 text-primary" />
              </div>
              <CardTitle className="text-2xl font-work-sans">Verifica tu correo</CardTitle>
              <CardDescription>Te hemos enviado un enlace de verificación a tu correo electrónico</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
              </p>
              <div className="pt-4">
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/auth/login">Volver al inicio de sesión</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
