import { differenceInMinutes, format, isToday, isYesterday } from "date-fns"

// Coarse relative time for the "Added" column, matching the design:
// "just now" → "today" → "yesterday" → "12 Sep 2024"
export const formatAddedAt = (date: Date): string => {
  if (differenceInMinutes(new Date(), date) < 5) return "just now"
  if (isToday(date)) return "today"
  if (isYesterday(date)) return "yesterday"
  return format(date, "d MMM yyyy")
}
