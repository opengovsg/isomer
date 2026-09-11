import type { DateFilterDisplayEntry } from "~/interfaces/internal/DateFilter"

import { LabeledDate } from "./LabeledDate"

interface DateFilterDatesProps {
  entries?: DateFilterDisplayEntry[]
}

export const DateFilterDates = ({ entries }: DateFilterDatesProps) => {
  if (!entries || entries.length === 0) {
    return null
  }

  return entries.map(({ id, label, dateText }) => (
    <LabeledDate key={id} label={label} dateText={dateText} />
  ))
}
