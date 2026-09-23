import { format, isValid, parse } from "date-fns"

// Stored calendar dates on page content. Same shape as an article `date`
// (`dd/MM/yyyy`). URL date-range filters stay `yyyy-MM-dd` because the
// sidebar uses `<input type="date">`.
export const STORED_DATE_FORMAT = "dd/MM/yyyy"

const ISO_DATE_FORMAT = "yyyy-MM-dd"

export const parseStoredDate = (value: string): Date | undefined => {
  const parsed = parse(value, STORED_DATE_FORMAT, new Date())
  if (!isValid(parsed) || format(parsed, STORED_DATE_FORMAT) !== value) {
    return undefined
  }

  return parsed
}

export const formatStoredDate = (date: Date): string =>
  format(date, STORED_DATE_FORMAT)

// Comparable `yyyy-MM-dd` for ordering against Singapore "today" and URL ranges.
export const storedDateToIso = (value: string): string | undefined => {
  const parsed = parseStoredDate(value)
  if (!parsed) {
    return undefined
  }

  return format(parsed, ISO_DATE_FORMAT)
}
