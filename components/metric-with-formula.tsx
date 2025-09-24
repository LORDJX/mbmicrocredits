"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calculator } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface MetricWithFormulaProps {
  title: string
  value: string | number
  description?: string
  formula: string
  calculation: string
  icon?: React.ReactNode
  colorClass?: string
  isPercentage?: boolean
}

export function MetricWithFormula({
  title,
  value,
  description,
  formula,
  calculation,
  icon,
  colorClass = "text-gray-50",
  isPercentage = false,
}: MetricWithFormulaProps) {
  const [showFormula, setShowFormula] = useState(false)

  const displayValue =
    typeof value === "number" ? (isPercentage ? `${value.toFixed(1)}%` : value.toLocaleString()) : value

  return (
    <Card className="bg-gray-800 text-gray-100 border border-gray-700 shadow-lg relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {icon}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-blue-400 hover:text-blue-300">
                <Calculator className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 text-gray-100 border border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-gray-50 flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Fórmula: {title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-200 mb-2">Fórmula:</h4>
                  <Badge variant="outline" className="font-mono text-sm bg-gray-700 text-gray-100">
                    {formula}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-200 mb-2">Cálculo actual:</h4>
                  <p className="text-gray-300 font-mono text-sm bg-gray-700 p-2 rounded">{calculation}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-200 mb-2">Resultado:</h4>
                  <p className={`text-2xl font-bold ${colorClass}`}>{displayValue}</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass}`}>{displayValue}</div>
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </CardContent>
    </Card>
  )
}
