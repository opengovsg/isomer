/* oxlint-disable jsdoc/require-returns-description -- core cleanup deferred */
import { isSameDay } from "date-fns"

/**
 * if the date provided is equal to the earliestSchedule's date, the earliest allowable time should be set to the FIRST
 * time slot after the current minimum allowable time
 * @param selectedDate Date selected inside the datepicker
 * @param earliestSchedule Earliest schedule time, based on the current date and MINIMUM_SCHEDULE_LEAD_TIME_MINUTES
 // oxlint-disable-next-line jsdoc/require-returns-description -- core cleanup deferred
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
