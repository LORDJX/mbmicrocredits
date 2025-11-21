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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const loadUserPermissions = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          console.log("[v0] No user found, setting default permissions")
          setUserPermissions(["dashboard"])
          setPermissionsLoaded(true)
          return
        }

        console.log("[v0] Fetching permissions for user:", user.id)
        const response = await fetch(`/api/users/${user.id}/permissions?userId=${user.id}`)

        if (!response.ok) {
          const errorText = await response.text()
          console.error("[v0] API error response:", response.status, errorText)
          setUserPermissions(["dashboard"])
          setPermissionsLoaded(true)
          return
        }

        const data = await response.json()
        console.log("[v0] Permissions data received:", data)

        if (data.permissions && Array.isArray(data.permissions)) {
          console.log("[v0] User permissions:", data.permissions)
          setUserPermissions(data.permissions.length > 0 ? data.permissions : ["dashboard"])
        } else {
          console.log("[v0] No permissions found, using default")
          setUserPermissions(["dashboard"])
        }
      } catch (error) {
        console.error("[v0] Error loading permissions:", error)
        console.error("[v0] Error details:", {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        })
        setUserPermissions(["dashboard"])
      } finally {
        setPermissionsLoaded(true)
      }
    }

    loadUserPermissions()
  }, [])

  const filteredNavItems = navItems.filter((item) => userPermissions.includes(item.route) || item.route === "dashboard")

  const handleLogout = async () => {
    if (isLoggingOut) {
      console.log("[v0] Logout already in progress, ignoring duplicate click")
      return
    }

    console.log("[v0] Logout initiated")
    setIsLoggingOut(true)

    try {
      console.log("[v0] Calling server-side logout API")
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.error("[v0] Server logout failed:", response.status)
        throw new Error("Server logout failed")
      }

      console.log("[v0] Server-side logout successful")

      // Also sign out on client side
      const supabase = createClient()
      await supabase.auth.signOut()
      console.log("[v0] Client-side signOut completed")

      // Force a hard redirect to ensure all state is cleared
      console.log("[v0] Performing hard redirect to /auth/login")
      window.location.href = "/auth/login"
    } catch (error) {
      console.error("[v0] Error during logout:", error)
      // Fallback: force redirect even if error occurs
      console.log("[v0] Forcing hard redirect to login page")
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
            <Button
              variant="ghost"
              className="w-full justify-start text-left hover:bg-primary/10"
              disabled={isLoggingOut}
            >
              <User2 className="mr-2 size-5" />
              <span className="flex-1">{isLoggingOut ? "Cerrando sesión..." : "Mi Cuenta"}</span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            side="bottom" 
            align="start" 
            className="w-56"
            style={{
                position: 'fixed',
                zIndex: 9999,
            }}
          >
            <DropdownMenuLabel className="sr-only">Opciones de cuenta de usuario</DropdownMenuLabel>
            <DropdownMenuItem className="cursor-pointer">
              <User2 className="mr-2 size-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleLogout}
              variant="destructive"
              className="cursor-pointer"
              disabled={isLoggingOut}
            >
              <LogOut className="mr-2 size-4" />
              <span>{isLoggingOut ? "Cerrando..." : "Cerrar Sesión"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}