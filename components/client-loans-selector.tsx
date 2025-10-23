"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle2, Clock, DollarSign } from "lucide-react"

interface Loan {
  id: string
  loan_code: string
  amount: number
  start_date: string
  status: string
  total_due: number
  total_paid: number
  balance: number
  has_pending: boolean
  installments_count: number
  paid_count: number
  overdue_count: number
}

interface ClientLoansSelectorProps {
  clientId: string
  onLoanSelect?: (loanId: string) => void
}

export function ClientLoansSelector({ clientId, onLoanSelect }: ClientLoansSelectorProps) {
  const [activeLoans, setActiveLoans] = useState<Loan[]>([])
  const [completedLoans, setCompletedLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null)

  useEffect(() => {
    if (clientId) {
      fetchClientLoans()
    }
  }, [clientId])

  const fetchClientLoans = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/clients/${clientId}/loans`)

      if (!response.ok) {
        throw new Error("Error al cargar préstamos")
      }

      const data = await response.json()
      setActiveLoans(data.active_loans || [])
      setCompletedLoans(data.completed_loans || [])
    } catch (error) {
      console.error("[v0] Error fetching client loans:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoanSelect = (loanId: string) => {
    setSelectedLoanId(loanId)
    if (onLoanSelect) {
      onLoanSelect(loanId)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  const LoanCard = ({ loan }: { loan: Loan }) => (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        selectedLoanId === loan.id ? "ring-2 ring-primary" : ""
      }`}
      onClick={() => handleLoanSelect(loan.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{loan.loan_code}</CardTitle>
          {loan.overdue_count > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {loan.overdue_count} vencidas
            </Badge>
          )}
        </div>
        <CardDescription>Inicio: {new Date(loan.start_date).toLocaleDateString("es-AR")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Monto original:</span>
          <span className="font-medium">{formatCurrency(loan.amount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total a pagar:</span>
          <span className="font-medium">{formatCurrency(loan.total_due)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Pagado:</span>
          <span className="font-medium text-green-600">{formatCurrency(loan.total_paid)}</span>
        </div>
        {loan.status === "activo" && (
          <div className="flex justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">Saldo pendiente:</span>
            <span className="font-bold text-orange-600">{formatCurrency(loan.balance)}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {loan.paid_count}/{loan.installments_count} cuotas
            </span>
          </div>
          {loan.status === "completado" && (
            <Badge variant="outline" className="gap-1 text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              Completado
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Cargando préstamos...</p>
        </div>
      </div>
    )
  }

  if (activeLoans.length === 0 && completedLoans.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay préstamos registrados para este cliente</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="active" className="gap-2">
          Activos
          {activeLoans.length > 0 && <Badge variant="secondary">{activeLoans.length}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="completed" className="gap-2">
          Completados
          {completedLoans.length > 0 && <Badge variant="secondary">{completedLoans.length}</Badge>}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="space-y-4 mt-4">
        {activeLoans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-muted-foreground">No hay préstamos activos</p>
            </CardContent>
          </Card>
        ) : (
          activeLoans.map((loan) => <LoanCard key={loan.id} loan={loan} />)
        )}
      </TabsContent>

      <TabsContent value="completed" className="space-y-4 mt-4">
        {completedLoans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay préstamos completados</p>
            </CardContent>
          </Card>
        ) : (
          completedLoans.map((loan) => <LoanCard key={loan.id} loan={loan} />)
        )}
      </TabsContent>
    </Tabs>
  )
}
