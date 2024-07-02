import type { ControlProps, RankedTester } from "@jsonforms/core";
import {
  Box,
  FormControl,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInputField,
  NumberInputStepper,
} from "@chakra-ui/react";
import {
  and,
  or,
  rankWith,
  schemaMatches,
  schemaTypeIs,
  uiTypeIs,
} from "@jsonforms/core";
import { withJsonFormsControlProps } from "@jsonforms/react";
import {
  FormErrorMessage,
  FormLabel,
  NumberInput,
} from "@opengovsg/design-system-react";

import { JSON_FORMS_RANKING } from "~/constants/formBuilder";

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
);

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
    default: defaultValue,
  } = schema;
  const min = Number(exclusiveMinimum) + 1 || minimum || 0;
  const max = Number(exclusiveMaximum) - 1 || maximum || 0;

  return (
    <Box py={2}>
      <FormControl isRequired={required}>
        <FormLabel description={description}>{label}</FormLabel>
        <NumberInput
          defaultValue={defaultValue || min}
          min={min}
          max={max}
          onChange={(e) => handleChange(path, e)}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <FormErrorMessage>{errors}</FormErrorMessage>
      </FormControl>
    </Box>
  );
}

export default withJsonFormsControlProps(JsonFormsIntegerControl);
