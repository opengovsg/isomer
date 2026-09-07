import type { Editor as TiptapEditor } from "@tiptap/react"
import { ProseMenuBar } from "~/components/PageEditor/MenuBar/ProseMenuBar"

import { Editor } from "./components"

export const TiptapProseEditor = ({
  editor,
}: {
  editor: TiptapEditor | null
}) => {
  // Deferred: Add a loading state or use suspense
  if (!editor) {
    return null
  }

  return <Editor isNested menubar={ProseMenuBar} editor={editor} />
}
