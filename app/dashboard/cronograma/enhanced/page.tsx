"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, AlertTriangle, DollarSign, CheckCircle, Clock, TrendingUp, Search } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { toast } from "sonner"

interface EnhancedInstallment {
  id: string
  loan_code: string
  client_name: string
  installment_no: number
  installments_total: number
  amount_due: number
  amount_paid: number
  due_date: string
  payment_date?: string
  enhanced_status: string
  status_display: string
  days_to_due: number
  days_overdue: number
}

interface StatusGroups {
  a_vencer: EnhancedInstallment[]
  a_pagar_hoy: EnhancedInstallment[]
  con_mora: EnhancedInstallment[]
  pagada_anticipada: EnhancedInstallment[]
  pagada: EnhancedInstallment[]
  pagada_con_mora: EnhancedInstallment[]
}

interface Summary {
  total_a_vencer: number
  total_a_pagar_hoy: number
  total_con_mora: number
  total_pagado_anticipado: number
  total_pagado: number
  total_pagado_con_mora: number
  count_a_vencer: number
  count_a_pagar_hoy: number
  count_con_mora: number
  count_pagada_anticipada: number
  count_pagada: number
  count_pagada_con_mora: number
}

export default function EnhancedCronogramaPage() {
  const [statusGroups, setStatusGroups] = useState<StatusGroups>({
    a_vencer: [],
    a_pagar_hoy: [],
    con_mora: [],
    pagada_anticipada: [],
    pagada: [],
    pagada_con_mora: [],
  })
  const [summary, setSummary] = useState<Summary>({
    total_a_vencer: 0,
    total_a_pagar_hoy: 0,
    total_con_mora: 0,
    total_pagado_anticipado: 0,
    total_pagado: 0,
    total_pagado_con_mora: 0,
    count_a_vencer: 0,
    count_a_pagar_hoy: 0,
    count_con_mora: 0,
    count_pagada_anticipada: 0,
    count_pagada: 0,
    count_pagada_con_mora: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchFilter, setSearchFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")

  useEffect(() => {
    fetchEnhancedCronograma()
  }, [statusFilter, dateFilter])

  const fetchEnhancedCronograma = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (dateFilter) params.append("date", dateFilter)

      const response = await fetch(`/api/cronograma/enhanced?${params}`)
      const data = await response.json()

      if (data.success) {
        setStatusGroups(data.statusGroups || {})
        setSummary(data.summary || {})
        console.log("[v0] Enhanced cronograma data loaded:", data)
      } else {
        toast.error("Error al cargar cronograma mejorado")
      }
    } catch (error) {
      console.error("Error fetching enhanced cronograma:", error)
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const markAsPaid = async (installmentId: string) => {
    try {
      const response = await fetch("/api/cronograma/enhanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installment_id: installmentId,
          payment_date: new Date().toISOString().split("T")[0],
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Cuota marcada como pagada")
        fetchEnhancedCronograma() // Recargar datos
      } else {
        toast.error("Error al marcar cuota como pagada")
      }
    } catch (error) {
      console.error("Error marking as paid:", error)
      toast.error("Error de conexión")
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

  const filterInstallments = (installments: EnhancedInstallment[]) => {
    if (!searchFilter.trim()) return installments

    const term = searchFilter.toLowerCase()
    return installments.filter(
      (inst) => inst.client_name.toLowerCase().includes(term) || inst.loan_code.toLowerCase().includes(term),
    )
  }

  const InstallmentSection = ({
    title,
    installments,
    icon: Icon,
    variant,
    showPayButton = false,
  }: {
    title: string
    installments: EnhancedInstallment[]
    icon: any
    variant: string
    showPayButton?: boolean
  }) => {
    const filteredInstallments = filterInstallments(installments)

    return (
      <Card className={`border-${variant}-200 bg-${variant}-50`}>
        <CardHeader className="pb-3">
          <CardTitle className={`flex items-center gap-2 text-${variant}-700`}>
            <Icon className="h-5 w-5" />
            {title}
            <Badge variant="secondary" className="ml-2">
              {filteredInstallments.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredInstallments.length > 0 ? (
              filteredInstallments.map((installment) => (
                <Card key={installment.id} className="mb-2">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold">{installment.client_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {installment.loan_code} - Cuota {installment.installment_no}/{installment.installments_total}
                        </p>
                        <p className="text-sm text-muted-foreground">Vencimiento: {formatDate(installment.due_date)}</p>
                        {installment.payment_date && (
                          <p className="text-sm text-green-600">Pagado: {formatDate(installment.payment_date)}</p>
                        )}
                        {installment.days_overdue > 0 && (
                          <p className="text-sm text-red-600">Mora: {installment.days_overdue} días</p>
                        )}
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-lg font-bold">
                          {formatCurrency(
                            installment.amount_paid > 0 ? installment.amount_paid : installment.amount_due,
                          )}
                        </p>
                        <Badge variant="outline" className="block">
                          {installment.status_display}
                        </Badge>
                        {showPayButton && installment.amount_paid === 0 && (
                          <Button size="sm" onClick={() => markAsPaid(installment.id)} className="w-full">
                            Marcar Pagada
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                {searchFilter ? "No se encontraron resultados" : `No hay cuotas ${title.toLowerCase()}`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <AppHeader title="Cronograma Mejorado" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Cargando cronograma mejorado...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AppHeader title="Cronograma Mejorado - Estados de Cuotas" />

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por cliente o préstamo..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="a_vencer">A Vencer</SelectItem>
                <SelectItem value="a_pagar_hoy">A Pagar Hoy</SelectItem>
                <SelectItem value="con_mora">Con Mora</SelectItem>
                <SelectItem value="pagada_anticipada">Pagadas Anticipadas</SelectItem>
                <SelectItem value="pagada">Pagadas</SelectItem>
                <SelectItem value="pagada_con_mora">Pagadas con Mora</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Filtrar por fecha"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-red-700">Con Mora</p>
            <p className="text-2xl font-bold text-red-800">{summary.count_con_mora}</p>
            <p className="text-sm text-red-600">{formatCurrency(summary.total_con_mora)}</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-orange-700">A Pagar Hoy</p>
            <p className="text-2xl font-bold text-orange-800">{summary.count_a_pagar_hoy}</p>
            <p className="text-sm text-orange-600">{formatCurrency(summary.total_a_pagar_hoy)}</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-700">A Vencer</p>
            <p className="text-2xl font-bold text-blue-800">{summary.count_a_vencer}</p>
            <p className="text-sm text-blue-600">{formatCurrency(summary.total_a_vencer)}</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-700">Pagadas</p>
            <p className="text-2xl font-bold text-green-800">{summary.count_pagada}</p>
            <p className="text-sm text-green-600">{formatCurrency(summary.total_pagado)}</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-purple-700">Pagadas Anticipadas</p>
            <p className="text-2xl font-bold text-purple-800">{summary.count_pagada_anticipada}</p>
            <p className="text-sm text-purple-600">{formatCurrency(summary.total_pagado_anticipado)}</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-yellow-700">Pagadas con Mora</p>
            <p className="text-2xl font-bold text-yellow-800">{summary.count_pagada_con_mora}</p>
            <p className="text-sm text-yellow-600">{formatCurrency(summary.total_pagado_con_mora)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <InstallmentSection
          title="Con Mora"
          installments={statusGroups.con_mora}
          icon={AlertTriangle}
          variant="red"
          showPayButton={true}
        />

        <InstallmentSection
          title="A Pagar Hoy"
          installments={statusGroups.a_pagar_hoy}
          icon={Clock}
          variant="orange"
          showPayButton={true}
        />

        <InstallmentSection title="A Vencer" installments={statusGroups.a_vencer} icon={Calendar} variant="blue" />

        <InstallmentSection title="Pagadas" installments={statusGroups.pagada} icon={CheckCircle} variant="green" />

        <InstallmentSection
          title="Pagadas Anticipadas"
          installments={statusGroups.pagada_anticipada}
          icon={TrendingUp}
          variant="purple"
        />

        <InstallmentSection
          title="Pagadas con Mora"
          installments={statusGroups.pagada_con_mora}
          icon={DollarSign}
          variant="yellow"
        />
      </div>
    </div>
  )
}
