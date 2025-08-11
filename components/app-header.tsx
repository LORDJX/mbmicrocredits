"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

interface AppHeaderProps {
  title?: string
  showPrintButton?: boolean
  onPrint?: () => void
}

export function AppHeader({ title = "BM Microcréditos", showPrintButton = false, onPrint }: AppHeaderProps) {
  return (
    <header className="site-header w-full border-b border-gray-700 bg-gray-800/80 backdrop-blur supports-[backdrop-filter]:bg-gray-800/60 no-print">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <img src="/images/logo-bm.png" alt="BM Microcréditos" className="h-10 w-10 rounded-md object-cover" />
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-wide text-gray-100">BM MICROCRÉDITOS</span>
            {title && title !== "BM Microcréditos" && <span className="text-sm text-gray-400">{title}</span>}
          </div>
        </Link>

        {showPrintButton && onPrint && (
          <Button
            onClick={onPrint}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600"
          >
            <Printer className="h-4 w-4" />
            Imprimir PDF
          </Button>
        )}
      </div>
    </header>
  )
}

export { AppHeader as default }
