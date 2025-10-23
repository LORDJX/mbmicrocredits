"use client"

import { useEffect, useState } from "react"
import type { Loan, Transaction } from "@/lib/types/database"

interface DashboardStats {
  totalClients: number
  totalLoans: number
  totalPayments: number
  totalActiveLoans: number
  totalCompletedLoans: number
  totalRevenue: number
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalLoans: 0,
    totalPayments: 0,
    totalActiveLoans: 0,
    totalCompletedLoans: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true)
        setError(null)

        const clientsResponse = await fetch("/api/clients")
        const clients = clientsResponse.ok ? await clientsResponse.json() : []

        const loansResponse = await fetch("/api/loans")
        const loans = loansResponse.ok ? await loansResponse.json() : []

        const transactionsResponse = await fetch("/api/transactions")
        const transactions = transactionsResponse.ok ? await transactionsResponse.json() : []

        const totalClients = Array.isArray(clients) ? clients.length : 0
        const totalLoans = Array.isArray(loans) ? loans.length : 0
        const totalPayments = Array.isArray(transactions) ? transactions.length : 0

        const activeLoans = Array.isArray(loans) ? loans.filter((loan: Loan) => loan.status === "activo").length : 0

        const completedLoans = Array.isArray(loans)
          ? loans.filter((loan: Loan) => loan.status === "completado").length
          : 0

        const totalRevenue = Array.isArray(transactions)
          ? transactions.reduce((sum: number, transaction: Transaction) => {
              return sum + (Number.parseFloat(String(transaction.amount)) || 0)
            }, 0)
          : 0

        setStats({
          totalClients,
          totalLoans,
          totalPayments,
          totalActiveLoans: activeLoans,
          totalCompletedLoans: completedLoans,
          totalRevenue,
        })
      } catch (err) {
        console.error("Error fetching dashboard stats:", err)
        setError("Error al cargar las estadísticas del dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [])

  return {
    ...stats,
    loading,
    error,
    refresh: () => {
      setLoading(true)
      setError(null)
      window.location.reload()
    },
  }
}
