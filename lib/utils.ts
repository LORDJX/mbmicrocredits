import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, decimals = 2): string {
  const num = typeof amount === "string" ? Number.parseFloat(amount) : amount
  if (isNaN(num)) return "$0.00"
  return num.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
