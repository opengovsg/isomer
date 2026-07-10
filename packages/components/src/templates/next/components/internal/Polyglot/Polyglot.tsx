"use client"

import type { PolyglotProps } from "~/interfaces"
import { useScript } from "usehooks-ts"

// Reference: https://polyglot.gov.sg
export const Polyglot = ({ environment }: PolyglotProps) => {
  const scriptUrl =
    environment === "staging"
      ? "https://staging-assets.polyglot.gov.sg/widget.js"
      : "https://assets.polyglot.gov.sg/widget.js"

  useScript(scriptUrl)

  return <div id="polyglot-widget" />
}
