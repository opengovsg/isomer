import { useEffect, useRef } from "react"

/**
 * Runs `capture` once for each distinct, non-null `key`. Unlike
 * {@link usePostHogCaptureOnceReady}, a new key value re-arms the guard — use
 * this when the same component instance can move through several funnel
 * identities (e.g. paging through resources without unmounting).
 */
export const usePostHogCaptureOncePerKey = <K>(
  key: K | null | undefined,
  capture: (key: K) => void,
): void => {
  const capturedKeysRef = useRef(new Set<K>())
  const captureRef = useRef(capture)
  captureRef.current = capture

  useEffect(() => {
    if (key == null || capturedKeysRef.current.has(key)) return
    capturedKeysRef.current.add(key)
    captureRef.current(key)
  }, [key])
}
