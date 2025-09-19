"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Menu,
  Home,
  Users,
  CreditCard,
  Calendar,
  Receipt,
  UserCheck,
  BarChart3,
  Settings,
  LogOut,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home, code: "DASH" },
  { href: "/clientes", label: "Clientes", icon: Users, code: "CLI" },
  { href: "/prestamos", label: "Préstamos", icon: CreditCard, code: "PRES" },
  { href: "/cronogramas", label: "Cronogramas", icon: Calendar, code: "CRON" },
  { href: "/dashboard/receipts", label: "Recibos", icon: Receipt, code: "REC" },
  { href: "/dashboard/partners", label: "Socios", icon: UserCheck, code: "SOC" },
  { href: "/dashboard/reports", label: "Reportes", icon: BarChart3, code: "REP" },
  { href: "/dashboard/users", label: "Usuarios", icon: Settings, code: "USR" },
]

export function NavigationMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("mb_session")
    router.push("/login")
  }

  const NavItem = ({ href, label, icon: Icon, code, mobile = false }: any) => {
    const isActive = pathname === href || pathname.startsWith(href + "/")

    return (
      <Link
        href={href}
        onClick={() => mobile && setIsOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-accent",
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1">{label}</span>
        <span className="text-xs opacity-60">{code}</span>
      </Link>
    )
  }

  return (
    <>
      {/* Mobile Navigation */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex flex-col h-full">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">BM</span>
                  </div>
                  <div>
                    <h2 className="font-semibold">BM Microcréditos</h2>
                    <p className="text-xs text-muted-foreground">Sistema de Gestión</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {navigationItems.map((item) => (
                <NavItem key={item.href} {...item} mobile />
              ))}
            </nav>

            <div className="p-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Navigation - Fixed Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:z-50 md:bg-card md:border-r">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">BM</span>
              </div>
              <div>
                <h2 className="font-semibold">BM Microcréditos</h2>
                <p className="text-xs text-muted-foreground">Sistema de Gestión</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </nav>

          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
