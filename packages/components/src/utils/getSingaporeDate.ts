import { format } from "date-fns"

export const SINGAPORE_TIME_ZONE = "Asia/Singapore"

// Singapore is fixed UTC+8 with no DST — safe to shift without date-fns-tz.
const SINGAPORE_UTC_OFFSET_MS = 8 * 60 * 60 * 1000

const toSingaporeLocalDate = (date: Date): Date => {
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60_000
  return new Date(utcMs + SINGAPORE_UTC_OFFSET_MS)
}

// Canonical "yyyy-MM-dd" in Asia/Singapore for comparison/sorting — not for display.
// Uses date-fns with a fixed offset instead of an Intl locale trick (en-CA) so output
// stays deterministic on minimal-ICU runtimes.
export const getSingaporeDateYYYYMMDD = (date = new Date()): string =>
  format(toSingaporeLocalDate(date), "yyyy-MM-dd")

// Human-readable date for display — locale formatting is appropriate here.
export const getSingaporeDateLong = (date = new Date()): string =>
  new Intl.DateTimeFormat("en-SG", {
    timeZone: SINGAPORE_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
