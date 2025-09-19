"use client"

import { useEffect, useState } from "react"
import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, AlertCircle, CheckCircle, Clock, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CronogramItem {
  id: string
  loan_code: string
  client_name: string
  installment_number: number
  due_date: string
  amount: number
  status: string
  paid_date?: string
}

export default function CronogramasPage() {
  const [cronogramData, setCronogramData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchCronogramData()
  }, [])

  const fetchCronogramData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/cronograma")
      if (!response.ok) throw new Error("Error al cargar cronograma")
      const data = await response.json()
      setCronogramData(data)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el cronograma",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePrintCronogram = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const allItems = [
      ...(cronogramData?.today || []),
      ...(cronogramData?.overdue || []),
      ...(cronogramData?.upcoming || []),
      ...(cronogramData?.paid || []),
    ].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cronograma de Pagos - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #000; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .summary-item { text-align: center; padding: 15px; border: 1px solid #ddd; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; }
            .overdue { background-color: #ffebee; }
            .today { background-color: #fff3e0; }
            .paid { background-color: #e8f5e8; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BM MICROCRÉDITOS</h1>
            <h2>Cronograma de Pagos</h2>
            <p>Fecha de Reporte: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="summary">
            <div class="summary-item">
              <h3>Vencidos</h3>
              <p style="font-size: 24px; color: #d32f2f;">${cronogramData?.overdue?.length || 0}</p>
              <p>$${(cronogramData?.summary?.total_overdue || 0).toLocaleString()}</p>
            </div>
            <div class="summary-item">
              <h3>Hoy</h3>
              <p style="font-size: 24px; color: #f57c00;">${cronogramData?.today?.length || 0}</p>
              <p>$${(cronogramData?.summary?.total_due_today || 0).toLocaleString()}</p>
            </div>
            <div class="summary-item">
              <h3>Próximos</h3>
              <p style="font-size: 24px; color: #1976d2;">${cronogramData?.upcoming?.length || 0}</p>
              <p>$${(cronogramData?.summary?.total_upcoming || 0).toLocaleString()}</p>
            </div>
            <div class="summary-item">
              <h3>Pagados</h3>
              <p style="font-size: 24px; color: #388e3c;">${cronogramData?.paid?.length || 0}</p>
              <p>$${(cronogramData?.summary?.total_paid || 0).toLocaleString()}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Préstamo</th>
                <th>Cliente</th>
                <th>Cuota</th>
                <th>Fecha Vencimiento</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Fecha Pago</th>
              </tr>
            </thead>
            <tbody>
              ${allItems
                .map(
                  (item) => `
                <tr class="${item.status === "vencido" ? "overdue" : item.status === "hoy" ? "today" : item.status === "pagado" ? "paid" : ""}">
                  <td>${item.loan_code}</td>
                  <td>${item.client_name}</td>
                  <td>${item.installment_number}</td>
                  <td>${new Date(item.due_date).toLocaleDateString()}</td>
                  <td>$${item.amount.toLocaleString()}</td>
                  <td>${item.status}</td>
                  <td>${item.paid_date ? new Date(item.paid_date).toLocaleDateString() : "-"}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "vencido":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Vencido
          </Badge>
        )
      case "hoy":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Hoy
          </Badge>
        )
      case "pagado":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Pagado
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" />
            Próximo
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <PageLayout title="Cronogramas de Pago">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando cronograma...</p>
        </div>
      </PageLayout>
    )
  }

  const allItems = [
    ...(cronogramData?.overdue || []).map((item: any) => ({ ...item, status: "vencido" })),
    ...(cronogramData?.today || []).map((item: any) => ({ ...item, status: "hoy" })),
    ...(cronogramData?.upcoming || []).map((item: any) => ({ ...item, status: "próximo" })),
    ...(cronogramData?.paid || []).map((item: any) => ({ ...item, status: "pagado" })),
  ]

  const filteredItems = allItems.filter(
    (item: CronogramItem) =>
      item.loan_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.client_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <PageLayout title="Cronogramas de Pago" showPrintButton={true} onPrint={handlePrintCronogram}>
      <div className="space-y-6">
        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Vencidos</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{cronogramData?.overdue?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                ${(cronogramData?.summary?.total_overdue || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencen Hoy</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{cronogramData?.today?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                ${(cronogramData?.summary?.total_due_today || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximos Pagos</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{cronogramData?.upcoming?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                ${(cronogramData?.summary?.total_upcoming || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Realizados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{cronogramData?.paid?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                ${(cronogramData?.summary?.total_paid || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Cronograma */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Cronograma Completo</CardTitle>
                <CardDescription>Todos los pagos programados y realizados</CardDescription>
              </div>
              <Button onClick={handlePrintCronogram} variant="outline" className="gap-2 bg-transparent">
                <Printer className="h-4 w-4" />
                Imprimir Cronograma
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por préstamo o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredItems.length} pago{filteredItems.length !== 1 ? "s" : ""} encontrado
                {filteredItems.length !== 1 ? "s" : ""}
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Préstamo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cuota</TableHead>
                  <TableHead>Fecha Vencimiento</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item: CronogramItem) => (
                  <TableRow key={`${item.id}-${item.installment_number}`}>
                    <TableCell className="font-medium">{item.loan_code}</TableCell>
                    <TableCell>{item.client_name}</TableCell>
                    <TableCell>{item.installment_number}</TableCell>
                    <TableCell>{new Date(item.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>${item.amount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.paid_date ? new Date(item.paid_date).toLocaleDateString() : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
