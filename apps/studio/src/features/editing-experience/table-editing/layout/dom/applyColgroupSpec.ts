import { buildColgroupSpec } from "@opengovsg/isomer-components"

export const applyColgroupSpec = (
  table: HTMLTableElement,
  columnWidths: number[],
) => {
  const { tableLayout, columnWidths: widthStyles } =
    buildColgroupSpec(columnWidths)

  table.style.width = "100%"
  table.style.tableLayout = tableLayout

  let colgroup = table.querySelector("colgroup")
  if (!colgroup) {
    colgroup = document.createElement("colgroup")
    table.prepend(colgroup)
  }

  const cols = colgroup.children
  if (cols.length !== widthStyles.length) {
    colgroup.replaceChildren(
      ...widthStyles.map((width) => {
        const col = document.createElement("col")
        col.style.width = width
        return col
      }),
    )
    return
  }

  widthStyles.forEach((width, index) => {
    const col = cols.item(index)
    if (col instanceof HTMLElement) {
      col.style.width = width
    }
  })
}
