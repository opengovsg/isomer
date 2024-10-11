import { isMatch, parse } from "date-fns"

const SUPPORTED_DATE_FORMATS = [
  "dd/MM/yyyy",
  "d MMM yyyy",
  "d MMMM yyyy",
  "dd MMM yyyy",
  "dd MMMM yyyy",
  "yyyy-MM-dd",
  "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
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
          return parse(dateString, format, new Date())
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
