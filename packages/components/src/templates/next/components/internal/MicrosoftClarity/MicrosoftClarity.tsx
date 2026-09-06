"use client"

import type { MicrosoftClarityProps } from "~/interfaces"
import { useEffect } from "react"
import { useInteractionScriptLoader } from "~/hooks/useInteractionScriptLoader"

export const MicrosoftClarity = ({ msClarityId }: MicrosoftClarityProps) => {
  // Step 1: insert the tiny inline init function
  // If code calls window.clarity() before the script loads, it would fail because window.clarity doesn't exist yet.
  // The function below (taken from the Clarity docs) implements a queue pattern:
  // 1. Creates a placeholder window.clarity function that queues calls
  // 2. Stores calls in window.clarity.q array
  // 3. When the real Clarity script loads, it processes all queued calls
  useEffect(() => {
    // to not render during static site generation on the server
    if (globalThis.window == null) return

    // @ts-expect-error - Clarity is not typed
    if (!globalThis.window.clarity) {
      // SAFETY: Clarity bootstrap assigns an untyped queue function on window before its script loads
      // oxlint-disable-next-line anti-slop/no-chained-type-assertions -- window clarity bootstrap is untyped
      const clarityWindow = globalThis.window as unknown as Window & {
        clarity: ((...args: unknown[]) => void) & { q?: unknown[] }
      }
      clarityWindow.clarity = function (...args: unknown[]) {
        // oxlint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        ;(clarityWindow.clarity.q = clarityWindow.clarity.q ?? []).push(...args)
      }
    }
  }, [])

  // Step 2: delayed loader for the actual Clarity script
  useInteractionScriptLoader({
    src: `https://www.clarity.ms/tag/${msClarityId}`,
  })

  return null
}
