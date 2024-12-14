import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl } from "@chakra-ui/react"
import { rankWith } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel } from "@opengovsg/design-system-react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useAccordionEditor } from "~/features/editing-experience/hooks/useTextEditor"
import { TiptapAccordionEditor } from "../TipTapEditor"

export const jsonFormsAccordionTextControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ProseControl,
  (_, schema) => {
    return schema.format === "accordion"
  },
)

export function JsonFormsAccordionTextControl({
  data,
  label,
  handleChange,
  path,
  description,
  schema,
}: ControlProps) {
  const editor = useAccordionEditor({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    data,
    handleChange: (content) => handleChange(path, content),
  })

  // Uses the required property from the schema (AccordionProseSchema)
  // to determine if the control is required
  const isRequired = schema.required?.includes("content")

  return (
    <Box>
      <FormControl isRequired={isRequired}>
        <FormLabel description={description}>{label}</FormLabel>
        <TiptapAccordionEditor editor={editor} />
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsAccordionTextControl)
