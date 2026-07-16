import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import type { EditorView, NodeView } from "@tiptap/pm/view"

import {
  getColumnWidthsFromRow,
  MIN_COLUMN_WIDTH_PX,
  redistributeOnResize,
} from "./tableColumnWidths"

interface RowCellInfo {
  colspan: number
  colwidth: number | null
}

const getFirstRowCells = (node: ProseMirrorNode): RowCellInfo[] => {
  const firstRow = node.firstChild
  if (!firstRow) {
    return []
  }
  const cells: RowCellInfo[] = []
  firstRow.forEach((cell) => {
    cells.push({
      colspan: cell.attrs.colspan as number,
      colwidth: cell.attrs.colwidth as number | null,
    })
  })
  return cells
}

// Replaces TipTap's stock TableView (see @tiptap/extension-table/src/table/TableView.ts)
// because that view's colgroup rendering hardcodes every column width as `${px}px` with
// no unit override hook, which can't represent this feature's percentage-of-table model
// at all. This view renders the same colgroup/tbody DOM shape, but computes widths as
// percentages and owns the resize-drag interaction directly, rather than reusing
// prosemirror-tables' own columnResizing plugin (whose live-drag preview is DOM-only,
// per-column, and grows/shrinks the table -- not what's needed here either).
export class IsomerTableView implements NodeView {
  node: ProseMirrorNode
  view: EditorView
  getPos: () => number | undefined
  dom: HTMLDivElement
  table: HTMLTableElement
  colgroup: HTMLTableColElement
  contentDOM: HTMLTableSectionElement
  handleContainer: HTMLDivElement
  private stopDrag: (() => void) | null = null

  constructor(
    node: ProseMirrorNode,
    view: EditorView,
    getPos: () => number | undefined,
    HTMLAttributes: Record<string, unknown> = {},
  ) {
    this.node = node
    this.view = view
    this.getPos = getPos

    this.dom = document.createElement("div")
    this.dom.className = "tableWrapper"
    this.dom.style.position = "relative"

    this.table = this.dom.appendChild(document.createElement("table"))
    Object.entries(HTMLAttributes).forEach(([key, value]) => {
      if (
        typeof value !== "string" &&
        typeof value !== "number" &&
        typeof value !== "boolean"
      ) {
        return
      }
      if (key === "style") {
        this.table.style.cssText = `${value}`
      } else {
        this.table.setAttribute(key, `${value}`)
      }
    })
    if (typeof node.attrs.style === "string") {
      this.table.style.cssText = node.attrs.style
    }
    this.table.style.width = "100%"
    this.table.style.tableLayout = "fixed"

    this.colgroup = this.table.appendChild(document.createElement("colgroup"))
    this.contentDOM = this.table.appendChild(document.createElement("tbody"))

    this.handleContainer = this.dom.appendChild(document.createElement("div"))
    this.handleContainer.style.position = "absolute"
    this.handleContainer.style.inset = "0"
    this.handleContainer.style.pointerEvents = "none"

    this.render()
  }

  update(node: ProseMirrorNode): boolean {
    if (node.type !== this.node.type) {
      return false
    }
    this.node = node
    this.render()
    return true
  }

  ignoreMutation(mutation: { type: string; target: Node }): boolean {
    const isInsideWrapper = this.dom.contains(mutation.target)
    const isInsideContent = this.contentDOM.contains(mutation.target)
    return isInsideWrapper && !isInsideContent
  }

  destroy() {
    this.stopDrag?.()
  }

  private render() {
    const cells = getFirstRowCells(this.node)
    const widths = getColumnWidthsFromRow(cells)
    this.renderColgroup(cells.length, widths)
    this.renderHandles(widths)
  }

  private renderColgroup(columnCount: number, widths: number[] | null) {
    this.colgroup.innerHTML = ""
    for (let i = 0; i < columnCount; i++) {
      const col = document.createElement("col")
      if (widths) {
        col.style.width = `${widths[i]}%`
      }
      this.colgroup.appendChild(col)
    }
  }

  private renderHandles(widths: number[] | null) {
    this.handleContainer.innerHTML = ""
    if (!widths || widths.length < 2) {
      return
    }

    let cumulative = 0
    for (let i = 0; i < widths.length - 1; i++) {
      cumulative += widths[i] ?? 0
      const handle = document.createElement("div")
      handle.style.position = "absolute"
      handle.style.top = "0"
      handle.style.bottom = "0"
      handle.style.width = "8px"
      handle.style.left = `calc(${cumulative}% - 4px)`
      handle.style.cursor = "col-resize"
      handle.style.pointerEvents = "auto"
      handle.addEventListener("pointerdown", (event) => {
        this.startDrag(event, i)
      })
      this.handleContainer.appendChild(handle)
    }
  }

  private startDrag(event: PointerEvent, columnIndex: number) {
    if (!this.view.editable || this.stopDrag) {
      return
    }

    const startWidths = getColumnWidthsFromRow(getFirstRowCells(this.node))
    if (!startWidths) {
      return
    }

    const tableWidthPx = this.table.getBoundingClientRect().width
    if (tableWidthPx <= 0) {
      return
    }

    event.preventDefault()

    const minPercent = (MIN_COLUMN_WIDTH_PX / tableWidthPx) * 100
    const startX = event.clientX
    const win = this.view.dom.ownerDocument.defaultView ?? window

    const computeWidths = (moveEvent: PointerEvent) =>
      redistributeOnResize({
        widths: startWidths,
        columnIndex,
        deltaPercent: ((moveEvent.clientX - startX) / tableWidthPx) * 100,
        minPercent,
      })

    const onPointerMove = (moveEvent: PointerEvent) => {
      const widths = computeWidths(moveEvent)
      this.renderColgroup(widths.length, widths)
      this.renderHandles(widths)
    }

    const onPointerUp = (upEvent: PointerEvent) => {
      win.removeEventListener("pointermove", onPointerMove)
      win.removeEventListener("pointerup", onPointerUp)
      this.stopDrag = null
      this.commitWidths(computeWidths(upEvent))
    }

    win.addEventListener("pointermove", onPointerMove)
    win.addEventListener("pointerup", onPointerUp)
    this.stopDrag = () => {
      win.removeEventListener("pointermove", onPointerMove)
      win.removeEventListener("pointerup", onPointerUp)
    }
  }

  private commitWidths(widths: number[]) {
    const tablePos = this.getPos()
    if (tablePos == null) {
      return
    }
    const row = this.node.firstChild
    if (!row) {
      return
    }

    const tr = this.view.state.tr
    let cellPos = tablePos + 2 // +1 into table content (row start), +1 into row content (first cell)
    let index = 0
    row.forEach((cell) => {
      tr.setNodeMarkup(cellPos, null, {
        ...cell.attrs,
        colwidth: widths[index] ?? null,
      })
      cellPos += cell.nodeSize
      index += 1
    })
    this.view.dispatch(tr)
  }
}
