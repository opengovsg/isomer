import { format, isSameDay } from "date-fns"

/**
 * if the date provided is equal to the earliestSchedule's date, the earliest allowable time should be set to the FIRST
 * time slot after the current minimum allowable time
 * @param selectedDate Date selected inside the datepicker
 * @param earliestSchedule Earliest schedule time, based on the current date and MINIMUM_SCHEDULE_LEAD_TIME_MINUTES
 * @returns
 */
export const getEarliestAllowableTime = (
  selectedDate: Date,
  earliestSchedule: Date,
): Date | null => {
  if (isSameDay(selectedDate, earliestSchedule)) {
    return earliestSchedule
  }
  return null
}

export const formatScheduledAtDate = (d: Date) =>
  `${format(d, `dd/MM/yyyy, hh:mma`)} (${getTimezoneAbbreviation()})`

/**
 * Get the timezone abbreviation for the current locale and date.
 * @returns The timezone abbreviation or a fallback GMT offset string.
 */
export const getTimezoneAbbreviation = (format: "short" | "long" = "short") => {
  const date = new Date()

  // Get abbreviation, if available. Some might return GMT+08:00 format
  // https://github.com/tc39/proposal-temporal/issues/2257#issuecomment-1152070209
  const abbr = new Intl.DateTimeFormat("en", {
    timeZoneName: format,
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")

  // Get numeric offset (e.g., "+08:00") as a fallback
  const offset = -date.getTimezoneOffset() // in minutes
  const sign = offset >= 0 ? "+" : "-"
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0")
  const mins = String(Math.abs(offset) % 60).padStart(2, "0")

  return abbr ? abbr.value : `GMT${sign}${hours}:${mins}`
}
