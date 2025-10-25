"use client"

import { useEffect, useState } from "react"
import { formatArgentinaDateTime, nowInArgentina } from "@/lib/utils/date-utils"
import { Calendar, Clock } from "lucide-react"
import { Card } from "@/components/ui/card"

export function CurrentDateTimeHeader() {
  const [currentDateTime, setCurrentDateTime] = useState<Date>(nowInArgentina())

  useEffect(() => {
    // Actualizar cada segundo
    const interval = setInterval(() => {
      setCurrentDateTime(nowInArgentina())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formattedDate = formatArgentinaDateTime(currentDateTime)
  const [datePart, timePart] = formattedDate.split(" ")

  return (
    <Card className="border-border bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Fecha Actual</p>
              <p className="text-2xl font-bold text-card-foreground">{datePart}</p>
            </div>
          </div>

          <div className="h-12 w-px bg-border" />

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Hora Actual</p>
              <p className="text-2xl font-bold text-card-foreground tabular-nums">{timePart}</p>
            </div>
          </div>
        </div>

        <div className="hidden md:block text-right">
          <p className="text-sm text-muted-foreground">Zona Horaria</p>
          <p className="text-lg font-semibold text-card-foreground">UTC-3 (Argentina)</p>
        </div>
      </div>
    </Card>
  )
}
