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

// What the user may ask for. `Both` is UX vocabulary only — the service
// fans it out into two AuditLogExportRequest rows (Access + Activity);
// the DB enum has no Both member.
export const AuditLogExportRequestedReportType = {
  ...AuditLogExportReportType,
  Both: "Both",
} as const
export type AuditLogExportRequestedReportType =
  (typeof AuditLogExportRequestedReportType)[keyof typeof AuditLogExportRequestedReportType]

// A calendar month in ISO `yyyy-MM` form, e.g. "2026-03". This is the shape
// every month value in the audit-export flow is passed around in (picker →
// zod input → service → query layer), so it gets a real type rather than a
// bare `string`. The month segment is a closed union because TypeScript's
// `${number}` does not match zero-padded strings like "03".
type IsoMonthSegment =
  | "01"
  | "02"
  | "03"
  | "04"
  | "05"
  | "06"
  | "07"
  | "08"
  | "09"
  | "10"
  | "11"
  | "12"
type YearPrefix = "2"
type YearSuffix = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
type IsoYear = `${YearPrefix}${YearSuffix}${YearSuffix}${YearSuffix}`
export type IsoMonth = `${IsoYear}-${IsoMonthSegment}`

// Matches a calendar month like "2026-03" — the runtime counterpart of
// `IsoMonth`, used where values cross from untyped input into the type.
const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/

// The export window: a Site Admin may request the current Singapore-time month
// plus the 11 months before it (12 months inclusive of the current month).
// This schema enforces the window directly (so both the client form and the
// server's input validation reject out-of-window months); the service keeps an
// equivalent guard as defense-in-depth, and the month picker derives its range
// from the same constant — one source of truth across all three.
export const AUDIT_LOG_EXPORT_MAX_MONTHS = 12

// Given the current calendar month, return the earliest month still
// exportable under the window. Pure: the caller passes in the current month
// rather than reading the clock here.
export const getEarliestExportableMonth = (
  currentMonth: IsoMonth,
): IsoMonth => {
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
  // The "yyyy-MM" token always yields a zero-padded month, so the cast is
  // sound; date-fns just types `format` as returning plain `string`.
  return format(earliest, "yyyy-MM") as IsoMonth
}

// The current calendar month in Singapore time as "yyyy-MM". SGT is UTC+8 all
// year (no DST); we format in that zone explicitly so the window check is
// correct wherever this runs — the server in any timezone, or the user's
// browser. We use date-fns-tz's explicit "yyyy-MM" token rather than an
// Intl locale trick (e.g. "en-CA"), which depends on ICU locale data and can
// silently format differently on minimal-ICU runtimes.
export const getCurrentSingaporeMonth = (): IsoMonth =>
  // Same reasoning as above: "yyyy-MM" always zero-pads, so the cast is sound.
  formatInTimeZone(new Date(), SINGAPORE_TIME_ZONE, "yyyy-MM") as IsoMonth

export const createAuditLogExportRequestSchema = z.object({
  // Accept a real number or a numeric form string (a native input yields e.g.
  // "1"), then convert to the numeric site ID the database and service contract
  // use. The union guards against JS numeric coercion quirks — a bare
  // z.coerce.number() would turn non-ID values like true or [1] into 1.
  siteId: z
    .union([z.number(), z.string().regex(/^\d+$/)])
    .transform(Number)
    .pipe(
      z
        .number()
        .int({ message: "Select a valid site" })
        .positive({ message: "Select a valid site" }),
    ),
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
    )
    // The regex above guarantees the shape at runtime; narrow the inferred
    // output from `string` to `IsoMonth` so consumers get the real type.
    .transform((month) => month as IsoMonth),
  reportType: z.enum(AuditLogExportRequestedReportType, {
    message: "Select a report type",
  }),
})

export type CreateAuditLogExportRequestInput = z.infer<
  typeof createAuditLogExportRequestSchema
>
