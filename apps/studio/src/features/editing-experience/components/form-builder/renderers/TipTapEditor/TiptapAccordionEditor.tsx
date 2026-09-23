import type { useAccordionEditor } from "~/features/editing-experience/hooks/useTextEditor"
import { AccordionMenuBar } from "~/components/PageEditor/MenuBar"

import { Editor } from "./components"

export function TiptapAccordionEditor({
  editor,
  siteId,
}: {
  editor: ReturnType<typeof useAccordionEditor>
  siteId: number
}) {
  // TODO: Add a loading state or use suspense
  if (!editor) return null

  return (
    <Editor
      isNested
      menubar={AccordionMenuBar}
      editor={editor}
      siteId={siteId}
    />
  )
}
