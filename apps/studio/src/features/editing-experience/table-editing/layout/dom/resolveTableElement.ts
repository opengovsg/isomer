import type { RefObject } from "react"

export const resolveTableElement = (
  overlayRoot: HTMLDivElement | null,
  tableRef: RefObject<HTMLTableElement | null>,
): HTMLTableElement | null => {
  const sibling = overlayRoot?.previousElementSibling
  return sibling instanceof HTMLTableElement ? sibling : tableRef.current
}
