// app/prestamos/page.tsx
'use client' // ✅ AGREGADO - Ahora es Client Component

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreditCard, Plus, Search, DollarSign, CheckCircle } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatsCard } from "@/components/stats-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CreateLoanForm } from "@/components/forms/create-loan-form"
import { LoanActionsMenu } from "@/components/loan-actions-menu"

// --- Interfaces de Datos ---
interface Client {
  first_name: string
  last_name: string
  client_code: string
  phone: string
  email: string
}

interface Loan {
  id: string
  loan_code: string
  amount: string
  installments: number
  loan_type: string
  interest_rate: string
  start_date: string
  end_date: string | null
  status: string
  amount_to_repay: string
  active_clients: Client
  balance: number
  has_pending_installments: boolean
}
// --------------------------

export default function PrestamosPage() {
  const router = useRouter()
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLoans()
  }, [])

  const fetchLoans = async () => {
    try {
      const response = await fetch('/api/loans')
      const data = await response.json()
      
      if (response.ok) {
        setLoans(data.loans || [])
      } else {
        console.error('Error fetching loans:', data.error)
      }
    } catch (error) {
      console.error('Error fetching loans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    fetchLoans() // Recargar la lista
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  // --- CÁLCULO DE ESTADÍSTICAS ---
  const totalAmount = loans.reduce((sum, loan) => sum + (Number.parseFloat(loan.amount || "0") || 0), 0)
  const activeLoansCount = loans.filter((loan) => loan.has_pending_installments).length
  const completedLoansCount = loans.filter((loan) => !loan.has_pending_installments).length

  // Badge dinámico basado en cuotas pendientes
  const getStatusBadge = (loan: Loan) => {
    if (loan.has_pending_installments) {
      return (
        <Badge variant="default" className="bg-green-600 text-white hover:bg-green-700">
          Activo
        </Badge>
      )
    } else {
      return (
        <Badge variant="default" className="bg-blue-600 text-white hover:bg-blue-700">
          Completado
        </Badge>
      )
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Préstamos" description="Gestiona todos los préstamos otorgados">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Préstamo
            </Button>
          </DialogTrigger>
          <DialogContent className="!max-w-none w-[95vw] max-h-[95vh] h-[95vh] p-0 gap-0">
            <div className="overflow-y-auto h-full p-6">
              <DialogHeader className="mb-4">
                <DialogTitle>Crear Nuevo Préstamo</DialogTitle>
              </DialogHeader>
              <CreateLoanForm onSuccess={handleSuccess} />
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard title="Total Préstamos" value={loans.length} description="Préstamos registrados" icon={CreditCard} />
        <StatsCard title="Préstamos Activos" value={activeLoansCount} description="En curso" icon={CreditCard} />
        <StatsCard
          title="Completados"
          value={completedLoansCount}
          description="Préstamos finalizados"
          icon={CheckCircle}
        />
        <StatsCard
          title="Capital Prestado"
          value={`$${totalAmount.toLocaleString()}`}
          description="Monto desembolsado"
          icon={DollarSign}
        />
      </div>

      {/* Search and Filters */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground font-work-sans">Buscar Préstamos</CardTitle>
          <CardDescription>Encuentra préstamos por código, cliente o monto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por código de préstamo o cliente..."
                className="pl-10 bg-input border-border"
              />
            </div>
            <Button variant="outline" className="border-border bg-transparent">
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loans Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground font-work-sans">Lista de Préstamos</CardTitle>
          <CardDescription>Todos los préstamos registrados en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-card-foreground">Código</TableHead>
                  <TableHead className="text-card-foreground">Cliente</TableHead>
                  <TableHead className="text-card-foreground">Monto</TableHead>
                  <TableHead className="text-card-foreground">Cuotas</TableHead>
                  <TableHead className="text-card-foreground">Saldo</TableHead>
                  <TableHead className="text-card-foreground">Estado</TableHead>
                  <TableHead className="text-card-foreground">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id} className="border-border">
                    <TableCell className="font-mono text-sm">{loan.loan_code || "N/A"}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-card-foreground">
                          {loan.active_clients?.first_name} {loan.active_clients?.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {loan.active_clients?.client_code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-card-foreground">
                        ${Number.parseFloat(loan.amount || "0").toLocaleString()}
                      </div>
                      {loan.amount_to_repay && (
                        <div className="text-xs text-muted-foreground">
                          Total: ${Number.parseFloat(loan.amount_to_repay || "0").toLocaleString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{loan.installments || "N/A"}</TableCell>
                    <TableCell>
                      <div className={`font-semibold ${loan.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                        ${(loan.balance || 0).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(loan)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <LoanActionsMenu loan={loan} onSuccess={handleSuccess} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {loans.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground">No hay préstamos</h3>
              <p className="text-muted-foreground">Comienza otorgando tu primer préstamo</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Préstamo
                  </Button>
                </DialogTrigger>
                <DialogContent className="!max-w-none w-[95vw] max-h-[95vh] h-[95vh] p-0 gap-0">
                  <div className="overflow-y-auto h-full p-6">
                    <DialogHeader className="mb-4">
                      <DialogTitle>Crear Nuevo Préstamo</DialogTitle>
                    </DialogHeader>
                    <CreateLoanForm onSuccess={handleSuccess} />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
