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

export const valueToInputText = (
  value: DateRangeFilterValue | undefined,
): string => {
  if (!value) {
    return ""
  }

  if (value.start === value.end) {
    return toDisplayDate(value.start)
  }

  return `${toDisplayDate(value.start)} - ${toDisplayDate(value.end)}`
}

export const parseInputText = (
  text: string,
): DateRangeFilterValue | undefined | null => {
  const trimmed = text.trim()
  if (!trimmed) {
    return undefined
  }

  const rangeParts = trimmed.split(/\s*-\s*/)
  if (rangeParts.length === 1) {
    const firstPart = rangeParts[0]
    if (!firstPart) {
      return null
    }
    const isoDate = toIsoDate(firstPart)
    return isoDate ? { start: isoDate, end: isoDate } : null
  }

  if (rangeParts.length === 2) {
    const startPart = rangeParts[0]
    const endPart = rangeParts[1]
    if (!startPart || !endPart) {
      return null
    }
    const start = toIsoDate(startPart)
    const end = toIsoDate(endPart)
    if (!start || !end) {
      return null
    }
    return start <= end ? { start, end } : { start: end, end: start }
  }

  return null
}
