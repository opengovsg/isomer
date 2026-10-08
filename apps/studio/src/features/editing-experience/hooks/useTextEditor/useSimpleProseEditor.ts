import CharacterCount from "@tiptap/extension-character-count"

import { BANNER_MAX_CHARACTERS } from "../../components/constants"
import { type BaseEditorProps } from "./baseEditorTypes"
import { useBaseEditor } from "./useBaseEditor"

// NOTE: The same for now because no extra extensions
export const useSimpleProseEditor = (props: BaseEditorProps) =>
  useBaseEditor({
    ...props,
    extensions: [CharacterCount.configure({ limit: BANNER_MAX_CHARACTERS })],
  })
