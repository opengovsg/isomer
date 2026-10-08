import { type BaseEditorProps } from "./baseEditorTypes"
import { useBaseEditor } from "./useBaseEditor"
import { IsomerHeading, PROSE_EXTENSIONS } from "./constants"

export const useProseEditor = (props: BaseEditorProps) =>
  useBaseEditor({
    ...props,
    extensions: [...PROSE_EXTENSIONS, IsomerHeading],
  })
