"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Home, Users, Handshake, DollarSign, CreditCard, CalendarCheck, BarChart2, LogOut, ChevronDown, User2, FileText, Receipt, Calendar } from 'lucide-react'
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
  { title: "Cronograma", href: "/dashboard/cronograma", icon: Calendar, route: "cronograma" }, // agregando ruta cronograma
  { title: "Transacciones", href: "/dashboard/transactions", icon: DollarSign, route: "transactions" },
  { title: "Seguimientos", href: "/dashboard/followups", icon: CalendarCheck, route: "followups" },
  { title: "Resumen para Socios", href: "/dashboard/resumen", icon: FileText, route: "reports" },
  { title: "Informe de situación Financiera", href: "/dashboard/reports", icon: BarChart2, route: "reports" },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [permissionsLoaded, setPermissionsLoaded] = useState(false)

  useEffect(() => {
    const loadUserPermissions = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        
        if (user) {
          console.log("[v0] Cargando permisos para usuario:", user.email)
          
          let profile = null
          try {
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("is_admin, is_superadmin")
              .eq("id", user.id)
              .single()
            
            if (profileError && profileError.code === 'PGRST116') {
              // Usuario no tiene perfil, crear uno
              console.log("[v0] Creando perfil para usuario:", user.email)
              const { data: newProfile } = await supabase
                .from("profiles")
                .insert({
                  id: user.id,
                  email: user.email,
                  full_name: user.email?.split('@')[0] || 'Usuario',
                  is_admin: false,
                  is_superadmin: false
                })
                .select("is_admin, is_superadmin")
                .single()
              
              profile = newProfile
            } else if (!profileError) {
              profile = profileData
            }
          } catch (profileErr) {
            console.error("[v0] Error con perfil:", profileErr)
          }

          if (profile?.is_admin || profile?.is_superadmin) {
            console.log("[v0] Usuario es administrador")
            setIsAdmin(true)
            setUserPermissions(navItems.map((item) => item.route))
          } else {
            console.log("[v0] Usuario normal, obteniendo permisos específicos")
            // Usuarios normales obtienen permisos específicos
            try {
              const response = await fetch(`/api/users/permissions?userId=${user.id}`)
              const data = await response.json()

              if (data.permissions && Array.isArray(data.permissions)) {
                setUserPermissions(data.permissions)
              } else {
                // Permisos por defecto para usuarios normales
                setUserPermissions(["dashboard", "clients", "loans", "cronograma", "transactions"])
              }
            } catch (permErr) {
              console.error("[v0] Error obteniendo permisos:", permErr)
              // Permisos por defecto en caso de error
              setUserPermissions(["dashboard", "clients", "loans", "cronograma", "transactions"])
            }
          }
        } else {
          console.log("[v0] No hay usuario autenticado")
          router.push("/login")
        }
      } catch (error) {
        console.error("[v0] Error loading permissions:", error)
        setUserPermissions(["dashboard", "clients", "loans", "cronograma"])
      } finally {
        setPermissionsLoaded(true)
      }
    }

    loadUserPermissions()
  }, [router])

  const filteredNavItems = isAdmin
    ? navItems
    : navItems.filter((item) => userPermissions.includes(item.route) || item.route === "dashboard")

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
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
          <SidebarGroupLabel className="text-muted-foreground">Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      className={cn(
                        "hover:bg-primary/10 hover:text-primary",
                        pathname === item.href && "bg-primary/10 text-primary font-semibold",
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
      <SidebarFooter className="p-4 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start text-left">
              <User2 className="mr-2 size-5" />
              <span className="flex-grow">Mi Cuenta</span>
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-[--radix-popper-anchor-width] bg-popover text-popover-foreground border-border"
          >
            <DropdownMenuItem asChild className="cursor-pointer hover:!bg-primary/10">
              <Link href="/dashboard/profile">
                <span>Perfil</span>
              </Link>
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
