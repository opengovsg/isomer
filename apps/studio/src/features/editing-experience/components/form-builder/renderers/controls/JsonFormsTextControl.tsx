/* oxlint-disable typescript/strict-boolean-expressions, unicorn/no-redundant-type-constituents, unicorn/no-unnecessary-type-conversion, unicorn/no-unsafe-type-assertion -- core cleanup deferred */
import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl } from "@chakra-ui/react"
import { isStringControl, rankWith } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
} from "@opengovsg/design-system-react"
import { MarkdownLabel } from "~/components/MarkdownLabel"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import {
  hasNonEmptyString,
  isDefinedNumber,
  isNullableBooleanTrue,
  isNonEmptyArray,
} from "~/utils/truthiness"

import { getCustomErrorMessage } from "./utils/getCustomErrorMessage"

export const jsonFormsTextControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.TextControl,
  isStringControl,
)

const getRemainingCharacterCount = (maxLength: number, data?: string) => {
  if (!hasNonEmptyString(data)) {
    return maxLength
  }

  return Math.max(0, maxLength - data.length)
}

const isSchemaWithTooltip = (
  schema: ControlProps["schema"],
): schema is ControlProps["schema"] & { tooltip: string } => {
  if (schema === undefined || !("tooltip" in schema)) {
    return false
  }
  // SAFETY: JSON Forms control narrows schema/data to the expected editor shape
  const { tooltip } = schema as { tooltip?: unknown }
  return Object.prototype.toString.call(tooltip) === "[object String]"
}

export const JsonFormsTextControl = ({
  data,
  label,
  handleChange,
  path,
  description,
  required,
  errors,
  schema,
  enabled,
}: ControlProps) => {
  const { maxLength } = schema
  const remainingCharacterCount = isDefinedNumber(maxLength)
    ? getRemainingCharacterCount(
        maxLength,
        hasNonEmptyString(data) ? String(data) : undefined,
      )
    : -1
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target

    if (value === "") {
      handleChange(path)
    } else {
      handleChange(path, value)
    }
  }

  const { tooltip } = isSchemaWithTooltip(schema) ? schema : {}

  return (
    <Box>
      <FormControl isRequired={required} isInvalid={!!errors}>
        <FormLabel
          description={<MarkdownLabel description={description} />}
          mb={0}
          tooltipText={tooltip}
        >
          {label}
        </FormLabel>
        <Input
          isDisabled={!enabled}
          type="text"
          value={hasNonEmptyString(data) ? String(data) : ""}
          onChange={onChange}
          placeholder={label}
          maxLength={maxLength}
          my="0.5rem"
        />
        {isDefinedNumber(maxLength) && !errors && (
          <FormHelperText>
            {remainingCharacterCount}{" "}
            {remainingCharacterCount === 1 ? "character" : "characters"} left
          </FormHelperText>
        )}
        <FormErrorMessage mt={0}>
          {label} {getCustomErrorMessage(errors)}
        </FormErrorMessage>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsTextControl)
