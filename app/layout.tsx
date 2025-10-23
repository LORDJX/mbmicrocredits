import type React from "react"
import type { Metadata } from "next"
import { Inter, Work_Sans } from "next/font/google"
import "./globals.css"
import { ConditionalSidebar } from "@/components/conditional-sidebar"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const workSans = Work_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-work-sans",
})

export const metadata: Metadata = {
  title: "MB Microcréditos",
  description: "Sistema profesional de gestión de microcréditos",
  generator: "v0.dev",
  keywords: ["microcréditos", "préstamos", "gestión financiera", "sistema de pagos"],
  authors: [{ name: "MB Microcréditos" }],
  viewport: "width=device-width, initial-scale=1",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${workSans.variable} dark`} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <div className="relative flex min-h-screen flex-col">
          <ConditionalSidebar>{children}</ConditionalSidebar>
        </div>
      </body>
    </html>
  )
}
