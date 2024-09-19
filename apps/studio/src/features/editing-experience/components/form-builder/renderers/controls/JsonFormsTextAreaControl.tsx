import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl, FormHelperText } from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  FormErrorMessage,
  FormLabel,
  Textarea,
} from "@opengovsg/design-system-react"

import {
  JSON_FORMS_RANKING,
  TEXTAREA_CHARACTERS_PER_ROW,
} from "~/constants/formBuilder"

export const jsonFormsTextAreaControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.TextAreaControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === "textarea"),
  ),
)

const getRemainingCharacterCount = (maxLength: number, data?: string) => {
  if (!data) {
    return maxLength
  }

  return Math.max(0, maxLength - data.length)
}

export function JsonFormsTextAreaControl({
  data,
  label,
  handleChange,
  path,
  description,
  required,
  errors,
  schema,
}: ControlProps) {
  const { maxLength } = schema
  const remainingCharacterCount = maxLength
    ? getRemainingCharacterCount(maxLength, data)
    : -1
  const numOfRows = Math.min(
    5,
    Math.ceil((maxLength || 0) / TEXTAREA_CHARACTERS_PER_ROW),
  )

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target

    if (value === "") {
      handleChange(path, undefined)
    } else {
      handleChange(path, value)
    }
  }

  return (
    <Box mt="1.25rem" _first={{ mt: 0 }}>
      <FormControl isRequired={required} isInvalid={!!errors}>
        <FormLabel description={description}>{label}</FormLabel>
        <Textarea
          value={data || ""}
          onChange={onChange}
          placeholder={label}
          maxLength={maxLength}
          minAutosizeRows={numOfRows}
          maxAutosizeRows={numOfRows}
        />
        {maxLength && !errors && (
          <FormHelperText mt="0.5rem">
            {remainingCharacterCount}{" "}
            {remainingCharacterCount === 1 ? "character" : "characters"} left
          </FormHelperText>
        )}
        <FormErrorMessage>
          {label} {errors}
        </FormErrorMessage>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsTextAreaControl)
