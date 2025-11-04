/**
 * Utilidades para manejo de fechas en zona horaria UTC-3 (Argentina, Buenos Aires)
 *
 * Estas funciones aseguran que todas las fechas se manejen correctamente en la zona horaria
 * de Argentina, evitando problemas de conversión que pueden causar cambios de día.
 */

import { format as dateFnsFormat, parseISO, addDays, startOfDay } from "date-fns"
import { es } from "date-fns/locale"
import { toZonedTime, fromZonedTime } from "date-fns-tz"

// Zona horaria de Argentina
const TIMEZONE = "America/Argentina/Buenos_Aires"

/**
 * Convierte una fecha a la zona horaria de Argentina
 */
export function toArgentinaTime(date: Date | string): Date {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return toZonedTime(dateObj, TIMEZONE)
}

/**
 * Convierte una fecha de Argentina a UTC para almacenar en la base de datos
 */
export function fromArgentinaTime(date: Date): Date {
  return fromZonedTime(date, TIMEZONE)
}

/**
 * Obtiene la fecha actual en Argentina
 */
export function nowInArgentina(): Date {
  return toZonedTime(new Date(), TIMEZONE)
}

/**
 * Formatea una fecha en la zona horaria de Argentina
 * @param date - Fecha a formatear (puede ser Date, string ISO, o null/undefined)
 * @param formatStr - Formato deseado (por defecto "dd/MM/yyyy")
 * @returns Fecha formateada o string vacío si la fecha es inválida
 */
export function formatArgentinaDate(date: Date | string | null | undefined, formatStr = "dd/MM/yyyy"): string {
  if (!date) return ""

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    const argDate = toZonedTime(dateObj, TIMEZONE)
    return dateFnsFormat(argDate, formatStr, { locale: es })
  } catch (error) {
    console.error("[v0] Error formatting date:", error)
    return ""
  }
}

/**
 * Convierte una fecha a formato ISO (YYYY-MM-DD) en zona horaria de Argentina
 * Útil para inputs de tipo date y para enviar a la API
 */
export function toArgentinaDateString(date: Date | string): string {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    const argDate = toZonedTime(dateObj, TIMEZONE)
    return dateFnsFormat(argDate, "yyyy-MM-dd")
  } catch (error) {
    console.error("[v0] Error converting to date string:", error)
    return dateFnsFormat(new Date(), "yyyy-MM-dd")
  }
}

/**
 * Crea un objeto Date desde un string YYYY-MM-DD en zona horaria de Argentina
 * Evita el problema de que Date.parse() interprete la fecha en UTC
 */
export function parseArgentinaDateString(dateString: string): Date {
  try {
    // Parsear como fecha local de Argentina
    const [year, month, day] = dateString.split("-").map(Number)
    const localDate = new Date(year, month - 1, day, 12, 0, 0) // Usar mediodía para evitar problemas de DST
    return toZonedTime(localDate, TIMEZONE)
  } catch (error) {
    console.error("[v0] Error parsing date string:", error)
    return nowInArgentina()
  }
}

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD en zona horaria de Argentina
 */
export function getTodayArgentina(): string {
  return toArgentinaDateString(nowInArgentina())
}

/**
 * Compara dos fechas en zona horaria de Argentina
 * @returns número negativo si date1 < date2, 0 si son iguales, positivo si date1 > date2
 */
export function compareArgentinaDates(date1: Date | string, date2: Date | string): number {
  const arg1 = toArgentinaTime(date1)
  const arg2 = toArgentinaTime(date2)
  return arg1.getTime() - arg2.getTime()
}

/**
 * Verifica si una fecha es hoy en zona horaria de Argentina
 */
export function isTodayArgentina(date: Date | string): boolean {
  const argDate = toArgentinaTime(date)
  const today = nowInArgentina()

  return (
    argDate.getDate() === today.getDate() &&
    argDate.getMonth() === today.getMonth() &&
    argDate.getFullYear() === today.getFullYear()
  )
}

/**
 * Verifica si una fecha está vencida (es anterior a hoy) en zona horaria de Argentina
 */
export function isOverdueArgentina(date: Date | string): boolean {
  const argDate = startOfDay(toArgentinaTime(date))
  const today = startOfDay(nowInArgentina())
  return argDate < today
}

/**
 * Agrega días a una fecha en zona horaria de Argentina
 */
export function addDaysArgentina(date: Date | string, days: number): Date {
  const argDate = toArgentinaTime(date)
  return addDays(argDate, days)
}

/**
 * Formatea una fecha y hora completa en zona horaria de Argentina
 */
export function formatArgentinaDateTime(date: Date | string | null | undefined): string {
  if (!date) return ""

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    const argDate = toZonedTime(dateObj, TIMEZONE)
    return dateFnsFormat(argDate, "dd/MM/yyyy HH:mm", { locale: es })
  } catch (error) {
    console.error("[v0] Error formatting datetime:", error)
    return ""
  }
}

/**
 * Obtiene el timestamp actual en zona horaria de Argentina para updated_at
 */
export function getArgentinaTimestamp(): string {
  return nowInArgentina().toISOString()
}

/**
 * Alias for formatArgentinaDate for backward compatibility
 * Formats a date in short format (DD/MM/YYYY)
 */
export const formatDate = (date: string | Date | null | undefined, format: "short" | "long" = "short"): string => {
  if (!date) return ""

  if (format === "long") {
    return formatArgentinaDate(date, "dd 'de' MMMM 'de' yyyy")
  }

  return formatArgentinaDate(date, "dd/MM/yyyy")
}

/**
 * Alias for formatArgentinaDateTime for backward compatibility
 * Formats a date with time (DD/MM/YYYY HH:MM)
 */
export const formatDateTime = formatArgentinaDateTime

/**
 * Alias for toArgentinaDateString for backward compatibility
 * Formats a date for input fields (YYYY-MM-DD)
 */
export const formatDateForInput = toArgentinaDateString

/**
 * Gets relative time (e.g., "hace 2 días")
 */
export const getRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  const argDate = toArgentinaTime(dateObj)
  const now = nowInArgentina()
  const diffMs = now.getTime() - argDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Hoy"
  if (diffDays === 1) return "Ayer"
  if (diffDays < 7) return `Hace ${diffDays} días`
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`
  return `Hace ${Math.floor(diffDays / 365)} años`
}
