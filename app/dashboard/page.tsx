import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CronogramData {
  today?: any[]
  overdue?: any[]
  month?: any[]
  summary?: {
    total_due_today?: number
    total_received_today?: number
    total_overdue?: number
    total_due_month?: number
  }
}

async function getCronogramData(): Promise<CronogramData | null> {
  try {
    // In a real implementation, this would fetch from your database
    // For now, return mock data to demonstrate the structure
    return {
      today: [],
      overdue: [],
      month: [],
      summary: {
        total_due_today: 0,
        total_received_today: 0,
        total_overdue: 0,
        total_due_month: 0,
      },
    }
  } catch (error) {
    console.error("Error loading cronogram data:", error)
    return null
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const cronogramData = await getCronogramData()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-foreground">MB Microcredits Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {data.user.email}! Here's your microcredit management overview.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Today's Installments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{cronogramData?.today?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Due today</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Overdue Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{cronogramData?.overdue?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Past due</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">{cronogramData?.month?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Total installments</p>
          </CardContent>
        </Card>
      </div>

      {cronogramData?.summary && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-card-foreground">Financial Summary</CardTitle>
            <CardDescription className="text-muted-foreground">
              Overview of your financial metrics for today and this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Due Today</p>
                <p className="text-xl font-bold text-primary">
                  ${cronogramData.summary.total_due_today?.toLocaleString() || 0}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Received Today</p>
                <p className="text-xl font-bold text-chart-3">
                  ${cronogramData.summary.total_received_today?.toLocaleString() || 0}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Overdue Amount</p>
                <p className="text-xl font-bold text-accent">
                  ${cronogramData.summary.total_overdue?.toLocaleString() || 0}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Month Total</p>
                <p className="text-xl font-bold text-foreground">
                  ${cronogramData.summary.total_due_month?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-card-foreground">Quick Actions</CardTitle>
            <CardDescription className="text-muted-foreground">Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2">
              <a href="/dashboard/clients" className="text-sm text-primary hover:text-primary/80 transition-colors">
                → Manage Clients
              </a>
              <a href="/dashboard/loans" className="text-sm text-primary hover:text-primary/80 transition-colors">
                → View Loans
              </a>
              <a href="/dashboard/receipts" className="text-sm text-primary hover:text-primary/80 transition-colors">
                → Process Payments
              </a>
              <a href="/dashboard/cronograma" className="text-sm text-primary hover:text-primary/80 transition-colors">
                → Payment Schedule
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-card-foreground">System Status</CardTitle>
            <CardDescription className="text-muted-foreground">Current system information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Database</span>
              <span className="text-sm font-medium text-chart-3">Connected</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Authentication</span>
              <span className="text-sm font-medium text-chart-3">Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <span className="text-sm font-medium text-foreground">{new Date().toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
