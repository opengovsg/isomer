export const hasNonEmptyString = (
  value: string | null | undefined,
): value is string => value !== undefined && value !== null && value !== ""

export const isNullableBooleanTrue = (
  value: boolean | null | undefined,
): value is true => value === true

export const isDefinedNumber = (
  value: number | null | undefined,
): value is number => value !== undefined && value !== null

export const isNonEmptyArray = <T>(
  value: readonly T[] | null | undefined,
): value is readonly [T, ...T[]] =>
  value !== undefined && value !== null && value.length > 0
