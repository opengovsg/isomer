import { isSameDay } from "date-fns"

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
): { hours: number; minutes: number } | null => {
  if (isSameDay(selectedDate, earliestSchedule)) {
    return {
      hours: earliestSchedule.getHours(),
      minutes: earliestSchedule.getMinutes(),
    }
  }
  return null
}
