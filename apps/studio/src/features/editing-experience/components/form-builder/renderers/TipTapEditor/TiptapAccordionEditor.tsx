import { AccordionMenuBar } from "~/components/PageEditor/MenuBar"
import { useAccordionEditor } from "~/features/editing-experience/hooks/useTextEditor"
import { Editor } from "./components"

export function TiptapAccordionEditor({
  editor,
}: {
  editor: ReturnType<typeof useAccordionEditor>
}) {
  // TODO: Add a loading state or use suspense
  if (!editor) return null

  return <Editor menubar={AccordionMenuBar} editor={editor} />
}
