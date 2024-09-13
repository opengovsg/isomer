import type { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"
import { TextMenuBar } from "~/components/PageEditor/MenuBar"
import { Editor } from "./components"

export function TiptapTextEditor({
  editor,
}: {
  editor: ReturnType<typeof useTextEditor>
}) {
  // TODO: Add a loading state or use suspense
  if (!editor) return null

  return <Editor menubar={TextMenuBar} editor={editor} />
}
