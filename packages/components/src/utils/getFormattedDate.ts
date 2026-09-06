import type { FormattedDate } from "~/types"
import { format } from "date-fns"

import { getParsedDate } from "./getParsedDate"

const DATE_DISPLAY_FORMAT = "d MMMM yyyy"

const toFormattedDate = (value: string): FormattedDate => {
  const formatted: FormattedDate = value
  return formatted
}

// Standardise the format of dates displayed on the site
export const getFormattedDate = (dateString?: string): FormattedDate => {
  if (dateString === undefined) {
    return toFormattedDate(format(new Date(), DATE_DISPLAY_FORMAT))
  }

  const date = getParsedDate(dateString)

  return toFormattedDate(format(date, DATE_DISPLAY_FORMAT))
}
