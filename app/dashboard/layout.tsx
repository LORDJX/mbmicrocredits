import type React from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabaseServerClient"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Separator } from "@/components/ui/separator"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login") // Redirigir al login si no hay usuario autenticado
  }

  // Para persistir el estado de la barra lateral (abierta/cerrada)
  const cookieStore = cookies()
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <DashboardSidebar />
      <SidebarInset className="bg-gray-900 text-gray-100">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-700 px-4 bg-gray-800">
          <SidebarTrigger variant="ghost" size="icon" className="-ml-1 text-gray-400 hover:text-gray-50" />
          <Separator orientation="vertical" className="mr-2 h-8 bg-gray-700" />
          <h2 className="text-xl font-semibold text-gray-50">Dashboard</h2>
          {/* Aquí puedes añadir más elementos al encabezado, como un buscador o notificaciones */}
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 overflow-auto">
          {children} {/* Aquí se renderizará el contenido de cada página del dashboard */}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
