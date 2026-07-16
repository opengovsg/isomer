import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import type { EditorView, NodeView } from "@tiptap/pm/view"
import { TableMap } from "@tiptap/pm/tables"

import {
  MIN_COLUMN_WIDTH_PX,
  redistributeOnResize,
  resolveColumnWidths,
} from "./tableColumnWidths"

const getColumnCount = (node: ProseMirrorNode): number =>
  node.firstChild ? TableMap.get(node).width : 0

// Replaces TipTap's stock TableView (see @tiptap/extension-table/src/table/TableView.ts)
// because that view's colgroup rendering hardcodes every column width as `${px}px` with
// no unit override hook, which can't represent this feature's percentage-of-table model
// at all. This view renders the same colgroup/tbody DOM shape, but computes widths as
// percentages (stored on the table node's own `colwidths` attribute, one entry per
// column) and owns the resize-drag interaction directly, rather than reusing
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
    const columnCount = getColumnCount(this.node)
    const widths = resolveColumnWidths(this.node.attrs.colwidths, columnCount)
    this.renderColgroup(widths)
    this.renderHandles(widths)
  }

  private renderColgroup(widths: number[]) {
    this.colgroup.innerHTML = ""
    widths.forEach((width) => {
      const col = document.createElement("col")
      col.style.width = `${width}%`
      this.colgroup.appendChild(col)
    })
  }

  private renderHandles(widths: number[]) {
    this.handleContainer.innerHTML = ""
    if (widths.length < 2) {
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
      handle.dataset.testid = "isomer-table-resize-handle"
      handle.dataset.columnIndex = String(i)
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

    const columnCount = getColumnCount(this.node)
    const startWidths = resolveColumnWidths(
      this.node.attrs.colwidths,
      columnCount,
    )

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
      this.renderColgroup(widths)
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
    const tr = this.view.state.tr.setNodeMarkup(tablePos, null, {
      ...this.node.attrs,
      colwidths: widths,
    })
    this.view.dispatch(tr)
  }
}
