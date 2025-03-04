import {
  format,
  formatDistanceToNow,
  isWithinInterval,
  subDays,
} from "date-fns"

export const formatDate = (date: Date) => {
  const now = new Date()

  const isRecent = isWithinInterval(date, {
    start: subDays(now, 7),
    end: now,
  })

  if (isRecent) {
    return formatDistanceToNow(date, { addSuffix: true })
  }

  return format(date, "MMM d, yyyy")
}
