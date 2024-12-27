import { isMatch, parse } from "date-fns"

const TIMEZONE_DATE_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
const SUPPORTED_DATE_FORMATS = [
  "dd/MM/yyyy",
  "d MMM yyyy",
  "d MMMM yyyy",
  "dd MMM yyyy",
  "dd MMMM yyyy",
  "yyyy-MM-dd",
  TIMEZONE_DATE_FORMAT,
]

export const getParsedDate = (dateString: string) => {
  const parsedDate = SUPPORTED_DATE_FORMATS.reduce<Date | undefined>(
    (acc, format) => {
      if (acc) {
        // Date has already been parsed by an earlier format
        return acc
      }

      try {
        if (isMatch(dateString, format)) {
          let offsetDate = dateString
          if (format === TIMEZONE_DATE_FORMAT) {
            offsetDate = new Date(
              // Add 8 hours to account for the Singapore timezone offset
              new Date(dateString).getTime() + 8 * 60 * 60 * 1000,
            ).toISOString()
          }
          return parse(offsetDate, format, new Date())
        }
      } catch (e) {
        return new Date()
      }

      return acc
    },
    undefined,
  )

  if (parsedDate) {
    return parsedDate
  }

  return new Date()
}
