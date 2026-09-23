import type { useCalloutEditor } from "~/features/editing-experience/hooks/useTextEditor"
import { CalloutMenuBar } from "~/components/PageEditor/MenuBar"

import { Editor } from "./components"

export function TiptapCalloutEditor({
  editor,
  siteId,
}: {
  editor: ReturnType<typeof useCalloutEditor>
  siteId: number
}) {
  // TODO: Add a loading state or use suspense
  if (!editor) return null

  return (
    <Editor isNested menubar={CalloutMenuBar} editor={editor} siteId={siteId} />
  )
}
