import type { Editor as TiptapEditor } from "@tiptap/react"
import { ProseMenuBar } from "~/components/PageEditor/MenuBar/ProseMenuBar"

import { Editor } from "./components"

export function TiptapProseEditor({
  editor,
  siteId,
}: {
  editor: TiptapEditor | null
  siteId: number
}) {
  // TODO: Add a loading state or use suspense
  if (!editor) return null

  return (
    <Editor isNested menubar={ProseMenuBar} editor={editor} siteId={siteId} />
  )
}
