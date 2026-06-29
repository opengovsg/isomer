import type { Editor } from "@tiptap/react"

type ProseMirrorDoc = Editor["state"]["doc"]

/**
 * Resolves the text used to prefill the link editor's "Link text" field.
 *
 * When the user has highlighted a specific range we always use exactly that
 * text — even inside an existing link — so editing e.g. the word "here" within
 * a longer hyperlink shows "here" rather than the whole linked sentence. Only
 * when there is no selection (the cursor is merely placed inside a link) do we
 * fall back to the full text of the link.
 */
export const getLinkTextFromSelection = ({
  isLinkActive,
  selection,
  doc,
}: {
  isLinkActive: boolean
  selection: { from: number; to: number }
  doc: ProseMirrorDoc
}): string => {
  const { from, to } = selection
  const hasSelection = from !== to

  if (isLinkActive && !hasSelection) {
    return doc.nodeAt(Math.max(1, from - 1))?.textContent ?? ""
  }

  return doc.textBetween(from, to, " ")
}
