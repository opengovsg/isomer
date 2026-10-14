import posthog from "posthog-js"

import { usePostHogCaptureOnceReady } from "./usePostHogCaptureOnceReady"

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
export const usePostHogOptionalStep = ({
  event,
  isReady = true,
  isBypassed,
  properties,
}: OptionalStepOptions): void => {
  usePostHogCaptureOnceReady(isReady, () => {
    posthog.capture(
      event,
      isBypassed ? { ...properties, skipped: true } : (properties ?? {}),
    )
  })
}
