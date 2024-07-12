import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl } from "@chakra-ui/react"
import { isStringControl, rankWith } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, Input } from "@opengovsg/design-system-react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsTextControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.TextControl,
  isStringControl,
)

export function JsonFormsTextControl({
  data,
  label,
  handleChange,
  path,
  description,
  required,
}: ControlProps) {
  return (
    <Box py={2}>
      <FormControl isRequired={required}>
        <FormLabel description={description}>{label}</FormLabel>
        <Input
          type="text"
          value={data || ""}
          onChange={(e) => handleChange(path, e.target.value)}
          placeholder={label}
        />
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsTextControl)
