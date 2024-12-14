import type { ControlProps, RankedTester } from "@jsonforms/core"
import type { ComponentsWithProse } from "@opengovsg/isomer-components"
import { useMemo } from "react"
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
  format: ComponentsWithProse,
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
    case "prose":
      return { EditorHook: useProseEditor, Editor: TiptapProseEditor }
    default:
      const _: never = format
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
  console.log("data", data)
  const { EditorHook, Editor } = useMemo(
    () => getEditorHookAndEditor(schema.format as ComponentsWithProse),
    [schema.format],
  )

  // Uses the required property from the schema (generateProseSchema)
  // to determine if the control is required
  const isRequired: boolean = useMemo(
    () => schema.required?.includes("content") ?? false,
    [schema.required],
  )

  const editor = EditorHook({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    data,
    handleChange: (content) => handleChange(path, content),
    isRequired,
  })

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
