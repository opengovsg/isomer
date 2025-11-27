"use client"

import { useEffect } from "react"

import type { MicrosoftClarityProps } from "~/interfaces"
import { useInteractionScriptLoader } from "~/hooks/useInteractionScriptLoader" // your hook

export const MicrosoftClarity = ({ msClarityId }: MicrosoftClarityProps) => {
  // Step 1: insert the tiny inline init function
  useEffect(() => {
    // to not render during static site generation on the server
    if (typeof window === "undefined") return

    // @ts-expect-error - Clarity is not typed
    if (!window.clarity) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      ;(window as any).clarity = function () {
        // @ts-expect-error - Clarity is not typed
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, prefer-rest-params
        ;(window.clarity.q = window.clarity.q || []).push(arguments)
      }
    }
  }, [])

  // Step 2: delayed loader for the actual Clarity script
  useInteractionScriptLoader({
    src: `https://www.clarity.ms/tag/${msClarityId}`,
  })

  return null // this component does not render anything
}
