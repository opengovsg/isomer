export const SINGLE_DATE_MASK = "DD/MM/YYYY"
export const MAX_DATE_RANGE_DIGITS = 16

// Index in SINGLE_DATE_MASK immediately after each digit slot (1-based digit count).
const MASK_INDEX_AFTER_DIGIT = [1, 2, 4, 5, 7, 8, 9, 10]

export const extractDateDigits = (text: string): string =>
  text.replace(/\D/g, "")

const formatSingleDateDigits = (digits: string): string => {
  const day = digits.slice(0, 2)
  const month = digits.slice(2, 4)
  const year = digits.slice(4, 8)

  if (digits.length <= 2) {
    return day
  }
  if (digits.length <= 4) {
    return `${day}/${month}`
  }
  return `${day}/${month}/${year}`
}

export const formatDateRangeInputDigits = (digits: string): string => {
  const capped = digits.slice(0, MAX_DATE_RANGE_DIGITS)
  const firstDateDigits = capped.slice(0, 8)
  const secondDateDigits = capped.slice(8)

  const firstDate = formatSingleDateDigits(firstDateDigits)
  if (secondDateDigits.length === 0) {
    return firstDate
  }

  return `${firstDate} - ${formatSingleDateDigits(secondDateDigits)}`
}

const getSingleDateGhostSuffix = (digitCount: number): string => {
  if (digitCount <= 0) {
    return SINGLE_DATE_MASK
  }
  if (digitCount >= 8) {
    return ""
  }
  return SINGLE_DATE_MASK.slice(MASK_INDEX_AFTER_DIGIT[digitCount - 1]!)
}

export const getDateRangeInputGhostSuffix = (
  formattedValue: string,
): string => {
  const digitCount = extractDateDigits(formattedValue).length
  if (digitCount <= 8) {
    return getSingleDateGhostSuffix(digitCount)
  }

  const secondDateDigitCount = digitCount - 8
  return getSingleDateGhostSuffix(secondDateDigitCount)
}

export const cursorPositionAfterDigitIndex = (
  formatted: string,
  digitIndex: number,
): number => {
  if (digitIndex <= 0) {
    return 0
  }

  let digitsSeen = 0
  for (let index = 0; index < formatted.length; index++) {
    const character = formatted[index]
    if (character !== undefined && /\d/.test(character)) {
      digitsSeen++
      if (digitsSeen === digitIndex) {
        return index + 1
      }
    }
  }

  return formatted.length
}

export const formatDateRangeInputChange = (
  rawValue: string,
  selectionStart: number,
): { formattedValue: string; selectionStart: number } => {
  const digitsBeforeCursor = extractDateDigits(
    rawValue.slice(0, selectionStart),
  ).length
  const digits = extractDateDigits(rawValue).slice(0, MAX_DATE_RANGE_DIGITS)
  const formattedValue = formatDateRangeInputDigits(digits)

  return {
    formattedValue,
    selectionStart: cursorPositionAfterDigitIndex(
      formattedValue,
      digitsBeforeCursor,
    ),
  }
}
