"use client"

import { getFormattedDate } from "~/utils/getFormattedDate"

interface ClientCopyrightProps {
  isGovernment?: boolean
  agencyName: string
  lastUpdated: string
}

// Rendered on the client so the copyright year reflects the visitor's current
// year rather than the (static) build-time year.
export const ClientCopyright = ({
  isGovernment,
  agencyName,
  lastUpdated,
}: ClientCopyrightProps) => {
  return `© ${new Date().getFullYear()} ${isGovernment ? "Government of Singapore" : agencyName}, last updated on ${getFormattedDate(lastUpdated)}`
}
