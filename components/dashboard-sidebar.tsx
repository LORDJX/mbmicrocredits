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
  Clock,
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
  { title: "Clientes", href: "/dashboard/clients", icon: User2, route: "clients" },
  { title: "Préstamos", href: "/dashboard/loans", icon: CreditCard, route: "loans" },
  { title: "Recibo", href: "/dashboard/receipts", icon: Receipt, route: "receipts" },
  { title: "Cronograma", href: "/dashboard/cronograma", icon: Calendar, route: "cronograma" },
  { title: "Cuotas", href: "/dashboard/cuotas", icon: Clock, route: "cuotas" },
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
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadUserPermissions = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        console.log("[v0] User from auth:", user?.id)

        if (user) {
          setCurrentUser({
            email: user.email || "Usuario",
            name: user.user_metadata?.name || user.email?.split("@")[0] || "Usuario",
          })

          const url = `/api/users/permissions?userId=${user.id}`
          console.log("[v0] Fetching permissions from:", url)

          const response = await fetch(url, {
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          })

          console.log("[v0] Response status:", response.status)
          console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const contentType = response.headers.get("content-type")
          if (!contentType || !contentType.includes("application/json")) {
            console.error("[v0] Response is not JSON, content-type:", contentType)
            const text = await response.text()
            console.error("[v0] Response text:", text.substring(0, 200))
            throw new Error(`API returned non-JSON response: ${response.status}`)
          }

          const data = await response.json()
          console.log("[v0] Permissions data:", data)

          if (data.permissions && Array.isArray(data.permissions)) {
            setUserPermissions(data.permissions)
          } else {
            setUserPermissions([
              "dashboard",
              "clients",
              "loans",
              "receipts",
              "cronograma",
              "cuotas",
              "transactions",
              "formulas",
            ])
          }
        } else {
          console.log("[v0] No user found, using default permissions")
          router.push("/auth/login")
          return
        }
      } catch (error) {
        console.error("Error loading permissions:", error)
        setUserPermissions(["dashboard", "clients", "loans", "cronograma", "formulas"])
        setError("No se pudieron cargar los permisos. Usando permisos básicos.")
      } finally {
        setPermissionsLoaded(true)
      }
    }

    loadUserPermissions()
  }, [router, supabase.auth])

  const filteredNavItems = navItems.filter((item) => userPermissions.includes(item.route) || item.route === "dashboard")

  const handleLogout = async () => {
    try {
      console.log("[v0] Logging out user")
      await supabase.auth.signOut()
      setUserPermissions([])
      setCurrentUser(null)
      setPermissionsLoaded(false)
      router.push("/auth/login")
      router.refresh()
    } catch (error) {
      console.error("[v0] Logout error:", error)
      router.push("/auth/login")
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
              <div className="flex-grow text-left">
                <div className="text-sm font-medium">{currentUser?.name || "Usuario"}</div>
                <div className="text-xs text-muted-foreground truncate">{currentUser?.email}</div>
              </div>
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-[--radix-popper-anchor-width] bg-popover text-popover-foreground border-border"
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
