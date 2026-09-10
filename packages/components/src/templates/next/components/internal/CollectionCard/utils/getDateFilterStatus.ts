import { DATE_FILTER_STATUS, type DateFilterStatusId } from "~/types/constants"
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
  today = getSingaporeDateYYYYMMDD(),
}: DateFilterValue & { today?: string }): DateFilterStatusId => {
  const end = endDate ?? date

  if (today < date) {
    return DATE_FILTER_STATUS.Upcoming.id
  }

  if (today > end) {
    return DATE_FILTER_STATUS.Ended.id
  }

  return DATE_FILTER_STATUS.Ongoing.id
}
