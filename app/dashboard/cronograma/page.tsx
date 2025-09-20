"use client"

import { Button } from "@/components/ui/button"

import { CardContent } from "@/components/ui/card"

import { Card } from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"

interface Installment {
  id: string
  client_id: string
  client_name: string
  loan_code: string
  installment_number: number
  total_installments: number
  amount: number
  due_date: string
  status: "pending" | "paid" | "overdue" | "due_today"
  calculated_status?: string // Agregar estado calculado
}

import { Icons } from "path-to-icons" // Import Icons component

const paidInstallments = new Set() // Declare paidInstallments variable
const formatDate = (date: string) => new Date(date).toLocaleDateString() // Declare formatDate function
const formatCurrency = (amount: number) => amount.toLocaleString("es-CL", { style: "currency", currency: "CLP" }) // Declare formatCurrency function
const openReceiptModal = (installment: Installment) => {
  /* Implementation here */
} // Declare openReceiptModal function

const InstallmentCard = ({ installment }: { installment: Installment }) => {
  const installmentKey = `${installment.loan_code}-${installment.installment_number}`
  const hasReceipt = paidInstallments.has(installmentKey)
  const isPaid = installment.status === "paid" || hasReceipt

  if (hasReceipt || isPaid) {
    return null
  }

  const getStatusBadge = () => {
    switch (installment.calculated_status) {
      case "a_vencer":
        return <Badge variant="secondary">A Vencer</Badge>
      case "a_pagar_hoy":
        return (
          <Badge variant="default" className="bg-blue-500">
            A Pagar Hoy
          </Badge>
        )
      case "con_mora":
        return <Badge variant="destructive">Con Mora</Badge>
      case "pagadas_anticipadas":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Pagada Anticipada
          </Badge>
        )
      case "pagadas":
        return (
          <Badge variant="secondary" className="bg-green-500 text-white">
            Pagada
          </Badge>
        )
      case "pagadas_con_mora":
        return (
          <Badge variant="secondary" className="bg-orange-500 text-white">
            Pagada con Mora
          </Badge>
        )
      default:
        return (
          <Badge variant={installment.status === "overdue" ? "destructive" : "secondary"}>
            {installment.status === "overdue" ? "Vencida" : "Pendiente"}
          </Badge>
        )
    }
  }

  const { Plus } = Icons // Import Plus component

  return (
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
          <div className="text-right space-y-2">
            <p className="text-xl font-bold">{formatCurrency(installment.amount)}</p>
            {getStatusBadge()}
            <Button size="sm" className="w-full mt-2" onClick={() => openReceiptModal(installment)}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo Recibo
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function CronogramaPage() {}
