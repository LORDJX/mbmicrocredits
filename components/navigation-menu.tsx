"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Users, CreditCard, Calendar, BarChart3, Home } from "lucide-react"

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home, code: "DASH" },
  { href: "/clientes", label: "Clientes", icon: Users, code: "CLI" },
  { href: "/prestamos", label: "Préstamos", icon: CreditCard, code: "PRES" },
  { href: "/cronogramas", label: "Cronogramas", icon: Calendar, code: "CRON" },
  { href: "/reportes", label: "Reportes", icon: BarChart3, code: "REP" },
]

export function NavigationMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  <span className="text-xs bg-gray-600 px-1 rounded">{item.code}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 right-4 z-50 bg-gray-800 text-white hover:bg-gray-700"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-gray-800 border-gray-700">
            <div className="flex flex-col space-y-4 mt-8">
              {navigationItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                    <span className="ml-auto text-xs bg-gray-600 px-2 py-1 rounded">{item.code}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
