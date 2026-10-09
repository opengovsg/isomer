/**
 * Paints one preview-iframe table while a column resize handle is dragged.
 * The editor document is left alone until release, so the drag does not
 * rebuild the table node view on every move.
 */

interface PreviewCellStyle {
  cell: HTMLElement
  maxWidth: string
}

interface PreviewColumnSnapshot {
  width: string
  tableLayout: string
  colgroupHTML: string | null
  cells: PreviewCellStyle[]
}

interface PreviewColumnSession {
  table: HTMLTableElement
  view: Window
  frame: number
  pending: number[] | null
  prepared: boolean
  snapshot: PreviewColumnSnapshot
}

let previewRoot: ParentNode | null = null
let pageContent: readonly unknown[] = []
let activeBlock = 0
let session: PreviewColumnSession | null = null

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const childNodes = (value: unknown): readonly unknown[] | null => {
  const list = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.content)
      ? value.content
      : null
  if (!list) return null
  const nodes: unknown[] = []
  for (const node of list) nodes.push(node)
  return nodes
}

/** Tables rendered by page blocks before the one currently being edited. */
export const tablesBeforeBlock = (
  content: readonly unknown[],
  activeIndex: number,
): number => {
  let count = 0
  const end = Math.min(Math.max(activeIndex, 0), content.length)
  for (let index = 0; index < end; index += 1) {
    const block = content[index]
    if (!isRecord(block)) continue
    const prose =
      block.type === "accordion"
        ? childNodes(block.details)
        : childNodes(block.content)
    if (!prose) continue
    for (const node of prose) {
      if (isRecord(node) && node.type === "table") count += 1
    }
  }
  return count
}

export const setColumnWidthPreviewTarget = (
  content: readonly unknown[],
  activeIndex: number,
): void => {
  pageContent = content
  activeBlock = activeIndex
}

export const bindColumnWidthPreviewRoot = (next: ParentNode | null): void => {
  if (previewRoot === next) return
  endPreviewColumnWidthPaint("cancel")
  previewRoot = next
}

const previewTable = (index: number): HTMLTableElement | null => {
  if (!previewRoot || index < 0) return null
  const table = previewRoot.querySelectorAll("table")[index]
  if (!table || table.tagName !== "TABLE") return null
  return table
}

const applyPreviewColumnWidths = (
  current: PreviewColumnSession,
  widths: number[],
) => {
  const { table } = current
  const doc = table.ownerDocument
  let group = table.querySelector(":scope > colgroup")
  if (!group) {
    group = doc.createElement("colgroup")
    table.insertBefore(group, table.firstChild)
  }
  while (group.children.length < widths.length) {
    group.appendChild(doc.createElement("col"))
  }
  while (group.children.length > widths.length) {
    group.lastElementChild?.remove()
  }
  let sum = 0
  for (let index = 0; index < widths.length; index += 1) {
    const width = widths[index] ?? 0
    sum += width
    const col = group.children[index]
    if (col) (col as HTMLElement).style.width = `${width}px`
  }
  table.style.width = `${sum}px`
  if (current.prepared) return
  current.prepared = true
  table.style.tableLayout = "fixed"
  for (const { cell } of current.snapshot.cells) {
    cell.style.maxWidth = "none"
  }
}

const restorePreviewColumnWidths = (current: PreviewColumnSession) => {
  const { table, snapshot } = current
  table.style.width = snapshot.width
  table.style.tableLayout = snapshot.tableLayout
  const group = table.querySelector(":scope > colgroup")
  if (snapshot.colgroupHTML === null) {
    group?.remove()
  } else if (group) {
    group.innerHTML = snapshot.colgroupHTML
  }
  for (const { cell, maxWidth } of snapshot.cells) {
    cell.style.maxWidth = maxWidth
  }
}

export const beginPreviewColumnWidthPaint = (indexInBlock: number): void => {
  endPreviewColumnWidthPaint("cancel")
  const table = previewTable(
    tablesBeforeBlock(pageContent, activeBlock) + indexInBlock,
  )
  if (!table) return
  const group = table.querySelector(":scope > colgroup")
  const cells: PreviewCellStyle[] = []
  for (const cell of table.querySelectorAll("th, td")) {
    const htmlCell = cell as HTMLElement
    cells.push({ cell: htmlCell, maxWidth: htmlCell.style.maxWidth })
  }
  session = {
    table,
    view: table.ownerDocument.defaultView ?? window,
    frame: 0,
    pending: null,
    prepared: false,
    snapshot: {
      width: table.style.width,
      tableLayout: table.style.tableLayout,
      colgroupHTML: group ? group.innerHTML : null,
      cells,
    },
  }
}

export const schedulePreviewColumnWidthPaint = (widths: number[]): void => {
  const current = session
  if (!current) return
  current.pending = widths
  if (!current.prepared) {
    applyPreviewColumnWidths(current, widths)
    return
  }
  if (current.frame) return
  current.frame = current.view.requestAnimationFrame(() => {
    const live = session
    if (!live) return
    live.frame = 0
    const next = live.pending
    if (!next) return
    applyPreviewColumnWidths(live, next)
  })
}

export const endPreviewColumnWidthPaint = (mode: "commit" | "cancel"): void => {
  const current = session
  if (!current) return
  session = null
  if (current.frame) current.view.cancelAnimationFrame(current.frame)
  if (mode === "cancel") restorePreviewColumnWidths(current)
}
