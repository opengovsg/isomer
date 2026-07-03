"use client"

import type { IsomerSiteProps } from "~/types"

interface ClientCopyrightProps extends Pick<
  IsomerSiteProps,
  "isGovernment" | "agencyName"
> {
  // Pre-formatted on the server so date-fns stays out of the client bundle.
  formattedLastUpdated: string
}

// Rendered on the client so the copyright year reflects the visitor's current
// year rather than the (static) build-time year.
export const ClientCopyright = ({
  isGovernment,
  agencyName,
  formattedLastUpdated,
}: ClientCopyrightProps) => {
  return `© ${new Date().getFullYear()} ${isGovernment ? "Government of Singapore" : agencyName}, last updated on ${formattedLastUpdated}`
}
