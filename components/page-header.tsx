"use client"

import type React from "react"

import { BreadcrumbNav } from "@/components/breadcrumb-nav"

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="space-y-4">
      <BreadcrumbNav />

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground font-work-sans tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground text-balance">{description}</p>}
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </div>
  )
}
