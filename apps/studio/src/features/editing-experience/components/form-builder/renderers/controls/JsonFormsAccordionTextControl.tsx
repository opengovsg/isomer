import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Flex, FormControl } from "@chakra-ui/react"
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

export function JsonFormsCalloutTextControl({
  data,
  label,
  handleChange,
  path,
  description,
  required,
}: ControlProps) {
  const editor = useAccordionEditor({
    data,
    handleChange: (content) => handleChange(path, content),
  })

  return (
    <Flex py={2}>
      <FormControl isRequired={required}>
        <FormLabel description={description}>{label}</FormLabel>
        <TiptapAccordionEditor editor={editor} />
      </FormControl>
    </Flex>
  )
}

export default withJsonFormsControlProps(JsonFormsCalloutTextControl)
