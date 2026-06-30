import { formatInTimeZone } from "date-fns-tz"
import { AUDIT_LOG_EXPORT_MAX_MONTHS } from "~/schemas/audit"

// Audit log months are calendar months in Singapore time on the server
// (SGT = UTC+8, no DST), so we anchor the option list to the same zone to
// avoid the last month flickering on/off around midnight UTC.
const SINGAPORE_TIME_ZONE = "Asia/Singapore"

// How many months back the picker offers, on top of the current month. Derived
// from the shared export-window constant so the picker and the server guard
// stay in lockstep: current month + this many = AUDIT_LOG_EXPORT_MAX_MONTHS.
const MONTHS_OF_HISTORY = AUDIT_LOG_EXPORT_MAX_MONTHS - 1

export interface MonthOption {
  value: string
  label: string
}

const toMonthValue = (date: Date): string =>
  formatInTimeZone(date, SINGAPORE_TIME_ZONE, "yyyy-MM")

const toMonthLabel = (date: Date): string =>
  formatInTimeZone(date, SINGAPORE_TIME_ZONE, "MMMM yyyy")

// Build the list of selectable months, newest first: the current (partial)
// month followed by the previous `MONTHS_OF_HISTORY` complete months. Never
// includes a future month. `now` is injected so this stays a pure, testable
// function.
export const getMonthOptions = (now: Date = new Date()): MonthOption[] => {
  const year = Number(formatInTimeZone(now, SINGAPORE_TIME_ZONE, "yyyy"))
  const monthIndex =
    Number(formatInTimeZone(now, SINGAPORE_TIME_ZONE, "MM")) - 1

  return Array.from({ length: MONTHS_OF_HISTORY + 1 }, (_, offset) => {
    // Construct each month from the Singapore-anchored year/month so the
    // label and value never drift across a UTC day boundary.
    const date = new Date(Date.UTC(year, monthIndex - offset, 1, 0, 0, 0))
    return { value: toMonthValue(date), label: toMonthLabel(date) }
  })
}
