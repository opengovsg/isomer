import {
  DATE_FILTER_STATUS_ID,
  type DateFilterStatusId,
} from "~/types/constants"
import { getSingaporeDateYYYYMMDD } from "~/utils/getSingaporeDate"

export interface DateFilterValue {
  date: string
  endDate?: string
}

// "yyyy-MM-dd" in Asia/Singapore, independent of the visitor's own timezone —
// every visitor sees the same status for the same item at the same moment
// (SG-government event dates, entered without any timezone field). `date`
// and `endDate` are already plain "yyyy-MM-dd" strings (schema format
// "date", no time component), so lexicographic string comparison against
// this is equivalent to calendar-date comparison — no Date parsing needed.
export const getTodayInSingapore = (): string => getSingaporeDateYYYYMMDD()

// Inclusive on both ends: `today < date` → upcoming, `date <= today <= end`
// → ongoing, `today > end` → ended. A single date (no `endDate`) is treated
// as a 1-day range — ongoing on the day itself.
export const getDateFilterStatus = (
  { date, endDate }: DateFilterValue,
  today: string = getTodayInSingapore(),
): DateFilterStatusId => {
  const end = endDate ?? date

  if (today < date) {
    return DATE_FILTER_STATUS_ID.Upcoming
  }

  if (today > end) {
    return DATE_FILTER_STATUS_ID.Ended
  }

  return DATE_FILTER_STATUS_ID.Ongoing
}
