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
            const localTimezoneOffsetInSeconds =
              new Date().getTimezoneOffset() * 60 * 1000

            offsetDate = new Date(
              new Date(dateString).getTime() - localTimezoneOffsetInSeconds,
            ).toISOString()
          }
          return parse(offsetDate, format, new Date())
        }
      } catch {
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
