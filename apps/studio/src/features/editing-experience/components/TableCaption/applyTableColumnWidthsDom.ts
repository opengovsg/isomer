import {
  columnWidthsToPxStrings,
  tableWidthPxFromColumnWidths,
} from "@opengovsg/isomer-components"

/** Imperative colgroup + table width for the TipTap table node view. */
export const applyTableColumnWidthsDom = (
  table: HTMLTableElement,
  widths: number[] | null,
): void => {
  const existing = table.querySelector(":scope > colgroup")
  if (!widths) {
    existing?.remove()
    table.style.width = ""
    return
  }

  const group =
    existing instanceof HTMLElement
      ? existing
      : document.createElement("colgroup")
  group.replaceChildren(
    ...columnWidthsToPxStrings(widths).map((width) => {
      const col = document.createElement("col")
      col.style.width = width
      return col
    }),
  )
  if (!existing) table.insertBefore(group, table.firstChild)
  table.style.width = tableWidthPxFromColumnWidths(widths)
}
