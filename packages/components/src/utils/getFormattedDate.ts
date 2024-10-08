import { format } from "date-fns"

import { getParsedDate } from "./getParsedDate"

// Standardise the format of dates displayed on the site
export const getFormattedDate = (dateString?: string) => {
  if (dateString === undefined) {
    return format(new Date(), "d MMMM yyyy")
  }

  const date = getParsedDate(dateString)

  return format(date, "d MMMM yyyy")
}
