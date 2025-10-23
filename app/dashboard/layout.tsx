import type React from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // El layout global ya maneja la sidebar, solo devolvemos el contenido
  return <>{children}</>
}
