"use client"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function SiteHeader() {
  return (
    <header className={cn("sticky top-0 z-40 w-full border-b border-gray-200/40 bg-white/80 backdrop-blur")}>
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/images/logo-bm.png" alt="Logo BM Microcredits" width={36} height={36} priority />
          <span className="font-semibold tracking-tight text-gray-800">BM Microcredits</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-gray-600 md:flex">
          <Link href="/dashboard" className="hover:text-gray-900">
            Inicio
          </Link>
          <Link href="/dashboard/loans" className="hover:text-gray-900">
            Préstamos
          </Link>
          <Link href="/dashboard/reports" className="hover:text-gray-900">
            Informe
          </Link>
        </nav>
      </div>
    </header>
  )
}
