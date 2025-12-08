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
 * https://github.com/tc39/proposal-temporal/issues/2257#issuecomment-1152070209
 * @returns The timezone abbreviation or a fallback GMT offset string.
 */
export const getTimezoneAbbreviation = (format: "short" | "long" = "short") => {
  return new Intl.DateTimeFormat("en", {
    timeZoneName: format,
  })
    .formatToParts(new Date())
    .find((part) => part.type === "timeZoneName")?.value
}
