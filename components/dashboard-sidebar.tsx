"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Home,
  Users,
  Handshake,
  DollarSign,
  CreditCard,
  CalendarCheck,
  BarChart2,
  LogOut,
  ChevronDown,
  User2,
  FileText,
  Receipt,
  Calendar,
  Calculator,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { title: "Inicio", href: "/dashboard", icon: Home, route: "dashboard" },
  { title: "Usuarios", href: "/dashboard/users", icon: Users, route: "users" },
  { title: "Socios", href: "/dashboard/partners", icon: Handshake, route: "partners" },
  { title: "Clientes", href: "/dashboard/clients", icon: User2, route: "clients" },
  { title: "Préstamos", href: "/dashboard/loans", icon: CreditCard, route: "loans" },
  { title: "Recibo", href: "/dashboard/receipts", icon: Receipt, route: "receipts" },
  { title: "Cronograma", href: "/dashboard/cronograma", icon: Calendar, route: "cronograma" },
  { title: "Transacciones", href: "/dashboard/transactions", icon: DollarSign, route: "transactions" },
  { title: "Seguimientos", href: "/dashboard/followups", icon: CalendarCheck, route: "followups" },
  { title: "Resumen para Socios", href: "/dashboard/resumen", icon: FileText, route: "reports" },
  { title: "Informe de situación Financiera", href: "/dashboard/reports", icon: BarChart2, route: "reports" },
  { title: "Fórmulas", href: "/formulas", icon: Calculator, route: "formulas" },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [permissionsLoaded, setPermissionsLoaded] = useState(false)

  useEffect(() => {
    const loadUserPermissions = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const response = await fetch(`/api/users/permissions?userId=${user.id}`)
          const data = await response.json()

          if (data.permissions && Array.isArray(data.permissions)) {
            setUserPermissions(data.permissions)
          } else {
            setUserPermissions(["dashboard", "clients", "loans", "receipts", "cronograma", "transactions", "formulas"])
          }
        }
      } catch (error) {
        console.error("Error loading permissions:", error)
        setUserPermissions(["dashboard", "clients", "loans", "cronograma", "formulas"])
      } finally {
        setPermissionsLoaded(true)
      }
    }

    loadUserPermissions()
  }, [])

  const filteredNavItems = navItems.filter((item) => userPermissions.includes(item.route) || item.route === "dashboard")

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (!permissionsLoaded) {
    return (
      <Sidebar className="bg-gray-900 border-r border-gray-800">
        <SidebarHeader className="p-4 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-white">Microcréditos</h1>
        </SidebarHeader>
        <SidebarContent className="flex-1 overflow-auto py-4">
          <div className="p-4 text-center text-gray-400">Cargando permisos...</div>
        </SidebarContent>
      </Sidebar>
    )
  }

  return (
    <Sidebar className="bg-gray-900 border-r border-gray-800">
      <SidebarHeader className="p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">Microcréditos</h1>
      </SidebarHeader>
      <SidebarContent className="flex-1 overflow-auto py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 font-semibold text-sm uppercase tracking-wide">
            Navegación
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      className={cn(
                        "text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-200",
                        pathname === item.href && "bg-blue-600 text-white font-semibold border-r-2 border-blue-400",
                      )}
                    >
                      <item.icon className="size-5" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-gray-800 bg-gray-800/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start text-left text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <User2 className="mr-2 size-5" />
              <span className="flex-grow">Mi Cuenta</span>
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-(--radix-popper-anchor-width) bg-gray-800 text-gray-200 border-gray-700"
          >
            <DropdownMenuItem className="cursor-pointer hover:!bg-gray-700 hover:!text-white">
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-400 hover:!bg-red-500/10 hover:!text-red-400"
            >
              <LogOut className="mr-2 size-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
