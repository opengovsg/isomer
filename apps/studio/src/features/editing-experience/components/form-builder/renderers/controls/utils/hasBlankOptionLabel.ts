import { indicesWithBlankLabels } from "./indicesWithBlankLabels"

/** True when any item has a missing/blank/whitespace-only `label`. */
export function hasBlankOptionLabel(
  items: { label?: string }[] | undefined,
): boolean {
  return indicesWithBlankLabels(items).size > 0
}
