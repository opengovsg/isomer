import type { Editor, JSONContent } from "@tiptap/react"

export const commitFocusedTableEdit = (
  parentEditor: Editor,
  getPos: () => number | undefined,
  nextDoc: JSONContent | undefined,
) => {
  const pos = getPos()
  if (pos == null || !nextDoc) return

  const current = parentEditor.state.doc.nodeAt(pos)
  if (current?.type.name !== "table") return

  const nextTable = nextDoc.content?.find((node) => node.type === "table")
  if (!nextTable) return

  const nextNode = parentEditor.schema.nodeFromJSON(nextTable)
  if (nextNode.eq(current)) return

  parentEditor.view.dispatch(
    parentEditor.state.tr.replaceWith(pos, pos + current.nodeSize, nextNode),
  )
}
