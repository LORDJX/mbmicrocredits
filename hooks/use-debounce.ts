import { useEffect, useState } from "react"

/**
 * Hook para debouncing de valores
 * Útil para inputs de búsqueda que no deberían ejecutar fetch en cada keystroke
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up el timer
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cleanup: cancela el timer si value cambia antes del delay
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
