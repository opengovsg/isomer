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

import { useBuilderErrors } from "../../ErrorProvider"
import { getBuilderFieldErrorMessage } from "./utils"

export const jsonFormsTextControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.TextControl,
  isStringControl,
)

const getRemainingCharacterCount = (maxLength: number, data?: string) => {
  if (!data) {
    return maxLength
  }

  return Math.max(0, maxLength - data.length)
}

// NOTE: Typeguard so ts doesn't complain
const isSchemaWithTooltip = (
  schema: ControlProps["schema"],
): schema is ControlProps["schema"] & { tooltip: string } => {
  return (schema as unknown as { tooltip?: string }).tooltip !== undefined
}

const isSchemaWithPlaceholder = (
  schema: ControlProps["schema"],
): schema is ControlProps["schema"] & { placeholder: string } => {
  return (
    (schema as unknown as { placeholder?: string }).placeholder !== undefined
  )
}

export function JsonFormsTextControl({
  data,
  label,
  handleChange,
  path,
  description,
  required,
  errors,
  schema,
  enabled,
}: ControlProps) {
  const { errors: errorsByInstancePath } = useBuilderErrors()
  const errorMessage = getBuilderFieldErrorMessage(
    path,
    errors,
    errorsByInstancePath,
  )
  const { maxLength } = schema
  const remainingCharacterCount = maxLength
    ? getRemainingCharacterCount(maxLength, data ? String(data) : undefined)
    : -1
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target

    // Required strings stay as "" so AJV reports field-level pattern errors
    // (undefined only yields parent "required" errors JsonForms won't map here).
    if (value === "") {
      handleChange(path, required ? "" : undefined)
    } else {
      handleChange(path, value)
    }
  }

  const { tooltip } = isSchemaWithTooltip(schema) ? schema : {}
  const placeholder = isSchemaWithPlaceholder(schema)
    ? schema.placeholder
    : label

  return (
    <Box>
      <FormControl isRequired={required} isInvalid={!!errorMessage}>
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
          value={String(data || "")}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          my="0.5rem"
        />
        {maxLength && !errorMessage && (
          <FormHelperText>
            {remainingCharacterCount}{" "}
            {remainingCharacterCount === 1 ? "character" : "characters"} left
          </FormHelperText>
        )}
        <FormErrorMessage mt={0}>
          {label} {errorMessage}
        </FormErrorMessage>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsTextControl)
