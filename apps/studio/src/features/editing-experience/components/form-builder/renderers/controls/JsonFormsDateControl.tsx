import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl } from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  DatePicker,
  FormErrorMessage,
  FormLabel,
} from "@opengovsg/design-system-react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsDateControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.TextControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === "date"),
  ),
)

export function JsonFormsDateControl({
  data,
  label,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  handleChange,
  path,
  description,
  required,
  errors,
}: ControlProps) {
  return (
    <Box mt="1.25rem" _first={{ mt: 0 }}>
      <FormControl isRequired={required} isInvalid={!!errors}>
        <FormLabel description={description}>{label}</FormLabel>
        <DatePicker
          inputValue={!!data ? String(data) : undefined}
          allowManualInput={false}
          onInputValueChange={(date) => handleChange(path, date.toString())}
        />
        <FormErrorMessage>
          {label} {errors}
        </FormErrorMessage>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsDateControl)
