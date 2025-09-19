"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cronogramData, setCronogramData] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = () => {
      try {
        const session = localStorage.getItem("mb_session")
        if (session) {
          const sessionData = JSON.parse(session)
          if (sessionData.user && sessionData.expires > Date.now()) {
            setUser(sessionData.user)
            loadCronogramData()
          } else {
            router.push("/login")
          }
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("Error checking user:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    const loadCronogramData = async () => {
      try {
        const response = await fetch("/api/cronograma")
        if (response.ok) {
          const data = await response.json()
          setCronogramData(data)
        }
      } catch (error) {
        console.error("Error loading cronogram data:", error)
      }
    }

    checkUser()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("mb_session")
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">MB Microcredits Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome back!</h2>
            <p className="text-gray-600 mb-4">You are logged in as {user.email}</p>
            <p className="text-gray-600">
              Your microcredit management dashboard is ready. You can start managing your loans, clients, and financial
              operations.
            </p>
          </div>

          {cronogramData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Today's Installments</h3>
                <p className="text-3xl font-bold text-blue-600">{cronogramData.today?.length || 0}</p>
                <p className="text-sm text-gray-500">Due today</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Overdue Payments</h3>
                <p className="text-3xl font-bold text-red-600">{cronogramData.overdue?.length || 0}</p>
                <p className="text-sm text-gray-500">Past due</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">This Month</h3>
                <p className="text-3xl font-bold text-green-600">{cronogramData.month?.length || 0}</p>
                <p className="text-sm text-gray-500">Total installments</p>
              </div>
            </div>
          )}

          {cronogramData?.summary && (
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Due Today</p>
                  <p className="text-xl font-bold text-blue-600">
                    ${cronogramData.summary.total_due_today?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Received Today</p>
                  <p className="text-xl font-bold text-green-600">
                    ${cronogramData.summary.total_received_today?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Overdue Amount</p>
                  <p className="text-xl font-bold text-red-600">
                    ${cronogramData.summary.total_overdue?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Month Total</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${cronogramData.summary.total_due_month?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
