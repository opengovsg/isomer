import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl } from "@chakra-ui/react"
import { rankWith } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel } from "@opengovsg/design-system-react"

import type {
  BaseEditorProps,
  BaseEditorType,
} from "~/features/editing-experience/hooks/useTextEditor"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import {
  useAccordionEditor,
  useCalloutEditor,
  useProseEditor,
} from "~/features/editing-experience/hooks/useTextEditor"
import {
  TiptapAccordionEditor,
  TiptapCalloutEditor,
  TiptapProseEditor,
} from "../TipTapEditor"

export const jsonFormsProseControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ProseControl,
  (_, schema) => {
    return (
      schema.format === "prose" ||
      schema.format === "accordion" ||
      schema.format === "callout" ||
      schema.format === "contentpic"
    )
  },
)

const getEditorHookAndEditor = (
  format: string,
): {
  EditorHook: (props: BaseEditorProps) => BaseEditorType
  Editor: typeof TiptapProseEditor
} => {
  switch (format) {
    case "accordion":
      return { EditorHook: useAccordionEditor, Editor: TiptapAccordionEditor }
    case "callout":
      return { EditorHook: useCalloutEditor, Editor: TiptapCalloutEditor }
    case "contentpic":
      return { EditorHook: useProseEditor, Editor: TiptapProseEditor }
    default:
      return { EditorHook: useProseEditor, Editor: TiptapProseEditor }
  }
}

export function JsonFormsProseControl({
  data,
  label,
  handleChange,
  path,
  description,
  schema,
}: ControlProps) {
  const { EditorHook, Editor } = getEditorHookAndEditor(
    schema.format ?? "prose",
  )

  const editor = EditorHook({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    data,
    handleChange: (content) => handleChange(path, content),
  })

  // Uses the required property from the schema (generateProseSchema)
  // to determine if the control is required
  const isRequired = schema.required?.includes("content")

  return (
    <Box>
      <FormControl isRequired={isRequired}>
        <FormLabel description={description}>{label}</FormLabel>
        <Editor editor={editor} />
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsProseControl)
