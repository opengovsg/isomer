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
  let parsedDate: Date | undefined

  for (const format of SUPPORTED_DATE_FORMATS) {
    if (parsedDate !== undefined) {
      break
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
        parsedDate = parse(offsetDate, format, new Date())
      }
    } catch {
      parsedDate = new Date()
    }
  }

  if (parsedDate !== undefined) {
    return parsedDate
  }

  return new Date()
}
