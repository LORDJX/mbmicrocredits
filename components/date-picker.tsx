"use client"

import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatArgentinaDate, toArgentinaTime } from "@/lib/utils/date-utils"

interface DatePickerProps {
  id?: string
  name?: string
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DatePicker({
  id,
  name,
  value,
  onChange,
  placeholder = "Selecciona una fecha",
  className,
}: DatePickerProps) {
  const displayValue = value ? toArgentinaTime(value) : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600",
            !displayValue && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue ? formatArgentinaDate(displayValue, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600" align="start">
        <Calendar
          mode="single"
          selected={displayValue}
          onSelect={onChange}
          initialFocus
          className="bg-gray-800 text-gray-100"
        />
      </PopoverContent>
    </Popover>
  )
}
