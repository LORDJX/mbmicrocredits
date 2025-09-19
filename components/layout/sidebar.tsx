"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Building2,
  Users,
  CreditCard,
  Calendar,
  Receipt,
  UserCheck,
  BarChart3,
  Settings,
  Menu,
  LogOut,
  Home,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    code: "DASH",
  },
  {
    name: "Clientes",
    href: "/clientes",
    icon: Users,
    code: "CLI",
  },
  {
    name: "Préstamos",
    href: "/prestamos",
    icon: CreditCard,
    code: "PRES",
  },
  {
    name: "Cronogramas",
    href: "/cronogramas",
    icon: Calendar,
    code: "CRON",
  },
  {
    name: "Pagos",
    href: "/pagos",
    icon: Receipt,
    code: "PAG",
  },
  {
    name: "Socios",
    href: "/socios",
    icon: UserCheck,
    code: "SOC",
  },
  {
    name: "Reportes",
    href: "/reportes",
    icon: BarChart3,
    code: "REP",
  },
  {
    name: "Configuración",
    href: "/configuracion",
    icon: Settings,
    code: "CONF",
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div className={cn("pb-12 min-h-screen bg-sidebar border-r border-sidebar-border", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center mb-8">
            <Building2 className="h-8 w-8 text-sidebar-primary mr-3" />
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground font-work-sans">MB Microcréditos</h2>
              <p className="text-xs text-sidebar-foreground/60">Sistema de Gestión</p>
            </div>
          </div>
          <div className="space-y-1">
            {navigation.map((item) => (
              <Button
                key={item.name}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-3 h-4 w-4" />
                  <span className="flex-1 text-left">{item.name}</span>
                  <span className="text-xs text-sidebar-foreground/60 font-mono">{item.code}</span>
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 left-3 right-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="md:hidden" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        <Sidebar />
      </SheetContent>
    </Sheet>
  )
}
