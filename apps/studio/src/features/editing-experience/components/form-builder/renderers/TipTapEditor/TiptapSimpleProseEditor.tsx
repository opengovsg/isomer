import { SimpleProseMenuBar } from "~/components/PageEditor/MenuBar"
import { useSimpleProseEditor } from "~/features/editing-experience/hooks/useTextEditor/useTextEditor"
import { Editor } from "./components"

export function TiptapSimpleProseEditor({
  editor,
}: {
  editor: ReturnType<typeof useSimpleProseEditor>
}) {
  // TODO: Add a loading state or use suspense
  if (!editor) return null

  return <Editor isNested menubar={SimpleProseMenuBar} editor={editor} />
}
