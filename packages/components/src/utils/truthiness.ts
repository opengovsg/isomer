export const hasNonEmptyString = (
  value: string | null | undefined,
): value is string =>
  value !== undefined && value !== null && value !== ""

export const isNullableBooleanTrue = (
  value: boolean | null | undefined,
): value is true => value === true

export const isDefinedNumber = (
  value: number | null | undefined,
): value is number => value !== undefined && value !== null
