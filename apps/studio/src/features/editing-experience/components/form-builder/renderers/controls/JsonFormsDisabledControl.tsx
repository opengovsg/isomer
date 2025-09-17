import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl } from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  FormErrorMessage,
  FormLabel,
  Input,
} from "@opengovsg/design-system-react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { getCustomErrorMessage } from "./utils"

export const jsonFormsDisabledControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.TextControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === "disabled"),
  ),
)

export function JsonFormsDisabledControl({
  data,
  label,
  description,
  required,
  errors,
}: ControlProps) {
  return (
    <Box>
      <FormControl isRequired={required} isInvalid={!!errors}>
        <FormLabel description={description} mb={0}>
          {label}
        </FormLabel>
        <Input
          type="text"
          value={String(data || "")}
          placeholder={label}
          my="0.5rem"
          disabled
        />
        <FormErrorMessage>
          {label} {getCustomErrorMessage(errors)}
        </FormErrorMessage>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsDisabledControl)
