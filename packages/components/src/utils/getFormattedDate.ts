import { format } from "date-fns"

import type { FormattedDate } from "~/types"
import { getParsedDate } from "./getParsedDate"

// Standardise the format of dates displayed on the site
export const getFormattedDate = (dateString?: string): FormattedDate => {
  if (dateString === undefined) {
    return format(new Date(), "d MMMM yyyy") as FormattedDate
  }

  const date = getParsedDate(dateString)

  return format(date, "d MMMM yyyy") as FormattedDate
}
