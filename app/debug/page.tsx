"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { logDebug, clearNextCache, checkForServerActions } from "@/lib/debug"

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    checkForServerActions()
    logDebug("Página de debug cargada")
  }, [])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const handleClearCache = () => {
    clearNextCache()
    addLog("Caché de Next.js limpiado")
  }

  const handleCheckServerActions = () => {
    checkForServerActions()
    addLog("Verificación de Server Actions completada")
  }

  const handleTestFetch = async () => {
    try {
      const response = await fetch("/api/clients")
      if (response.ok) {
        addLog("Test de API exitoso")
      } else {
        addLog(`Test de API falló: ${response.status}`)
      }
    } catch (error) {
      addLog(`Error en test de API: ${error}`)
    }
  }

  return (
    <div className="p-4">
      <Card className="bg-gray-800 text-gray-100 border border-gray-700">
        <CardHeader>
          <CardTitle>Página de Diagnóstico</CardTitle>
          <CardDescription className="text-gray-400">
            Herramientas para diagnosticar problemas de Server Actions y otros errores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleClearCache} variant="outline">
              Limpiar Caché
            </Button>
            <Button onClick={handleCheckServerActions} variant="outline">
              Verificar Server Actions
            </Button>
            <Button onClick={handleTestFetch} variant="outline">
              Test API
            </Button>
            <Button onClick={() => setLogs([])} variant="destructive">
              Limpiar Logs
            </Button>
          </div>

          <div className="bg-gray-900 p-4 rounded-lg max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">Logs de Diagnóstico:</h3>
            {logs.length === 0 ? (
              <p className="text-gray-400">No hay logs disponibles</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono text-green-400">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
