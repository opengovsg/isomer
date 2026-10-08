import { type BaseEditorProps, useBaseEditor } from "./baseEditor"
import { IsomerHeading, PROSE_EXTENSIONS } from "./constants"

export const useProseEditor = (props: BaseEditorProps) =>
  useBaseEditor({
    ...props,
    extensions: [...PROSE_EXTENSIONS, IsomerHeading],
  })
