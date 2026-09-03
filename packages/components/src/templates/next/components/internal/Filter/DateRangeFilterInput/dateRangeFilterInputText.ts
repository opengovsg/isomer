import { format, isMatch, isValid, parse } from "date-fns"

export interface DateRangeFilterValue {
  start: string
  end: string
}

const DISPLAY_FORMAT = "dd/MM/yyyy"
const ISO_FORMAT = "yyyy-MM-dd"

const toDisplayDate = (isoDate: string): string =>
  format(parse(isoDate, ISO_FORMAT, new Date()), DISPLAY_FORMAT)

const toIsoDate = (displayDate: string): string | undefined => {
  const trimmed = displayDate.trim()
  if (!isMatch(trimmed, DISPLAY_FORMAT)) {
    return undefined
  }

  const parsed = parse(trimmed, DISPLAY_FORMAT, new Date())
  if (!isValid(parsed)) {
    return undefined
  }

  return format(parsed, ISO_FORMAT)
}

const formatDisplayRange = (startIso: string, endIso: string): string =>
  `${toDisplayDate(startIso)} - ${toDisplayDate(endIso)}`

// Split on the range separator (" - ") with optional surrounding whitespace.
// The hyphen is not inside a character class, so it won't match slashes in DD/MM/YYYY.
const splitRangeParts = (text: string): string[] => text.split(/\s*-\s*/)

const singleDayRange = (isoDate: string): DateRangeFilterValue => ({
  start: isoDate,
  end: isoDate,
})

const normalizeRangeOrder = (
  start: string,
  end: string,
): DateRangeFilterValue =>
  start <= end ? { start, end } : { start: end, end: start }

const parseSingleDisplayDate = (
  displayDate: string,
): DateRangeFilterValue | null => {
  const isoDate = toIsoDate(displayDate)
  return isoDate ? singleDayRange(isoDate) : null
}

const parseDisplayDateRange = (
  startPart: string,
  endPart: string,
): DateRangeFilterValue | null => {
  const start = toIsoDate(startPart)
  const end = toIsoDate(endPart)
  if (!start || !end) {
    return null
  }
  return normalizeRangeOrder(start, end)
}

export const valueToInputText = (
  value: DateRangeFilterValue | undefined,
): string => {
  if (!value) {
    return ""
  }

  if (value.start === value.end) {
    return toDisplayDate(value.start)
  }

  return formatDisplayRange(value.start, value.end)
}

export const parseInputText = (
  text: string,
): DateRangeFilterValue | undefined | null => {
  const trimmed = text.trim()
  if (!trimmed) {
    return undefined
  }

  const rangeParts = splitRangeParts(trimmed)

  if (rangeParts.length === 1) {
    const displayDate = rangeParts[0]
    return displayDate ? parseSingleDisplayDate(displayDate) : null
  }

  if (rangeParts.length === 2) {
    const startPart = rangeParts[0]
    const endPart = rangeParts[1]
    if (!startPart || !endPart) {
      return null
    }
    return parseDisplayDateRange(startPart, endPart)
  }

  return null
}
