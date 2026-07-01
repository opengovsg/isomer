import {
  format,
  isAfter,
  isBefore,
  isSameMonth,
  parseISO,
  subMonths,
} from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import { z } from "zod"
import { AuditLogExportReportType } from "~prisma/generated/generatedEnums"

const SINGAPORE_TIME_ZONE = "Asia/Singapore"

// Matches a calendar month like "2026-03".
const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/

// The export window: a Site Admin may request the current Singapore-time month
// plus the 11 months before it (12 months inclusive of the current month).
// This schema enforces the window directly (so both the client form and the
// server's input validation reject out-of-window months); the service keeps an
// equivalent guard as defense-in-depth, and the month picker derives its range
// from the same constant — one source of truth across all three.
export const AUDIT_LOG_EXPORT_MAX_MONTHS = 12

// Given the current calendar month as "yyyy-MM", return the earliest month
// (also "yyyy-MM") still exportable under the window. Pure: the caller passes
// in the current month rather than reading the clock here.
export const getEarliestExportableMonth = (currentMonth: string): string => {
  const [year, month] = currentMonth.split("-").map(Number)
  if (year === undefined || month === undefined) {
    throw new Error(
      `Invalid month, expected "yyyy-MM" but got: ${currentMonth}`,
    )
  }
  // Subtract the window with date-fns, keeping the current month inclusive.
  // Construct and format in the same (local) frame so the resulting calendar
  // month is unaffected by the runtime's zone.
  const earliest = subMonths(
    new Date(year, month - 1, 1),
    AUDIT_LOG_EXPORT_MAX_MONTHS - 1,
  )
  return format(earliest, "yyyy-MM")
}

// The current calendar month in Singapore time as "yyyy-MM". SGT is UTC+8 all
// year (no DST); we format in that zone explicitly so the window check is
// correct wherever this runs — the server in any timezone, or the user's
// browser. We use date-fns-tz's explicit "yyyy-MM" token rather than an
// Intl locale trick (e.g. "en-CA"), which depends on ICU locale data and can
// silently format differently on minimal-ICU runtimes.
export const getCurrentSingaporeMonth = (): string =>
  formatInTimeZone(new Date(), SINGAPORE_TIME_ZONE, "yyyy-MM")

export const createAuditLogExportRequestSchema = z.object({
  siteId: z
    .number()
    .int({ message: "Select a valid site" })
    .positive({ message: "Select a valid site" }),
  month: z
    .string()
    .regex(MONTH_REGEX, {
      message: "Enter a month in the format YYYY-MM, e.g. 2026-03",
    })
    .refine(
      (month) => {
        const parsed = parseISO(`${month}-01`)
        const current = parseISO(`${getCurrentSingaporeMonth()}-01`)
        return isSameMonth(parsed, current) || isBefore(parsed, current)
      },
      {
        message:
          "You cannot export audit logs for a month that is in the future",
      },
    )
    .refine(
      (month) => {
        const parsed = parseISO(`${month}-01`)
        const earliest = parseISO(
          `${getEarliestExportableMonth(getCurrentSingaporeMonth())}-01`,
        )
        return isSameMonth(parsed, earliest) || isAfter(parsed, earliest)
      },
      { message: "You can only export audit logs from the past 12 months" },
    ),
  reportType: z.enum(AuditLogExportReportType, {
    message: "Select a report type",
  }),
})

export type CreateAuditLogExportRequestInput = z.infer<
  typeof createAuditLogExportRequestSchema
>
