"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Clock, CheckCircle, AlertTriangle, DollarSign } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatsCard } from "@/components/stats-card"
import { CronogramaModal } from "@/components/cronograma-modal"
import { createClient } from "@/lib/supabase/client"

interface Installment {
  id: string
  loan_code: string
  client_name: string
  client_code: string
  installment_no: number
  installments_total: number
  due_date: string
  amount_due: number
  amount_paid: number
  balance_due: number
  original_status: string
  phone?: string
}

interface CronogramaData {
  today: Installment[]
  overdue: Installment[]
  pending: Installment[]
  summary: {
    total_vence_hoy: number
    total_vencidas: number
    total_due_month: number
    total_received_month: number
  }
  success: boolean
}

async function getCronogramaData(): Promise<CronogramaData> {
  try {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""

    if (!baseUrl) {
      console.error("No se pudo determinar la URL base")
      return { today: [], overdue: [], pending: [], summary: {} as any, success: false }
    }

    const response = await fetch(`${baseUrl}/api/cronograma`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })

    if (!response.ok) {
      console.error("Error fetching cronograma data from API:", response.status)
      return { today: [], overdue: [], pending: [], summary: {} as any, success: false }
    }

    return response.json()
  } catch (error) {
    console.error("Error in getCronogramaData:", error)
    return { today: [], overdue: [], pending: [], summary: {} as any, success: false }
  }
}

const getStatusBadge = (status: string, balanceDue: number) => {
  switch (status) {
    case "PAGADA_A_TERMINO":
      return <Badge className="bg-green-600 hover:bg-green-700 text-white">Pagada a Término</Badge>

    case "PAGADA_VENCIDA":
      return <Badge className="bg-green-500 hover:bg-green-600 text-white">Pagada (Vencida)</Badge>

    case "VENCIDA":
      return (
        <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">
          Vencida - ${balanceDue.toLocaleString()}
        </Badge>
      )

    case "PAGO_PARCIAL_VENCIDA":
      return (
        <Badge variant="destructive" className="bg-red-500 hover:bg-red-600">
          Parcial Vencida - ${balanceDue.toLocaleString()}
        </Badge>
      )

    case "VENCE_HOY":
      return <Badge className="bg-orange-500 hover:bg-orange-600 text-white animate-pulse">Vence Hoy</Badge>

    case "PAGO_PARCIAL_A_TERMINO":
      return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Pago Parcial</Badge>

    case "A_PAGAR":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          A Pagar
        </Badge>
      )

    default:
      return <Badge variant="outline">Estado: {status}</Badge>
  }
}

export default function CronogramasPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [cronogramaData, setCronogramaData] = useState<CronogramaData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoadingModal, setIsLoadingModal] = useState(false)
  const [installmentsWithPhone, setInstallmentsWithPhone] = useState<{
    today: any[]
    overdue: any[]
    upcoming: any[]
  }>({
    today: [],
    overdue: [],
    upcoming: [],
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Verificar autenticación
      const supabase = await createClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push("/auth/login")
        return
      }

      // Cargar datos del cronograma
      const data = await getCronogramaData()
      setCronogramaData(data)

      // Enriquecer con números de teléfono
      if (data.success) {
        const enrichWithPhone = async (installments: any[]) => {
          const clientIds = [...new Set(installments.map((inst) => inst.client_code))]
          const { data: clients } = await supabase
            .from("clients")
            .select("client_code, phone")
            .in("client_code", clientIds)

          const phoneMap = new Map(clients?.map((c) => [c.client_code, c.phone]) || [])

          return installments.map((inst) => ({
            ...inst,
            phone: phoneMap.get(inst.client_code) || "",
          }))
        }

        const [todayWithPhone, overdueWithPhone, upcomingWithPhone] = await Promise.all([
          enrichWithPhone(data.today),
          enrichWithPhone(data.overdue),
          enrichWithPhone(data.pending),
        ])

        setInstallmentsWithPhone({
          today: todayWithPhone,
          overdue: overdueWithPhone,
          upcoming: upcomingWithPhone,
        })
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerarCronograma = async () => {
    setIsLoadingModal(true)
    try {
      // Recargar datos frescos del cronograma
      await loadData()

      // Abrir el modal solo después de cargar los datos
      setIsModalOpen(true)
    } catch (error) {
      console.error("Error al generar cronograma:", error)
      alert("Error al cargar los datos del cronograma. Por favor, intenta nuevamente.")
    } finally {
      setIsLoadingModal(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Cronogramas de Pago" description="Cargando..." />
        <div className="text-center py-12">Cargando datos...</div>
      </div>
    )
  }

  if (!cronogramaData || !cronogramaData.success) {
    return (
      <div className="space-y-6">
        <PageHeader title="Cronogramas de Pago" description="Error al cargar los datos" />
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Error al cargar cronogramas</h3>
              <p className="text-muted-foreground">Por favor, intenta recargar la página</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const schedules = [...cronogramaData.today, ...cronogramaData.overdue, ...cronogramaData.pending]
  const totalOverdueAmount = cronogramaData.summary.total_vencidas || 0
  const totalDueTodayAmount = cronogramaData.summary.total_vence_hoy || 0

  return (
    <div className="space-y-6">
      <PageHeader title="Cronogramas de Pago" description="Gestiona los cronogramas y vencimientos de pagos">
        <Button
          onClick={handleGenerarCronograma}
          disabled={isLoadingModal}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Calendar className="h-4 w-4 mr-2" />
          {isLoadingModal ? "Cargando..." : "Generar Cronograma"}
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Monto Vence Hoy"
          value={`$${totalDueTodayAmount.toLocaleString("es-ES")}`}
          description={`${cronogramaData.today.length} cuota(s)`}
          icon={Clock}
        />
        <StatsCard
          title="Monto Vencido"
          value={`$${totalOverdueAmount.toLocaleString("es-ES")}`}
          description={`${cronogramaData.overdue.length} cuota(s) en mora`}
          icon={AlertTriangle}
        />
        <StatsCard
          title="Total Recibido (Mes)"
          value={`$${(cronogramaData.summary.total_received_month || 0).toLocaleString("es-ES")}`}
          description="Cobranza efectiva este mes"
          icon={DollarSign}
        />
        <StatsCard
          title="Total Cuotas Pagadas"
          value={(
            cronogramaData.today.filter((inst) => inst.amount_paid > 0).length +
            cronogramaData.overdue.filter((inst) => inst.amount_paid > 0).length
          ).toString()}
          description="Histórico"
          icon={CheckCircle}
        />
      </div>

      {/* Payment Schedules Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground font-work-sans">Cuotas Pendientes ({schedules.length})</CardTitle>
          <CardDescription>Consolidado de cuotas a vencer, hoy y vencidas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-card-foreground">Cuota #</TableHead>
                  <TableHead className="text-card-foreground">Cliente</TableHead>
                  <TableHead className="text-card-foreground">Préstamo</TableHead>
                  <TableHead className="text-card-foreground">Fecha Venc.</TableHead>
                  <TableHead className="text-card-foreground">Saldo Pendiente</TableHead>
                  <TableHead className="text-card-foreground">Estado</TableHead>
                  <TableHead className="text-card-foreground">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id} className="border-border">
                    <TableCell className="font-mono text-sm">
                      {schedule.installment_no} de {schedule.installments_total}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-card-foreground">{schedule.client_name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{schedule.client_code}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{schedule.loan_code || "N/A"}</TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(schedule.due_date).toLocaleDateString("es-ES")}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-card-foreground">
                        $
                        {schedule.balance_due.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      {schedule.amount_paid > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Pagado: ${schedule.amount_paid.toLocaleString("es-ES")}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(schedule.original_status, schedule.balance_due)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="border-border bg-transparent">
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {schedules.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground">¡Todo al día!</h3>
              <p className="text-muted-foreground">No hay cuotas pendientes ni vencidas.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <CronogramaModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        todayInstallments={installmentsWithPhone.today}
        overdueInstallments={installmentsWithPhone.overdue}
        upcomingInstallments={installmentsWithPhone.upcoming}
      />
    </div>
  )
}
