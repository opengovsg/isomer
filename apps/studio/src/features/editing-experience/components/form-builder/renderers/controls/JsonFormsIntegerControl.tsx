import type { ControlProps, RankedTester } from "@jsonforms/core"
import {
  Box,
  FormControl,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInputField,
  NumberInputStepper,
} from "@chakra-ui/react"
import {
  and,
  or,
  rankWith,
  schemaMatches,
  schemaTypeIs,
  uiTypeIs,
} from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  FormErrorMessage,
  FormLabel,
  NumberInput,
} from "@opengovsg/design-system-react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { getCustomErrorMessage } from "./utils"

export const jsonFormsIntegerControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.IntegerControl,
  and(
    uiTypeIs("Control"),
    or(schemaTypeIs("integer"), schemaTypeIs("number")),
    schemaMatches(
      (schema) =>
        (Object.prototype.hasOwnProperty.call(schema, "maximum") ||
          Object.prototype.hasOwnProperty.call(schema, "exclusiveMaximum")) &&
        (Object.prototype.hasOwnProperty.call(schema, "minimum") ||
          Object.prototype.hasOwnProperty.call(schema, "exclusiveMinimum")),
    ),
  ),
)

export function JsonFormsIntegerControl({
  label,
  schema,
  handleChange,
  errors,
  path,
  description,
  required,
}: ControlProps) {
  const {
    exclusiveMaximum,
    exclusiveMinimum,
    maximum,
    minimum,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    default: defaultValue,
  } = schema
  const min = Number(exclusiveMinimum) + 1 || minimum || 0
  const max = Number(exclusiveMaximum) - 1 || maximum || 0

  const onChange = (valueAsString: string, valueAsNumber: number) => {
    if (valueAsString === "") {
      handleChange(path, undefined)
    } else {
      handleChange(path, valueAsNumber)
    }
  }

  return (
    <Box>
      <FormControl isRequired={required} isInvalid={!!errors}>
        <FormLabel description={description}>{label}</FormLabel>
        <NumberInput
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          defaultValue={defaultValue || min}
          min={min}
          max={max}
          onChange={onChange}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <FormErrorMessage>
          {label} {getCustomErrorMessage(errors)}
        </FormErrorMessage>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsIntegerControl)
