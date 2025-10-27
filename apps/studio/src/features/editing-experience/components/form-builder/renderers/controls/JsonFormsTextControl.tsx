import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl, useToken } from "@chakra-ui/react"
import { isStringControl, rankWith } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
} from "@opengovsg/design-system-react"
import Markdown from "react-markdown"

import { MarkdownLabel } from "~/components/MarkdownLabel"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { getCustomErrorMessage } from "./utils"

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
  const { maxLength } = schema
  const remainingCharacterCount = maxLength
    ? getRemainingCharacterCount(maxLength, data ? String(data) : undefined)
    : -1
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target

    if (value === "") {
      handleChange(path, undefined)
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
          value={String(data || "")}
          onChange={onChange}
          placeholder={label}
          maxLength={maxLength}
          my="0.5rem"
        />
        {maxLength && !errors && (
          <FormHelperText>
            {remainingCharacterCount}{" "}
            {remainingCharacterCount === 1 ? "character" : "characters"} left
          </FormHelperText>
        )}
        <FormErrorMessage>
          {label} {getCustomErrorMessage(errors)}
        </FormErrorMessage>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsTextControl)
