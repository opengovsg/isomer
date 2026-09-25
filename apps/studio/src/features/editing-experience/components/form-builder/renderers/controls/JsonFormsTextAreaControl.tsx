import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl } from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Textarea,
} from "@opengovsg/design-system-react"
import {
  JSON_FORMS_RANKING,
  TEXTAREA_CHARACTERS_PER_ROW,
  TEXTAREA_DEFAULT_ROWS,
  TEXTAREA_MAX_ROWS,
} from "~/constants/formBuilder"

import { useBuilderErrors } from "../../ErrorProvider"
import { getBuilderFieldErrorMessage } from "./utils"

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

function JsonFormsTextAreaControl({
  data,
  label,
  handleChange,
  path,
  description,
  required,
  errors,
  schema,
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
  const numOfRows = maxLength
    ? Math.min(
        TEXTAREA_MAX_ROWS,
        Math.ceil(maxLength / TEXTAREA_CHARACTERS_PER_ROW),
      )
    : TEXTAREA_DEFAULT_ROWS

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target

    if (value === "") {
      handleChange(path, required ? "" : undefined)
    } else {
      handleChange(path, value)
    }
  }

  return (
    <Box>
      <FormControl isRequired={required} isInvalid={!!errorMessage}>
        <FormLabel description={description} mb={0}>
          {label}
        </FormLabel>
        <Textarea
          value={String(data || "")}
          onChange={onChange}
          placeholder={label}
          maxLength={maxLength}
          minAutosizeRows={numOfRows}
          maxAutosizeRows={numOfRows}
          my="0.5rem"
        />
        {maxLength && !errorMessage && (
          <FormHelperText>
            {remainingCharacterCount}{" "}
            {remainingCharacterCount === 1 ? "character" : "characters"} left
          </FormHelperText>
        )}
        <FormErrorMessage>
          {label} {errorMessage}
        </FormErrorMessage>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsTextAreaControl)
