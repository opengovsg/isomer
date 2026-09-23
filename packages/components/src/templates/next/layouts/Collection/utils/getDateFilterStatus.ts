import { DATE_FILTER_STATUS, type DateFilterStatusId } from "~/types/constants"
import { getSingaporeDateYYYYMMDD } from "~/utils/getSingaporeDate"
import { storedDateToIso } from "~/utils/storedDate"

interface DateFilterValue {
  date: string
  endDate?: string
}

// `date` / `endDate` are stored as `dd/MM/yyyy`. Compared against today in
// Asia/Singapore after converting to `yyyy-MM-dd`, which sorts chronologically.
// Inclusive range: upcoming | ongoing | ended (no `endDate` = single-day range).
export const getDateFilterStatus = ({
  date,
  endDate,
}: DateFilterValue): DateFilterStatusId => {
  const today = getSingaporeDateYYYYMMDD()
  const start = storedDateToIso(date)
  const end = storedDateToIso(endDate ?? date)

  if (!start || !end) {
    return DATE_FILTER_STATUS.Ended.id
  }

  if (today < start) {
    return DATE_FILTER_STATUS.Upcoming.id
  }

  if (today > end) {
    return DATE_FILTER_STATUS.Ended.id
  }

  return DATE_FILTER_STATUS.Ongoing.id
}
