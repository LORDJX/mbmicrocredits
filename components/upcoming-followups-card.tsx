"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Phone, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { formatArgentinaDate, nowInArgentina, addDaysArgentina, isOverdueArgentina } from "@/lib/utils/date-utils"
import Link from "next/link"

interface FollowUp {
  id: string
  client_id: string
  client_code: string
  client_name: string
  client_phone: string
  client_email: string
  date: string
  reminder_date: string
  notes: string
  status: string
}

export function UpcomingFollowupsCard() {
  const [followups, setFollowups] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFollowups()
  }, [])

  const fetchFollowups = async () => {
    try {
      const response = await fetch("/api/followups")
      if (!response.ok) throw new Error("Error al cargar seguimientos")

      const data = await response.json()

      // Filtrar seguimientos dentro de la ventana de 30 días (antes y después)
      const today = nowInArgentina()
      const thirtyDaysBefore = addDaysArgentina(today, -30)
      const thirtyDaysAfter = addDaysArgentina(today, 30)

      const filtered = data.filter((followup: FollowUp) => {
        const reminderDate = new Date(followup.reminder_date)
        return reminderDate >= thirtyDaysBefore && reminderDate <= thirtyDaysAfter
      })

      // Ordenar por fecha de recordatorio (más próximos primero)
      filtered.sort((a: FollowUp, b: FollowUp) => {
        return new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime()
      })

      setFollowups(filtered)
    } catch (error) {
      console.error("[v0] Error fetching followups:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (followup: FollowUp) => {
    const isOverdue = isOverdueArgentina(followup.reminder_date)

    if (followup.status === "completado") {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completado
        </Badge>
      )
    }

    if (isOverdue) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Vencido
        </Badge>
      )
    }

    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Pendiente
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground font-work-sans">Inicio</CardTitle>
          <CardDescription>Recordatorios de seguimiento próximos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Cargando seguimientos...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-card-foreground font-work-sans">Inicio</CardTitle>
            <CardDescription>Recordatorios de seguimiento (30 días antes y después)</CardDescription>
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {followups.length} seguimiento{followups.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {followups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-card-foreground mb-2">No hay seguimientos próximos</p>
            <p className="text-sm text-muted-foreground mb-4">
              No hay recordatorios programados en los próximos 30 días
            </p>
            <Button asChild>
              <Link href="/dashboard/followups">Ver todos los seguimientos</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {followups.slice(0, 5).map((followup) => (
              <Card key={followup.id} className="border-border hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-card-foreground">{followup.client_name}</h4>
                        {getStatusBadge(followup)}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatArgentinaDate(followup.reminder_date)}</span>
                        </div>
                        {followup.client_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <span>{followup.client_phone}</span>
                          </div>
                        )}
                      </div>

                      {followup.notes && <p className="text-sm text-muted-foreground line-clamp-2">{followup.notes}</p>}
                    </div>

                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/followups`}>Ver detalles</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {followups.length > 5 && (
              <div className="pt-4 text-center">
                <Button variant="outline" asChild>
                  <Link href="/dashboard/followups">Ver todos ({followups.length} seguimientos)</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
