"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Search, Calendar, AlertCircle, CheckCircle, Clock, Printer, Filter, Download, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CronogramItem {
  id: string
  loan_code: string
  client_name: string
  installment_number: number
  due_date: string
  amount: number
  status: string
  paid_at?: string
  payment_date?: string
}

export default function DashboardCronogramaPage() {
  const [cronogramData, setCronogramData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchCronogramData()
  }, [])

  const fetchCronogramData = async () => {
    setLoading(true)
    try {
      console.log("[v0] Fetching cronograma data...")
      const response = await fetch("/api/cronograma")
      if (!response.ok) throw new Error("Error al cargar cronograma")
      const data = await response.json()
      console.log("[v0] Cronograma API response:", data)
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
                <tr class="${item.status === "overdue" ? "overdue" : item.status === "due_today" ? "today" : item.status === "paid" ? "paid" : ""}">
                  <td>${item.loan_code}</td>
                  <td>${item.client_name}</td>
                  <td>${item.installment_number}</td>
                  <td>${new Date(item.due_date).toLocaleDateString()}</td>
                  <td>$${item.amount.toLocaleString()}</td>
                  <td>${item.status}</td>
                  <td>${item.paid_at ? new Date(item.paid_at).toLocaleDateString() : "-"}</td>
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
      case "overdue":
        return (
          <Badge className="badge-modern badge-error">
            <AlertCircle className="h-3 w-3" />
            Vencido
          </Badge>
        )
      case "due_today":
        return (
          <Badge className="badge-modern badge-warning">
            <Clock className="h-3 w-3" />
            Hoy
          </Badge>
        )
      case "paid":
        return (
          <Badge className="badge-modern badge-success">
            <CheckCircle className="h-3 w-3" />
            Pagado
          </Badge>
        )
      default:
        return (
          <Badge className="badge-modern badge-info">
            <Calendar className="h-3 w-3" />
            Próximo
          </Badge>
        )
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setDateFromFilter("")
    setDateToFilter("")
  }

  const applyFilters = () => {
    fetchCronogramData()
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Cronograma de Pagos</h1>
          <p className="text-muted-foreground">Gestión y seguimiento de pagos programados</p>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando cronograma...</p>
        </div>
      </div>
    )
  }

  const allItems = [
    ...(cronogramData?.overdue || []).map((item: any) => ({ ...item, status: "overdue" })),
    ...(cronogramData?.today || []).map((item: any) => ({ ...item, status: "due_today" })),
    ...(cronogramData?.upcoming || []).map((item: any) => ({ ...item, status: "pending" })),
    ...(cronogramData?.paid || []).map((item: any) => ({ ...item, status: "paid" })),
  ]

  const filteredItems = allItems.filter(
    (item: CronogramItem) =>
      item.loan_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.client_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Cronograma de Pagos</h1>
        <p className="text-muted-foreground">Gestión y seguimiento de pagos programados</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-modern hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pagos Vencidos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{cronogramData?.overdue?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${(cronogramData?.summary?.total_overdue || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vencen Hoy</CardTitle>
            <Clock className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{cronogramData?.today?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${(cronogramData?.summary?.total_due_today || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Próximos Pagos</CardTitle>
            <Calendar className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{cronogramData?.upcoming?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${(cronogramData?.summary?.total_upcoming || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pagos Realizados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{cronogramData?.paid?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${(cronogramData?.summary?.total_paid || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="filter-container">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Filter className="h-5 w-5 text-primary" />
            Filtros de Búsqueda
          </CardTitle>
          <CardDescription>Filtra y busca pagos específicos en el cronograma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="filter-grid">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-medium">
                Buscar
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Cliente, préstamo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-input/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                Estado
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-input/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="overdue">Vencidos</SelectItem>
                  <SelectItem value="due_today">Vencen hoy</SelectItem>
                  <SelectItem value="pending">Próximos</SelectItem>
                  <SelectItem value="paid">Pagados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-from" className="text-sm font-medium">
                Desde
              </Label>
              <Input
                id="date-from"
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                className="bg-input/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-to" className="text-sm font-medium">
                Hasta
              </Label>
              <Input
                id="date-to"
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                className="bg-input/50"
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={applyFilters} className="flex-1 hover-glow">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              <Button variant="outline" onClick={clearFilters} className="hover-glow bg-transparent">
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-modern">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-foreground">Cronograma Completo</CardTitle>
              <CardDescription>
                {filteredItems.length} pago{filteredItems.length !== 1 ? "s" : ""} encontrado
                {filteredItems.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePrintCronogram} variant="outline" className="gap-2 hover-glow bg-transparent">
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <Button variant="outline" className="gap-2 hover-glow bg-transparent">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="text-muted-foreground">Préstamo</TableHead>
                  <TableHead className="text-muted-foreground">Cliente</TableHead>
                  <TableHead className="text-muted-foreground">Cuota</TableHead>
                  <TableHead className="text-muted-foreground">Fecha Vencimiento</TableHead>
                  <TableHead className="text-muted-foreground">Monto</TableHead>
                  <TableHead className="text-muted-foreground">Estado</TableHead>
                  <TableHead className="text-muted-foreground">Fecha Pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item: CronogramItem) => (
                  <TableRow
                    key={`${item.id}-${item.installment_number}`}
                    className="border-border/50 hover:bg-muted/30"
                  >
                    <TableCell className="font-mono text-sm font-medium">{item.loan_code}</TableCell>
                    <TableCell className="font-medium">{item.client_name}</TableCell>
                    <TableCell>{item.installment_number}</TableCell>
                    <TableCell>{new Date(item.due_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">${item.amount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.paid_at ? new Date(item.paid_at).toLocaleDateString() : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg font-medium">
                  {cronogramData?.debug?.total_installments === 0
                    ? "No se encontraron cuotas en la base de datos"
                    : "No se encontraron resultados para la búsqueda"}
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  {cronogramData?.debug?.total_installments === 0
                    ? "Asegúrate de que existan préstamos con cuotas generadas"
                    : "Intenta ajustar los filtros de búsqueda"}
                </p>
                {cronogramData?.debug && (
                  <div className="mt-6 text-xs text-muted-foreground space-y-1">
                    <p>Total de cuotas en BD: {cronogramData.debug.total_installments}</p>
                    <p>Fecha actual (Argentina): {cronogramData.debug.argentina_time}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
