import {
  hasNonEmptyString,
  isDefinedNumber,
  isNullableBooleanTrue,
  isNonEmptyArray,
} from "~/utils/truthiness"
/** Indices of items whose `label` is missing/blank/whitespace-only. */
export const indicesWithBlankLabels = (
  items: { label?: string }[] | undefined,
): Set<number> => {
  if (!isDefinedNumber(items?.length)) {
    return new Set()
  }
  return new Set(
    items.flatMap((item, index) =>
      hasNonEmptyString(item.label?.trim()) ? [] : [index],
    ),
  )
}
