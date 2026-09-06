"use client"

import { useEffect, useState } from "react"

interface UseDebounceProps<T> {
  value: T
  delay: number
}

// Simplified version to avoid adding a new dependency
export const useDebounce = <T>({ value, delay }: UseDebounceProps<T>): T => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
