"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import type { Installment } from "@/types" // Assuming Installment type is defined here

const CuotasPage = () => {
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    loan_id: "",
    paid_amount: "",
    note: "",
  })
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const openPaymentModal = (installment: Installment) => {
    if (installment.status.includes("pagada") || installment.status === "pago_anticipado") {
      toast.error("Esta cuota ya está pagada")
      return
    }

    setSelectedInstallment(installment)
    setPaymentForm({
      loan_id: installment.loan_id,
      paid_amount: (installment.balance_due || 0).toString(),
      note: `Pago cuota ${installment.installment_no} - ${installment.code}`,
    })
    setIsPaymentModalOpen(true)
  }

  // ** rest of code here **

  return <div>{/* Page content */}</div>
}

export default CuotasPage
