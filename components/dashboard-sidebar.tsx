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
  ChevronDown,
  User2,
  FileText,
  Receipt,
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
  { title: "Inicio", href: "/dashboard", icon: Home },
  { title: "Usuarios", href: "/dashboard/users", icon: Users },
  { title: "Socios", href: "/dashboard/partners", icon: Handshake },
  { title: "Clientes", href: "/dashboard/clients", icon: User2 },
  { title: "Préstamos", href: "/dashboard/loans", icon: CreditCard },
  { title: "Recibo", href: "/dashboard/receipts", icon: Receipt }, // Added new receipts route
  { title: "Transacciones", href: "/dashboard/transactions", icon: DollarSign },
  { title: "Seguimientos", href: "/dashboard/followups", icon: CalendarCheck },
  { title: "Resumen para Socios", href: "/dashboard/resumen", icon: FileText },
  { title: "Informe de situación Financiera", href: "/dashboard/reports", icon: BarChart2 },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
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
              {navItems.map((item) => (
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
