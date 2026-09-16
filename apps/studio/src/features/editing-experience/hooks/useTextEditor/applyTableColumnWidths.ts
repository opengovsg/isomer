export const applyColumnWidths = (
  table: HTMLTableElement,
  columnWidths: number[],
) => {
  table.style.width = "100%"
  table.style.tableLayout = "fixed"

  let colgroup = table.querySelector("colgroup")
  if (!colgroup) {
    colgroup = document.createElement("colgroup")
    table.prepend(colgroup)
  }

  const cols = colgroup.children
  if (cols.length !== columnWidths.length) {
    colgroup.replaceChildren(
      ...columnWidths.map((width) => {
        const col = document.createElement("col")
        col.style.width = `${width}%`
        return col
      }),
    )
    return
  }

  columnWidths.forEach((width, index) => {
    const col = cols.item(index)
    if (col instanceof HTMLElement) {
      col.style.width = `${width}%`
    }
  })
}
