import {
  DATE_FILTER_STATUS_ID,
  type DateFilterStatusId,
} from "~/types/constants"
import { getSingaporeDateYYYYMMDD } from "~/utils/getSingaporeDate"

interface DateFilterValue {
  date: string
  endDate?: string
}

// Compares "yyyy-MM-dd" strings against today in Asia/Singapore.
// Inclusive range: upcoming | ongoing | ended (no `endDate` = single-day range).
export const getDateFilterStatus = ({
  date,
  endDate,
}: DateFilterValue): DateFilterStatusId => {
  const today = getSingaporeDateYYYYMMDD()
  const end = endDate ?? date

  if (today < date) {
    return DATE_FILTER_STATUS_ID.Upcoming
  }

  if (today > end) {
    return DATE_FILTER_STATUS_ID.Ended
  }

  return DATE_FILTER_STATUS_ID.Ongoing
}
