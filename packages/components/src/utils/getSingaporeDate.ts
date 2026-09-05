import { format } from "date-fns"

export const SINGAPORE_TIME_ZONE = "Asia/Singapore"

// SGT is UTC+8 year-round.
const SINGAPORE_UTC_OFFSET_MS = 8 * 60 * 60 * 1000

const toSingaporeLocalDate = (date: Date): Date => {
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60_000
  return new Date(utcMs + SINGAPORE_UTC_OFFSET_MS)
}

// yyyy-MM-dd in SGT for string compare. date-fns + offset, not en-CA Intl.
export const getSingaporeDateYYYYMMDD = (date = new Date()): string =>
  format(toSingaporeLocalDate(date), "yyyy-MM-dd")

// Display only.
export const getSingaporeDateLong = (date = new Date()): string =>
  new Intl.DateTimeFormat("en-SG", {
    timeZone: SINGAPORE_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
