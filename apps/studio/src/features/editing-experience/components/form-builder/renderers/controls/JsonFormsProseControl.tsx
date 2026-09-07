import type { ControlProps, RankedTester } from "@jsonforms/core"
import type { ComponentsWithProse } from "@opengovsg/isomer-components"
import type {
  BaseEditorProps,
  BaseEditorType,
} from "~/features/editing-experience/hooks/useTextEditor"
import { Box, FormControl } from "@chakra-ui/react"
import { and, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormErrorMessage, FormLabel } from "@opengovsg/design-system-react"
import { useCallback, useEffect, useMemo } from "react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import {
  useAccordionEditor,
  useCalloutEditor,
  useProseEditor,
} from "~/features/editing-experience/hooks/useTextEditor"
import { useSimpleProseEditor } from "~/features/editing-experience/hooks/useTextEditor/useTextEditor"

import { TiptapAccordionEditor } from "../TipTapEditor/TiptapAccordionEditor"
import { TiptapCalloutEditor } from "../TipTapEditor/TiptapCalloutEditor"
import { TiptapProseEditor } from "../TipTapEditor/TiptapProseEditor"
import { TiptapSimpleProseEditor } from "../TipTapEditor/TiptapSimpleProseEditor"
import { getCustomErrorMessage } from "./utils/getCustomErrorMessage"
import { isTiptapEditorEmpty } from "./utils/isTipTapEditorEmpty"

export const jsonFormsProseControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ProseControl,
  and(
    schemaMatches(
      (schema) =>
        schema.format === "prose" ||
        schema.format === "accordion" ||
        schema.format === "callout" ||
        schema.format === "contentpic" ||
        schema.format === "simple-prose",
    ),
  ),
)

interface EditorHookAndEditor {
  EditorHook: (props: BaseEditorProps) => BaseEditorType
  Editor: typeof TiptapProseEditor
}

const getEditorHookAndEditor = (
  format: ComponentsWithProse,
): EditorHookAndEditor => {
  switch (format) {
    case "simple-prose": {
      return {
        EditorHook: useSimpleProseEditor,
        Editor: TiptapSimpleProseEditor,
      }
    }
    case "accordion": {
      return { EditorHook: useAccordionEditor, Editor: TiptapAccordionEditor }
    }
    case "callout": {
      return { EditorHook: useCalloutEditor, Editor: TiptapCalloutEditor }
    }
    case "contentpic": {
      return { EditorHook: useProseEditor, Editor: TiptapProseEditor }
    }
    case "prose": {
      return { EditorHook: useProseEditor, Editor: TiptapProseEditor }
    }
    default: {
      const _: never = format
      return { EditorHook: useProseEditor, Editor: TiptapProseEditor }
    }
  }
}

const JsonFormsProseControl = ({
  data,
  label,
  handleChange,
  path,
  description,
  errors,
  schema,
  required,
}: ControlProps) => {
  const { EditorHook, Editor } = useMemo(
    () =>
      getEditorHookAndEditor(
        // SAFETY: prose control tester only matches known prose component formats
        schema.format as ComponentsWithProse,
      ),
    [schema.format],
  )

  const editor = EditorHook({
    // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment
    data,
    handleChange: useCallback(
      (content) => {
        if (required && isTiptapEditorEmpty(content)) {
          handleChange(path)
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
      if (!selection) {return}
      // oxlint-disable-next-line @typescript-eslint/no-unsafe-argument
      editor.commands.setContent(data, { emitUpdate: false })
      editor.commands.setTextSelection(selection)
    }
  }, [data, editor])

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
