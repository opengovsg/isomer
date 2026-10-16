import { format } from "date-fns/format"

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

export const formatScheduledAtDate = (d: Date, includeTimezone = true) => {
  const formatStr = `dd/MM/yyyy, hh:mma`
  return includeTimezone
    ? `${format(d, formatStr)} (${getTimezoneAbbreviation()})`
    : format(d, formatStr)
}
