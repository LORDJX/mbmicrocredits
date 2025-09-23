"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Plus, Eye, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { NewLoanForm } from "@/app/dashboard/loans/new-loan-form"

interface Loan {
  id: string
  loan_code: string
  client_id: string
  amount: number
  installments: number
  installment_amount: number
  delivery_mode: string
  amount_to_repay: number
  loan_type: string
  interest_rate: number
  start_date: string
  end_date: string | null
  status: string
  created_at: string
  clients: {
    client_code: string
    first_name: string
    last_name: string
  }
}

export default function PrestamosPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showNewLoanDialog, setShowNewLoanDialog] = useState(false)
  const { toast } = useToast()

  const fetchLoans = async () => {
    try {
      setLoading(true)
      const url = new URL("/api/loans", window.location.origin)
      if (searchTerm.trim()) {
        url.searchParams.set("search", searchTerm.trim())
      }

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error("Error al cargar préstamos")
      }

      const data = await response.json()
      setLoans(data)
    } catch (error: any) {
      console.error("Error cargando préstamos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los préstamos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLoans()
  }, [searchTerm])

  const handleNewLoanSuccess = () => {
    setShowNewLoanDialog(false)
    fetchLoans()
    toast({
      title: "Éxito",
      description: "Préstamo creado correctamente",
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      activo: { label: "Activo", variant: "default" as const },
      "En Mora": { label: "En Mora", variant: "destructive" as const },
      Completado: { label: "Completado", variant: "secondary" as const },
      Cancelado: { label: "Cancelado", variant: "outline" as const },
    }

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "outline" as const }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CO")
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Gestión de Préstamos</h1>
            <p className="text-gray-400 mt-2">Administra todos los préstamos del sistema</p>
          </div>

          <Dialog open={showNewLoanDialog} onOpenChange={setShowNewLoanDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Préstamo
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 text-gray-100 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Crear Nuevo Préstamo</DialogTitle>
              </DialogHeader>
              <NewLoanForm onSuccess={handleNewLoanSuccess} onCancel={() => setShowNewLoanDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Barra de búsqueda */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por código de préstamo, cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Lista de préstamos */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Cargando préstamos...</p>
          </div>
        ) : loans.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No se encontraron préstamos</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {loans.map((loan) => (
              <Card key={loan.id} className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white text-lg">Préstamo #{loan.loan_code}</CardTitle>
                      <p className="text-gray-400 text-sm mt-1">
                        {loan.clients.first_name} {loan.clients.last_name} ({loan.clients.client_code})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">{getStatusBadge(loan.status)}</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Monto</p>
                      <p className="text-white font-semibold">{formatCurrency(loan.amount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Cuotas</p>
                      <p className="text-white">{loan.installments}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Valor Cuota</p>
                      <p className="text-white">{formatCurrency(loan.installment_amount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Tipo</p>
                      <p className="text-white">{loan.loan_type}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Fecha Inicio</p>
                      <p className="text-white">{formatDate(loan.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Total a Pagar</p>
                      <p className="text-white font-semibold">{formatCurrency(loan.amount_to_repay)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Interés</p>
                      <p className="text-white">{loan.interest_rate?.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Entrega</p>
                      <p className="text-white">{loan.delivery_mode}</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-700">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-600 text-red-400 hover:bg-red-900/20 bg-transparent"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
