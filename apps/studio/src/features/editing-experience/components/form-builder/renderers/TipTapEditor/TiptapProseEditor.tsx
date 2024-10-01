import type { Editor as TiptapEditor } from "@tiptap/react"

import { ProseMenuBar } from "~/components/PageEditor/MenuBar/ProseMenuBar"
import { Editor } from "./components"

export function TiptapProseEditor({ editor }: { editor: TiptapEditor | null }) {
  // TODO: Add a loading state or use suspense
  if (!editor) return null

  return <Editor isNested menubar={ProseMenuBar} editor={editor} />
}
