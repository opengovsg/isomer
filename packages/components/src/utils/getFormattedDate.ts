import type { FormattedDate } from "~/types"
import { format } from "date-fns"

import { getParsedDate } from "./getParsedDate"

const DATE_DISPLAY_FORMAT = "d MMMM yyyy"

const toFormattedDate = (value: string): FormattedDate =>
  // SAFETY: branded date string from date-fns format output
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- FormattedDate is a branded alias of date-fns output
  value as FormattedDate

// Standardise the format of dates displayed on the site
export const getFormattedDate = (dateString?: string): FormattedDate => {
  if (dateString === undefined) {
    return toFormattedDate(format(new Date(), DATE_DISPLAY_FORMAT))
  }

  const date = getParsedDate(dateString)

  return toFormattedDate(format(date, DATE_DISPLAY_FORMAT))
}
