export const formatDate = (date: string | Date, format: "short" | "long" = "short"): string => {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return "Fecha inválida"
    }

    if (format === "long") {
      return dateObj.toLocaleDateString("es-AR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }

    return dateObj.toLocaleDateString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Fecha inválida"
  }
}

export const formatDateTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return "Fecha inválida"
    }

    return dateObj.toLocaleString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (error) {
    console.error("Error formatting datetime:", error)
    return "Fecha inválida"
  }
}

export const formatRelativeDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Hoy"
    if (diffDays === 1) return "Ayer"
    if (diffDays < 7) return `Hace ${diffDays} días`
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`
    return `Hace ${Math.floor(diffDays / 365)} años`
  } catch (error) {
    console.error("Error formatting relative date:", error)
    return "Fecha inválida"
  }
}

// Funciones adicionales para compatibilidad con Argentina timezone
export const nowInArgentina = (): Date => {
  const now = new Date()
  const argTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }))
  return argTime
}

export const formatArgentinaDateTime = (date?: Date | string): string => {
  const dateObj = date ? (typeof date === "string" ? new Date(date) : date) : nowInArgentina()
  return dateObj.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export const formatArgentinaDate = (date?: Date | string): string => {
  const dateObj = date ? (typeof date === "string" ? new Date(date) : date) : nowInArgentina()
  return dateObj.toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

export const parseArgentinaDateString = (dateStr: string): Date | null => {
  if (!dateStr) return null

  // Handle DD/MM/YYYY format
  if (dateStr.includes("/")) {
    const [day, month, year] = dateStr.split("/")
    if (day && month && year) {
      return new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
    }
  }

  // Handle YYYY-MM-DD format
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? null : date
}

export const getTodayArgentina = (): string => {
  const today = nowInArgentina()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export const toArgentinaDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export const addDaysArgentina = (date: Date | string, days: number): Date => {
  const dateObj = typeof date === "string" ? new Date(date) : new Date(date)
  dateObj.setDate(dateObj.getDate() + days)
  return dateObj
}

export const isOverdueArgentina = (date: Date | string): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const today = nowInArgentina()
  today.setHours(0, 0, 0, 0)
  dateObj.setHours(0, 0, 0, 0)
  return dateObj < today
}

export const toArgentinaTime = (date: Date | string): Date => {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const argTime = new Date(dateObj.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }))
  return argTime
}
