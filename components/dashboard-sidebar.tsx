"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Users,
  Handshake,
  DollarSign,
  CreditCard,
  CalendarCheck,
  BarChart2,
  LogOut,
  Settings,
  ChevronDown,
  User2,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

// Definimos los elementos de navegación
const navItems = [
  {
    title: "Inicio",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Usuarios",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    title: "Socios",
    href: "/dashboard/partners",
    icon: Handshake,
  },
  {
    title: "Clientes",
    href: "/dashboard/clients",
    icon: Users,
  },
  {
    title: "Préstamos",
    href: "/dashboard/loans",
    icon: CreditCard,
  },
  {
    title: "Transacciones",
    href: "/dashboard/transactions",
    icon: DollarSign,
  },
  {
    title: "Seguimientos",
    href: "/dashboard/followups",
    icon: CalendarCheck,
  },
  {
    title: "Informes",
    href: "/dashboard/reports",
    icon: BarChart2,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      // CORRECCIÓN: Llamar al endpoint server-side primero para limpiar cookies
      await fetch("/api/auth/logout", {
        method: "POST",
      })

      // Luego hacer signOut en el cliente
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error("Error al cerrar sesión:", error.message)
      }
      
      // Redirect a login
      router.push("/login")
    } catch (error) {
      console.error("Error durante logout:", error)
      // Fallback: forzar redirect incluso si hay error
      router.push("/login")
    }
  }

  return (
    <Sidebar className="bg-gray-800 text-gray-100 border-r border-gray-700">
      <SidebarHeader className="p-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-gray-50">Microcréditos</h1>
      </SidebarHeader>
      <SidebarContent className="flex-1 overflow-auto py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400">Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="size-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator className="my-4 bg-gray-700" />
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400">Configuración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="size-5" />
                    <span>Ajustes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-gray-700">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full">
                  <User2 className="size-5" />
                  <span>Mi Cuenta</span>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-(--radix-popper-anchor-width) bg-gray-700 text-gray-100 border border-gray-600"
              >
                <DropdownMenuItem className="hover:bg-gray-600 focus:bg-gray-600 cursor-pointer">
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="hover:bg-red-700 focus:bg-red-700 text-red-300 hover:text-red-50 focus:text-red-50 cursor-pointer"
                >
                  <LogOut className="mr-2 size-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
