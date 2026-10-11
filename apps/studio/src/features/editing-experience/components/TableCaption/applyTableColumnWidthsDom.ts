import {
  columnWidthsToPxStrings,
  tableWidthPxFromColumnWidths,
} from "@opengovsg/isomer-components"

export interface UnsizedTableLayout {
  hasPhantomColumns: boolean
  columnCount: number
}

const columnGroup = (table: HTMLTableElement): HTMLElement => {
  const existing = table.querySelector(":scope > colgroup")
  if (existing instanceof HTMLElement) return existing
  const group = document.createElement("colgroup")
  table.insertBefore(group, table.firstChild)
  return group
}

const fillColumnGroup = (group: HTMLElement, widths: string[]) => {
  group.replaceChildren(
    ...widths.map((width) => {
      const col = document.createElement("col")
      col.style.width = width
      return col
    }),
  )
}

/**
 * Imperative colgroup + table width for the TipTap table node view.
 * Unsized tables follow the preview: automatic layout, or equal percentage
 * tracks when a phantom column would collapse.
 */
export const applyTableColumnWidthsDom = (
  table: HTMLTableElement,
  widths: number[] | null,
  unsized: UnsizedTableLayout | null = null,
): void => {
  if (!widths) {
    table.style.width = ""
    if (unsized?.hasPhantomColumns && unsized.columnCount > 0) {
      const percent = `${100 / unsized.columnCount}%`
      fillColumnGroup(
        columnGroup(table),
        Array.from({ length: unsized.columnCount }, () => percent),
      )
      table.dataset.tableLayout = "even"
      return
    }
    table.querySelector(":scope > colgroup")?.remove()
    table.dataset.tableLayout = "auto"
    return
  }

  delete table.dataset.tableLayout
  fillColumnGroup(columnGroup(table), columnWidthsToPxStrings(widths))
  table.style.width = tableWidthPxFromColumnWidths(widths)
}
