"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Header } from "@/components/layout/header"

interface ConditionalSidebarProps {
  children: React.ReactNode
}

export function ConditionalSidebar({ children }: ConditionalSidebarProps) {
  const pathname = usePathname()

  const routesWithoutSidebar = ["/auth", "/"]

  // Verificar si la ruta actual debe mostrar sidebar
  const shouldShowSidebar = !routesWithoutSidebar.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  )

  // Si no debe mostrar sidebar, renderizar solo el contenido
  if (!shouldShowSidebar) {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar />
        <SidebarInset className="flex flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 space-y-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
