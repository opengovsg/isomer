import type { FormattedDate } from "~/types"
import { format } from "date-fns"

import { getParsedDate } from "./getParsedDate"

// Standardise the format of dates displayed on the site
export const getFormattedDate = (dateString?: string): FormattedDate => {
  if (dateString === undefined) {
    // SAFETY: format() always returns the "d MMMM yyyy" pattern expected by FormattedDate
    return format(new Date(), "d MMMM yyyy") as FormattedDate
  }

  const date = getParsedDate(dateString)

  // SAFETY: format() always returns the "d MMMM yyyy" pattern expected by FormattedDate
  return format(date, "d MMMM yyyy") as FormattedDate
}
