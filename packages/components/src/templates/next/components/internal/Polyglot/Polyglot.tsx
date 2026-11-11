import type { PolyglotProps } from "~/interfaces"

import { PolyglotClient } from "./PolyglotClient"

export const Polyglot = ({ environment }: PolyglotProps) => {
  return (
    <PolyglotClient
      scriptUrl={
        environment === "staging"
          ? "https://staging-assets.polyglot.gov.sg/widget.js"
          : "https://assets.polyglot.gov.sg/widget.js"
      }
    />
  )
}
