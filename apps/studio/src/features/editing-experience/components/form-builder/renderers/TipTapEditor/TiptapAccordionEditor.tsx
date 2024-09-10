import { AccordionMenuBar } from "~/components/PageEditor/MenuBar"
import { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"
import { EditorContainer, EditorContentWrapper } from "./components"

export function TiptapAccordionEditor({
  editor,
}: {
  editor: ReturnType<typeof useTextEditor>
}) {
  // TODO: Add a loading state or use suspense
  if (!editor) return null

  return (
    <EditorContainer>
      <AccordionMenuBar editor={editor} />
      <EditorContentWrapper
        editor={editor}
        onClick={() => editor.chain().focus().run()}
      />
    </EditorContainer>
  )
}
