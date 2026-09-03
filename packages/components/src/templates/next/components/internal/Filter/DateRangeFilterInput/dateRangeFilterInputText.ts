import { parseDate } from "@internationalized/date"

export interface DateRangeFilterValue {
  start: string
  end: string
}

// yyyy-MM-dd -> DD/MM/YYYY
const toDisplayDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-")
  return `${day}/${month}/${year}`
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

const parseSingleDisplayDate = (displayDate: string): string | undefined => {
  const match = displayDate.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) {
    return undefined
  }

  const [, day, month, year] = match
  const isoDate = `${year}-${month}-${day}`

  try {
    parseDate(isoDate)
    return isoDate
  } catch {
    return undefined
  }
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
    const isoDate = parseSingleDisplayDate(firstPart)
    return isoDate ? { start: isoDate, end: isoDate } : null
  }

  if (rangeParts.length === 2) {
    const startPart = rangeParts[0]
    const endPart = rangeParts[1]
    if (!startPart || !endPart) {
      return null
    }
    const start = parseSingleDisplayDate(startPart)
    const end = parseSingleDisplayDate(endPart)
    if (!start || !end) {
      return null
    }
    return start <= end ? { start, end } : { start: end, end: start }
  }

  return null
}
