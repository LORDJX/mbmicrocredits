"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Receipt, DollarSign, Calendar, FileText, Printer, MessageCircle } from "lucide-react"

interface PaymentImputation {
  id: string
  imputed_amount: number
  installments: {
    code: string
    installment_no: number
    due_date: string
  }
}

interface Payment {
  id: string
  loan_id: string
  paid_amount: number
  paid_at: string
  note: string | null
  loans: {
    loan_code: string
    client_id: string
    clients: {
      client_code: string
      first_name: string
      last_name: string
    }
  }
  payment_imputations: PaymentImputation[]
}

export default function ReceiptsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("[v0] Fetching payments from /api/payments")
      const response = await fetch("/api/payments", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Error response text:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const contentType = response.headers.get("content-type")
      console.log("[v0] Content-Type:", contentType)

      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text()
        console.log("[v0] Non-JSON response:", responseText.substring(0, 200))
        throw new Error(`Expected JSON response but got ${contentType}. Response: ${responseText.substring(0, 100)}...`)
      }

      const data = await response.json()
      console.log("[v0] Payments data:", data)
      setPayments(data)
    } catch (err) {
      console.error("[v0] Error fetching payments:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const getTotalReceived = () => {
    return payments.reduce((total, payment) => total + payment.paid_amount, 0)
  }

  const handlePrint = (payment: Payment) => {
    const printContent = `
      RECIBO DE PAGO
      
      Recibo N°: ${payment.id.slice(-6)}
      Fecha: ${formatDate(payment.paid_at)}
      Cliente: ${payment.loans.clients.first_name} ${payment.loans.clients.last_name}
      Préstamo: ${payment.loans.loan_code}
      
      Total Pagado: ${formatCurrency(payment.paid_amount)}
      
      Imputaciones:
      ${payment.payment_imputations
        .map((imp) => `- Cuota ${imp.installments.installment_no}: ${formatCurrency(imp.imputed_amount)}`)
        .join("\n")}
      
      Observaciones: ${payment.note || "Sin observaciones"}
      
      BM Microcréditos
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Recibo de Pago</title></head>
          <body style="font-family: monospace; white-space: pre-line; padding: 20px;">
            ${printContent}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleWhatsApp = (payment: Payment) => {
    const message = `🧾 RECIBO DE PAGO

📋 Recibo N°: Rbo - ${payment.id.slice(-6)}
📅 Fecha: ${formatDate(payment.paid_at)}
👤 Cliente: ${payment.loans.clients.first_name} ${payment.loans.clients.last_name}
💰 Total Pagado: ${formatCurrency(payment.paid_amount)}
💵 Efectivo: ${formatCurrency(payment.paid_amount)}
🏦 Transferencia: $0.00
📝 Tipo: ${payment.payment_imputations.length > 1 ? "Parcial" : "Total"}
📋 Observaciones: ${payment.note || `Pago cuota ${payment.payment_imputations.map((imp) => imp.installments.installment_no).join(", ")}`}

¡Gracias por su pago! 🙏
BM Microcréditos`

    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://web.whatsapp.com/send?text=${encodedMessage}`
    window.open(whatsappUrl, "_blank")
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Cargando recibos...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error al cargar recibos</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchPayments} variant="outline">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recibos</h1>
          <p className="text-muted-foreground">Gestión de recibos y pagos recibidos</p>
        </div>
        <Button onClick={fetchPayments} variant="outline">
          Actualizar
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Resumen de Pagos Recibidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(getTotalReceived())}</div>
              <div className="text-sm text-muted-foreground">Total Recibido</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{payments.length}</div>
              <div className="text-sm text-muted-foreground">Recibos Emitidos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {payments.reduce((total, payment) => total + payment.payment_imputations.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Cuotas Imputadas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <div className="space-y-4">
        {payments.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center text-muted-foreground">
                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay recibos registrados</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          payments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Receipt className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Recibo N° {payment.id.slice(-6)}</CardTitle>
                      <CardDescription>
                        {payment.loans.clients.first_name} {payment.loans.clients.last_name} - {payment.loans.loan_code}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Pagado
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-semibold">{formatCurrency(payment.paid_amount)}</div>
                      <div className="text-sm text-muted-foreground">Monto Pagado</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-semibold">{formatDate(payment.paid_at)}</div>
                      <div className="text-sm text-muted-foreground">Fecha de Pago</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-semibold">{payment.payment_imputations.length}</div>
                      <div className="text-sm text-muted-foreground">Cuotas Imputadas</div>
                    </div>
                  </div>
                </div>

                {payment.payment_imputations.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Imputaciones:</h4>
                      <div className="space-y-2">
                        {payment.payment_imputations.map((imputation) => (
                          <div
                            key={imputation.id}
                            className="flex justify-between items-center bg-muted/50 p-2 rounded"
                          >
                            <span className="text-sm">
                              Cuota {imputation.installments.installment_no} - {imputation.installments.code}
                            </span>
                            <span className="font-semibold">{formatCurrency(imputation.imputed_amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {payment.note && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-1">Observaciones:</h4>
                      <p className="text-sm text-muted-foreground">{payment.note}</p>
                    </div>
                  </>
                )}

                <Separator />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrint(payment)}
                    className="flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWhatsApp(payment)}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
