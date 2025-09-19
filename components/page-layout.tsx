"use client"

import type React from "react"
import { NavigationMenu } from "./navigation-menu"
import { AppHeader } from "./app-header"

interface PageLayoutProps {
  children: React.ReactNode
  title?: string
  showPrintButton?: boolean
  onPrint?: () => void
}

export function PageLayout({ children, title, showPrintButton, onPrint }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar space */}
      <div className="md:pl-64">
        <AppHeader title={title} showPrintButton={showPrintButton} onPrint={onPrint} />
        <main className="p-6">{children}</main>
      </div>

      {/* Navigation Menu */}
      <NavigationMenu />
    </div>
  )
}
