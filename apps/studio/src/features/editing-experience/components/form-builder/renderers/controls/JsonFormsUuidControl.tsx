import { useMemo } from "react"
import { Box, FormControl } from "@chakra-ui/react"
import {
  ControlProps,
  RankedTester,
  rankWith,
  schemaMatches,
} from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, Input } from "@opengovsg/design-system-react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsUuidControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.UuidControl,
  schemaMatches((schema) => schema.format === "uuid"),
)

export const JsonFormsUuidControl = ({
  data,
  label,
  handleChange,
  path,
  description,
  required,
  errors,
}: ControlProps) => {
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target

    if (value === "") {
      handleChange(path, undefined)
    } else {
      handleChange(path, value)
    }
  }

  const uuid = useMemo(() => data || crypto.randomUUID(), [path])

  return (
    <Box>
      <FormControl isRequired={required} isInvalid={!!errors}>
        <FormLabel description={description} mb={0}>
          {label}
        </FormLabel>
        <Input
          disabled
          type="text"
          value={String(data || uuid)}
          onChange={onChange}
          placeholder={label}
          my="0.5rem"
        />
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsUuidControl)
