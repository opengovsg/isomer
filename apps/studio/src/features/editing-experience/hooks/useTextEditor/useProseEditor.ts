import { IsomerHeading, PROSE_EXTENSIONS } from "./constants"
import { type BaseEditorProps } from "./types"
import { useBaseEditor } from "./useBaseEditor"

export const useProseEditor = (props: BaseEditorProps) =>
  useBaseEditor({
    ...props,
    extensions: [...PROSE_EXTENSIONS, IsomerHeading],
  })
