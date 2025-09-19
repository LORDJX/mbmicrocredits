"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Calculator, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface CreditScore {
  id: string
  client_id: string
  score: number
  factors: {
    payment_history: number
    debt_to_income: number
    credit_utilization: number
    length_of_history: number
    new_credit: number
  }
  calculated_at: string
  clients: {
    first_name: string
    last_name: string
    dni: string
  }
}

interface Client {
  id: string
  first_name: string
  last_name: string
  dni: string
  loans: Loan[]
  receipts: Receipt[]
}

interface Loan {
  id: string
  amount: number
  status: string
  created_at: string
}

interface Receipt {
  id: string
  total_amount: number
  receipt_date: string
}

export default function CreditScoringPage() {
  const [creditScores, setCreditScores] = useState<CreditScore[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    fetchCreditScores()
    fetchClients()
  }, [])

  const fetchCreditScores = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('credit_scores')
        .select(`
          *,
          clients (
            first_name,
            last_name,
            dni
          )
        `)
        .order('calculated_at', { ascending: false })

      if (error) throw error
      setCreditScores(data || [])
    } catch (error) {
      console.error('Error fetching credit scores:', error)
      toast.error('Error al cargar los puntajes crediticios')
    }
  }

  const fetchClients = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          dni,
          loans (
            id,
            amount,
            status,
            created_at
          ),
          receipts (
            id,
            total_amount,
            receipt_date
          )
        `)

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Error al cargar los clientes')
    } finally {
      setLoading(false)
    }
  }

  const calculateCreditScore = (client: Client): { score: number; factors: any } => {
    // Payment History (35% weight)
    const paymentHistory = calculatePaymentHistory(client)
    
    // Debt-to-Income Ratio (30% weight) - simplified calculation
    const debtToIncome = calculateDebtToIncome(client)
    
    // Credit Utilization (15% weight)
    const creditUtilization = calculateCreditUtilization(client)
    
    // Length of Credit History (10% weight)
    const lengthOfHistory = calculateLengthOfHistory(client)
    
    // New Credit (10% weight)
    const newCredit = calculateNewCredit(client)

    const factors = {
      payment_history: paymentHistory,
      debt_to_income: debtToIncome,
      credit_utilization: creditUtilization,
      length_of_history: lengthOfHistory,
      new_credit: newCredit
    }

    // Calculate weighted score
    const score = Math.round(
      (paymentHistory * 0.35) +
      (debtToIncome * 0.30) +
      (creditUtilization * 0.15) +
      (lengthOfHistory * 0.10) +
      (newCredit * 0.10)
    )

    return { score: Math.max(300, Math.min(850, score)), factors }
  }

  const calculatePaymentHistory = (client: Client): number => {
    const totalLoans = client.loans.length
    const activeLoans = client.loans.filter(loan => loan.status === 'activo').length
    const completedLoans = totalLoans - activeLoans

    if (totalLoans === 0) return 650 // Neutral score for no history

    // Simple calculation: more completed loans = better score
    const completionRate = completedLoans / totalLoans
    return Math.round(500 + (completionRate * 300))
  }

  const calculateDebtToIncome = (client: Client): number => {
    const activeLoans = client.loans.filter(loan => loan.status === 'activo')
    const totalDebt = activeLoans.reduce((sum, loan) => sum + loan.amount, 0)
    
    // Simplified: assume lower debt = better score
    if (totalDebt === 0) return 750
    if (totalDebt < 100000) return 700
    if (totalDebt < 500000) return 600
    return 500
  }

  const calculateCreditUtilization = (client: Client): number => {
    // Simplified calculation based on active loans
    const activeLoans = client.loans.filter(loan => loan.status === 'activo').length
    
    if (activeLoans === 0) return 750
    if (activeLoans === 1) return 700
    if (activeLoans === 2) return 600
    return 500
  }

  const calculateLengthOfHistory = (client: Client): number => {
    if (client.loans.length === 0) return 600

    const oldestLoan = client.loans.reduce((oldest, loan) => {
      return new Date(loan.created_at) < new Date(oldest.created_at) ? loan : oldest
    })

    const monthsOfHistory = Math.floor(
      (Date.now() - new Date(oldestLoan.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
    )

    // Longer history = better score
    return Math.min(800, 500 + (monthsOfHistory * 10))
  }

  const calculateNewCredit = (client: Client): number => {
    const recentLoans = client.loans.filter(loan => {
      const loanDate = new Date(loan.created_at)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      return loanDate > sixMonthsAgo
    })

    // Fewer recent loans = better score
    if (recentLoans.length === 0) return 750
    if (recentLoans.length === 1) return 650
    return 550
  }

  const handleCalculateAllScores = async () => {
    try {
      setCalculating(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Debe iniciar sesión')
        return
      }

      const scoresToInsert = clients.map(client => {
        const { score, factors } = calculateCreditScore(client)
        return {
          client_id: client.id,
          score,
          factors,
          calculated_by: user.id
        }
      })

      // Delete existing scores for these clients
      const clientIds = clients.map(c => c.id)
      await supabase
        .from('credit_scores')
        .delete()
        .in('client_id', clientIds)

      // Insert new scores
      const { error } = await supabase
        .from('credit_scores')
        .insert(scoresToInsert)

      if (error) throw error

      toast.success('Puntajes crediticios calculados exitosamente')
      fetchCreditScores()
    } catch (error) {
      console.error('Error calculating credit scores:', error)
      toast.error('Error al calcular los puntajes crediticios')
    } finally {
      setCalculating(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 750) return 'text-green-600'
    if (score >= 650) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 750) return CheckCircle
    if (score >= 650) return Info
    return AlertTriangle
  }

  const getScoreLabel = (score: number) => {
    if (score >= 750) return 'Excelente'
    if (score >= 700) return 'Muy Bueno'
    if (score >= 650) return 'Bueno'
    if (score >= 600) return 'Regular'
    return 'Malo'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <AppHeader title="Análisis Crediticio" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Cargando análisis...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <AppHeader 
          title="Análisis Crediticio" 
          description="Sistema de evaluación y puntaje crediticio de clientes"
        />
        <Button 
          onClick={handleCalculateAllScores}
          disabled={calculating}
        >
          <Calculator className="h-4 w-4 mr-2" />
          {calculating ? 'Calculando...' : 'Recalcular Puntajes'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Evaluados</p>
                <p className="text-2xl font-bold">{creditScores.length}</p>
              </div>
              <Calculator className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Puntaje Promedio</p>
                <p className="text-2xl font-bold">
                  {creditScores.length > 0 
                    ? Math.round(creditScores.reduce((sum, cs) => sum + cs.score, 0) / creditScores.length)
                    : 0
                  }
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Excelentes (750+)</p>
                <p className="text-2xl font-bold text-green-600">
                  {creditScores.filter(cs => cs.score >= 750).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground\">Riesgo Alto (<600)</p>\
                <p className="text-2xl font-bold text-red-600">
                  {creditScores.filter(cs => cs.score < 600).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Scores List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {creditScores.map((creditScore) => {
          const ScoreIcon = getScoreIcon(creditScore.score)
          return (
            <Card key={creditScore.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {creditScore.clients.first_name} {creditScore.clients.last_name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      DNI: {creditScore.clients.dni}
                    </p>
                  </div>
                  <Badge variant="outline" className={getScoreColor(creditScore.score)}>
                    {getScoreLabel(creditScore.score)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ScoreIcon className={`h-5 w-5 ${getScoreColor(creditScore.score)}`} />
                    <span className="text-sm font-medium">Puntaje Crediticio</span>
                  </div>
                  <span className={`text-2xl font-bold ${getScoreColor(creditScore.score)}`}>
                    {creditScore.score}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Historial de Pagos</span>
                    <span>{creditScore.factors.payment_history}</span>
                  </div>
                  <Progress value={(creditScore.factors.payment_history / 850) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Ratio Deuda/Ingresos</span>
                    <span>{creditScore.factors.debt_to_income}</span>
                  </div>
                  <Progress value={(creditScore.factors.debt_to_income / 850) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Utilización de Crédito</span>
                    <span>{creditScore.factors.credit_utilization}</span>
                  </div>
                  <Progress value={(creditScore.factors.credit_utilization / 850) * 100} className="h-2" />
                </div>

                <div className="pt-2 text-xs text-muted-foreground">
                  Calculado: {new Date(creditScore.calculated_at).toLocaleDateString('es-AR')}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {creditScores.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay puntajes calculados</h3>
            <p className="text-muted-foreground mb-4">
              Haga clic en "Recalcular Puntajes" para generar el análisis crediticio de todos los clientes.
            </p>
            <Button onClick={handleCalculateAllScores} disabled={calculating}>
              <Calculator className="h-4 w-4 mr-2" />
              {calculating ? 'Calculando...' : 'Calcular Puntajes'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )\
}
