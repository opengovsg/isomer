export const TABLE_CONTAINER_WIDTH_PX = 800

export const getCellWidths = (table: HTMLTableElement, rowIndex: number) =>
  [...(table.rows[rowIndex]?.cells ?? [])].map(
    (cell) => cell.getBoundingClientRect().width,
  )

export const getTableWidth = (table: HTMLTableElement) =>
  table.getBoundingClientRect().width
