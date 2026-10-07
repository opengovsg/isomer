import posthog from "posthog-js"
import { useEffect, useRef } from "react"

/**
 * Runs `capture` exactly once, the first time `isReady` is true. Re-renders and
 * dependency changes after that first fire are no-ops. Use this to guard
 * analytics calls that must not double-count across re-renders.
 */
export const useCaptureOnceReady = (
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

/**
 * Runs `capture` once for each distinct, non-null `key`. Unlike
 * {@link useCaptureOnceReady}, a new key value re-arms the guard — use this when
 * the same component instance can move through several funnel identities (e.g.
 * paging through resources without unmounting).
 */
export const useCaptureOncePerKey = <K>(
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

export interface OptionalStepOptions {
  event: string
  // Set when the bypass decision depends on data that loads asynchronously
  // (e.g. a count query), so the capture waits until that data has resolved.
  isReady?: boolean
  isBypassed: boolean
  properties?: Record<string, string | number | boolean>
}

/**
 * PostHog checkpoint for an optional step in a funnel.
 *
 * Fires once, as soon as `isReady`, tagged `skipped: true` when `isBypassed`.
 * This lets funnel analysis tell "saw the step and abandoned it" apart from
 * "never saw the step at all".
 */
export const useOptionalStep = ({
  event,
  isReady = true,
  isBypassed,
  properties,
}: OptionalStepOptions): void => {
  useCaptureOnceReady(isReady, () => {
    posthog.capture(
      event,
      isBypassed ? { ...properties, skipped: true } : (properties ?? {}),
    )
  })
}
