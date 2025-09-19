import type React from "react"
import type { Metadata } from "next"
import { PWAProvider } from "@/components/pwa-provider"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "MB Microcredits - Móvil",
  description: "App local-first para móvil con sincronización a Supabase.",
  manifest: "/manifest.json",
  themeColor: "#111111",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
}

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={cn("bg-background text-foreground antialiased")}>
        <PWAProvider />
        <div className="mx-auto max-w-md min-h-svh flex flex-col">{children}</div>
      </body>
    </html>
  )
}
