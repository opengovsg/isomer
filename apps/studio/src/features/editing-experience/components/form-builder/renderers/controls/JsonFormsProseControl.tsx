import type { ControlProps, RankedTester } from "@jsonforms/core"
import type { ComponentsWithProse } from "@opengovsg/isomer-components"
import { useCallback, useEffect, useMemo } from "react"
import { Box, FormControl } from "@chakra-ui/react"
import { and, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormErrorMessage, FormLabel } from "@opengovsg/design-system-react"

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
import { getCustomErrorMessage, isTiptapEditorEmpty } from "./utils"

export const jsonFormsProseControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ProseControl,
  and(
    schemaMatches(
      (schema) =>
        schema.format === "prose" ||
        schema.format === "accordion" ||
        schema.format === "callout" ||
        schema.format === "contentpic",
    ),
  ),
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
  errors,
  schema,
  required,
}: ControlProps) {
  const { EditorHook, Editor } = useMemo(
    () => getEditorHookAndEditor(schema.format as ComponentsWithProse),
    [schema.format],
  )

  const editor = EditorHook({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    data,
    handleChange: useCallback(
      (content) => {
        if (required && isTiptapEditorEmpty(content)) {
          handleChange(path, undefined)
        } else {
          handleChange(path, content)
        }
      },
      [handleChange, path, required],
    ),
  })

  // Trigger editor.setContent when data changes from undefined to something
  // Needed to force the value to be set when user clicks on "Go back to editing" in the exit modal
  useEffect(() => {
    if (data !== undefined) {
      const selection = editor?.state.selection
      if (!selection) return
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      editor.commands.setContent(data)
      editor.commands.setTextSelection(selection)
    }
  }, [data])

  return (
    <Box>
      <FormControl isRequired={required} isInvalid={!!errors}>
        <FormLabel description={description}>{label}</FormLabel>
        <Editor editor={editor} />
        <FormErrorMessage>
          {label} {getCustomErrorMessage(errors)}
        </FormErrorMessage>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsProseControl)
