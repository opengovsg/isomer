import { useEffect, useRef } from "react"

/**
 * Runs `capture` exactly once, the first time `isReady` is true. Re-renders and
 * dependency changes after that first fire are no-ops. Use this to guard
 * analytics calls that must not double-count across re-renders.
 */
export const usePostHogCaptureOnceReady = (
  isReady: boolean,
  capture: () => void,
): void => {
  const hasCapturedRef = useRef(false)
  const captureRef = useRef(capture)
  captureRef.current = capture

  useEffect(() => {
    if (!isReady || hasCapturedRef.current) return
    hasCapturedRef.current = true
    captureRef.current()
  }, [isReady])
}
