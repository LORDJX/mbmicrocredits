"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"

interface TestResult {
  name: string
  status: "pending" | "success" | "error" | "warning"
  message: string
  details?: string
}

export default function SystemTestPage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: "Conexión a Base de Datos", status: "pending", message: "Esperando..." },
    { name: "API de Clientes", status: "pending", message: "Esperando..." },
    { name: "API de Préstamos", status: "pending", message: "Esperando..." },
    { name: "API de Recibos", status: "pending", message: "Esperando..." },
    { name: "API de Cronograma", status: "pending", message: "Esperando..." },
    { name: "API de Seguimientos", status: "pending", message: "Esperando..." },
    { name: "Subida de Archivos", status: "pending", message: "Esperando..." },
    { name: "Autenticación", status: "pending", message: "Esperando..." },
  ])
  const [isRunning, setIsRunning] = useState(false)

  const updateTest = (index: number, status: TestResult["status"], message: string, details?: string) => {
    setTests((prev) => prev.map((test, i) => (i === index ? { ...test, status, message, details } : test)))
  }

  const runTests = async () => {
    setIsRunning(true)
    console.log("[v0] Iniciando test general del sistema...")

    // Test 1: Conexión a Base de Datos
    try {
      updateTest(0, "pending", "Verificando conexión...")
      const response = await fetch("/api/clients?limit=1")
      if (response.ok) {
        updateTest(0, "success", "Conexión exitosa")
      } else {
        updateTest(0, "error", "Error de conexión", `Status: ${response.status}`)
      }
    } catch (error) {
      updateTest(0, "error", "Error de conexión", error instanceof Error ? error.message : "Error desconocido")
    }

    // Test 2: API de Clientes
    try {
      updateTest(1, "pending", "Probando API de clientes...")
      const response = await fetch("/api/clients")
      const data = await response.json()
      if (response.ok && Array.isArray(data)) {
        updateTest(1, "success", `API funcionando - ${data.length} clientes encontrados`)
      } else {
        updateTest(1, "error", "Error en API de clientes", JSON.stringify(data))
      }
    } catch (error) {
      updateTest(1, "error", "Error en API de clientes", error instanceof Error ? error.message : "Error desconocido")
    }

    // Test 3: API de Préstamos
    try {
      updateTest(2, "pending", "Probando API de préstamos...")
      const response = await fetch("/api/loans")
      const data = await response.json()
      if (response.ok && Array.isArray(data)) {
        updateTest(2, "success", `API funcionando - ${data.length} préstamos encontrados`)
      } else {
        updateTest(2, "error", "Error en API de préstamos", JSON.stringify(data))
      }
    } catch (error) {
      updateTest(2, "error", "Error en API de préstamos", error instanceof Error ? error.message : "Error desconocido")
    }

    // Test 4: API de Recibos
    try {
      updateTest(3, "pending", "Probando API de recibos...")
      const response = await fetch("/api/receipts")
      const data = await response.json()
      if (response.ok && Array.isArray(data)) {
        updateTest(3, "success", `API funcionando - ${data.length} recibos encontrados`)
      } else {
        updateTest(3, "error", "Error en API de recibos", JSON.stringify(data))
      }
    } catch (error) {
      updateTest(3, "error", "Error en API de recibos", error instanceof Error ? error.message : "Error desconocido")
    }

    // Test 5: API de Cronograma
    try {
      updateTest(4, "pending", "Probando API de cronograma...")
      const response = await fetch("/api/cronograma")
      const data = await response.json()
      if (response.ok && data.summary) {
        updateTest(4, "success", "API funcionando - Cronograma generado correctamente")
      } else {
        updateTest(4, "error", "Error en API de cronograma", JSON.stringify(data))
      }
    } catch (error) {
      updateTest(4, "error", "Error en API de cronograma", error instanceof Error ? error.message : "Error desconocido")
    }

    // Test 6: API de Seguimientos
    try {
      updateTest(5, "pending", "Probando API de seguimientos...")
      const response = await fetch("/api/followups")
      const data = await response.json()
      if (response.ok && Array.isArray(data)) {
        updateTest(5, "success", `API funcionando - ${data.length} seguimientos encontrados`)
      } else {
        updateTest(5, "error", "Error en API de seguimientos", JSON.stringify(data))
      }
    } catch (error) {
      updateTest(
        5,
        "error",
        "Error en API de seguimientos",
        error instanceof Error ? error.message : "Error desconocido",
      )
    }

    // Test 7: Subida de Archivos
    try {
      updateTest(6, "pending", "Probando subida de archivos...")
      // Crear un archivo de prueba pequeño
      const testFile = new File(["test"], "test.txt", { type: "text/plain" })
      const formData = new FormData()
      formData.append("file", testFile)
      formData.append("folder", "test")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        updateTest(6, "success", "Subida de archivos funcionando")
      } else {
        updateTest(6, "warning", "Subida de archivos con problemas", `Status: ${response.status}`)
      }
    } catch (error) {
      updateTest(
        6,
        "warning",
        "Subida de archivos con problemas",
        error instanceof Error ? error.message : "Error desconocido",
      )
    }

    // Test 8: Autenticación (simplificado)
    try {
      updateTest(7, "pending", "Verificando autenticación...")
      // Como el middleware está bypaseado, solo verificamos que las rutas respondan
      const response = await fetch("/dashboard/clients")
      if (response.ok) {
        updateTest(7, "warning", "Middleware bypaseado - Autenticación deshabilitada")
      } else {
        updateTest(7, "error", "Error en rutas protegidas", `Status: ${response.status}`)
      }
    } catch (error) {
      updateTest(7, "error", "Error en autenticación", error instanceof Error ? error.message : "Error desconocido")
    }

    setIsRunning(false)
    console.log("[v0] Test general del sistema completado")
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            Exitoso
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "warning":
        return (
          <Badge variant="secondary" className="bg-yellow-500 text-white">
            Advertencia
          </Badge>
        )
      default:
        return <Badge variant="outline">Pendiente</Badge>
    }
  }

  const successCount = tests.filter((t) => t.status === "success").length
  const errorCount = tests.filter((t) => t.status === "error").length
  const warningCount = tests.filter((t) => t.status === "warning").length

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test General del Sistema</h1>
        <p className="text-gray-600">Verificación completa de todas las funcionalidades antes del despliegue final</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
            <div className="text-sm text-gray-600">Exitosos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
            <div className="text-sm text-gray-600">Errores</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
            <div className="text-sm text-gray-600">Advertencias</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{tests.length}</div>
            <div className="text-sm text-gray-600">Total Tests</div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <Button onClick={runTests} disabled={isRunning} className="w-full md:w-auto">
          {isRunning ? "Ejecutando Tests..." : "Ejecutar Test General"}
        </Button>
      </div>

      <div className="space-y-4">
        {tests.map((test, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getStatusIcon(test.status)}
                  {test.name}
                </CardTitle>
                {getStatusBadge(test.status)}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-2">{test.message}</CardDescription>
              {test.details && <div className="bg-gray-100 p-2 rounded text-sm font-mono">{test.details}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Instrucciones Post-Test:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Si todos los tests son exitosos, el sistema está listo para producción</li>
          <li>• Corrige cualquier error antes del despliegue final</li>
          <li>• Las advertencias pueden ser aceptables dependiendo del contexto</li>
          <li>• Ejecuta el script de limpieza de base de datos antes de cargar datos del cliente</li>
        </ul>
      </div>
    </div>
  )
}
