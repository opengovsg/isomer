import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, Flex, FormControl } from "@chakra-ui/react"
import { rankWith } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel } from "@opengovsg/design-system-react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useCalloutEditor } from "~/features/editing-experience/hooks/useTextEditor"
import { TiptapCalloutEditor } from "../TipTapEditor"

export const jsonFormsCalloutTextControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ProseControl,
  (_, schema) => {
    return schema.format === "callout"
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
  const editor = useCalloutEditor({
    data,
    handleChange: (content) => handleChange(path, content),
  })

  return (
    <Box mt="1.25rem" _first={{ mt: 0 }}>
      <FormControl isRequired={required}>
        <FormLabel description={description}>{label}</FormLabel>
        <TiptapCalloutEditor editor={editor} />
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsCalloutTextControl)
