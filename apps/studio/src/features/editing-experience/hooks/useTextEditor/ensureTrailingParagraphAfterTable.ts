import type { EditorView } from "@tiptap/pm/view"
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state"

const getContentBounds = (view: EditorView) => {
  const { doc } = view.state
  if (doc.childCount === 0) return null

  const last = doc.child(doc.childCount - 1)
  const contentEndBottom = view.coordsAtPos(doc.content.size - 1).bottom
  const lastBlockPos = doc.content.size - last.nodeSize
  const nodeDom = view.nodeDOM(lastBlockPos)
  const blockBottom =
    nodeDom instanceof HTMLElement
      ? nodeDom.getBoundingClientRect().bottom
      : contentEndBottom

  return { contentEndBottom, blockBottom, lastType: last.type.name }
}

const focusEndOfDocument = (view: EditorView) => {
  const { state } = view
  const paragraph = state.schema.nodes.paragraph
  let tr = state.tr

  if (state.doc.lastChild?.type.name === "table" && paragraph) {
    tr = tr.insert(state.doc.content.size, paragraph.create())
  }

  const endPos = Math.max(1, tr.doc.content.size - 1)
  tr = tr.setSelection(TextSelection.near(tr.doc.resolve(endPos), -1))
  view.dispatch(tr)
  view.focus()
  return true
}

export const tryFocusBelowEditorContent = (
  view: EditorView,
  event: Pick<MouseEvent, "clientX" | "clientY" | "button">,
): boolean => {
  if (event.button !== 0) return false

  const bounds = getContentBounds(view)
  if (!bounds) return false

  const { contentEndBottom, blockBottom, lastType } = bounds
  const belowLastText = event.clientY > contentEndBottom + 2
  const belowLastBlock = event.clientY > blockBottom + 2

  if ((lastType === "table" && belowLastText) || belowLastBlock) {
    return focusEndOfDocument(view)
  }

  const editorRect = view.dom.getBoundingClientRect()
  const inEditorColumn =
    event.clientX >= editorRect.left && event.clientX <= editorRect.right
  const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })

  if (inEditorColumn && pos === null && event.clientY > contentEndBottom) {
    return focusEndOfDocument(view)
  }

  return false
}

export const ensureTrailingParagraphAfterTablePlugin = new Plugin({
  key: new PluginKey("ensureTrailingParagraphAfterTable"),
  props: {
    handleDOMEvents: {
      mousedown(view, event) {
        return tryFocusBelowEditorContent(view, event)
      },
    },
  },
})
