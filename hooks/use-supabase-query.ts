"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import type { PostgrestError } from "@supabase/supabase-js"

interface UseSupabaseQueryOptions<T> {
  enabled?: boolean
  refetchOnMount?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: PostgrestError) => void
}

interface UseSupabaseQueryResult<T> {
  data: T | null
  error: PostgrestError | null
  isLoading: boolean
  isError: boolean
  refetch: () => Promise<void>
}

export function useSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  deps: React.DependencyList = [],
  options: UseSupabaseQueryOptions<T> = {},
): UseSupabaseQueryResult<T> {
  const { enabled = true, refetchOnMount = true, onSuccess, onError } = options

  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<PostgrestError | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)
  const [isError, setIsError] = useState(false)

  const executeQuery = useCallback(async () => {
    if (!enabled) return

    setIsLoading(true)
    setError(null)
    setIsError(false)

    try {
      const result = await queryFn()

      if (result.error) {
        setError(result.error)
        setIsError(true)
        onError?.(result.error)
      } else {
        setData(result.data)
        onSuccess?.(result.data)
      }
    } catch (err) {
      const error = err as PostgrestError
      setError(error)
      setIsError(true)
      onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }, [enabled, queryFn, onSuccess, onError])

  useEffect(() => {
    if (enabled && refetchOnMount) {
      executeQuery()
    }
  }, [...deps, enabled, refetchOnMount])

  const refetch = useCallback(async () => {
    await executeQuery()
  }, [executeQuery])

  return {
    data,
    error,
    isLoading,
    isError,
    refetch,
  }
}
