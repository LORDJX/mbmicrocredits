import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail } from "lucide-react"

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Verifica tu email</CardTitle>
            <CardDescription className="text-gray-600">
              Te hemos enviado un enlace de confirmación a tu correo electrónico
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
            </p>
            <Button asChild className="w-full">
              <Link href="/auth/login">Volver al login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
