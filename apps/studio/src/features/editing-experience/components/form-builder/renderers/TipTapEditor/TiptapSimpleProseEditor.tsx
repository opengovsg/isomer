import { Text } from "@chakra-ui/react"

import { SimpleProseMenuBar } from "~/components/PageEditor/MenuBar"
import { useSimpleProseEditor } from "~/features/editing-experience/hooks/useTextEditor/useTextEditor"
import { Editor } from "./components"

const BANNER_MAX_CHARACTERS = 250

export function TiptapSimpleProseEditor({
  editor,
}: {
  editor: ReturnType<typeof useSimpleProseEditor>
}) {
  // TODO: Add a loading state or use suspense
  if (!editor) return null

  return (
    <>
      <Editor isNested menubar={SimpleProseMenuBar} editor={editor} />
      <Text textStyle="body-2" mt="0.5rem" color="base.content.medium">
        {BANNER_MAX_CHARACTERS - editor.storage.characterCount.characters()}{" "}
        characters left
      </Text>
    </>
  )
}
