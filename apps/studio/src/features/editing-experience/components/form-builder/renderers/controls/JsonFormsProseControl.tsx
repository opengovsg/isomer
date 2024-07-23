import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl } from "@chakra-ui/react"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, Textarea } from "@opengovsg/design-system-react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsProseControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ProseControl,
  schemaMatches((_, schema) => {
    return schema.format === "prose"
  }),
)

// TODO: Replace this with the Tiptap editor
export function JsonFormsProseControl({
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
        <Textarea
          value={data || ""}
          onChange={(e) => handleChange(path, e.target.value)}
          placeholder={label}
        />
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsProseControl)
