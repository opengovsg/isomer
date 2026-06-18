"use client"

import { useEffect, useRef, useState } from "react"

// Exponential ease-out: f(t) = 1 - e^(-t/τ)
// τ = 20 / ln(20) gives ~95% progress at t=20s — fast start, slows asymptotically
const TAU = 20 / Math.log(20)

export const useSimulatedLoadingProgress = ({
  isLoading,
  total,
}: {
  isLoading: boolean
  total: number | null
}): number | null => {
  const [simulatedRows, setSimulatedRows] = useState<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isLoading || total === null) {
      setSimulatedRows(null)
      startTimeRef.current = null
      return
    }

    startTimeRef.current = Date.now()
    setSimulatedRows(0)

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current!) / 1000
      const progress = 1 - Math.exp(-elapsed / TAU)
      // Cap at total - 1 so we never show "N of N" while still loading
      setSimulatedRows(Math.min(Math.floor(progress * total), total - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [isLoading, total])

  return simulatedRows
}
