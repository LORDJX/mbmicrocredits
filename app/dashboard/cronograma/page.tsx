"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, AlertTriangle, DollarSign } from "lucide-react"
import { AppHeader } from "@/components/app-header"

interface Installment {
  id: string
  client_name: string
  loan_code: string
  installment_number: number
  total_installments: number
  amount: number
  due_date: string
  status: "pending" | "paid" | "overdue"
}

interface DailySummary {
  total_due_today: number
  total_received_today: number
  total_overdue: number
  total_received_month: number
  total_due_month: number
}

export default function CronogramaPage() {
  const [todayInstallments, setTodayInstallments] = useState<Installment[]>([])
  const [overdueInstallments, setOverdueInstallments] = useState<Installment[]>([])
  const [monthInstallments, setMonthInstallments] = useState<Installment[]>([])
  const [summary, setSummary] = useState<DailySummary>({
    total_due_today: 0,
    total_received_today: 0,
    total_overdue: 0,
    total_received_month: 0,
    total_due_month: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCronogramaData()
  }, [])

  const fetchCronogramaData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/cronograma")
      const data = await response.json()

      if (data.success) {
        setTodayInstallments(data.today || [])
        setOverdueInstallments(data.overdue || [])
        setMonthInstallments(data.month || [])
        setSummary(data.summary || {})
      }
    } catch (error) {
      console.error("Error fetching cronograma data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR")
  }

  const InstallmentCard = ({ installment }: { installment: Installment }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-semibold text-lg">{installment.client_name}</h4>
            <p className="text-sm text-muted-foreground">
              Cuota {installment.installment_number} de {installment.total_installments} - {installment.loan_code}
            </p>
            <p className="text-sm text-muted-foreground">Vencimiento: {formatDate(installment.due_date)}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">{formatCurrency(installment.amount)}</p>
            <Badge variant={installment.status === "overdue" ? "destructive" : "secondary"} className="mt-1">
              {installment.status === "overdue" ? "Vencida" : installment.status === "paid" ? "Pagada" : "Pendiente"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <AppHeader title="Cronograma de Pagos" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Cargando cronograma...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AppHeader title="Cronograma de Pagos" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sección HOY */}
        <div className="space-y-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Calendar className="h-5 w-5" />
                Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Por cobrar hoy:</span>
                  <span className="font-semibold">{formatCurrency(summary.total_due_today)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cobrado hoy:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(summary.total_received_today)}</span>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {todayInstallments.length > 0 ? (
                  todayInstallments.map((installment) => (
                    <InstallmentCard key={installment.id} installment={installment} />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No hay cuotas para hoy</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sección VENCIDOS */}
        <div className="space-y-4">
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Vencidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Total vencido:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(summary.total_overdue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cobrado este mes:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(summary.total_received_month)}</span>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {overdueInstallments.length > 0 ? (
                  overdueInstallments.map((installment) => (
                    <InstallmentCard key={installment.id} installment={installment} />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No hay cuotas vencidas</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sección MES */}
        <div className="space-y-4">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <DollarSign className="h-5 w-5" />
                Este Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Total a cobrar:</span>
                  <span className="font-semibold">{formatCurrency(summary.total_due_month)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Ya cobrado:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(summary.total_received_month)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span>Pendiente:</span>
                  <span className="font-semibold">
                    {formatCurrency(summary.total_due_month - summary.total_received_month)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {monthInstallments.length > 0 ? (
                  monthInstallments.map((installment) => (
                    <InstallmentCard key={installment.id} installment={installment} />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No hay cuotas para este mes</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
