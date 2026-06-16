/** True when any item has a missing/blank/whitespace-only `label`. */
export function hasBlankOptionLabel(
  items: { label?: string }[] | undefined,
): boolean {
  if (!items?.length) return false
  return items.some((item) => !item.label?.trim())
}
