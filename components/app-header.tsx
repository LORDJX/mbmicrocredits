"use client"

import Link from "next/link"

export default function AppHeader() {
  return (
    <header className="site-header w-full border-b border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3">
          <img src="/images/logo-bm.png" alt="BM Microcredits" className="h-8 w-8 rounded-md object-cover" />
          <span className="font-semibold tracking-wide text-gray-800">BM Microcredits</span>
        </Link>
      </div>
    </header>
  )
}
