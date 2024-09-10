import { CalloutMenuBar } from "~/components/PageEditor/MenuBar"
import { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"
import { Editor } from "./components"

export function TiptapCalloutEditor({
  editor,
}: {
  editor: ReturnType<typeof useTextEditor>
}) {
  // TODO: Add a loading state or use suspense
  if (!editor) return null

  return <Editor menubar={CalloutMenuBar} editor={editor} />
}
