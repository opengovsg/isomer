import { Text } from "@chakra-ui/react"
import { CharacterCountStorage } from "@tiptap/extension-character-count"

import { SimpleProseMenuBar } from "~/components/PageEditor/MenuBar"
import { useSimpleProseEditor } from "~/features/editing-experience/hooks/useTextEditor/useTextEditor"
import { BANNER_MAX_CHARACTERS } from "../../../constants"
import { Editor } from "./components"

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
        {BANNER_MAX_CHARACTERS -
          (
            editor.storage.characterCount as CharacterCountStorage
          ).characters()}{" "}
        characters left
      </Text>
    </>
  )
}
