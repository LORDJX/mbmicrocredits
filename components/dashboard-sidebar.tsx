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
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { title: "Inicio", href: "/dashboard", icon: Home, route: "dashboard" },
  { title: "Usuarios", href: "/dashboard/users", icon: Users, route: "users" },
  { title: "Socios", href: "/dashboard/partners", icon: Handshake, route: "partners" },
  { title: "Clientes", href: "/clientes", icon: User2, route: "clients" },
  { title: "Préstamos", href: "/prestamos", icon: CreditCard, route: "loans" },
  { title: "Recibo", href: "/dashboard/receipts", icon: Receipt, route: "receipts" },
  { title: "Cronograma", href: "/cronogramas", icon: Calendar, route: "cronograma" },
  { title: "Gastos", href: "/gastos", icon: DollarSign, route: "expenses" },
  { title: "Seguimientos", href: "/dashboard/followups", icon: CalendarCheck, route: "followups" },
  { title: "Resumen para Socios", href: "/dashboard/resumen", icon: FileText, route: "reports" },
  { title: "Informe de situación Financiera", href: "/reportes", icon: BarChart2, route: "reports" },
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
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setPermissionsLoaded(true)
          return
        }

        const response = await fetch(`/api/users/${user.id}/permissions`)
        const data = await response.json()

        if (response.ok) {
          if (data.is_admin) {
            // Admin has access to all routes
            setUserPermissions([
              "dashboard",
              "users",
              "partners",
              "clients",
              "loans",
              "receipts",
              "cronograma",
              "expenses",
              "followups",
              "reports",
              "formulas",
            ])
          } else {
            // Regular user: map permissions to route paths
            const routes = data.permissions?.map((p: any) => p.route_path) || []
            setUserPermissions(routes)
          }
        } else {
          // Fallback to basic permissions on error
          console.error("Error loading permissions:", data.error)
          setUserPermissions(["dashboard"])
        }
      } catch (error) {
        console.error("Error loading permissions:", error)
        setUserPermissions(["dashboard"])
      } finally {
        setPermissionsLoaded(true)
      }
    }

    loadUserPermissions()
  }, [])

  const filteredNavItems = navItems.filter((item) => userPermissions.includes(item.route) || item.route === "dashboard")

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()

      document.cookie.split(";").forEach((cookie) => {
        const name = cookie.split("=")[0].trim()
        if (name.startsWith("sb-")) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        }
      })

      router.push("/auth/login")
      router.refresh()
    } catch (error) {
      console.error("Error during logout:", error)
      // Fallback: force redirect even if error
      window.location.href = "/auth/login"
    }
  }

  if (!permissionsLoaded) {
    return (
      <Sidebar className="bg-card border-r border-border">
        <SidebarHeader className="p-4 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">Microcréditos</h1>
        </SidebarHeader>
        <SidebarContent className="flex-1 overflow-auto py-4">
          <div className="p-4 text-center text-muted-foreground">Cargando permisos...</div>
        </SidebarContent>
      </Sidebar>
    )
  }

  return (
    <Sidebar className="bg-card border-r border-border">
      <SidebarHeader className="p-4 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">Microcréditos</h1>
      </SidebarHeader>
      <SidebarContent className="flex-1 overflow-auto py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground font-semibold text-sm uppercase tracking-wide">
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
                        "hover:bg-primary/10 hover:text-primary transition-colors duration-200",
                        pathname === item.href && "bg-primary/15 text-primary font-semibold border-r-2 border-primary",
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
      <SidebarFooter className="p-4 border-t border-border bg-muted/30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start text-left hover:bg-primary/10">
              <User2 className="mr-2 size-5" />
              <span className="flex-grow">Mi Cuenta</span>
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-(--radix-popper-anchor-width) bg-popover text-popover-foreground border-border"
          >
            <DropdownMenuItem className="cursor-pointer hover:!bg-primary/10">
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
